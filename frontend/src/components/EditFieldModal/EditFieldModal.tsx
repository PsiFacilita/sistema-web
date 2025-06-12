import React, { useState } from "react";
import Modal from "../Modal/Modal";
import Button from "../Button/Button";

interface EditFieldModalProps {
  fieldLabel: string;
  currentValue: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newValue: string) => void;
}

const EditFieldModal: React.FC<EditFieldModalProps> = ({
  fieldLabel,
  currentValue,
  isOpen,
  onClose,
  onSave,
}) => {
  const [value, setValue] = useState(currentValue);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{`Editar ${fieldLabel}`}</h2> {/* Título sem ícone */}
      </div>
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">{fieldLabel}</label>
        <input
          className="w-full border border-gray-300 rounded-md p-2"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Salvar
        </Button>
      </div>
    </Modal>
  );
};

export default EditFieldModal;
