/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Chaves utilizadas no localStorage conforme definido no PRD
export const KEYS = {
  CATEGORIAS: 'fp_categorias',
  CARTOES: 'fp_cartoes',
  FORMAS_PAGAMENTO: 'fp_formas_pagamento',
  DIVIDAS_FIXAS: 'fp_dividas_fixas',
  DIVIDAS_PARCELADAS: 'fp_dividas_parceladas',
  COMPRAS_AVULSAS: 'fp_compras_avulsas'
};

export const StorageService = {
  /**
   * Retorna todos os itens de uma coleção
   */
  getAll: (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Erro ao ler ${key} do localStorage`, e);
      return [];
    }
  },

  /**
   * Salva uma coleção inteira
   */
  save: (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  },

  /**
   * Adiciona um item a uma coleção
   */
  add: (key, item) => {
    const items = StorageService.getAll(key);
    items.push(item);
    StorageService.save(key, items);
  },

  /**
   * Remove um item pelo ID
   */
  remove: (key, id) => {
    const items = StorageService.getAll(key).filter(i => i.id !== id);
    StorageService.save(key, items);
  },

  /**
   * Atualiza um item
   */
  update: (key, updatedItem) => {
    const items = StorageService.getAll(key).map(i => 
      i.id === updatedItem.id ? updatedItem : i
    );
    StorageService.save(key, items);
  },

  /**
   * EXPORTAÇÃO: Gera um arquivo JSON com todos os dados do sistema
   */
  exportData: () => {
    const backup = {};
    Object.values(KEYS).forEach(key => {
      backup[key] = StorageService.getAll(key);
    });
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `financas_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  },

  /**
   * IMPORTAÇÃO: Carrega dados de um arquivo JSON
   */
  importData: (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      Object.entries(data).forEach(([key, value]) => {
        if (Object.values(KEYS).includes(key) && Array.isArray(value)) {
          StorageService.save(key, value);
        }
      });
      return true;
    } catch (e) {
      console.error('Erro ao importar JSON', e);
      return false;
    }
  }
};
