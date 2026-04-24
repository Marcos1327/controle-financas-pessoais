import { FirebaseService } from './FirebaseService';

export const KEYS = {
  CATEGORIAS: 'fp_categorias',
  CARTOES: 'fp_cartoes',
  FORMAS_PAGAMENTO: 'fp_formas_pagamento',
  DIVIDAS_FIXAS: 'fp_dividas_fixas',
  DIVIDAS_PARCELADAS: 'fp_dividas_parceladas',
  COMPRAS_AVULSAS: 'fp_compras_avulsas'
};

export const StorageService = {
  getAll: async (key: string) => FirebaseService.getAll(key),
  add: async (key: string, item: any) => FirebaseService.add(key, item),
  remove: async (key: string, id: string) => FirebaseService.remove(key, id),
  update: async (key: string, updatedItem: any) => FirebaseService.update(key, updatedItem),

  exportData: async () => {
    const backup: Record<string, any> = {};
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

  importData: async (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      for (const [key, value] of Object.entries(data)) {
        if (Object.values(KEYS).includes(key) && Array.isArray(value)) {
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
