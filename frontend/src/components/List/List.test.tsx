import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import List from './List';

describe('List Component', () => {
  const mockItems = ['Item 1', 'Item 2', 'Item 3'];
  const mockComplexItems = [
    { id: 1, name: 'Item 1', description: 'Description 1' },
    { id: 2, name: 'Item 2', description: 'Description 2' },
    { id: 3, name: 'Item 3', description: 'Description 3' },
  ];

  // Teste de renderização básica
  test('renderiza a lista corretamente com itens simples', () => {
    render(<List items={mockItems} />);
    
    expect(screen.getByTestId('list-container')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(mockItems.length);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  // Teste com itens complexos e renderItem customizado
  test('renderiza a lista corretamente com renderItem customizado', () => {
    render(
      <List 
        items={mockComplexItems} 
        renderItem={(item) => (
          <div>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
          </div>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    );
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
  });

  // Teste para mensagem quando a lista está vazia
  test('exibe mensagem quando a lista está vazia', () => {
    const emptyMessage = 'Lista vazia personalizada';
    render(<List items={[]} emptyMessage={emptyMessage} />);
    
    expect(screen.getByText(emptyMessage)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  // Teste para estado de carregamento
  test('exibe componente de carregamento quando loading=true', () => {
    render(<List items={mockItems} loading={true} />);
    
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  // Teste para componente de carregamento customizado
  test('exibe componente de carregamento customizado', () => {
    render(
      <List 
        items={mockItems} 
        loading={true} 
        loadingComponent={<div>Carregamento customizado</div>} 
      />
    );
    
    expect(screen.getByText('Carregamento customizado')).toBeInTheDocument();
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
  });

  // Teste para evento de clique nos itens
  test('chama onItemClick quando um item é clicado', () => {
    const handleItemClick = jest.fn();
    render(<List items={mockItems} onItemClick={handleItemClick} />);
    
    fireEvent.click(screen.getByText('Item 2'));
    expect(handleItemClick).toHaveBeenCalledWith('Item 2', 1);
  });

  // Teste para renderização de separadores (dividers)
  test('renderiza separadores quando divider=true', () => {
    render(<List items={mockItems} divider={true} />);
    
    // Deve haver (número de itens - 1) separadores
    const dividers = document.getElementsByClassName('list-divider');
    expect(dividers.length).toBe(mockItems.length - 1);
  });

  // Teste para propriedade scrollable
  test('aplica estilo scrollable quando scrollable=true', () => {
    const maxHeight = '200px';
    render(<List items={mockItems} scrollable={true} maxHeight={maxHeight} />);
    
    const container = screen.getByTestId('list-container');
    expect(container).toHaveStyle({
      overflowY: 'auto',
      maxHeight: maxHeight
    });
  });
});