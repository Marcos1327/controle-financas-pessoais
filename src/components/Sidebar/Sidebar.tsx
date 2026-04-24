import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  CreditCard, 
  ShoppingCart, 
  List, 
  ChevronUp, 
  LogOut, 
  ChevronsLeft, 
  ChevronsRight,
  X,
  Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isVisible, onClose }) => {
  const { user, handleLogout } = useAuth();
  const [collapsed, setCollapsed] = useState(localStorage.getItem('sidebar-collapsed') === 'true');
  const [showLogout, setShowLogout] = useState(false);

  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  const menuItems = [
    { path: '/', label: 'Visão Geral', icon: <LayoutDashboard size={20} /> },
    { path: '/dividas-fixas', label: 'Dívidas Fixas', icon: <Calendar size={20} /> },
    { path: '/parceladas', label: 'Parcelamentos', icon: <CreditCard size={20} /> },
    { path: '/avulsas', label: 'Compras Avulsas', icon: <ShoppingCart size={20} /> },
    { path: '/categorias', label: 'Categorias', icon: <List size={20} /> },
    { path: '/cartoes', label: 'Meus Cartões', icon: <CreditCard size={20} /> },
  ];

  return (
    <>
      <div 
        className={`sidebar-overlay ${isVisible ? 'active' : ''}`} 
        onClick={onClose}
      />
      
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${isVisible ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <h1>Finanças Pro</h1>
          </div>
          <button className="btn-collapse desktop-only" onClick={toggleCollapse}>
            {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          </button>
          <button className="btn-close-mobile mobile-only" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title={item.label}
              onClick={() => { if(window.innerWidth <= 1024) onClose(); }}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="user-profile" onClick={() => setShowLogout(!showLogout)}>
          <div className="user-info-row">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="user-img" />
            ) : (
              <div className="user-avatar-placeholder">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div className="user-text">
              <p className="user-name">{user?.displayName || 'Usuário'}</p>
              <p className="user-email">{user?.email}</p>
            </div>
            <ChevronUp 
              size={14} 
              className={`profile-arrow ${showLogout ? 'active' : ''}`} 
            />
          </div>
          
          {showLogout && (
            <button className="btn-logout" onClick={(e) => {
              e.stopPropagation();
              if (confirm('Deseja sair do sistema?')) handleLogout();
            }}>
              <LogOut size={14} />
              <span>Sair da conta</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
