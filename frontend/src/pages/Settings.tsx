import React, { useState } from 'react';
import Title from '../components/Title/Title';
import PersonalDataSettings from '../components/PersonalDataSettings';
import CollaboratorManager from '../components/CollaboratorManager';
import WorkScheduleManager from '../components/WorkScheduleManager/WorkScheduleManager';

// Interface para a estrutura de dados de TimeSlot
interface TimeSlot {
  id: string;
  type: 'work' | 'break';
  startTime: string;
  endTime: string;
  isActive: boolean;
}

// Interface para a estrutura de dados de DailySchedule
interface DailySchedule {
  date: string; // formato YYYY-MM-DD
  timeSlots: TimeSlot[];
}

const Settings: React.FC = () => {
  const [userData] = useState({
    name: 'Dr. Psicólogo',
    email: 'psicologo@clinica.com',
    phone: '(11) 99999-9999',
    specialization: 'Psicologia Clínica'
  });
  
  // Estado para armazenar os horários de trabalho
  const [workSchedules, setWorkSchedules] = useState<DailySchedule[]>([]);

  const handlePersonalDataSave = (data: any) => {
    console.log('Dados pessoais atualizados:', data);
    // Implementar lógica para salvar os dados
  };

  const handleCollaboratorsSave = (collaborators: any[]) => {
    console.log('Colaboradores atualizados:', collaborators);
    // Implementar lógica para salvar colaboradores
  };

  const handleScheduleSave = (schedules: DailySchedule[]) => {
    console.log('Horários atualizados:', schedules);
    // Atualiza o estado com os novos horários
    setWorkSchedules(JSON.parse(JSON.stringify(schedules)));
  };

  return (
    <div className="pb-10">
      <Title level={1}>Configurações</Title>
      
      <PersonalDataSettings 
        initialData={userData}
        onSave={handlePersonalDataSave}
      />
      
      <CollaboratorManager
        onSave={handleCollaboratorsSave}
      />
      
      <WorkScheduleManager
        initialSchedules={workSchedules}
        onSave={handleScheduleSave}
      />
    </div>
  );
};

export default Settings;