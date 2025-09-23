import React from 'react';
import { Link } from 'react-router-dom';
import { SidebarItemProps } from './SidebarItem.types';
import Icon from '../../../Icon/Icon';

const SidebarItem: React.FC<SidebarItemProps> = ({ name, icon, path }) => {
  return (
    <li>
      <Link
        to={path}
        className="flex items-center p-3 rounded-lg text-sage-100 hover:bg-sage-600 transition-all duration-300 group"
      >
        <Icon 
          type={icon} 
          className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform" 
        />
        <span className="font-medium group-hover:text-white">{name}</span>
      </Link>
    </li>
  );
};

export default SidebarItem;