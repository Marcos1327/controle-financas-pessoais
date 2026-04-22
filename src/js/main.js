/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sidebar } from './components/Sidebar.js';
import { DashboardView } from './views/DashboardView.js';
import { StorageView } from './views/StorageView.js';
import { DividaParceladaView } from './views/DividaParceladaView.js';

import { initAuth } from './storage/firebase.js';

// PRD: Roteador escuta hashchange
const routes = {
  '#/': () => new DashboardView(),
  '#/dividas-fixas': () => new StorageView('DIVIDAS_FIXAS', 'Dívidas Fixas'),
  '#/parceladas': () => new DividaParceladaView(),
  '#/avulsas': () => new StorageView('COMPRAS_AVULSAS', 'Compras Avulsas'),
  '#/categorias': () => new StorageView('CATEGORIAS', 'Categorias'),
};

async function router() {
  const appContainer = document.getElementById('app');
  const hash = window.location.hash || '#/';
  
  // Limpar e reconstruir estrutura se necessário
  appContainer.innerHTML = Sidebar(hash) + `<main id="page-content" class="main-content"></main>`;
  
  const contentContainer = document.getElementById('page-content');
  const viewFactory = routes[hash] || routes['#/'];
  
  const view = viewFactory();
  await view.render(contentContainer);
}

window.addEventListener('hashchange', router);
window.addEventListener('load', async () => {
  try {
    // Inicializa Firebase de forma anônima antes de renderizar qualquer coisa
    const user = await initAuth();
    
    if (!user) {
      console.log("Sistema iniciado em modo limitado (sem banco de dados ativo).");
    }

    // Migração automática (opcional)
    const hasLocalData = localStorage.getItem('fp_categorias') || localStorage.getItem('fp_dividas_fixas');
    if (hasLocalData) {
      console.log("Detectados dados locais. Use 'Importar JSON' para subir para a nuvem.");
    }

    router();
  } catch (error) {
    console.error("Erro crítico na inicialização", error);
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = `<div style="padding: 20px; text-align: center; height: 100vh; display: flex; align-items: center; justify-content: center;">
      <div>
        <h2 style="color: #64748b;">Aguardando Configuração</h2>
        <p style="color: #94a3b8; max-width: 400px; margin: 10px auto;">O Firebase não pôde ser inicializado. Certifique-se de que o <b>Login Anônimo</b> está ativado no Console do Firebase.</p>
        <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 20px;">Tentar Novamente</button>
      </div>
    </div>`;
  }
});
