import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getTitle = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'Tableau de bord';
    if (pathname.startsWith('/products')) return 'Gestion des produits';
    if (pathname.startsWith('/stock/entries')) return 'Entrées de stock';
    if (pathname.startsWith('/stock/distributions')) return 'Distributions';
    if (pathname.startsWith('/reports')) return 'Rapports';
    if (pathname.startsWith('/admin/users')) return 'Gestion des utilisateurs';
    return 'Gestion de Stock';
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          title={getTitle(location.pathname)}
        />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
