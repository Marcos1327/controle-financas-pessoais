/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DashboardService } from '../services/DashboardService.js';

export class DashboardView {
  constructor() {
    this.currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  }

  render(container) {
    const summary = DashboardService.getMonthlySummary(this.currentMonth);

    container.innerHTML = `
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
                    <th>Descrição</th>
                    <th>Tipo</th>
                    <th class="text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  ${summary.lancamentos.length > 0 ? summary.lancamentos.map(l => `
                    <tr>
                      <td class="font-bold">${l.descricao}</td>
                      <td>
                        <span class="badge badge-${l.tipo === 'fixa' ? 'fixa' : l.tipo === 'parcelada' ? 'parcela' : 'avulsa'}">
                          ${l.tipo}
                        </span>
                      </td>
                      <td class="text-right font-bold">R$ ${Number(l.valorMensal || l.valor).toFixed(2)}</td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td colspan="3" style="text-align: center; padding: 48px; color: var(--text-muted);">Nenhum lançamento no período.</td>
                    </tr>
                  `}
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
    document.getElementById('filter-month').addEventListener('change', (e) => {
      this.currentMonth = e.target.value;
      this.render(container);
    });
  }
}
