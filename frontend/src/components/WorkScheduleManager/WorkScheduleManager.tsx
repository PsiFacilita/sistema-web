import React, { useState, useEffect } from 'react';
import Title from '../Title/Title';
import Button from '../Button/Button';
import Input from '../Form/Input/Input';
import Label from '../Form/Label/Label';
import Select from '../Form/Select/Select';
import Modal from '../Modal/Modal';
import { FiClock, FiCalendar, FiPlus, FiEdit2, FiTrash2, FiCopy } from 'react-icons/fi';

// Interface para representar horários de um dia da semana
interface WeekdaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  hasBreak: boolean;
  breakStart: string;
  breakEnd: string;
}

// Interface para exceções (datas específicas)
interface ScheduleException {
  id: string;
  date: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  hasBreak?: boolean;
  breakStart?: string;
  breakEnd?: string;
  reason?: string;
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
  exceptions: ScheduleException[];
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
  // Cria a data usando o construtor com string "YYYY-MM-DD" e ajusta o fuso horário
  // para evitar problemas de exibição (dia anterior)
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
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
  const [copySourceDay, setCopySourceDay] = useState<keyof Omit<WeeklyScheduleConfig, 'exceptions'> | null>(null);
  
  useEffect(() => {
    setConfig(deepCopy(initialConfig));
  }, [initialConfig]);

  // Função para atualizar a configuração de um dia da semana
  const updateWeekdaySchedule = (day: keyof Omit<WeeklyScheduleConfig, 'exceptions'>, field: keyof WeekdaySchedule, value: any) => {
    const updatedConfig = { ...config };
    updatedConfig[day] = { 
      ...updatedConfig[day],
      [field]: value 
    };

    if (field === 'isOpen' && value === false) {
      updatedConfig[day].hasBreak = false;
    }
    
    setConfig(updatedConfig);
    
    if (onSave) {
      onSave(deepCopy(updatedConfig));
    }
  };

  // Função para copiar horário para todos os dias
  const handleCopyToAllDays = (sourceDay: keyof Omit<WeeklyScheduleConfig, 'exceptions'>) => {
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
    setCopySourceDay(null);
  };

