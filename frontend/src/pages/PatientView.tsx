import React, { useEffect, useState } from "react";
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

  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<{
    key: keyof PatientData;
    label: string;
  } | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/patients/${id}`, {
          credentials: "include",
        });
        const data = await response.json();
        setPatientData(data);
      } catch (error) {
        console.error("Erro ao buscar paciente:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPatient();
    }
  }, [id]);

  const handleSaveField = (newValue: string) => {
    if (editingField && patientData) {
      setPatientData((prev) => ({
        ...prev!,
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

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-10 text-gray-600">Carregando paciente...</div>
      </MainLayout>
    );
  }

  if (!patientData) {
    return (
      <MainLayout>
        <div className="text-center py-10 text-red-600">Paciente não encontrado.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout sidebarOpen={false} setSidebarOpen={() => {}}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={1}>Dados de {patientData.name}</Title>
        </div>

        <div className="flex gap-4">
          <Button
            variant="primary"
            onClick={() => navigate(`/record/${id}`)}
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
