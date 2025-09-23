import React from 'react';
import SidebarItem from './SidebarItem/SidebarItem';
import { SidebarProps } from './Sidebar.types';
import { IconType } from '../../Icon/Icon.types';
import { XMarkIcon } from '@heroicons/react/24/outline';

const sidebarItems = [
  { name: 'Dashboard', icon: 'dashboard' as IconType, path: '/dashboard' },
  { name: 'Pacientes', icon: 'users' as IconType, path: '/patients' },
  { name: 'Documentos', icon: 'folder' as IconType, path: '/documents' },
  { name: 'Agendamentos', icon: 'calendar' as IconType, path: '/appointments' },
  { name: 'Configurações', icon: 'settings' as IconType, path: '/settings' },
  { name: 'Sair', icon: 'logout' as IconType, path: '/logout' },
];

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  return (
    <div className="w-full h-full bg-sage-700 text-sage-50 p-6">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-light tracking-wide">PsiFacilita</h1>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-sage-200 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>
      <nav>
        <ul className="space-y-2">
          {sidebarItems.map((item) => (
            <SidebarItem key={item.name} {...item} />
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;