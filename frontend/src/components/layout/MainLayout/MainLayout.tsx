import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import { MainLayoutProps } from './MainLayout.types';
import { Bars3Icon } from '@heroicons/react/24/outline';

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - versão desktop (sempre visível) */}
      <div className="hidden md:block fixed inset-y-0 z-30 w-64">
        <Sidebar />
      </div>

      {/* Sidebar - versão mobile (controlada por estado) */}
      <div className={`md:hidden fixed inset-y-0 z-40 w-64 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Conteúdo principal */}
      <main className="flex-1 md:ml-64 min-h-screen overflow-y-auto">
        <div className="p-4 md:p-8">
          {/* Botão hamburger visível só em mobile */}
          <button
            className="md:hidden p-2 mb-4 rounded-md bg-white shadow"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          </button>

          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
