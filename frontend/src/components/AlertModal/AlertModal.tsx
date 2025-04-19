import React, { useId } from 'react';
import { AlertModalProps, AlertType } from './AlertModal.types';
import { useModalAnimation } from './hooks/useModalAnimation';
import { AlertIcon } from './AlertModalIcons';
import styles from './AlertModalStyles.module.css';

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  message,
  type = 'info',
  onClose,
  confirmButtonText = 'OK',
  cancelButtonText = '',
  onConfirm = () => {},
  onCancel = () => {},
  className = '',
  style = {},
  fullScreen = false,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const { shouldRender, isClosing, handleClose } = useModalAnimation({ 
    isOpen, 
    onClose 
  });

  if (!shouldRender) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  const handleCancel = () => {
    onCancel();
    handleClose();
  };

  const getAlertTitle = (type: AlertType): string => {
    switch (type) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      case 'warning': return 'Warning';
      case 'info': default: return 'Information';
    }
  };

  return (
    <div 
      className={`${styles.modalOverlay} ${isClosing ? styles.closing : ''}`}
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div 
        className={`
          ${styles.modalContent} 
          ${fullScreen ? styles.fullScreen : ''} 
          ${styles[type]} 
          ${isClosing ? styles.closingContent : ''} 
          ${className}
        `}
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>
            <AlertIcon type={type} />
          </div>
          <h2 id={titleId} className={styles.modalTitle}>
            {getAlertTitle(type)}
          </h2>
        </div>
        
        <div id={descriptionId} className={styles.modalMessage}>
          {message}
        </div>
        
        <div className={styles.modalFooter}>
          {cancelButtonText && (
            <button 
              className={`${styles.button} ${styles.cancelButton}`} 
              onClick={handleCancel}
              type="button"
            >
              {cancelButtonText}
            </button>
          )}
          <button 
            className={`${styles.button} ${styles.confirmButton}`} 
            onClick={handleConfirm}
            type="button"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};