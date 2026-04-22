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
  'fp_dividas_fixas': 'dividas_fixas',
  'fp_dividas_parceladas': 'dividas_parceladas',
  'fp_compras_avulsas': 'compras_avulsas'
};

export const FirebaseService = {
  /**
   * Retorna todos os itens de uma coleção FILTRADOS POR USUÁRIO
   */
  getAll: async (storageKey) => {
    const colName = COLLECTION_MAP[storageKey];
    const user = auth.currentUser;
    if (!colName || !user) return [];

    try {
      const q = query(collection(db, colName), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
      }));
    } catch (e) {
      console.error(`Erro ao ler coleção ${colName}`, e);
      return [];
    }
  },

  /**
   * Adiciona um item com o ID do usuário
   */
  add: async (storageKey, item) => {
    const colName = COLLECTION_MAP[storageKey];
    const user = auth.currentUser;
    if (!colName || !user) return;

    try {
      const { id, ...data } = item;
      const dataWithUser = { ...data, userId: user.uid };
      
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
      const dataWithUser = { ...data, userId: user.uid };
      const docRef = doc(db, colName, id);
      await updateDoc(docRef, dataWithUser);
    } catch (e) {
      console.error(`Erro ao atualizar em ${colName}`, e);
    }
  }
};
