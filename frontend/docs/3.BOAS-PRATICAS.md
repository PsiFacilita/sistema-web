# 🛠️ Padrões e Boas Práticas

Este guia reúne as principais boas práticas adotadas no desenvolvimento da aplicação frontend com **React** + **TypeScript**, com foco em legibilidade, reusabilidade, escalabilidade e manutenção do código.

---

## 📦 Estrutura de Projeto

- Organize o projeto por domínio ou função (`components`, `pages`, `hooks`, `services`, etc.)

- Evite pastas genéricas como `utils2` ou `components_old`

- Agrupe arquivos relacionados (ex: componente + estilo + teste)

```css
/components
  /Button
    Button.tsx
    Button.test.tsx
    Button.styles.ts
```

---

## 🧱 Componentização

- Use componentes pequenos e reutilizáveis

- Siga o princípio da responsabilidade única

- Nomeie os componentes com PascalCase

- Componentes não devem conter lógica de negócio complexa

```tsx
// ❌ Errado
const UserForm = () => {
  const [users, setUsers] = useState([]);
  // faz chamada API aqui...

// ✅ Certo
const UserForm = () => {
  const { users } = useUserData(); // hook separado
```

---

## ✍️ Nomenclatura

- Componentes: `UserCard`, `LoginForm`, `Header`

- Variáveis e funções: `camelCase`

- Estados: `isLoading`, `hasError`, `userName`

---

## 🧠 Estado e Hooks

- Use `useState` e `useEffect` apenas quando necessário

- Crie hooks customizados para lógica reutilizável

```tsx
export function useAuth() {
  const { user, token } = useAuthStore();
  return { user, token };
}
```

---

## 🧩 Props e Tipagem

- Sempre tipar props com `interface` ou `type`

- Nomeie as props de forma clara

```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}
```

---

## 🎨 Estilização

- Utilize Tailwind CSS

- Evite estilos inline

- Crie classes reutilizáveis ou components estilizados quando possível

```tsx
<AlertModal 
        isOpen={isModalOpen}
        message="Esse alerta é uma mensagem importante!"
        type="success"
        onClose={() => setIsModalOpen(false)}
        confirmButtonText="Got it"
        cancelButtonText="Dismiss"
        onConfirm={() => console.log('Confirmado!')}
        onCancel={() => console.log('Cancelado!')}
      />
```

---

## 📂 Imports e Organização

- Use imports absolutos com alias (@/components, @/services)

- Agrupe e ordene os imports: libs externas, libs internas, estilos

```ts
// Bom
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import './style.css';
```

---

## 🧼 Limpeza e Manutenção

- Evite código comentado ou não utilizado

- Remova `console.log` antes de fazer merge

- Crie commits limpos e descritivos, como:

```bash
git commit -m "feat: criando componente de botão com variantes"
```
