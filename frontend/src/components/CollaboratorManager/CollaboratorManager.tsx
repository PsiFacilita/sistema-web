import React, { useEffect } from 'react';
import Title from '../Title/Title';
import Table from '../Table/Table';
import Button from '../Button/Button';
import Input from '../Form/Input/Input';
import Label from '../Form/Label/Label';
import Modal from '../Modal/Modal';
import Icon from "../Icon/Icon";
import { FiUsers, FiUserPlus, FiMail, FiBriefcase, FiEdit2 } from "react-icons/fi";
import Swal from "sweetalert2";
import axios from 'axios';

interface Collaborator {
    id?: number | string;
    name: string;
    email: string;
    role: string;
    phone?: string;
}

interface CollaboratorManagerProps {
    initialCollaborators?: Collaborator[];
    onSave?: (data: Collaborator[]) => void;
}

const API_URL = (import.meta as any).env?.BACKEND_URL || 'http://localhost:5000';

const confirmDelete = (id: string | number) =>
    Swal.fire({
        title: 'Tem certeza?',
        text: 'Essa ação não poderá ser desfeita!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#aaa',
        confirmButtonText: 'Sim, deletar',
        cancelButtonText: 'Cancelar',
        background: '#fff',
        color: '#374151'
    });

const CollaboratorManager: React.FC<CollaboratorManagerProps> = ({ initialCollaborators = [], onSave }) => {
    const [collaborators, setCollaborators] = React.useState<Collaborator[]>([]);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<Collaborator | null>(null);
    const [formData, setFormData] = React.useState({ name: '', email: '', role: 'Secretaria' });

    useEffect(() => {
        const mapped = (initialCollaborators || []).map(c => ({ ...c, role: c.role || 'Secretaria' }));
        setCollaborators(mapped);
    }, [initialCollaborators]);

    const authHeaders = () => {
        const token = localStorage.getItem('auth.token');
        const headers: any = { Accept: 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    const refresh = async () => {
        const headers = authHeaders();
        const res = await axios.get(`${API_URL}/api/settings/collaborators`, { withCredentials: true, headers });
        const list = Array.isArray(res.data?.collaborators) ? res.data.collaborators : [];
        const mapped = list.map((x: any) => ({
            id: x.id,
            name: x.name,
            email: x.email,
            phone: x.phone ?? '',
            role: x.cargo ?? x.role ?? 'secretaria'
        }));
        setCollaborators(mapped);
        onSave?.(mapped);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreate = () => {
        setEditing(null);
        setFormData({ name: '', email: '', role: 'secretaria' });
        setIsModalOpen(true);
    };

    const handleEditById = (id: string | number) => {
        const c = collaborators.find(x => String(x.id) === String(id));
        if (!c) return;
        setEditing(c);
        setFormData({ name: c.name, email: c.email, role: c.role || 'secretaria' });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        const headers = { ...authHeaders(), 'Content-Type': 'application/json' };
        try {
            if (editing && editing.id) {
                await axios.put(`${API_URL}/api/settings/collaborators/${editing.id}`, formData, { withCredentials: true, headers });
                Swal.fire('Sucesso!', 'Colaborador atualizado com sucesso.', 'success');
            } else {
                const password = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
                await axios.post(`${API_URL}/api/settings/collaborators`, { ...formData, password }, { withCredentials: true, headers });
                Swal.fire('Sucesso!', 'Colaborador adicionado com sucesso.', 'success');
            }
            setIsModalOpen(false);
            setEditing(null);
            await refresh();
        } catch (e: any) {
            Swal.fire('Erro', e?.response?.data?.erro || 'Falha ao salvar colaborador', 'error');
        }
    };

    const handleRemoveCollaborator = async (id: string | number) => {
        const ok = await confirmDelete(id);
        if (!ok.isConfirmed) return;
        const headers = { ...authHeaders(), 'Content-Type': 'application/json' };
        try {
            await axios.delete(`${API_URL}/api/settings/collaborators/${id}`, { withCredentials: true, headers });
            const updated = collaborators.filter(c => String(c.id) !== String(id));
            setCollaborators(updated);
            onSave?.(updated);
            Swal.fire({ title: 'Deletado!', text: 'O colaborador foi removido.', icon: 'success', background: '#fff', color: '#374151' });
        } catch (e: any) {
            Swal.fire('Erro', e?.response?.data?.erro || 'Falha ao deletar colaborador', 'error');
        }
    };

    const ActionCell: React.FC<{ value: string | number }> = ({ value }) => (
        <div className="flex space-x-2">
            <button
                onClick={() => handleEditById(value)}
                className="flex items-center gap-2 rounded-lg bg-sage-50 px-3 py-2 text-sm text-sage-600 hover:bg-sage-100 hover:text-sage-700 transition-all duration-300 border border-sage-200"
            >
                <FiEdit2 size={16} />
                <span className="hidden sm:inline">Editar</span>
            </button>
            <button
                onClick={() => handleRemoveCollaborator(value)}
                className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-300 border border-red-200"
            >
                <Icon type="trash" size={16} />
                <span className="hidden sm:inline">Deletar</span>
            </button>
        </div>
    );

    const columns = [
        { header: 'Nome', accessor: 'name' as keyof Collaborator },
        { header: 'Email', accessor: 'email' as keyof Collaborator },
        { header: 'Cargo', accessor: 'role' as keyof Collaborator },
        { header: 'Ações', accessor: 'id' as keyof Collaborator, Cell: ActionCell }
    ];

    return (
        <div className="p-1 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-sage-100 rounded-lg p-3">
                    <FiUsers size={24} className="text-sage-600" />
                </div>
                <div className="flex-1">
                    <Title level={3} className="text-sage-800 mb-0">Gerenciar Colaboradores</Title>
                    <p className="text-sage-600 text-sm mt-1">{collaborators.length} colaborador{collaborators.length !== 1 ? 'es' : ''} cadastrado{collaborators.length !== 1 ? 's' : ''}</p>
                </div>
                <Button variant="primary" onClick={openCreate} icon={<FiUserPlus size={18} />} className="bg-sage-600 hover:bg-sage-700 border-sage-600">
                    Adicionar
                </Button>
            </div>

            {collaborators.length > 0 ? (
                <div className="flex-grow">
                    <Table columns={columns} data={collaborators} />
                </div>
            ) : (
                <div className="text-center py-12 text-sage-600 flex-grow flex flex-col items-center justify-center">
                    <div className="bg-sage-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <FiUsers size={32} className="text-sage-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-sage-700 mb-2">Nenhum colaborador cadastrado</h4>
                    <p className="text-sage-600 mb-4">Comece adicionando seu primeiro colaborador</p>
                    <Button variant="primary" onClick={openCreate} icon={<FiUserPlus size={16} />} className="bg-sage-600 hover:bg-sage-700">
                        Adicionar Primeiro Colaborador
                    </Button>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditing(null); setFormData({ name: '', email: '', role: 'secretaria' }); }}
                title={editing ? 'Editar Colaborador' : 'Adicionar Novo Colaborador'}
                size="medium"
            >
                <div className="space-y-6 mt-4">
                    <div className="bg-sage-50 rounded-xl p-4">
                        <div className="space-y-4">
                            <div>
                                <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="name">Nome Completo</Label>
                                <div className="relative">
                                    <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400" size={18} />
                                    <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Digite o nome completo" className="pl-10 border-sage-200 focus:border-sage-400" />
                                </div>
                            </div>
                            <div>
                                <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="email">Email</Label>
                                <div className="relative">
                                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400" size={18} />
                                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="exemplo@email.com" className="pl-10 border-sage-200 focus:border-sage-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t border-sage-100">
                        <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditing(null); setFormData({ name: '', email: '', role: 'secretaria' }); }} className="border-sage-300 text-sage-700 hover:bg-sage-50">
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleSubmit} disabled={!formData.name || !formData.email} className="bg-sage-600 hover:bg-sage-700 border-sage-600 disabled:opacity-50 disabled:cursor-not-allowed">
                            {editing ? 'Salvar Alterações' : 'Salvar Colaborador'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CollaboratorManager;
