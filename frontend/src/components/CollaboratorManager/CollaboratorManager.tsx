import React from 'react';
import Title from '../Title/Title';
import Table from '../Table/Table';
import Button from '../Button';
import Input from '../Form/Input';
import Label from '../Form/Label';

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
  const [showAddForm, setShowAddForm] = React.useState(false);
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
    setFormData({ name: '', email: '', role: '' });
    setShowAddForm(false);
    
    if (onSave) {
      onSave(updatedCollaborators);
    }
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
    { header: 'Email', accessor: 'email' as keyof Collaborator },
    { header: 'Cargo', accessor: 'role' as keyof Collaborator },
    { 
      header: 'Ações', 
      accessor: 'id' as keyof Collaborator,
      Cell: ActionCell
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={3}>Gerenciar Colaboradores</Title>
        <Button 
          variant="primary" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancelar' : 'Adicionar Colaborador'}
        </Button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
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
              />
            </div>
            <div>
              <Label htmlFor="role">Cargo</Label>
              <Input
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button 
              variant="primary" 
              onClick={handleAddCollaborator}
              disabled={!formData.name || !formData.email || !formData.role}
            >
              Salvar Colaborador
            </Button>
          </div>
        </div>
      )}

      {collaborators.length > 0 ? (
        <Table 
          columns={columns} 
          data={collaborators} 
        />
      ) : (
        <div className="text-center py-10 text-gray-500">
          Nenhum colaborador cadastrado
        </div>
      )}
    </div>
  );
};

export default CollaboratorManager;