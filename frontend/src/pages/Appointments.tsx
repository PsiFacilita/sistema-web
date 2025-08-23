import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout/MainLayout';
import Title from '../components/Title/Title';
import Card from '../components/Card/Card';
import Button from '../components/Button/Button';
import Icon from '../components/Icon/Icon';
import Modal from '../components/Modal/Modal';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  type: 'appointment' | 'break' | 'unavailable';
  patientName?: string;
  status?: 'agendado' | 'confirmado' | 'cancelado' | 'reagendado';
  notes?: string;
}

interface DaySchedule {
  date: string; // YYYY-MM-DD
  events: CalendarEvent[];
}

interface Patient {
  id: string;
  name: string;
}

const Appointments: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  
  // Estados para edição de agendamento
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedEvent, setEditedEvent] = useState<CalendarEvent | null>(null);
  const [editValidationErrors, setEditValidationErrors] = useState<{
    time?: string;
    status?: string;
  }>({});
  
  // Estado para o modal de novo agendamento
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [newAppointmentStep, setNewAppointmentStep] = useState(1); // 1 = seleção de paciente, 2 = data e hora
  const [searchTerm, setSearchTerm] = useState('');
  const [newAppointmentData, setNewAppointmentData] = useState({
    patientId: '',
    patientName: '',
    date: selectedDate || new Date().toISOString().split('T')[0],
    time: '08:00',
    notes: '',
    type: 'appointment' as CalendarEvent['type']
  });
  
  // Estado para erros de validação
  const [validationErrors, setValidationErrors] = useState<{
    date?: string;
    time?: string;
  }>({});
  
  // Mock de pacientes
  const [patients, setPatients] = useState<Patient[]>([
    { id: '1', name: 'Ana Silva' },
    { id: '2', name: 'João Santos' },
    { id: '3', name: 'Maria Oliveira' },
    { id: '4', name: 'Pedro Costa' },
    { id: '5', name: 'Carla Ferreira' },
    { id: '6', name: 'Ricardo Mendes' },
    { id: '7', name: 'Fernanda Almeida' },
    { id: '8', name: 'Luiz Pereira' },
    { id: '9', name: 'Beatriz Ramos' },
  ]);

  // Função para determinar a classe CSS baseada no status do evento
  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-blue-100 text-blue-800 border-blue-200'; // primary
      case 'agendado':
        return 'bg-purple-100 text-purple-800 border-purple-200'; // secondary
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200'; // danger
      case 'reagendado':
        return 'bg-gray-100 text-gray-800 border-gray-200'; // outline
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Funções de validação
  // Verifica se a data está no passado
  const isDateInPast = (dateStr: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const selectedDate = new Date(dateStr);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  // Verifica se o horário já passou (para datas de hoje)
  const isTimeInPast = (dateStr: string, timeStr: string): boolean => {
    const now = new Date();
    const selectedDate = new Date(dateStr);
    
    // Só verifica o horário se a data for hoje
    if (selectedDate.toDateString() === now.toDateString()) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const selectedDateTime = new Date(selectedDate);
      selectedDateTime.setHours(hours, minutes, 0, 0);
      return selectedDateTime < now;
    }
    
    return false;
  };

  // Função para gerar os dias do mês atual
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    
    // Determina o primeiro dia da semana (0 = domingo)
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    // Adiciona dias vazios para o início do mês alinhado à semana
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Adiciona os dias do mês
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    
    return days;
  };

  // Dias da semana formatados
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  // Desloca o mês atual
  const changeMonth = (delta: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentMonth(newDate);
  };

  // Nome do mês formatado
  const monthName = currentMonth.toLocaleString('pt-BR', { month: 'long' });
  const year = currentMonth.getFullYear();
  
  // Dias no mês atual
  const daysInMonth = getDaysInMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  // Handler para abrir o modal de novo agendamento
  const handleOpenNewAppointmentModal = (date?: string) => {
    setNewAppointmentStep(1);
    setSearchTerm('');
    
    // Reset validation errors
    setValidationErrors({});
    
    // Se for uma data passada, use a data atual
    const selectedDateObj = date ? new Date(date) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDateObj.setHours(0, 0, 0, 0);
    
    const validDate = selectedDateObj < today ? 
      today.toISOString().split('T')[0] : 
      date || selectedDate || new Date().toISOString().split('T')[0];
    
    setNewAppointmentData({
      ...newAppointmentData,
      date: validDate,
    });
    
    setIsNewAppointmentModalOpen(true);
  };

  // Handler para seleção de paciente
  const handlePatientSelect = (patient: Patient) => {
    setNewAppointmentData({
      ...newAppointmentData,
      patientId: patient.id,
      patientName: patient.name
    });
    setNewAppointmentStep(2);
  };

  // Handler para alteração da data
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    
    // Limpa erro anterior
    setValidationErrors(prev => ({ ...prev, date: undefined }));
    
    // Valida
    if (isDateInPast(newDate)) {
      setValidationErrors(prev => ({ 
        ...prev, 
        date: 'Não é possível agendar para datas passadas' 
      }));
    }
    
    // Atualiza estado
    setNewAppointmentData({
      ...newAppointmentData,
      date: newDate
    });
    
    // Reseta o horário para garantir que seja selecionado um horário válido
    // após a mudança de data
    setNewAppointmentData(prev => {
      const availableTimes = getAvailableTimesForDate(newDate);
      return {
        ...prev,
        date: newDate,
        time: availableTimes.length > 0 ? availableTimes[0] : prev.time
      };
    });
  };

  // Handler para alteração do horário
  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTime = e.target.value;
    
    // Limpa erro anterior
    setValidationErrors(prev => ({ ...prev, time: undefined }));
    
    // Valida
    if (isTimeInPast(newAppointmentData.date, newTime)) {
      setValidationErrors(prev => ({ 
        ...prev, 
        time: 'Não é possível agendar para horários que já passaram' 
      }));
    }
    
    // Atualiza estado
    setNewAppointmentData({
      ...newAppointmentData,
      time: newTime
    });
  };

  // Handler para avançar no fluxo
  const handleNextStep = () => {
    if (newAppointmentStep < 2) {
      setNewAppointmentStep(newAppointmentStep + 1);
    }
  };

  // Handler para voltar no fluxo
  const handlePreviousStep = () => {
    if (newAppointmentStep > 1) {
      setNewAppointmentStep(newAppointmentStep - 1);
    }
  };

  // Verifica se um horário já está ocupado para uma data específica
  const isTimeSlotOccupied = (date: string, time: string, excludeEventId?: string): boolean => {
    const daySchedule = daySchedules.find(schedule => schedule.date === date);
    if (!daySchedule) return false;
    
    return daySchedule.events.some(event => 
      event.time === time && (!excludeEventId || event.id !== excludeEventId)
    );
  };
  
  // Obtém os horários disponíveis para uma data específica
  const getAvailableTimesForDate = (date: string, excludeEventId?: string): string[] => {
    // Gera todas as horas possíveis (8:00 - 18:00)
    const allTimes = [
      ...Array.from({ length: 4 }, (_, i) => `${(8 + i).toString().padStart(2, '0')}:00`),  // 08:00 a 11:00
      ...Array.from({ length: 4 }, (_, i) => `${(14 + i).toString().padStart(2, '0')}:00`)  // 14:00 a 17:00
    ];
    
    // Filtra os horários que já estão ocupados
    return allTimes.filter(time => 
      !isTimeSlotOccupied(date, time, excludeEventId) && 
      !isTimeInPast(date, time)
    );
  };

  // Handler para criar agendamento
  const handleCreateAppointment = () => {
    // Valida dados antes de salvar
    const dateError = isDateInPast(newAppointmentData.date) ? 
      'Não é possível agendar para datas passadas' : undefined;
      
    const timeError = isTimeInPast(newAppointmentData.date, newAppointmentData.time) ?
      'Não é possível agendar para horários que já passaram' : undefined;
    
    if (dateError || timeError) {
      setValidationErrors({ date: dateError, time: timeError });
      return; // Impede a submissão
    }
    
    // Em um app real, enviaria para uma API
    console.log('Criando agendamento:', newAppointmentData);
    
    // Adiciona o evento ao estado local
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: 'Consulta',
      time: newAppointmentData.time,
      type: 'appointment',
      patientName: newAppointmentData.patientName,
      status: 'agendado', // Status inicial para novos agendamentos
      notes: newAppointmentData.notes
    };
    
    // Atualiza o daySchedules com o novo evento
    const dateExists = daySchedules.findIndex(day => day.date === newAppointmentData.date);
    if (dateExists >= 0) {
      const updatedSchedules = [...daySchedules];
      updatedSchedules[dateExists] = {
        ...updatedSchedules[dateExists],
        events: [...updatedSchedules[dateExists].events, newEvent].sort((a, b) => 
          a.time.localeCompare(b.time))
      };
      setDaySchedules(updatedSchedules);
      
      // Salva no localStorage
      saveSchedulesToLocalStorage(updatedSchedules);
    } else {
      const updatedSchedules = [
        ...daySchedules,
        {
          date: newAppointmentData.date,
          events: [newEvent]
        }
      ];
      setDaySchedules(updatedSchedules);
      
      // Salva no localStorage
      saveSchedulesToLocalStorage(updatedSchedules);
    }
    
    // Fecha o modal
    setIsNewAppointmentModalOpen(false);
    
    // Reset data
    setNewAppointmentData({
      patientId: '',
      patientName: '',
      date: selectedDate || new Date().toISOString().split('T')[0],
      time: '08:00',
      notes: '',
      type: 'appointment'
    });
    setNewAppointmentStep(1);
    setValidationErrors({});
  };

  // Salva agendamentos no localStorage
  const saveSchedulesToLocalStorage = (schedules: DaySchedule[]) => {
    localStorage.setItem('daySchedules', JSON.stringify(schedules));
  };

  // Carrega agendamentos do localStorage
  const loadSchedulesFromLocalStorage = (): DaySchedule[] => {
    const saved = localStorage.getItem('daySchedules');
    return saved ? JSON.parse(saved) : [];
  };

  // Simulação de dados de agendamento (normalmente viria de uma API)
  useEffect(() => {
    // Tenta carregar do localStorage primeiro
    const savedSchedules = loadSchedulesFromLocalStorage();
    
    if (savedSchedules.length > 0) {
      setDaySchedules(savedSchedules);
    } else {
      // Se não houver dados no localStorage, gera dados mock
      const loadSchedules = async () => {
        // Aqui você faria uma chamada API real
        const mockSchedules: DaySchedule[] = [];
        
        // Gera alguns eventos de exemplo
        for (let day of daysInMonth) {
          if (day && Math.random() > 0.6) { // 40% de chance de ter eventos neste dia
            const numEvents = Math.floor(Math.random() * 4) + 1;
            const events: CalendarEvent[] = [];
            
            for (let i = 0; i < numEvents; i++) {
              const hour = 8 + Math.floor(Math.random() * 9); // 8h-17h
              const minute = '00';
              const types = ['appointment', 'break', 'unavailable'] as const;
              const type = types[Math.floor(Math.random() * types.length)];
              
              // Definir status aleatório para appointments
              let status;
              if (type === 'appointment') {
                const statuses = ['agendado', 'confirmado', 'cancelado', 'reagendado'] as const;
                status = statuses[Math.floor(Math.random() * statuses.length)];
              }
              
              events.push({
                id: `event-${day.getDate()}-${i}`,
                title: type === 'appointment' ? 'Consulta' : type === 'break' ? 'Intervalo' : 'Indisponível',
                time: `${hour}:${minute}`,
                type,
                patientName: type === 'appointment' ? `Paciente ${i+1}` : undefined,
                status: type === 'appointment' ? status : undefined,
                notes: type === 'appointment' ? 'Anotações de exemplo para consulta.' : undefined
              });
            }
            
            mockSchedules.push({
              date: day.toISOString().split('T')[0],
              events: events.sort((a, b) => a.time.localeCompare(b.time))
            });
          }
        }
        
        setDaySchedules(mockSchedules);
        
        // Salva os dados mock no localStorage
        saveSchedulesToLocalStorage(mockSchedules);
      };
      
      loadSchedules();
    }
  }, [currentMonth]);

  // Handler para clique no dia
  const handleDayClick = (day: Date) => {
    if (!day) return;
    
    const dateString = day.toISOString().split('T')[0];
    setSelectedDate(dateString);
    
    // Busca eventos para esta data
    const daySchedule = daySchedules.find(schedule => schedule.date === dateString);
    setSelectedDayEvents(daySchedule?.events || []);
    
    setIsModalOpen(true);
  };

  const handleAppointmentClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click handlers
    setSelectedEvent(event);
    setIsAppointmentModalOpen(true);
    // Reset edição
    setIsEditMode(false);
    setEditedEvent(null);
    setEditValidationErrors({});
  };
  
  const handleBackToDayView = () => {
    setIsAppointmentModalOpen(false);
    setIsEditMode(false);
    setEditedEvent(null);
  };

  // Handler para entrar no modo de edição
  const handleStartEdit = () => {
    if (!selectedEvent) return;
    setEditedEvent({...selectedEvent});
    setIsEditMode(true);
  };
  
  // Handler para cancelar edição
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedEvent(null);
    setEditValidationErrors({});
  };
  
  // Handler para mudanças nos campos de edição
  const handleEditFieldChange = (field: keyof CalendarEvent, value: string) => {
    if (!editedEvent) return;
    
    // Limpa erros de validação anteriores
    if (field === 'time') {
      setEditValidationErrors(prev => ({...prev, time: undefined}));
    }
    
    // Cria uma cópia atualizada do evento
    const updatedEvent = {...editedEvent, [field]: value};
    setEditedEvent(updatedEvent);
    
    // Valida o horário
    if (field === 'time' && selectedDate) {
      if (isTimeInPast(selectedDate, value)) {
        setEditValidationErrors(prev => ({
          ...prev,
          time: 'Não é possível agendar para horários que já passaram'
        }));
      }
      
      // Verifica se o horário já está ocupado por outro agendamento
      if (isTimeSlotOccupied(selectedDate, value, editedEvent.id)) {
        setEditValidationErrors(prev => ({
          ...prev,
          time: 'Este horário já está ocupado'
        }));
      }
    }
  };
  
  // Handler para salvar edições
  const handleSaveEdit = () => {
    if (!editedEvent || !selectedDate) return;
    
    // Validação final
    if (editValidationErrors.time) {
      return; // Não salva se houver erros
    }
    
    // Atualiza o evento no estado
    const updatedSchedules = daySchedules.map(day => {
      if (day.date === selectedDate) {
        return {
          ...day,
          events: day.events.map(event => 
            event.id === editedEvent.id ? editedEvent : event
          ).sort((a, b) => a.time.localeCompare(b.time))
        };
      }
      return day;
    });
    
    setDaySchedules(updatedSchedules);
    
    // Atualiza eventos do dia selecionado
    const updatedDayEvents = updatedSchedules
      .find(day => day.date === selectedDate)?.events || [];
    setSelectedDayEvents(updatedDayEvents);
    
    // Atualiza evento selecionado
    setSelectedEvent(editedEvent);
    
    // Salva no localStorage
    saveSchedulesToLocalStorage(updatedSchedules);
    
    // Sai do modo de edição
    setIsEditMode(false);
    setEditedEvent(null);
  };

  // Função para determinar a classe CSS baseada no tipo de evento
  const getEventTypeClass = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'appointment':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'break':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Verificar se um dia tem eventos
  const getDayEvents = (day: Date | null) => {
    if (!day) return [];
    
    const dateString = day.toISOString().split('T')[0];
    const daySchedule = daySchedules.find(schedule => schedule.date === dateString);
    return daySchedule?.events || [];
  };

  const getBadgeClass = (title: string) => {
    if (title.includes('Consulta')) return 'bg-green-100 text-green-800';
    if (title.includes('Indisponível')) return 'bg-red-100 text-red-800';
    if (title.includes('Intervalo')) return 'bg-yellow-100 text-yellow-800';
      return 'bg-gray-200 text-gray-800';
  };
  
  // Filtra os pacientes baseado na busca
  const filteredPatients = patients.filter(
    patient => patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Obtém horários disponíveis para o dia selecionado
  const availableTimesForSelectedDate = getAvailableTimesForDate(newAppointmentData.date);

  // Obtém horários disponíveis para edição (incluindo o horário atual do evento)
  const getAvailableTimesForEdit = (date: string, eventId: string): string[] => {
    const allTimes = [
      ...Array.from({ length: 4 }, (_, i) => `${(8 + i).toString().padStart(2, '0')}:00`),  // 08:00 a 11:00
      ...Array.from({ length: 4 }, (_, i) => `${(14 + i).toString().padStart(2, '0')}:00`)  // 14:00 a 17:00
    ];
    
    // Para edição, inclui o horário atual do evento como opção
    return allTimes.filter(time => 
      (editedEvent && time === editedEvent.time) || 
      (!isTimeSlotOccupied(date, time, eventId) && !isTimeInPast(date, time))
    );
  };

  return (
    <MainLayout>
      <div className="pb-6">
        <div className="flex justify-between items-center mb-6">
          <Title level={1} className="text-xl md:text-3xl">Agenda</Title>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCurrentMonth(new Date())}
              className="px-3"
            >
              Hoje
            </Button>
            <div className="flex border rounded-md">
              <Button 
                variant="outline" 
                onClick={() => changeMonth(-1)}
                className="border-0 rounded-r-none"
              >
                <FiChevronLeft size={16} />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => changeMonth(1)}
                className="border-0 border-l rounded-l-none"
              >
                <FiChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium capitalize">
            {monthName} {year}
          </h2>

          <Button
            variant="primary"
            icon={<Icon type="plus" size={16} />}
            onClick={() => handleOpenNewAppointmentModal()}
          >
            Novo Agendamento
          </Button>
        </div>

        <Card>
          {/* Grade dos dias da semana */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {weekDays.map(day => (
              <div key={day} className="bg-white p-2 text-center font-medium text-gray-700">
                {day}
              </div>
            ))}
            
            {/* Dias do mês */}
            {daysInMonth.map((day, index) => {
              const events = getDayEvents(day);
              const isToday = day && new Date().toDateString() === day.toDateString();
              const hasEvents = events.length > 0;
              
              return (
                <div 
                  key={index}
                  className={`bg-white relative min-h-[100px] p-2 border border-transparent hover:border-blue-300 
                    ${isToday ? 'bg-blue-50' : ''} 
                    ${day ? 'cursor-pointer' : 'bg-gray-50'}`}
                  onClick={() => day && handleDayClick(day)}
                >
                  {day && (
                    <>
                      <div className={`text-right ${isToday ? 'font-bold text-blue-600' : ''}`}>
                        {day.getDate()}
                      </div>
                      
                      <div className="mt-1 space-y-1 max-h-[80px] overflow-hidden">
                        {events.slice(0, 3).map((event, idx) => (
                          <div 
                            key={idx} 
                            className={`text-xs px-1 py-0.5 rounded truncate border ${getEventTypeClass(event.type)} cursor-pointer hover:bg-opacity-80`}
                            onClick={(e) => handleAppointmentClick(event, e)}
                          >
                            <div className="flex justify-between">
                              <span>{event.time} - {event.title}</span>
                              {event.type === 'appointment' && event.status && (
                                <span className={`ml-1 px-1 rounded-full text-[10px] ${getStatusBadgeClass(event.status)}`}>
                                  {event.status}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {events.length > 3 && (
                          <div className="text-xs text-center text-gray-500">
                            +{events.length - 3} mais
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Modal para visualizar eventos do dia */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedDate ? `Agenda: ${new Date(selectedDate).toLocaleDateString('pt-BR')}` : 'Agenda do Dia'}
        size="medium"
      >
        {selectedDayEvents.length > 0 ? (
          <div className="space-y-4">
            {selectedDayEvents.map((event, index) => (
              <div 
                key={index} 
                className={`p-3 rounded border ${getEventTypeClass(event.type)} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={(e) => handleAppointmentClick(event, e)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{event.title}</h4>
                    {event.patientName && (
                      <p className="text-sm">{event.patientName}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-lg font-medium">{event.time}</div>
                    {event.status && event.type === 'appointment' && (
                      <span className={`text-xs px-2 py-0.5 mt-1 rounded-full ${getStatusBadgeClass(event.status)}`}>
                        {event.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Nenhum evento agendado para este dia.
          </div>
        )}
        
        <div className="mt-6 flex justify-end space-x-2">
          <Button 
            variant="danger"
            onClick={() => setIsModalOpen(false)}
          >
            Fechar
          </Button>
          
          {/* Só mostra o botão de adicionar agendamento se a data não for passada */}
          {selectedDate && !isDateInPast(selectedDate) && (
            <Button 
              variant="primary"
              onClick={() => {
                handleOpenNewAppointmentModal(selectedDate);
                setIsModalOpen(false);
              }}
            >
              Adicionar Evento
            </Button>
          )}
        </div>
      </Modal>
      
      {/* Modal para detalhes do agendamento */}
      <Modal
        isOpen={isAppointmentModalOpen}
        onClose={() => {
          setIsAppointmentModalOpen(false);
          setIsEditMode(false);
        }}
        title={isEditMode ? "Editar Agendamento" : "Detalhes do Agendamento"}
        size="small"
      >
        {selectedEvent && !isEditMode && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold">{selectedEvent.title}</h3>
                  <div className="flex gap-2">
                    {selectedEvent.status && selectedEvent.type === 'appointment' && (
                      <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusBadgeClass(selectedEvent.status)}`}>
                        {selectedEvent.status}
                      </span>
                    )}
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full flex items-center ${getBadgeClass(selectedEvent.title)}`}>
                      <Icon type="clock" size={14} className="mr-1 opacity-70" />
                      {selectedEvent.time}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedEvent.type === 'appointment' && selectedEvent.patientName && (
                  <div className="flex items-center">
                    <Icon type="user" size={18} className="mr-2 opacity-70" />
                    <span>{selectedEvent.patientName}</span>
                  </div>
                  )}
                  
                  {selectedEvent.notes && (
                    <div className="mt-4 border-t pt-3">
                      <h4 className="font-medium mb-1">Anotações</h4>
                      <p className="text-sm text-gray-600">{selectedEvent.notes}</p>
                    </div>
                  )}
                </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="danger"
                onClick={handleBackToDayView}
              >
                Voltar
              </Button>
              {selectedEvent.type === 'appointment' && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleStartEdit}
                  >
                    <Icon type="edit" size={16} className="mr-1" />
                    Editar
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Formulário de edição */}
        {selectedEvent && isEditMode && editedEvent && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Horário
                </label>
                <select
                  className={`w-full p-2 border rounded-lg ${editValidationErrors.time ? 'border-red-500' : ''}`}
                  value={editedEvent.time}
                  onChange={(e) => handleEditFieldChange('time', e.target.value)}
                >
                  {selectedDate && getAvailableTimesForEdit(selectedDate, editedEvent.id).map(time => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                {editValidationErrors.time && (
                  <p className="mt-1 text-sm text-red-600">{editValidationErrors.time}</p>
                )}
              </div>
              
              {editedEvent.type === 'appointment' && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={editedEvent.status || 'agendado'}
                    onChange={(e) => handleEditFieldChange('status', e.target.value)}
                  >
                    <option value="agendado">Agendado</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="reagendado">Reagendado</option>
                  </select>
                </div>
              )}
            </div>
            
            {editedEvent.type === 'appointment' && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Nome do Paciente
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={editedEvent.patientName || ''}
                  onChange={(e) => handleEditFieldChange('patientName', e.target.value)}
                  placeholder="Nome do paciente"
                />
              </div>
            )}
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Anotações
              </label>
              <textarea
                className="w-full p-2 border rounded-lg h-24"
                value={editedEvent.notes || ''}
                onChange={(e) => handleEditFieldChange('notes', e.target.value)}
                placeholder="Adicione anotações aqui..."
              />
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="danger"
                onClick={handleCancelEdit}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveEdit}
                disabled={!!editValidationErrors.time}
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal para criar novo agendamento */}
      <Modal
        isOpen={isNewAppointmentModalOpen}
        onClose={() => setIsNewAppointmentModalOpen(false)}
        title={newAppointmentStep === 1 ? "Selecionar Paciente" : "Agendar Consulta"}
        size="medium"
      >
        <div>
          {/* Step 1: Seleção do Paciente */}
          {newAppointmentStep === 1 && (
            <div className="space-y-4">
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full p-3 border rounded-lg pl-10"
                    placeholder="Buscar paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Icon 
                    type="search" 
                    size={18} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  />
                </div>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                {filteredPatients.length > 0 ? (
                  <div className="divide-y">
                    {filteredPatients.map(patient => (
                      <div
                        key={patient.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer flex items-center"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="bg-blue-100 text-blue-800 h-10 w-10 rounded-full flex items-center justify-center mr-3">
                          {patient.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{patient.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Nenhum paciente encontrado.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Seleção de Data e Horário */}
          {newAppointmentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg flex items-center">
                <div className="bg-blue-100 text-blue-800 h-12 w-12 rounded-full flex items-center justify-center mr-3">
                  {newAppointmentData.patientName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm text-blue-600">Paciente selecionado</div>
                  <div className="font-medium">{newAppointmentData.patientName}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Data da Consulta
                  </label>
                  <input
                    type="date"
                    className={`w-full p-2 border rounded-lg ${validationErrors.date ? 'border-red-500' : ''}`}
                    value={newAppointmentData.date}
                    onChange={handleDateChange}
                    min={new Date().toISOString().split('T')[0]} // Impede seleção de datas passadas
                  />
                  {validationErrors.date && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Horário
                  </label>
                  <select
                    className={`w-full p-2 border rounded-lg ${validationErrors.time ? 'border-red-500' : ''}`}
                    value={newAppointmentData.time}
                    onChange={handleTimeChange}
                  >
                    {availableTimesForSelectedDate.length > 0 ? (
                      availableTimesForSelectedDate.map(time => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Sem horários disponíveis</option>
                    )}
                  </select>
                  {validationErrors.time && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.time}</p>
                  )}
                  {availableTimesForSelectedDate.length === 0 && (
                    <p className="mt-1 text-sm text-amber-600">
                      Não há horários disponíveis para esta data. Por favor, selecione outra data.
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Anotações (opcional)
                </label>
                <textarea
                  className="w-full p-2 border rounded-lg h-24"
                  value={newAppointmentData.notes}
                  onChange={(e) => setNewAppointmentData({...newAppointmentData, notes: e.target.value})}
                  placeholder="Adicione anotações sobre a consulta..."
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-2">
            <Button
              variant="danger"
              onClick={() => {
                if (newAppointmentStep === 1) {
                  setIsNewAppointmentModalOpen(false);
                } else {
                  handlePreviousStep();
                }
              }}
            >
              {newAppointmentStep === 1 ? 'Cancelar' : 'Voltar'}
            </Button>
            
            {newAppointmentStep === 2 && (
              <Button
                variant="primary"
                onClick={handleCreateAppointment}
                disabled={!!validationErrors.date || !!validationErrors.time || availableTimesForSelectedDate.length === 0}
              >
                Confirmar Agendamento
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default Appointments;