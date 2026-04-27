import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Verificação de segurança para evitar crash na inicialização do preview do ai studio
if (!firebaseConfig.apiKey && import.meta.env.DEV) {
  console.warn("Aviso: Variáveis de ambiente do Firebase não encontradas. Certifique-se de configurá-las no menu de Settings.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)');
const provider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);
export const watchAuthState = (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback);
