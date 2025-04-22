import React, { ReactNode, MouseEvent, KeyboardEvent } from 'react';

import { CardProps } from './Card.types';

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  variant = 'default',
  size = 'medium',
  onClick,
  headerActions,
  footerActions,
  className = '',
  style,
}) => {
  const handleInteraction = (e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onClick?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && onClick) {
      handleInteraction(e);
    }
  };

  const cardClasses = [
    'rounded-lg bg-white',
    variant === 'outlined' ? 'border border-gray-200' : '',
    variant === 'elevated' ? 'shadow-md' : 'shadow-sm',
    size === 'compact' ? 'p-3' : size === 'medium' ? 'p-4 md:p-6' : 'p-6 md:p-8',
    onClick ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : '',
    className,
  ].filter(Boolean).join(' ');

  const headerClasses = [
    'flex justify-between items-start',
    size === 'compact' ? 'mb-3' : size === 'medium' ? 'mb-4' : 'mb-6',
  ].join(' ');

  const contentClasses = size === 'compact' ? 'text-sm' : 'text-base';

  return (
    <div
      className={cardClasses}
      style={style}
      onClick={onClick ? handleInteraction : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
    >
      {(title || headerActions) && (
        <div className={headerClasses}>
          <div>
            {title && <h3 className="font-medium text-gray-700">{title}</h3>}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}

      <div className={contentClasses}>{children}</div>

      {footerActions && (
        <div
          className={[
            'flex justify-end',
            size === 'compact' ? 'mt-3' : size === 'large' ? 'mt-6' : 'mt-4',
          ].join(' ')}
        >
          {footerActions}
        </div>
      )}
    </div>
  );
};

export default Card;