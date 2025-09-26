import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import type { Role } from './roles.ts';

const Loader: React.FC = () => (
    <div style={{ display: 'grid', placeItems: 'center', height: '60vh' }}>
        <div style={{ fontSize: 14, color: '#666' }}>Carregando…</div>
    </div>
);

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, ready, user } = useAuth();
    const location = useLocation();

    // Ainda carregando estado de auth (bootstrap /auth/me)
    if (!ready) return <Loader />;

    // Depois de pronto, se não autenticado, manda para login ("/")
    if (!isAuthenticated() || !user) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    return <>{children}</>;
};

export const RoleRoute: React.FC<{ roles: Role[]; children: React.ReactNode }> = ({ roles, children }) => {
    const { ready, user, isAuthenticated } = useAuth();
    const location = useLocation();

    if (!ready) return <Loader />;

    if (!isAuthenticated() || !user) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    if (!roles.includes(user.role)) {
        return <Navigate to="/not-authorized" replace />;
    }

    return <>{children}</>;
};
