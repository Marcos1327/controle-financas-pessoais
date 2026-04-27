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
  subscribe: (key: string, callback: (items: any[]) => void) => FirebaseService.subscribe(key, callback),
  add: async (key: string, item: any) => FirebaseService.add(key, item),
  remove: async (key: string, id: string) => FirebaseService.remove(key, id),
  update: async (key: string, updatedItem: any) => FirebaseService.update(key, updatedItem),
};
