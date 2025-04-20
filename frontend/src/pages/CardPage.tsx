import React, { useState } from 'react';
import Card from '../components/Card/Card';

const CardPage: React.FC = () => {
  const [clickCount, setClickCount] = useState<number>(0);

  const handleCardClick = () => {
    setClickCount(prev => prev + 1);
  };

  return (
    <div className="card-test-page">
      <h1>Exemplos de Cards</h1>
      
      <section className="card-section">
        <h2>Variantes de Cards</h2>
        <div className="cards-grid">
          <Card 
            title="Card Padrão"
            subtitle="Variante default"
            variant="default"
          >
            <p>Este é um card com estilo padrão.</p>
          </Card>

          <Card 
            title="Card com Borda"
            subtitle="Variante outlined"
            variant="outlined"
          >
            <p>Este card tem uma borda ao redor.</p>
          </Card>

          <Card 
            title="Card Elevado"
            subtitle="Variante elevated"
            variant="elevated"
          >
            <p>Este card tem efeito de elevação com sombra.</p>
          </Card>
        </div>
      </section>

      <section className="card-section">
        <h2>Tamanhos de Cards</h2>
        <div className="cards-grid">
          <Card 
            title="Card Compacto"
            subtitle="Tamanho compact"
            variant="outlined"
            size="compact"
          >
            <p>Card com espaçamento menor.</p>
          </Card>

          <Card 
            title="Card Médio"
            subtitle="Tamanho medium (padrão)"
            variant="outlined"
            size="medium"
          >
            <p>Card com espaçamento médio.</p>
          </Card>

          <Card 
            title="Card Grande"
            subtitle="Tamanho large"
            variant="outlined"
            size="large"
          >
            <p>Card com espaçamento maior.</p>
          </Card>
        </div>
      </section>

      <section className="card-section">
        <h2>Cards Interativos</h2>
        <div className="cards-grid">
          <Card 
            title="Card Clicável"
            subtitle="Clique para testar"
            variant="elevated"
            onClick={handleCardClick}
          >
            <p>Este card inteiro é clicável. Número de cliques: {clickCount}</p>
          </Card>

          <Card 
            title="Card com Ações no Cabeçalho"
            subtitle="Botões no topo do card"
            variant="outlined"
            headerActions={
              <div className="action-buttons">
                <button className="action-button">Editar</button>
                <button className="action-button">X</button>
              </div>
            }
          >
            <p>Este card tem botões de ação no cabeçalho.</p>
          </Card>

          <Card 
            title="Card com Ações no Rodapé"
            subtitle="Botões na parte inferior"
            variant="outlined"
            footerActions={
              <div className="action-buttons">
                <button className="action-button">Cancelar</button>
                <button className="action-button primary">Salvar</button>
              </div>
            }
          >
            <p>Este card tem botões de ação no rodapé.</p>
          </Card>
        </div>
      </section>

      <section className="card-section">
        <h2>Conteúdo Personalizado</h2>
        <div className="cards-grid">
          <Card 
            variant="elevated"
            className="image-card"
          >
            <img 
              src="https://via.placeholder.com/300x200" 
              alt="Imagem de exemplo" 
              className="card-image"
            />
            <h3>Card com Imagem</h3>
            <p>Cards podem conter qualquer tipo de conteúdo.</p>
          </Card>

          <Card 
            title="Card com Formulário"
            variant="outlined"
          >
            <form className="sample-form">
              <div className="form-field">
                <label>Nome</label>
                <input type="text" placeholder="Digite seu nome" />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input type="email" placeholder="Digite seu email" />
              </div>
            </form>
          </Card>

          <Card 
            variant="elevated"
            style={{ backgroundColor: '#f8f4ff', borderLeft: '4px solid #6200ee' }}
          >
            <h3>Card Personalizado</h3>
            <p>Este card usa estilos personalizados via prop 'style'.</p>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default CardPage;