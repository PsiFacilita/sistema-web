import React, { useState, useEffect } from 'react';
import Title from '../Title/Title';
import Button from '../Button';
import Input from '../Form/Input';
import Label from '../Form/Label';
import Select from '../Form/Select';
import Modal from '../Modal/Modal';

// Interface para representar horários de um dia da semana
interface WeekdaySchedule {
  isOpen: boolean;  // Se está aberto neste dia
  openTime: string; // Horário de abertura (formato HH:MM)
  closeTime: string; // Horário de fechamento (formato HH:MM)
  hasBreak: boolean; // Se possui intervalo
  breakStart: string; // Início do intervalo (formato HH:MM)
  breakEnd: string; // Fim do intervalo (formato HH:MM)
}

// Interface para exceções (datas específicas)
interface ScheduleException {
  id: string; // ID único para a exceção
  date: string; // Formato YYYY-MM-DD
  isOpen: boolean; // false = fechado neste dia
  openTime?: string; // Opcional, só usado se isOpen=true
  closeTime?: string; // Opcional, só usado se isOpen=true
  hasBreak?: boolean; // Opcional, só usado se isOpen=true
  breakStart?: string; // Opcional, só usado se isOpen=true
  breakEnd?: string; // Opcional, só usado se isOpen=true
}

// Interface principal para configuração de horários
interface WeeklyScheduleConfig {
  monday: WeekdaySchedule;
  tuesday: WeekdaySchedule;
  wednesday: WeekdaySchedule;
  thursday: WeekdaySchedule;
  friday: WeekdaySchedule;
  saturday: WeekdaySchedule;
  sunday: WeekdaySchedule;
  exceptions: ScheduleException[]; // Datas específicas que diferem do padrão
}

interface WorkScheduleManagerProps {
  initialConfig?: WeeklyScheduleConfig;
  onSave?: (config: WeeklyScheduleConfig) => void;
}

// Array com os nomes dos dias da semana em português
const weekdayNames = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 
  'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
];

// Objeto com chaves para cada dia da semana
const weekdayKeys = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
] as const;

// Função para criar uma configuração padrão
const createDefaultSchedule = (): WeekdaySchedule => ({
  isOpen: true,
  openTime: '08:00',
  closeTime: '17:00',
  hasBreak: true,
  breakStart: '12:00',
  breakEnd: '13:00',
});

// Função para criar configuração semanal padrão
const createDefaultWeeklySchedule = (): WeeklyScheduleConfig => ({
  monday: createDefaultSchedule(),
  tuesday: createDefaultSchedule(),
  wednesday: createDefaultSchedule(),
  thursday: createDefaultSchedule(),
  friday: createDefaultSchedule(),
  saturday: { ...createDefaultSchedule(), isOpen: false },
  sunday: { ...createDefaultSchedule(), isOpen: false },
  exceptions: [],
});

// Função para formatar a data mostrando o dia da semana
const formatDateWithWeekday = (dateString: string): string => {
  const date = new Date(dateString);
  const weekday = weekdayNames[date.getDay()];
  return `${weekday}, ${date.toLocaleDateString('pt-BR')}`;
};

// Função utilitária para clonar objetos
const deepCopy = <T,>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

