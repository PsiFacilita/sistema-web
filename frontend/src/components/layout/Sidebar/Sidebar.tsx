import React from 'react';
import SidebarItem from './SidebarItem/SidebarItem';
import { SidebarProps } from './Sidebar.types';
import { IconType } from '../../Icon/Icon.types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const sidebarItems = [
    { name: 'Dashboard', icon: 'dashboard' as IconType, path: '/dashboard' },
    { name: 'Pacientes', icon: 'users' as IconType, path: '/patients' },
    { name: 'Documentos', icon: 'folder' as IconType, path: '/documents' },
    { name: 'Agendamentos', icon: 'calendar' as IconType, path: '/appointments' },
    { name: 'Configurações', icon: 'settings' as IconType, path: '/settings' },
    { name: 'Sair', icon: 'logout' as IconType, path: '/logout' },
];

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/', { replace: true });
    };

    return (
        <div className="w-full h-full bg-sage-700 text-sage-50 p-4">
            <div className="flex items-center justify-between mb-7">
                <h1 className="text-2xl font-light tracking-wide">PsiFacilita</h1>
                {onClose && (
                    <button onClick={onClose} className="md:hidden text-sage-200 hover:text-white">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                )}
            </div>
            <nav>
                <ul className="space-y-3">
                    {sidebarItems.map((item) =>
                        item.name === 'Sair' ? (
                            <SidebarItem
                                key={item.name}
                                name={item.name}
                                icon={item.icon}
                                onClick={handleLogout}
                            />
                        ) : (
                            <SidebarItem key={item.name} {...item} />
                        )
                    )}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;
