import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Trash2, Edit3, AlertTriangle, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Modal } from '../../components/ui/Modal/Modal';
import { CustomDropdown } from '../../components/ui/CustomDropdown/CustomDropdown';
import { StorageService, KEYS } from '../../services/StorageService';
import { useAuth } from '../../contexts/AuthContext';
import { InstallmentDebt, Category, Card as CardType } from '../../types';
import './Installments.css';

export const Installments: React.FC = () => {
  const { user } = useAuth();
  const { setIsSidebarVisible } = useOutletContext<{ setIsSidebarVisible: (v: boolean) => void }>();
  const [items, setItems] = useState<InstallmentDebt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<InstallmentDebt | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCard = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [formData, setFormData] = useState({
    descricao: '',
    custoTotal: '',
    parcelas: '',
    categoria: '',
    formaPagamento: 'Crédito',
    cartao: '',
    data: new Date().toISOString().split('T')[0]
  });

  const getFinalDate = (startDate: string, installments: number) => {
    if (!startDate) return '-';
    const [year, month, day] = startDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setMonth(date.getMonth() + installments);
    return date.toLocaleDateString('pt-BR');
  };

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    
    const unsubItems = StorageService.subscribe(KEYS.DIVIDAS_PARCELADAS, (data) => {
      setItems(data);
      setLoading(false);
    });

    const unsubCats = StorageService.subscribe(KEYS.CATEGORIAS, (data) => {
      setCategories(data);
    });

    const unsubCards = StorageService.subscribe(KEYS.CARTOES, (data) => {
      setCards(data);
    });

    return () => {
      unsubItems();
      unsubCats();
      unsubCards();
    };
  }, [user]);

  const handleOpenModal = (item: InstallmentDebt | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        descricao: item.descricao,
        custoTotal: String(item.custoTotal),
        parcelas: String(item.parcelas),
        categoria: item.categoria || '',
        formaPagamento: item.formaPagamento || 'Crédito',
        cartao: item.cartao || '',
        data: item.data || new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingItem(null);
      setFormData({
        descricao: '',
        custoTotal: '',
        parcelas: '',
        categoria: '',
        formaPagamento: 'Crédito',
        cartao: '',
        data: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const custoTotal = Number(formData.custoTotal);
    const parcelas = Number(formData.parcelas);
    const valorMensal = (custoTotal / parcelas).toFixed(2);

    const data: any = {
      descricao: formData.descricao,
      custoTotal,
      parcelas,
      categoria: formData.categoria,
      formaPagamento: formData.formaPagamento,
      cartao: formData.cartao,
      data: formData.data,
      valorMensal,
      status: editingItem?.status || 'ATIVO',
      parcelaAtual: editingItem?.parcelaAtual ?? 0,
      updatedAt: Date.now()
    };

    if (editingItem) {
      await StorageService.update(KEYS.DIVIDAS_PARCELADAS, { ...editingItem, ...data });
    } else {
      await StorageService.add(KEYS.DIVIDAS_PARCELADAS, { 
        id: crypto.randomUUID(), 
        ...data,
        createdAt: Date.now() 
      });
    }

    setIsModalOpen(false);
  };

  const handleIncrement = async (item: InstallmentDebt) => {
    const nextParcela = Number(item.parcelaAtual) + 1;
    const isFinished = nextParcela >= item.parcelas!;
    
    await StorageService.update(KEYS.DIVIDAS_PARCELADAS, {
      ...item,
      parcelaAtual: isFinished ? item.parcelas : nextParcela,
      status: isFinished ? 'FINALIZADO' : 'ATIVO'
    });
  };

  const handleDelete = async () => {
    if (idToDelete) {
      await StorageService.remove(KEYS.DIVIDAS_PARCELADAS, idToDelete);
      setIsConfirmOpen(false);
      setIdToDelete(null);
    }
  };

  return (
    <div className="installments-page">
      <PageHeader 
        breadcrumb="Gestão" 
        current="Parcelamentos" 
        onMenuClick={() => setIsSidebarVisible(true)}
        actions={
          <button className="btn btn-primary desktop-only" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Novo Parcelamento
          </button>
        }
      />

      <div className="content-padding">
        <button className="btn btn-primary mobile-fab mobile-only" onClick={() => handleOpenModal()}>
          <Plus size={28} />
        </button>

        {loading ? (
          <div className="loading">Carregando parcelamentos...</div>
        ) : (
          <>
            {/* Desktop View: Table */}
            <section className="table-container desktop-only">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Pagamento</th>
                    <th>Cartão</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Mensal</th>
                    <th className="text-right">Parcelas</th>
                    <th>Finaliza em</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className={item.status === 'FINALIZADO' ? 'row-pago' : ''}>
                      <td>{item.data ? new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                      <td className="font-bold">{item.descricao}</td>
                      <td>{item.categoria || '-'}</td>
                      <td>{item.formaPagamento || '-'}</td>
                      <td>{item.cartao || '-'}</td>
                      <td className="text-right">R$ {Number(item.custoTotal).toFixed(2)}</td>
                      <td className="text-right font-bold">R$ {Number(item.valorMensal).toFixed(2)}</td>
                      <td className="text-right">
                        {item.parcelaAtual}/{item.parcelas}
                      </td>
                      <td>{getFinalDate(item.data!, item.parcelas!)}</td>
                      <td className="text-right">
                        <div className="actions-cell">
                          <button className="btn btn-ghost color-primary" onClick={() => handleOpenModal(item)}>
                            <Edit3 size={18} />
                          </button>
                          <button className="btn btn-danger" onClick={() => { setIdToDelete(item.id); setIsConfirmOpen(true); }}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Mobile View: Cards */}
            <div className="mobile-only grid-stats">
              {items.length > 0 ? items.map(item => {
                const isExpanded = expandedCards[item.id];
                return (
                  <div key={item.id} className={`card installment-card ${item.status === 'FINALIZADO' ? 'card-finalizado' : ''}`}>
                    <div className="card-header-row" onClick={() => toggleCard(item.id)}>
                      <div className="card-header-main">
                        <h4 className="item-desc">{item.descricao}</h4>
                        <p className="item-status">
                          {item.parcelaAtual}/{item.parcelas} parcelas {item.status}
                        </p>
                      </div>
                      <div className="card-header-side">
                        <span className="card-value-primary">R$ {Number(item.custoTotal).toFixed(2)}</span>
                        <div className="toggle-details-btn">
                          {isExpanded ? <ChevronUp size={20} className="color-primary" /> : <ChevronDown size={20} className="color-primary" />}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="card-details-expanded">
                        <div className="details-grid">
                          <div className="detail-item">
                            <span className="detail-label">Data da Compra</span>
                            <span className="detail-value">{item.data ? new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Data de Conclusão</span>
                            <span className="detail-value">{getFinalDate(item.data!, item.parcelas!)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Parcelas</span>
                            <span className="detail-value">{item.parcelaAtual} de {item.parcelas}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Valor Mensal</span>
                            <span className="detail-value font-bold text-primary">R$ {Number(item.valorMensal).toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="card-footer-actions mt-4 pt-3">
                          <div className="actions-cell" style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost color-primary" onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }}>
                              <Edit3 size={18} />
                            </button>
                            <button className="btn btn-danger" onClick={(e) => { e.stopPropagation(); setIdToDelete(item.id); setIsConfirmOpen(true); }}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }) : (
                <div className="empty-state">
                   Nenhum parcelamento ativo.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Editar Parcelamento" : "Novo Parcelamento"}>
        <form onSubmit={handleSave} className="modal-form">
          <div className="form-group">
            <label className="label">Descrição do bem</label>
            <input 
              type="text" 
              value={formData.descricao} 
              onChange={e => setFormData(p => ({ ...p, descricao: e.target.value }))}
              placeholder="Ex: Notebook..." 
              required 
            />
          </div>
          <div className="grid-2-cols">
            <div className="form-group">
              <label className="label">Valor Total (R$)</label>
              <input 
                type="number" 
                value={formData.custoTotal} 
                onChange={e => setFormData(p => ({ ...p, custoTotal: e.target.value }))}
                step="0.01" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="label">Parcelas</label>
              <input 
                type="number" 
                value={formData.parcelas} 
                onChange={e => setFormData(p => ({ ...p, parcelas: e.target.value }))}
                min="1" 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Data da Compra</label>
            <input 
              type="date" 
              value={formData.data} 
              onChange={e => setFormData(p => ({ ...p, data: e.target.value }))}
              required 
            />
          </div>

          <CustomDropdown 
            label="Categoria"
            options={categories.map(c => ({ id: c.nome, label: c.nome }))}
            selectedValues={formData.categoria ? [formData.categoria] : []}
            onChange={vals => setFormData(p => ({ ...p, categoria: vals[0] || '' }))}
          />
          
          <div className="grid-2-cols">
            <CustomDropdown 
              label="Pagamento"
              options={[
                { id: 'Pix', label: 'Pix' },
                { id: 'Débito', label: 'Débito' },
                { id: 'Crédito', label: 'Crédito' },
                { id: 'Boleto', label: 'Boleto' }
              ]}
              selectedValues={formData.formaPagamento ? [formData.formaPagamento] : []}
              onChange={vals => setFormData(p => ({ ...p, formaPagamento: vals[0] || '' }))}
            />
            <CustomDropdown 
              label="Cartão"
              options={cards.map(c => ({ id: c.nome, label: c.nome }))}
              selectedValues={formData.cartao ? [formData.cartao] : []}
              onChange={vals => setFormData(p => ({ ...p, cartao: vals[0] || '' }))}
            />
          </div>

          <div className="modal-actions-stack">
            <button type="submit" className="btn btn-primary btn-full">Salvar</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-full">Cancelar</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Confirmar Exclusão">
        <div className="confirm-content">
          <div className="confirm-icon"><AlertTriangle size={32} /></div>
          <p>Deseja realmente excluir este parcelamento? Esta ação é irreversível.</p>
          <div className="modal-actions-stack">
            <button className="btn btn-danger btn-full" onClick={handleDelete}>Sim, Excluir</button>
            <button className="btn btn-ghost btn-full" onClick={() => setIsConfirmOpen(false)}>Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
