import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { ButtonProps } from './Button.types';
import Spinner  from '../Spinner/Spinner';

const Button: React.FC<ButtonProps> = ({
  label = '',
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  loadingText = 'Carregando...',
  icon,
  size = 'md',
  className = '',
  style,
  fullWidth = false,
  children,
  ...props
}) => {
  // Classes base
  const baseClasses = 'flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Variantes
  const variantClasses = {
    primary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    secondary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500'
  };

  // Tamanhos
  const sizeClasses = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3'
  };

  // Estado disabled
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  // Estado loading
  const loadingClasses = loading ? 'cursor-wait' : '';
  
  // Largura
  const widthClass = fullWidth ? 'w-full' : '';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }
    onClick?.();
  };

  return (
    <button
      type="button"
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${loadingClasses} ${widthClass} ${className}`}
      style={style}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size={size} className="mr-2" />
          {loadingText}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {label || children}
        </>
      )}
    </button>
  );
};

export default Button;