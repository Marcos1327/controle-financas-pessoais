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
        }
      </style>
      <div class="main-content">
        <header class="page-header">
          <div class="breadcrumb">
            Visão Geral / <span style="color: var(--text-main);">Mensal</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <i data-lucide="calendar" style="width: 16px; height: 16px; color: var(--text-muted);"></i>
            <input type="month" id="filter-month" value="${this.currentMonth}" style="border: none; background: transparent; font-weight: 700; cursor: pointer; outline: none;">
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
            <div style="overflow-x: auto;">
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
          </section>
        </div>
      </div>
    `;

    // Re-initializar ícones que foram injetados no HTML
    import('lucide').then(lucide => {
      lucide.createIcons({ icons: lucide.icons });
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
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const tipo = btn.getAttribute('data-tipo');
        const currentStatus = btn.getAttribute('data-status');
        const newStatus = currentStatus === 'PAGO' ? 'PENDENTE' : 'PAGO';

        let collectionKey = '';
        if (tipo === 'fixa') collectionKey = KEYS.DIVIDAS_FIXAS;
        else if (tipo === 'parcelada') collectionKey = KEYS.DIVIDAS_PARCELADAS;
        else if (tipo === 'avulsa') collectionKey = KEYS.COMPRAS_AVULSAS;

        if (collectionKey) {
          // Feedback de carregamento no botão
          btn.innerHTML = `<div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div>`;
          btn.disabled = true;

          try {
            await StorageService.update(collectionKey, { id, status: newStatus });
            await this.render(container);
          } catch (error) {
            alert('Erro ao atualizar status. Tente novamente.');
            console.error(error);
            await this.render(container);
          }
        }
      });
    });

    // Remover o listener antigo do filter-month pois ele foi substituído
    if (document.getElementById('filter-month')) {
      document.getElementById('filter-month').addEventListener('change', async (e) => {
        this.currentMonth = e.target.value;
        await this.render(container);
      });
    }
  }
}
