// Exemplo de uso do Dropdown em uma página
import React, { useState } from 'react';
import Select from '../components/Dropdown/Dropdown';
import { DropdownOption } from '../components/Dropdown/Dropdown.types';

const TestPage: React.FC = () => {
  // Estado para armazenar o valor selecionado
  const [selectedOption, setSelectedOption] = useState<string | number>('');
  
  // Definindo as opções do dropdown
  const options: DropdownOption[] = [
    { value: 'usuario', label: 'Usuário Regular' },
    { value: 'psicologo', label: 'Psicólogo' },
    { value: 'administrador', label: 'Administrador' }
  ];
  
  // Função para lidar com a mudança de seleção
  const handleChange = (value: string | number | (string | number)[]) => {
    setSelectedOption(value as string | number);
    alert('Opção selecionada: ' + value);
  };

  return (
    <div className="login-page">
      <h1>Bem-vindo à página de Login!</h1>
      
      <div style={{ width: '300px', margin: '20px 0' }}>
        <label htmlFor="user-type">Tipo de Usuário:</label>
        <Select 
          options={options}
          value={selectedOption}
          onChange={handleChange}
          placeholder="Selecione o tipo de usuário"
          searchable={true}
        />
      </div>
      
      {/* Resto do seu formulário de login */}
    </div>
  );
};

export default TestPage;