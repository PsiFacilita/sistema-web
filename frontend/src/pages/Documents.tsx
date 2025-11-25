import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Title from "../components/Title/Title";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import Input from "../components/Form/Input/Input";
import Table from "../components/Table/Table";
import Icon from "../components/Icon/Icon";
import Modal from "../components/Modal/Modal";
import { Select } from "../components/Form/Select/Select";
import { FiChevronLeft, FiChevronRight, FiEye, FiSearch, FiFileText, FiPlus } from "react-icons/fi";
import Swal from "sweetalert2";
import { Editor } from "@tinymce/tinymce-react";

const API_URL = (import.meta as any).env?.BACKEND_URL || "http://localhost:5000";

export interface Document {
    id: number;
    usuario_id: number;
    paciente_id: number;
    tipo_documento_id: number;
    conteudo: string;
    status: "rascunho" | "final" | "arquivado" | "revisao_pendente";
    criado_em: string;
    atualizado_em: string;
    paciente_nome?: string;
    tipo_documento_nome?: string;
}

interface Patient {
    id: number;
    nome: string;
}

interface DocumentType {
    id: number;
    name: string;
}

interface Template {
    id: number;
    tipo_documento_id: number;
    tipo_documento_nome: string;
    conteudo: string;
    criado_em: string;
}

const formatStatus = (status: Document["status"]) => {
    const statusMap = {
        rascunho: "Rascunho",
        final: "Final",
        arquivado: "Arquivado",
        revisao_pendente: "Revisão Pendente",
    };
    return statusMap[status] || status;
};

