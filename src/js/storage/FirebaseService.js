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
import { db } from './firebase.js';

// Mapeamento das chaves do localStorage para coleções do Firestore
const COLLECTION_MAP = {
  'fp_categorias': 'categorias',
  'fp_dividas_fixas': 'dividas_fixas',
  'fp_dividas_parceladas': 'dividas_parceladas',
  'fp_compras_avulsas': 'compras_avulsas'
};

export const FirebaseService = {
  /**
   * Retorna todos os itens de uma coleção
   */
  getAll: async (storageKey) => {
    const colName = COLLECTION_MAP[storageKey];
    if (!colName) return [];

    try {
      const querySnapshot = await getDocs(collection(db, colName));
      return querySnapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id // Usamos o ID do Firebase
      }));
    } catch (e) {
      console.error(`Erro ao ler coleção ${colName}`, e);
      return [];
    }
  },

  /**
   * Adiciona um item
   */
  add: async (storageKey, item) => {
    const colName = COLLECTION_MAP[storageKey];
    if (!colName) return;

    try {
      const { id, ...data } = item;
      // Se já tiver ID (vindo de importação por exemplo), usamos ele
      if (id) {
        await setDoc(doc(db, colName, id), data);
      } else {
        await addDoc(collection(db, colName), data);
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
   * Atualiza um item
   */
  update: async (storageKey, item) => {
    const colName = COLLECTION_MAP[storageKey];
    if (!colName) return;

    try {
      const { id, ...data } = item;
      const docRef = doc(db, colName, id);
      await updateDoc(docRef, data);
    } catch (e) {
      console.error(`Erro ao atualizar em ${colName}`, e);
    }
  }
};
