import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../components/layout/MainLayout/MainLayout';
import Title from '../components/Title/Title';
import Card from '../components/Card/Card';
import Button from '../components/Button/Button';
import Modal from '../components/Modal/Modal';
import Input from '../components/Form/Input/Input';
import { FiChevronLeft, FiChevronRight, FiSearch, FiUser, FiCalendar, FiClock } from 'react-icons/fi';

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
    date: string;
    events: CalendarEvent[];
}

interface Patient {
    id: number;
    nome: string;
    email?: string | null;
    telefone?: string | null;
    ativo?: boolean | number;
}

const API_URL =
    (import.meta as any).env?.VITE_BACKEND_URL ||
    (import.meta as any).env?.BACKEND_URL ||
    'http://localhost:5000';

const SLOT_MINUTES = 60;

const ymdLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};
const parseYmdLocal = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
};
const formatYmdBr = (s: string) => {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
};

const Appointments: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedEvent, setEditedEvent] = useState<CalendarEvent | null>(null);
    const [editValidationErrors, setEditValidationErrors] = useState<{ time?: string; status?: string }>({});
    const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
    const [newAppointmentStep, setNewAppointmentStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [newAppointmentData, setNewAppointmentData] = useState({
        patientId: '',
        patientName: '',
        date: ymdLocal(new Date()),
        time: '08:00',
        notes: '',
        type: 'appointment' as CalendarEvent['type'],
    });
    const [validationErrors, setValidationErrors] = useState<{ date?: string; time?: string }>({});
    const [patients, setPatients] = useState<Patient[]>([]);
    const [patientsLoading, setPatientsLoading] = useState(false);
    const [patientsError, setPatientsError] = useState<string>('');
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilityError, setAvailabilityError] = useState<string>('');
    const [availabilityByDate, setAvailabilityByDate] = useState<Record<string, string[]>>({});

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth.token') : null;

    const getStatusBadgeClass = (status?: string) => {
        switch (status) {
            case 'confirmado':
                return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'agendado':
                return 'bg-purple-100 text-purple-800 border border-purple-200';
            case 'cancelado':
                return 'bg-red-100 text-red-800 border border-red-200';
            case 'reagendado':
                return 'bg-gray-100 text-gray-800 border border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    const isDateInPast = (dateStr: string): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayLocal = parseYmdLocal(ymdLocal(today));
        const d = parseYmdLocal(dateStr);
        return d < todayLocal;
    };

    const isTimeInPast = (dateStr: string, timeStr: string): boolean => {
        const now = new Date();
        const d = parseYmdLocal(dateStr);
        if (ymdLocal(d) === ymdLocal(now)) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours || 0, minutes || 0, 0, 0);
            return dt < now;
        }
        return false;
    };

    const getDaysInMonth = (year: number, month: number) => {
        const date = new Date(year, month, 1);
        const days: (Date | null)[] = [];
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentMonth(newDate);
    };

    const monthName = currentMonth.toLocaleString('pt-BR', { month: 'long' });
    const year = currentMonth.getFullYear();
    const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());

    const fetchPatients = async () => {
        setPatientsLoading(true);
        setPatientsError('');
        try {
            const q = new URLSearchParams();
            q.set('page', '1');
            q.set('per_page', '1000');
            const res = await fetch(`${API_URL}/api/patients?${q.toString()}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.ok === false) {
                throw new Error(data?.message || 'Falha ao carregar pacientes');
            }
            const list: Patient[] = (data?.patients || data?.items || data || []).map((p: any) => ({
                id: Number(p.id),
                nome: String(p.nome ?? p.name ?? ''),
                email: p.email ?? null,
                telefone: p.telefone ?? null,
                ativo: typeof p.ativo === 'number' || typeof p.ativo === 'boolean' ? p.ativo : undefined,
            }));
            setPatients(list);
        } catch (e: any) {
            setPatientsError(e?.message || 'Erro ao carregar pacientes');
        } finally {
            setPatientsLoading(false);
        }
    };

    const monthRange = (dt: Date) => {
        const start = new Date(dt.getFullYear(), dt.getMonth() - 1, 1);
        const end = new Date(dt.getFullYear(), dt.getMonth() + 2, 0);
        const from = `${ymdLocal(start)} 00:00:00`;
        const to = `${ymdLocal(end)} 23:59:59`;
        return { from, to };
    };

    const fetchAppointments = async (from: string, to: string) => {
        setAvailabilityLoading(true);
        setAvailabilityError('');
        try {
            const q = new URLSearchParams();
            q.set('from', from);
            q.set('to', to);
            const res = await fetch(`${API_URL}/api/appointments?${q.toString()}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.ok === false) {
                throw new Error(data?.message || 'Falha ao carregar agendamentos');
            }
            const items: Array<any> = data?.items || data?.appointments || data || [];
            const grouped: Record<string, CalendarEvent[]> = {};
            items.forEach((it) => {
                const start: string = String(it.horario_inicio || '');
                const dateYmd = start.split(' ')[0];
                const time = (start.split(' ')[1] || '').slice(0, 5);
                const ev: CalendarEvent = {
                    id: String(it.id),
                    title: String(it.paciente_nome || 'Agendamento'),
                    time,
                    type: 'appointment',
                    patientName: String(it.paciente_nome || ''),
                    status: it.status as CalendarEvent['status'],
                    notes: it.notes || it.observacoes || undefined,
                };
                if (!grouped[dateYmd]) grouped[dateYmd] = [];
                grouped[dateYmd].push(ev);
            });
            Object.values(grouped).forEach((arr) =>
                arr.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0)),
            );
            const schedules: DaySchedule[] = Object.entries(grouped).map(([date, events]) => ({ date, events }));
            setDaySchedules(schedules);
        } catch (e: any) {
            setAvailabilityError(e?.message || 'Erro ao carregar agendamentos');
            setDaySchedules([]);
        } finally {
            setAvailabilityLoading(false);
        }
    };

    const fetchAvailability = async (from: string, to: string) => {
        setAvailabilityLoading(true);
        try {
            const q = new URLSearchParams();
            q.set('from', from);
            q.set('to', to);
            q.set('slot_minutes', String(SLOT_MINUTES));
            const res = await fetch(`${API_URL}/api/appointments/availability?${q.toString()}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.ok === false) {
                throw new Error(data?.message || 'Falha ao carregar disponibilidade');
            }
            const grouped: Record<string, string[]> = {};
            if (Array.isArray(data?.availability) && data.availability.length > 0 && data.availability[0]?.slots !== undefined) {
                data.availability.forEach((day: any) => {
                    const dateYmd = String(day?.date || '').slice(0, 10);
                    if (!dateYmd) return;
                    const rawSlots = Array.isArray(day.slots) ? day.slots : [];
                    const times = rawSlots
                        .map((s: any) => {
                            let dtStr = '';
                            if (typeof s === 'string') dtStr = s;
                            else if (s && typeof s === 'object') dtStr = s.inicio || s.start || s.slot || '';
                            if (!dtStr) return null;
                            const hm = dtStr.includes(' ') ? dtStr.split(' ')[1]?.slice(0, 5) : String(dtStr).slice(11, 16);
                            return hm || null;
                        })
                        .filter(Boolean) as string[];
                    if (!grouped[dateYmd]) grouped[dateYmd] = [];
                    grouped[dateYmd].push(...times);
                });
            } else {
                const items: Array<any> = data?.items || data?.availability || [];
                items.forEach((it) => {
                    const start: string = String(it.horario_inicio || it.start || it.slot || '');
                    if (!start.includes(' ')) return;
                    const dateYmd = start.split(' ')[0];
                    const timeHm = (start.split(' ')[1] || '').slice(0, 5);
                    if (!grouped[dateYmd]) grouped[dateYmd] = [];
                    grouped[dateYmd].push(timeHm);
                });
            }
            const next: Record<string, string[]> = { ...availabilityByDate };
            Object.keys(grouped).forEach((date) => {
                const merged = Array.from(new Set([...(next[date] || []), ...grouped[date]]));
                merged.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
                next[date] = merged;
            });
            setAvailabilityByDate(next);
        } catch (e: any) {
            setAvailabilityError(e?.message || 'Erro ao carregar disponibilidade');
        } finally {
            setAvailabilityLoading(false);
        }
    };

    useEffect(() => {
        const { from, to } = monthRange(currentMonth);
        fetchAppointments(from, to);
        fetchAvailability(from, to);
    }, [currentMonth]);

    useEffect(() => {
        const times = availabilityByDate[newAppointmentData.date] || [];
        setNewAppointmentData((prev) => {
            if (times.length === 0 && prev.time !== '') {
                return { ...prev, time: '' };
            }
            if (times.length > 0 && !times.includes(prev.time)) {
                return { ...prev, time: times[0] };
            }
            return prev;
        });
    }, [availabilityByDate, newAppointmentData.date]);

    const getAvailableTimesForDate = (date: string): string[] => {
        return availabilityByDate[date] || [];
    };

    const handleOpenNewAppointmentModal = (date?: string) => {
        setNewAppointmentStep(1);
        setSearchTerm('');
        setValidationErrors({});
        const base = date ? parseYmdLocal(date) : new Date();
        const todayStr = ymdLocal(new Date());
        const validDate = base < parseYmdLocal(todayStr) ? todayStr : (date || selectedDate || todayStr);
        setNewAppointmentData((prev) => ({ ...prev, date: validDate }));
        setIsNewAppointmentModalOpen(true);
        if (patients.length === 0) fetchPatients();
        const from = `${validDate} 00:00:00`;
        const to = `${validDate} 23:59:59`;
        fetchAvailability(from, to);
    };

    const handlePatientSelect = (patient: Patient) => {
        setNewAppointmentData({
            ...newAppointmentData,
            patientId: String(patient.id),
            patientName: patient.nome,
        });
        setNewAppointmentStep(2);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setValidationErrors((prev) => ({ ...prev, date: undefined }));
        if (isDateInPast(newDate)) {
            setValidationErrors((prev) => ({ ...prev, date: 'Não é possível agendar para datas passadas' }));
        }
        setNewAppointmentData((prev) => ({ ...prev, date: newDate }));
        const from = `${newDate} 00:00:00`;
        const to = `${newDate} 23:59:59`;
        fetchAvailability(from, to);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTime = e.target.value;
        setValidationErrors((prev) => ({ ...prev, time: undefined }));
        if (isTimeInPast(newAppointmentData.date, newTime)) {
            setValidationErrors((prev) => ({ ...prev, time: 'Não é possível agendar para horários que já passaram' }));
        }
        setNewAppointmentData((prev) => ({ ...prev, time: newTime }));
    };

    const handleNextStep = () => {
        if (newAppointmentStep < 2) setNewAppointmentStep(newAppointmentStep + 1);
    };

    const handlePreviousStep = () => {
        if (newAppointmentStep > 1) setNewAppointmentStep(newAppointmentStep - 1);
    };

    const handleCreateAppointment = async () => {
        const dateError = isDateInPast(newAppointmentData.date) ? 'Não é possível agendar para datas passadas' : undefined;
        const timeError = isTimeInPast(newAppointmentData.date, newAppointmentData.time)
            ? 'Não é possível agendar para horários que já passaram'
            : undefined;
        if (dateError || timeError) {
            setValidationErrors({ date: dateError, time: timeError });
            return;
        }
        if (!newAppointmentData.patientId) return;
        const [h, m] = newAppointmentData.time.split(':').map(Number);
        const startDate = parseYmdLocal(newAppointmentData.date);
        const startDt = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), h || 0, m || 0, 0, 0);
        const endDt = new Date(startDt);
        endDt.setMinutes(endDt.getMinutes() + SLOT_MINUTES);
        const start = `${ymdLocal(startDt)} ${String(startDt.getHours()).padStart(2, '0')}:${String(startDt.getMinutes()).padStart(2, '0')}:00`;
        const end = `${ymdLocal(endDt)} ${String(endDt.getHours()).padStart(2, '0')}:${String(endDt.getMinutes()).padStart(2, '0')}:00`;
        try {
            const res = await fetch(`${API_URL}/api/appointments`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    paciente_id: Number(newAppointmentData.patientId),
                    horario_inicio: start,
                    horario_fim: end,
                    status: 'agendado',
                    notes: newAppointmentData.notes || undefined,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.ok === false) {
                throw new Error(data?.message || 'Falha ao criar agendamento');
            }
            setIsNewAppointmentModalOpen(false);
            setNewAppointmentStep(1);
            setValidationErrors({});
            const { from, to } = monthRange(currentMonth);
            fetchAppointments(from, to);
            fetchAvailability(from, to);
        } catch (e: any) {
            setValidationErrors((prev) => ({ ...prev, time: e?.message || 'Erro ao criar agendamento' }));
        }
    };

    const getEventTypeClass = (type: CalendarEvent['type']) => {
        switch (type) {
            case 'appointment':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'break':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'unavailable':
                return 'bg-red-100 text-red-800 border border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    const getDayEvents = (day: Date | null) => {
        if (!day) return [];
        const dateString = ymdLocal(day);
        const daySchedule = daySchedules.find((schedule) => schedule.date === dateString);
        return daySchedule?.events || [];
    };

    const getBadgeClass = (title: string) => {
        if (title.includes('Consulta') || title.includes('Disponível')) return 'bg-green-100 text-green-800 border border-green-200';
        if (title.includes('Indisponível')) return 'bg-red-100 text-red-800 border border-red-200';
        if (title.includes('Intervalo')) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        return 'bg-gray-200 text-gray-800 border border-gray-200';
    };

    const filteredPatients = useMemo(() => {
        const s = searchTerm.trim().toLowerCase();
        if (!s) return patients;
        return patients.filter((p) => [p.nome, p.email, p.telefone].filter(Boolean).some((v) => String(v).toLowerCase().includes(s)));
    }, [patients, searchTerm]);

    const availableTimesForSelectedDate = getAvailableTimesForDate(newAppointmentData.date);

    const handleDayClick = (day: Date) => {
        if (!day) return;
        const dateString = ymdLocal(day);
        setSelectedDate(dateString);
        const daySchedule = daySchedules.find((schedule) => schedule.date === dateString);
        setSelectedDayEvents(daySchedule?.events || []);
        setIsModalOpen(true);
    };

    const handleAppointmentClick = (event: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedEvent(event);
        setIsAppointmentModalOpen(true);
        setIsEditMode(false);
        setEditedEvent(null);
        setEditValidationErrors({});
    };

    const handleBackToDayView = () => {
        setIsAppointmentModalOpen(false);
        setIsEditMode(false);
        setEditedEvent(null);
    };

    const handleStartEdit = () => {
        if (!selectedEvent) return;
        setEditedEvent({ ...selectedEvent });
        setIsEditMode(true);
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setEditedEvent(null);
        setEditValidationErrors({});
    };

    const handleEditFieldChange = (field: keyof CalendarEvent, value: string) => {
        if (!editedEvent) return;
        if (field === 'time') setEditValidationErrors((prev) => ({ ...prev, time: undefined }));
        const updatedEvent = { ...editedEvent, [field]: value };
        setEditedEvent(updatedEvent);
        if (field === 'time' && selectedDate) {
            if (isTimeInPast(selectedDate, value)) {
                setEditValidationErrors((prev) => ({ ...prev, time: 'Não é possível agendar para horários que já passaram' }));
            }
        }
    };

    const handleSaveEdit = () => {
        if (!editedEvent || !selectedDate) return;
        if (editValidationErrors.time) return;
        setIsEditMode(false);
        setEditedEvent(null);
    };

    return (
        <MainLayout>
            <div className="mb-8">
                <Title level={1} className="text-sage-700">
                    Agenda
                </Title>
            </div>

            <Card variant="elevated" className="mb-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setCurrentMonth(new Date())} className="border-sage-300 text-sage-700 hover:bg-sage-50">
                                Hoje
                            </Button>
                            <div className="flex border border-sage-200 rounded-lg">
                                <Button variant="outline" onClick={() => changeMonth(-1)} className="border-0 rounded-r-none hover:bg-sage-50">
                                    <FiChevronLeft size={16} />
                                </Button>
                                <Button variant="outline" onClick={() => changeMonth(1)} className="border-0 border-l border-sage-200 rounded-l-none hover:bg-sage-50">
                                    <FiChevronRight size={16} />
                                </Button>
                            </div>
                        </div>
                        <h2 className="text-xl font-medium capitalize text-sage-800">
                            {monthName} {year}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        {availabilityLoading && <span className="text-sage-600 text-sm">Carregando disponibilidade…</span>}
                        {availabilityError && <span className="text-red-600 text-sm">{availabilityError}</span>}
                        <Button
                            variant="primary"
                            icon={<FiCalendar size={18} />}
                            onClick={() => handleOpenNewAppointmentModal()}
                            className="bg-sage-600 hover:bg-sage-700 border-sage-600"
                        >
                            Novo Agendamento
                        </Button>
                    </div>
                </div>
            </Card>

            <Card variant="elevated" className="p-0 overflow-hidden">
                <div className="grid grid-cols-7 bg-sage-100 border-b border-sage-200">
                    {weekDays.map((day) => (
                        <div key={day} className="p-4 text-center font-semibold text-sage-700">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-px bg-sage-100">
                    {daysInMonth.map((day, index) => {
                        const events = getDayEvents(day);
                        const isToday = day && new Date().toDateString() === day.toDateString();
                        return (
                            <div
                                key={index}
                                className={`bg-white relative min-h-[120px] p-3 transition-all duration-200
                  ${isToday ? 'bg-sage-50 ring-2 ring-sage-400' : ''} 
                  ${day ? 'cursor-pointer hover:bg-sage-50' : 'bg-sage-50'}`}
                                onClick={() => day && handleDayClick(day)}
                            >
                                {day && (
                                    <>
                                        <div
                                            className={`text-right text-sm font-medium mb-2
                      ${isToday ? 'text-sage-700' : 'text-sage-600'}
                      ${day.getDate() === 1 ? 'text-sage-800 font-bold' : ''}`}
                                        >
                                            {day.getDate()}
                                        </div>

                                        <div className="space-y-1 max-h-[80px] overflow-hidden">
                                            {events.slice(0, 3).map((event, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`text-xs px-2 py-1 rounded border cursor-pointer transition-all hover:scale-105 ${getEventTypeClass(
                                                        event.type,
                                                    )}`}
                                                    onClick={(e) => handleAppointmentClick(event, e)}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium">{event.time}</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusBadgeClass(event.status)}`}>{event.status}</span>
                                                    </div>
                                                    <div className="truncate text-[10px]">{event.title}</div>
                                                </div>
                                            ))}

                                            {events.length > 3 && (
                                                <div className="text-xs text-center text-sage-500 bg-sage-100 rounded px-2 py-1">+{events.length - 3} mais</div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedDate ? `Agenda: ${formatYmdBr(selectedDate)}` : 'Agenda do Dia'}
                size="medium"
            >
                {selectedDayEvents.length > 0 ? (
                    <div className="space-y-3">
                        {selectedDayEvents.map((event, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${getEventTypeClass(event.type)}`}
                                onClick={(e) => handleAppointmentClick(event, e)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items中心 gap-2 mb-2">
                                            <FiClock size={16} className="text-sage-600" />
                                            <span className="font-semibold text-lg">{event.time}</span>
                                        </div>
                                        <h4 className="font-medium text-sage-800">{event.title}</h4>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(event.status)}`}>{event.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-sage-600">
                        <FiCalendar size={48} className="mx-auto mb-4 text-sage-300" />
                        <p>Sem agendamentos para este dia.</p>
                    </div>
                )}

                <div className="mt-6 flex justify-end space-x-2 pt-4 border-t border-sage-100">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-sage-300 text-sage-700 hover:bg-sage-50">
                        Fechar
                    </Button>

                    {selectedDate && !isDateInPast(selectedDate) && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                handleOpenNewAppointmentModal(selectedDate);
                                setIsModalOpen(false);
                            }}
                            className="bg-sage-600 hover:bg-sage-700"
                        >
                            Agendar
                        </Button>
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={isAppointmentModalOpen}
                onClose={() => {
                    setIsAppointmentModalOpen(false);
                    setIsEditMode(false);
                }}
                title={isEditMode ? 'Editar Agendamento' : 'Detalhes'}
                size="small"
            >
                {selectedEvent && !isEditMode && (
                    <div className="space-y-6">
                        <div className="bg-sage-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-sage-800">{selectedEvent.title}</h3>
                                <span className="text-sm font-medium px-3 py-1 rounded-full flex items-center bg-sage-100 text-sage-800 border border-sage-200">
                                    <FiClock size={14} className="mr-1" />
                                    {selectedEvent.time}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4 border-t border-sage-100">
                            <Button variant="outline" onClick={handleBackToDayView} className="border-sage-300 text-sage-700 hover:bg-sage-50">
                                Voltar
                            </Button>
                        </div>
                    </div>
                )}

                {selectedEvent && isEditMode && editedEvent && (
                    <div className="space-y-6">
                        <div className="flex justify-end space-x-2 pt-4 border-sage-100">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditMode(false);
                                    setEditedEvent(null);
                                    setEditValidationErrors({});
                                }}
                                className="border-sage-300 text-sage-700 hover:bg-sage-50"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    if (editValidationErrors.time) return;
                                    setIsEditMode(false);
                                    setEditedEvent(null);
                                }}
                                disabled={!!editValidationErrors.time}
                                className="bg-sage-600 hover:bg-sage-700"
                            >
                                Salvar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isNewAppointmentModalOpen}
                onClose={() => setIsNewAppointmentModalOpen(false)}
                title={newAppointmentStep === 1 ? 'Selecionar Paciente' : 'Agendar Consulta'}
                size="medium"
            >
                <div>
                    {newAppointmentStep === 1 && (
                        <div className="space-y-4">
                            <div className="mb-4">
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={18} />
                                    <Input
                                        type="text"
                                        className="w-full p-3 border border-sage-200 rounded-lg pl-10 focus:border-sage-400 focus:ring-1 focus:ring-sage-400"
                                        placeholder="Buscar paciente..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto border border-sage-200 rounded-lg">
                                {patientsLoading && (
                                    <div className="p-8 text-center text-sage-500">
                                        <FiCalendar size={24} className="mx-auto mb-2 text-sage-300" />
                                        Carregando pacientes...
                                    </div>
                                )}
                                {!patientsLoading && patientsError && <div className="p-8 text-center text-red-600">{patientsError}</div>}
                                {!patientsLoading && !patientsError && filteredPatients.length > 0 ? (
                                    <div className="divide-y divide-sage-100">
                                        {filteredPatients.map((patient) => (
                                            <div
                                                key={patient.id}
                                                className="p-3 hover:bg-sage-50 cursor-pointer flex items-center transition-colors"
                                                onClick={() => handlePatientSelect(patient)}
                                            >
                                                <div className="bg-sage-100 text-sage-700 h-10 w-10 rounded-full flex items-center justify-center mr-3 font-medium">
                                                    {(patient.nome || '').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="font-medium text-sage-800">{patient.nome}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                                {!patientsLoading && !patientsError && filteredPatients.length === 0 && (
                                    <div className="p-8 text-center text-sage-500">
                                        <FiUser size={32} className="mx-auto mb-2 text-sage-300" />
                                        Nenhum paciente encontrado.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {newAppointmentStep === 2 && (
                        <div className="space-y-6">
                            <div className="bg-sage-50 p-4 rounded-lg flex items-center">
                                <div className="bg-sage-100 text-sage-700 h-12 w-12 rounded-full flex items-center justify-center mr-3 font-medium">
                                    {newAppointmentData.patientName.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm text-sage-600">Paciente selecionado</div>
                                    <div className="font-medium text-sage-800">{newAppointmentData.patientName}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-sage-700">Data da Consulta</label>
                                    <input
                                        type="date"
                                        className={`w-full p-3 border rounded-lg focus:border-sage-400 focus:ring-1 focus:ring-sage-400 ${
                                            validationErrors.date ? 'border-red-500' : 'border-sage-200'
                                        }`}
                                        value={newAppointmentData.date}
                                        onChange={handleDateChange}
                                        min={ymdLocal(new Date())}
                                    />
                                    {availabilityLoading && <p className="mt-1 text-sm text-sage-600">Carregando horários…</p>}
                                    {availabilityError && <p className="mt-1 text-sm text-red-600">{availabilityError}</p>}
                                    {validationErrors.date && <p className="mt-1 text-sm text-red-600">{validationErrors.date}</p>}
                                </div>

                                <div>
                                    <label className="block mb-2 text-sm font-medium text-sage-700">Horário</label>
                                    <select
                                        className={`w-full p-3 border rounded-lg focus:border-sage-400 focus:ring-1 focus:ring-sage-400 ${
                                            validationErrors.time ? 'border-red-500' : 'border-sage-200'
                                        }`}
                                        value={newAppointmentData.time}
                                        onChange={handleTimeChange}
                                    >
                                        {availableTimesForSelectedDate.length > 0 ? (
                                            availableTimesForSelectedDate.map((time) => (
                                                <option key={time} value={time}>
                                                    {time}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>
                                                Sem horários disponíveis
                                            </option>
                                        )}
                                    </select>
                                    {validationErrors.time && <p className="mt-1 text-sm text-red-600">{validationErrors.time}</p>}
                                    {availableTimesForSelectedDate.length === 0 && (
                                        <p className="mt-1 text-sm text-amber-600">Não há horários disponíveis para esta data. Selecione outra data.</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-sage-700">Anotações (opcional)</label>
                                <textarea
                                    className="w-full p-3 border border-sage-200 rounded-lg focus:border-sage-400 focus:ring-1 focus:ring-sage-400 h-24 resize-none"
                                    value={newAppointmentData.notes}
                                    onChange={(e) => setNewAppointmentData({ ...newAppointmentData, notes: e.target.value })}
                                    placeholder="Adicione anotações sobre a consulta..."
                                />
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end space-x-2 pt-4 border-t border-sage-100">
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (newAppointmentStep === 1) {
                                    setIsNewAppointmentModalOpen(false);
                                } else {
                                    handlePreviousStep();
                                }
                            }}
                            className="border-sage-300 text-sage-700 hover:bg-sage-50"
                        >
                            {newAppointmentStep === 1 ? 'Cancelar' : 'Voltar'}
                        </Button>

                        {newAppointmentStep === 1 && (
                            <Button
                                variant="primary"
                                onClick={handleNextStep}
                                disabled={!newAppointmentData.patientId}
                                className="bg-sage-600 hover:bg-sage-700"
                            >
                                Continuar
                            </Button>
                        )}

                        {newAppointmentStep === 2 && (
                            <Button
                                variant="primary"
                                onClick={handleCreateAppointment}
                                disabled={
                                    !!validationErrors.date ||
                                    !!validationErrors.time ||
                                    availabilityLoading ||
                                    (getAvailableTimesForDate(newAppointmentData.date).length === 0)
                                }
                                className="bg-sage-600 hover:bg-sage-700"
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
