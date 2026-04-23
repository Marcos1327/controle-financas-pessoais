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
    const availableCards = await StorageService.getAll(KEYS.CARTOES);

    const getMonthName = (dateStr) => {
      if (!dateStr) return '-';
      const [year, month] = dateStr.split('-');
      const date = new Date(year, parseInt(month) - 1);
      const name = date.toLocaleString('pt-BR', { month: 'long' });
      return name.charAt(0).toUpperCase() + name.slice(1);
    };

    const isAvulsa = this.keyName === 'COMPRAS_AVULSAS';
    const isSpecialList = this.keyName === 'CATEGORIAS' || this.keyName === 'CARTOES';

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
          <button id="btn-add" class="btn btn-primary desktop-only">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
            ${this.keyName === 'CATEGORIAS' ? 'Adicionar Categoria' : 
              this.keyName === 'CARTOES' ? 'Adicionar Cartão' : 'Adicionar Registro'}
          </button>
        </header>

        <!-- Floating Action Button for Mobile -->
        <button id="btn-add-mobile" class="btn btn-primary mobile-only btn-fab">
          <i data-lucide="plus" style="width: 28px; height: 28px;"></i>
        </button>

        <div class="content-padding">
          <!-- Desktop View: Table -->
          <section class="table-container desktop-only" style="overflow-x: auto;">
            <table style="min-width: 1000px;">
              <thead>
                <tr>
                  ${isSpecialList ? `
                    <th style="padding-left: 24px;">Nome</th>
                  ` : `
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
                  `}
                  <th class="text-right" style="padding-right: 24px;">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${items.length > 0 ? items.map(item => `
                  <tr>
                    ${isSpecialList ? `
                      <td style="padding-left: 24px; font-weight: 700; color: var(--text-main); text-transform: capitalize;">
                        ${item.nome || item.descricao || 'Sem nome'}
                      </td>
                    ` : `
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
                    `}
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

          <!-- Mobile View: Cards -->
          <section class="mobile-only" style="display: flex; flex-direction: column; gap: 16px;">
            ${items.length > 0 ? items.map(item => `
              <div class="card" style="padding: 20px; border-radius: 16px; border: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                  <div style="flex: 1; padding-right: 12px;">
                    <h4 style="font-weight: 700; color: var(--text-main); font-size: 15px; margin-bottom: 4px; text-transform: capitalize;">
                      ${item.nome || item.descricao || 'Sem descrição'}
                    </h4>
                    <p style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">
                      ${isAvulsa && item.data ? `${getMonthName(item.data)} / ${item.data.split('-')[0]}` : this.title}
                    </p>
                  </div>
                  <div style="text-align: right;">
                    <p style="font-weight: 800; color: var(--primary); font-size: 16px;">
                      ${item.valorMensal ? `R$ ${Number(item.valorMensal).toFixed(2)}` : 
                        item.valor ? `R$ ${Number(item.valor).toFixed(2)}` : '-'}
                    </p>
                  </div>
                </div>

                ${!isSpecialList ? `
                  <div id="details-${item.id}" class="hidden" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #f1f5f9; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                      <p class="label" style="margin-bottom: 4px; font-size: 10px;">Categoria</p>
                      <p style="font-size: 13px; font-weight: 600; color: var(--text-main);">${item.categoria || '-'}</p>
                    </div>
                    <div>
                      <p class="label" style="margin-bottom: 4px; font-size: 10px;">Pagamento</p>
                      <p style="font-size: 13px; font-weight: 600; color: var(--text-main);">${item.formaPagamento || '-'}</p>
                    </div>
                    <div style="grid-column: span 2;">
                      <p class="label" style="margin-bottom: 4px; font-size: 10px;">Cartão</p>
                      <p style="font-size: 13px; font-weight: 600; color: var(--text-main);">${item.cartao || '-'}</p>
                    </div>
                  </div>
                ` : ''}

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
                  ${!isSpecialList ? `
                    <button class="btn-show-details btn btn-ghost" data-id="${item.id}" style="padding: 4px 0; font-size: 12px; color: var(--primary); font-weight: 700;">
                      Ver detalhes
                    </button>
                  ` : '<div></div>'}
                  <div style="display: flex; gap: 12px;">
                    <button class="btn-edit btn btn-ghost" data-id="${item.id}" style="padding: 8px; color: var(--primary); background: #f8fafc; border-radius: 8px;">
                      <i data-lucide="edit-3" style="width: 18px; height: 18px;"></i>
                    </button>
                    <button class="btn-api-delete btn-danger btn" data-id="${item.id}" style="padding: 8px; background: #fff1f2; border-radius: 8px;">
                      <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                    </button>
                  </div>
                </div>
              </div>
            `).join('') : `
              <div style="padding: 48px; text-align: center; color: var(--text-muted); background: white; border-radius: 16px; border: 2px dashed #e2e8f0;">
                 Nenhum registro encontrado.
              </div>
            `}
          </section>
        </div>
      </div>

      <style>
        /* Design minimalista para os dropdowns do Modal (igual ao Dashboard) */
        .modal-content .custom-dropdown {
          position: relative;
          width: 100%;
        }

        .modal-content .dropdown-trigger {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: #f8fafc;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-main);
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
          height: 46px;
        }

        .modal-content .dropdown-trigger:hover {
          border-color: var(--primary);
          transform: translateY(-1px);
        }

        .modal-content .dropdown-trigger.active {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .modal-content .dropdown-item {
          padding: 10px 16px;
          font-size: 15px;
          background: transparent !important;
        }

        .modal-content .dropdown-item:hover {
          background: #f1f5f9 !important;
          color: var(--primary);
        }

        .modal-content .dropdown-item.selected {
          background: transparent !important;
          color: var(--primary);
          font-weight: 700;
        }

        /* Floating Action Button (FAB) Styles */
        .btn-fab {
          position: fixed;
          bottom: 32px;
          right: 24px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          justify-content: center;
          padding: 0;
          box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4), 0 4px 6px -4px rgba(79, 70, 229, 0.1);
          z-index: 90;
          border: none;
        }

        .btn-fab:active {
          transform: scale(0.9) translateY(2px);
          box-shadow: 0 5px 10px -3px rgba(79, 70, 229, 0.4);
        }

        /* Bottom Sheet Modal Styles */
        @media (max-width: 640px) {
          .modal-overlay {
            align-items: flex-end;
          }

          .modal-content {
            max-width: 100% !important;
            width: 100%;
            border-radius: 24px 24px 0 0 !important;
            padding: 24px !important;
            margin-bottom: 0;
            transform: translateY(100%);
            transition: transform 0.3s ease-out;
            border-bottom: none !important;
          }

          .modal-overlay.active .modal-content {
            transform: translateY(0);
            animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .modal-overlay.active {
            animation: fadeIn 0.3s ease-out forwards;
          }

          .modal-content .grid-mobile-stack {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }

          .modal-content .modal-actions-mobile {
            flex-direction: column-reverse;
            gap: 12px !important;
          }
          
          .bottom-sheet-handle {
            display: block !important;
            width: 40px;
            height: 4px;
            background: #e2e8f0;
            border-radius: 2px;
            margin: -12px auto 24px;
          }
        }
      </style>

      <!-- Modal -->
      <div id="modal" class="modal-overlay">
        <form id="form-add" class="modal-content" style="max-width: 500px; padding: 32px; border: none;">
          <div class="bottom-sheet-handle" style="display: none;"></div>
          
          ${isSpecialList ? '' : `
            <div style="margin-bottom: 24px;">
              <h3 id="modal-title" style="font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--text-main);">Novo Registro</h3>
              <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">Preencha as informações abaixo.</p>
            </div>
          `}
          
          ${isSpecialList ? `
            <div class="form-group" style="margin-bottom: 20px;">
              <label class="label">Nome da ${this.keyName === 'CATEGORIAS' ? 'Categoria' : 'Cartão'}</label>
              <input type="text" name="nome" placeholder="Ex: Alimentação, Nubank..." required 
                     style="background: #f8fafc; border: 1px solid var(--border-color); padding: 12px 16px; font-size: 15px;">
            </div>
          ` : `
            <div class="form-group" style="margin-bottom: 20px;">
              <label class="label">Descrição detalhada</label>
              <input type="text" name="descricao" placeholder="Ex: Aluguel, Supermercado..." required 
                     style="background: #f8fafc; border: 1px solid var(--border-color); padding: 12px 16px; font-size: 15px;">
            </div>

            <div class="grid-mobile-stack" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="label">Valor (R$)</label>
                <input type="number" name="valor" step="0.01" placeholder="0,00" required
                       style="background: #f8fafc; border: 1px solid var(--border-color); padding: 12px 16px; font-size: 15px;">
              </div>
              ${isAvulsa ? `
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="label">Data</label>
                  <input type="date" name="data" required
                         style="background: #f8fafc; border: 1px solid var(--border-color); padding: 12px 16px; font-size: 15px;">
                </div>
              ` : ''}
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
              <label class="label">Categoria</label>
              <div class="custom-dropdown" data-name="categoria">
                <button type="button" class="dropdown-trigger">
                  <span>Selecione...</span>
                  <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
                </button>
                <div class="dropdown-menu">
                  ${availableCategories.map(c => `<div class="dropdown-item" data-value="${c.nome}">${c.nome}</div>`).join('')}
                </div>
                <input type="hidden" name="categoria" required>
              </div>
            </div>

            <div class="grid-mobile-stack" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 8px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="label">Forma de Pagamento</label>
                <div class="custom-dropdown" data-name="formaPagamento">
                  <button type="button" class="dropdown-trigger">
                    <span>Selecione...</span>
                    <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
                  </button>
                  <div class="dropdown-menu">
                    <div class="dropdown-item" data-value="Pix">Pix</div>
                    <div class="dropdown-item" data-value="Débito">Débito</div>
                    <div class="dropdown-item" data-value="Crédito">Crédito</div>
                    <div class="dropdown-item" data-value="Boleto">Boleto</div>
                  </div>
                  <input type="hidden" name="formaPagamento" required>
                </div>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="label">Cartão (Opcional)</label>
                <div class="custom-dropdown" data-name="cartao">
                  <button type="button" class="dropdown-trigger">
                    <span>Selecione...</span>
                    <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
                  </button>
                  <div class="dropdown-menu">
                    ${availableCards.map(c => `<div class="dropdown-item" data-value="${c.nome}">${c.nome}</div>`).join('')}
                  </div>
                  <input type="hidden" name="cartao">
                </div>
              </div>
            </div>
          `}

          <div class="modal-actions-mobile" style="display: flex; gap: 16px; margin-top: 32px;">
            <button type="button" id="btn-cancel" class="btn btn-ghost" style="flex: 1; height: 48px; justify-content: center; background: #f1f5f9; color: #475569;">Cancelar</button>
            <button type="submit" id="btn-save" class="btn btn-primary" style="flex: 1; height: 48px; justify-content: center;">Salvar Registro</button>
          </div>
        </form>
      </div>
      <!-- Modal de Confirmação de Exclusão -->
      <div id="modal-confirm" class="modal-overlay">
        <div class="modal-content" style="max-width: 400px; text-align: center; padding: 32px;">
          <div style="width: 56px; height: 56px; background: #fee2e2; color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
            <i data-lucide="alert-triangle" style="width: 28px; height: 28px;"></i>
          </div>
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">Finanças Pro</h3>
          <p id="confirm-msg" style="color: var(--text-muted); margin-bottom: 32px;">Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.</p>
          
          <div style="display: flex; gap: 12px;">
            <button type="button" id="btn-confirm-cancel" class="btn btn-ghost" style="flex: 1;">Cancelar</button>
            <button type="button" id="btn-confirm-delete" class="btn btn-danger" style="flex: 1; justify-content: center;">Sim, Excluir</button>
          </div>
        </div>
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
    const modalConfirm = document.getElementById('modal-confirm');
    const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    
    let idToDelete = null;

    const updateDropdown = (name, value) => {
      const dropdown = container.querySelector(`.custom-dropdown[data-name="${name}"]`);
      if (!dropdown) return;
      const trigger = dropdown.querySelector('.dropdown-trigger span');
      const hiddenInput = dropdown.querySelector('input[type="hidden"]');
      const items = dropdown.querySelectorAll('.dropdown-item');

      if (value) {
        trigger.textContent = value;
        hiddenInput.value = value;
        items.forEach(item => {
          if (item.getAttribute('data-value') === value) item.classList.add('selected');
          else item.classList.remove('selected');
        });
      } else {
        trigger.textContent = 'Selecione...';
        hiddenInput.value = '';
        items.forEach(item => item.classList.remove('selected'));
      }
    };

    const openModal = (item = null) => {
      this.editingId = item ? item.id : null;
      if (modalTitle) modalTitle.textContent = item ? 'Editar Registro' : 'Novo Registro';
      btnSave.textContent = item ? 'Atualizar' : 'Salvar';

      if (item) {
        if (form.descricao) form.descricao.value = item.descricao || '';
        if (form.nome) form.nome.value = item.nome || item.descricao || '';
        if (form.valor) form.valor.value = item.valor || item.valorMensal || '';
        if (form.data) form.data.value = item.data || '';
        updateDropdown('categoria', item.categoria);
        updateDropdown('formaPagamento', item.formaPagamento);
        updateDropdown('cartao', item.cartao);
        if (form.cartao && form.cartao.tagName === 'INPUT' && form.cartao.type === 'text') {
           form.cartao.value = item.cartao || '';
        }
      } else {
        form.reset();
        updateDropdown('categoria', '');
        updateDropdown('formaPagamento', '');
        updateDropdown('cartao', '');
      }

      modal.classList.add('active');
    };

    document.getElementById('btn-add')?.addEventListener('click', () => {
      openModal();
    });

    document.getElementById('btn-add-mobile')?.addEventListener('click', () => {
      openModal();
    });

    // Custom Dropdown Logic
    const closeAllDropdowns = () => {
      modal.querySelectorAll('.dropdown-menu.active').forEach(m => m.classList.remove('active'));
      modal.querySelectorAll('.dropdown-trigger.active').forEach(t => t.classList.remove('active'));
    };

    modal.querySelectorAll('.custom-dropdown').forEach(dropdown => {
      const trigger = dropdown.querySelector('.dropdown-trigger');
      const menu = dropdown.querySelector('.dropdown-menu');
      const name = dropdown.getAttribute('data-name');

      trigger.onclick = (e) => {
        e.stopPropagation();
        const isActive = menu.classList.contains('active');
        closeAllDropdowns();
        if (!isActive) {
          menu.classList.add('active');
          trigger.classList.add('active');
        }
      };

      dropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.onclick = (e) => {
          e.stopPropagation();
          const value = item.getAttribute('data-value');
          updateDropdown(name, value);
          closeAllDropdowns();
        };
      });
    });

    // Close dropdowns on outside click
    window.addEventListener('click', () => closeAllDropdowns());

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
      
      const isSpecialList = this.keyName === 'CATEGORIAS' || this.keyName === 'CARTOES';
      let itemData = {};

      if (isSpecialList) {
        itemData = {
          nome: formData.get('nome')
        };
      } else {
        const val = formData.get('valor');
        itemData = {
          descricao: formData.get('descricao'),
          valor: val,
          valorMensal: val,
          data: formData.get('data'),
          categoria: formData.get('categoria'),
          formaPagamento: formData.get('formaPagamento'),
          cartao: formData.get('cartao'),
          status: 'PENDENTE'
        };
      }

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

    // Ação: Mostrar Detalhes (Mobile)
    container.querySelectorAll('.btn-show-details').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const detailsDiv = document.getElementById(`details-${id}`);
        const isHidden = detailsDiv.classList.contains('hidden');
        
        detailsDiv.classList.toggle('hidden');
        e.currentTarget.textContent = isHidden ? 'Ocultar detalhes' : 'Ver detalhes';
      };
    });

    // Ação Real de Exclusão (Passo 3 - Agora Customizado)
    container.querySelectorAll('.btn-api-delete').forEach(btn => {
      btn.onclick = (e) => {
        idToDelete = e.currentTarget.getAttribute('data-id');
        modalConfirm.classList.add('active');
      };
    });

    btnConfirmCancel.onclick = () => {
      modalConfirm.classList.remove('active');
      idToDelete = null;
    };

    btnConfirmDelete.onclick = async () => {
      if (idToDelete) {
        try {
          await StorageService.remove(this.collectionKey, idToDelete);
          modalConfirm.classList.remove('active');
          idToDelete = null;
          await this.render(container);
        } catch (err) {
          alert('Erro ao excluir: ' + err.message);
        }
      }
    };
  }
}
