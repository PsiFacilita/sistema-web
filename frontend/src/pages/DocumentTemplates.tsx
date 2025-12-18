import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Title from "../components/Title/Title";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import Table from "../components/Table/Table";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal/Modal";
import Input from "../components/Form/Input/Input";
import { Editor } from "@tinymce/tinymce-react";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";

const API_URL = (import.meta as any).env?.BACKEND_URL || "http://localhost:5000";

interface DocumentTemplate {
    id: number;
    name: string;
    conteudo: string;
    criado_em: string;
    atualizado_em: string;
}

const DocumentTemplates: React.FC = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        conteudo: "",
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("auth.token");
            const res = await fetch(`${API_URL}/api/document-templates`, {
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            
            if (res.status === 401) {
                // Sessão expirada, redirecionar para login
                localStorage.removeItem("auth.token");
                navigate("/login");
                return;
            }
            
            const data = await res.json();
            if (data.templates) setTemplates(data.templates);
        } catch (err) {
            console.error("Erro ao buscar modelos:", err);
            Swal.fire("Erro", "Não foi possível carregar os modelos.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.conteudo) {
            Swal.fire("Atenção", "Preencha todos os campos.", "warning");
            return;
        }

        try {
            const token = localStorage.getItem("auth.token");
            const url = editingTemplate
                ? `${API_URL}/api/document-templates/${editingTemplate.id}`
                : `${API_URL}/api/document-templates`;
            const method = editingTemplate ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    name: formData.name,
                    conteudo: formData.conteudo,
                }),
            });

            if (res.status === 401) {
                localStorage.removeItem("auth.token");
                navigate("/login");
                return;
            }

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Erro ao salvar modelo");
            }

            Swal.fire("Sucesso", "Modelo salvo com sucesso!", "success");
            setIsModalOpen(false);
            setEditingTemplate(null);
            setFormData({ name: "", conteudo: "" });
            fetchTemplates();
        } catch (err: any) {
            console.error(err);
            Swal.fire("Erro", err.message || "Não foi possível salvar o modelo.", "error");
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: "Tem certeza?",
            text: "Essa ação não pode ser desfeita.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sim, excluir",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("auth.token");
                const res = await fetch(`${API_URL}/api/document-templates/${id}`, {
                    method: "DELETE",
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (!res.ok) throw new Error("Erro ao excluir modelo");

                Swal.fire("Excluído!", "O modelo foi excluído.", "success");
                fetchTemplates();
            } catch (err) {
                console.error(err);
                Swal.fire("Erro", "Não foi possível excluir o modelo.", "error");
            }
        }
    };

    const openModal = (template?: DocumentTemplate) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                name: template.name,
                conteudo: template.conteudo,
            });
        } else {
            setEditingTemplate(null);
            setFormData({ name: "", conteudo: "" });
        }
        setIsModalOpen(true);
    };

    const columns = [
        {
            header: "Nome do Modelo",
            accessor: "name" as keyof DocumentTemplate,
        },
        {
            header: "Criado em",
            accessor: "criado_em" as keyof DocumentTemplate,
            Cell: ({ value }: { value: string }) => (
                <span>{new Date(value).toLocaleDateString()}</span>
            ),
        },
        {
            header: "Ações",
            accessor: "id" as keyof DocumentTemplate,
            Cell: ({ value }: { value: number }) => {
                const template = templates.find((t: DocumentTemplate) => t.id === value);
                return (
                    <div className="flex gap-2">
                        <button
                            onClick={() => openModal(template)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Editar"
                        >
                            <FiEdit size={18} />
                        </button>
                        <button
                            onClick={() => handleDelete(value)}
                            className="text-red-600 hover:text-red-800"
                            title="Excluir"
                        >
                            <FiTrash2 size={18} />
                        </button>
                    </div>
                );
            },
        },
    ];

    return (
        <MainLayout>
            <div className="flex justify-between items-center mb-6">
                <Title>Modelos de Documentos</Title>
                <div className="flex gap-2">
                    <Button onClick={() => openModal()}>
                        <FiPlus className="mr-2" /> Novo Modelo
                    </Button>
                    <Button variant="secondary" onClick={() => navigate("/documents")}>
                        Voltar
                    </Button>
                </div>
            </div>

            <Card>
                <Table
                    data={templates}
                    columns={columns}
                />
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTemplate ? "Editar Modelo" : "Novo Modelo"}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome do Modelo
                        </label>
                        <Input
                            value={formData.name}
                            onChange={(e: any) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="Ex: Atestado Médico Padrão"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Conteúdo
                        </label>
                        <div className="border rounded-md overflow-hidden">
                            <Editor
                                value={formData.conteudo}
                                onEditorChange={(content) =>
                                    setFormData({ ...formData, conteudo: content })
                                }
                                apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                init={{
                                    height: 400,
                                    menubar: false,
                                    plugins: "lists link table code codesample advlist autoresize",
                                    toolbar: "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist outdent indent | link table | removeformat | code",
                                    branding: false,
                                    statusbar: false,
                                    content_style: "body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px}"
                                }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Dica: Use <strong>#nome</strong> para inserir o nome do paciente automaticamente.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave}>Salvar</Button>
                    </div>
                </div>
            </Modal>
        </MainLayout>
    );
};

export default DocumentTemplates;
