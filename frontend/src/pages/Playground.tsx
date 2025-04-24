import React, { useState } from 'react';

import Anchor from '../components/ui/Anchor/Anchor';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card/Card';
import Chart from '../components/ui/Chart/Chart';
import Dropdown from '../components/ui/Dropdown';
import Icon, { IconType } from '../components/ui/Icon';
import Input from '../components/ui/Form/Input';
import Title from '../components/ui/Title/Title';
import { AlertModal } from '../components/AlertModal/AlertModal';
import Spinner from '../components/ui/Spinner/Spinner';
import Modal from '../components/ui/Modal/Modal';
import { AlertType } from '../components/AlertModal/AlertModal.types';

type ModalType = 'success' | 'error' | 'warning' | 'info' | 'question';

interface TableColumn<T, K extends keyof T> {
  header: string;
  accessor: K;
  Cell?: React.FC<{ value: T[K] }>;
}

interface TableDataItem {
  id: number;
  name: string;
  email: string;
  status: 'Ativo' | 'Inativo';
}

export const Playground = () => {

  
  const [inputValue, setInputValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [dropdownValue, setDropdownValue] = useState<string | number>();
  const [multiDropdownValue, setMultiDropdownValue] = useState<(string | number)[]>([]);
  const [modalType, setModalType] = useState<AlertType>('info');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Chart data
  const chartData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Novos Pacientes',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: '#3b82f6',
      },
      {
        label: 'Consultas Realizadas',
        data: [8, 15, 10, 12, 7, 9],
        backgroundColor: '#10b981',
      },
    ],
  };

  // Dropdown options
  const dropdownOptions = [
    { value: 'option1', label: 'Opção 1' },
    { value: 'option2', label: 'Opção 2' },
    { value: 'option3', label: 'Opção 3' },
    { value: 'option4', label: 'Opção 4' },
  ];

  const openModal = (type: ModalType) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleSingleSelect = (value: string | number | (string | number)[]) => {
    if (!Array.isArray(value)) {
      setDropdownValue(value);
    }
  };

  const handleMultiSelect = (value: string | number | (string | number)[]) => {
    if (Array.isArray(value)) {
      setMultiDropdownValue(value);
    }
  };

  const noop = () => {};

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Component Playground</h1>
      
     
      {/* Anchor Section */}
      <section className="mb-12 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Anchor Component</h2>
        <div className="flex flex-col gap-2">
          <Anchor href="/">Link normal</Anchor>
          <Anchor href="/dashboard" authRequired unauthorizedRedirectTo="/login">
            Link com auth required
          </Anchor>
          <Anchor href="https://google.com" target="_blank">
            Link externo
          </Anchor>
          <Anchor href="/" disabled>
            Link desabilitado
          </Anchor>
          <Anchor href="/" className="text-blue-600">
            Link com classe customizada
          </Anchor>
        </div>
      </section>

      {/* Button Section */}
      <section className="mb-12 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Button Component</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Variantes</h3>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="success">Success</Button>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Estados</h3>
            <Button disabled>Disabled</Button>
            <Button loading>Loading</Button>
            <Button loading loadingText="Processando...">Custom Loading</Button>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Tamanhos</h3>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Com Ícone</h3>
            <Button icon={<span>🔔</span>}>Notificações</Button>
            <Button icon={<span>➕</span>} variant="outline">Adicionar</Button>
            <Button fullWidth>Full Width</Button>
          </div>
        </div>
      </section>

      {/* Card Section */}
      <section className="mb-12 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Card Component</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Card Padrão" subtitle="Subtítulo opcional">
            <p>Conteúdo do card básico</p>
          </Card>
          
          <Card 
            title="Card com Ações" 
            variant="elevated"
            headerActions={<Button size="sm" variant="outline">Editar</Button>}
            footerActions={
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Cancelar</Button>
                <Button size="sm">Salvar</Button>
              </div>
            }
          >
            <p>Card com ações no cabeçalho e rodapé</p>
          </Card>
          
          <Card 
            title="Card Cliqueável" 
            variant="outlined"
            onClick={() => alert('Card clicado!')}
          >
            <p>Clique neste card para ver a ação</p>
          </Card>
          
          <Card size="compact" title="Card Compacto">
            <p>Versão compacta para espaços menores</p>
          </Card>
        </div>
      </section>

      {/* Chart Section */}
      <section className="mb-12 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Chart Component</h2>
        <div className="space-y-4">
          <Chart data={chartData} />
          <div className="text-sm text-gray-500">
            Gráfico responsivo que se adapta a diferentes tamanhos de tela
          </div>
        </div>
      </section>

      {/* Dropdown Section */}
      <section className="mb-12 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Dropdown Component</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Dropdown Simples</h3>
            <Dropdown
              options={dropdownOptions}
              value={dropdownValue}
              onChange={handleSingleSelect}
              placeholder="Selecione uma opção"
            />
            <div className="text-sm text-gray-500">
              Valor selecionado: {dropdownValue || 'Nenhum'}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Multiplo Seleção</h3>
            <Dropdown
              options={dropdownOptions}
              value={multiDropdownValue}
              onChange={handleMultiSelect}
              multiple
              placeholder="Selecione múltiplas opções"
            />
            <div className="text-sm text-gray-500">
              Valores selecionados: {multiDropdownValue.join(', ') || 'Nenhum'}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Com Busca</h3>
            <Dropdown
              options={dropdownOptions}
              onChange={noop}
              searchable
              placeholder="Digite para buscar..."
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Desabilitado</h3>
            <Dropdown
              options={dropdownOptions}
              onChange={noop}
              disabled
              placeholder="Dropdown desabilitado"
            />
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="mb-12 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Form Components</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h3 className="text-xl font-medium">Input & Label</h3>
            
            <div>
              <Label htmlFor="basic-input">Input Básico</Label>
              <Input
                id="basic-input"
                value={inputValue}
                customOnChange={setInputValue}
                placeholder="Digite algo..."
              />
            </div>
            
            <div>
              <Label htmlFor="email-input" required>Email</Label>
              <Input
                id="email-input"
                type="email"
                value={emailValue}
                customOnChange={setEmailValue}
                placeholder="seu@email.com"
              />
            </div>
            
            <div>
              <Label htmlFor="phone-input">Telefone</Label>
              <Input
                id="phone-input"
                type="tel"
                value={phoneValue}
                customOnChange={setPhoneValue}
                placeholder="(00) 00000-0000"
                mask="(##) #####-####"
              />
            </div>
            
            <div>
              <Label htmlFor="error-input">Input com Erro</Label>
              <Input
                id="error-input"
                error
                helperText="Este campo é obrigatório"
              />
            </div>
            
            <div>
              <Label htmlFor="disabled-input" disabled>Input Desabilitado</Label>
              <Input
                id="disabled-input"
                disabled
                placeholder="Desabilitado"
              />
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-xl font-medium">Combinações</h3>
            
            <div>
              <Label htmlFor="search-input">Campo de Busca</Label>
              <div className="relative">
                <Input
                  id="search-input"
                  type="search"
                  placeholder="Buscar..."
                  className="pl-10"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Icon type="search" size={18} className="text-gray-400" />
                </span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="password-input">Senha</Label>
              <div className="relative">
                <Input
                  id="password-input"
                  type="password"
                  placeholder="Digite sua senha"
                  className="pr-10"
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => alert('Mostrar senha')}
                >
                  <Icon type="alert-circle" size={18} className="text-gray-400" />
                </button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="date-input">Data</Label>
              <div className="flex gap-2">
                <Input
                  id="date-input"
                  type="date"
                  className="flex-1"
                />
                <Button variant="outline">
                  <Icon type="calendar" className="mr-2" />
                  Selecionar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Icon Section */}
      <section className="mb-12 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Icon Component</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {([
            'dashboard', 'calendar', 'users', 'folder', 'settings', 'logout',
            'plus', 'search', 'edit', 'trash', 'chevron-down', 'chevron-up',
            'check', 'x', 'info', 'alert-circle'
          ] as IconType[]).map((iconType) => (
            <div 
              key={iconType}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Icon 
                type={iconType} 
                size={24} 
                className="text-gray-700 mb-2"
              />
              <span className="text-sm text-gray-600 text-center capitalize">
                {iconType.replace('-', ' ')}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 space-y-4">
          <h3 className="text-xl font-medium">Tamanhos</h3>
          <div className="flex items-center gap-4">
            <Icon type="settings" size={16} />
            <Icon type="settings" size={20} />
            <Icon type="settings" size={24} />
            <Icon type="settings" size={32} />
            <Icon type="settings" size={40} />
          </div>
          
          <h3 className="text-xl font-medium">Cores</h3>
          <div className="flex items-center gap-4">
            <Icon type="check" size={24} color="#10B981" />
            <Icon type="x" size={24} color="#EF4444" />
            <Icon type="alert-circle" size={24} color="#F59E0B" />
            <Icon type="info" size={24} color="#3B82F6" />
            <Icon type="edit" size={24} color="#8B5CF6" />
          </div>
        </div>
      </section>

      {/* Modal Section */}
      <section className="mb-12 p-6 border rounded-lg bg-white shadow-sm">
    <Title level={2} className="mb-4">AlertModal Component</Title>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-4">
        <Title level={3}>Tipos de Modal</Title>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => openModal('success')} variant="success">
            Success
          </Button>
          <Button onClick={() => openModal('error')} variant="danger">
            Error
          </Button>
          <Button onClick={() => openModal('warning')} variant="outline">
            Warning
          </Button>
          <Button onClick={() => openModal('info')}>
            Info
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <Title level={3}>Comportamento</Title>
        <Button 
          onClick={() => {
            setModalType('info');
            setIsModalOpen(true);
          }}
        >
          Modal com Ações
        </Button>
      </div>
    </div>

    <AlertModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      type={modalType}
      message={`Esta é uma mensagem de exemplo para o modal do tipo ${modalType}.`}
      confirmButtonText="Confirmar"
      cancelButtonText="Cancelar"
      onConfirm={() => alert('Ação confirmada!')}
    />
  </section>

      {/* Spinner Section */}
      <section className="mb-12 p-6 border rounded-lg bg-white shadow-sm">
        <Title level={2} className="mb-4">Spinner Component</Title>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-4">
            <Title level={3}>Tamanhos</Title>
            <div className="flex items-center gap-4">
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
            </div>
          </div>
          
          <div className="space-y-4">
            <Title level={3}>Cores</Title>
            <div className="flex items-center gap-4">
              <Spinner className="text-blue-500" />
              <Spinner className="text-green-500" />
              <Spinner className="text-red-500" />
              <Spinner className="text-purple-500" />
            </div>
          </div>
          
          <div className="space-y-4">
            <Title level={3}>Em Botões</Title>
            <div className="flex flex-wrap gap-2">
              <Button loading>Enviando...</Button>
              <Button variant="outline" loading>
                Processando
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Title Section */}
      <section className="mb-12 p-6 border rounded-lg bg-white shadow-sm">
        <Title level={2} className="mb-4">Title Component</Title>
        <div className="space-y-4">
          <Title level={1}>Título Nível 1</Title>
          <Title level={2}>Título Nível 2</Title>
          <Title level={3}>Título Nível 3</Title>
          <Title level={4}>Título Nível 4</Title>
          <Title level={5}>Título Nível 5</Title>
          <Title level={6}>Título Nível 6</Title>
          
          <div className="mt-6">
            <Title level={3} className="text-blue-600">
              Título com Classe Customizada
            </Title>
            <p className="text-gray-600">Este título tem uma cor azul aplicada.</p>
          </div>
        </div>
      </section>
    </div>
  );
};