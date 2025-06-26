import React, { useState, useEffect } from "react";
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
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
  const patientsPerPage = 10;

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/patients", {
          credentials: "include",
        });
        const data = await response.json();
        setPatients(data);
      } catch (error) {
        console.error("Erro ao buscar pacientes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleAddPatient = (newPatient: Omit<Patient, "id" | "createdAt">) => {
    // Exemplo fictício de inclusão manual (não persiste no backend)
    const patientToAdd: Patient = {
      ...newPatient,
      id: crypto.randomUUID(),
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
      patient.phone.includes(searchTerm.toLowerCase()) ||
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

  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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
          <Button variant="primary" onClick={() => navigate("/custom-fields")}>
            Campos Personalizados
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
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Carregando pacientes...</p>
          </div>
        ) : currentPatients.length > 0 ? (
          <>
            <Table data={currentPatients} columns={columns} />
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando{" "}
                      <span className="font-medium">{indexOfFirstPatient + 1}</span> a{" "}
                      <span className="font-medium">
                        {Math.min(indexOfLastPatient, filteredPatients.length)}
                      </span>{" "}
                      de <span className="font-medium">{filteredPatients.length}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav
                      className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                      aria-label="Pagination"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="rounded-l-md px-2 py-2 text-gray-400 hover:bg-gray-50"
                      >
                        <span className="sr-only">Anterior</span>
                        <FiChevronLeft size={16} />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <Button
                          key={i + 1}
                          variant={i + 1 === currentPage ? "primary" : "outline"}
                          size="sm"
                          onClick={() => paginate(i + 1)}
                          className="px-3 py-1"
                        >
                          {i + 1}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-r-md px-2 py-2 text-gray-400 hover:bg-gray-50"
                      >
                        <span className="sr-only">Próximo</span>
                        <FiChevronRight size={16} />
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum paciente encontrado.</p>
          </div>
        )}
      </Card>

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
