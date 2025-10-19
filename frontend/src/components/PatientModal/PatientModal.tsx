import React, { useState, useEffect } from "react";
import Button from "../Button/Button";
import Input from "../Form/Input/Input";
import Modal from "../Modal/Modal";
import { FiUser, FiCalendar, FiFileText, FiPhone, FiMail, FiEdit3 } from "react-icons/fi";

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

  useEffect(() => {
    const loadFields = async () => {
      if (initialData?.id) {
        const res = await fetch(`http://localhost:5000/api/patients/${initialData.id}`);
        const data = await res.json();
        if (data.customFields) setCustomFields(data.customFields);
      } else {
        const res = await fetch("http://localhost:5000/api/fields?usuario_id=1");
        const fields = await res.json();
        setCustomFields(fields.map((f: any) => ({ ...f, value: "" })));
      }
    };

    loadFields();

    if (initialData) {
      setName(initialData.name || "");
      setBirthDate(initialData.birthDate || "");
      setCpf(initialData.cpf || "");
      setRg(initialData.rg || "");
      setPhone(initialData.phone || "");
      setEmail(initialData.email || "");
      setNotes(initialData.notes || "");
      setStatus(initialData.status || "active");
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      name,
      birthDate,
      cpf,
      rg: rg || undefined,
      phone,
      email: email || undefined,
      notes,
      status,
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
                onChange={(e) => setName(e.target.value)}
                required
                className="border-sage-200 focus:border-sage-400 text-sm sm:text-base"
              />
            </label>

            <label htmlFor="birthDate" className="block">
              <span className="block text-sm font-medium text-sage-700 mb-2">Data de Nascimento</span>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={16} />
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="pl-10 border-sage-200 focus:border-sage-400 text-sm sm:text-base"
                />
              </div>
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
                onChange={(e) => setCpf(e.target.value)}
                required
                mask="999.999.999-99"
                className="border-sage-200 focus:border-sage-400 text-sm sm:text-base"
              />
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
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  mask="(99) 99999-9999"
                  className="pl-10 border-sage-200 focus:border-sage-400 text-sm sm:text-base"
                />
              </div>
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-sage-200 focus:border-sage-400 text-sm sm:text-base"
                />
              </div>
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