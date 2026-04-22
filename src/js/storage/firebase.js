import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Inicializa autenticação anônima para que possamos usar Security Rules
// sem que o usuário precise fazer login manual.
export const initAuth = async () => {
  try {
    return await signInAnonymously(auth);
  } catch (error) {
    if (error.code === 'auth/admin-restricted-operation') {
      console.warn("⚠️ Firebase: Login Anônimo desativado no console. Os dados podem não carregar até que você o ative.");
      return null; // Retorna null em vez de travar
    }
    throw error;
  }
};
