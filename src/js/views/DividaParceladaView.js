/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StorageService, KEYS } from '../storage/StorageService.js';
import { createIcons, Plus, Trash2, CheckCircle } from 'lucide';

export class DividaParceladaView {
  async render(container) {
    if (!container.innerHTML.includes('main-content')) {
      container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 80vh; color: var(--text-muted);">Carregando dados...</div>`;
    }
    const items = await StorageService.getAll(KEYS.DIVIDAS_PARCELADAS);

    container.innerHTML = `
      <div class="main-content">
        <header class="page-header">
          <div class="breadcrumb">
            Gestão / <span style="color: var(--text-main);">Parcelamentos</span>
          </div>
          <button id="btn-add" class="btn btn-primary">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Novo Parcelamento
          </button>
        </header>

        <div class="content-padding">
          <div class="grid-stats">
            ${items.length > 0 ? items.map(item => `
              <div class="card" style="position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                  <div>
                    <h4 style="font-weight: 700; color: var(--text-main);">${item.descricao}</h4>
                    <p style="font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">${item.status}</p>
                  </div>
                  <span class="badge badge-parcela">R$ ${Number(item.valorMensal).toFixed(2)} / mês</span>
                </div>
                
                <div style="margin-top: 16px;">
                  <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">
                    <span>Progresso</span>
                    <span>${item.parcelaAtual} de ${item.parcelas}</span>
                  </div>
                  <div class="progress-container">
                    <div class="progress-bar" style="background: var(--primary); width: ${(item.parcelaAtual / item.parcelas) * 100}%"></div>
                  </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
                  <button class="btn-increment btn btn-ghost" style="color: var(--primary); font-size: 11px;" data-id="${item.id}">+ 1 Parcela</button>
                  <button class="btn-delete btn btn-danger" style="padding: 6px;" data-id="${item.id}"><i data-lucide="trash-2" style="width: 16px; height: 16px;"></i></button>
                </div>
              </div>
            `).join('') : `
              <div style="grid-column: 1 / -1; padding: 64px; text-align: center; color: var(--text-muted); border: 2px dashed #e2e8f0; border-radius: 24px;">
                 Nenhum parcelamento ativo.
              </div>
            `}
          </div>
        </div>
      </div>

      <div id="modal" class="modal-overlay">
        <form id="form-add" class="modal-content">
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 24px;">Novo Parcelamento</h3>

          <div class="form-group">
            <label class="label">Descrição do bem</label>
            <input type="text" name="descricao" placeholder="Ex: Notebook..." required>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="label">Valor Total (R$)</label>
              <input type="number" name="custoTotal" step="0.01" required>
            </div>
            <div class="form-group">
              <label class="label">Parcelas</label>
              <input type="number" name="parcelas" min="1" required>
            </div>
          </div>

          <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button type="button" id="btn-cancel" class="btn btn-ghost" style="flex: 1;">Cancelar</button>
            <button type="submit" class="btn btn-primary" style="flex: 1; justify-content: center;">Salvar</button>
          </div>
        </form>
      </div>
    `;

    import('lucide').then(lucide => {
      lucide.createIcons({ icons: lucide.icons });
    });
    this.setupListeners(container);
  }

  setupListeners(container) {
    const modal = document.getElementById('modal');
    const form = document.getElementById('form-add');

    document.getElementById('btn-add').addEventListener('click', () => modal.classList.add('active'));
    document.getElementById('btn-cancel').addEventListener('click', () => {
      modal.classList.remove('active');
      form.reset();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const custoTotal = Number(fd.get('custoTotal'));
      const parcelas = Number(fd.get('parcelas'));
      
      const newItem = {
        id: crypto.randomUUID(),
        descricao: fd.get('descricao'),
        custoTotal,
        parcelas,
        parcelaAtual: 1,
        valorMensal: (custoTotal / parcelas).toFixed(2),
        status: 'ATIVO'
      };

      await StorageService.add(KEYS.DIVIDAS_PARCELADAS, newItem);
      modal.classList.remove('active');
      form.reset();
      await this.render(container);
    });

    container.querySelectorAll('.btn-increment').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const items = await StorageService.getAll(KEYS.DIVIDAS_PARCELADAS);
        const item = items.find(i => i.id === id);
        
        if (item) {
          item.parcelaAtual = Number(item.parcelaAtual) + 1;
          if (item.parcelaAtual >= item.parcelas) {
            item.status = 'FINALIZADO';
            item.parcelaAtual = item.parcelas;
          }
          await StorageService.update(KEYS.DIVIDAS_PARCELADAS, item);
          await this.render(container);
        }
      });
    });

    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Excluir?')) {
          await StorageService.remove(KEYS.DIVIDAS_PARCELADAS, btn.getAttribute('data-id'));
          await this.render(container);
        }
      });
    });
  }
}
