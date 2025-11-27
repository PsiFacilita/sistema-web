import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Title from "../components/Title/Title";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import Icon from "../components/Icon/Icon";
import { Select } from "../components/Form/Select/Select";
import Swal from "sweetalert2";
import DocumentHtmlViewer from "../components/document-html-viewer";
import { Editor } from "@tinymce/tinymce-react";

const API_URL = (import.meta as any).env?.BACKEND_URL || "http://localhost:5000";

type UiStatus = "draft" | "final" | "archived" | "pending_review";

type DocumentApi = {
    id: number;
    usuario_id?: number;
    paciente_id?: number | null;
    tipo_documento_id?: number | null;
    conteudo: string;
    status: string;
    created_at?: string;
    updated_at?: string;
    criado_em?: string;
    atualizado_em?: string;
    paciente_nome?: string;
    tipo_documento_nome?: string;
    titulo?: string;
};

type DocumentContent = {
    id: string;
    title: string;
    category: string;
    patient: string;
    createdAt: string;
    status: UiStatus;
    content: string;
    lastModified: string;
};

const mapApiStatusToUi = (s: string): UiStatus => {
    const x = (s || "").toLowerCase();
    if (x === "final") return "final";
    if (x === "arquivado" || x === "archived") return "archived";
    if (x === "revisao_pendente" || x === "pending_review") return "pending_review";
    return "draft";
};

const mapUiStatusToApi = (s: UiStatus): string => {
    if (s === "final") return "final";
    if (s === "archived") return "arquivado";
    if (s === "pending_review") return "revisao_pendente";
    return "rascunho";
};

const formatDateBR = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pt-BR");
};

const formatStatus = (status: UiStatus) => {
    const statusMap: Record<UiStatus, string> = {
        draft: "Rascunho",
        final: "Final",
        archived: "Arquivado",
        pending_review: "Revisão Pendente",
    };
    return statusMap[status] || status;
};

const StatusBadge: React.FC<{ status: UiStatus }> = ({ status }) => {
    const statusClasses: Record<UiStatus, string> = {
        draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
        final: "bg-green-100 text-green-800 border-green-200",
        archived: "bg-gray-100 text-gray-800 border-gray-200",
        pending_review: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusClasses[status]}`}>{formatStatus(status)}</span>;
};

const DocumentViewer: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [document, setDocument] = useState<DocumentContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const statusOptions = [
        { value: "draft", label: "Rascunho" },
        { value: "final", label: "Final" },
        { value: "archived", label: "Arquivado" },
        { value: "pending_review", label: "Revisão Pendente" },
    ];

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("auth.token");
                const res = await axios.get(`${API_URL}/api/documents/${id}`, {
                    withCredentials: true,
                    headers: {
                        Accept: "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });
                const doc: DocumentApi = res?.data?.document;
                if (!doc) throw new Error("Documento não encontrado");
                const created = doc.created_at || doc.criado_em || "";
                const updated = doc.updated_at || doc.atualizado_em || "";
                const mapped: DocumentContent = {
                    id: String(doc.id),
                    title: (doc.titulo || doc.tipo_documento_nome || `Documento ${doc.id}`).trim(),
                    category: (doc.tipo_documento_nome || "Documento").trim(),
                    patient: (doc.paciente_nome || (doc.paciente_id ? `Paciente #${doc.paciente_id}` : "-")).trim(),
                    createdAt: formatDateBR(created),
                    status: mapApiStatusToUi(doc.status),
                    content: doc.conteudo || "",
                    lastModified: formatDateBR(updated),
                };
                setDocument(mapped);
            } catch (err: any) {
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    window.location.href = "/";
                    return;
                }
                Swal.fire("Erro", "Não foi possível carregar o documento", "error");
            } finally {
                setLoading(false);
            }
        };
        if (id) load();
    }, [id]);

    const handleEdit = () => setIsEditing(true);

    const handleSave = async () => {
        if (!document) return;
        try {
            const token = localStorage.getItem("auth.token");
            const res = await axios.put(
                `${API_URL}/api/documents/${document.id}`,
                { conteudo: document.content, status: mapUiStatusToApi(document.status) },
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );
            const upd: DocumentApi = res?.data?.document || {};
            setDocument((d) =>
                !d
                    ? d
                    : {
                        ...d,
                        content: upd.conteudo ?? d.content,
                        status: upd.status ? mapApiStatusToUi(upd.status) : d.status,
                        lastModified: formatDateBR(upd.updated_at || upd.atualizado_em) || d.lastModified,
                    }
            );
            Swal.fire("Sucesso!", "Documento salvo com sucesso!", "success");
            setIsEditing(false);
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                window.location.href = "/";
                return;
            }
            const msg = err.response?.data?.erro || "Não foi possível salvar o documento";
            Swal.fire("Erro", msg, "error");
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Carregando documento...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!document) {
        return (
            <MainLayout>
                <div className="text-center py-12">
                    <Icon type="folder" size={64} className="mx-auto text-gray-400 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Documento não encontrado</h2>
                    <p className="text-gray-600 mb-6">O documento solicitado não pôde ser carregado.</p>
                    <Button onClick={() => navigate("/documents")} variant="primary">Voltar aos Documentos</Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex items-center justify-between mb-6">
                <Button variant="outline" onClick={() => navigate("/documents")} icon={<Icon type="arrow-left" size={16} />}>Voltar</Button>
                <div className="flex items-center gap-2">
                    <Button variant="primary" onClick={isEditing ? handleSave : handleEdit} icon={<Icon type={isEditing ? "save" : "edit"} size={16} />}>
                        {isEditing ? "Salvar" : "Editar"}
                    </Button>
                    {isEditing && <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>}
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <Title level={1} className="mb-2">{document.title}</Title>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span>Paciente: <strong>{document.patient}</strong></span>
                        <span>•</span>
                        <span>Categoria: <strong>{document.category}</strong></span>
                        {document.createdAt && (<><span>•</span><span>Criado em: <strong>{document.createdAt}</strong></span></>)}
                        {document.lastModified && (<><span>•</span><span>Modificado em: <strong>{document.lastModified}</strong></span></>)}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <div className="min-w-[200px]">
                            <Select
                                value={document.status}
                                onChange={(e) => setDocument({ ...document, status: e.target.value as UiStatus })}
                                options={[
                                    { value: "draft", label: "Rascunho" },
                                    { value: "final", label: "Final" },
                                    { value: "archived", label: "Arquivado" },
                                    { value: "pending_review", label: "Revisão Pendente" },
                                ]}
                            />
                        </div>
                    ) : (
                        <StatusBadge status={document.status} />
                    )}
                </div>
            </div>

            <Card>
                <div className="max-w-none">
                    {isEditing ? (
                        <Editor
                            value={document.content}
                            onEditorChange={(v) => setDocument({ ...document, content: v })}
                            apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                            init={{
                                height: 420,
                                menubar: false,
                                plugins: "lists link table code codesample advlist autoresize",
                                toolbar:
                                    "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist outdent indent | link table | removeformat | code",
                                branding: false,
                                statusbar: false,
                                content_style:
                                    "body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px}",
                            }}
                        />
                    ) : (
                        <DocumentHtmlViewer html={document.content} />
                    )}
                </div>
            </Card>
        </MainLayout>
    );
};

export default DocumentViewer;
