/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sidebar } from './components/Sidebar.js';
import { DashboardView } from './views/DashboardView.js';
import { StorageView } from './views/StorageView.js';
import { DividaParceladaView } from './views/DividaParceladaView.js';

import { watchAuthState, loginWithGoogle, logout } from './storage/firebase.js';

// PRD: Roteador escuta hashchange
const routes = {
  '#/': () => new DashboardView(),
  '#/dividas-fixas': () => new StorageView('DIVIDAS_FIXAS', 'Dívidas Fixas'),
  '#/parceladas': () => new DividaParceladaView(),
  '#/avulsas': () => new StorageView('COMPRAS_AVULSAS', 'Compras Avulsas'),
  '#/categorias': () => new StorageView('CATEGORIAS', 'Categorias'),
  '#/cartoes': () => new StorageView('CARTOES', 'Meus Cartões'),
};

async function router() {
  const appContainer = document.getElementById('app');
  const hash = window.location.hash || '#/';
  
  // Limpar e reconstruir estrutura se necessário
  appContainer.innerHTML = Sidebar(hash) + 
    `<div id="sidebar-overlay" class="sidebar-overlay"></div>` +
    `<main id="page-content" class="main-content"></main>`;
  
  const contentContainer = document.getElementById('page-content');
  const overlay = document.getElementById('sidebar-overlay');
  
  // Fechar sidebar ao clicar no overlay
  overlay.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.remove('active');
    overlay.classList.remove('active');
  });

  // Global Sidebar Toggle Listener (for mobile)
  appContainer.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('#btn-toggle-sidebar');
    if (toggleBtn) {
      document.querySelector('.sidebar').classList.add('active');
      document.getElementById('sidebar-overlay').classList.add('active');
    }
  });

  const viewFactory = routes[hash] || routes['#/'];
  
  const view = viewFactory();
  await view.render(contentContainer);
}

const showLoginPage = () => {
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = `
    <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc;">
      <div class="card" style="width: 100%; max-width: 400px; text-align: center; padding: 48px;">
        <div class="logo-box" style="width: 64px; height: 64px; font-size: 32px; margin: 0 auto 24px;">F</div>
        <h1 style="font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 8px;">Finanças Pro</h1>
        <p style="color: #64748b; margin-bottom: 32px;">Seu controle financeiro pessoal simplificado e seguro.</p>
        
        <button id="btn-login" class="btn btn-primary" style="width: 100%; justify-content: center; height: 48px; font-size: 16px;">
          Entrar com Google
        </button>
        
        <div style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
          Seus dados são protegidos pela criptografia do Google.
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('btn-login').addEventListener('click', async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      alert('Erro ao fazer login: ' + e.message);
    }
  });
};

window.addEventListener('hashchange', () => {
  if (window.currentUser) router();
});

window.addEventListener('load', () => {
  watchAuthState((user) => {
    window.currentUser = user;
    if (user) {
      router();
    } else {
      showLoginPage();
    }
  });
});