  // Função para abrir modal de exceção
  const handleAddException = () => {
    const today = new Date().toISOString().split('T')[0];
    const newException: ScheduleException = {
      id: Date.now().toString(),
      date: today,
      isOpen: false,
      openTime: '08:00',
      closeTime: '17:00',
      hasBreak: false,
      breakStart: '12:00',
      breakEnd: '13:00',
      reason: '',
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

  return (
    <div className="p-1">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-sage-100 rounded-lg p-3">
          <FiClock size={24} className="text-sage-600" />
        </div>
        <Title level={3} className="text-sage-800 mb-0">Horários de Funcionamento</Title>
      </div>
      
      {/* Tabela de horários da semana */}
      <div className="bg-white rounded-xl border border-sage-200 overflow-hidden mb-8">
        <div className="bg-sage-50 px-6 py-4 border-b border-sage-200">
          <h4 className="font-semibold text-sage-800">Horários Semanais</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-sage-50">
                <th className="p-4 text-left font-semibold text-sage-700">Dia da semana</th>
                <th className="p-4 text-center font-semibold text-sage-700">Status</th>
                <th className="p-4 text-center font-semibold text-sage-700">Horário</th>
                <th className="p-4 text-center font-semibold text-sage-700">Intervalo</th>
                <th className="p-4 text-center font-semibold text-sage-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100">
              {weekdayKeys.map((day, index) => (
                <tr key={day} className="hover:bg-sage-50 transition-colors">
                  <td className="p-4">
                    <span className="font-medium text-sage-800">{weekdayNames[index]}</span>
                  </td>
                  <td className="p-4 text-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config[day].isOpen}
                        onChange={(e) => updateWeekdaySchedule(day, 'isOpen', e.target.checked)}
                        className="rounded border-sage-300 text-sage-600 focus:ring-sage-500"
                      />
                      <span className="ml-2 text-sm font-medium">
                        {config[day].isOpen ? (
                          <span className="text-green-600">Aberto</span>
                        ) : (
                          <span className="text-red-600">Fechado</span>
                        )}
                      </span>
                    </label>
                  </td>
                  <td className="p-4">
                    {config[day].isOpen ? (
                      <div className="flex items-center justify-center space-x-3">
                        <Input
                          type="time"
                          value={config[day].openTime}
                          onChange={(e) => updateWeekdaySchedule(day, 'openTime', e.target.value)}
                          disabled={!config[day].isOpen}
                          className="w-28 border-sage-200"
                        />
                        <span className="text-sage-500">às</span>
                        <Input
                          type="time"
                          value={config[day].closeTime}
                          onChange={(e) => updateWeekdaySchedule(day, 'closeTime', e.target.value)}
                          disabled={!config[day].isOpen}
                          className="w-28 border-sage-200"
                        />
                      </div>
                    ) : (
                      <span className="text-sage-400 text-sm">Não disponível</span>
                    )}
                  </td>
                  <td className="p-4">
                    {config[day].isOpen ? (
                      <div className="space-y-2">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config[day].hasBreak}
                            onChange={(e) => updateWeekdaySchedule(day, 'hasBreak', e.target.checked)}
                            disabled={!config[day].isOpen}
                            className="rounded border-sage-300 text-sage-600 focus:ring-sage-500"
                          />
                          <span className="ml-2 text-sm">Possui intervalo</span>
                        </label>
                        {config[day].hasBreak && (
                          <div className="flex items-center justify-center space-x-3">
                            <Input
                              type="time"
                              value={config[day].breakStart}
                              onChange={(e) => updateWeekdaySchedule(day, 'breakStart', e.target.value)}
                              disabled={!config[day].isOpen || !config[day].hasBreak}
                              className="w-28 border-sage-200"
                            />
                            <span className="text-sage-500">às</span>
                            <Input
                              type="time"
                              value={config[day].breakEnd}
                              onChange={(e) => updateWeekdaySchedule(day, 'breakEnd', e.target.value)}
                              disabled={!config[day].isOpen || !config[day].hasBreak}
                              className="w-28 border-sage-200"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sage-400 text-sm">Não disponível</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setCopySourceDay(copySourceDay === day ? null : day)}
                      className="flex items-center gap-1 text-sage-600 hover:text-sage-700 text-sm"
                    >
                      <FiCopy size={14} />
                      <span>Copiar</span>
                    </button>
                    {copySourceDay === day && (
                      <div className="mt-2 p-2 bg-sage-100 rounded-lg">
                        <p className="text-xs text-sage-600 mb-2">Copiar para:</p>
                        <div className="flex flex-wrap gap-1">
                          {weekdayKeys.filter(d => d !== day).map(otherDay => (
                            <button
                              key={otherDay}
                              onClick={() => handleCopyToAllDays(day)}
                              className="px-2 py-1 bg-sage-600 text-white text-xs rounded hover:bg-sage-700"
                            >
                              {weekdayNames[weekdayKeys.indexOf(otherDay)].substring(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seção de exceções */}
      <div className="bg-white rounded-xl border border-sage-200 overflow-hidden">
        <div className="bg-sage-50 px-6 py-4 border-b border-sage-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FiCalendar size={20} className="text-sage-600" />
            <h4 className="font-semibold text-sage-800">Exceções e Datas Especiais</h4>
          </div>
          <Button 
            variant="primary" 
            onClick={handleAddException}
            icon={<FiPlus size={16} />}
            className="bg-sage-600 hover:bg-sage-700 border-sage-600"
          >
            Adicionar Exceção
          </Button>
        </div>

        <div className="p-6">
          {config.exceptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {config.exceptions.map((exception) => (
                <div key={exception.id} className="border border-sage-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className="font-medium text-sage-800">{formatDateWithWeekday(exception.date)}</h5>
                      {exception.reason && (
                        <p className="text-xs text-sage-500 mt-1 italic">{exception.reason}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditException(exception.id)}
                        className="text-sage-600 hover:text-sage-700 p-1 rounded"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleConfirmDeleteException(exception.id)}
                        className="text-red-600 hover:text-red-700 p-1 rounded"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    {exception.isOpen ? (
                      <>
                        <p className="text-green-600 text-sm">
                          <span className="font-medium">Aberto:</span> {exception.openTime} às {exception.closeTime}
                        </p>
                        {exception.hasBreak && (
                          <p className="text-orange-500 text-sm mt-1">
                            <span className="font-medium">Intervalo:</span> {exception.breakStart} às {exception.breakEnd}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-red-600 font-medium text-sm">Fechado</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sage-600">
              <FiCalendar size={48} className="mx-auto mb-4 text-sage-300" />
              <p>Nenhuma exceção cadastrada.</p>
              <p className="text-sm text-sage-500 mt-1">Clique em "Adicionar Exceção" para criar uma.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal para adicionar/editar exceção */}
      <Modal
        isOpen={isExceptionModalOpen}
        onClose={() => setIsExceptionModalOpen(false)}
        title={currentException?.id ? "Editar Exceção" : "Adicionar Exceção"}
        size="medium"
      >
        {currentException && (
          <div className="space-y-6 mt-4">
            <div className="bg-sage-50 rounded-xl p-4">
              <h3 className="flex items-center gap-2 text-sage-700 font-semibold mb-4">
                <FiCalendar size={18} />
                Configuração da Exceção
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="exception-date">
                    Data da Exceção
                  </Label>
                  <Input
                    id="exception-date"
                    type="date"
                    value={currentException.date}
                    onChange={(e) => updateExceptionField('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="border-sage-200 focus:border-sage-400"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="exception-reason">
                    Motivo (Opcional)
                  </Label>
                  <Input
                    id="exception-reason"
                    type="text"
                    value={currentException.reason || ''}
                    onChange={(e) => updateExceptionField('reason', e.target.value)}
                    placeholder="Ex: Feriado, Consulta Médica, etc."
                    className="border-sage-200 focus:border-sage-400"
                  />
                </div>
                
                <div className="flex items-center p-3 bg-white rounded-lg border border-sage-200">
                  <input
                    type="checkbox"
                    checked={currentException.isOpen}
                    onChange={(e) => updateExceptionField('isOpen', e.target.checked)}
                    className="rounded border-sage-300 text-sage-600 focus:ring-sage-500"
                  />
                  <span className="ml-3 text-sm font-medium text-sage-700">
                    Estabelecimento aberto nesta data
                  </span>
                </div>
                
                {currentException.isOpen && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="exception-open">
                          Horário de Abertura
                        </Label>
                        <Input
                          id="exception-open"
                          type="time"
                          value={currentException.openTime}
                          onChange={(e) => updateExceptionField('openTime', e.target.value)}
                          className="border-sage-200 focus:border-sage-400"
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="exception-close">
                          Horário de Fechamento
                        </Label>
                        <Input
                          id="exception-close"
                          type="time"
                          value={currentException.closeTime}
                          onChange={(e) => updateExceptionField('closeTime', e.target.value)}
                          className="border-sage-200 focus:border-sage-400"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-white rounded-lg border border-sage-200">
                      <input
                        type="checkbox"
                        checked={currentException.hasBreak || false}
                        onChange={(e) => updateExceptionField('hasBreak', e.target.checked)}
                        className="rounded border-sage-300 text-sage-600 focus:ring-sage-500"
                      />
                      <span className="ml-3 text-sm font-medium text-sage-700">Possui intervalo</span>
                    </div>
                    
                    {currentException.hasBreak && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="exception-break-start">
                            Início do Intervalo
                          </Label>
                          <Input
                            id="exception-break-start"
                            type="time"
                            value={currentException.breakStart}
                            onChange={(e) => updateExceptionField('breakStart', e.target.value)}
                            className="border-sage-200 focus:border-sage-400"
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-medium text-sage-700 mb-2" htmlFor="exception-break-end">
                            Fim do Intervalo
                          </Label>
                          <Input
                            id="exception-break-end"
                            type="time"
                            value={currentException.breakEnd}
                            onChange={(e) => updateExceptionField('breakEnd', e.target.value)}
                            className="border-sage-200 focus:border-sage-400"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t border-sage-100">
              <Button 
                variant="outline"
                onClick={() => setIsExceptionModalOpen(false)}
                className="border-sage-300 text-sage-700 hover:bg-sage-50"
              >
                Cancelar
              </Button>
              <Button 
                variant="primary"
                onClick={handleSaveException}
                className="bg-sage-600 hover:bg-sage-700 border-sage-600"
              >
                Salvar Exceção
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
        <div className="text-center py-4">
          <FiTrash2 size={48} className="mx-auto mb-4 text-red-400" />
          <p className="text-sage-700 mb-6">Tem certeza que deseja excluir esta exceção?</p>
          <div className="flex justify-end space-x-2 pt-4 border-t border-sage-100">
            <Button 
              variant="outline"
              onClick={() => setIsConfirmDeleteModalOpen(false)}
              className="border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              Cancelar
            </Button>
            <Button 
              variant="primary"
              onClick={handleDeleteException}
              className="bg-red-600 hover:bg-red-700 border-red-600"
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