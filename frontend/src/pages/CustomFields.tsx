import React, { useState } from "react";
import Title from "../components/Title/Title";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Card from "../components/Card/Card";
import Button from "../components/Button/Button";
import Icon from "../components/Icon/Icon";
import CustomFieldModal from "../components/CustomField/CustomFieldModal";

interface CustomField {
  name: string;
  type: string;
}

const CustomFields: React.FC = () => {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);

  const handleAddCustomField = (field: CustomField) => {
    setCustomFields([...customFields, field]);
    setIsCustomFieldModalOpen(false);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <Title level={1}>Campos Personalizados</Title>
      </div>

      <div className="flex justify-end mb-6">
        <Button
          variant="primary"
          icon={<Icon type="plus" size={16} />}
          onClick={() => setIsCustomFieldModalOpen(true)}
        >
          Novo Campo
        </Button>
      </div>

      {customFields.length > 0 ? (
        <Card>
          <ul className="space-y-2">
            {customFields.map((field, index) => (
              <li
                key={index}
                className="flex justify-between border-b pb-2 text-sm text-gray-700"
              >
                <div>
                  <strong>{field.name}:</strong> {field.type}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-6 text-gray-500">
            Nenhum campo personalizado adicionado ainda.
          </div>
        </Card>
      )}

      <CustomFieldModal
        isOpen={isCustomFieldModalOpen}
        onClose={() => setIsCustomFieldModalOpen(false)}
        onSubmit={handleAddCustomField}
      />
    </MainLayout>
  );
};

export default CustomFields;
