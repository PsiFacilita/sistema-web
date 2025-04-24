import React, { useEffect, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import Icon from '../Icon/Icon';
import Button from '../Button/Button';

type ModalType = 'success' | 'error' | 'warning' | 'info' | 'question';
type IconType = 'check' | 'alert-circle' | 'info' | 'x'; // Adicione aqui outros se necessário

interface ModalProps {
  isOpen: boolean;
  message?: string;
  type?: ModalType;
  onClose: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  className?: string;
  style?: React.CSSProperties;
  fullScreen?: boolean;
  title?: string;
  showCloseButton?: boolean;
  children?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  message,
  type = 'info',
  onClose,
  confirmButtonText = 'OK',
  cancelButtonText = '',
  onConfirm,
  onCancel,
  className = '',
  style,
  fullScreen = false,
  title,
  showCloseButton = true,
  children,
  size = 'medium',
}) => {
  const nodeRef = useRef(null);
  
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const getIconType = (): IconType => {
    switch (type) {
      case 'success': return 'check';
      case 'error': return 'alert-circle';
      case 'warning': return 'alert-circle';
      case 'question': return 'info';
      default: return 'info';
    }
  };

  const getColorClass = (): string => {
    switch (type) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'question': return 'text-blue-500';
      default: return 'text-blue-500';
    }
  };

  const modalClasses = [
    'fixed inset-0 z-50 flex items-center justify-center p-4',
    fullScreen ? 'bg-white' : 'bg-black bg-opacity-50',
    className,
  ].join(' ');

  const sizeClasses = {
    small: 'max-w-sm',
    medium: 'max-w-lg',
    large: 'max-w-3xl',
  };

  const contentClasses = [
    'bg-white rounded-lg shadow-xl transform transition-all relative',
    fullScreen ? 'w-full h-full' : `${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`,
  ].join(' ');

  return (
    <CSSTransition 
      in={isOpen} 
      timeout={300} 
      classNames="modal" 
      unmountOnExit
      nodeRef={nodeRef}
    >
      <div
        ref={nodeRef}
        className={modalClasses}
        style={style}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className={contentClasses}>
          {showCloseButton && (
            <button
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={onClose}
              aria-label="Fechar modal"
            >
              <Icon type="x" size={24} />
            </button>
          )}

          <div className="p-6">
            {(title || message) && (
              <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${getColorClass()} bg-opacity-20 mb-4 sm:mb-0 sm:mr-4`}>
                  <Icon type={getIconType()} size={24} />
                </div>

                <div className="mt-3 flex-1">
                  {title && (
                    <h3 id="modal-title" className="text-lg leading-6 font-medium text-gray-900">
                      {title}
                    </h3>
                  )}
                  {message && (
                    <div id="modal-description" className="mt-2">
                      <p className="text-sm text-gray-500 whitespace-pre-line">
                        {message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {children}

            {(confirmButtonText || cancelButtonText) && (
              <div className={`mt-6 flex ${cancelButtonText ? 'justify-between' : 'justify-end'}`}>
                {cancelButtonText && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onCancel?.();
                      onClose();
                    }}
                    className="mr-2"
                  >
                    {cancelButtonText}
                  </Button>
                )}
                <Button
                  variant={type === 'error' ? 'danger' : 'primary'}
                  onClick={() => {
                    onConfirm?.();
                    onClose();
                  }}
                >
                  {confirmButtonText}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </CSSTransition>
  );
};

export default Modal;

