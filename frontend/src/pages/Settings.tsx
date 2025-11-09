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
    const openDays: Set<string> = new Set(Array.isArray(api.days) ? api.days : []);
    let shiftStart = '08:00';
    let shiftEnd = '17:00';
    if (Array.isArray(api.shifts) && api.shifts.length > 0) {
        shiftStart = api.shifts[0].start ?? shiftStart;
        shiftEnd = api.shifts[0].end ?? shiftEnd;
    }
    (Object.keys(ptToKey) as (keyof typeof ptToKey)[]).forEach(pt => {
        const k = ptToKey[pt];
        const isOpen = openDays.has(pt);
        (base as any)[k].isOpen = isOpen;
        (base as any)[k].openTime = shiftStart;
        (base as any)[k].closeTime = shiftEnd;
        if (!isOpen) {
            (base as any)[k].hasBreak = false;
        }
    });
    const exceptions = Array.isArray(api.exceptions) ? api.exceptions : [];
    base.exceptions = exceptions.map((e: any) => ({
        id: String(e.id ?? Date.now()),
        date: e.date,
        isOpen: e.type === 'alterado',
        openTime: e.start ?? '08:00',
        closeTime: e.end ?? '17:00',
        hasBreak: false,
        breakStart: '12:00',
        breakEnd: '13:00'
    }));
    return JSON.parse(JSON.stringify(base));
}

function toServerPayload(cfg: WeeklyScheduleConfig) {
    const dayKeys: (keyof Omit<WeeklyScheduleConfig, 'exceptions'>)[] = [
        'sunday','monday','tuesday','wednesday','thursday','friday','saturday'
    ];
    const days = dayKeys.filter(k => (cfg as any)[k]?.isOpen).map(k => keyToPt[k]);
    const pairs = new Set<string>();
    dayKeys.forEach(k => {
        const d = (cfg as any)[k];
        if (d?.isOpen && d?.openTime && d?.closeTime) {
            pairs.add(`${d.openTime}-${d.closeTime}`);
        }
    });
    const shifts = Array.from(pairs).map(s => {
        const [start, end] = s.split('-');
        return { start, end };
    });
    if (shifts.length === 0) shifts.push({ start: '08:00', end: '17:00' });
    const exceptions = Array.isArray(cfg.exceptions) ? cfg.exceptions.map(e => ({
        date: e.date,
        type: e.isOpen ? 'alterado' : 'fechado',
        start: e.isOpen ? e.openTime : null,
        end: e.isOpen ? e.closeTime : null,
        reason: null
    })) : [];
    return { days, shifts, exceptions };
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
