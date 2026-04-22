/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StorageService, KEYS } from '../storage/StorageService.js';

export class StorageView {
  constructor(keyName, title) {
    this.keyName = keyName;
    this.title = title;
    this.collectionKey = KEYS[keyName];
  }

  render(container) {
    const items = StorageService.getAll(this.collectionKey);

    container.innerHTML = `
      <div class="main-content">
        <header class="page-header">
          <div class="breadcrumb">
            Gestão / <span style="color: var(--text-main);">${this.title}</span>
          </div>
          <button id="btn-add" class="btn btn-primary">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
            Adicionar Registro
          </button>
        </header>

        <div class="content-padding">
          <section class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="padding-left: 24px;">Descrição / Item</th>
                  <th class="text-right">Financeiro / Data</th>
                  <th class="text-right" style="padding-right: 24px;">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${items.length > 0 ? items.map(item => `
                  <tr>
                    <td style="padding-left: 24px; font-weight: 700; color: var(--text-main); text-transform: capitalize;">
                      ${item.descricao || item.nome || 'Sem descrição'}
                    </td>
                    <td class="text-right">
                      <span style="font-weight: 700; color: var(--text-main);">
                        ${item.valorMensal ? `R$ ${Number(item.valorMensal).toFixed(2)}` : 
                          item.valor ? `R$ ${Number(item.valor).toFixed(2)}` : '-'}
                      </span>
                      ${item.data ? `<span style="display: block; font-size: 10px; color: var(--text-muted); font-weight: 700; margin-top: 2px;">${item.data}</span>` : ''}
                    </td>
                    <td class="text-right" style="padding-right: 24px;">
                      <button class="btn-delete btn-danger btn" data-id="${item.id}" style="padding: 6px;">
                        <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                      </button>
                    </td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="3" style="text-align: center; padding: 64px; color: var(--text-muted);">
                       Nenhum registro encontrado em ${this.title}.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </section>
        </div>
      </div>

      <!-- Modal -->
      <div id="modal" class="modal-overlay">
        <form id="form-add" class="modal-content">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
             <h3 style="font-size: 1.25rem; font-weight: 700;">Novo Registro</h3>
          </div>
          
          <div class="form-group">
            <label class="label">Descrição detalhada</label>
            <input type="text" name="descricao" placeholder="Ex: Aluguel, Supermercado..." required>
          </div>
          ${this.keyName.includes('DIVIDA') || this.keyName.includes('AVULSA') ? `
            <div class="form-group">
              <label class="label">Valor (R$)</label>
              <input type="number" name="valor" step="0.01" placeholder="0,00" required>
            </div>
          ` : ''}
          ${this.keyName === 'COMPRAS_AVULSAS' ? `
            <div class="form-group">
              <label class="label">Data</label>
              <input type="date" name="data" required>
            </div>
          ` : ''}

          <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button type="button" id="btn-cancel" class="btn btn-ghost" style="flex: 1;">Cancelar</button>
            <button type="submit" class="btn btn-primary" style="flex: 1; justify-content: center;">Salvar</button>
          </div>
        </form>
      </div>
    `;

    // Re-trigger icon initialization
    import('lucide').then(lucide => {
      lucide.createIcons({ icons: lucide.icons });
    });

    this.setupListeners(container);
  }

  setupListeners(container) {
    const modal = document.getElementById('modal');
    const form = document.getElementById('form-add');

    document.getElementById('btn-add').addEventListener('click', () => {
      modal.classList.add('active');
    });

    document.getElementById('btn-cancel').addEventListener('click', () => {
      modal.classList.remove('active');
      form.reset();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const newItem = {
        id: crypto.randomUUID(),
        descricao: formData.get('descricao') || formData.get('nome'),
        nome: formData.get('descricao') || formData.get('nome'),
        valorMensal: formData.get('valor'),
        valor: formData.get('valor'),
        data: formData.get('data'),
        status: 'ATIVO'
      };

      StorageService.add(this.collectionKey, newItem);
      modal.classList.remove('active');
      form.reset();
      this.render(container);
    });

    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        if (confirm('Deseja realmente excluir este registro?')) {
          StorageService.remove(this.collectionKey, id);
          this.render(container);
        }
      });
    });
  }
}
