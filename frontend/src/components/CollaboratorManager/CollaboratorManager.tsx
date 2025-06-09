import React from 'react';
import Title from '../Title/Title';
import Table from '../Table/Table';
import Button from '../Button';
import Input from '../Form/Input';
import Label from '../Form/Label';
import Modal from '../Modal/Modal';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CollaboratorManagerProps {
  initialCollaborators?: Collaborator[];
  onSave?: (data: Collaborator[]) => void;
}

const CollaboratorManager: React.FC<CollaboratorManagerProps> = ({
  initialCollaborators = [],
  onSave
}) => {
  const [collaborators, setCollaborators] = React.useState<Collaborator[]>(initialCollaborators);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    role: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCollaborator = () => {
    const newCollaborator = {
      ...formData,
      id: Date.now().toString(),
    };
    
    const updatedCollaborators = [...collaborators, newCollaborator];
    setCollaborators(updatedCollaborators);
    resetForm();
    
    if (onSave) {
      onSave(updatedCollaborators);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', role: '' });
    setIsModalOpen(false);
  };

  const handleRemoveCollaborator = (id: string) => {
    const updatedCollaborators = collaborators.filter(c => c.id !== id);
    setCollaborators(updatedCollaborators);
    
    if (onSave) {
      onSave(updatedCollaborators);
    }
  };

  // Componente personalizado para a coluna de ações
  const ActionCell: React.FC<{ value: string }> = ({ value }) => {
    return (
      <Button 
        variant="danger" 
        size="sm"
        onClick={() => handleRemoveCollaborator(value)}
      >
        Remover
      </Button>
    );
  };

  // Formato correto para as colunas da tabela
  const columns = [
    { header: 'Nome', accessor: 'name' as keyof Collaborator },
    { header: 'Cargo', accessor: 'role' as keyof Collaborator },
    { 
      header: 'Ações', 
      accessor: 'id' as keyof Collaborator,
      Cell: ActionCell
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <Title level={3}>Gerenciar Colaboradores</Title>
        <Button 
          variant="primary" 
          onClick={() => setIsModalOpen(true)}
        >
          Adicionar Colaborador
        </Button>
      </div>

      {collaborators.length > 0 ? (
        <div className="flex-grow">
          <Table 
            columns={columns} 
            data={collaborators} 
          />
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500 flex-grow">
          Nenhum colaborador cadastrado
        </div>
      )}

      {/* Modal para adicionar colaborador */}
      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title="Adicionar Novo Colaborador"
        size="medium"
      >
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Digite o nome completo"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="exemplo@email.com"
              />
            </div>
            <div>
              <Label htmlFor="role">Cargo</Label>
              <Input
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="Cargo ou função"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-2">
            <Button 
              variant="secondary" 
              onClick={resetForm}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddCollaborator}
              disabled={!formData.name || !formData.email || !formData.role}
            >
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CollaboratorManager;