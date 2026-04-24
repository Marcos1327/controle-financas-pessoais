import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import './Layout.css';

export const Layout: React.FC = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  return (
    <div className="layout-container">
      <Sidebar 
        isVisible={isSidebarVisible} 
        onClose={() => setIsSidebarVisible(false)} 
      />
      <main className="main-content">
        {/* Este botão só aparece no mobile via CSS */}
        <div className="mobile-header-placeholder">
          <button className="mobile-menu-toggle" onClick={() => setIsSidebarVisible(true)}>
            {/* Ícone de menu injetado via CSS ou componente se preferir */}
          </button>
        </div>
        <Outlet context={{ setIsSidebarVisible }} />
      </main>
    </div>
  );
};
