/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sidebar } from './components/Sidebar.js';
import { DashboardView } from './views/DashboardView.js';
import { StorageView } from './views/StorageView.js';
import { DividaParceladaView } from './views/DividaParceladaView.js';

// PRD: Roteador escuta hashchange
const routes = {
  '#/': () => new DashboardView(),
  '#/dividas-fixas': () => new StorageView('DIVIDAS_FIXAS', 'Dívidas Fixas'),
  '#/parceladas': () => new DividaParceladaView(),
  '#/avulsas': () => new StorageView('COMPRAS_AVULSAS', 'Compras Avulsas'),
  '#/categorias': () => new StorageView('CATEGORIAS', 'Categorias'),
};

function router() {
  const appContainer = document.getElementById('app');
  const hash = window.location.hash || '#/';
  
  // Limpar e reconstruir estrutura se necessário
  appContainer.innerHTML = Sidebar(hash) + `<main id="page-content" class="main-content"></main>`;
  
  const contentContainer = document.getElementById('page-content');
  const viewFactory = routes[hash] || routes['#/'];
  
  const view = viewFactory();
  view.render(contentContainer);
}

window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  // Inicialização do sistema conforme PRD: se não tiver nada, criamos mocks ou categorias básicas
  // mas aqui respeitaremos o desejo de usar JSON backup
  router();
});
