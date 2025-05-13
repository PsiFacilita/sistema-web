export type IconType = 
  | 'dashboard' 
  | 'calendar' 
  | 'users' 
  | 'folder' 
  | 'settings' 
  | 'logout'
  | 'plus'
  | 'search'
  | 'edit'
  | 'trash'
  | 'chevron-down'
  | 'chevron-up'
  | 'check'
  | 'x'
  | 'info'
  | 'alert-circle';

export interface IconProps extends React.SVGAttributes<SVGElement> {
  type: IconType;
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}