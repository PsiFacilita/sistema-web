import React, { useState } from "react";
import Modal from "../Modal/Modal";
import Input from "../Form/Input/Input";
import Button from "../Button/Button";
import Swal from "sweetalert2";

interface CustomFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (field: { name: string; option: string; type: string }) => void;
}

const CustomFieldModal: React.FC<CustomFieldModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [option, setOption] = useState("text");
  const [type, setType] = useState("");
  const [isRequired, setIsRequired] = useState(false);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setStep(2);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRequired && !type) {
      Swal.fire("Atenção!", "Preencha o campo obrigatório.", "warning");
      return;
    }

    onSubmit({ name, option, type });
    Swal.fire("Sucesso!", "O Campo Personalizado criado com sucesso!", "success");
    setName("");
    setOption("text");
    setType("");
    setIsRequired(false);
    setStep(1);
  };

  const renderDynamicInput = () => {
    switch (option) {
      case "text":
      case "email":
      case "phone":
        return (
          <Input
            value={type}
            onChange={(e) => setType(e.target.value)}
            type={option}
            placeholder="(00) 00000-0000"
            required={isRequired}
          />
        );
      case "number":
        return (
          <Input
            value={type}
            onChange={(e) => setType(e.target.value)}
            type="number"
            placeholder="Digite um número"
            required={isRequired}
          />
        );
      case "date":
        return (
          <Input
            value={type}
            onChange={(e) => setType(e.target.value)}
            type="date"
            required={isRequired}
          />
        );
      case "textarea":
        return (
          <textarea
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Digite o texto"
            required={isRequired}
          />
        );
      default:
        return null;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center gap-4 mb-4">
      {[1, 2].map((s) => (
        <div
          key={s}
          className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
            step === s ? "bg-blue-500 text-white" : "bg-white text-gray-400"
          } ${step > s ? "bg-white border-green-500 text-green-500" : ""}`}
        >
          {step > s ? "✓" : s}
        </div>
      ))}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Campo Personalizado">
      {renderStepIndicator()}

      {step === 1 ? (
        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <label htmlFor="field-name" className="block font-medium">
              Nome do Campo
            </label>
            <Input
              id="field-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do campo"
              required
            />
          </div>

          <div>
            <label htmlFor="field-option" className="block font-medium">
              Tipo do Campo
            </label>
            <select
              id="field-option"
              value={option}
              onChange={(e) => setOption(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="text">Texto</option>
              <option value="number">Número</option>
              <option value="date">Data</option>
              <option value="textarea">Área de Texto</option>
              <option value="email">Email</option>
              <option value="phone">Telefone</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="required-checkbox"
              type="checkbox"
              checked={isRequired}
              onChange={() => setIsRequired(!isRequired)}
            />
            <label htmlFor="required-checkbox">Campo obrigatório</label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="danger" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Continuar
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <div>
            <label className="font-medium">{name}</label>
          </div>
          <div>{renderDynamicInput()}</div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(1)}
            >
              Voltar
            </Button>
            <Button type="submit" variant="primary">
              Salvar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default CustomFieldModal;
