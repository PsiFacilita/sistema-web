export type CardVariant = 'default' | 'outlined' | 'elevated';
export type CardSize = 'compact' | 'medium' | 'large';

export interface CardProps {
  /**
   * Título do card
   */
  title?: string;
  
  /**
   * Subtítulo ou descrição adicional
   */
  subtitle?: string;
  
  /**
   * Conteúdo interno do card
   */
  children?: React.ReactNode;
  
  /**
   * Estilo visual do card (com borda, com sombra, etc.)
   * @default 'default'
   */
  variant?: CardVariant;
  
  /**
   * Tamanho do card
   * @default 'medium'
   */
  size?: CardSize;
  
  /**
   * Evento de clique, se o card for interativo
   */
  onClick?: () => void;
  
  /**
   * Ações adicionais exibidas no topo do card
   */
  headerActions?: React.ReactNode;
  
  /**
   * Ações adicionais exibidas no rodapé do card
   */
  footerActions?: React.ReactNode;
  
  /**
   * Classe CSS adicional para customizar o estilo do card
   */
  className?: string;
  
  /**
   * Objeto de estilos inline
   */
  style?: React.CSSProperties;
}