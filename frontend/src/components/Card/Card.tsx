import React, { MouseEvent, KeyboardEvent } from 'react';
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
    'rounded-xl bg-white',
    variant === 'outlined' ? 'border border-sage-200' : 'border-0',
    variant === 'elevated' ? 'shadow-lg' : '', // Só aplica shadow na variante elevated
    size === 'compact' ? 'p-4' : size === 'medium' ? 'p-6' : 'p-8',
    onClick ? 'cursor-pointer hover:shadow-xl transition-all duration-300' : '',
    className,
  ].filter(Boolean).join(' ');

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
        <div className="flex justify-between items-start mb-4">
          <div>
            {title && <h3 className="font-medium text-sage-800 text-lg">{title}</h3>}
            {subtitle && (
              <p className="text-sm text-sage-600 mt-1">{subtitle}</p>
            )}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}

      <div className="text-sage-700">{children}</div>

      {footerActions && (
        <div className="flex justify-end mt-6">
          {footerActions}
        </div>
      )}
    </div>
  );
};

export default Card;