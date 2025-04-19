import React, { ReactNode } from 'react';
import './List.css';

import { ListProps } from './List.types';

/**
 * Componente List reutilizável para exibir dados de forma dinâmica e personalizável
 * 
 * @template T - Tipo genérico que representa o tipo dos itens da lista
 */
function List<T>({
  items = [],
  renderItem = (item: any) => <span>{String(item)}</span>,
  keyExtractor = (_, index) => index.toString(),
  onItemClick = () => {},
  className = "",
  style = {},
  emptyMessage = "Nenhum item disponível",
  loading = false,
  loadingComponent = null,
  divider = false,
  scrollable = false,
  maxHeight = "400px"
}: ListProps<T>): JSX.Element {
  
  // Estilo condicional para listas roláveis
  const containerStyle: React.CSSProperties = {
    ...style,
    ...(scrollable ? { 
      overflowY: 'auto',
      maxHeight
    } : {})
  };

  // Renderiza o componente de carregamento se loading=true
  if (loading) {
    return loadingComponent ? (
      <div className={`list-container ${className}`} style={containerStyle}>
        {loadingComponent}
      </div>
    ) : (
      <div className={`list-container ${className}`} style={containerStyle}>
        <div className="list-loading">Carregando...</div>
      </div>
    );
  }

  // Renderiza a mensagem de lista vazia se não houver itens
  if (items.length === 0) {
    return (
      <div className={`list-container ${className}`} style={containerStyle}>
        <div className="list-empty">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={`list-container ${className}`} style={containerStyle} data-testid="list-container">
      <ul className="list">
        {items.map((item, index) => (
          <React.Fragment key={keyExtractor(item, index)}>
            <li
              className="list-item"
              onClick={() => onItemClick(item, index)}
              data-testid={`list-item-${index}`}
            >
              {renderItem(item, index)}
            </li>
            {divider && index < items.length - 1 && <div className="list-divider" />}
          </React.Fragment>
        ))}
      </ul>
    </div>
  );
}

export default List;

