import React, { useState } from "react";
import Title from "../components/Title/Title";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import Input from "../components/Form/Input/Input";
import Table from "../components/Table/Table";
import Icon from "../components/Icon/Icon";
import { useNavigate } from "react-router-dom";
import CustomFieldModal from "../components/CustomField/CustomFieldModal";

interface CustomField {
  id: string;
  name: string;
  type: string;
  createdAt: string;
}

const formatType = (type: string) => {
  const typeMap = {
    text: "Texto",
    number: "Número", 
    date: "Data",
    textarea: "Área de Texto",
    email: "Email",
    phone: "Telefone",
  };
  return typeMap[type as keyof typeof typeMap] || type;
};

const TypeCell: React.FC<{ value: string }> = ({ value }) => {
  return (
    <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm font-medium">
      {formatType(value)}
    </span>
  );
};

const ActionsCell: React.FC<{ value: string }> = ({ value }) => {
  return (
    <div className="flex space-x-2">
      <button
        onClick={() => console.log("Editar campo", value)}
        className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1 text-sm text-green-700 hover:bg-green-700 hover:text-white transition"
      >
        <Icon type="edit" size={16} />
        Editar
      </button>
      <button
        onClick={() => console.log("Remover campo", value)}
        className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white transition"
      >
        <Icon type="trash" size={16} />
        Remover
      </button>
    </div>
  );
};

const CustomFields: React.FC = () => {
  const navigate = useNavigate();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);

  const handleAddCustomField = (field: { name: string; type: string }) => {
    const newField: CustomField = {
      ...field,
      id: `field-${customFields.length + 1}`,
      createdAt: new Date().toLocaleDateString("pt-BR"),
    };
    setCustomFields([newField, ...customFields]);
    setIsCustomFieldModalOpen(false);
  };

  const filteredFields = customFields.filter(
    (field) =>
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatType(field.type).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: "Nome do Campo", accessor: "name" as keyof CustomField },
    { header: "Tipo", accessor: "type" as keyof CustomField, Cell: TypeCell },
    { header: "Data de Criação", accessor: "createdAt" as keyof CustomField },
    {
      header: "Ações",
      accessor: "id" as keyof CustomField,
      Cell: ActionsCell,
    },
  ];

  return (
    <MainLayout>
      <div className="mb-6">
        <Title level={1}>Campos Personalizados</Title>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="w-full md:w-1/3">
          <Input
            id="search"
            placeholder="Buscar campos personalizados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div className="flex gap-2">
            <Button
            variant="primary"
            icon={<Icon type="plus" size={16} />}
            onClick={() => setIsCustomFieldModalOpen(true)}
          >
            Novo Campo
          </Button>
          <Button
            variant="outline"
            icon={<Icon type="arrow-left" size={16} />}
            onClick={() => navigate("/patients")}
          >
            Voltar para Pacientes
          </Button>
          
        </div>
      </div>

      <Card>
        {filteredFields.length > 0 ? (
          <Table data={filteredFields} columns={columns} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum campo personalizado encontrado.</p>
          </div>
        )}
      </Card>

      <CustomFieldModal
        isOpen={isCustomFieldModalOpen}
        onClose={() => setIsCustomFieldModalOpen(false)}
        onSubmit={handleAddCustomField}
      />
    </MainLayout>
  );
};

export default CustomFields;
