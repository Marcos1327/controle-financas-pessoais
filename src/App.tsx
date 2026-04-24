import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout/Layout';

// Pages
import { Dashboard } from './pages/Dashboard/Dashboard';
import { LoginPage } from './pages/Login/LoginPage';
import { Installments } from './pages/Installments/Installments';
import { GenericList } from './pages/GenericList/GenericList';
import { KEYS } from './services/StorageService';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="dividas-fixas" element={<GenericList title="Dívidas Fixas" storageKey={KEYS.DIVIDAS_FIXAS} />} />
        <Route path="parceladas" element={<Installments />} />
        <Route path="avulsas" element={<GenericList title="Compras Avulsas" storageKey={KEYS.COMPRAS_AVULSAS} />} />
        <Route path="categorias" element={<GenericList title="Categorias" storageKey={KEYS.CATEGORIAS} />} />
        <Route path="cartoes" element={<GenericList title="Meus Cartões" storageKey={KEYS.CARTOES} />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
