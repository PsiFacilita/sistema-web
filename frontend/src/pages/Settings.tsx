import React, { useState } from 'react';
import Title from '../components/Title/Title';
import PersonalDataSettings from '../components/PersonalDataSettings';
import CollaboratorManager from '../components/CollaboratorManager';
import WorkScheduleManager, { createDefaultWeeklySchedule, WeeklyScheduleConfig } from '../components/WorkScheduleManager/WorkScheduleManager';
import MainLayout from '../components/layout/MainLayout/MainLayout';
import Card from '../components/Card/Card';

const Settings: React.FC = () => {
  const [userData] = useState({
    name: 'Dr. Psicólogo',
    email: 'psicologo@clinica.com',
    phone: '(11) 99999-9999',
    crp: '00/05222'
  });

  // Estado para armazenar o horário semanal com exceções
  const [workSchedules, setWorkSchedules] = useState<WeeklyScheduleConfig>(createDefaultWeeklySchedule());

  const handlePersonalDataSave = (data: any) => {
    console.log('Dados pessoais atualizados:', data);
    // Implementar lógica para salvar os dados
  };

  const handleCollaboratorsSave = (collaborators: any[]) => {
    console.log('Colaboradores atualizados:', collaborators);
    // Implementar lógica para salvar colaboradores
  };

  const handleScheduleSave = (schedules: WeeklyScheduleConfig) => {
    console.log('Horários atualizados:', schedules);
    setWorkSchedules(JSON.parse(JSON.stringify(schedules)));
  };

  return (
    <MainLayout>
      <div className="pb-10">
        <Title level={1} className="text-sage-700 mb-8">Configurações</Title>

        {/* Layout em duas colunas para dados pessoais e colaboradores */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Coluna da esquerda - Dados Pessoais */}
          <Card variant="elevated" className="h-full">
            <PersonalDataSettings 
              initialData={userData}
              onSave={handlePersonalDataSave}
            />
          </Card>

          {/* Coluna da direita - Gerenciador de Colaboradores */}
          <Card variant="elevated" className="h-full">
            <CollaboratorManager
              onSave={handleCollaboratorsSave}
            />
          </Card>
        </div>

        {/* Gerenciador de Horários abaixo, ocupando largura total */}
        <Card variant="elevated">
          <WorkScheduleManager
            initialConfig={workSchedules}
            onSave={handleScheduleSave}
          />
        </Card>
      </div>
    </MainLayout>
  );
};

export default Settings;