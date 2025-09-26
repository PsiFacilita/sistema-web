import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button/Button';

const NonAuthorized: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleBack = () => {
        navigate('/dashboard');
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
                <p className="text-gray-700 mb-6">
                    Você não tem permissão para acessar esta página.
                </p>
                <div className="flex flex-col space-y-3">
                    <Button variant="primary" onClick={handleBack}>
                        Voltar ao Dashboard
                    </Button>
                    <Button variant="secondary" onClick={handleLogout}>
                        Sair
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NonAuthorized;
