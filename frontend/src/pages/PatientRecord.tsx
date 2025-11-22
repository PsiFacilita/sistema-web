import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Title from "../components/Title/Title";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import Input from "../components/Form/Input/Input";
import Table from "../components/Table/Table";
import Icon from "../components/Icon/Icon";
import Modal from "../components/Modal/Modal";
import { Editor } from "@tinymce/tinymce-react";
import { FiChevronLeft, FiEye, FiSearch, FiChevronRight, FiFileText, FiPlus } from "react-icons/fi";
import axios from "axios";
import Swal from "sweetalert2";

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
        draft: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        final: "bg-green-100 text-green-800 border border-green-200",
        archived: "bg-gray-100 text-gray-800 border border-gray-200",
        pending_review: "bg-blue-100 text-blue-800 border border-blue-200",
    } as const;

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses[value]}`}>
            {formatStatus(value)}
        </span>
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
    const [showCreateRecordModal, setShowCreateRecordModal] = useState(false);
    const [showEditRecordModal, setShowEditRecordModal] = useState(false);
    const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
    const [newRecord, setNewRecord] = useState({
        tipo_documento_id: "",
        conteudo: "",
        status: "rascunho",
    });
    const [editRecord, setEditRecord] = useState({
        tipo_documento_id: "",
        conteudo: "",
        status: "rascunho",
    });
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
                    headers: {
                        Accept: "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                });

                const list: ApiRow[] = Array.isArray(res.data?.documents)
                    ? res.data.documents
                    : [];

                if (list.length && list[0]?.paciente_nome) {
                    setPatientName(list[0].paciente_nome);
                }

                const mapped = list.map((r) => ({
                    id: String(r.id),
                    description:
                        r.conteudo?.trim()
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
        return records.filter(
            (r) =>
                r.description.toLowerCase().includes(q) ||
                r.recordType.toLowerCase().includes(q)
        );
    }, [records, searchTerm]);

    const indexOfLast = currentPage * recordsPerPage;
    const indexOfFirst = indexOfLast - recordsPerPage;
    const current = filtered.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filtered.length / recordsPerPage);

    const paginate = (p: number) => setCurrentPage(p);

    const handleCreateRecord = async () => {
        if (!newRecord.tipo_documento_id || !newRecord.conteudo) {
            Swal.fire({
                title: "Erro",
                text: "Preencha todos os campos obrigatórios",
                icon: "error",
                background: "#fff",
                color: "#374151"
            });
            return;
        }

        try {
            const token = localStorage.getItem("auth.token");
            const payload = {
                paciente_id: parseInt(pid),
                tipo_documento_id: parseInt(newRecord.tipo_documento_id),
                conteudo: newRecord.conteudo,
                status: newRecord.status,
            };

            await axios.post(`${API_URL}/api/documents`, payload, {
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            Swal.fire({
                title: "Sucesso!",
                text: "Prontuário criado com sucesso!",
                icon: "success",
                background: "#fff",
                color: "#374151"
            });

            setShowCreateRecordModal(false);
            setNewRecord({ tipo_documento_id: "", conteudo: "", status: "rascunho" });
            window.location.reload();
        } catch (error: any) {
            const mensagemErro = error.response?.data?.erro || "Não foi possível criar o prontuário.";
            Swal.fire({
                title: "Erro!",
                text: mensagemErro,
                icon: "error",
                background: "#fff",
                color: "#374151"
            });
        }
    };

    const handleEditRecord = async (id: string) => {
        try {
            const token = localStorage.getItem("auth.token");
            const res = await axios.get(`${API_URL}/api/documents/${id}`, {
                withCredentials: true,
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
            });

            setEditRecord({
                tipo_documento_id: res.data.tipo_documento_id?.toString() || "",
                conteudo: res.data.conteudo || "",
                status: res.data.status || "rascunho",
            });
            setEditingRecordId(id);
            setShowEditRecordModal(true);
        } catch (error: any) {
            Swal.fire({
                title: "Erro",
                text: "Não foi possível carregar o prontuário.",
                icon: "error",
                background: "#fff",
                color: "#374151"
            });
        }
    };

    const handleUpdateRecord = async () => {
        if (!editingRecordId || !editRecord.tipo_documento_id || !editRecord.conteudo) {
            Swal.fire({
                title: "Erro",
                text: "Preencha todos os campos obrigatórios",
                icon: "error",
                background: "#fff",
                color: "#374151"
            });
            return;
        }

        try {
            const token = localStorage.getItem("auth.token");
            await axios.put(`${API_URL}/api/documents/${editingRecordId}`, editRecord, {
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            Swal.fire({
                title: "Sucesso!",
                text: "Prontuário atualizado com sucesso!",
                icon: "success",
                background: "#fff",
                color: "#374151"
            });

            setShowEditRecordModal(false);
            setEditingRecordId(null);
            window.location.reload();
        } catch (error: any) {
            const msg = error.response?.data?.erro || "Não foi possível atualizar o prontuário.";
            Swal.fire({
                title: "Erro!",
                text: msg,
                icon: "error",
                background: "#fff",
                color: "#374151"
            });
        }
    };

    const ActionsCell: React.FC<{ value: string }> = ({ value }) => {
        return (
            <div className="flex space-x-2">
                <button
                    onClick={() => window.location.assign(`/documents/${value}`)}
                    className="flex items-center gap-2 rounded-lg bg-sage-100 px-3 py-2 text-sm text-sage-700 
                    hover:bg-sage-200 hover:text-sage-800 transition-all duration-300"
                >
                    <FiEye size={16} />
                    Visualizar
                </button>

                <button
                    onClick={() => handleEditRecord(value)}
                    className="flex items-center gap-2 rounded-lg bg-sage-50 px-3 py-2 text-sm text-sage-600 
                    hover:bg-sage-100 hover:text-sage-700 transition-all duration-300 border border-sage-200"
                >
                    <Icon type="edit" size={16} />
                    Editar
                </button>
            </div>
        );
    };

    const columns = [
        { header: "Tipo", accessor: "recordType" as const },
        { header: "Data", accessor: "createdAt" as const },
        { header: "Status", accessor: "status" as const, Cell: StatusCell },
        { header: "Ações", accessor: "id" as const, Cell: ActionsCell },
    ];

    return (
        <MainLayout>
            {/* Título */}
            <div className="mb-8">
                <Title level={1} className="text-sage-700">
                    Prontuários de {patientName}
                </Title>
            </div>

            {/* Barra de busca + botão */}
            <Card variant="elevated" className="mb-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="relative w-full lg:w-1/3">
                        <FiSearch
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400"
                            size={20}
                        />

                        <Input
                            id="search"
                            placeholder="Buscar prontuários..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-3 border-sage-200 focus:border-sage-400"
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="primary"
                            icon={<FiPlus size={18} />}
                            onClick={() => setShowCreateRecordModal(true)}
                            className="bg-sage-600 hover:bg-sage-700 border-sage-600"
                        >
                            Novo Prontuário
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Lista */}
            <Card variant="elevated" className="p-0 overflow-hidden">
                {loading ? (
                    <div className="text-center py-12 text-sage-600">Carregando...</div>
                ) : errorMsg ? (
                    <div className="text-center py-12 text-red-600">{errorMsg}</div>
                ) : current.length > 0 ? (
                    <>
                        {/* Header da tabela */}
                        <div className="p-6 border-b border-sage-100">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-sage-800">
                                <FiFileText size={20} />
                                Lista de Prontuários
                                <span className="text-sage-600 font-normal ml-2">
                                    ({filtered.length} encontrados)
                                </span>
                            </h3>
                        </div>

                        <Table data={current} columns={columns} />

                        {/* Paginação */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-sage-100 bg-sage-50 px-6 py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                                    <div>
                                        <p className="text-sm text-sage-700">
                                            Mostrando{" "}
                                            <span className="font-semibold">{indexOfFirst + 1}</span>{" "}
                                            a{" "}
                                            <span className="font-semibold">
                                                {Math.min(indexOfLast, filtered.length)}
                                            </span>{" "}
                                            de{" "}
                                            <span className="font-semibold">{filtered.length}</span>{" "}
                                            prontuários
                                        </p>
                                    </div>

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
                                            {(() => {
                                                const visiblePages = 5;
                                                const pages: number[] = [];
                                                let start = Math.max(
                                                    1,
                                                    currentPage - Math.floor(visiblePages / 2)
                                                );
                                                let end = Math.min(totalPages, start + visiblePages - 1);

                                                if (end - start < visiblePages - 1) {
                                                    start = Math.max(1, end - visiblePages + 1);
                                                }

                                                for (let i = start; i <= end; i++) pages.push(i);

                                                return (
                                                    <>
                                                        {start > 1 && (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => paginate(1)}
                                                                    className="rounded-lg border-sage-300 text-sage-700 hover:bg-sage-50"
                                                                >
                                                                    1
                                                                </Button>
                                                                <span className="px-2 py-1 text-sm text-sage-400">...</span>
                                                            </>
                                                        )}

                                                        {pages.map((p) => (
                                                            <Button
                                                                key={p}
                                                                variant={p === currentPage ? "primary" : "outline"}
                                                                size="sm"
                                                                onClick={() => paginate(p)}
                                                                className={`rounded-lg ${
                                                                    p === currentPage
                                                                        ? "bg-sage-600 border-sage-600 text-white"
                                                                        : "border-sage-300 text-sage-700 hover:bg-sage-50"
                                                                }`}
                                                            >
                                                                {p}
                                                            </Button>
                                                        ))}

                                                        {end < totalPages && (
                                                            <>
                                                                <span className="px-2 py-1 text-sm text-sage-400">...</span>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => paginate(totalPages)}
                                                                    className="rounded-lg border-sage-300 text-sage-700 hover:bg-sage-50"
                                                                >
                                                                    {totalPages}
                                                                </Button>
                                                            </>
                                                        )}
                                                    </>
                                                );
                                            })()}
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
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="bg-sage-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <FiFileText size={32} className="text-sage-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-sage-700 mb-2">
                            Nenhum prontuário encontrado
                        </h3>
                        <p className="text-sage-600 mb-4">
                            {searchTerm
                                ? "Tente ajustar os termos da busca."
                                : "Comece criando o primeiro prontuário."}
                        </p>

                        {!searchTerm && (
                            <Button
                                variant="primary"
                                icon={<FiPlus size={16} />}
                                onClick={() => setShowCreateRecordModal(true)}
                                className="bg-sage-600 hover:bg-sage-700"
                            >
                                Criar Novo Prontuário
                            </Button>
                        )}
                    </div>
                )}
            </Card>

            {/* Modal para criar novo prontuário */}
            <Modal
                isOpen={showCreateRecordModal}
                onClose={() => setShowCreateRecordModal(false)}
                title="Criar Novo Prontuário"
                size="medium"
                showCloseButton={true}
            >
                <div className="space-y-6 mt-4">
                    <div className="bg-sage-50 rounded-xl p-4">
                        <h3 className="flex items-center gap-2 text-sage-700 font-semibold mb-4">
                            <FiFileText size={18} />
                            Informações do Prontuário
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-sage-700 mb-2">
                                    Paciente
                                </label>
                                <Input
                                    type="text"
                                    value={patientName}
                                    disabled
                                    className="border-sage-200 bg-gray-100 cursor-not-allowed"
                                />
                                <p className="text-xs text-sage-600 mt-1">Paciente pré-selecionado</p>
                            </div>

                            <div>
                                <label htmlFor="record-type" className="block text-sm font-medium text-sage-700 mb-2">
                                    Tipo de Documento *
                                </label>
                                <select
                                    id="record-type"
                                    value={newRecord.tipo_documento_id}
                                    onChange={(e) => setNewRecord({ ...newRecord, tipo_documento_id: e.target.value })}
                                    className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm focus:border-sage-400 focus:outline-none"
                                    required
                                >
                                    <option value="">Selecione um tipo</option>
                                    <option value="1">Evolução</option>
                                    <option value="2">Anamnese</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-sage-700 mb-2">
                                    Conteúdo *
                                </label>
                                <Editor
                                    value={newRecord.conteudo}
                                    onEditorChange={(v) => setNewRecord({ ...newRecord, conteudo: v })}
                                    apiKey={(import.meta as any).env?.VITE_TINYMCE_API_KEY}
                                    init={{
                                        height: 360,
                                        menubar: false,
                                        plugins: "lists link table code codesample advlist autoresize",
                                        toolbar: "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist outdent indent | link table | removeformat | code",
                                        branding: false,
                                        statusbar: false,
                                        content_style: "body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px}"
                                    }}
                                />
                            </div>

                            <div>
                                <label htmlFor="record-status" className="block text-sm font-medium text-sage-700 mb-2">
                                    Status *
                                </label>
                                <select
                                    id="record-status"
                                    value={newRecord.status}
                                    onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value })}
                                    className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm focus:border-sage-400 focus:outline-none"
                                    required
                                >
                                    <option value="rascunho">Rascunho</option>
                                    <option value="final">Final</option>
                                    <option value="arquivado">Arquivado</option>
                                    <option value="revisao_pendente">Revisão Pendente</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-sage-100">
                        <Button
                            variant="outline"
                            onClick={() => setShowCreateRecordModal(false)}
                            className="border-sage-300 text-sage-700 hover:bg-sage-50"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreateRecord}
                            className="bg-sage-600 hover:bg-sage-700 border-sage-600"
                        >
                            Criar Prontuário
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal para editar prontuário */}
            <Modal
                isOpen={showEditRecordModal}
                onClose={() => setShowEditRecordModal(false)}
                title="Editar Prontuário"
                size="medium"
                showCloseButton={true}
            >
                <div className="space-y-6 mt-4">
                    <div className="bg-sage-50 rounded-xl p-4">
                        <h3 className="flex items-center gap-2 text-sage-700 font-semibold mb-4">
                            <FiFileText size={18} />
                            Informações do Prontuário
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-sage-700 mb-2">
                                    Paciente
                                </label>
                                <Input
                                    type="text"
                                    value={patientName}
                                    disabled
                                    className="border-sage-200 bg-gray-100 cursor-not-allowed"
                                />
                                <p className="text-xs text-sage-600 mt-1">Paciente pré-selecionado</p>
                            </div>

                            <div>
                                <label htmlFor="edit-record-type" className="block text-sm font-medium text-sage-700 mb-2">
                                    Tipo de Documento *
                                </label>
                                <select
                                    id="edit-record-type"
                                    value={editRecord.tipo_documento_id}
                                    onChange={(e) => setEditRecord({ ...editRecord, tipo_documento_id: e.target.value })}
                                    className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm focus:border-sage-400 focus:outline-none"
                                    required
                                >
                                    <option value="">Selecione um tipo</option>
                                    <option value="1">Evolução</option>
                                    <option value="2">Anamnese</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-sage-700 mb-2">
                                    Conteúdo *
                                </label>
                                <Editor
                                    value={editRecord.conteudo}
                                    onEditorChange={(v) => setEditRecord({ ...editRecord, conteudo: v })}
                                    apiKey={(import.meta as any).env?.VITE_TINYMCE_API_KEY}
                                    init={{
                                        height: 360,
                                        menubar: false,
                                        plugins: "lists link table code codesample advlist autoresize",
                                        toolbar: "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist outdent indent | link table | removeformat | code",
                                        branding: false,
                                        statusbar: false,
                                        content_style: "body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px}"
                                    }}
                                />
                            </div>

                            <div>
                                <label htmlFor="edit-record-status" className="block text-sm font-medium text-sage-700 mb-2">
                                    Status *
                                </label>
                                <select
                                    id="edit-record-status"
                                    value={editRecord.status}
                                    onChange={(e) => setEditRecord({ ...editRecord, status: e.target.value })}
                                    className="w-full border border-sage-200 rounded-lg px-3 py-2 text-sm focus:border-sage-400 focus:outline-none"
                                    required
                                >
                                    <option value="rascunho">Rascunho</option>
                                    <option value="final">Final</option>
                                    <option value="arquivado">Arquivado</option>
                                    <option value="revisao_pendente">Revisão Pendente</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-sage-100">
                        <Button
                            variant="outline"
                            onClick={() => setShowEditRecordModal(false)}
                            className="border-sage-300 text-sage-700 hover:bg-sage-50"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleUpdateRecord}
                            className="bg-sage-600 hover:bg-sage-700 border-sage-600"
                        >
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </Modal>
        </MainLayout>
    );
};

export default Prontuarios;