import React from 'react';
import Title from '../Title/Title';
import Input from '../Form/Input';
import Label from '../Form/Label';
import Button from '../Button';

interface PersonalDataFormProps {
  initialData?: {
    name: string;
    email: string;
    phone?: string;
    specialization?: string;
  };
  onSave?: (data: any) => void;
}

const PersonalDataSettings: React.FC<PersonalDataFormProps> = ({ 
  initialData = {
    name: '',
    email: '',
    phone: '',
    crp: '',
  },
  onSave 
}) => {
  const [formData, setFormData] = React.useState(initialData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    } else {
      console.log('Dados pessoais salvos:', formData);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-6">
      <Title level={3}>Dados Pessoais</Title>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <Label className="mb-1" htmlFor="name">Nome Completo</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Digite seu nome completo"
          />
        </div>

        <div className="mb-4">
          <Label className="mb-1" htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="exemplo@email.com"
          />
        </div>

        <div className="mb-4">
          <Label className="mb-1" htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(00) 00000-0000"
          />
        </div>

        <div className="mb-4">
          <Label className="mb-1" htmlFor="crp">CRP</Label>
          <Input
            id="crp"
            name="crp"
            value={formData.crp}
            onChange={handleChange}
            placeholder="00/00000"
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary">
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PersonalDataSettings;