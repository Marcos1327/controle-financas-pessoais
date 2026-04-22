/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createIcons, icons } from 'lucide';
import { StorageService } from '../storage/StorageService.js';
import { logout, auth } from '../storage/firebase.js';

export function Sidebar(activeRoute) {
  const user = auth.currentUser;
  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', hash: '#/', icon: 'layout-dashboard' },
    { id: 'fixas', label: 'Dívidas Fixas', hash: '#/dividas-fixas', icon: 'calendar' },
    { id: 'parceladas', label: 'Parcelamentos', hash: '#/parceladas', icon: 'credit-card' },
    { id: 'avulsas', label: 'Compras Avulsas', hash: '#/avulsas', icon: 'shopping-cart' },
    { id: 'categorias', label: 'Categorias', hash: '#/categorias', icon: 'list' },
  ];

  const html = `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-box">F</div>
        <h1 style="font-size: 1.25rem; font-weight: 700; color: white;">Finanças Pro</h1>
      </div>
      
      <nav class="sidebar-nav">
        ${menuItems.map(item => `
          <a href="${item.hash}" class="sidebar-link ${activeRoute === item.hash ? 'active' : ''}">
            <i data-lucide="${item.icon}" style="width: 20px; height: 20px;"></i>
            ${item.label}
          </a>
        `).join('')}
      </nav>

      <div class="sidebar-footer">
        <p class="sidebar-section-title">Dados e Backup</p>
        <button id="btn-export" class="btn btn-ghost" style="width: 100%; justify-content: flex-start; padding: 10px;">
          <i data-lucide="download" style="width: 16px; height: 16px;"></i>
          Exportar JSON
        </button>
        <label class="btn btn-ghost" style="width: 100%; justify-content: flex-start; padding: 10px; cursor: pointer;">
          <i data-lucide="upload" style="width: 16px; height: 16px;"></i>
          Importar JSON
          <input type="file" id="input-import" class="hidden" accept=".json">
        </label>
      </div>

      <div class="user-profile" style="flex-direction: column; align-items: flex-start; gap: 12px; padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
          ${user?.photoURL ? `<img src="${user.photoURL}" style="width: 32px; height: 32px; border-radius: 50%;">` : `<div class="user-avatar">${user?.displayName?.charAt(0) || 'U'}</div>`}
          <div style="overflow: hidden; flex: 1;">
            <p style="font-size: 12px; font-weight: 600; color: white; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user?.displayName || 'Usuário'}</p>
            <p style="font-size: 10px; color: #64748b; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user?.email}</p>
          </div>
        </div>
        <button id="btn-logout" class="btn btn-ghost" style="width: 100%; justify-content: flex-start; padding: 8px; color: #f87171; font-size: 11px;">
           <i data-lucide="log-out" style="width: 14px; height: 14px; margin-right: 8px;"></i>
           Sair da conta
        </button>
      </div>
    </aside>
  `;

  // Precisamos retornar o HTML e depois anexar os listeners
  setTimeout(() => {
    createIcons({ icons });
    
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      if (confirm('Deseja sair do sistema?')) {
        await logout();
        window.location.reload();
      }
    });

    document.getElementById('btn-export')?.addEventListener('click', async () => {
      await StorageService.exportData();
    });

    document.getElementById('input-import')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        const btnText = document.querySelector('#input-import').parentElement;
        const originalHtml = btnText.innerHTML;
        btnText.innerHTML = 'Importando...';

        const success = await StorageService.importData(event.target.result);
        
        if (success) {
          alert('Dados importados com sucesso para o banco de dados!');
          window.location.reload();
        } else {
          alert('Erro ao importar arquivo.');
          btnText.innerHTML = originalHtml;
        }
      };
      reader.readAsText(file);
    });
  }, 0);

  return html;
}
