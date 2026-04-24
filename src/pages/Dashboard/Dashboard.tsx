import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Filter, RefreshCcw, Eye, EyeOff, Check, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { CustomDropdown } from '../../components/ui/CustomDropdown/CustomDropdown';
import { DashboardService } from '../../services/DashboardService';
import { StorageService, KEYS } from '../../services/StorageService';
import { Transaction, DashboardSummary } from '../../types';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { setIsSidebarVisible } = useOutletContext<{ setIsSidebarVisible: (v: boolean) => void }>();
  
  // States
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString());
  const [filters, setFilters] = useState({
    meses: [String(new Date().getMonth() + 1).padStart(2, '0')],
    categoria: [] as string[],
    formaPagamento: [] as string[],
    cartao: [] as string[],
    status: [] as string[]
  });
  
  const [allData, setAllData] = useState<any>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [showSecondaryStatsMobile, setShowSecondaryStatsMobile] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const data = await DashboardService.getAllData();
      setAllData(data);
    };
    fetchData();
  }, []);

  // Update summary when data or period filters change
  useEffect(() => {
    const updateSummary = async () => {
      if (!allData) return;
      setLoading(true);
      const selectedMonthsPaths = filters.meses.map(m => `${currentYear}-${m}`);
      const res = await DashboardService.getMonthlySummary(selectedMonthsPaths, allData);
      setSummary(res);
      setLoading(false);
    };
    updateSummary();
  }, [allData, currentYear, filters.meses]);

  // Derived Values
  const availableYears = useMemo(() => {
    if (!allData) return [new Date().getFullYear().toString()];
    const yearsSet = new Set<string>();
    yearsSet.add(new Date().getFullYear().toString());

    allData.avulsas.forEach((a: any) => {
      if (a.data) yearsSet.add(a.data.split('-')[0]);
    });
    
    allData.parceladas.forEach((p: any) => {
      if (!p.data) return;
      const [pYear, pMonth] = p.data.split('-').map(Number);
      const totalParcelas = Number(p.parcelas);
      const endDate = new Date(pYear, (pMonth - 1) + totalParcelas, 1);
      
      for (let y = pYear; y <= endDate.getFullYear(); y++) {
        yearsSet.add(String(y));
      }
    });

    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [allData]);

  const availableMonths = useMemo(() => {
    if (!allData) return [];
    const monthsSet = new Set<string>();
    
    // 1. Avulsas
    allData.avulsas.forEach((a: any) => {
      if (!a.data) return;
      const [year, month] = a.data.split('-');
      if (year === currentYear) monthsSet.add(month);
    });

    // 2. Fixas (sempre mostram no mês atual se o ano for o atual)
    const now = new Date();
    const nowYear = now.getFullYear().toString();
    const nowMonth = String(now.getMonth() + 1).padStart(2, '0');
    if (allData.fixas.length > 0 && currentYear === nowYear) {
      monthsSet.add(nowMonth);
    }

    // 3. Parceladas
    allData.parceladas.forEach((p: any) => {
      if (!p.data) return;
      const [pYear, pMonth] = p.data.split('-').map(Number);
      const totalParcelas = Number(p.parcelas);
      
      // Itera em cada parcela (começando no mês seguinte à compra)
      for (let i = 1; i <= totalParcelas; i++) {
        const d = new Date(pYear, (pMonth - 1) + i, 1);
        if (d.getFullYear().toString() === currentYear) {
          monthsSet.add(String(d.getMonth() + 1).padStart(2, '0'));
        }
      }
    });

    return Array.from(monthsSet).sort((a, b) => Number(a) - Number(b));
  }, [allData, currentYear]);

  const filterOptions = useMemo(() => {
    if (!summary) return { categories: [], payments: [], cards: [], statuses: ['PAGO', 'PENDENTE'] };
    const lancamentos = summary.lancamentos;
    return {
      categories: [...new Set(lancamentos.map(l => l.categoria).filter(Boolean))].sort().map(c => ({ id: c!, label: c! })),
      payments: [...new Set(lancamentos.map(l => l.formaPagamento).filter(Boolean))].sort().map(p => ({ id: p!, label: p! })),
      cards: [...new Set(lancamentos.map(l => l.cartao).filter(Boolean))].sort().map(c => ({ id: c!, label: c! })),
      statuses: [{ id: 'PAGO', label: 'Pago' }, { id: 'PENDENTE', label: 'Pendente' }]
    };
  }, [summary]);

  const filteredLancamentos = useMemo(() => {
    if (!summary) return [];
    return summary.lancamentos.filter(l => {
      if (filters.categoria.length > 0 && !filters.categoria.includes(l.categoria!)) return false;
      if (filters.formaPagamento.length > 0 && !filters.formaPagamento.includes(l.formaPagamento!)) return false;
      if (filters.cartao.length > 0 && !filters.cartao.includes(l.cartao!)) return false;
      if (filters.status.length > 0) {
        const norm = (l.status || 'PENDENTE') === 'PAGO' ? 'PAGO' : 'PENDENTE';
        if (!filters.status.includes(norm)) return false;
      }
      return true;
    });
  }, [summary, filters]);

  const handleToggleStatus = async (item: Transaction) => {
    const isPago = item.status === 'PAGO';
    const newStatus = isPago ? 'PENDENTE' : 'PAGO';
    
    // Determine target collection
    let key = '';
    let updatedItem = { ...item, status: newStatus };

    if (item.tipo === 'fixa') key = KEYS.DIVIDAS_FIXAS;
    else if (item.tipo === 'parcelada') {
      key = KEYS.DIVIDAS_PARCELADAS;
      // Para parceladas, o Dashboard exibe um status virtual.
      // Clicar em "Pagar" incrementa a parcelaAtual global.
      // Clicar em "Estornar" decrementa a parcelaAtual global.
      if (newStatus === 'PAGO' && !isPago) {
        updatedItem.parcelaAtual = (item.parcelaAtual || 0) + 1;
        if (updatedItem.parcelaAtual >= (item.parcelas || 0)) {
          updatedItem.status = 'FINALIZADO';
        } else {
          updatedItem.status = 'ATIVO';
        }
      } else if (newStatus === 'PENDENTE' && isPago) {
        updatedItem.parcelaAtual = Math.max(0, (item.parcelaAtual || 0) - 1);
        updatedItem.status = 'ATIVO';
      }
    }
    else if (item.tipo === 'avulsa') key = KEYS.COMPRAS_AVULSAS;

    // Atualização Otimista aprimorada
    if (allData) {
      const updatedData = { ...allData };
      const listKey = item.tipo === 'fixa' ? 'fixas' : item.tipo === 'parcelada' ? 'parceladas' : 'avulsas';
      updatedData[listKey] = updatedData[listKey].map((i: any) => 
        i.id === item.id ? { ...i, ...updatedItem } : i
      );
      setAllData(updatedData);
    }

    try {
      await StorageService.update(key, updatedItem);
      
      // Sincronização em segundo plano
      const data = await DashboardService.getAllData();
      setAllData(data);
    } catch (e) {
      console.error("Erro ao atualizar status:", e);
      // Reverte o estado em caso de erro
      const data = await DashboardService.getAllData();
      setAllData(data);
    }
  };

  const getMonthName = (m: string) => {
    const date = new Date(2000, parseInt(m) - 1);
    const name = date.toLocaleString('pt-BR', { month: 'long' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  if (loading && !summary) return <div className="loading-screen">Carregando Dashboard...</div>;

  return (
    <div className="dashboard-page">
      <PageHeader 
        breadcrumb="Visão Geral" 
        current="Mensal" 
        onMenuClick={() => setIsSidebarVisible(true)} 
      />

      <div className="content-padding">
        <div className="mobile-controls">
          <button className="btn btn-primary btn-expand" onClick={() => setShowFiltersMobile(!showFiltersMobile)}>
            <Filter size={16} />
            Filtros
          </button>
        </div>

        <div className={`filter-bar ${showFiltersMobile ? 'active' : ''}`}>
          <CustomDropdown 
            label="Ano" 
            options={availableYears.map(y => ({ id: y, label: y }))} 
            selectedValues={[currentYear]} 
            onChange={(vals) => setCurrentYear(vals[0])}
          />
          <CustomDropdown 
            label="Mês" 
            isMulti 
            options={availableMonths.map(m => ({ id: m, label: getMonthName(m) }))} 
            selectedValues={filters.meses} 
            onChange={(vals) => setFilters(prev => ({ ...prev, meses: vals }))}
          />
          <CustomDropdown 
            label="Categoria" 
            isMulti 
            options={filterOptions.categories} 
            selectedValues={filters.categoria} 
            onChange={(vals) => setFilters(prev => ({ ...prev, categoria: vals }))}
          />
          <CustomDropdown 
            label="Forma Pagamento" 
            isMulti 
            options={filterOptions.payments} 
            selectedValues={filters.formaPagamento} 
            onChange={(vals) => setFilters(prev => ({ ...prev, formaPagamento: vals }))}
          />
          <CustomDropdown 
            label="Cartão" 
            isMulti 
            options={filterOptions.cards} 
            selectedValues={filters.cartao} 
            onChange={(vals) => setFilters(prev => ({ ...prev, cartao: vals }))}
          />
          <CustomDropdown 
            label="Status" 
            isMulti 
            options={filterOptions.statuses} 
            selectedValues={filters.status} 
            onChange={(vals) => setFilters(prev => ({ ...prev, status: vals }))}
          />
          <button 
            className="btn-reset-filters" 
            onClick={() => setFilters({ meses: [String(new Date().getMonth() + 1).padStart(2, '0')], categoria: [], formaPagamento: [], cartao: [], status: [] })}
          >
            <RefreshCcw size={14} />
            Limpar Filtros
          </button>
        </div>

        <div className="grid-stats">
          <div className="card main-stat-card">
            <p className="card-title">Gasto Total</p>
            <p className="card-value">R$ {summary?.totalGeral.toFixed(2)}</p>
            <button className="mobile-only btn-toggle-stats" onClick={() => setShowSecondaryStatsMobile(!showSecondaryStatsMobile)}>
              {showSecondaryStatsMobile ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className={`secondary-stats-group ${showSecondaryStatsMobile ? 'active' : ''}`}>
            <div className="card">
              <p className="card-title">Dívidas Fixas</p>
              <p className="card-value color-primary">R$ {summary?.totalFixas.toFixed(2)}</p>
              <div className="progress-container">
                <div className="progress-bar bg-primary" style={{ width: `${Math.min((summary!.totalFixas / summary!.totalGeral) * 100 || 0, 100)}%` }}></div>
              </div>
            </div>

            <div className="card">
              <p className="card-title">Parcelamentos</p>
              <p className="card-value color-warning">R$ {summary?.totalParceladas.toFixed(2)}</p>
              <div className="progress-container">
                <div className="progress-bar bg-warning" style={{ width: `${Math.min((summary!.totalParceladas / summary!.totalGeral) * 100 || 0, 100)}%` }}></div>
              </div>
            </div>

            <div className="card">
              <p className="card-title">Avulsas</p>
              <p className="card-value color-success">R$ {summary?.totalAvulsas.toFixed(2)}</p>
              <div className="progress-container">
                <div className="progress-bar bg-success" style={{ width: `${Math.min((summary!.totalAvulsas / summary!.totalGeral) * 100 || 0, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <section className="table-container">
          <div className="table-header">Transações do Período</div>
          
          <div className="desktop-only">
            <table>
              <thead>
                <tr>
                  <th>Ano</th>
                  <th>Mês</th>
                  <th>Descrição</th>
                  <th className="text-right">Valor</th>
                  <th>Categoria</th>
                  <th>Pagamento</th>
                  <th>Cartão</th>
                  <th>Parcela</th>
                  <th>Status</th>
                  <th className="text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredLancamentos.map((l) => {
                  const uniqueKey = `${l.id}-${l.dataRef || l.data}`;
                  const [year, mNum] = (l.data ? l.data.split('-') : (l.dataRef || '0000-00').split('-'));
                  const isPago = l.status === 'PAGO';
                  return (
                    <tr key={uniqueKey} className={isPago ? 'row-pago' : ''}>
                      <td>{year}</td>
                      <td>{getMonthName(mNum)}</td>
                      <td className="font-bold">{l.descricao}</td>
                      <td className="text-right font-bold">R$ {Number(l.valorMensal || l.valor).toFixed(2)}</td>
                      <td>{l.categoria || '-'}</td>
                      <td>{l.formaPagamento || '-'}</td>
                      <td>{l.cartao || '-'}</td>
                      <td>{l.parcelaVirtual ? `${l.parcelaVirtual}/${l.parcelas}` : l.parcelaAtual ? `${l.parcelaAtual}/${l.parcelas}` : '-'}</td>
                      <td>
                        <span className={`status-indicator ${isPago ? 'status-pago' : 'status-pendente'}`}>
                          {isPago ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                      <td className="text-right">
                        <button 
                          className={`btn ${isPago ? 'btn-ghost' : 'btn-success'}`}
                          onClick={() => handleToggleStatus(l)}
                        >
                          {isPago ? <RotateCcw size={16} /> : <Check size={16} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mobile-list">
            {filteredLancamentos.map((l) => {
              const uniqueKey = `${l.id}-${l.dataRef || l.data}`;
              const isPago = l.status === 'PAGO';
              const [year, mNum] = (l.data ? l.data.split('-') : (l.dataRef || '0000-00').split('-'));
              const isExpanded = expandedCards[uniqueKey];
              return (
                <div key={uniqueKey} className={`transaction-card ${isPago ? 'row-pago' : ''}`}>
                  <div className="card-main-info">
                    <div className="info-left">
                      <p className="info-desc">{l.descricao}</p>
                      <p className="info-val">R$ {Number(l.valorMensal || l.valor).toFixed(2)}</p>
                    </div>
                    <div className="info-right">
                      <span className={`status-indicator ${isPago ? 'status-pago' : 'status-pendente'}`}>
                        {isPago ? 'Pago' : 'Pendente'}
                      </span>
                      <div className="card-actions">
                        <button className="btn btn-ghost" onClick={() => setExpandedCards(prev => ({ ...prev, [uniqueKey]: !isExpanded }))}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <button className={`btn ${isPago ? 'btn-ghost' : 'btn-success'}`} onClick={() => handleToggleStatus(l)}>
                          {isPago ? <RotateCcw size={16} /> : <Check size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="card-details-expanded">
                      <div className="detail-row">
                        <span className="detail-label">Data</span>
                        <span className="detail-val">{getMonthName(mNum)}/{year}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Categoria</span>
                        <span className="detail-val">{l.categoria || '-'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Pagamento</span>
                        <span className="detail-val">{l.formaPagamento || '-'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Cartão</span>
                        <span className="detail-val">{l.cartao || '-'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Parcela</span>
                        <span className="detail-val">{l.parcelaVirtual ? `${l.parcelaVirtual}/${l.parcelas}` : l.parcelaAtual ? `${l.parcelaAtual}/${l.parcelas}` : 'À vista'}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
