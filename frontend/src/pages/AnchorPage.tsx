import React from "react";
import Anchor from "../components/Anchor/Anchor";

const AnchorPage: React.FC = () => {
  const handleCustomClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    alert("Link clicado com handler personalizado!");
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">Demonstração do Componente Anchor</h1>

      {/* Seção 1: Links Básicos */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Links Básicos</h2>
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <h3 className="text-md font-medium mb-2">Link Padrão</h3>
            <Anchor href="https://example.com">Link para Example.com</Anchor>
          </div>

          <div className="p-4 border rounded">
            <h3 className="text-md font-medium mb-2">Link em Nova Aba</h3>
            <Anchor href="https://example.com" target="_blank">
              Abrir em nova aba
            </Anchor>
          </div>
        </div>
      </section>

      {/* Seção 2: Estados do Link */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Estados do Link</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded">
            <h3 className="text-md font-medium mb-2">Link Desativado</h3>
            <Anchor href="https://example.com" disabled>
              Link desativado
            </Anchor>
          </div>

          <div className="p-4 border rounded">
            <h3 className="text-md font-medium mb-2">Link com Tooltip</h3>
            <Anchor href="https://example.com" title="Este é um tooltip de exemplo">
              Passe o mouse aqui para ver o tooltip
            </Anchor>
          </div>
        </div>
      </section>

      {/* Seção 3: Personalização de Estilo */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Estilos Personalizados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded">
            <h3 className="text-md font-medium mb-2">Com Classes CSS</h3>
            <Anchor
              href="https://example.com"
              className="text-purple-600 font-bold hover:text-purple-800"
            >
              Link estilizado com classes
            </Anchor>
          </div>

          <div className="p-4 border rounded">
            <h3 className="text-md font-medium mb-2">Com Estilos Inline</h3>
            <Anchor
              href="https://example.com"
              style={{ color: "orange", textDecoration: "underline", fontWeight: "bold" }}
            >
              Link com estilo inline
            </Anchor>
          </div>
        </div>
      </section>

      {/* Seção 4: Eventos */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Manipulação de Eventos</h2>
        <div className="p-4 border rounded">
          <h3 className="text-md font-medium mb-2">Com onClick Personalizado</h3>
          <Anchor href="https://example.com" onClick={handleCustomClick}>
            Clique para ver alerta
          </Anchor>
        </div>
      </section>

      {/* Seção 5: Casos de uso avançados */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Casos de Uso Avançados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded">
            <h3 className="text-md font-medium mb-2">Link com Conteúdo Personalizado</h3>
            <Anchor href="https://example.com" className="flex items-center gap-2">
              <span className="inline-block w-5 h-5 bg-blue-500 rounded-full"></span>
              Link com ícone
            </Anchor>
          </div>

          <div className="p-4 border rounded">
            <h3 className="text-md font-medium mb-2">Link como Botão</h3>
            <Anchor
              href="https://example.com"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Botão de Link
            </Anchor>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnchorPage;