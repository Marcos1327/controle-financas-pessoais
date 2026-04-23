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
    this.editingId = null;
    this.cachedItems = [];
  }

  async render(container) {
    if (!container.innerHTML.includes('main-content')) {
      container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 80vh; color: var(--text-muted);">Carregando dados...</div>`;
    }
    this.cachedItems = await StorageService.getAll(this.collectionKey);
    const items = this.cachedItems;
    const availableCategories = await StorageService.getAll(KEYS.CATEGORIAS);

    const getMonthName = (dateStr) => {
      if (!dateStr) return '-';
      const [year, month] = dateStr.split('-');
      const date = new Date(year, parseInt(month) - 1);
      const name = date.toLocaleString('pt-BR', { month: 'long' });
      return name.charAt(0).toUpperCase() + name.slice(1);
    };

    const isAvulsa = this.keyName === 'COMPRAS_AVULSAS';

    container.innerHTML = `
      <div class="main-content">
        <header class="page-header">
          <div style="display: flex; align-items: center; gap: 12px;">
            <button id="btn-toggle-sidebar" class="btn btn-ghost toggle-sidebar-btn" style="padding: 8px; display: none;">
              <i data-lucide="menu" style="width: 20px; height: 20px;"></i>
            </button>
            <div class="breadcrumb">
              Gestão / <span style="color: var(--text-main);">${this.title}</span>
            </div>
          </div>
          <button id="btn-add" class="btn btn-primary">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
            Adicionar Registro
          </button>
        </header>

        <div class="content-padding">
          <section class="table-container" style="overflow-x: auto;">
            <table style="min-width: 1000px;">
              <thead>
                <tr>
                  ${isAvulsa ? `
                    <th style="padding-left: 24px;">Ano</th>
                    <th>Mês</th>
                    <th>Descrição</th>
                  ` : `
                    <th style="padding-left: 24px;">Descrição</th>
                  `}
                  <th class="text-right">Valor</th>
                  <th>Categoria</th>
                  <th>Forma Pagamento</th>
                  <th>Cartão</th>
                  <th class="text-right" style="padding-right: 24px;">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${items.length > 0 ? items.map(item => `
                  <tr>
                    ${isAvulsa ? `
                      <td style="padding-left: 24px;">${item.data ? item.data.split('-')[0] : '-'}</td>
                      <td>${getMonthName(item.data)}</td>
                      <td style="font-weight: 700; color: var(--text-main); text-transform: capitalize;">
                        ${item.descricao || item.nome || 'Sem descrição'}
                      </td>
                    ` : `
                      <td style="padding-left: 24px; font-weight: 700; color: var(--text-main); text-transform: capitalize;">
                        ${item.descricao || item.nome || 'Sem descrição'}
                      </td>
                    `}
                    <td class="text-right">
                      <span style="font-weight: 700; color: var(--text-main);">
                        ${item.valorMensal ? `R$ ${Number(item.valorMensal).toFixed(2)}` : 
                          item.valor ? `R$ ${Number(item.valor).toFixed(2)}` : '-'}
                      </span>
                    </td>
                    <td>${item.categoria || '-'}</td>
                    <td>${item.formaPagamento || '-'}</td>
                    <td>${item.cartao || '-'}</td>
                    <td class="text-right" style="padding-right: 24px;">
                      <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button class="btn-edit btn btn-ghost" data-id="${item.id}" style="padding: 6px; color: var(--primary);">
                          <i data-lucide="edit-3" style="width: 18px; height: 18px;"></i>
                        </button>
                        <button class="btn-api-delete btn-danger btn" data-id="${item.id}" style="padding: 6px;">
                          <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="${isAvulsa ? 8 : 6}" style="text-align: center; padding: 64px; color: var(--text-muted);">
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
        <form id="form-add" class="modal-content" style="max-width: 500px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
             <h3 id="modal-title" style="font-size: 1.25rem; font-weight: 700;">Novo Registro</h3>
          </div>
          
          <div class="form-group">
            <label class="label">Descrição detalhada</label>
            <input type="text" name="descricao" placeholder="Ex: Aluguel, Supermercado..." required>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="label">Valor (R$)</label>
              <input type="number" name="valor" step="0.01" placeholder="0,00" required>
            </div>
            ${isAvulsa ? `
              <div class="form-group">
                <label class="label">Data</label>
                <input type="date" name="data" required>
              </div>
            ` : ''}
          </div>

          <div class="form-group">
            <label class="label">Categoria</label>
            <select name="categoria" class="dropdown-trigger" style="width: 100%;" required>
              <option value="">Selecione...</option>
              ${availableCategories.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('')}
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="label">Forma de Pagamento</label>
              <select name="formaPagamento" class="dropdown-trigger" style="width: 100%;" required>
                <option value="">Selecione...</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Pix">Pix</option>
                <option value="Débito">Débito</option>
                <option value="Crédito">Crédito</option>
                <option value="Boleto">Boleto</option>
              </select>
            </div>
            <div class="form-group">
              <label class="label">Cartão (Opcional)</label>
              <input type="text" name="cartao" placeholder="Nome do cartão">
            </div>
          </div>

          <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button type="button" id="btn-cancel" class="btn btn-ghost" style="flex: 1;">Cancelar</button>
            <button type="submit" id="btn-save" class="btn btn-primary" style="flex: 1; justify-content: center;">Salvar</button>
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
    const modalTitle = document.getElementById('modal-title');
    const btnSave = document.getElementById('btn-save');

    const openModal = (item = null) => {
      this.editingId = item ? item.id : null;
      modalTitle.textContent = item ? 'Editar Registro' : 'Novo Registro';
      btnSave.textContent = item ? 'Atualizar' : 'Salvar';

      if (item) {
        form.descricao.value = item.descricao || '';
        form.valor.value = item.valor || item.valorMensal || '';
        if (form.data) form.data.value = item.data || '';
        form.categoria.value = item.categoria || '';
        form.formaPagamento.value = item.formaPagamento || '';
        form.cartao.value = item.cartao || '';
      } else {
        form.reset();
      }

      modal.classList.add('active');
    };

    document.getElementById('btn-add').addEventListener('click', () => {
      openModal();
    });

    // Listener para o botão de Reset/Fechar do Modal
    document.getElementById('btn-cancel').onclick = () => {
      modal.classList.remove('active');
      form.reset();
      this.editingId = null;
    };

    // Submissão do Formulário (Salvar/Atualizar)
    form.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const val = formData.get('valor');
      const itemData = {
        descricao: formData.get('descricao'),
        valor: val,
        valorMensal: val,
        data: formData.get('data'),
        categoria: formData.get('categoria'),
        formaPagamento: formData.get('formaPagamento'),
        cartao: formData.get('cartao'),
        status: 'PENDENTE'
      };

      try {
        if (this.editingId) {
          await StorageService.update(this.collectionKey, { id: this.editingId, ...itemData });
        } else {
          await StorageService.add(this.collectionKey, { 
            id: crypto.randomUUID(), 
            ...itemData 
          });
        }
        modal.classList.remove('active');
        form.reset();
        this.editingId = null;
        await this.render(container);
      } catch (err) {
        alert('Erro ao salvar os dados. Tente novamente.');
      }
    };

    // Ação: Editar
    container.querySelectorAll('.btn-edit').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const item = this.cachedItems.find(i => i.id === id);
        if (item) openModal(item);
      };
    });

    // Ação Real de Exclusão (Passo 3)
    container.querySelectorAll('.btn-api-delete').forEach(btn => {
      btn.onclick = async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        
        // Pergunta de segurança
        const confirmed = window.confirm('Deseja realmente excluir este lançamento? Esta ação não pode ser desfeita.');

        if (confirmed && id) {
          try {
            await StorageService.remove(this.collectionKey, id);
            // Atualiza a tabela na tela
            await this.render(container);
          } catch (err) {
            alert('Erro ao excluir: ' + err.message);
          }
        }
      };
    });
  }
}
