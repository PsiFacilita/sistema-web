import React from 'react';
import Button from '../components/Button'; 
import Card from '../components/Card/Card';
import Input from '../components/Form/Input'; 

const PasswordReset: React.FC = () => {
    const handlePasswordReset = (event: React.FormEvent) => {
        event.preventDefault();
        // lógica de redefinição de senha aqui
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">
                    Redefinir Senha
                </h1>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                    <Input
                        type="password"
                        placeholder="Digite sua nova senha"
                        required
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Input
                        type="password"
                        placeholder="Confirme sua nova senha"
                        required
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                    >
                        Redefinir Senha
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default PasswordReset;
