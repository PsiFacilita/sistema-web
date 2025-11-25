import React, { useEffect, useState } from 'react';
import Title from '../components/Title/Title';
import PersonalDataSettings from '../components/PersonalDataSettings';
import CollaboratorManager from '../components/CollaboratorManager';
import WorkScheduleManager, { createDefaultWeeklySchedule, WeeklyScheduleConfig } from '../components/WorkScheduleManager/WorkScheduleManager';
import MainLayout from '../components/layout/MainLayout/MainLayout';
import Card from '../components/Card/Card';
import axios from 'axios';

const API_URL = (import.meta as any).env?.BACKEND_URL || 'http://localhost:5000';

type Profile = { name: string; email: string; phone: string; crp?: string | null };
type Collaborator = { id?: number; name: string; email: string; phone?: string; role?: string };

const ptToKey: Record<string, keyof WeeklyScheduleConfig> = {
    domingo: 'sunday',
    segunda: 'monday',
    terça: 'tuesday',
    quarta: 'wednesday',
    quinta: 'thursday',
    sexta: 'friday',
    sábado: 'saturday'
};

const keyToPt: Record<keyof WeeklyScheduleConfig, string> = {
    sunday: 'domingo',
    monday: 'segunda',
    tuesday: 'terça',
    wednesday: 'quarta',
    thursday: 'quinta',
    friday: 'sexta',
    saturday: 'sábado',
    exceptions: 'exceptions'
} as any;

function toClientSchedule(api: any): WeeklyScheduleConfig {
    const base = createDefaultWeeklySchedule();
    if (!api || typeof api !== 'object') return base;

    const scheduleMap = api.schedule || {};
    
    (Object.keys(ptToKey) as (keyof typeof ptToKey)[]).forEach(pt => {
        const k = ptToKey[pt];
        const shifts = scheduleMap[pt];
        
        if (Array.isArray(shifts) && shifts.length > 0) {
            (base as any)[k].isOpen = true;
            
            // Ordenar turnos por horário de início
            shifts.sort((a: any, b: any) => a.start.localeCompare(b.start));
            
            const first = shifts[0];
            const last = shifts[shifts.length - 1];
            
            (base as any)[k].openTime = first.start.substring(0, 5);
            (base as any)[k].closeTime = last.end.substring(0, 5);
            
            if (shifts.length > 1) {
                (base as any)[k].hasBreak = true;
                (base as any)[k].breakStart = first.end.substring(0, 5);
                (base as any)[k].breakEnd = last.start.substring(0, 5);
            } else {
                (base as any)[k].hasBreak = false;
            }
        } else {
            (base as any)[k].isOpen = false;
            (base as any)[k].hasBreak = false;
        }
    });

    const exceptions = Array.isArray(api.exceptions) ? api.exceptions : [];
    base.exceptions = exceptions.map((e: any) => ({
        id: String(e.id ?? Date.now()),
        date: e.date,
        isOpen: e.type === 'alterado',
        openTime: e.start ? e.start.substring(0, 5) : '08:00',
        closeTime: e.end ? e.end.substring(0, 5) : '17:00',
        hasBreak: false,
        breakStart: '12:00',
        breakEnd: '13:00',
        reason: e.reason
    }));
    return JSON.parse(JSON.stringify(base));
}

function toServerPayload(cfg: WeeklyScheduleConfig) {
    const dayKeys: (keyof Omit<WeeklyScheduleConfig, 'exceptions'>)[] = [
        'sunday','monday','tuesday','wednesday','thursday','friday','saturday'
    ];
    
    const schedule: Record<string, {start: string, end: string}[]> = {};

    dayKeys.forEach(k => {
        const d = (cfg as any)[k];
        const ptDay = keyToPt[k];
        
        if (d?.isOpen) {
            const shifts = [];
            if (d.hasBreak && d.breakStart && d.breakEnd) {
                // Dois turnos
                shifts.push({ start: d.openTime, end: d.breakStart });
                shifts.push({ start: d.breakEnd, end: d.closeTime });
            } else {
                // Um turno
                shifts.push({ start: d.openTime, end: d.closeTime });
            }
            schedule[ptDay] = shifts;
        }
    });

    const exceptions = Array.isArray(cfg.exceptions) ? cfg.exceptions.map(e => ({
        date: e.date,
        type: e.isOpen ? 'alterado' : 'fechado',
        start: e.isOpen ? e.openTime : null,
        end: e.isOpen ? e.closeTime : null,
        reason: e.reason || null
    })) : [];
    
    return { schedule, exceptions };
}

