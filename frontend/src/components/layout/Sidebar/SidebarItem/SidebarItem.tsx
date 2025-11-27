import React from 'react';
import { Link } from 'react-router-dom';
import { SidebarItemProps } from './SidebarItem.types';
import Icon from '../../../Icon/Icon';

interface ExtendedSidebarItemProps extends SidebarItemProps {
    onClick?: () => void;
}

const SidebarItem: React.FC<ExtendedSidebarItemProps> = ({ name, icon, path, onClick }) => {
    const baseClass =
        'flex items-center px-3 py-2.5 rounded-lg text-sage-100 hover:bg-sage-600 transition-all duration-300 group';

    if (onClick) {
        return (
            <li>
                <button
                    type="button"
                    onClick={onClick}
                    className={baseClass + ' w-full text-left'}
                >
                    <Icon
                        type={icon}
                        className="mr-2.5 w-5 h-5 group-hover:scale-110 transition-transform"
                    />
                    <span className="font-medium text-base group-hover:text-white">{name}</span>
                </button>
            </li>
        );
    }

    return (
        <li>
            <Link to={path} className={baseClass}>
                <Icon
                    type={icon}
                    className="mr-2.5 w-5 h-5 group-hover:scale-110 transition-transform"
                />
                <span className="font-medium text-base group-hover:text-white">{name}</span>
            </Link>
        </li>
    );
};

export default SidebarItem;
