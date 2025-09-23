import React from 'react';
import Title from '../Title/Title';
import Input from '../Form/Input/Input';
import Label from '../Form/Label/Label';
import Button from '../Button/Button';
import { FiUser, FiMail, FiPhone, FiFileText } from 'react-icons/fi';

interface PersonalDataFormProps {
  initialData?: {
    name: string;
    email: string;
    phone?: string;
    crp?: string;
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
    <div className="p-1">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-sage-100 rounded-lg p-3">
          <FiUser size={24} className="text-sage-600" />
        </div>
        <Title level={3} className="text-sage-800 mb-0">Dados Pessoais</Title>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="name">
              Nome Completo
            </Label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={18} />
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Digite seu nome completo"
                className="pl-10 border-sage-200 focus:border-sage-400"
              />
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="email">
              Email
            </Label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={18} />
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="exemplo@email.com"
                className="pl-10 border-sage-200 focus:border-sage-400"
              />
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="phone">
              Telefone
            </Label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={18} />
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                className="pl-10 border-sage-200 focus:border-sage-400"
              />
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="crp">
              CRP
            </Label>
            <div className="relative">
              <FiFileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={18} />
              <Input
                id="crp"
                name="crp"
                value={formData.crp}
                onChange={handleChange}
                placeholder="00/00000"
                className="pl-10 border-sage-200 focus:border-sage-400"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-sage-100">
          <Button 
            type="submit" 
            variant="primary"
            className="bg-sage-600 hover:bg-sage-700 border-sage-600"
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PersonalDataSettings;