const WorkScheduleManager: React.FC<WorkScheduleManagerProps> = ({
  initialConfig = createDefaultWeeklySchedule(),
  onSave
}) => {
  const [config, setConfig] = useState<WeeklyScheduleConfig>(initialConfig);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [currentException, setCurrentException] = useState<ScheduleException | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [exceptionToDelete, setExceptionToDelete] = useState<string | null>(null);
  
  useEffect(() => {
    // Inicializar com a configuração fornecida ou padrão
    setConfig(deepCopy(initialConfig));
  }, [initialConfig]);

  // Função para atualizar a configuração de um dia da semana
  const updateWeekdaySchedule = (day: keyof Omit<WeeklyScheduleConfig, 'exceptions'>, field: keyof WeekdaySchedule, value: any) => {
    const updatedConfig = { ...config };
    updatedConfig[day] = { 
      ...updatedConfig[day],
      [field]: value 
    };

    // Se o dia for marcado como fechado, desabilitar o intervalo
    if (field === 'isOpen' && value === false) {
      updatedConfig[day].hasBreak = false;
    }
    
    setConfig(updatedConfig);
    
    if (onSave) {
      onSave(deepCopy(updatedConfig));
    }
  };

  // Função para abrir modal de exceção
  const handleAddException = () => {
    // Criar uma nova exceção com valores padrão
    const today = new Date().toISOString().split('T')[0];
    const newException: ScheduleException = {
      id: Date.now().toString(),
      date: today,
      isOpen: false, // Por padrão, uma exceção é para marcar dia fechado
      openTime: '08:00',
      closeTime: '17:00',
      hasBreak: false,
      breakStart: '12:00',
      breakEnd: '13:00',
    };
    
    setCurrentException(newException);
    setIsExceptionModalOpen(true);
  };

  // Função para editar uma exceção existente
  const handleEditException = (exceptionId: string) => {
    const exception = config.exceptions.find(e => e.id === exceptionId);
    if (exception) {
      setCurrentException(deepCopy(exception));
      setIsExceptionModalOpen(true);
    }
  };

  // Função para confirmar exclusão de exceção
  const handleConfirmDeleteException = (exceptionId: string) => {
    setExceptionToDelete(exceptionId);
    setIsConfirmDeleteModalOpen(true);
  };

  // Função para deletar exceção
  const handleDeleteException = () => {
    if (!exceptionToDelete) return;
    
    const updatedExceptions = config.exceptions.filter(
      exception => exception.id !== exceptionToDelete
    );
    
    const updatedConfig = { 
      ...config,
      exceptions: updatedExceptions
    };
    
    setConfig(updatedConfig);
    
    if (onSave) {
      onSave(deepCopy(updatedConfig));
    }
    
    setIsConfirmDeleteModalOpen(false);
    setExceptionToDelete(null);
  };

  // Função para atualizar um campo da exceção atual
  const updateExceptionField = (field: keyof ScheduleException, value: any) => {
    if (!currentException) return;
    
    setCurrentException({
      ...currentException,
      [field]: value
    });
    
    // Se marcar como fechado, desabilitar configurações de horário
    if (field === 'isOpen' && value === false) {
      setCurrentException(prev => ({
        ...prev!,
        hasBreak: false
      }));
    }
  };

  // Função para salvar a exceção atual
  const handleSaveException = () => {
    if (!currentException) return;
    
    const updatedExceptions = config.exceptions.filter(
      exception => exception.id !== currentException.id
    );
    
    const updatedConfig = {
      ...config,
      exceptions: [...updatedExceptions, currentException]
    };
    
    setConfig(updatedConfig);
    
    if (onSave) {
      onSave(deepCopy(updatedConfig));
    }
    
    setIsExceptionModalOpen(false);
    setCurrentException(null);
  };

  // Função para copiar horário para todos os dias da semana
  const copyScheduleToAllDays = (sourceDay: keyof Omit<WeeklyScheduleConfig, 'exceptions'>) => {
    const sourceSchedule = config[sourceDay];
    const updatedConfig = { ...config };
    
    weekdayKeys.forEach(day => {
      if (day !== sourceDay) {
        updatedConfig[day] = deepCopy(sourceSchedule);
      }
    });
    
    setConfig(updatedConfig);
    
    if (onSave) {
      onSave(deepCopy(updatedConfig));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-6">
      <Title level={3}>Horários de Funcionamento</Title>
      
      {/* Tabela de horários da semana */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-3 text-left">Dia da semana</th>
              <th className="border p-3 text-center">Status</th>
              <th className="border p-3 text-center">Horário</th>
              <th className="border p-3 text-center">Intervalo</th>
            </tr>
          </thead>
          <tbody>
            {weekdayKeys.map((day, index) => (
              <tr key={day} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="border p-4">
                  <span className="font-medium">{weekdayNames[index]}</span>
                </td>
                <td className="border p-4 text-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config[day].isOpen}
                      onChange={(e) => updateWeekdaySchedule(day, 'isOpen', e.target.checked)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="ml-2">
                      {config[day].isOpen ? 'Aberto' : 'Fechado'}
                    </span>
                  </label>
                </td>
                <td className="border p-4">
                  {config[day].isOpen ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Input
                        type="time"
                        value={config[day].openTime}
                        onChange={(e) => updateWeekdaySchedule(day, 'openTime', e.target.value)}
                        disabled={!config[day].isOpen}
                        className="w-24"
                      />
                      <span>às</span>
                      <Input
                        type="time"
                        value={config[day].closeTime}
                        onChange={(e) => updateWeekdaySchedule(day, 'closeTime', e.target.value)}
                        disabled={!config[day].isOpen}
                        className="w-24"
                      />
                    </div>
                  ) : (
                    <span className="text-gray-500">Não disponível</span>
                  )}
                </td>
                <td className="border p-4">
                  {config[day].isOpen ? (
                    <>
                      <label className="inline-flex items-center cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          checked={config[day].hasBreak}
                          onChange={(e) => updateWeekdaySchedule(day, 'hasBreak', e.target.checked)}
                          disabled={!config[day].isOpen}
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span className="ml-2">Possui intervalo</span>
                      </label>
                      {config[day].hasBreak && (
                        <div className="flex items-center justify-center space-x-2 mt-2">
                          <Input
                            type="time"
                            value={config[day].breakStart}
                            onChange={(e) => updateWeekdaySchedule(day, 'breakStart', e.target.value)}
                            disabled={!config[day].isOpen || !config[day].hasBreak}
                            className="w-24"
                          />
                          <span>às</span>
                          <Input
                            type="time"
                            value={config[day].breakEnd}
                            onChange={(e) => updateWeekdaySchedule(day, 'breakEnd', e.target.value)}
                            disabled={!config[day].isOpen || !config[day].hasBreak}
                            className="w-24"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500">Não disponível</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Seção de exceções */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-lg">Exceções e Datas Especiais</h4>
          <Button variant="secondary" onClick={handleAddException}>
            Adicionar Exceção
          </Button>
        </div>

        {config.exceptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.exceptions.map((exception) => (
              <div key={exception.id} className="border rounded-lg p-4 relative">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-medium">{formatDateWithWeekday(exception.date)}</h5>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => handleEditException(exception.id)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleConfirmDeleteException(exception.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  {exception.isOpen ? (
                    <>
                      <p className="text-green-600">
                        <span className="font-medium">Aberto:</span> {exception.openTime} às {exception.closeTime}
                      </p>
                      {exception.hasBreak && (
                        <p className="text-orange-500">
                          <span className="font-medium">Intervalo:</span> {exception.breakStart} às {exception.breakEnd}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-red-600 font-medium">Fechado</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 border rounded-lg">
            Nenhuma exceção cadastrada. Clique em "Adicionar Exceção" para criar uma.
          </div>
        )}
      </div>
      
      {/* Modal para adicionar/editar exceção */}
      <Modal
        isOpen={isExceptionModalOpen}
        onClose={() => setIsExceptionModalOpen(false)}
        title={currentException?.id ? "Editar Exceção" : "Adicionar Exceção"}
        size="medium"
      >
        {currentException && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="exception-date">Data da Exceção</Label>
              <Input
                id="exception-date"
                type="date"
                value={currentException.date}
                onChange={(e) => updateExceptionField('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentException.isOpen}
                  onChange={(e) => updateExceptionField('isOpen', e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2">Estabelecimento aberto nesta data</span>
              </label>
            </div>
            
            {currentException.isOpen && (
              <>
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="exception-open">Horário de Abertura</Label>
                    <Input
                      id="exception-open"
                      type="time"
                      value={currentException.openTime}
                      onChange={(e) => updateExceptionField('openTime', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="exception-close">Horário de Fechamento</Label>
                    <Input
                      id="exception-close"
                      type="time"
                      value={currentException.closeTime}
                      onChange={(e) => updateExceptionField('closeTime', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentException.hasBreak || false}
                      onChange={(e) => updateExceptionField('hasBreak', e.target.checked)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="ml-2">Possui intervalo</span>
                  </label>
                </div>
                
                {currentException.hasBreak && (
                  <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <div className="flex-1">
                      <Label htmlFor="exception-break-start">Início do Intervalo</Label>
                      <Input
                        id="exception-break-start"
                        type="time"
                        value={currentException.breakStart}
                        onChange={(e) => updateExceptionField('breakStart', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="exception-break-end">Fim do Intervalo</Label>
                      <Input
                        id="exception-break-end"
                        type="time"
                        value={currentException.breakEnd}
                        onChange={(e) => updateExceptionField('breakEnd', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div className="mt-6 flex justify-end space-x-2">
              <Button 
                variant="secondary"
                onClick={() => setIsExceptionModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="primary"
                onClick={handleSaveException}
              >
                Salvar
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Modal de confirmação de exclusão */}
      <Modal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => setIsConfirmDeleteModalOpen(false)}
        title="Confirmar Exclusão"
        size="small"
      >
        <div>
          <p className="mb-6">Tem certeza que deseja excluir esta exceção?</p>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="secondary"
              onClick={() => setIsConfirmDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="danger"
              onClick={handleDeleteException}
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkScheduleManager;
export { createDefaultWeeklySchedule };
export type { WeeklyScheduleConfig };
