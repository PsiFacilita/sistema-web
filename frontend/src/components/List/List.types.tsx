import { ReactNode } from 'react';

export interface ListProps<T> {
    items: T[];
    renderItem?: (item: T, index: number) => ReactNode;
    keyExtractor?: (item: T, index: number) => string;
    onItemClick?: (item: T, index: number) => void;
    className?: string;
    style?: React.CSSProperties;
    emptyMessage?: string;
    loading?: boolean;
    loadingComponent?: ReactNode;
    divider?: boolean;
    scrollable?: boolean;
    maxHeight?: string;
  }
