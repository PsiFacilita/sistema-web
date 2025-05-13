import { ReactNode } from 'react';

type CardVariant = 'default' | 'outlined' | 'elevated';
type CardSize = 'compact' | 'medium' | 'large';

export interface CardProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  onClick?: () => void;
  headerActions?: ReactNode;
  footerActions?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}