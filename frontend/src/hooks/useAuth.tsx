import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Role } from './roles.ts';

interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
    psicologoId: number | null;
}

interface AuthContextType {
    user: User | null;
    ready: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    isAuthenticated: () => boolean;
    completeLogin: (data: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

const API_URL = (import.meta as any).env?.BACKEND_URL || 'http://localhost:5000';

function normalizeUser(raw: any): User {
    const role: Role = (raw?.role ?? raw?.cargo ?? 'psicologo') as Role;
    const rawP = raw?.psicologo_id ?? raw?.psicologoId ?? null;
    const n = rawP === '' ? null : Number(rawP);
    const psicologoId = !n || Number.isNaN(n) || n === 0 ? null : n;

    return {
        id: Number(raw?.id ?? 0),
        name: String(raw?.nome ?? raw?.name ?? ''),
        email: String(raw?.email ?? ''),
        role,
        psicologoId,
    };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('auth.user');
        if (stored) {
            try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem('auth.user'); }
        }
    }, []);

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const token = localStorage.getItem('auth.token');
                const res = await fetch(`${API_URL}/auth/me`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.ok && data?.user) {
                        const normalized = normalizeUser(data.user);
                        setUser(normalized);
                        localStorage.setItem('auth.user', JSON.stringify(normalized));
                    }
                }
            } catch {}
            finally {
                setReady(true);
            }
        };
        bootstrap();
    }, []);

    const completeLogin = (data: any) => {
        const normalizedUser = normalizeUser(data?.user ?? {});
        if (data?.token) localStorage.setItem('auth.token', data.token);
        localStorage.setItem('auth.user', JSON.stringify(normalizedUser));
        setUser(normalizedUser);
        setReady(true);
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });

        let data: any = null;
        try { data = await response.json(); } catch {}

        if (!response.ok || data?.ok === false) {
            const backendMsg = data?.message || (response.status === 401 ? 'Credenciais inválidas.' : 'Erro ao autenticar.');
            throw new Error(backendMsg);
        }

        completeLogin(data);
        return true;
    };

    const logout = async (): Promise<void> => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('auth.token')
                        ? { Authorization: `Bearer ${localStorage.getItem('auth.token')}` }
                        : {}),
                },
            });
        } catch {}

        localStorage.removeItem('auth.token');
        localStorage.removeItem('auth.user');
        setUser(null);
        setReady(true);
    };

    const isAuthenticated = (): boolean => Boolean(user);

    const value: AuthContextType = { user, ready, login, logout, isAuthenticated, completeLogin };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
};
