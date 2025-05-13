export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertModalProps {
  isOpen: boolean;
  
  message: string;
  
  type?: AlertType;
  
  onClose: () => void;
  
  confirmButtonText?: string;
  
  cancelButtonText?: string;
  
  onConfirm?: () => void;
  
  onCancel?: () => void;
  
  className?: string;
  
  style?: React.CSSProperties;
  
  fullScreen?: boolean;
}