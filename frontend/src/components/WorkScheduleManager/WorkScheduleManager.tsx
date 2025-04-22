import React, { useState, useEffect } from 'react';
import Title from '../Title';
import Button from '../Button';
import Input from '../Form/Input';
import Label from '../Form/Label';
import Select from '../Form/Select';
import Modal from '../Modal';

interface TimeSlot {
  id: string;
  type: 'work' | 'break';
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface DailySchedule {
  date: string; // formato YYYY-MM-DD
  timeSlots: TimeSlot[];
}

interface WorkScheduleManagerProps {
  initialSchedules?: DailySchedule[];
  onSave?: (schedules: DailySchedule[]) => void;
}

// Função utilitária para adicionar zeros à esquerda em números (formatação de tempo)
const padTimeNumber = (num: number): string => {
  return num.toString().padStart(2, '0');
};

// Função utilitária para formatar string de tempo (HH:MM)
const formatTimeString = (hours: number, minutes: number): string => {
  return `${padTimeNumber(hours)}:${padTimeNumber(minutes)}`;
};

// Função utilitária para criar cópias profundas de objetos
const deepCopy = <T,>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Array com os nomes dos dias da semana em português (na ordem do JavaScript: 0=Domingo, 1=Segunda, etc)
const weekdayNames = [
  'Segunda-feira', 'Terça-feira', 
  'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado' ,'Domingo'
];

// Função para formatar a data mostrando o dia da semana
const formatDateWithWeekday = (dateString: string): string => {
  const date = new Date(dateString);
  const weekday = weekdayNames[date.getDay()]; // getDay() retorna 0-6, onde 0=Domingo
  return `${weekday}, ${date.toLocaleDateString('pt-BR')}`;
};

// Função para criar slots de tempo de trabalho padrão (sessões de 45 min + intervalos de 15 min)
const createWorkTimeSlots = (startHour: number, endHour: number, lunchHour: number): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  let slotId = 1;
  
  // Função auxiliar para criar slots em um intervalo de horas
  const createSlotsForRange = (rangeStart: number, rangeEnd: number) => {
    for (let hour = rangeStart; hour < rangeEnd; hour++) {
      // Slot de trabalho (45 min)
      slots.push({
        id: `slot-${slotId++}`,
        type: 'work',
        startTime: formatTimeString(hour, 0),
        endTime: formatTimeString(hour, 45),
        isActive: true
      });
      
      // Slot de intervalo (15 min) - exceto após o último horário do período
      if (hour < rangeEnd - 1) {
        slots.push({
          id: `slot-${slotId++}`,
          type: 'break',
          startTime: formatTimeString(hour, 45),
          endTime: formatTimeString(hour + 1, 0),
          isActive: true
        });
      }
    }
  };
  
  // Slots da manhã (até o horário do almoço)
  createSlotsForRange(startHour, lunchHour);
  
  // Intervalo de almoço
  slots.push({
    id: `slot-${slotId++}`,
    type: 'break',
    startTime: formatTimeString(lunchHour, 0),
    endTime: formatTimeString(lunchHour + 1, 0),
    isActive: true
  });
  
  // Slots da tarde (após o almoço até o fim do expediente)
  createSlotsForRange(lunchHour + 1, endHour);
  
  return slots;
};

// Função para obter as datas da semana atual (segunda a domingo), com opção de incluir sábado e domingo
const getCurrentAndNextDays = (includeSaturday = false, includeSunday = false): string[] => {
  const days: string[] = [];

  // Descobre a data da segunda-feira da semana atual
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0 (domingo) a 6 (sábado)
  // Calcula diferença para segunda-feira (1)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  // Adiciona segunda a sexta
  for (let i = 0; i < 5; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day.toISOString().split('T')[0]);
  }

  // Adiciona sábado se solicitado
  if (includeSaturday) {
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    days.push(saturday.toISOString().split('T')[0]);
  }

  // Adiciona domingo se solicitado
  if (includeSunday) {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    days.push(sunday.toISOString().split('T')[0]);
  }

  return days;
};

