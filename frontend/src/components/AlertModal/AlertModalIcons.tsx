import React from 'react';
import { AlertType } from './AlertModal.types';

interface AlertIconProps {
  type: AlertType;
}

export const AlertIcon: React.FC<AlertIconProps> = ({ type }) => {
  switch (type) {
    case 'success':
      return <span role="img" aria-label="success">✅</span>;
    case 'error':
      return <span role="img" aria-label="error">❌</span>;
    case 'warning':
      return <span role="img" aria-label="warning">⚠️</span>;
    case 'info':
    default:
      return <span role="img" aria-label="info">ℹ️</span>;
  }
};