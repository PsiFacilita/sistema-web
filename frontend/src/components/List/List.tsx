import React, { JSX } from 'react';
import './List.css';

import { ListProps } from './List.types';

/**
 * Componente List reutilizável para exibir dados de forma dinâmica e personalizável
 * 
 * @template T - Tipo genérico que representa o tipo dos itens da lista
 */
function List<T>({
  items = [],
  renderItem = (item: T) => <span>{String(item)}</span>,
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
      <div className={`list-container ${className}`} style={containerStyle} aria-busy="true" aria-live="polite">
        {loadingComponent}
      </div>
    ) : (
      <div className={`list-container ${className}`} style={containerStyle} aria-busy="true" aria-live="polite">
        <div className="list-loading" role="status">Carregando...</div>
      </div>
    );
  }

  // Renderiza a mensagem de lista vazia se não houver itens
  if (items.length === 0) {
    return (
      <div className={`list-container ${className}`} style={containerStyle} aria-label={emptyMessage}>
        <div className="list-empty" role="status">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={`list-container ${className}`} style={containerStyle} data-testid="list-container">
      <ul className="list" role="list">
        {items.map((item, index) => (
          <React.Fragment key={keyExtractor(item, index)}>
            <li
              className="list-item"
              onClick={() => onItemClick(item, index)}
              data-testid={`list-item-${index}`}
              role="listitem"
            >
              {renderItem(item, index)}
            </li>
            {divider && index < items.length - 1 && <div className="list-divider" role="separator" />}
          </React.Fragment>
        ))}
      </ul>
    </div>
  );
}

export default List;

