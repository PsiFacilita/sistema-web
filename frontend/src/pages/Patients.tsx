import React, {useEffect, useMemo, useState} from "react";
import axios from "axios";
import Title from "../components/Title/Title";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import Input from "../components/Form/Input/Input";
import Table from "../components/Table/Table";
import Icon from "../components/Icon/Icon";
import {FiChevronLeft, FiChevronRight, FiEye} from "react-icons/fi";
import {useNavigate} from "react-router-dom";
import PatientModal from "../components/PatientModal/PatientModal";

interface Patient {
    id: string;
    name: string;
    cpf: string;
    rg: string;
    birthDate: string; // ISO ou dd/mm/aaaa (renderizamos como vier)
    phone: string;
    email: string;
    status: "active" | "inactive";
    notes: string;
    customFields?: { id: number; value: string }[];
    createdAt: string; // ISO esperado; se vier outro formato, só exibimos texto
}

const API_URL = (import.meta as any).env?.BACKEND_URL || "http://localhost:5000";

const formatStatus = (status: Patient["status"]) => {
    const statusMap = {
        active: "Ativo",
        inactive: "Inativo",
    } as const;
    return statusMap[status] ?? status;
};

const StatusCell: React.FC<{ value: Patient["status"] }> = ({value}) => {
    const statusClasses: Record<Patient["status"], string> = {
        active: "bg-green-100 text-green-800",
        inactive: "bg-red-100 text-red-800",
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[value]}`}>
      {formatStatus(value)}
    </span>
    );
};

const ActionsCell: React.FC<{ value: string }> = ({value}) => {
    const navigate = useNavigate();
    return (
        <div className="flex space-x-2">
            <button
                onClick={() => navigate(`/patients/${value}`)}
                className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1 text-sm text-blue-700 hover:bg-blue-700 hover:text-white transition"
            >
                <FiEye size={16}/>
                Visualizar
            </button>

            <button
                onClick={() => console.log("Editar paciente", value)}
                className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1 text-sm text-green-700 hover:bg-green-700 hover:text-white transition"
            >
                <Icon type="edit" size={16}/>
                Editar
            </button>
        </div>
    );
};

const formatDate = (value?: string) => {
    if (!value) return "-";
    // tenta ISO → pt-BR; senão devolve como veio
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }
    return value;
};

const DateCell: React.FC<{ value: string }> = ({value}) => (
    <span>{formatDate(value)}</span>
);

const Patients: React.FC = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const patientsPerPage = 10;

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const token = localStorage.getItem("auth.token");
                const res = await axios.get(`${API_URL}/api/patients`, {
                    withCredentials: true,
                    headers: {
                        Accept: "application/json",
                        ...(token ? {Authorization: `Bearer ${token}`} : {}),
                    },
                });
                const data = res.data;
                const list = Array.isArray(data?.patients) ? data.patients : [];
                setPatients(list as Patient[]);
            } catch (err: any) {
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    console.warn("Não autenticado — redirecionando para login.");
                    window.location.href = "/login";
                    return;
                }
                console.error("Erro ao buscar pacientes:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, []);

    const handleAddPatient = async (newPatient: Omit<Patient, "id" | "createdAt">) => {
        try {
            const token = localStorage.getItem("auth.token");
            const res = await axios.post(
                `${API_URL}/api/patients`,
                {
                    name: newPatient.name,
                    cpf: newPatient.cpf,
                    rg: newPatient.rg,
                    birthDate: newPatient.birthDate,
                    email: newPatient.email,
                    phone: newPatient.phone,
                    notes: newPatient.notes?.trim() || "Nada a observar.",
                    customFields: newPatient.customFields || [],
                    status: newPatient.status ?? "active",
                },
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        ...(token ? {Authorization: `Bearer ${token}`} : {}),
                    },
                }
            );

            if (res.status < 200 || res.status >= 300) {
                throw new Error("Erro ao criar paciente");
            }

            const created: Patient = res.data;
            // Garante createdAt para exibição
            const createdWithDate: Patient = {
                ...created,
                createdAt: created.createdAt || new Date().toISOString(),
            };

            setPatients((prev) => [createdWithDate, ...prev]);
        } catch (error) {
            console.error("Erro ao adicionar paciente:", error);
            alert("Erro ao adicionar paciente");
        } finally {
            setIsPatientModalOpen(false);
        }
    };

    const filteredPatients = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return patients.filter(
            (p) =>
                p.nome.toLowerCase().includes(q) ||
                (p.telefone ?? "").toLowerCase().includes(q) ||
                (p.email ?? "").toLowerCase().includes(q)
        );
    }, [patients, searchTerm]);

    const indexOfLastPatient = currentPage * patientsPerPage;
    const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
    const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

    const columns = [
        {header: "Nome", accessor: "nome" as keyof Patient},
        {header: "Telefone", accessor: "telefone" as keyof Patient},
        {header: "Email", accessor: "email" as keyof Patient},
        {
            header: "Data de Cadastro",
            accessor: "criado_em" as keyof Patient,
            Cell: DateCell,
        },
        {header: "Status", accessor: "ativo" as keyof Patient, Cell: StatusCell},
        {header: "Ações", accessor: "id" as keyof Patient, Cell: ActionsCell},
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
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={{width: "100%"}}
                    />
                </div>

                <div className="flex gap-2">
                    <Button variant="primary" onClick={() => navigate("/custom-fields")}>
                        Campos Personalizados
                    </Button>
                    <Button
                        variant="primary"
                        icon={<Icon type="plus" size={16}/>}
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
                        <Table data={currentPatients} columns={columns}/>
                        {totalPages > 1 && (
                            <div
                                className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
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
                                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                                             aria-label="Pagination">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => paginate(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="rounded-l-md px-2 py-2 text-gray-400 hover:bg-gray-50"
                                            >
                                                <span className="sr-only">Anterior</span>
                                                <FiChevronLeft size={16}/>
                                            </Button>
                                            {Array.from({length: totalPages}, (_, i) => (
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
                                                <FiChevronRight size={16}/>
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
        </MainLayout>
    );
};

export default Patients;
