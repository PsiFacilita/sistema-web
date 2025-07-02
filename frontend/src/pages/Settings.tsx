import React, { useState } from 'react';
import Title from '../components/Title/Title';
import PersonalDataSettings from '../components/PersonalDataSettings';
import CollaboratorManager from '../components/CollaboratorManager';
import WorkScheduleManager, { createDefaultWeeklySchedule, WeeklyScheduleConfig } from '../components/WorkScheduleManager/WorkScheduleManager';
import MainLayout from '../components/layout/MainLayout/MainLayout';

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
        <Title level={1}>Configurações</Title>

        {/* Layout em duas colunas para dados pessoais e colaboradores */}
        <div className="flex flex-wrap justify-between mb-8 items-stretch">
          {/* Coluna da esquerda - Dados Pessoais */}
          <div className="w-full lg:w-[48%] bg-white p-6 rounded-lg shadow">
            <PersonalDataSettings 
              initialData={userData}
              onSave={handlePersonalDataSave}
            />
          </div>

          {/* Coluna da direita - Gerenciador de Colaboradores */}
          <div className="w-full lg:w-[48%]">
            <CollaboratorManager
              onSave={handleCollaboratorsSave}
            />
          </div>
        </div>

        {/* Gerenciador de Horários abaixo, ocupando largura total */}
        <div className="w-full">
          <WorkScheduleManager
            initialConfig={workSchedules}
            onSave={handleScheduleSave}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
