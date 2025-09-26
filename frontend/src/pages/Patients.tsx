import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Title from "../components/Title/Title";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import Input from "../components/Form/Input/Input";
import Table from "../components/Table/Table";
import Icon from "../components/Icon/Icon";
import { FiChevronLeft, FiChevronRight, FiEye, FiSearch, FiUserPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import PatientModal from "../components/PatientModal/PatientModal";

interface Patient {
    id: string;
    nome: string;
    telefone: string;
    email: string;
    criado_em: string;
    ativo: "active" | "inactive";
}

const API_URL = (import.meta as any).env?.BACKEND_URL || "http://localhost:5000";

const formatStatus = (status: Patient["ativo"]) => {
    const statusMap = {
        active: "Ativo",
        inactive: "Inativo",
    } as const;
    return statusMap[status] ?? status;
};

const StatusCell: React.FC<{ value: Patient["ativo"] }> = ({ value }) => {
    const statusClasses: Record<Patient["ativo"], string> = {
        active: "bg-green-100 text-green-800 border border-green-200",
        inactive: "bg-red-100 text-red-800 border border-red-200",
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses[value]}`}>
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
                className="flex items-center gap-2 rounded-lg bg-sage-100 px-3 py-2 text-sm text-sage-700 hover:bg-sage-200 hover:text-sage-800 transition-all duration-300"
            >
                <FiEye size={16} />
                Visualizar
            </button>

            <button
                onClick={() => console.log("Editar paciente", value)}
                className="flex items-center gap-2 rounded-lg bg-sage-50 px-3 py-2 text-sm text-sage-600 hover:bg-sage-100 hover:text-sage-700 transition-all duration-300 border border-sage-200"
            >
                <Icon type="edit" size={16} />
                Editar
            </button>
        </div>
    );
};

const formatDate = (value?: string) => {
    if (!value) return "-";
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

const DateCell: React.FC<{ value: string }> = ({ value }) => (
    <span className="text-sage-700">{formatDate(value)}</span>
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
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

    const handleAddPatient = async (newPatient: Omit<Patient, "id" | "criado_em">) => {
        try {
            const token = localStorage.getItem("auth.token");
            const res = await axios.post(
                `${API_URL}/api/patients`,
                {
                    nome: newPatient.nome,
                    telefone: newPatient.telefone,
                    email: newPatient.email,
                    ativo: newPatient.ativo ?? "active",
                },
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            if (res.status < 200 || res.status >= 300) {
                throw new Error("Erro ao criar paciente");
            }

            const created: Patient = res.data;
            const createdWithDate: Patient = {
                ...created,
                criado_em: created.criado_em || new Date().toISOString(),
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
        { header: "Nome", accessor: "nome" as keyof Patient },
        { header: "Telefone", accessor: "telefone" as keyof Patient },
        { header: "Email", accessor: "email" as keyof Patient },
        {
            header: "Data de Cadastro",
            accessor: "criado_em" as keyof Patient,
            Cell: DateCell,
        },
        { header: "Status", accessor: "ativo" as keyof Patient, Cell: StatusCell },
        { header: "Ações", accessor: "id" as keyof Patient, Cell: ActionsCell },
    ];

    const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <MainLayout>
            <div className="mb-8">
                <Title level={1} className="text-sage-700">Pacientes</Title>
            </div>

            {/* Header com busca e ações */}
            <Card variant="elevated" className="mb-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="relative w-full lg:w-1/3">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={20} />
                        <Input
                            id="search"
                            placeholder="Buscar pacientes por nome, telefone ou email..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10 pr-4 py-3 border-sage-200 focus:border-sage-400"
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/custom-fields")}
                            className="border-sage-300 text-sage-700 hover:bg-sage-50"
                        >
                            Campos Personalizados
                        </Button>
                        <Button
                            variant="primary"
                            icon={<FiUserPlus size={18} />}
                            onClick={() => setIsPatientModalOpen(true)}
                            className="bg-sage-600 hover:bg-sage-700 border-sage-600"
                        >
                            Novo Paciente
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Tabela de pacientes */}
            <Card variant="elevated" className="p-0 overflow-hidden">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600 mx-auto mb-4"></div>
                        <p className="text-sage-600">Carregando pacientes...</p>
                    </div>
                ) : currentPatients.length > 0 ? (
                    <>
                        <div className="p-6 border-b border-sage-100">
                            <h3 className="text-lg font-semibold text-sage-800">
                                Lista de Pacientes
                                <span className="text-sage-600 font-normal ml-2">
                                    ({filteredPatients.length} encontrados)
                                </span>
                            </h3>
                        </div>
                        
                        <Table data={currentPatients} columns={columns} />
                        
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-sage-100 bg-sage-50 px-6 py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                                    <div>
                                        <p className="text-sm text-sage-700">
                                            Mostrando{" "}
                                            <span className="font-semibold">{indexOfFirstPatient + 1}</span> a{" "}
                                            <span className="font-semibold">
                                                {Math.min(indexOfLastPatient, filteredPatients.length)}
                                            </span>{" "}
                                            de <span className="font-semibold">{filteredPatients.length}</span> pacientes
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => paginate(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="rounded-lg border-sage-300 text-sage-700 hover:bg-sage-50 disabled:opacity-50"
                                            >
                                                <FiChevronLeft size={16} />
                                            </Button>
                                            
                                            <div className="flex gap-1">
                                                {Array.from({ length: totalPages }, (_, i) => (
                                                    <Button
                                                        key={i + 1}
                                                        variant={i + 1 === currentPage ? "primary" : "outline"}
                                                        size="sm"
                                                        onClick={() => paginate(i + 1)}
                                                        className={`rounded-lg ${
                                                            i + 1 === currentPage 
                                                                ? 'bg-sage-600 border-sage-600' 
                                                                : 'border-sage-300 text-sage-700 hover:bg-sage-50'
                                                        }`}
                                                    >
                                                        {i + 1}
                                                    </Button>
                                                ))}
                                            </div>
                                            
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                                className="rounded-lg border-sage-300 text-sage-700 hover:bg-sage-50 disabled:opacity-50"
                                            >
                                                <FiChevronRight size={16} />
                                            </Button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="bg-sage-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <FiUserPlus size={32} className="text-sage-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-sage-700 mb-2">Nenhum paciente encontrado</h3>
                        <p className="text-sage-600 mb-4">
                            {searchTerm ? "Tente ajustar os termos da busca." : "Comece adicionando seu primeiro paciente."}
                        </p>
                        {!searchTerm && (
                            <Button
                                variant="primary"
                                icon={<FiUserPlus size={16} />}
                                onClick={() => setIsPatientModalOpen(true)}
                                className="bg-sage-600 hover:bg-sage-700"
                            >
                                Adicionar Primeiro Paciente
                            </Button>
                        )}
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