import React, { useState } from "react";
import Modal from "../Modal/Modal";
import Input from "../Form/Input/Input";
import Button from "../Button/Button";

interface CustomFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (field: { name: string; type: string }) => void;
}

const CustomFieldModal: React.FC<CustomFieldModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("text");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    onSubmit({ name, type });
    setName("");
    setType("text");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Campo Personalizado">
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label htmlFor="field-type" className="block font-medium">
            Tipo do Campo
          </label>
          <select
            id="field-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
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

        <div className="flex justify-end gap-2">
          <Button type="button" variant="danger" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Adicionar Campo
          </Button>
        </div>
      </form>
    </Modal>
  );
};


export default CustomFieldModal;
