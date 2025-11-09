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
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const loadFields = async () => {
      try {
        if (initialData?.id) {
          
          // Em vez de buscar novamente, usamos os dados já recebidos via props
          // Se houver campos personalizados, os utilizamos
          if (initialData.customFields) {
            setCustomFields(initialData.customFields);
          } else {
            // Se não houver campos personalizados, buscamos apenas os campos (sem sobrescrever os dados do paciente)
            try {
              const res = await fetch("http://localhost:5000/api/fields?usuario_id=1");
              if (res.ok) {
                const fields = await res.json();
                setCustomFields(fields.map((f: any) => ({ ...f, value: "" })));
              }
            } catch (fieldError) {
              setCustomFields([]);
            }
          }
        } else {
          const res = await fetch("http://localhost:5000/api/fields?usuario_id=1");
          if (!res.ok) {
            throw new Error(`Erro ao carregar campos personalizados: ${res.status}`);
          }
          const fields = await res.json();
          setCustomFields(fields.map((f: any) => ({ ...f, value: "" })));
        }
      } catch (error) {
        // Caso não consiga carregar campos personalizados, continua com uma lista vazia
        if (!initialData?.id) {
          setCustomFields([]);
        }
      }
    };

    // Resetar os campos quando o modal é aberto/fechado ou os dados iniciais mudam
    if (isOpen) {
      if (initialData) {
        
        // Nome é o campo mais importante, garantir que seja preenchido corretamente
        const nameValue = initialData.name || "";
        
        // Verificações detalhadas para garantir dados corretos
        if (!nameValue) {
        }
        
        // Verificação específica para o campo de telefone
        const phoneValue = initialData.phone || "";
        
        if (!phoneValue) {
        }
        
        setName(nameValue);
        
        // Verifica e define cada campo, garantindo valores padrão apropriados
        setBirthDate(initialData.birthDate || "");
        setCpf(initialData.cpf || "");
        setRg(initialData.rg || "");
        setPhone(phoneValue); // Usar a variável phoneValue
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
    } else {
    }
    
    // Carrega os campos personalizados depois de configurar os dados básicos
    loadFields();
  }, [initialData, isOpen]);

  // Funções de validação
  const validateName = (name: string): string | null => {
    if (name.length < 3) {
      return "O nome deve ter no mínimo 3 caracteres";
    }
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name)) {
      return "O nome deve conter apenas letras e espaços";
    }
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email) return null; // Email é opcional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Email inválido";
    }
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    const phoneRegex = /^(?:\+?55\s?)?0?(?:\(?[1-9]{2}\)?)[\s.-]?(?:9?\d{4}[\s.-]?\d{4})$/;
    if (!phoneRegex.test(phone)) {
      return "Telefone inválido";
    }
    return null;
  };

  const validateCPF = (cpf: string): string | null => {
    if (!CPFHelper.validaCPF(cpf)) {
      return "CPF inválido";
    }
    return null;
  };

  const validateBirthDate = (dateString: string): string | null => {
    if (!dateString) return null; // Data vazia é permitida

    // Verificar formato básico YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return 'Formato de data inválido. Use o formato YYYY-MM-DD';
    }

    const [yearStr, monthStr, dayStr] = dateString.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    // Verificar se os valores estão no range válido
    if (month < 1 || month > 12) {
      return 'Mês deve estar entre 01 e 12';
    }

    if (day < 1 || day > 31) {
      return 'Dia deve estar entre 01 e 31';
    }

    // Verificar se o ano é menor que 1900
    if (year < 1900) {
      return 'Ano deve ser maior ou igual a 1900';
    }

    // Criar data e verificar se é válida
    const date = new Date(year, month - 1, day);
    const today = new Date();

    // Verificar se a data criada corresponde aos valores originais
    // Isso detecta datas inválidas como 31 de fevereiro
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return 'Data inválida para o mês selecionado';
    }

    // Verificar se a data é no futuro
    if (date > today) {
      return 'Data de nascimento não pode ser no futuro';
    }

    return null; // Data válida
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Coletar todos os erros de validação
    const errors: { [key: string]: string } = {};

    const nameError = validateName(name.trim());
    if (nameError) {
      errors.name = nameError;
    }

    const birthDateError = validateBirthDate(birthDate);
    if (birthDateError) {
      errors.birthDate = birthDateError;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      errors.email = emailError;
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      errors.phone = phoneError;
    }

    const cpfError = validateCPF(cpf);
    if (cpfError) {
      errors.cpf = cpfError;
    }

    setErrors(errors);
    if (Object.keys(errors).length > 0) {
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
      status: initialData ? status : "active", // Define como "active" apenas na criação
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
      setCustomFields((prev) =>
        prev.map((field) => ({ ...field, value: "" }))
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Pessoais */}
        <div className="bg-sage-50 rounded-xl p-3 sm:p-4">
          <h3 className="flex items-center gap-2 text-sage-700 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
            <FiUser size={16} className="sm:w-[18px] sm:h-[18px]" />
            Informações Pessoais
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <label htmlFor="name" className="block">
              <span className="block text-sm font-medium text-sage-700 mb-2">Nome completo *</span>
              <Input
                id="name"
                value={name}
                placeholder="Digite o nome completo do paciente"
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors(prev => ({ ...prev, name: "" }));
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
                    setErrors(prev => ({ ...prev, birthDate: "" }));
                  }}
                  className="pl-10 border-sage-200 focus:border-sage-400 text-sm sm:text-base"
                />
              </div>
              {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
            </label>
          </div>
        </div>

        {/* Documentos */}
        <div className="bg-sage-50 rounded-xl p-3 sm:p-4">
          <h3 className="flex items-center gap-2 text-sage-700 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
            <FiFileText size={16} className="sm:w-[18px] sm:h-[18px]" />
            Documentos
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <label htmlFor="cpf" className="block">
              <span className="block text-sm font-medium text-sage-700 mb-2">CPF *</span>
              <Input
                id="cpf"
                value={cpf}
                placeholder="000.000.000-00"
                onChange={(e) => {
                  setCpf(e.target.value);
                  setErrors(prev => ({ ...prev, cpf: "" }));
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

        {/* Contato */}
        <div className="bg-sage-50 rounded-xl p-3 sm:p-4">
          <h3 className="flex items-center gap-2 text-sage-700 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
            <FiPhone size={16} className="sm:w-[18px] sm:h-[18px]" />
            Contato
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <label htmlFor="phone" className="block">
              <span className="block text-sm font-medium text-sage-700 mb-2">Telefone *</span>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={16} />
                <Input
                  id="phone"
                  value={phone}
                  placeholder="(00) 00000-0000"
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setErrors(prev => ({ ...prev, phone: "" }));
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
                    setErrors(prev => ({ ...prev, email: "" }));
                  }}
                  className="pl-10 border-sage-200 focus:border-sage-400 text-sm sm:text-base"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </label>
          </div>
        </div>

        {/* Campos personalizados */}
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
                  <Input
                    type={field.type === "number" ? "number" : "text"}
                    value={field.value}
                    required={field.required}
                    onChange={(e) =>
                      setCustomFields((prev) =>
                        prev.map((f) =>
                          f.id === field.id ? { ...f, value: e.target.value } : f
                        )
                      )
                    }
                    className="border-sage-200 focus:border-sage-400"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Anotações e Status */}
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

        {/* Ações */}
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