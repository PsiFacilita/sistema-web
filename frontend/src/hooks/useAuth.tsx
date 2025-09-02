import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const API_URL =
  (import.meta as any).env?.BACKEND_URL ||
  'http://localhost:5000';

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

  const login = async (email: string, password: string): Promise<boolean> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
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

    // persiste token + user
    if (data?.token) localStorage.setItem('auth.token', data.token);
    localStorage.setItem('auth.user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);

    return true;
  };

  const logout = (): void => {
    localStorage.removeItem('auth.token');
    localStorage.removeItem('auth.user');
    setUser(null);
  };

  const isAuthenticated = (): boolean => {
    const token = localStorage.getItem('auth.token');
    return Boolean(token && user);
  };

  const value: AuthContextType = { user, login, logout, isAuthenticated };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
