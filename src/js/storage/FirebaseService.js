import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  setDoc,
  query,
  where
} from 'firebase/firestore';
import { db, auth } from './firebase.js';

// Mapeamento das chaves do localStorage para coleções do Firestore
const COLLECTION_MAP = {
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
  getAll: async (storageKey) => {
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

      // Ordenação Inteligente no Cliente (evita necessidade de criar índices no Firebase)
      // 1. Prioridade para compras que têm o campo "data" (YYYY-MM-DD), mais recentes primeiro
      // 2. Fallback para a data em que o registro foi criado no sistema
      return items.sort((a, b) => {
        if (a.data && b.data) {
          return b.data.localeCompare(a.data);
        }
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        return timeB - timeA;
      });
    } catch (e) {
      console.error(`Erro ao ler coleção ${colName}`, e);
      return [];
    }
  },

  /**
   * Adiciona um item com o ID do usuário e timestamp
   */
  add: async (storageKey, item) => {
    const colName = COLLECTION_MAP[storageKey];
    const user = auth.currentUser;
    if (!colName || !user) return;

    try {
      const { id, ...data } = item;
      const dataWithUser = { 
        ...data, 
        userId: user.uid,
        createdAt: Date.now() // Timestamp de criação
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
  remove: async (storageKey, id) => {
    const colName = COLLECTION_MAP[storageKey];
    if (!colName) return;

    try {
      await deleteDoc(doc(db, colName, id));
    } catch (e) {
      console.error(`Erro ao remover de ${colName}`, e);
    }
  },

  /**
   * Atualiza um item garantindo que o userId seja mantido
   */
  update: async (storageKey, item) => {
    const colName = COLLECTION_MAP[storageKey];
    const user = auth.currentUser;
    if (!colName || !user) return;

    try {
      const { id, ...data } = item;
      if (!id) throw new Error('ID do documento não fornecido para atualização.');
      
      const dataWithUser = { 
        ...data, 
        userId: user.uid,
        updatedAt: Date.now() // Timestamp da última atualização
      };
      const docRef = doc(db, colName, id);
      await updateDoc(docRef, dataWithUser);
    } catch (e) {
      console.error(`Erro ao atualizar em ${colName}`, e);
    }
  }
};
