import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
    } catch (e: any) {
      alert('Erro ao fazer login: ' + e.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo-box">F</div>
        <h1 className="login-title">Finanças Pro</h1>
        <p className="login-subtitle">Seu controle financeiro pessoal simplificado e seguro.</p>
        
        <button onClick={handleLogin} className="btn-login-google">
          Entrar com Google
        </button>
        
        <p className="login-footer">
          Seus dados são protegidos pela criptografia do Google.
        </p>
      </div>
    </div>
  );
};