// Função para criar uma agenda semanal padrão (Segunda a Sexta, 8:00-17:00)
const createDefaultWeeklySchedule = (): DailySchedule[] => {
  const weekdayDates = getCurrentAndNextDays();
  return weekdayDates.map(date => ({
    date,
    timeSlots: createWorkTimeSlots(8, 17, 12) // 8:00 às 17:00 com almoço às 12:00
  }));
};

const WorkScheduleManager: React.FC<WorkScheduleManagerProps> = ({
  initialSchedules = [],
  onSave
}) => {
  const [schedules, setSchedules] = useState<DailySchedule[]>(initialSchedules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentSchedule, setCurrentSchedule] = useState<DailySchedule | null>(null);
  const [includeSaturday, setIncludeSaturday] = useState(false);
  const [includeSunday, setIncludeSunday] = useState(false);
  
  // Formato da data atual YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  // Inicializa com a agenda semanal padrão se nenhuma agenda for fornecida
  useEffect(() => {
    if (initialSchedules.length === 0) {
      const defaultSchedules = createDefaultWeeklySchedule();
      setSchedules(defaultSchedules);
      
      if (onSave) {
        onSave(defaultSchedules);
      }
    } else {
      // Se recebermos novas agendas do componente pai, atualizamos o estado local
      setSchedules(deepCopy(initialSchedules));
      
      // Se temos um horário selecionado atualmente, precisamos atualizar esse horário também
      if (currentSchedule) {
        const updatedCurrentSchedule = initialSchedules.find(s => s.date === currentSchedule.date);
        if (updatedCurrentSchedule) {
          setCurrentSchedule(deepCopy(updatedCurrentSchedule));
        }
      }
    }
  }, [initialSchedules]);

  // Atualiza agendas quando includeSaturday ou includeSunday mudam
  useEffect(() => {
    const weekdayDates = getCurrentAndNextDays(includeSaturday, includeSunday);
    
    // Para cada data, verifica se já temos uma agenda
    const updatedSchedules = weekdayDates.map(date => {
      const existingSchedule = schedules.find(s => s.date === date);
      // Preserva a configuração existente, incluindo o status isActive dos slots
      return existingSchedule || {
        date,
        timeSlots: createWorkTimeSlots(8, 17, 12)
      };
    });
    
    // Preserva as agendas existentes que não fazem parte dos dias da semana selecionados
    // (para garantir que configurações personalizadas de outras datas não sejam perdidas)
    const nonWeekdaySchedules = schedules.filter(
      schedule => !weekdayDates.includes(schedule.date)
    );
    
    const finalSchedules = [...updatedSchedules, ...nonWeekdaySchedules];
    
    setSchedules(finalSchedules);
    
    if (onSave) {
      onSave(deepCopy(finalSchedules));
    }
  }, [includeSaturday, includeSunday]);

  const toggleSaturday = () => {
    setIncludeSaturday(!includeSaturday);
  };

  const toggleSunday = () => {
    setIncludeSunday(!includeSunday);
  };

  // Função auxiliar para carregar uma agenda específica para uma data
  const loadScheduleForDate = (date: string) => {
    setSelectedDate(date);
    
    // Verifica se já existe agenda para esta data
    const existingSchedule = schedules.find(s => s.date === date);
    if (existingSchedule) {
      // Cria uma cópia profunda para evitar mutações acidentais
      const scheduleCopy = deepCopy(existingSchedule);
      console.log("Carregando horários existentes:", scheduleCopy);
      setCurrentSchedule(scheduleCopy);
    } else {
      // Cria uma nova agenda com slots padrão para a data selecionada
      const newSchedule = {
        date,
        timeSlots: createWorkTimeSlots(8, 17, 12) // Usar configuração padrão para novos dias
      };
      console.log("Criando novos horários:", newSchedule);
      setCurrentSchedule(newSchedule);
    }
  };

  const handleDayClick = (date: string) => {
    loadScheduleForDate(date);
    setIsModalOpen(true);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    loadScheduleForDate(date);
  };

  const handleAddTimeSlot = () => {
    if (!currentSchedule) return;

    // Add a default 45-minute work slot
    const newTimeSlot: TimeSlot = {
      id: Date.now().toString(),
      type: 'work',
      startTime: '08:00',
      endTime: '08:45',
      isActive: true
    };

    setCurrentSchedule({
      ...currentSchedule,
      timeSlots: [...currentSchedule.timeSlots, newTimeSlot]
    });
  };

  const handleTimeSlotChange = (id: string, field: keyof TimeSlot, value: any) => {
    if (!currentSchedule) return;

    // Cria uma cópia profunda do estado atual para evitar problemas de referência
    const updatedSchedule = deepCopy(currentSchedule);
    const updatedTimeSlots = updatedSchedule.timeSlots.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    );

    // Atualiza o estado com a nova cópia que inclui as alterações
    setCurrentSchedule({
      ...updatedSchedule,
      timeSlots: updatedTimeSlots
    });
  };

  const handleRemoveTimeSlot = (id: string) => {
    if (!currentSchedule) return;

    const updatedTimeSlots = currentSchedule.timeSlots.filter(slot => slot.id !== id);
    setCurrentSchedule({
      ...currentSchedule,
      timeSlots: updatedTimeSlots
    });
  };

  const handleSaveSchedule = () => {
    if (!currentSchedule) return;
    
    // Garantir que estamos salvando todas as propriedades dos slots corretamente
    const updatedSchedule = deepCopy(currentSchedule);
    
    // Cria uma entrada de log para depuração na console
    console.log("Salvando agendamento com slots:", updatedSchedule.timeSlots.map(slot => ({
      id: slot.id,
      type: slot.type,
      isActive: slot.isActive
    })));
      
    // Atualiza a agenda atual na lista de agendas
    const updatedSchedules = schedules.map(schedule => 
      schedule.date === updatedSchedule.date ? updatedSchedule : schedule
    );
    
    // Se a data não existia anteriormente, adiciona-a
    if (!updatedSchedules.some(s => s.date === updatedSchedule.date)) {
      updatedSchedules.push(updatedSchedule);
    }
    
    // Atualiza o estado local com as novas agendas
    setSchedules(deepCopy(updatedSchedules));
    
    // Notifica o componente pai sobre a alteração
    if (onSave) {
      // Cria uma cópia completa e envia para o componente pai para garantir que não haja referências compartilhadas
      onSave(deepCopy(updatedSchedules));
    }
    
    // Fecha o modal
    setIsModalOpen(false);
  };

  const handleResetToDefault = () => {
    if (!currentSchedule) return;
    
    // Redefine os horários para o padrão (8h às 17h com almoço ao meio-dia)
    setCurrentSchedule({
      ...currentSchedule,
      timeSlots: createWorkTimeSlots(8, 17, 12)
    });
  };

  const handleSelectAllSlots = (isActive: boolean) => {
    if (!currentSchedule) return;
    
    const updatedTimeSlots = currentSchedule.timeSlots.map(slot => ({
      ...slot,
      isActive
    }));
    
    setCurrentSchedule({
      ...currentSchedule,
      timeSlots: updatedTimeSlots
    });
  };

  // Organiza os horários por dia da semana - sempre usando os dias atuais da semana (segunda a sexta)
  const weekdayDates = getCurrentAndNextDays(includeSaturday, includeSunday);
  const weekdaySchedules = weekdayDates.map(date => {
    const existingSchedule = schedules.find(s => s.date === date);
    return {
      date,
      schedule: existingSchedule || { date, timeSlots: [] }
    };
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={3}>Horários de Atendimento</Title>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={toggleSaturday}
          >
            {includeSaturday ? 'Ocultar Sábado' : 'Incluir Sábado'}
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={toggleSunday}
          >
            {includeSunday ? 'Ocultar Domingo' : 'Incluir Domingo'}
          </Button>
        </div>
      </div>

      {/* Mostra os dias da semana como cards clicáveis */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {weekdaySchedules.map(({ date, schedule }) => {
          const hasTimeSlots = schedule.timeSlots && schedule.timeSlots.length > 0;
          // Conta apenas os slots de trabalho ativos (não conta intervalos)
          const activeTimeSlots = hasTimeSlots ? 
            schedule.timeSlots.filter(slot => slot.type === 'work' && slot.isActive) : 
            [];
          const hasActiveSlots = activeTimeSlots.length > 0;
          const dateObj = new Date(date);
          const weekday = weekdayNames[dateObj.getDay()];
          
          return (
            <div 
              key={date} 
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                hasActiveSlots ? 'bg-blue-50 border-blue-200' : 
                hasTimeSlots ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200'
              }`}
              onClick={() => handleDayClick(date)}
            >
              <h4 className="font-medium text-lg mb-1">{weekday}</h4>
              <p className="text-sm text-gray-600">
                {dateObj.toLocaleDateString('pt-BR')}
              </p>
              <div className="mt-2 text-sm">
                {hasActiveSlots ? (
                  <span className="text-green-600 font-medium">
                    {activeTimeSlots.length} horário(s) de atendimento
                  </span>
                ) : hasTimeSlots ? (
                  <span className="text-orange-500 font-medium">
                    Sem horários de atendimento
                  </span>
                ) : (
                  <span className="text-gray-500">
                    Clique para configurar
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para edição de horários */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          // Não salvar ao fechar pelo X, apenas fechar
          setIsModalOpen(false);
        }}
        title={`Configurar Horários: ${selectedDate ? formatDateWithWeekday(selectedDate) : ''}`}
        size="large"
      >
        <div className="mb-4">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            min={today}
          />
        </div>

        {currentSchedule && (
          <>
            <div className="mt-6 mb-4 flex flex-wrap justify-between items-center gap-2">
              <h4 className="font-medium">Horários do dia</h4>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSelectAllSlots(true)}
                >
                  Ativar Todos
                </Button>
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSelectAllSlots(false)}
                >
                  Desativar Todos
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleResetToDefault}
                >
                  Redefinir para Padrão
                </Button>
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={handleAddTimeSlot}
                >
                  Adicionar Horário
                </Button>
              </div>
            </div>
            
            {currentSchedule.timeSlots.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {currentSchedule.timeSlots.map(slot => (
                  <div 
                    key={slot.id} 
                    className={`border rounded p-4 relative ${
                      !slot.isActive ? 'bg-gray-50' : 
                      slot.type === 'break' ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor={`type-${slot.id}`}>Tipo</Label>
                        <Select
                          id={`type-${slot.id}`}
                          value={slot.type}
                          options={[
                            { value: 'work', label: 'Atendimento' },
                            { value: 'break', label: 'Intervalo' },
                          ]}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleTimeSlotChange(slot.id, 'type', e.target.value as 'work' | 'break')}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`startTime-${slot.id}`}>Início</Label>
                        <Input
                          id={`startTime-${slot.id}`}
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => handleTimeSlotChange(slot.id, 'startTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`endTime-${slot.id}`}>Fim</Label>
                        <Input
                          id={`endTime-${slot.id}`}
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => handleTimeSlotChange(slot.id, 'endTime', e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={slot.isActive}
                            onChange={(e) => handleTimeSlotChange(slot.id, 'isActive', e.target.checked)}
                            className="form-checkbox h-5 w-5"
                          />
                          <span>Ativo</span>
                        </label>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveTimeSlot(slot.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 111.414 1.414L11.414 10l4.293 4.293a1 1 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum horário adicionado. Clique em "Adicionar Horário" para começar.
              </div>
            )}
          </>
        )}

        <div className="mt-6 flex justify-end space-x-2">
          <Button 
            variant="secondary"
            onClick={() => {
              // Apenas fechar o modal ao cancelar, sem salvar
              setIsModalOpen(false);
            }}
          >
            Cancelar
          </Button>
          <Button 
            variant="primary"
            onClick={handleSaveSchedule}
            disabled={!currentSchedule || currentSchedule.timeSlots.length === 0}
          >
            Salvar Horários
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default WorkScheduleManager;