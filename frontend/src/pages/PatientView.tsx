import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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

const StatusBadge: React.FC<{ status: "active" | "inactive" }> = ({ status }) => {
  const statusClasses: Record<"active" | "inactive", string> = {
    active: "bg-green-100 text-green-800 border border-green-200",
    inactive: "bg-red-100 text-red-800 border border-red-200",
  };
  
  const statusText = status === "active" ? "Ativo" : "Inativo";
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses[status]}`}>
      {statusText}
    </span>
  );
};

const PatientView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
 
    const API_URL = (import.meta as any).env?.BACKEND_URL || "http://localhost:5000";


  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const token = localStorage.getItem("auth.token");
                const res = await axios.get(`${API_URL}/api/patients/${id}`, {
                    withCredentials: true,
                    headers: {
                        Accept: "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });
                const data = res.data as any;

                const mapped: PatientData = {
                    id: data.id?.toString() ?? id ?? "",
                    name: data.name || data.nome || "",
                    cpf: data.cpf || "",
                    rg: data.rg || "",
                    birthDate: data.birthDate || data.data_nascimento || "",
                    email: data.email || "",
                    phone: data.phone || data.telefone || "",
                    notes: data.notes || data.notas || "",
                    status: ((data.status || data.ativo) === "inactive" ? "inactive" : "active") as "active" | "inactive",
                    customFields: Array.isArray(data.customFields)
                        ? data.customFields.map((f: any) => ({
                            id: Number(f.id),
                            name: f.name ?? f.nome_campo,
                            type: f.type ?? f.tipo_campo,
                            required: !!f.required,
                            value: f.value ?? "",
                        }))
                        : undefined,
                };

                setPatientData(mapped);
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

const handleUpdate = async (formData: {
        name: string;
        birthDate: string;
        cpf: string;
        rg?: string;
        phone: string;
        email?: string;
        notes?: string;
        status: "active" | "inactive";
        customFields?: { id: number; value: string }[];
    }) => {
        if (!id) return;

        const token = localStorage.getItem("auth.token");

        const body = {
            name: formData.name,
            birthDate: formData.birthDate,
            cpf: formData.cpf,
            rg: formData.rg,
            phone: formData.phone,
            email: formData.email,
            notes: formData.notes,
            status: formData.status,
            customFields: formData.customFields ?? [],
        };

        const res = await axios.put(`${API_URL}/api/patients/${id}`, body, {
            withCredentials: true,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (res.status < 200 || res.status >= 300) {
            throw new Error("Falha ao atualizar paciente");
        }
    };

    const handleModalSubmit = async (updated: {
        name: string;
        birthDate: string;
        cpf: string;
        rg?: string;
        phone: string;
        email?: string;
        notes?: string;
        status: "active" | "inactive";
        customFields?: { id: number; value: string }[];
    }) => {
        try {
            await handleUpdate(updated);

            setPatientData(prev => {
                if (!prev) return prev;

                const updatedCustomFields = prev.customFields
                    ? prev.customFields.map(f => {
                        const match = updated.customFields?.find(cf => cf.id === f.id);
                        if (!match) return f;
                        return { ...f, value: match.value };
                    })
                    : prev.customFields;

                return {
                    ...prev,
                    name: updated.name,
                    cpf: updated.cpf,
                    rg: updated.rg ?? "",
                    birthDate: updated.birthDate,
                    email: updated.email ?? "",
                    phone: updated.phone,
                    notes: updated.notes ?? "",
                    status: updated.status,
                    customFields: updatedCustomFields,
                };
            });

            setShowEditModal(false);
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar alterações do paciente");
        }  
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
    <MainLayout sidebarOpen={false} setSidebarOpen={() => {}}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={1}>Dados de {patientData.name}</Title>
        </div>

        <div className="flex gap-4">
          <Button
            variant="primary"
            onClick={() => navigate(`/records/${id}`)}
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
          {/* Status field with colored badge */}
          <div className="border border-gray-100 rounded-xl p-4 bg-white">
            <div className="flex justify-between items-start">
              <p className="text-gray-500 text-sm">Status</p>
            </div>
            <StatusBadge status={patientData.status} />
          </div>

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
