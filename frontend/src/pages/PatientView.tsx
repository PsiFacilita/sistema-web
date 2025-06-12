import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Title from "../components/Title/Title";
import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import Icon from "../components/Icon/Icon";
import EditFieldModal from "../components/EditFieldModal/EditFieldModal";

interface PatientData {
  id: string;
  name: string;
  cpf: string;
  rg: string;
  birthDate: string;
  email: string;
  phone: string;
  notes: string;
}

const PatientView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patientData, setPatientData] = useState<PatientData>({
    id: "patient-1",
    name: "João da Silva",
    cpf: "123.456.789-00",
    rg: "12.345.678-9",
    birthDate: "15/03/1980",
    email: "joao.silva@email.com",
    phone: "(11) 98765-4321",
    notes: "Paciente com histórico de depressão e ansiedade generalizada.",
  });

  const [editingField, setEditingField] = useState<{
    key: keyof PatientData;
    label: string;
  } | null>(null);

  const handleSaveField = (newValue: string) => {
    if (editingField) {
      setPatientData((prev) => ({
        ...prev,
        [editingField.key]: newValue,
      }));
    }
  };

  const openEdit = (key: keyof PatientData, label: string) => {
    setEditingField({ key, label });
  };

  const closeModal = () => {
    setEditingField(null);
  };

  const renderField = (
    label: string,
    value: string,
    key: keyof PatientData,
    className = ""
  ) => (
    <div className={`border border-gray-100 rounded-xl p-4 bg-white ${className}`}>
      <div className="flex justify-between items-start">
        <p className="text-gray-500 text-sm">{label}</p>
      </div>
      <p className="text-lg font-medium">{value}</p>
    </div>
  );

  return (
    <MainLayout sidebarOpen={false} setSidebarOpen={() => {}}>
    <div className="flex justify-between items-center mb-6">
      <div>
        <Title level={1}>Dados de Paciente 1</Title>
      </div>
      
      <div className="flex gap-4">
        <Button
          variant="primary"
          onClick={() => navigate(`/record/:id`)}
        >
          <div className="flex items-center">
            <Icon type="folder" className="mr-2" /> Prontuário
          </div>
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
        >
          <div className="flex items-center">
            <Icon type="x" className="mr-2" /> Voltar
          </div>
        </Button>
      </div>
    </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderField("Nome", patientData.name, "name")}
          {renderField("CPF", patientData.cpf, "cpf")}
          {renderField("RG", patientData.rg, "rg")}
          {renderField("Data de Nascimento", patientData.birthDate, "birthDate")}
          {renderField("E-mail", patientData.email, "email")}
          {renderField("Telefone", patientData.phone, "phone")}
          {renderField("Anotações", patientData.notes, "notes", "md:col-span-2")}
        </div>
      </Card>

      {editingField && (
        <EditFieldModal
          isOpen={true}
          fieldLabel={editingField.label}
          currentValue={patientData[editingField.key]}
          onClose={closeModal}
          onSave={handleSaveField}
        />
      )}
    </MainLayout>
  );
};

export default PatientView;
