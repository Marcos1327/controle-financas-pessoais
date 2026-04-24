import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { watchAuthState, loginWithGoogle, logout } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<any>;
  handleLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = watchAuthState((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login: loginWithGoogle, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
