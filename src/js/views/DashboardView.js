/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DashboardService } from '../services/DashboardService.js';
import { StorageService, KEYS } from '../storage/StorageService.js';

export class DashboardView {
  constructor() {
    this.currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    this.filters = {
      categoria: 'all',
      formaPagamento: 'all',
      cartao: 'all',
      status: 'all'
    };
  }

  async render(container) {
    // Estado de carregamento
    if (!container.innerHTML.includes('main-content')) {
      container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 80vh; color: var(--text-muted);">Carregando dados...</div>`;
    }

    const summary = await DashboardService.getMonthlySummary(this.currentMonth);

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
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1 1 150px;
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
            padding: 16px;
          }
          .content-padding {
            padding: 0 16px;
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
          <div class="breadcrumb">
            Visão Geral / <span style="color: var(--text-main);">Mensal</span>
          </div>
        </header>

        <div class="content-padding">
          <div class="filter-bar">
            <div class="filter-group">
              <label>Ano</label>
              <select id="f-year">
                ${[2024, 2025, 2026].map(y => `<option value="${y}" ${this.currentMonth.startsWith(y) ? 'selected' : ''}>${y}</option>`).join('')}
              </select>
            </div>
            <div class="filter-group">
              <label>Mês</label>
              <select id="f-month">
                ${Array.from({length: 12}, (_, i) => {
                  const m = String(i + 1).padStart(2, '0');
                  return `<option value="${m}" ${this.currentMonth.endsWith(m) ? 'selected' : ''}>${new Date(2000, i).toLocaleString('pt-BR', {month: 'long'})}</option>`;
                }).join('')}
              </select>
            </div>
            <div class="filter-group">
              <label>Categoria</label>
              <select id="f-categoria">
                <option value="all">Todas</option>
                ${[...new Set(summary.lancamentos.map(l => l.categoria).filter(Boolean))].map(c => `<option value="${c}" ${this.filters.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
            <div class="filter-group">
              <label>Forma Pagamento</label>
              <select id="f-pagamento">
                <option value="all">Todas</option>
                ${[...new Set(summary.lancamentos.map(l => l.formaPagamento).filter(Boolean))].map(f => `<option value="${f}" ${this.filters.formaPagamento === f ? 'selected' : ''}>${f}</option>`).join('')}
              </select>
            </div>
            <div class="filter-group">
              <label>Cartão</label>
              <select id="f-cartao">
                <option value="all">Todos</option>
                ${[...new Set(summary.lancamentos.map(l => l.cartao).filter(Boolean))].map(c => `<option value="${c}" ${this.filters.cartao === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
            <div class="filter-group">
              <label>Status</label>
              <select id="f-status">
                <option value="all" ${this.filters.status === 'all' ? 'selected' : ''}>Todos</option>
                <option value="PAGO" ${this.filters.status === 'PAGO' ? 'selected' : ''}>Pago</option>
                <option value="PENDENTE" ${this.filters.status === 'PENDENTE' ? 'selected' : ''}>Pendente</option>
              </select>
            </div>
          </div>

          <div class="grid-stats">
            <div class="card">
              <p class="card-title">Gasto Total</p>
              <p class="card-value">R$ ${summary.totalGeral.toFixed(2)}</p>
              <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Soma de todos os itens</p>
            </div>

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
                      if (this.filters.categoria !== 'all' && l.categoria !== this.filters.categoria) return false;
                      if (this.filters.formaPagamento !== 'all' && l.formaPagamento !== this.filters.formaPagamento) return false;
                      if (this.filters.cartao !== 'all' && l.cartao !== this.filters.cartao) return false;
                      if (this.filters.status !== 'all' && (l.status || 'PENDENTE') !== this.filters.status) return false;
                      return true;
                    });

                    return filtered.length > 0 ? filtered.map(l => {
                      const [year, month] = (l.data ? l.data.split('-') : this.currentMonth.split('-'));
                      const isPago = l.status === 'PAGO';
                      
                      return `
                      <tr style="${isPago ? 'opacity: 0.6;' : ''}">
                        <td>${year}</td>
                        <td>${month}</td>
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
                  if (this.filters.categoria !== 'all' && l.categoria !== this.filters.categoria) return false;
                  if (this.filters.formaPagamento !== 'all' && l.formaPagamento !== this.filters.formaPagamento) return false;
                  if (this.filters.cartao !== 'all' && l.cartao !== this.filters.cartao) return false;
                  if (this.filters.status !== 'all' && (l.status || 'PENDENTE') !== this.filters.status) return false;
                  return true;
                });

                return filtered.length > 0 ? filtered.map(l => {
                  const isPago = l.status === 'PAGO';
                  const [year, month] = (l.data ? l.data.split('-') : this.currentMonth.split('-'));
                  
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
                        <span>${month}/${year}</span>
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

    // Listeners
    const updateView = async () => {
      const year = document.getElementById('f-year').value;
      const month = document.getElementById('f-month').value;
      this.currentMonth = `${year}-${month}`;
      
      this.filters = {
        categoria: document.getElementById('f-categoria').value,
        formaPagamento: document.getElementById('f-pagamento').value,
        cartao: document.getElementById('f-cartao').value,
        status: document.getElementById('f-status').value
      };
      
      await this.render(container);
    };

    ['f-year', 'f-month', 'f-categoria', 'f-pagamento', 'f-cartao', 'f-status'].forEach(id => {
      document.getElementById(id).addEventListener('change', updateView);
    });

    // Lógica para alternar status (Pago/Pendente)
    container.querySelectorAll('.btn-toggle-status').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Evita expandir o card ao clicar no check
        
        const id = btn.getAttribute('data-id');
        const tipo = btn.getAttribute('data-tipo');
        const currentStatus = btn.getAttribute('data-status');
        const newStatus = currentStatus === 'PAGO' ? 'PENDENTE' : 'PAGO';
        const isNewPago = newStatus === 'PAGO';

        // 1. ATUALIZAÇÃO OTIMISTA (IMEDIATA)
        // Funciona tanto na tabela quanto no card mobile
        const elements = container.querySelectorAll(`[data-id="${id}"]`);
        
        elements.forEach(el => {
          const badge = el.querySelector('.status-indicator');
          const toggleBtn = el.querySelector('.btn-toggle-status');
          
          if (el.tagName === 'TR') {
            el.style.opacity = isNewPago ? '0.6' : '1';
          } else if (el.classList.contains('transaction-card')) {
            el.style.opacity = isNewPago ? '0.7' : '1';
          }
          
          if (badge) {
            badge.className = `status-indicator ${isNewPago ? 'status-pago' : 'status-pendente'}`;
            badge.textContent = isNewPago ? 'Pago' : 'Pendente';
          }
          
          if (toggleBtn) {
            toggleBtn.setAttribute('data-status', newStatus);
            toggleBtn.className = `btn-toggle-status btn ${isNewPago ? 'btn-ghost' : 'btn-success'}`;
            toggleBtn.innerHTML = `<i data-lucide="${isNewPago ? 'rotate-ccw' : 'check'}" style="width: 16px; height: 16px;"></i>`;
          }
        });
        
        import('lucide').then(lucide => { lucide.createIcons({ icons: lucide.icons }); });

        // 2. ATUALIZAÇÃO NO FIREBASE (SEGUNDO PLANO)
        let collectionKey = '';
        if (tipo === 'fixa') collectionKey = KEYS.DIVIDAS_FIXAS;
        else if (tipo === 'parcelada') collectionKey = KEYS.DIVIDAS_PARCELADAS;
        else if (tipo === 'avulsa') collectionKey = KEYS.COMPRAS_AVULSAS;

        if (collectionKey) {
          try {
            await StorageService.update(collectionKey, { id, status: newStatus });
            await this.render(container);
          } catch (error) {
            alert('Erro ao sincronizar com o banco. Revertendo alteração...');
            console.error(error);
            await this.render(container);
          }
        }
      });
    });
  }
}
