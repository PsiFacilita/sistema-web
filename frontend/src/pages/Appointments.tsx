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
}

interface DaySchedule {
  date: string; // YYYY-MM-DD
  events: CalendarEvent[];
}

const Appointments: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

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

  // Simulação de dados de agendamento (normalmente viria de uma API)
  useEffect(() => {
    // Simula carregamento de dados
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
            const minute = Math.random() > 0.5 ? '00' : '30';
            const types = ['appointment', 'break', 'unavailable'] as const;
            const type = types[Math.floor(Math.random() * types.length)];
            
            events.push({
              id: `event-${day.getDate()}-${i}`,
              title: type === 'appointment' ? 'Consulta' : type === 'break' ? 'Intervalo' : 'Indisponível',
              time: `${hour}:${minute}`,
              type,
              patientName: type === 'appointment' ? `Paciente ${i+1}` : undefined
            });
          }
          
          mockSchedules.push({
            date: day.toISOString().split('T')[0],
            events: events.sort((a, b) => a.time.localeCompare(b.time))
          });
        }
      }
      
      setDaySchedules(mockSchedules);
    };
    
    loadSchedules();
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
  };
  
  const handleBackToDayView = () => {
    setIsAppointmentModalOpen(false);
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
            onClick={() => console.log("Adicionar novo agendamento")}
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
                            {event.time} - {event.title}
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
                  <div className="text-lg font-medium">{event.time}</div>
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
          <Button 
            variant="primary"
            onClick={() => {
              console.log('Adicionar evento');
            }}
          >
            Adicionar Evento
          </Button>
        </div>
      </Modal>

      {/* Modal para detalhes do agendamento */}
      <Modal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        title="Detalhes do Agendamento"
        size="small"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg`}>
              <h3 className="text-xl font-semibold mb-2">{selectedEvent.title}</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <Icon type="clock" size={18} className="mr-2 opacity-70" />
                  <span className="font-medium">{selectedEvent.time}</span>
                </div>
                
                {selectedEvent.type === 'appointment' && selectedEvent.patientName && (
                  <div className="flex items-center">
                    <Icon type="user" size={18} className="mr-2 opacity-70" />
                    <span>{selectedEvent.patientName}</span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <Icon type="tag" size={18} className="mr-2 opacity-70" />
                  <span className="capitalize">{selectedEvent.type === 'appointment' ? 'Consulta' : 
                    selectedEvent.type === 'break' ? 'Intervalo' : 'Indisponível'}</span>
                </div>
              </div>
            </div>
            
            {/* Detalhes adicionais */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-2">Observações</h4>
              <p className="text-gray-600 italic">
                {selectedEvent.type === 'appointment' 
                  ? 'Consulta regular agendada.'  
                  : selectedEvent.type === 'break' 
                    ? 'Período de intervalo programado.'
                    : 'Horário marcado como indisponível.'}
              </p>
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
                    onClick={() => console.log('Edit appointment:', selectedEvent.id)}
                  >
                    <Icon type="edit" size={16} className="mr-1" />
                    Editar
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
};

export default Appointments;