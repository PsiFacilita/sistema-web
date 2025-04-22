import React from 'react';
import SidebarItem from './SidebarItem';
import { SidebarProps } from './Sidebar.types';
import { IconType } from '../../ui/Icon/Icon';
import { XMarkIcon } from '@heroicons/react/24/outline';

const sidebarItems = [
  { name: 'Dashboard', icon: 'dashboard' as IconType, path: '/dashboard' },
  { name: 'Agendamentos', icon: 'calendar' as IconType, path: '/appointments' },
  { name: 'Pacientes', icon: 'users' as IconType, path: '/patients' },
  { name: 'Documentos', icon: 'folder' as IconType, path: '/documents' },
  { name: 'Configurações', icon: 'settings' as IconType, path: '/settings' },
  { name: 'Sair', icon: 'logout' as IconType, path: '/logout' },
];

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  return (
    <div className="w-full h-full bg-green-800 text-white p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold">PsiFacilita</h1>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>
      <nav>
        <ul>
          {sidebarItems.map((item) => (
            <SidebarItem key={item.name} {...item} />
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;