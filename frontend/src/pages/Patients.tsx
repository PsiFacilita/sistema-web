import React, { useState } from "react";
import Title from "../components/Title/Title";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import Input from "../components/Form/Input/Input";
import Table from "../components/Table/Table";
import Icon from "../components/Icon/Icon";
import { FiChevronLeft, FiChevronRight, FiEye } from "react-icons/fi";

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  createdAt: string;
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
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[value]}`}
    >
      {formatStatus(value)}
    </span>
  );
};

const ActionsCell: React.FC<{ value: string }> = ({ value }) => {
  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        icon={<FiEye size={16} />}
        aria-label="Visualizar"
        onClick={() => console.log("View patient", value)}
      />
      <Button
        variant="outline"
        size="sm"
        icon={<Icon type="edit" size={16} />}
        aria-label="Editar"
        onClick={() => console.log("Edit patient", value)}
      />
    </div>
  );
};

const Patients: React.FC = () => {
  const [patients] = useState<Patient[]>(
    Array.from({ length: 50 }, (_, i) => ({
      id: `patient-${i + 1}`,
      name: `Paciente ${i + 1}`,
      phone: `(${11 + (i % 3)}) 9${8000 + i}-${4000 + i}`,
      email: `paciente${i + 1}@email.com`,
      status: i % 4 === 0 ? "inactive" : "active",
      createdAt: new Date(Date.now() - i * 86400000).toLocaleDateString("pt-BR"),
    }))
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 11;

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(
    indexOfFirstPatient,
    indexOfLastPatient
  );

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
          <Button
            variant="primary"
            icon={<Icon type="plus" size={16} />}
            onClick={() => console.log("Adicionar novo paciente")}
          >
            Novo Paciente
          </Button>
        </div>
      </div>

      <Card>
        {currentPatients.length > 0 ? (
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
                      de{" "}
                      <span className="font-medium">{filteredPatients.length}</span>{" "}
                      resultados
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
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 hover:bg-gray-50 focus:z-20"
                      >
                        <span className="sr-only">Anterior</span>
                        <FiChevronLeft size={16} />
                      </Button>

                      {(() => {
                        const visiblePages = 5;
                        const pages: number[] = [];
                        let start = Math.max(1, currentPage - Math.floor(visiblePages / 2));
                        let end = Math.min(totalPages, start + visiblePages - 1);

                        if (end - start < visiblePages - 1) {
                          start = Math.max(1, end - visiblePages + 1);
                        }

                        for (let i = start; i <= end; i++) {
                          pages.push(i);
                        }

                        return (
                          <>
                            {start > 1 && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => paginate(1)}
                                  className="px-3 py-1 text-sm"
                                >
                                  1
                                </Button>
                                <span className="px-2 py-1 text-sm text-gray-500">...</span>
                              </>
                            )}

                            {pages.map((pageNumber) => (
                              <Button
                                key={pageNumber}
                                variant={pageNumber === currentPage ? "primary" : "outline"}
                                size="sm"
                                onClick={() => paginate(pageNumber)}
                                className={`px-4 py-2 text-sm font-semibold ${
                                  pageNumber === currentPage
                                    ? "z-10 bg-primary-600 text-white"
                                    : "text-gray-900 hover:bg-gray-50"
                                }`}
                              >
                                {pageNumber}
                              </Button>
                            ))}

                            {end < totalPages && (
                              <>
                                <span className="px-2 py-1 text-sm text-gray-500">...</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => paginate(totalPages)}
                                  className="px-3 py-1 text-sm"
                                >
                                  {totalPages}
                                </Button>
                              </>
                            )}
                          </>
                        );
                      })()}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 hover:bg-gray-50 focus:z-20"
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
    </MainLayout>
  );
};

export default Patients;