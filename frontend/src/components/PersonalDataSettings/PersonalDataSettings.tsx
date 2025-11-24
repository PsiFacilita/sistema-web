import React from 'react';
import Title from '../Title/Title';
import Input from '../Form/Input/Input';
import Label from '../Form/Label/Label';
import Button from '../Button/Button';
import { FiUser, FiMail, FiPhone, FiFileText } from 'react-icons/fi';
import Swal from 'sweetalert2';

type PersonalData = {
    name: string;
    email: string;
    phone?: string;
    crp?: string;
};

interface PersonalDataFormProps {
    initialData?: PersonalData;
    onSave?: (data: PersonalData) => Promise<void> | void;
}

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const onlyDigits = (v: string) => v.replace(/\D+/g, '');
const maskPhone = (v: string) => {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 10) return d.replace(/^(\d{0,2})(\d{0,4})(\d{0,4}).*$/, (_, a, b, c) => [a && `(${a}`, a && `) `, b, b && '-', c].filter(Boolean).join(''));
    return d.replace(/^(\d{2})(\d{5})(\d{0,4}).*$/, '($1) $2-$3');
};
const maskCRP = (v: string) => {
    const d = onlyDigits(v).slice(0, 7);
    if (d.length <= 2) return d;
    return d.replace(/^(\d{2})(\d{0,5}).*$/, '$1/$2');
};
const crpOk = (v: string) => v.trim() === '' || /^\d{2}\/\d{5}$/.test(v.trim());

const PersonalDataSettings: React.FC<PersonalDataFormProps> = ({
                                                                   initialData = { name: '', email: '', phone: '', crp: '' },
                                                                   onSave
                                                               }) => {
    const [formData, setFormData] = React.useState<PersonalData>(initialData);
    const [errors, setErrors] = React.useState<Record<keyof PersonalData, string>>({ name: '', email: '', phone: '', crp: '' });
    const [saving, setSaving] = React.useState(false);
    const isDirty = React.useMemo(() => {
        const a = initialData || { name: '', email: '', phone: '', crp: '' };
        return (a.name || '') !== (formData.name || '')
            || (a.email || '') !== (formData.email || '')
            || (a.phone || '') !== (formData.phone || '')
            || (a.crp || '') !== (formData.crp || '');
    }, [initialData, formData]);

    React.useEffect(() => {
        setFormData(initialData);
        setErrors({ name: '', email: '', phone: '', crp: '' });
    }, [initialData]);

    const validate = (data: PersonalData) => {
        const e: Record<keyof PersonalData, string> = { name: '', email: '', phone: '', crp: '' };
        if (!data.name || data.name.trim().length < 3) e.name = 'Informe ao menos 3 caracteres.';
        if (!data.email || !emailOk(data.email)) e.email = 'Informe um e-mail válido.';
        const pd = onlyDigits(data.phone || '');
        if (pd && pd.length < 10) e.phone = 'Informe DDD + número.';
        if (!crpOk(data.crp || '')) e.crp = 'Formato esperado: 00/00000.';
        setErrors(e);
        return Object.values(e).every(v => !v);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let next = value;
        if (name === 'phone') next = maskPhone(value);
        if (name === 'crp') next = maskCRP(value);
        const data = { ...formData, [name]: next };
        setFormData(data);
        validate(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate(formData)) {
            Swal.fire('Atenção', 'Corrija os campos destacados antes de salvar.', 'warning');
            return;
        }
        if (!isDirty) return;
        try {
            setSaving(true);
            await onSave?.({
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone?.trim() || '',
                crp: formData.crp?.trim() || ''
            });
            Swal.fire('Sucesso!', 'Dados atualizados com sucesso.', 'success');
        } catch (err: any) {
            const msg = err?.response?.data?.erro || 'Não foi possível salvar os dados.';
            Swal.fire('Erro', msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setFormData(initialData);
        setErrors({ name: '', email: '', phone: '', crp: '' });
    };

    const hasErrors = Object.values(errors).some(Boolean);

    return (
        <div className="p-1">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-sage-100 rounded-lg p-3">
                    <FiUser size={24} className="text-sage-600" />
                </div>
                <Title level={3} className="text-sage-800 mb-0">Dados Pessoais</Title>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="name">Nome Completo</Label>
                        <div className="relative">
                            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400" size={18} />
                            <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Digite seu nome completo" className={`pl-10 border-sage-200 focus:border-sage-400 ${errors.name ? 'border-red-300 focus:border-red-400' : ''}`} />
                        </div>
                        {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
                    </div>

                    <div>
                        <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="email">Email</Label>
                        <div className="relative">
                            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400" size={18} />
                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="exemplo@email.com" className={`pl-10 border-sage-200 focus:border-sage-400 ${errors.email ? 'border-red-300 focus:border-red-400' : ''}`} />
                        </div>
                        {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
                    </div>

                    <div>
                        <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="phone">Telefone</Label>
                        <div className="relative">
                            <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400" size={18} />
                            <Input id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="(00) 00000-0000" className={`pl-10 border-sage-200 focus:border-sage-400 ${errors.phone ? 'border-red-300 focus:border-red-400' : ''}`} />
                        </div>
                        {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone}</p> : null}
                    </div>

                    <div>
                        <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="crp">CRP</Label>
                        <div className="relative">
                            <FiFileText className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400" size={18} />
                            <Input id="crp" name="crp" value={formData.crp || ''} onChange={handleChange} placeholder="00/00000" className={`pl-10 border-sage-200 focus:border-sage-400 ${errors.crp ? 'border-red-300 focus:border-red-400' : ''}`} />
                        </div>
                        {errors.crp ? <p className="mt-1 text-xs text-red-600">{errors.crp}</p> : null}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-sage-100">
                    <Button type="button" variant="outline" onClick={handleReset} disabled={!isDirty || saving} className="border-sage-300 text-sage-700 hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" disabled={!isDirty || hasErrors || saving} className="bg-sage-600 hover:bg-sage-700 border-sage-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default PersonalDataSettings;