const Settings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<Profile>({ name: '', email: '', phone: '', crp: '' });
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [workSchedules, setWorkSchedules] = useState<WeeklyScheduleConfig>(createDefaultWeeklySchedule());

    const authHeaders = () => {
        const token = localStorage.getItem('auth.token');
        const headers: any = { Accept: 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    const loadAll = async () => {
        setLoading(true);
        const headers = authHeaders();
        const [p, c, w] = await Promise.allSettled([
            axios.get(`${API_URL}/api/settings/profile`, { withCredentials: true, headers }),
            axios.get(`${API_URL}/api/settings/collaborators`, { withCredentials: true, headers }),
            axios.get(`${API_URL}/api/settings/schedule`, { withCredentials: true, headers })
        ]);
        if (p.status === 'fulfilled') {
            const prof = p.value.data?.profile || {};
            setUserData({ name: prof.name || '', email: prof.email || '', phone: prof.phone || '', crp: prof.crp ?? '' });
        }
        if (c.status === 'fulfilled') {
            const list = Array.isArray(c.value.data?.collaborators) ? c.value.data.collaborators : [];
            const mapped = list.map((x: any) => ({ id: x.id, name: x.name, email: x.email, phone: x.phone ?? '', role: x.cargo ?? x.role ?? 'secretaria' }));
            setCollaborators(mapped);
        }
        if (w.status === 'fulfilled') {
            const apiSchedule = w.value.data?.schedule ?? null;
            setWorkSchedules(toClientSchedule(apiSchedule));
        }
        setLoading(false);
    };

    useEffect(() => {
        loadAll();
    }, []);

    const handlePersonalDataSave = async (data: Profile) => {
        const headers = { ...authHeaders(), 'Content-Type': 'application/json' };
        await axios.put(`${API_URL}/api/settings/profile`, data, { withCredentials: true, headers });
        setUserData(data);
    };

    const handleCollaboratorsSave = async (nextList: Collaborator[]) => {
        const headers = { ...authHeaders(), 'Content-Type': 'application/json' };
        const byEmail = (arr: Collaborator[]) => new Map(arr.map(x => [x.email.toLowerCase(), x]));
        const curMap = byEmail(collaborators);
        const toCreate: Collaborator[] = [];
        const keepIds: Set<number> = new Set();
        for (const v of nextList) {
            const cur = curMap.get(v.email.toLowerCase());
            if (!cur) toCreate.push(v);
            else if (cur.id) keepIds.add(cur.id as number);
        }
        const toRemove = collaborators.filter(c => c.id && !keepIds.has(c.id as number)).map(c => c.id!) ;
        for (const c of toCreate) {
            const payload = { name: c.name, email: c.email, phone: c.phone || '', password: crypto.getRandomValues(new Uint32Array(1))[0].toString(36) };
            await axios.post(`${API_URL}/api/settings/collaborators`, payload, { withCredentials: true, headers });
        }
        for (const id of toRemove) {
            await axios.delete(`${API_URL}/api/settings/collaborators/${id}`, { withCredentials: true, headers });
        }
        await loadAll();
    };

    const handleScheduleSave = async (schedules: WeeklyScheduleConfig) => {
        const headers = { ...authHeaders(), 'Content-Type': 'application/json' };
        const payload = toServerPayload(schedules);
        await axios.put(`${API_URL}/api/settings/schedule`, payload, { withCredentials: true, headers });
        setWorkSchedules(JSON.parse(JSON.stringify(schedules)));
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[300px]">
                    <div className="text-gray-600">Carregando...</div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="pb-10">
                <Title level={1} className="text-sage-700 mb-8">Configurações</Title>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                    <Card variant="elevated" className="h-full">
                        <PersonalDataSettings initialData={userData} onSave={handlePersonalDataSave} />
                    </Card>
                    <Card variant="elevated" className="h-full">
                        <CollaboratorManager initialCollaborators={collaborators} onSave={handleCollaboratorsSave} />
                    </Card>
                </div>
                <Card variant="elevated">
                    <WorkScheduleManager initialConfig={workSchedules} onSave={handleScheduleSave} />
                </Card>
            </div>
        </MainLayout>
    );
};

export default Settings;
