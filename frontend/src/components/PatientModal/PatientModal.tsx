import React, { useState, useEffect } from "react";
import Button from "../Button/Button";
import Input from "../Form/Input/Input";
import Modal from "../Modal/Modal";

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
      <form onSubmit={handleSubmit} className="space-y-4">
        <label htmlFor="name" className="block">
          Nome completo
          <Input
            id="name"
            value={name}
            placeholder="Digite o nome completo do paciente"
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label htmlFor="birthDate" className="block">
          Data de Nascimento
          <Input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </label>

        <label htmlFor="cpf" className="block">
          CPF
          <Input
            id="cpf"
            value={cpf}
            placeholder="000.000.000-00"
            onChange={(e) => setCpf(e.target.value)}
            required
            mask="999.999.999-99"
          />
        </label>

        <label htmlFor="rg" className="block">
          RG
          <Input
            id="rg"
            value={rg}
            placeholder="00.000.000-0"
            onChange={(e) => setRg(e.target.value)}
          />
        </label>

        <label htmlFor="phone" className="block">
          Telefone
          <Input
            id="phone"
            value={phone}
            placeholder="(00) 00000-0000"
            onChange={(e) => setPhone(e.target.value)}
            required
            mask="(99) 99999-9999"
          />
        </label>

        <label htmlFor="email" className="block">
          Email
          <Input
            id="email"
            type="email"
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {/* Campos personalizados dinâmicos */}
        {customFields.map((field) => (
          <label key={field.id} className="block">
            {field.name}
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
            />
          </label>
        ))}

        <label htmlFor="notes" className="block">
          Anotações
          <Input
            id="notes"
            placeholder="Observações sobre o paciente"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={status === "active"}
            onChange={() =>
              setStatus((prev) => (prev === "active" ? "inactive" : "active"))
            }
          />
          Ativo
        </label>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PatientModal;