const StatusCell: React.FC<{ value: Document["status"] }> = ({ value }) => {
    const statusClasses = {
        rascunho: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        final: "bg-green-100 text-green-800 border border-green-200",
        arquivado: "bg-gray-100 text-gray-800 border border-gray-200",
        revisao_pendente: "bg-blue-100 text-blue-800 border border-blue-200",
    };

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses[value]}`}
        >
      {formatStatus(value)}
    </span>
    );
};

const Documents: React.FC = () => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<Document | null>(null);
    const [newDocument, setNewDocument] = useState({
        paciente_id: "",
        tipo_documento_id: "",
        conteudo: "",
        status: "rascunho" as Document["status"],
    });
    const documentsPerPage = 11;

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("auth.token");
            const res = await axios.get(`${API_URL}/api/documents`, {
                withCredentials: true,
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const data = res.data;
            const list = Array.isArray(data?.documents) ? data.documents : [];
            setDocuments(list);
        } catch (err: any) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 401) {
                    window.location.href = "/";
                    return;
                }
            }
        } finally {
            setLoading(false);
        }
    };

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
            setPatients(list);
        } catch {}
    };

    const fetchDocumentTypes = async () => {
        setDocumentTypes([
            { id: 1, name: "Evolução" },
            { id: 2, name: "Anamnese" },
        ]);
    };

    const fetchTemplates = async () => {
        try {
            const token = localStorage.getItem("auth.token");
            const res = await axios.get(`${API_URL}/api/document-templates`, {
                withCredentials: true,
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const data = res.data;
            if (data.templates) setTemplates(data.templates);
        } catch (err) {
            console.error("Erro ao buscar modelos:", err);
        }
    };

    useEffect(() => {
        fetchDocuments();
        fetchPatients();
        fetchDocumentTypes();
        fetchTemplates();
    }, []);

    const handleCreateDocument = async () => {
        if (!newDocument.paciente_id || !newDocument.tipo_documento_id || !newDocument.conteudo) {
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
                paciente_id: parseInt(newDocument.paciente_id),
                tipo_documento_id: parseInt(newDocument.tipo_documento_id),
                conteudo: newDocument.conteudo,
                status: newDocument.status,
            };
            const res = await axios.post(
                `${API_URL}/api/documents`,
                payload,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            Swal.fire({
                title: "Sucesso!",
                text: "Documento criado com sucesso!",
                icon: "success",
                background: "#fff",
                color: "#374151"
            });

            setIsModalOpen(false);
            setNewDocument({
                paciente_id: "",
                tipo_documento_id: "",
                conteudo: "",
                status: "rascunho",
            });
            fetchDocuments();
        } catch (error: any) {
            const mensagemErro = error.response?.data?.erro || "Não foi possível criar o documento.";
            Swal.fire({
                title: "Erro!",
                text: mensagemErro,
                icon: "error",
                background: "#fff",
                color: "#374151"
            });
        }
    };

    const handleDeleteDocument = async (id: number) => {
        Swal.fire({
            title: "Tem certeza?",
            text: "Essa ação não poderá ser desfeita!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#aaa",
            confirmButtonText: "Sim, deletar",
            cancelButtonText: "Cancelar",
            background: "#fff",
            color: "#374151"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem("auth.token");
                    await axios.delete(`${API_URL}/api/documents/${id}`, {
                        withCredentials: true,
                        headers: {
                            Accept: "application/json",
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    });
                    Swal.fire({
                        title: "Deletado!",
                        text: "O documento foi deletado.",
                        icon: "success",
                        background: "#fff",
                        color: "#374151"
                    });
                    fetchDocuments();
                } catch (error: any) {
                    const mensagemErro = error.response?.data?.erro || "Não foi possível deletar o documento.";
                    Swal.fire({
                        title: "Erro!",
                        text: mensagemErro,
                        icon: "error",
                        background: "#fff",
                        color: "#374151"
                    });
                }
            }
        });
    };

    const handleEditDocument = async (id: number) => {
        try {
            const token = localStorage.getItem("auth.token");
            const res = await axios.get(`${API_URL}/api/documents/${id}`, {
                withCredentials: true,
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const doc = res.data.document;
            setEditingDocument(doc);
            setIsEditModalOpen(true);
        } catch {
            Swal.fire({
                title: "Erro!",
                text: "Não foi possível carregar o documento.",
                icon: "error",
                background: "#fff",
                color: "#374151"
            });
        }
    };

    const handleUpdateDocument = async () => {
        if (!editingDocument) return;

        if (!editingDocument.conteudo || !editingDocument.status) {
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
                conteudo: editingDocument.conteudo,
                status: editingDocument.status,
                tipo_documento_id: editingDocument.tipo_documento_id,
            };
            await axios.put(
                `${API_URL}/api/documents/${editingDocument.id}`,
                payload,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            Swal.fire({
                title: "Sucesso!",
                text: "Documento atualizado com sucesso!",
                icon: "success",
                background: "#fff",
                color: "#374151"
            });

            setIsEditModalOpen(false);
            setEditingDocument(null);
            fetchDocuments();
        } catch (error: any) {
            const mensagemErro = error.response?.data?.erro || "Não foi possível atualizar o documento.";
            Swal.fire({
                title: "Erro!",
                text: mensagemErro,
                icon: "error",
                background: "#fff",
                color: "#374151"
            });
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setNewDocument(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTemplateChange = (templateId: string) => {
        const template = templates.find((t: Template) => t.id === Number(templateId));
        if (template) {
            let content = template.conteudo;
            if (newDocument.paciente_id) {
                const patient = patients.find((p: Patient) => p.id === Number(newDocument.paciente_id));
                if (patient) {
                    content = content.replace(/#nome/g, patient.nome);
                }
            }
            setNewDocument((prev: any) => ({
                ...prev,
                conteudo: content,
                tipo_documento_id: String(template.tipo_documento_id),
            }));
        }
    };

    const filteredDocuments = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return documents.filter(
            (doc) =>
                (doc.paciente_nome ?? "").toLowerCase().includes(q) ||
                (doc.tipo_documento_nome ?? "").toLowerCase().includes(q) ||
                doc.conteudo.toLowerCase().includes(q)
        );
    }, [documents, searchTerm]);

    const indexOfLastDocument = currentPage * documentsPerPage;
    const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
    const currentDocuments = filteredDocuments.slice(
        indexOfFirstDocument,
        indexOfLastDocument
    );

    const columns = [
        {
            header: "Paciente",
            accessor: "paciente_nome" as keyof Document,
        },
        {
            header: "Tipo",
            accessor: "tipo_documento_nome" as keyof Document,
        },
        {
            header: "Data Criação",
            accessor: "criado_em" as keyof Document,
            Cell: ({ value }: { value: string }) => (
                <span>{new Date(value).toLocaleDateString("pt-BR")}</span>
            ),
        },
        {
            header: "Status",
            accessor: "status" as keyof Document,
            Cell: StatusCell,
        },
        {
            header: "Ações",
            accessor: "id" as keyof Document,
            Cell: ({ value }: { value: number }) => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => navigate(`/documents/${value}`)}
                        className="flex items-center gap-2 rounded-lg bg-sage-100 px-3 py-2 text-sm text-sage-700 hover:bg-sage-200 hover:text-sage-800 transition-all duration-300"
                    >
                        <FiEye size={16} />
                        Visualizar
                    </button>

                    <button
                        onClick={() => handleEditDocument(value)}
                        className="flex items-center gap-2 rounded-lg bg-sage-50 px-3 py-2 text-sm text-sage-600 hover:bg-sage-100 hover:text-sage-700 transition-all duration-300 border border-sage-200"
                    >
                        <Icon type="edit" size={16} />
                        Editar
                    </button>

                    <button
                        onClick={() => handleDeleteDocument(value)}
                        className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-300 border border-red-200"
                    >
                        <Icon type="trash" size={16} />
                        Deletar
                    </button>
                </div>
            ),
        },
    ];

    const totalPages = Math.ceil(filteredDocuments.length / documentsPerPage);
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const patientOptions = patients.map(p => ({
        value: p.id.toString(),
        label: p.nome,
    }));

    const documentTypeOptions = documentTypes.map(t => ({
        value: t.id.toString(),
        label: t.name,
    }));

    const statusOptions = [
        { value: "rascunho", label: "Rascunho" },
        { value: "final", label: "Final" },
        { value: "arquivado", label: "Arquivado" },
        { value: "revisao_pendente", label: "Revisão Pendente" },
    ];

    return (
        <MainLayout>
            <div className="mb-8">
                <Title level={1} className="text-sage-700">Documentos</Title>
            </div>

            <Card variant="elevated" className="mb-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="relative w-full lg:w-1/3">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={20} />
                        <Input
                            id="search"
                            placeholder="Buscar documentos por título, paciente ou categoria..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-3 border-sage-200 focus:border-sage-400"
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/document-templates")}
                            className="border-sage-300 text-sage-700 hover:bg-sage-50"
                        >
                            Modelos de Documentos
                        </Button>
                        <Button
                            variant="primary"
                            icon={<FiPlus size={18} />}
                            onClick={() => setIsModalOpen(true)}
                            className="bg-sage-600 hover:bg-sage-700 border-sage-600"
                        >
                            Novo Documento
                        </Button>
                    </div>
                </div>
            </Card>

            <Card variant="elevated" className="p-0 overflow-hidden">
                {currentDocuments.length > 0 ? (
                    <>
                        <div className="p-6 border-b border-sage-100">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-sage-800">
                                <FiFileText size={20} />
                                Lista de Documentos
                                <span className="text-sage-600 font-normal ml-2">
                  ({filteredDocuments.length} encontrados)
                </span>
                            </h3>
                        </div>

                        <Table data={currentDocuments} columns={columns} />

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-sage-100 bg-sage-50 px-6 py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                                    <div>
                                        <p className="text-sm text-sage-700">
                                            Mostrando{" "}
                                            <span className="font-semibold">{indexOfFirstDocument + 1}</span> a{" "}
                                            <span className="font-semibold">
                        {Math.min(indexOfLastDocument, filteredDocuments.length)}
                      </span>{" "}
                                            de <span className="font-semibold">{filteredDocuments.length}</span> documentos
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
                                                                        className="px-3 py-1 rounded-lg border-sage-300 text-sage-700 hover:bg-sage-50"
                                                                    >
                                                                        1
                                                                    </Button>
                                                                    <span className="px-2 py-1 text-sm text-sage-400">...</span>
                                                                </>
                                                            )}

                                                            {pages.map((pageNumber) => (
                                                                <Button
                                                                    key={pageNumber}
                                                                    variant={pageNumber === currentPage ? "primary" : "outline"}
                                                                    size="sm"
                                                                    onClick={() => paginate(pageNumber)}
                                                                    className={`rounded-lg ${
                                                                        pageNumber === currentPage
                                                                            ? "bg-sage-600 border-sage-600 text-white"
                                                                            : "border-sage-300 text-sage-700 hover:bg-sage-50"
                                                                    }`}
                                                                >
                                                                    {pageNumber}
                                                                </Button>
                                                            ))}

                                                            {end < totalPages && (
                                                                <>
                                                                    <span className="px-2 py-1 text-sm text-sage-400">...</span>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => paginate(totalPages)}
                                                                        className="px-3 py-1 rounded-lg border-sage-300 text-sage-700 hover:bg-sage-50"
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
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="bg-sage-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <FiFileText size={32} className="text-sage-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-sage-700 mb-2">Nenhum documento encontrado</h3>
                        <p className="text-sage-600 mb-4">
                            {searchTerm ? "Tente ajustar os termos da busca." : "Comece criando seu primeiro documento."}
                        </p>
                        {!searchTerm && (
                            <Button
                                variant="primary"
                                icon={<FiPlus size={16} />}
                                onClick={() => setIsModalOpen(true)}
                                className="bg-sage-600 hover:bg-sage-700"
                            >
                                Criar Primeiro Documento
                            </Button>
                        )}
                    </div>
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Criar Novo Documento"
                size="medium"
                showCloseButton={true}
            >
                <div className="space-y-6 mt-4">
                    <div className="bg-sage-50 rounded-xl p-4">
                        <h3 className="flex items-center gap-2 text-sage-700 font-semibold mb-4">
                            <FiFileText size={18} />
                            Informações do Documento
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="document-patient" className="block text-sm font-medium text-sage-700 mb-2">
                                    Paciente *
                                </label>
                                <Select
                                    id="document-patient"
                                    value={newDocument.paciente_id}
                                    onChange={(e) => handleInputChange("paciente_id", e.target.value)}
                                    options={patientOptions}
                                    placeholder="Selecione um paciente"
                                    required
                                    className="border-sage-200 focus:border-sage-400"
                                />
                            </div>

                            <div>
                                <label htmlFor="document-type" className="block text-sm font-medium text-sage-700 mb-2">
                                    Tipo de Documento *
                                </label>
                                <Select
                                    id="document-type"
                                    value={newDocument.tipo_documento_id}
                                    onChange={(e) => handleInputChange("tipo_documento_id", e.target.value)}
                                    options={documentTypeOptions}
                                    placeholder="Selecione um tipo"
                                    required
                                    className="border-sage-200 focus:border-sage-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-sage-700 mb-2">
                                    Carregar Modelo (Opcional)
                                </label>
                                <Select
                                    value=""
                                    onChange={(e: any) => handleTemplateChange(e.target.value)}
                                    options={templates.map((t: Template) => ({
                                        value: String(t.id),
                                        label: t.tipo_documento_nome + " - " + new Date(t.criado_em).toLocaleDateString(),
                                    }))}
                                    placeholder="Selecione um modelo para carregar..."
                                    className="border-sage-200 focus:border-sage-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-sage-700 mb-2">
                                    Conteúdo *
                                </label>
                                <Editor
                                    value={newDocument.conteudo}
                                    onEditorChange={(v) => handleInputChange("conteudo", v)}
                                    apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
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
                                <label htmlFor="document-status" className="block text-sm font-medium text-sage-700 mb-2">
                                    Status *
                                </label>
                                <Select
                                    id="document-status"
                                    value={newDocument.status}
                                    onChange={(e) => handleInputChange("status", e.target.value)}
                                    options={statusOptions}
                                    placeholder="Selecione um status"
                                    required
                                    className="border-sage-200 focus:border-sage-400"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-sage-100">
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            className="border-sage-300 text-sage-700 hover:bg-sage-50"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreateDocument}
                            className="bg-sage-600 hover:bg-sage-700 border-sage-600"
                        >
                            Criar Documento
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingDocument(null);
                }}
                title="Editar Documento"
                size="medium"
                showCloseButton={true}
            >
                {editingDocument && (
                    <div className="space-y-6 mt-4">
                        <div className="bg-sage-50 rounded-xl p-4">
                            <h3 className="flex items-center gap-2 text-sage-700 font-semibold mb-4">
                                <FiFileText size={18} />
                                Informações do Documento
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-sage-700 mb-2">
                                        Paciente
                                    </label>
                                    <Input
                                        type="text"
                                        value={editingDocument.paciente_nome || ""}
                                        disabled
                                        className="border-sage-200 bg-gray-100 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-sage-600 mt-1">O paciente não pode ser alterado</p>
                                </div>

                                <div>
                                    <label htmlFor="edit-document-type" className="block text-sm font-medium text-sage-700 mb-2">
                                        Tipo de Documento *
                                    </label>
                                    <Select
                                        id="edit-document-type"
                                        value={editingDocument.tipo_documento_id.toString()}
                                        onChange={(e) => setEditingDocument({
                                            ...editingDocument,
                                            tipo_documento_id: parseInt(e.target.value)
                                        })}
                                        options={documentTypeOptions}
                                        required
                                        className="border-sage-200 focus:border-sage-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-sage-700 mb-2">
                                        Conteúdo *
                                    </label>
                                    <Editor
                                        value={editingDocument.conteudo}
                                        onEditorChange={(v) => setEditingDocument({ ...editingDocument, conteudo: v })}
                                        apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
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
                                    <label htmlFor="edit-document-status" className="block text-sm font-medium text-sage-700 mb-2">
                                        Status *
                                    </label>
                                    <Select
                                        id="edit-document-status"
                                        value={editingDocument.status}
                                        onChange={(e) => setEditingDocument({
                                            ...editingDocument,
                                            status: e.target.value as Document["status"]
                                        })}
                                        options={statusOptions}
                                        required
                                        className="border-sage-200 focus:border-sage-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-sage-100">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditingDocument(null);
                                }}
                                className="border-sage-300 text-sage-700 hover:bg-sage-50"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleUpdateDocument}
                                className="bg-sage-600 hover:bg-sage-700 border-sage-600"
                            >
                                Salvar Alterações
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </MainLayout>
    );
};

export default Documents;
