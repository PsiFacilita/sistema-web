import React from 'react';
import styles from './Button.module.css';

type ButtonType = 'primary' | 'secondary' | 'success' | 'error';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  label?: string;
  onClick?: () => void;
  type?: ButtonType;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  size?: ButtonSize;
  className?: string;
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({
  label = '',
  onClick = () => {},
  type = 'primary',
  disabled = false,
  loading = false,
  loadingText = 'Carregando...',
  icon = null,
  size = 'medium',
  className = '',
  style = {}
}) => {
  const isDisabled = disabled || loading;

  const getClassNames = () => {
    return [
      styles.button,
      styles[type],
      styles[size],
      isDisabled ? styles.disabled : '',
      className,
    ].join(' ');
  };

  return (
    <button
      className={getClassNames()}
      onClick={!isDisabled ? onClick : undefined}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      style={style}
    >
      {loading ? (
        <>
          <span className={styles.spinner} />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {icon && <span className={styles.icon}>{icon}</span>}
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
