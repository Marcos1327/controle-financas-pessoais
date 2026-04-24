import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  setDoc,
  query,
  where,
  DocumentData,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Transaction } from '../types';

// Mapeamento das chaves do storage para coleções do Firestore
export const COLLECTION_MAP: Record<string, string> = {
  'fp_categorias': 'categorias',
  'fp_cartoes': 'cartoes',
  'fp_dividas_fixas': 'dividas_fixas',
  'fp_dividas_parceladas': 'dividas_parceladas',
  'fp_compras_avulsas': 'compras_avulsas',
  'fp_formas_pagamento': 'formas_pagamento'
};

export const FirebaseService = {
  /**
   * Retorna todos os itens de uma coleção FILTRADOS POR USUÁRIO E ORDENADOS
   */
  getAll: async (storageKey: string): Promise<any[]> => {
    const colName = COLLECTION_MAP[storageKey];
    const user = auth.currentUser;
    if (!colName || !user) return [];

    try {
      const q = query(collection(db, colName), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
      }));

      return FirebaseService.sortItems(items);
    } catch (e) {
      console.error(`Erro ao ler coleção ${colName}`, e);
      return [];
    }
  },

  /**
   * Escuta mudanças em tempo real para uma coleção
   */
  subscribe: (storageKey: string, callback: (items: any[]) => void) => {
    const colName = COLLECTION_MAP[storageKey];
    const user = auth.currentUser;
    if (!colName || !user) return () => {};

    const q = query(collection(db, colName), where("userId", "==", user.uid));
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
      }));
      callback(FirebaseService.sortItems(items));
    }, (error) => {
      console.error(`Erro no listener da coleção ${colName}`, error);
    });
  },

  sortItems: (items: any[]) => {
    return items.sort((a: any, b: any) => {
      if (a.nome && b.nome) {
        return a.nome.localeCompare(b.nome);
      }
      const timeA = a.createdAt || 0;
      const timeB = b.createdAt || 0;
      return timeB - timeA;
    });
  },

  /**
   * Adiciona um item com o ID do usuário e timestamp
   */
  add: async (storageKey: string, item: any): Promise<void> => {
    const colName = COLLECTION_MAP[storageKey];
    const user = auth.currentUser;
    if (!colName || !user) return;

    try {
      const { id, ...data } = item;
      const dataWithUser = { 
        ...data, 
        userId: user.uid,
        createdAt: Date.now()
      };
      
      if (id) {
        await setDoc(doc(db, colName, id), dataWithUser);
      } else {
        await addDoc(collection(db, colName), dataWithUser);
      }
    } catch (e) {
      console.error(`Erro ao adicionar em ${colName}`, e);
    }
  },

  /**
   * Remove um item
   */
  remove: async (storageKey: string, id: string): Promise<void> => {
    const colName = COLLECTION_MAP[storageKey];
    if (!colName) return;

    try {
      await deleteDoc(doc(db, colName, id));
    } catch (e) {
      console.error(`Erro ao remover de ${colName}`, e);
    }
  },

  /**
   * Atualiza um item
   */
  update: async (storageKey: string, item: any): Promise<void> => {
    const colName = COLLECTION_MAP[storageKey];
    const user = auth.currentUser;
    if (!colName || !user) return;

    try {
      const { id, ...data } = item;
      if (!id) throw new Error('ID do documento não fornecido para atualização.');
      
      const dataWithUser = { 
        ...data, 
        userId: user.uid,
        updatedAt: Date.now()
      };
      const docRef = doc(db, colName, id);
      await updateDoc(docRef, dataWithUser as DocumentData);
    } catch (e) {
      console.error(`Erro ao atualizar em ${colName}`, e);
    }
  }
};
