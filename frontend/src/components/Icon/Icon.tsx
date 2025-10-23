import React from 'react';
import * as FiIcons from 'react-icons/fi';
import { IconProps } from './Icon.types';

const Icon: React.FC<IconProps> = ({
  type,
  size = 20,
  color,
  className = '',
  style,
  onClick,
  ...props
}) => {
  const iconMap = {
    dashboard: FiIcons.FiPieChart,
    calendar: FiIcons.FiCalendar,
    users: FiIcons.FiUsers,
    folder: FiIcons.FiFolder,
    settings: FiIcons.FiSettings,
    logout: FiIcons.FiLogOut,
    plus: FiIcons.FiPlus,
    search: FiIcons.FiSearch,
    edit: FiIcons.FiEdit,
    trash: FiIcons.FiTrash,
    'chevron-down': FiIcons.FiChevronDown,
    'chevron-up': FiIcons.FiChevronUp,
    check: FiIcons.FiCheck,
    x: FiIcons.FiX,
    'info': FiIcons.FiInfo,
    'alert-circle': FiIcons.FiAlertCircle,
    eye: FiIcons.FiEye, // Adicionando o ícone do olho
  };

  const IconComponent = iconMap[type];

  if (!IconComponent) {
    console.warn(`Icon type "${type}" not found`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      className={`inline-block ${className}`}
      style={style}
      onClick={onClick}
      {...props}
    />
  );
};

export default Icon;