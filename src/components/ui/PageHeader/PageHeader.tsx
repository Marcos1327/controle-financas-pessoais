import React from 'react';
import { Menu } from 'lucide-react';
import './PageHeader.css';

interface PageHeaderProps {
  breadcrumb: string;
  current: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ breadcrumb, current, onMenuClick, actions }) => {
  return (
    <header className="page-header">
      <div className="header-left">
        <button className="btn-toggle-sidebar mobile-only" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <div className="breadcrumb">
          {breadcrumb} / <span>{current}</span>
        </div>
      </div>
      <div className="header-actions">
        {actions}
      </div>
    </header>
  );
};
