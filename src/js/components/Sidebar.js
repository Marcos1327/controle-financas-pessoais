/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createIcons, icons } from 'lucide';
import { logout, auth } from '../storage/firebase.js';

export function Sidebar(activeRoute) {
  const user = auth.currentUser;
  const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';

  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', hash: '#/', icon: 'layout-dashboard' },
    { id: 'fixas', label: 'Dívidas Fixas', hash: '#/dividas-fixas', icon: 'calendar' },
    { id: 'parceladas', label: 'Parcelamentos', hash: '#/parceladas', icon: 'credit-card' },
    { id: 'avulsas', label: 'Compras Avulsas', hash: '#/avulsas', icon: 'shopping-cart' },
    { id: 'categorias', label: 'Categorias', hash: '#/categorias', icon: 'list' },
    { id: 'cartoes', label: 'Meus Cartões', hash: '#/cartoes', icon: 'credit-card' },
  ];

  const html = `
    <aside class="sidebar ${isCollapsed ? 'collapsed' : ''}">
      <div class="sidebar-header" style="justify-content: space-between; position: relative;">
        <div class="sidebar-logo-container" style="display: flex; align-items: center; gap: 12px;">
          <div class="logo-box">F</div>
          <h1 style="font-size: 1.25rem; font-weight: 700; color: white; white-space: nowrap;">Finanças Pro</h1>
        </div>
        <button id="btn-collapse-sidebar" class="btn btn-ghost desktop-only" style="padding: 4px; color: #94a3b8;">
           <i data-lucide="${isCollapsed ? 'chevrons-right' : 'chevrons-left'}" style="width: 20px; height: 20px;"></i>
        </button>
        <button id="btn-close-sidebar-mobile" class="btn btn-ghost mobile-only" style="padding: 4px; color: #94a3b8; display: none;">
           <i data-lucide="x" style="width: 20px; height: 20px;"></i>
        </button>
      </div>
      
      <nav class="sidebar-nav">
        ${menuItems.map(item => `
          <a href="${item.hash}" class="sidebar-link ${activeRoute === item.hash ? 'active' : ''}" title="${item.label}">
            <i data-lucide="${item.icon}" style="width: 20px; height: 20px;"></i>
            <span>${item.label}</span>
          </a>
        `).join('')}
      </nav>

      <div class="user-profile" id="user-profile-trigger" style="flex-direction: column; align-items: flex-start; gap: 12px; padding: 20px; cursor: pointer;">
        <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
          ${user?.photoURL ? `<img src="${user.photoURL}" style="width: 32px; height: 32px; border-radius: 50%;">` : `<div class="user-avatar">${user?.displayName?.charAt(0) || 'U'}</div>`}
          <div style="overflow: hidden; flex: 1;">
            <p style="font-size: 12px; font-weight: 600; color: white; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user?.displayName || 'Usuário'}</p>
            <p style="font-size: 10px; color: #64748b; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user?.email}</p>
          </div>
          <i data-lucide="chevron-up" class="profile-arrow" style="width: 14px; height: 14px; color: #64748b; transition: transform 0.2s;"></i>
        </div>
        <button id="btn-logout" class="btn btn-ghost" style="width: 100%; justify-content: flex-start; padding: 8px; color: #f87171; font-size: 11px; display: none;">
           <i data-lucide="log-out" style="width: 14px; height: 14px; margin-right: 8px;"></i>
           Sair da conta
        </button>
      </div>
    </aside>
  `;

  // Precisamos retornar o HTML e depois anexar os listeners
  setTimeout(() => {
    createIcons({ icons });
    
    document.getElementById('btn-collapse-sidebar')?.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
      const nextState = !isCurrentlyCollapsed;
      
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('sidebar-collapsed', nextState);
      
      // Atualizar ícone
      const btn = document.getElementById('btn-collapse-sidebar');
      btn.innerHTML = `<i data-lucide="${nextState ? 'chevrons-right' : 'chevrons-left'}" style="width: 20px; height: 20px;"></i>`;
      createIcons({ icons });
    });

    // Close Sidebar Mobile (X button)
    document.getElementById('btn-close-sidebar-mobile')?.addEventListener('click', () => {
      document.querySelector('.sidebar').classList.remove('active');
      document.getElementById('sidebar-overlay').classList.remove('active');
    });

    // Auto-close sidebar on link click (for mobile/tablet)
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          document.querySelector('.sidebar').classList.remove('active');
          document.getElementById('sidebar-overlay').classList.remove('active');
        }
      });
    });

    // Toggle User Profile Logout Button
    document.getElementById('user-profile-trigger')?.addEventListener('click', (e) => {
      const logoutBtn = document.getElementById('btn-logout');
      const arrow = document.querySelector('.profile-arrow');
      const isHidden = logoutBtn.style.display === 'none';
      
      logoutBtn.style.display = isHidden ? 'flex' : 'none';
      if (arrow) {
        arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    });

    document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
      e.stopPropagation(); // Prevent toggling the button back when clicking it
      if (confirm('Deseja sair do sistema?')) {
        await logout();
        window.location.reload();
      }
    });
  }, 0);

  return html;
}
