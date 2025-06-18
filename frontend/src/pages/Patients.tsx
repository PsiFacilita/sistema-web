import React, { useState } from "react";
import Title from "../components/Title/Title";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import Input from "../components/Form/Input/Input";
import Table from "../components/Table/Table";
import Icon from "../components/Icon/Icon";
import { FiChevronLeft, FiChevronRight, FiEye } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import PatientModal from "../components/PatientModal/PatientModal";
import CustomFieldModal from "../components/CustomField/CustomFieldModal";

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  createdAt: string;
}

interface CustomField {
  name: string;
  type: string;
}

const formatStatus = (status: Patient["status"]) => {
  const statusMap = {
    active: "Ativo",
    inactive: "Inativo",
  };
  return statusMap[status] || status;
};

const StatusCell: React.FC<{ value: Patient["status"] }> = ({ value }) => {
  const statusClasses = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[value]}`}>
      {formatStatus(value)}
    </span>
  );
};

const ActionsCell: React.FC<{ value: string }> = ({ value }) => {
  const navigate = useNavigate();
  return (
    <div className="flex space-x-2">
      <button
        onClick={() => navigate(`/patients/${value}`)}
        className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1 text-sm text-blue-700 hover:bg-blue-700 hover:text-white transition"
      >
        <FiEye size={16} />
        Visualizar
      </button>
      <button
        onClick={() => console.log("Editar documento", value)}
        className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1 text-sm text-green-700 hover:bg-green-700 hover:text-white transition"
      >
        <Icon type="edit" size={16} />
        Editar
      </button>
    </div>
  );
};

const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>(
    Array.from({ length: 10 }, (_, i) => ({
      id: `patient-${i + 1}`,
      name: `Paciente ${i + 1}`,
      phone: `(11) 90000-000${i}`,
      email: `paciente${i + 1}@email.com`,
      status: i % 2 === 0 ? "active" : "inactive",
      createdAt: new Date().toLocaleDateString("pt-BR"),
    }))
  );

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
  const patientsPerPage = 10;

  const handleAddPatient = (newPatient: Omit<Patient, "id" | "createdAt">) => {
    const patientToAdd: Patient = {
      ...newPatient,
      id: `patient-${patients.length + 1}`,
      createdAt: new Date().toLocaleDateString("pt-BR"),
    };
    setPatients([patientToAdd, ...patients]);
    setIsPatientModalOpen(false);
  };

  const handleAddCustomField = (field: CustomField) => {
    setCustomFields([...customFields, field]);
    setIsCustomFieldModalOpen(false);
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

  const columns = [
    { header: "Nome", accessor: "name" as keyof Patient },
    { header: "Telefone", accessor: "phone" as keyof Patient },
    { header: "Email", accessor: "email" as keyof Patient },
    { header: "Data de Cadastro", accessor: "createdAt" as keyof Patient },
    {
      header: "Status",
      accessor: "status" as keyof Patient,
      Cell: StatusCell,
    },
    {
      header: "Ações",
      accessor: "id" as keyof Patient,
      Cell: ActionsCell,
    },
  ];

  return (
    <MainLayout>
      <div className="mb-6">
        <Title level={1}>Pacientes</Title>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="w-full md:w-1/3">
          <Input
            id="search"
            placeholder="Buscar pacientes..."
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
            Campo Personalizado
          </Button>
          <Button
            variant="primary"
            icon={<Icon type="plus" size={16} />}
            onClick={() => setIsPatientModalOpen(true)}
          >
            Novo Paciente
          </Button>
        </div>
      </div>

      <Card>
        <Table data={currentPatients} columns={columns} />
      </Card>

      {customFields.length > 0 && (
        <Card className="mt-6">
          <Title level={2}>Campos Personalizados</Title>
          <ul className="mt-4 space-y-2">
            {customFields.map((field, index) => (
              <li key={index} className="flex justify-between border-b pb-2">
                <span className="font-semibold">Name:</span> {field.name}
                <span className="font-semibold">Type:</span> {field.type}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSubmit={handleAddPatient}
      />

      <CustomFieldModal
        isOpen={isCustomFieldModalOpen}
        onClose={() => setIsCustomFieldModalOpen(false)}
        onSubmit={handleAddCustomField}
      />
    </MainLayout>
  );
};

export default Patients;
