import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Title from "../components/Title/Title";
import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import Icon from "../components/Icon/Icon";
import PatientModal from "../components/PatientModal/PatientModal";

interface CustomField {
  id: number;
  name: string;
  type: string;
  required: boolean;
  value: string;
}

interface PatientData {
  id: string;
  name: string;
  cpf: string;
  rg: string;
  birthDate: string;
  email: string;
  phone: string;
  notes: string;
  status: "active" | "inactive";
  customFields?: CustomField[];
}

const PatientView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

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

  const handleUpdate = async (updatedPatient: Partial<PatientData>) => {
    try {
      const response = await fetch(`http://localhost:5000/api/patient/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPatient),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar paciente');
      }

      const data = await response.json();
      console.log('Paciente atualizado:', data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleModalSubmit = async (updated: Partial<PatientData>) => {
    await handleUpdate(updated);
    setPatientData({ ...patientData!, ...updated });
    setShowEditModal(false);
  };

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
    <MainLayout sidebarOpen={false} setSidebarOpen={() => { }}>
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
            variant="primary"
            onClick={() => setShowEditModal(true)}
          >
            <div className="flex items-center">
              <Icon type="edit" className="mr-2" /> Editar
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
          {renderField("Status", patientData.status === "active" ? "Ativo" : "Inativo", "status")}

          {patientData.customFields?.map((field) => (
            <div
              key={field.id}
              className="border border-gray-100 rounded-xl p-4 bg-white"
            >
              <div className="flex justify-between items-start">
                <p className="text-gray-500 text-sm">{field.name}</p>
              </div>
              <p className="text-lg font-medium break-words">
                {field.value || <span className="text-gray-400 italic">Não preenchido</span>}
              </p>
            </div>
          ))}
          {renderField("Anotações", patientData.notes, "notes", "md:col-span-2")}
        </div>
      </Card>

      {showEditModal && (
        <PatientModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleModalSubmit}
          initialData={patientData}
          title="Editar Paciente"
          submitLabel="Salvar Alterações"
        />
      )}
    </MainLayout>
  );
};

export default PatientView;
