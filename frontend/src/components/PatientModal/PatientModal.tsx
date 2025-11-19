import React, { useState, useEffect } from "react";
import Button from "../Button/Button";
import Input from "../Form/Input/Input";
import Modal from "../Modal/Modal";
import { FiUser, FiCalendar, FiFileText, FiPhone, FiMail, FiEdit3 } from "react-icons/fi";
import { CPFHelper } from "../../lib/CPFHelper";

interface CustomField {
    id: number;
    name: string;
    type: string;
    required: boolean;
    value: string;
}

interface PatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (patient: {
        name: string;
        birthDate: string;
        cpf: string;
        rg?: string;
        phone: string;
        email?: string;
        notes?: string;
        status: "active" | "inactive";
        customFields?: { id: number; value: string }[];
    }) => void;
    initialData?: {
        id?: string;
        name?: string;
        birthDate?: string;
        cpf?: string;
        rg?: string;
        phone?: string;
        email?: string;
        notes?: string;
        status?: "active" | "inactive";
        customFields?: CustomField[];
    };
    title?: string;
    submitLabel?: string;
}

const PatientModal: React.FC<PatientModalProps> = ({
                                                       isOpen,
                                                       onClose,
                                                       onSubmit,
                                                       initialData,
                                                       title = "Adicionar Novo Paciente",
                                                       submitLabel = "Salvar Paciente",
                                                   }) => {
    const [name, setName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [cpf, setCpf] = useState("");
    const [rg, setRg] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState<"active" | "inactive">("active");
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const loadFields = async () => {
            try {
                if (initialData?.customFields && initialData.customFields.length > 0) {
                    const mapped = initialData.customFields.map((f) => ({
                        id: Number(f.id),
                        name: f.name,
                        type: f.type,
                        required:
                            f.required === true ||
                            f.required === false
                                ? f.required
                                : false,
                        value: f.value ?? "",
                    }));
                    setCustomFields(mapped);
                    return;
                }

                const res = await fetch("http://localhost:5000/api/custom-fields", {
                    credentials: "include",
                });
                if (!res.ok) {
                    throw new Error(`Erro ao carregar campos personalizados: ${res.status}`);
                }
                const data = await res.json();
                const fields = (data.fields || data || []).map((f: any) => {
                    const rawRequired =
                        typeof f.is_required !== "undefined" ? f.is_required : f.obrigatorio;
                    const required =
                        rawRequired === true ||
                        rawRequired === 1 ||
                        rawRequired === "1";

                    return {
                        id: Number(f.id),
                        name: f.name || f.nome || f.nome_campo,
                        type: f.type || f.tipo || f.tipo_campo,
                        required,
                        value: "",
                    } as CustomField;
                });
                setCustomFields(fields);
            } catch (error) {
                console.error("PatientModal - Erro ao carregar campos:", error);
                setCustomFields([]);
            }
        };

        if (isOpen) {
            if (initialData) {
                const nameValue = initialData.name || "";
                const phoneValue = initialData.phone || "";
                setName(nameValue);
                setBirthDate(initialData.birthDate || "");
                setCpf(initialData.cpf || "");
                setRg(initialData.rg || "");
                setPhone(phoneValue);
                setEmail(initialData.email || "");
                setNotes(initialData.notes || "");
                setStatus(initialData.status || "active");
            } else {
                setName("");
                setBirthDate("");
                setCpf("");
                setRg("");
                setPhone("");
                setEmail("");
                setNotes("");
                setStatus("active");
            }
            loadFields();
        }
    }, [initialData, isOpen]);

    const validateName = (value: string): string | null => {
        if (value.length < 3) {
            return "O nome deve ter no mínimo 3 caracteres";
        }
        if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value)) {
            return "O nome deve conter apenas letras e espaços";
        }
        return null;
    };

    const validateEmail = (value: string): string | null => {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return "Email inválido";
        }
        return null;
    };

    const validatePhone = (value: string): string | null => {
        const phoneRegex = /^(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/;
        if (!phoneRegex.test(value.trim())) {
            return "Telefone inválido";
        }
        return null;
    };

    const validateCPF = (value: string): string | null => {
        if (!CPFHelper.validaCPF(value)) {
            return "CPF inválido";
        }
        return null;
    };

    const validateBirthDate = (value: string): string | null => {
        if (!value) return null;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) {
            return "Formato de data inválido. Use o formato YYYY-MM-DD";
        }
        const [yearStr, monthStr, dayStr] = value.split("-");
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const day = parseInt(dayStr, 10);
        if (month < 1 || month > 12) {
            return "Mês deve estar entre 01 e 12";
        }
        if (day < 1 || day > 31) {
            return "Dia deve estar entre 01 e 31";
        }
        if (year < 1900) {
            return "Ano deve ser maior ou igual a 1900";
        }
        const date = new Date(year, month - 1, day);
        const today = new Date();
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
            return "Data inválida para o mês selecionado";
        }
        if (date > today) {
            return "Data de nascimento não pode ser no futuro";
        }
        return null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const nextErrors: { [key: string]: string } = {};

        const nameError = validateName(name.trim());
        if (nameError) nextErrors.name = nameError;

        const birthDateError = validateBirthDate(birthDate);
        if (birthDateError) nextErrors.birthDate = birthDateError;

        const emailError = validateEmail(email);
        if (emailError) nextErrors.email = emailError;

        const phoneError = validatePhone(phone);
        if (phoneError) nextErrors.phone = phoneError;

        const cpfError = validateCPF(cpf);
        if (cpfError) nextErrors.cpf = cpfError;

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        onSubmit({
            name: name.trim(),
            birthDate,
            cpf,
            rg: rg || undefined,
            phone,
            email: email || undefined,
            notes,
            status: initialData ? status : "active",
            customFields: customFields.map(({ id, value }) => ({ id, value })),
        });

        if (!initialData) {
            setName("");
            setBirthDate("");
            setCpf("");
            setRg("");
            setPhone("");
            setEmail("");
            setStatus("active");
            setNotes("");
            setCustomFields((prev) => prev.map((field) => ({ ...field, value: "" })));
        }
    };

    const renderCustomFieldInput = (field: CustomField) => {
        if (field.type === "textarea") {
            return (
                <textarea
                    value={field.value}
                    required={field.required}
                    onChange={(e) =>
                        setCustomFields((prev) =>
                            prev.map((f) => (f.id === field.id ? { ...f, value: e.target.value } : f))
                        )
                    }
                    className="w-full px-3 py-2 border border-sage-200 rounded-lg focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-400 resize-none text-sm sm:text-base"
                    rows={3}
                />
            );
        }

        let inputType = "text";
        if (field.type === "number") inputType = "number";
        if (field.type === "date") inputType = "date";
        if (field.type === "email") inputType = "email";

        return (
            <Input
                type={inputType}
                value={field.value}
                required={field.required}
                onChange={(e) =>
                    setCustomFields((prev) =>
                        prev.map((f) => (f.id === field.id ? { ...f, value: e.target.value } : f))
                    )
                }
                className="border-sage-200 focus:border-sage-400 text-sm sm:text-base"
            />
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-sage-50 rounded-xl p-3 sm:p-4">
                    <h3 className="flex items-center gap-2 text-sage-700 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                        <FiUser size={16} className="sm:w-[18px] sm:h-[18px]" />
                        Informações Pessoais
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                        <label htmlFor="name" className="block">
              <span className="block text-sm font-medium text-sage-700 mb-2">
                Nome completo <span className="text-red-500">*</span>
              </span>
                            <Input
                                id="name"
                                value={name}
                                placeholder="Digite o nome completo do paciente"
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setErrors((prev) => ({ ...prev, name: "" }));
                                }}
                                required
                                className="border-sage-200 focus:border-sage-400 text-sm sm:text-base"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </label>

                        <label htmlFor="birthDate" className="block">
                            <span className="block text-sm font-medium text-sage-700 mb-2">Data de Nascimento</span>
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={16} />
                                <Input
                                    id="birthDate"
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => {
                                        setBirthDate(e.target.value);
                                        setErrors((prev) => ({ ...prev, birthDate: "" }));
                                    }}
                                    className="pl-10 border-sage-200 focus:border-sage-400 text-sm sm:text-base"
                                />
                            </div>
                            {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
                        </label>
                    </div>
                </div>

                <div className="bg-sage-50 rounded-xl p-3 sm:p-4">
                    <h3 className="flex items-center gap-2 text-sage-700 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                        <FiFileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                        Documentos
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                        <label htmlFor="cpf" className="block">
              <span className="block text-sm font-medium text-sage-700 mb-2">
                CPF <span className="text-red-500">*</span>
              </span>
                            <Input
                                id="cpf"
                                value={cpf}
                                placeholder="000.000.000-00"
                                onChange={(e) => {
                                    setCpf(e.target.value);
                                    setErrors((prev) => ({ ...prev, cpf: "" }));
                                }}
                                required
                                className="border-sage-200 focus:border-sage-400 text-sm sm:text-base"
                            />
                            {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
                        </label>

                        <label htmlFor="rg" className="block">
                            <span className="block text-sm font-medium text-sage-700 mb-2">RG</span>
                            <Input
                                id="rg"
                                value={rg}
                                placeholder="00.000.000-0"
                                onChange={(e) => setRg(e.target.value)}
                                className="border-sage-200 focus:border-sage-400 text-sm sm:text-base"
                            />
                        </label>
                    </div>
                </div>

                <div className="bg-sage-50 rounded-xl p-3 sm:p-4">
                    <h3 className="flex items-center gap-2 text-sage-700 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                        <FiPhone size={16} className="sm:w-[18px] sm:h-[18px]" />
                        Contato
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                        <label htmlFor="phone" className="block">
              <span className="block text-sm font-medium text-sage-700 mb-2">
                Telefone <span className="text-red-500">*</span>
              </span>
                            <div className="relative">
                                <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={16} />
                                <Input
                                    id="phone"
                                    value={phone}
                                    placeholder="(00) 00000-0000"
                                    onChange={(e) => {
                                        setPhone(e.target.value);
                                        setErrors((prev) => ({ ...prev, phone: "" }));
                                    }}
                                    required
                                    mask="(99) 99999-9999"
                                    className="pl-10 border-sage-200 focus:border-sage-400 text-sm sm:text-base"
                                />
                            </div>
                            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                        </label>

                        <label htmlFor="email" className="block">
                            <span className="block text-sm font-medium text-sage-700 mb-2">Email</span>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={16} />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setErrors((prev) => ({ ...prev, email: "" }));
                                    }}
                                    className="pl-10 border-sage-200 focus:border-sage-400 text-sm sm:text-base"
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                        </label>
                    </div>
                </div>

                {customFields.length > 0 && (
                    <div className="bg-sage-50 rounded-xl p-4">
                        <h3 className="flex items-center gap-2 text-sage-700 font-semibold mb-4">
                            <FiEdit3 size={18} />
                            Campos Personalizados
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {customFields.map((field) => (
                                <label key={field.id} className="block">
                  <span className="block text-sm font-medium text-sage-700 mb-2">
                    {field.name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                                    {renderCustomFieldInput(field)}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-sage-50 rounded-xl p-4">
                    <h3 className="flex items-center gap-2 text-sage-700 font-semibold mb-4">
                        <FiEdit3 size={18} />
                        Informações Adicionais
                    </h3>
                    <div className="space-y-4">
                        <label htmlFor="notes" className="block">
                            <span className="block text-sm font-medium text-sage-700 mb-2">Anotações</span>
                            <textarea
                                id="notes"
                                placeholder="Observações sobre o paciente..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-3 py-2 border border-sage-200 rounded-lg focus:outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-400 resize-none"
                                rows={3}
                            />
                        </label>

                        {initialData && (
                            <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-sage-200">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={status === "active"}
                                        onChange={() =>
                                            setStatus((prev) => (prev === "active" ? "inactive" : "active"))
                                        }
                                        className="w-4 h-4 text-sage-600 bg-sage-100 border-sage-300 rounded focus:ring-sage-500"
                                    />
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-sage-700">Paciente Ativo</span>
                                    <p className="text-xs text-sage-500">
                                        {status === "active" ? "Paciente está ativo no sistema" : "Paciente inativado"}
                                    </p>
                                </div>
                            </label>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-sage-100">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={onClose}
                        className="border-sage-300 text-sage-700 hover:bg-sage-50 w-full sm:w-auto order-2 sm:order-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        className="bg-sage-600 hover:bg-sage-700 border-sage-600 w-full sm:w-auto order-1 sm:order-2"
                    >
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default PatientModal;
