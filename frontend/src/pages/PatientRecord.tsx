import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Title from "../components/Title/Title";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import Input from "../components/Form/Input/Input";
import Table from "../components/Table/Table";
import Icon from "../components/Icon/Icon";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import axios from "axios";

const API_URL = (import.meta as any).env?.BACKEND_URL || "http://localhost:5000";

type UiStatus = "draft" | "final" | "archived" | "pending_review";

type ApiRow = {
    id: number;
    usuario_id: number;
    paciente_id: number;
    tipo_documento_id: number;
    conteudo?: string;
    status: string;
    criado_em: string;
    atualizado_em: string;
    paciente_nome?: string;
    tipo_documento_nome?: string;
};

type PatientRecord = {
    id: string;
    description: string;
    recordType: string;
    createdAt: string;
    status: UiStatus;
};

const mapStatus = (s: string): UiStatus => {
    const x = (s || "").toLowerCase();
    if (x === "final") return "final";
    if (x === "arquivado") return "archived";
    if (x === "revisao_pendente") return "pending_review";
    return "draft";
};

const formatStatus = (status: UiStatus) => {
    const statusMap = {
        draft: "Rascunho",
        final: "Final",
        archived: "Arquivado",
        pending_review: "Revisão Pendente",
    } as const;
    return statusMap[status];
};

const StatusCell: React.FC<{ value: UiStatus }> = ({ value }) => {
    const statusClasses = {
        draft: "bg-yellow-100 text-yellow-800",
        final: "bg-green-100 text-green-800",
        archived: "bg-gray-100 text-gray-800",
        pending_review: "bg-blue-100 text-blue-800",
    } as const;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[value]}`}>{formatStatus(value)}</span>;
};

const ActionsCell: React.FC<{ value: string }> = ({ value }) => {
    return (
        <div className="flex space-x-2">
            <Button variant="outline" size="sm" icon={<Icon type="edit" size={16} />} onClick={() => window.location.assign(`/documents/${value}`)} />
            <Button variant="outline" size="sm" icon={<Icon type="folder" size={16} />} onClick={() => window.location.assign(`/documents/${value}`)} />
            <Button variant="danger" size="sm" icon={<Icon type="trash" size={16} />} onClick={() => console.log("Excluir", value)} />
        </div>
    );
};

const Prontuarios: React.FC = () => {
    const params = useParams();
    const pid = (params.patientId as string) ?? (params.id as string) ?? "";
    const [patientName, setPatientName] = useState<string>("Paciente");
    const [records, setRecords] = useState<PatientRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const recordsPerPage = 11;

    useEffect(() => {
        const run = async () => {
            if (!pid) return;
            setLoading(true);
            setErrorMsg(null);
            try {
                const token = localStorage.getItem("auth.token");
                const res = await axios.get(`${API_URL}/api/patients/${pid}/documents`, {
                    withCredentials: true,
                    headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                });
                const list: ApiRow[] = Array.isArray(res.data?.documents) ? res.data.documents : [];
                if (list.length && list[0]?.paciente_nome) setPatientName(list[0].paciente_nome);
                const mapped: PatientRecord[] = list.map((r) => ({
                    id: String(r.id),
                    description:
                        r.conteudo && r.conteudo.trim() !== ""
                            ? r.conteudo.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)
                            : r.tipo_documento_nome || "Documento",
                    recordType: r.tipo_documento_nome || "Documento",
                    createdAt: r.criado_em ? new Date(r.criado_em).toLocaleDateString("pt-BR") : "",
                    status: mapStatus(r.status),
                }));
                setRecords(mapped);
            } catch (e: any) {
                const msg = e?.response?.data?.erro || "Falha ao carregar documentos";
                setErrorMsg(msg);
                setRecords([]);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [pid]);

    const filtered = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return records.filter((r) => r.description.toLowerCase().includes(q) || r.recordType.toLowerCase().includes(q));
    }, [records, searchTerm]);

    const indexOfLast = currentPage * recordsPerPage;
    const indexOfFirst = indexOfLast - recordsPerPage;
    const current = filtered.slice(indexOfFirst, indexOfLast);

    const columns = [
        { header: "Tipo", accessor: "recordType" as const },
        { header: "Data", accessor: "createdAt" as const },
        { header: "Status", accessor: "status" as const, Cell: StatusCell },
        { header: "Ações", accessor: "id" as const, Cell: ActionsCell },
    ];

    const totalPages = Math.ceil(filtered.length / recordsPerPage);
    const paginate = (p: number) => setCurrentPage(p);

    return (
        <MainLayout>
            <div className="mb-6">
                <Title level={1}>Prontuários de {patientName}</Title>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="w-full md:w-1/3">
                    <Input id="search" placeholder="Buscar prontuários..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%" }} />
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" icon={<Icon type="plus" size={16} />} onClick={() => window.location.assign(`/documents/new?paciente_id=${pid}`)}>
                        Novo Prontuário
                    </Button>
                </div>
            </div>

            <Card>
                {loading ? (
                    <div className="text-center py-8">Carregando...</div>
                ) : errorMsg ? (
                    <div className="text-center py-8 text-red-600">{errorMsg}</div>
                ) : current.length > 0 ? (
                    <>
                        <Table data={current} columns={columns} />
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div className="text-sm text-gray-700">
                                        Mostrando <span className="font-medium">{indexOfFirst + 1}</span> a <span className="font-medium">{Math.min(indexOfLast, filtered.length)}</span> de <span className="font-medium">{filtered.length}</span> resultados
                                    </div>
                                    <div>
                                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                            <Button variant="outline" size="sm" onClick={() => paginate(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                                                <FiChevronLeft size={16} />
                                            </Button>
                                            {(() => {
                                                const visible = 5;
                                                const pages: number[] = [];
                                                let start = Math.max(1, currentPage - Math.floor(visible / 2));
                                                let end = Math.min(totalPages, start + visible - 1);
                                                if (end - start < visible - 1) start = Math.max(1, end - visible + 1);
                                                for (let i = start; i <= end; i++) pages.push(i);
                                                return (
                                                    <>
                                                        {start > 1 && (
                                                            <>
                                                                <Button variant="outline" size="sm" onClick={() => paginate(1)}>1</Button>
                                                                <span className="px-2 py-1 text-sm text-gray-500">...</span>
                                                            </>
                                                        )}
                                                        {pages.map((p) => (
                                                            <Button key={p} variant={p === currentPage ? "primary" : "outline"} size="sm" onClick={() => paginate(p)}>
                                                                {p}
                                                            </Button>
                                                        ))}
                                                        {end < totalPages && (
                                                            <>
                                                                <span className="px-2 py-1 text-sm text-gray-500">...</span>
                                                                <Button variant="outline" size="sm" onClick={() => paginate(totalPages)}>{totalPages}</Button>
                                                            </>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                            <Button variant="outline" size="sm" onClick={() => paginate(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
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
                        <p className="text-gray-500">Nenhum prontuário encontrado.</p>
                    </div>
                )}
            </Card>
        </MainLayout>
    );
};

export default Prontuarios;
