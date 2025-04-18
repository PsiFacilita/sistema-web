import React from 'react';
import Button from './Button'; 
import { FaBeer } from 'react-icons/fa';

const ButtonTeste: React.FC = () => {
  const handleClick = () => {
    alert('Botão clicado!');
  };

  return (
    <div>
      <h1>Teste do Componente Button</h1>

      {/* Teste de renderizar com texto */}
      <Button label="Clique aqui" onClick={handleClick} />

      {/* Teste de renderizar com ícone */}
      <Button label="Ícone" icon={<FaBeer />} onClick={handleClick} />

      {/* Teste de renderizar botão desabilitado */}
      <Button label="Desabilitado" disabled onClick={handleClick} />

      {/* Teste de renderizar estado de carregamento */}
      <Button label="Carregando" loading loadingText="Salvando..." onClick={handleClick} />

      {/* Teste de aplicar classe personalizada */}
      <Button label="Custom" className="minha-classe" onClick={handleClick} />

      {/* Teste de aplicar estilos inline */}
      <Button label="Estilo" style={{ backgroundColor: 'red' }} onClick={handleClick} />
    </div>
  );
};

export default ButtonTeste;
