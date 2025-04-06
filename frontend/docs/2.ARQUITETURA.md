# 🏗️ Arquitetura

## 📋 Visão Geral

O frontend do sistema web é desenvolvido com React, TypeScript e com uma arquitetura modular que favorece a manutenção, testabilidade e reutilização de código. A aplicação segue os princípios SOLID e padrões de design modernos para garantir escalabilidade.

- **Camada de visualização**: Pages e Components
- **Camada de lógica**: Hooks, Stores
- **Camada de serviços**: Comunicação com APIs
- **Camada de utilitários**: Funções helpers e formatações

## 🧱 Estrutura de Diretórios

```markdown
frontend/
├── public/             # Arquivos estáticos
├── src/
│   ├── assets/         # Imagens, fontes e outros recursos estáticos
│   ├── components/     # Componentes reutilizáveis
│   │   ├── common/     # Componentes base (Button, Input, etc.)
│   │   ├── layout/     # Componentes de layout (Header, Sidebar, etc.)
│   │   └── modules/    # Componentes específicos de módulos
│   ├── pages/          # Componentes de páginas
│   ├── styles/         # Estilos globais e temas
│   └── utils/          # Funções utilitárias
├── tests/              # Testes
└── docs/               # Documentação
```

## 📚 Camadas da Aplicação

1. Camada de Visualização

**Pages**

- Representam rotas/páginas completas da aplicação
- Orquestram componentes e lógica de negócio
- Conectam-se com a camada de lógica para obter e manipular dados
- Convenção de nomenclatura: [Nome]Page.tsx

**Components**

- Divididos em três categorias:
    - Common: Componentes base reutilizáveis (buttons, inputs, modals)
    - Layout: Estrutura visual da aplicação (headers, sidebars, footers)
    - Modules: Componentes específicos de domínio

**Estrutura interna de um componente:**

```markdown
ComponentName/
├── index.ts                    # Exporta o componente
├── ComponentName.tsx           # Implementação principal
├── ComponentName.module.css    # Estilos específicos do componente
├── ComponentNameTypes.ts       # Interfaces e tipos
├── hooks/                      # Hooks específicos do componente
│   └── useComponentName.ts
└── __tests__/                  # Testes do componente
    └── ComponentName.test.tsx
```

---

Esta documentação de arquitetura serve como guia para o dessenvolvimento consistente e manutenção do projeto.

Conforme a aplicação evolui, esse documento deve ser atualizado, para refletir as mudanças na arquitetura
