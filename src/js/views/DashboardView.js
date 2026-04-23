/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DashboardService } from '../services/DashboardService.js';
import { StorageService, KEYS } from '../storage/StorageService.js';

export class DashboardView {
  constructor() {
    this.currentYear = new Date().getFullYear().toString();
    this.filters = {
      meses: [String(new Date().getMonth() + 1).padStart(2, '0')], // Array de strings "01", "02"
      categoria: [], // Vazio = todos
      formaPagamento: [], // Vazio = todos
      cartao: [], // Vazio = todos
      status: [] // Vazio = todos
    };
    this.allData = null;
    this.currentSummary = null;
    this.lastRenderedYearMonths = "";
  }

  async render(container, isUpdateOnly = false) {
    // 1. CARREGAMENTO INTELIGENTE DE DADOS
    // Busca dados brutos se não existirem (cache inicial)
    if (!this.allData) {
      this.allData = await DashboardService.getAllData();
    }
    const { fixas, parceladas, avulsas } = this.allData;

    const currentYear = new Date().getFullYear().toString();
    const yearsFromAvulsas = avulsas.map(a => a.data.split('-')[0]);
    const availableYears = [...new Set([currentYear, ...yearsFromAvulsas])].sort((a, b) => b - a);

    if (!this.currentYear) this.currentYear = currentYear;
    const selYear = this.currentYear;
    const currentMonthNum = new Date().getMonth() + 1;

    // 2. MESES DISPONÍVEIS
    const hasGlobalDebts = fixas.length > 0 || parceladas.some(p => p.status === 'ATIVO');
    const availableMonths = [];
    for (let m = 1; m <= 12; m++) {
      const monthStr = String(m).padStart(2, '0');
      const monthYear = `${selYear}-${monthStr}`;
      const hasAvulsasThisMonth = avulsas.some(a => a.data.startsWith(monthYear));
      const isPastOrCurrentMonthOfCurrentYear = (selYear === currentYear && m <= currentMonthNum);
      const isPastYear = (selYear < currentYear);

      let isAvailable = false;
      if (hasAvulsasThisMonth) isAvailable = true;
      else if (hasGlobalDebts && (isPastYear || isPastOrCurrentMonthOfCurrentYear)) isAvailable = true;

      if (isAvailable) availableMonths.push(monthStr);
    }
    
    // Validação meses
    if (this.filters.meses.length === 0 && availableMonths.length > 0) {
      this.filters.meses = [availableMonths[availableMonths.length - 1]];
    }
    this.filters.meses = this.filters.meses.filter(m => availableMonths.includes(m));

    // 3. OTIMIZAÇÃO: SÓ CALCULA O SUMÁRIO SE O ANO OU MESES MUDARAM
    const currentYearMonthsKey = selYear + this.filters.meses.join(',');
    if (this.lastRenderedYearMonths !== currentYearMonthsKey || !this.currentSummary) {
      const selectedMonthsPaths = this.filters.meses.map(m => `${selYear}-${m}`);
      this.currentSummary = await DashboardService.getMonthlySummary(selectedMonthsPaths, this.allData);
      this.lastRenderedYearMonths = currentYearMonthsKey;
    }
    const summary = this.currentSummary;
    const lancamentosBase = summary.lancamentos;

    // Opções Dinâmicas (Simplificadas agora que é multi-select)
    const categories = [...new Set(lancamentosBase.map(l => l.categoria).filter(Boolean))].sort();
    const payments = [...new Set(lancamentosBase.map(l => l.formaPagamento).filter(Boolean))].sort();
    const cards = [...new Set(lancamentosBase.map(l => l.cartao).filter(Boolean))].sort();
    const statuses = [...new Set(lancamentosBase.map(l => {
      const s = (l.status || 'PENDENTE').toUpperCase();
      return s === 'PAGO' ? 'PAGO' : 'PENDENTE';
    }))].sort();

    // Helpers para labels resumo
    const getLabel = (type, list, allOptions) => {
      if (list.length === 0) return 'Todos';
      if (list.length === 1) {
        if (type === 'mes') {
          const m = new Date(2000, parseInt(list[0]) - 1).toLocaleString('pt-BR', {month: 'long'});
          return m.charAt(0).toUpperCase() + m.slice(1);
        }
        if (type === 'status') return list[0] === 'PAGO' ? 'Pago' : 'Pendente';
        return list[0];
      }
      if (list.length === allOptions.length) return 'Todos';
      return `${list.length} Selecionados`;
    };

    const monthLabel = getLabel('mes', this.filters.meses, availableMonths);
    const catLabel = getLabel('cat', this.filters.categoria, categories);
    const payLabel = getLabel('pay', this.filters.formaPagamento, payments);
    const cardLabel = getLabel('card', this.filters.cartao, cards);
    const statusLabel = getLabel('status', this.filters.status, statuses);

    const getMonthName = (m) => {
      const date = new Date(2000, parseInt(m) - 1);
      const name = date.toLocaleString('pt-BR', { month: 'long' });
      return name.charAt(0).toUpperCase() + name.slice(1);
    };

    container.innerHTML = `
      <style>
        .status-indicator {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          display: inline-block;
        }
        .status-pago {
          background: #dcfce7;
          color: #166534;
        }
        .status-pendente {
          background: #fee2e2;
          color: #991b1b;
        }
        .table-container table th, .table-container table td {
          white-space: nowrap;
          padding: 12px 16px;
        }
        .filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          background: var(--bg-card);
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
          border: 1px solid var(--border-color);
          transition: all 0.3s ease;
        }
        .filter-bar.hidden-mobile {
          display: none;
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1 1 150px;
          position: relative;
        }

        /* Restaurando o design original compacto dos filtros do Dashboard */
        .dashboard-filters .custom-dropdown {
          position: relative;
          width: 100%;
        }

        .dashboard-filters .dropdown-trigger {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-main);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          height: 38px; /* Mais compacto */
        }

        .dashboard-filters .dropdown-trigger:hover {
          border-color: var(--primary);
          transform: translateY(-1px);
          /* Fundo removido conforme solicitado */
        }

        .dashboard-filters .dropdown-trigger.active {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .dashboard-filters .dropdown-item {
          padding: 8px 12px;
          font-size: 13px;
          background: transparent !important; /* Garante que não tenha fundo */
        }

        .dashboard-filters .dropdown-item:hover {
          background: var(--bg-app) !important;
          color: var(--primary);
        }

        .dashboard-filters .dropdown-item.selected {
          background: transparent !important; /* Remove fundo do item selecionado */
          color: var(--primary);
          font-weight: 700;
        }

        .btn-reset-filters {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          align-self: flex-end;
          height: 38px;
        }

        .btn-reset-filters:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        /* Mobile specific controls */
        .mobile-controls {
          display: none;
          gap: 8px;
          margin-bottom: 16px;
        }
        .filter-group label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .filter-group select, .filter-group input {
          border: 1px solid var(--border-color);
          background: var(--bg-main);
          color: var(--text-main);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          outline: none;
          width: 100%;
        }

        /* Mobile Transactions CSS */
        .mobile-list {
          display: none;
          flex-direction: column;
          gap: 12px;
          padding-bottom: 20px;
        }
        .transaction-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.2s;
        }
        .card-header-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .card-details {
          display: none;
          padding-top: 12px;
          border-top: 1px dashed var(--border-color);
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          font-size: 12px;
        }
        .card-details.active {
          display: grid;
        }
        .detail-item label {
          display: block;
          color: var(--text-muted);
          font-size: 10px;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .detail-item span {
          font-weight: 600;
        }

        /* Responsividade */
        @media (max-width: 768px) {
          .mobile-controls {
            display: flex;
          }
          .filter-bar {
            display: none !important; /* Escondido por padrão no mobile */
          }
          .filter-bar.active {
            display: flex !important;
          }
          .grid-stats {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .filter-bar {
            gap: 12px;
          }
          .desktop-only {
            display: none !important;
          }
          .mobile-list {
            display: flex;
          }
          .filter-group {
            flex: 1 1 45%;
          }
          .page-header {
            padding: 0 16px;
            height: 56px;
          }
          .content-padding {
            padding: 16px;
          }
          .breadcrumb { font-size: 10px; }
          #btn-toggle-sidebar {
            display: flex !important;
          }
          #btn-toggle-stats-mobile {
            display: flex !important;
          }
          #secondary-stats {
            display: none !important;
          }
          #secondary-stats.active {
            display: flex !important;
            flex-direction: column;
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 480px) {
          .grid-stats {
            grid-template-columns: 1fr;
          }
          .filter-group {
            flex: 1 1 100%;
          }
        }
      </style>
      <div class="main-content">
        <header class="page-header">
          <div style="display: flex; align-items: center; gap: 12px;">
            <button id="btn-toggle-sidebar" class="btn btn-ghost toggle-sidebar-btn" style="padding: 8px; display: none;">
              <i data-lucide="menu" style="width: 20px; height: 20px;"></i>
            </button>
            <div class="breadcrumb">
              Visão Geral / <span style="color: var(--text-main);">Mensal</span>
            </div>
          </div>
        </header>

        <div class="content-padding">
          <div class="mobile-controls">
            <button id="btn-toggle-filters" class="btn btn-primary" style="flex: 1; justify-content: center;">
              <i data-lucide="filter" style="width: 16px; height: 16px;"></i>
              Filtros
            </button>
          </div>

          <div id="filter-bar" class="filter-bar dashboard-filters">
            <!-- ANO -->
            <div class="filter-group">
              <label>Ano</label>
              <div class="custom-dropdown" data-filter="year" data-type="single">
                <button class="dropdown-trigger">
                  <span>${selYear}</span>
                  <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
                </button>
                <div class="dropdown-menu">
                  ${availableYears.map(y => `
                    <div class="dropdown-item ${selYear === y ? 'selected' : ''}" data-value="${y}">${y}</div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- MÊS -->
            <div class="filter-group">
              <label>Mês</label>
              <div class="custom-dropdown" data-filter="meses" data-type="multi">
                <button class="dropdown-trigger">
                  <span>${monthLabel}</span>
                  <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
                </button>
                <div class="dropdown-menu">
                  <div class="dropdown-item ${this.filters.meses.length === availableMonths.length ? 'selected' : ''}" data-value="all">
                    <i data-lucide="${this.filters.meses.length === availableMonths.length ? 'check-square' : 'square'}" style="width: 14px; height: 14px;"></i>
                    Selecionar Tudo
                  </div>
                  ${availableMonths.map(m => {
                    const label = new Date(2000, parseInt(m) - 1).toLocaleString('pt-BR', {month: 'long'});
                    const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
                    return `<div class="dropdown-item ${this.filters.meses.includes(m) ? 'selected' : ''}" data-value="${m}">
                      <i data-lucide="${this.filters.meses.includes(m) ? 'check-square' : 'square'}" style="width: 14px; height: 14px;"></i>
                      ${capitalizedLabel}
                    </div>`;
                  }).join('')}
                </div>
              </div>
            </div>

            <!-- CATEGORIA -->
            <div class="filter-group">
              <label>Categoria</label>
              <div class="custom-dropdown" data-filter="categoria" data-type="multi">
                <button class="dropdown-trigger">
                  <span>${catLabel}</span>
                  <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
                </button>
                <div class="dropdown-menu">
                  <div class="dropdown-item ${this.filters.categoria.length === categories.length ? 'selected' : ''}" data-value="all">
                    <i data-lucide="${this.filters.categoria.length === categories.length ? 'check-square' : 'square'}" style="width: 14px; height: 14px;"></i>
                    Selecionar Tudo
                  </div>
                  ${categories.map(c => `
                    <div class="dropdown-item ${this.filters.categoria.includes(c) ? 'selected' : ''}" data-value="${c}">
                      <i data-lucide="${this.filters.categoria.includes(c) ? 'check-square' : 'square'}" style="width: 14px; height: 14px;"></i>
                      ${c}
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- PAGAMENTO -->
            <div class="filter-group">
              <label>Forma Pagamento</label>
              <div class="custom-dropdown" data-filter="formaPagamento" data-type="multi">
                <button class="dropdown-trigger">
                  <span>${payLabel}</span>
                  <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
                </button>
                <div class="dropdown-menu">
                  <div class="dropdown-item ${this.filters.formaPagamento.length === payments.length ? 'selected' : ''}" data-value="all">
                    <i data-lucide="${this.filters.formaPagamento.length === payments.length ? 'check-square' : 'square'}" style="width: 14px; height: 14px;"></i>
                    Selecionar Tudo
                  </div>
                  ${payments.map(f => `
                    <div class="dropdown-item ${this.filters.formaPagamento.includes(f) ? 'selected' : ''}" data-value="${f}">
                      <i data-lucide="${this.filters.formaPagamento.includes(f) ? 'check-square' : 'square'}" style="width: 14px; height: 14px;"></i>
                      ${f}
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- CARTÃO -->
            <div class="filter-group">
              <label>Cartão</label>
              <div class="custom-dropdown" data-filter="cartao" data-type="multi">
                <button class="dropdown-trigger">
                  <span>${cardLabel}</span>
                  <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
                </button>
                <div class="dropdown-menu">
                  <div class="dropdown-item ${this.filters.cartao.length === cards.length ? 'selected' : ''}" data-value="all">
                    <i data-lucide="${this.filters.cartao.length === cards.length ? 'check-square' : 'square'}" style="width: 14px; height: 14px;"></i>
                    Selecionar Tudo
                  </div>
                  ${cards.map(c => `
                    <div class="dropdown-item ${this.filters.cartao.includes(c) ? 'selected' : ''}" data-value="${c}">
                      <i data-lucide="${this.filters.cartao.includes(c) ? 'check-square' : 'square'}" style="width: 14px; height: 14px;"></i>
                      ${c}
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- STATUS -->
            <div class="filter-group">
              <label>Status</label>
              <div class="custom-dropdown" data-filter="status" data-type="multi">
                <button class="dropdown-trigger">
                  <span>${statusLabel}</span>
                  <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
                </button>
                <div class="dropdown-menu">
                  <div class="dropdown-item ${this.filters.status.length === statuses.length ? 'selected' : ''}" data-value="all">
                    <i data-lucide="${this.filters.status.length === statuses.length ? 'check-square' : 'square'}" style="width: 14px; height: 14px;"></i>
                    Selecionar Tudo
                  </div>
                  ${statuses.map(s => `
                    <div class="dropdown-item ${this.filters.status.includes(s) ? 'selected' : ''}" data-value="${s}">
                      <i data-lucide="${this.filters.status.includes(s) ? 'check-square' : 'square'}" style="width: 14px; height: 14px;"></i>
                      ${s === 'PAGO' ? 'Pago' : 'Pendente'}
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- RESET BUTTON -->
            <button id="btn-reset-filters" class="btn-reset-filters" title="Resetar todos os filtros">
              <i data-lucide="refresh-ccw" style="width: 14px; height: 14px;"></i>
              Limpar Filtros
            </button>
          </div>

          <div class="grid-stats">
            <div class="card" style="position: relative;">
              <p class="card-title">Gasto Total</p>
              <p class="card-value">R$ ${summary.totalGeral.toFixed(2)}</p>
              
              
              <!-- Mobile only toggle for details -->
              <button id="btn-toggle-stats-mobile" class="btn btn-ghost" style="display: none; position: absolute; top: 16px; right: 16px; padding: 4px;">
                <i data-lucide="eye" style="width: 18px; height: 18px;"></i>
              </button>
            </div>

            <div id="secondary-stats" class="secondary-stats-container" style="display: contents;">
              <div class="card">
                <p class="card-title">Dívidas Fixas</p>
                <p class="card-value" style="color: var(--primary);">R$ ${summary.totalFixas.toFixed(2)}</p>
                <div class="progress-container">
                  <div class="progress-bar" style="background: var(--primary); width: ${Math.min((summary.totalFixas / summary.totalGeral) * 100 || 0, 100)}%"></div>
                </div>
              </div>

              <div class="card">
                <p class="card-title">Parcelamentos</p>
                <p class="card-value" style="color: var(--warning);">R$ ${summary.totalParceladas.toFixed(2)}</p>
                <div class="progress-container">
                  <div class="progress-bar" style="background: var(--warning); width: ${Math.min((summary.totalParceladas / summary.totalGeral) * 100 || 0, 100)}%"></div>
                </div>
              </div>

              <div class="card">
                <p class="card-title">Avulsas</p>
                <p class="card-value" style="color: var(--success);">R$ ${summary.totalAvulsas.toFixed(2)}</p>
                <div class="progress-container">
                  <div class="progress-bar" style="background: var(--success); width: ${Math.min((summary.totalAvulsas / summary.totalGeral) * 100 || 0, 100)}%"></div>
                </div>
              </div>
            </div>
          </div>

          <section class="table-container">
            <div class="table-header">Transações do Mês</div>
            
            <div class="desktop-only" style="overflow-x: auto;">
              <table>
                <thead>
                  <tr>
                    <th>Ano</th>
                    <th>Mês</th>
                    <th>Descrição</th>
                    <th class="text-right">Valor</th>
                    <th>Categoria</th>
                    <th>Pagamento</th>
                    <th>Cartão</th>
                    <th>Parcela</th>
                    <th>Status</th>
                    <th class="text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  ${(() => {
                    const filtered = summary.lancamentos.filter(l => {
                      if (this.filters.categoria.length > 0 && !this.filters.categoria.includes(l.categoria)) return false;
                      if (this.filters.formaPagamento.length > 0 && !this.filters.formaPagamento.includes(l.formaPagamento)) return false;
                      if (this.filters.cartao.length > 0 && !this.filters.cartao.includes(l.cartao)) return false;
                      
                      if (this.filters.status.length > 0) {
                        const lStatus = (l.status || 'PENDENTE').toUpperCase();
                        const normalizeStatus = lStatus === 'PAGO' ? 'PAGO' : 'PENDENTE';
                        if (!this.filters.status.includes(normalizeStatus)) return false;
                      }
                      return true;
                    });

                    return filtered.length > 0 ? filtered.map(l => {
                      const [year, mNum] = (l.data ? l.data.split('-') : (l.dataRef || '0000-00').split('-'));
                      const monthName = getMonthName(mNum);
                      const isPago = l.status === 'PAGO';
                      
                      return `
                      <tr style="${isPago ? 'opacity: 0.6;' : ''}" data-id="${l.id}">
                        <td>${year}</td>
                        <td>${monthName}</td>
                        <td class="font-bold">${l.descricao}</td>
                        <td class="text-right font-bold">R$ ${Number(l.valorMensal || l.valor).toFixed(2)}</td>
                        <td>${l.categoria || '-'}</td>
                        <td>${l.formaPagamento || '-'}</td>
                        <td>${l.cartao || '-'}</td>
                        <td>${l.parcelaAtual ? `${l.parcelaAtual}/${l.parcelas}` : '-'}</td>
                        <td>
                          <span class="status-indicator ${isPago ? 'status-pago' : 'status-pendente'}">
                            ${isPago ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                        <td class="text-right">
                          <button class="btn-toggle-status btn ${isPago ? 'btn-ghost' : 'btn-success'}" 
                                  data-id="${l.id}" 
                                  data-tipo="${l.tipo}" 
                                  data-status="${l.status || 'PENDENTE'}"
                                  title="${isPago ? 'Marcar como pendente' : 'Marcar como pago'}">
                            <i data-lucide="${isPago ? 'rotate-ccw' : 'check'}" style="width: 16px; height: 16px;"></i>
                          </button>
                        </td>
                      </tr>
                    `}).join('') : `
                      <tr>
                        <td colspan="10" style="text-align: center; padding: 48px; color: var(--text-muted);">Nenhum lançamento corresponde aos filtros.</td>
                      </tr>
                    `;
                  })()}
                </tbody>
              </table>
            </div>

            <!-- Mobile View -->
            <div class="mobile-list">
              ${(() => {
                const filtered = summary.lancamentos.filter(l => {
                  if (this.filters.categoria.length > 0 && !this.filters.categoria.includes(l.categoria)) return false;
                  if (this.filters.formaPagamento.length > 0 && !this.filters.formaPagamento.includes(l.formaPagamento)) return false;
                  if (this.filters.cartao.length > 0 && !this.filters.cartao.includes(l.cartao)) return false;
                  
                  if (this.filters.status.length > 0) {
                    const lStatus = (l.status || 'PENDENTE').toUpperCase();
                    const normalizeStatus = lStatus === 'PAGO' ? 'PAGO' : 'PENDENTE';
                    if (!this.filters.status.includes(normalizeStatus)) return false;
                  }
                  return true;
                });

                return filtered.length > 0 ? filtered.map(l => {
                  const isPago = l.status === 'PAGO';
                  const [year, mNum] = (l.data ? l.data.split('-') : (l.dataRef || '0000-00').split('-'));
                  const monthName = getMonthName(mNum);
                  
                  return `
                  <div class="transaction-card" style="${isPago ? 'opacity: 0.7;' : ''}" data-id="${l.id}">
                    <div class="card-header-main">
                      <div>
                        <p class="font-bold" style="font-size: 15px;">${l.descricao}</p>
                        <p class="font-bold" style="color: var(--text-main); font-size: 16px; margin-top: 4px;">R$ ${Number(l.valorMensal || l.valor).toFixed(2)}</p>
                      </div>
                      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                        <span class="status-indicator ${isPago ? 'status-pago' : 'status-pendente'}">
                          ${isPago ? 'Pago' : 'Pendente'}
                        </span>
                        <div style="display: flex; gap: 8px;">
                          <button class="btn btn-ghost btn-toggle-details" style="padding: 4px 8px;">
                            <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
                          </button>
                          <button class="btn-toggle-status btn ${isPago ? 'btn-ghost' : 'btn-success'}" 
                                  data-id="${l.id}" 
                                  data-tipo="${l.tipo}" 
                                  data-status="${l.status || 'PENDENTE'}"
                                  style="padding: 4px 8px;">
                            <i data-lucide="${isPago ? 'rotate-ccw' : 'check'}" style="width: 16px; height: 16px;"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="card-details">
                      <div class="detail-item">
                        <label>Data</label>
                        <span>${monthName}/${year}</span>
                      </div>
                      <div class="detail-item">
                        <label>Categoria</label>
                        <span>${l.categoria || '-'}</span>
                      </div>
                      <div class="detail-item">
                        <label>Pagamento</label>
                        <span>${l.formaPagamento || '-'}</span>
                      </div>
                      <div class="detail-item">
                        <label>Cartão</label>
                        <span>${l.cartao || '-'}</span>
                      </div>
                      <div class="detail-item">
                        <label>Parcela</label>
                        <span>${l.parcelaAtual ? `${l.parcelaAtual}/${l.parcelas}` : 'À vista / Fixo'}</span>
                      </div>
                    </div>
                  </div>
                `}).join('') : `
                  <div style="text-align: center; padding: 48px; color: var(--text-muted);">Nenhum lançamento encontrado.</div>
                `;
              })()}
            </div>
          </section>
        </div>
      </div>
    `;

    // Re-initializar ícones que foram injetados no HTML
    import('lucide').then(lucide => {
      lucide.createIcons({ icons: lucide.icons });
    });

    // Listeners para detalhes do card mobile
    container.querySelectorAll('.btn-toggle-details').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.transaction-card');
        const details = card.querySelector('.card-details');
        const icon = btn.querySelector('i');
        
        details.classList.toggle('active');
        
        // Troca o ícone (chevron-down / chevron-up)
        if (details.classList.contains('active')) {
          btn.innerHTML = `<i data-lucide="chevron-up" style="width: 16px; height: 16px;"></i>`;
        } else {
          btn.innerHTML = `<i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>`;
        }
        
        import('lucide').then(lucide => {
          lucide.createIcons({ icons: lucide.icons });
        });
      });
    });

    // Toggle Filtros Mobile
    document.getElementById('btn-toggle-filters')?.addEventListener('click', () => {
      document.getElementById('filter-bar').classList.toggle('active');
    });

    // Toggle Stats Mobile
    document.getElementById('btn-toggle-stats-mobile')?.addEventListener('click', () => {
      const container = document.getElementById('secondary-stats');
      const btn = document.getElementById('btn-toggle-stats-mobile');
      container.classList.toggle('active');
      
      const isActive = container.classList.contains('active');
      btn.innerHTML = `<i data-lucide="${isActive ? 'eye-off' : 'eye'}" style="width: 18px; height: 18px;"></i>`;
      
      import('lucide').then(lucide => {
        lucide.createIcons({ icons: lucide.icons });
      });
    });

    // Listeners para os Custom Dropdowns
    const closeAllDropdowns = () => {
      container.querySelectorAll('.dropdown-menu.active').forEach(m => m.classList.remove('active'));
      container.querySelectorAll('.dropdown-trigger.active').forEach(t => t.classList.remove('active'));
    };

    container.querySelectorAll('.custom-dropdown').forEach(dropdown => {
      const trigger = dropdown.querySelector('.dropdown-trigger');
      const menu = dropdown.querySelector('.dropdown-menu');
      const filterType = dropdown.getAttribute('data-filter');
      const isMulti = dropdown.getAttribute('data-type') === 'multi';

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = menu.classList.contains('active');
        
        // Fecha outros antes de abrir o novo
        closeAllDropdowns();

        if (!isActive) {
          menu.classList.add('active');
          trigger.classList.add('active');
        }
      });

      menu.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', async (e) => {
          e.stopPropagation();
          const value = item.getAttribute('data-value');
          if (!value) return;

          if (!isMulti) {
            // Lógica Single (Ano)
            if (filterType === 'year') {
              this.currentYear = value;
            }
            closeAllDropdowns();
          } else {
            // Lógica Multi (Mês, Categoria, etc)
            let list = this.filters[filterType];
            
            if (value === 'all') {
              const allOptionsMap = {
                meses: availableMonths,
                categoria: categories,
                formaPagamento: payments,
                cartao: cards,
                status: statuses
              };
              const options = allOptionsMap[filterType];
              if (list.length === options.length) {
                this.filters[filterType] = filterType === 'meses' && options.length > 0 ? [options[options.length-1]] : [];
              } else {
                this.filters[filterType] = [...options];
              }
            } else {
              if (list.includes(value)) {
                list = list.filter(v => v !== value);
              } else {
                list.push(value);
              }
              this.filters[filterType] = list;
            }
          }

          // RENDERIZAÇÃO OTIMIZADA:
          // Se mudou apenas filtros secundários (que não mudam os dados base), 
          // poderíamos ter um render mais rápido, mas aqui vamos focar no cache de dados.
          await this.render(container);
          
          // Se for multi-seleção, vamos re-abrir o menu que o render fechou
          if (isMulti) {
             const newDropdown = container.querySelector(`.custom-dropdown[data-filter="${filterType}"]`);
             if (newDropdown) {
                newDropdown.querySelector('.dropdown-menu').classList.add('active');
                newDropdown.querySelector('.dropdown-trigger').classList.add('active');
             }
          }
        });
      });
    });

    // Fecha dropdowns ao clicar em qualquer lugar da tela
    const globalClickHandler = (e) => {
      if (!e.target.closest('.custom-dropdown')) {
        closeAllDropdowns();
      }
    };
    
    // Removemos listener anterior para não acumular
    document.removeEventListener('click', globalClickHandler);
    document.addEventListener('click', globalClickHandler);

    // Listener para o botão de Reset
    const btnReset = container.querySelector('#btn-reset-filters');
    if (btnReset) {
      btnReset.addEventListener('click', async () => {
        this.currentYear = new Date().getFullYear().toString();
        this.filters = {
          meses: [String(new Date().getMonth() + 1).padStart(2, '0')],
          categoria: [],
          formaPagamento: [],
          cartao: [],
          status: []
        };
        await this.render(container);
      });
    }

    // Lógica para alternar status (Pago/Pendente)
    container.querySelectorAll('.btn-toggle-status').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Evita expandir o card ao clicar no check
        
        const id = btn.getAttribute('data-id');
        const tipo = btn.getAttribute('data-tipo');
        const currentStatus = (btn.getAttribute('data-status') || 'PENDENTE').toUpperCase();
        const newStatus = currentStatus === 'PAGO' ? 'PENDENTE' : 'PAGO';
        const isNewPago = newStatus === 'PAGO';

        // 1. ATUALIZAÇÃO OTIMISTA (IMEDIATA)
        const elements = container.querySelectorAll(`[data-id="${id}"]`);
        
        elements.forEach(el => {
          // Se for o container (TR ou Card)
          if (el.tagName === 'TR' || el.classList.contains('transaction-card')) {
            el.style.opacity = isNewPago ? (el.tagName === 'TR' ? '0.6' : '0.7') : '1';
            
            const badge = el.querySelector('.status-indicator');
            if (badge) {
              badge.className = `status-indicator ${isNewPago ? 'status-pago' : 'status-pendente'}`;
              badge.textContent = isNewPago ? 'Pago' : 'Pendente';
            }
            
            const btnChild = el.querySelector('.btn-toggle-status');
            if (btnChild) {
              btnChild.setAttribute('data-status', newStatus);
              btnChild.className = `btn-toggle-status btn ${isNewPago ? 'btn-ghost' : 'btn-success'}`;
              btnChild.innerHTML = `<i data-lucide="${isNewPago ? 'rotate-ccw' : 'check'}" style="width: 16px; height: 16px;"></i>`;
            }
          } 
          // Se for o botão isolado (fallback)
          else if (el.classList.contains('btn-toggle-status')) {
            el.setAttribute('data-status', newStatus);
            el.className = `btn-toggle-status btn ${isNewPago ? 'btn-ghost' : 'btn-success'}`;
            el.innerHTML = `<i data-lucide="${isNewPago ? 'rotate-ccw' : 'check'}" style="width: 16px; height: 16px;"></i>`;
          }
        });
        
        // Renderiza somente os novos ícones sem carregar a lib inteira se já existir
        if (window.lucide) {
          window.lucide.createIcons({ icons: window.lucide.icons });
        } else {
          import('lucide').then(lucide => { 
            window.lucide = lucide;
            lucide.createIcons({ icons: lucide.icons }); 
          });
        }

        // 2. ATUALIZAÇÃO NO FIREBASE (SEGUNDO PLANO)
        let collectionKey = '';
        if (tipo === 'fixa') collectionKey = KEYS.DIVIDAS_FIXAS;
        else if (tipo === 'parcelada') collectionKey = KEYS.DIVIDAS_PARCELADAS;
        else if (tipo === 'avulsa') collectionKey = KEYS.COMPRAS_AVULSAS;

        if (collectionKey) {
          StorageService.update(collectionKey, { id, status: newStatus }).then(() => {
            // Invalida o cache de dados globais para forçar recarga no próximo render real
            this.allData = null;
            this.currentSummary = null;
            
            // Agenda um refresh silencioso (opcional, já que o otimista resolveu visualmente)
            setTimeout(() => this.render(container), 2000); 
          }).catch(error => {
            alert('Erro ao sincronizar. Revertendo...');
            this.render(container);
          });
        }
      });
    });
  }
}
