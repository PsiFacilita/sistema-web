import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
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
  required: boolean;
  createdAt?: string;
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

const CustomFields: React.FC = () => {
  const navigate = useNavigate();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
  const [fieldBeingEdited, setFieldBeingEdited] = useState<CustomField | null>(null);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/fields");
      const data = await res.json();
      const fieldsWithDate = data.map((field: any) => ({
        ...field,
        createdAt: new Date().toLocaleDateString("pt-BR"),
      }));
      setCustomFields(fieldsWithDate);
    } catch (err) {
      console.error("Erro ao buscar campos personalizados:", err);
    }
  };

  const handleSaveCustomField = async (field: { name: string; type: string; required: boolean }) => {
    const isEditing = !!fieldBeingEdited;

    try {
      const res = await fetch(
        `http://localhost:5000/api/fields${isEditing ? `/${fieldBeingEdited!.id}` : ""}`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(field),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao salvar campo");
      }

      await fetchFields();
      setIsCustomFieldModalOpen(false);
      setFieldBeingEdited(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteField = async (id: string) => {
    const result = await Swal.fire({
      title: "Remover campo?",
      text: "Essa ação não pode ser desfeita!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/fields/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao remover campo");
      }

      await fetchFields();

      Swal.fire({
        icon: "success",
        title: "Removido!",
        text: "O campo foi removido com sucesso.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível remover o campo.",
      });
    }
  };

  const filteredFields = customFields.filter(
    (field) =>
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatType(field.type).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: "Nome do Campo", accessor: "name" as keyof CustomField },
    {
      header: "Tipo",
      accessor: "type" as keyof CustomField,
      Cell: ({ value }: any) => (
        <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm font-medium">
          {formatType(value)}
        </span>
      ),
    },
    {
      header: "Obrigatório",
      accessor: "required" as keyof CustomField,
      Cell: ({ value }: any) => (
        <span
          className={`px-2 py-1 rounded-md text-sm font-medium ${
            value ? "bg-primary text-white" : "bg-danger text-white"
          }`}
        >
          {value ? "Sim" : "Não"}
        </span>
      ),
    },
    { header: "Data de Criação", accessor: "createdAt" as keyof CustomField },
    {
      header: "Ações",
      accessor: "id" as keyof CustomField,
      Cell: ({ value }: any) => {
        const field = customFields.find((f) => f.id === value);
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setFieldBeingEdited(field || null);
                setIsCustomFieldModalOpen(true);
              }}
              className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1 text-sm text-green-700 hover:bg-green-700 hover:text-white transition"
            >
              <Icon type="edit" size={16} />
              Editar
            </button>
            <button
              onClick={() => handleDeleteField(value)}
              className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white transition"
            >
              <Icon type="trash" size={16} />
              Remover
            </button>
          </div>
        );
      },
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
            onClick={() => {
              setFieldBeingEdited(null);
              setIsCustomFieldModalOpen(true);
            }}
          >
            Novo Campo
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <div className="flex items-center">
              <Icon type="x" className="mr-2" /> Voltar
            </div>
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
        onClose={() => {
          setIsCustomFieldModalOpen(false);
          setFieldBeingEdited(null);
        }}
        onSubmit={handleSaveCustomField}
        initialData={fieldBeingEdited || undefined}
      />
    </MainLayout>
  );
};

export default CustomFields;
