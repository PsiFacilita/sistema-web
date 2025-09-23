import React from 'react';
import Title from '../Title/Title';
import Table from '../Table/Table';
import Button from '../Button/Button';
import Input from '../Form/Input/Input';
import Label from '../Form/Label/Label';
import Modal from '../Modal/Modal';
import Icon from "../Icon/Icon";
import { FiEye, FiUsers, FiUserPlus, FiMail, FiBriefcase } from "react-icons/fi";
import Swal from "sweetalert2";

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

const handleDeleteDocument = (id: string) => {
  Swal.fire({
    title: 'Tem certeza?',
    text: 'Essa ação não poderá ser desfeita!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#aaa',
    confirmButtonText: 'Sim, deletar',
    cancelButtonText: 'Cancelar',
    background: '#fff',
    color: '#374151'
  }).then((result) => {
    if (result.isConfirmed) {
      console.log("Colaborador deletado:", id);
      Swal.fire({
        title: 'Deletado!',
        text: 'O colaborador foi removido.',
        icon: 'success',
        background: '#fff',
        color: '#374151'
      });
    }
  });
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
      <div className="flex space-x-2">
        <button
          onClick={() => console.log("Visualizar colaborador", value)}
          className="flex items-center gap-2 rounded-lg bg-sage-100 px-3 py-2 text-sm text-sage-700 hover:bg-sage-200 hover:text-sage-800 transition-all duration-300"
        >
          <FiEye size={16} />
          <span className="hidden sm:inline">Visualizar</span>
        </button>

        <button
          onClick={() => console.log("Edit document", value)}
          className="flex items-center gap-2 rounded-lg bg-sage-50 px-3 py-2 text-sm text-sage-600 hover:bg-sage-100 hover:text-sage-700 transition-all duration-300 border border-sage-200"
        >
          <Icon type="edit" size={16} />
          <span className="hidden sm:inline">Editar</span>
        </button>

        <button
          onClick={() => handleDeleteDocument(value)}
          className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-300 border border-red-200"
        >
          <Icon type="trash" size={16} />
          <span className="hidden sm:inline">Deletar</span>
        </button>
      </div>
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
    <div className="p-1 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-sage-100 rounded-lg p-3">
          <FiUsers size={24} className="text-sage-600" />
        </div>
        <div className="flex-1">
          <Title level={3} className="text-sage-800 mb-0">Gerenciar Colaboradores</Title>
          <p className="text-sage-600 text-sm mt-1">
            {collaborators.length} colaborador{collaborators.length !== 1 ? 'es' : ''} cadastrado{collaborators.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsModalOpen(true)}
          icon={<FiUserPlus size={18} />}
          className="bg-sage-600 hover:bg-sage-700 border-sage-600"
        >
          Adicionar
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
        <div className="text-center py-12 text-sage-600 flex-grow flex flex-col items-center justify-center">
          <div className="bg-sage-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <FiUsers size={32} className="text-sage-400" />
          </div>
          <h4 className="text-lg font-semibold text-sage-700 mb-2">Nenhum colaborador cadastrado</h4>
          <p className="text-sage-600 mb-4">Comece adicionando seu primeiro colaborador</p>
          <Button 
            variant="primary" 
            onClick={() => setIsModalOpen(true)}
            icon={<FiUserPlus size={16} />}
            className="bg-sage-600 hover:bg-sage-700"
          >
            Adicionar Primeiro Colaborador
          </Button>
        </div>
      )}

      {/* Modal para adicionar colaborador */}
      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title="Adicionar Novo Colaborador"
        size="medium"
      >
        <div className="space-y-6 mt-4">
          <div className="bg-sage-50 rounded-xl p-4">
            <h3 className="flex items-center gap-2 text-sage-700 font-semibold mb-4">
              <FiUserPlus size={18} />
              Informações do Colaborador
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="name">
                  Nome Completo
                </Label>
                <div className="relative">
                  <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={18} />
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Digite o nome completo"
                    className="pl-10 border-sage-200 focus:border-sage-400"
                  />
                </div>
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="email">
                  Email
                </Label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={18} />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="exemplo@email.com"
                    className="pl-10 border-sage-200 focus:border-sage-400"
                  />
                </div>
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="role">
                  Cargo
                </Label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={18} />
                  <Input
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="Cargo ou função"
                    className="pl-10 border-sage-200 focus:border-sage-400"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 border-t border-sage-100">
            <Button 
              variant="outline" 
              onClick={resetForm}
              className="border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddCollaborator}
              disabled={!formData.name || !formData.email || !formData.role}
              className="bg-sage-600 hover:bg-sage-700 border-sage-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar Colaborador
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CollaboratorManager;