/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FirebaseService } from './FirebaseService.js';

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
  getAll: async (key) => {
    return await FirebaseService.getAll(key);
  },

  /**
   * Adiciona um item a uma coleção
   */
  add: async (key, item) => {
    await FirebaseService.add(key, item);
  },

  /**
   * Remove um item pelo ID
   */
  remove: async (key, id) => {
    await FirebaseService.remove(key, id);
  },

  /**
   * Atualiza um item
   */
  update: async (key, updatedItem) => {
    await FirebaseService.update(key, updatedItem);
  },

  /**
   * EXPORTAÇÃO: Gera um arquivo JSON com todos os dados do sistema
   */
  exportData: async () => {
    const backup = {};
    for (const key of Object.values(KEYS)) {
      backup[key] = await StorageService.getAll(key);
    }
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `financas_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  },

  /**
   * IMPORTAÇÃO: Carrega dados de um arquivo JSON para o Firebase
   */
  importData: async (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      for (const [key, value] of Object.entries(data)) {
        if (Object.values(KEYS).includes(key) && Array.isArray(value)) {
          // Para cada item no JSON, adicionamos ao Firebase
          for (const item of value) {
            await StorageService.add(key, item);
          }
        }
      }
      return true;
    } catch (e) {
      console.error('Erro ao importar JSON', e);
      return false;
    }
  }
};
