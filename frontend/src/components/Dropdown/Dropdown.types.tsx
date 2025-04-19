import React from 'react';

export interface DropdownOption {
  value: string | number;
  label: string;
}

export interface DropdownProps {
  /** Lista de opções a serem exibidas no dropdown */
  options: DropdownOption[];
  
  /** Valor da opção selecionada (string/number para seleção única, array para múltipla) */
  value: string | number | (string | number)[];
  
  /** Função executada ao selecionar uma opção */
  onChange: (value: string | number | (string | number)[]) => void;
  
  /** Texto exibido quando nenhuma opção está selecionada */
  placeholder?: string;
  
  /** Define se o select estará desativado */
  disabled?: boolean;
  
  /** Define se será possível selecionar múltiplas opções */
  multiple?: boolean;
  
  /** Define se será possível buscar opções no dropdown */
  searchable?: boolean;
  
  /** Classe CSS para customizar o estilo do select */
  className?: string;
  
  /** Objeto de estilos inline */
  style?: React.CSSProperties;
  
  /** Define se o dropdown será fechado automaticamente após a seleção */
  closeOnSelect?: boolean;
  
  /** Mensagem exibida quando não há opções correspondentes */
  noOptionsMessage?: string;
}