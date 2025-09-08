import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const API_URL = (import.meta as any).env?.BACKEND_URL || 'http://localhost:5000';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('auth.user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('auth.user');
      }
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            ...(localStorage.getItem('auth.token')
                ? { Authorization: `Bearer ${localStorage.getItem('auth.token')}` }
                : {}),
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.ok && data?.user) {
            const normalized: User = {
              name: (data.user.nome ?? data.user.name ?? '').toString(),
              email: data.user.email ?? '',
            };
            setUser(normalized);
            localStorage.setItem('auth.user', JSON.stringify(normalized));
          }
        }
      } catch {
      }
    };

    bootstrap();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // ignore
    }

    if (!response.ok || data?.ok === false) {
      const backendMsg =
          data?.message ||
          (response.status === 401 ? 'Credenciais inválidas.' : 'Erro ao autenticar.');
      throw new Error(backendMsg);
    }

    const rawUser = data?.user ?? {};
    const normalizedUser: User = {
      name: (rawUser.nome ?? rawUser.name ?? '').toString(),
      email: rawUser.email ?? email,
    };

    if (data?.token) localStorage.setItem('auth.token', data.token);

    localStorage.setItem('auth.user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    return true;
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(localStorage.getItem('auth.token')
              ? { Authorization: `Bearer ${localStorage.getItem('auth.token')}` }
              : {}),
        },
      });
    } catch {
    }

    localStorage.removeItem('auth.token');
    localStorage.removeItem('auth.user');
    setUser(null);
  };

  const isAuthenticated = (): boolean => {
    const token = localStorage.getItem('auth.token');
    return Boolean((token || user) && user);
  };

  const value: AuthContextType = { user, login, logout, isAuthenticated };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
