import React from 'react';
import { CardProps } from './Card.types';
import './Card.css';

const Card: React.FC<CardProps> = ({
  title = '',
  subtitle = '',
  children = null,
  variant = 'default',
  size = 'medium',
  onClick,
  headerActions = null,
  footerActions = null,
  className = '',
  style = {},
}) => {
  const isClickable = Boolean(onClick);
  
  const cardClasses = [
    'card',
    variant,
    size,
    isClickable ? 'clickable' : '',
    className,
  ].filter(Boolean).join(' ');

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={cardClasses}
      style={style}
      onClick={isClickable ? handleCardClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {(title || subtitle || headerActions) && (
        <div className="card-header">
          {(title || subtitle) && (
            <div className="card-header-content">
              {title && <h3 className="card-title">{title}</h3>}
              {subtitle && <p className="card-subtitle">{subtitle}</p>}
            </div>
          )}
          
          {headerActions && (
            <div className="card-header-actions">
              {headerActions}
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      {children && (
        <div className="card-content">
          {children}
        </div>
      )}
      
      {footerActions && (
        <div className="card-footer">
          {footerActions}
        </div>
      )}
    </div>
  );
};

export default Card;