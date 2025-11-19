import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Title from "../components/Title/Title";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import Input from "../components/Form/Input/Input";
import Table from "../components/Table/Table";
import Icon from "../components/Icon/Icon";
import { FiChevronLeft, FiChevronRight, FiSearch, FiUserPlus } from "react-icons/fi";
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

const StatusCell: React.FC<{ value: string }> = ({ value }) => {
    const status = value as Patient["ativo"];
    const statusClasses: Record<Patient["ativo"], string> = {
        active: "bg-green-100 text-green-800 border border-green-200",
        inactive: "bg-red-100 text-red-800 border border-red-200",
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses[status]}`}>
            {formatStatus(status)}
        </span>
    );
};

const ActionsCell: React.FC<{ value: string; onEdit: (id: string) => void }> = ({ value, onEdit }) => {
    const navigate = useNavigate();
    return (
        <div className="flex space-x-2">
            <Button
                variant="outline"
                size="sm"
                icon={<Icon type="eye" size={16} />}
                onClick={() => navigate(`/patients/${value}`)}
                className="flex items-center gap-2 rounded-lg bg-sage-100 px-3 py-2 text-sm text-sage-700 hover:bg-sage-200 hover:text-sage-800 transition-all duration-300"
            >
                Visualizar
            </Button>

            <Button
                variant="outline"
                size="sm"
                icon={<Icon type="edit" size={16} />}
                aria-label="Editar"
                onClick={() => onEdit(value)}
                className="flex items-center gap-2 rounded-lg bg-sage-50 px-3 py-2 text-sm text-sage-600 hover:bg-sage-100 hover:text-sage-700 transition-all duration-300 border border-sage-200"
            >
                Editar
            </Button>
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
    const [currentPatient, setCurrentPatient] = useState<{
        id?: string;
        name?: string;
        birthDate?: string;
        cpf?: string;
        rg?: string;
        phone?: string;
        email?: string;
        notes?: string;
        status?: "active" | "inactive";
    } | null>(null);
    const patientsPerPage = 10;

    const fetchPatients = async () => {
        try {
            setLoading(true);
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
            if (axios.isAxiosError(err)) {
                console.error("Erro na requisição:", {
                    status: err.response?.status,
                    data: err.response?.data,
                    headers: err.response?.headers,
                    message: err.message
                });
                if (err.response?.status === 401) {
                    window.location.href = "/login";
                    return;
                }
            } else {
                console.error("Erro desconhecido ao buscar pacientes:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleAddPatient = async (modalData: {
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
            const token = localStorage.getItem("auth.token");
            const res = await axios.post(
                `${API_URL}/api/patients`,
                {
                    nome: modalData.name,
                    telefone: modalData.phone,
                    email: modalData.email,
                    cpf: modalData.cpf,
                    rg: modalData.rg,
                    data_nascimento: modalData.birthDate,
                    notas: modalData.notes,
                    ativo: modalData.status === "active" ? "active" : "inactive",
                    customFields: modalData.customFields ?? [],
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

            const backendResponse = res.data;
            const newPatient: Patient = {
                id: backendResponse.id?.toString() || "",
                nome: backendResponse.nome || modalData.name,
                telefone: backendResponse.telefone || modalData.phone,
                email: backendResponse.email || modalData.email || "",
                ativo: backendResponse.ativo || modalData.status,
                criado_em: backendResponse.criado_em || new Date().toISOString(),
            };

            setPatients((prev: Patient[]) => [newPatient, ...prev]);
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

    const handleEditPatient = async (patientId: string) => {
        try {
            setLoading(true);
            const token = localStorage.getItem("auth.token");
            const res = await axios.get(`${API_URL}/api/patients/${patientId}`, {
                withCredentials: true,
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            const apiData = res.data as any;
            const patientData = apiData.patient || apiData;

            const mappedPatient = {
                id: patientData.id?.toString() ?? patientId,
                name: patientData.name || patientData.nome || "",
                phone: patientData.phone || patientData.telefone || "",
                email: patientData.email || "",
                cpf: patientData.cpf || "",
                rg: patientData.rg || "",
                birthDate: patientData.birthDate || patientData.data_nascimento || "",
                notes: patientData.notes || patientData.notas || "",
                status: ((patientData.status || patientData.ativo) === "active" ? "active" : "inactive") as "active" | "inactive",
            };

            setCurrentPatient(mappedPatient);
            setIsPatientModalOpen(true);
        } catch (error) {
            console.error("Erro ao carregar dados do paciente:", error);
            alert("Erro ao carregar dados do paciente");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePatient = async (modalData: {
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
            if (!currentPatient?.id) {
                console.error("Tentativa de atualizar sem ID de paciente");
                return;
            }

            const token = localStorage.getItem("auth.token");
            const res = await axios.put(
                `${API_URL}/api/patients/${currentPatient.id}`,
                {
                    nome: modalData.name,
                    telefone: modalData.phone,
                    email: modalData.email,
                    cpf: modalData.cpf,
                    rg: modalData.rg,
                    data_nascimento: modalData.birthDate,
                    notas: modalData.notes,
                    ativo: modalData.status === "active" ? "active" : "inactive",
                    customFields: modalData.customFields ?? [],
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
                throw new Error("Erro ao atualizar paciente");
            }

            const updatedPatients = patients.map((p: Patient) =>
                p.id === currentPatient.id
                    ? {
                        ...p,
                        nome: modalData.name,
                        telefone: modalData.phone,
                        email: modalData.email || "",
                        ativo: modalData.status
                    }
                    : p
            );

            setPatients(updatedPatients);
            setCurrentPatient(null);
            setIsPatientModalOpen(false);
            fetchPatients();
        } catch (error) {
            console.error("Erro ao atualizar paciente:", error);
            alert("Erro ao atualizar paciente");
        }
    };

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
        {
            header: "Ações",
            accessor: "id" as keyof Patient,
            Cell: ({ value }: { value: string }) => (
                <ActionsCell value={value} onEdit={handleEditPatient} />
            )
        },
    ];

    const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <MainLayout>
            <div className="mb-8">
                <Title level={1} className="text-sage-700">Pacientes</Title>
            </div>

            <Card variant="elevated" className="mb-6">
                <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:justify-between lg:items-center">
                    <div className="relative w-full lg:w-1/2 xl:w-1/3">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={20} />
                        <Input
                            id="search"
                            placeholder="Buscar pacientes por nome, telefone ou email..."
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10 pr-4 py-3 border-sage-200 focus:border-sage-400"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/custom-fields")}
                            className="border-sage-300 text-sage-700 hover:bg-sage-50 w-full sm:w-auto"
                        >
                            <span className="hidden sm:inline">Campos Personalizados</span>
                            <span className="sm:hidden">Campos</span>
                        </Button>
                        <Button
                            variant="primary"
                            icon={<FiUserPlus size={18} />}
                            onClick={() => {
                                setCurrentPatient(null);
                                setIsPatientModalOpen(true);
                            }}
                            className="bg-sage-600 hover:bg-sage-700 border-sage-600 w-full sm:w-auto"
                        >
                            <span className="hidden sm:inline">Novo Paciente</span>
                            <span className="sm:hidden">Novo</span>
                        </Button>
                    </div>
                </div>
            </Card>

            <Card variant="elevated" className="p-0 overflow-x-auto">
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
                            <div className="border-t border-sage-100 bg-sage-50 px-4 py-4 sm:px-6">
                                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-center sm:text-left">
                                        <p className="text-sm text-sage-700">
                                            <span className="hidden sm:inline">
                                                Mostrando{" "}
                                                <span className="font-semibold">{indexOfFirstPatient + 1}</span> a{" "}
                                                <span className="font-semibold">
                                                    {Math.min(indexOfLastPatient, filteredPatients.length)}
                                                </span>{" "}
                                                de{" "}
                                            </span>
                                            <span className="font-semibold">{filteredPatients.length}</span> pacientes
                                        </p>
                                    </div>

                                    <div className="flex justify-center sm:justify-end">
                                        <nav className="flex items-center gap-1 sm:gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => paginate(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="rounded-lg border-sage-300 text-sage-700 hover:bg-sage-50 disabled:opacity-50"
                                            >
                                                <FiChevronLeft size={16} />
                                                <span className="hidden sm:inline ml-1">Anterior</span>
                                            </Button>

                                            <div className="flex gap-1">
                                                {(() => {
                                                    const maxVisible = window.innerWidth < 640 ? 3 : 5;
                                                    const startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                                                    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

                                                    const pages = [];
                                                    for (let i = startPage; i <= endPage; i++) {
                                                        pages.push(
                                                            <Button
                                                                key={i}
                                                                variant={i === currentPage ? "primary" : "outline"}
                                                                size="sm"
                                                                onClick={() => paginate(i)}
                                                                className={`rounded-lg ${
                                                                    i === currentPage
                                                                        ? "bg-sage-600 border-sage-600"
                                                                        : "border-sage-300 text-sage-700 hover:bg-sage-50"
                                                                }`}
                                                            >
                                                                {i}
                                                            </Button>
                                                        );
                                                    }
                                                    return pages;
                                                })()}
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                                className="rounded-lg border-sage-300 text-sage-700 hover:bg-sage-50 disabled:opacity-50"
                                            >
                                                <span className="hidden sm:inline mr-1">Próximo</span>
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
                                onClick={() => {
                                    setCurrentPatient(null);
                                    setIsPatientModalOpen(true);
                                }}
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
                onClose={() => {
                    setIsPatientModalOpen(false);
                    setCurrentPatient(null);
                }}
                onSubmit={data => {
                    if (currentPatient?.id) {
                        handleUpdatePatient(data);
                    } else {
                        handleAddPatient(data);
                    }
                }}
                key={currentPatient?.id || "new"}
                initialData={currentPatient ? {
                    id: currentPatient.id,
                    name: currentPatient.name || "",
                    birthDate: currentPatient.birthDate || "",
                    cpf: currentPatient.cpf || "",
                    rg: currentPatient.rg || "",
                    phone: currentPatient.phone || "",
                    email: currentPatient.email || "",
                    notes: currentPatient.notes || "",
                    status: currentPatient.status || "active"
                } : undefined}
                title={currentPatient ? `Editar Paciente: ${currentPatient.name || ""}` : "Adicionar Novo Paciente"}
                submitLabel={currentPatient ? "Atualizar Paciente" : "Salvar Paciente"}
            />
        </MainLayout>
    );
};

export default Patients;
