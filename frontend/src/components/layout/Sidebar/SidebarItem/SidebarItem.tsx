import React from 'react';
import { Link } from 'react-router-dom';
import { SidebarItemProps } from './SidebarItem.types';
import Icon from '../../../Icon/Icon';

const SidebarItem: React.FC<SidebarItemProps> = ({ name, icon, path }) => {
  return (
    <li className="mb-2">
      <Link
        to={path}
        className="flex items-center p-3 rounded-lg hover:bg-green-700 transition-colors"
      >
        <Icon type={icon} className="mr-3 w-5 h-5" />
        <span className="text-sm md:text-base">{name}</span>
      </Link>
    </li>
  );
};

export default SidebarItem;