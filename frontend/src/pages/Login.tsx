import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button/Button';
import Input from '../components/Form/Input/Input';
import Label from '../components/Form/Label/Label';
import Anchor from '../components/Anchor/Anchor';
import Modal from '../components/Modal/Modal';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo-psifacilita.png';

const API_URL =
    (import.meta as any).env?.VITE_BACKEND_URL ||
    (import.meta as any).env?.BACKEND_URL ||
    'http://localhost:5000';

const Login: () => JSX.Element = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
    const [recoverySubmitted, setRecoverySubmitted] = useState(false);
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const [recoveryMessage, setRecoveryMessage] = useState<string>('');
    const [recoveryError, setRecoveryError] = useState<string>('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const success = await login(email, password);
            if (success) navigate('/dashboard', { replace: true });
        } catch (err: any) {
            setError(err?.message || 'Ocorreu um erro durante o login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecoverySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setRecoveryError('');
        setRecoveryLoading(true);
        setRecoveryMessage('');

        try {
            const res = await fetch(`${API_URL}/auth/password/forgot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: recoveryEmail.trim() }),
            });

            let data: any = null;
            try {
                data = await res.json();
            } catch {}

            if (!res.ok) {
                const msg = data?.message || 'Não foi possível processar sua solicitação.';
                setRecoveryMessage(msg);
                setRecoveryError(msg);
                setRecoverySubmitted(true);
                return;
            }

            setRecoveryMessage(
                data?.message ||
                'Se este e-mail estiver cadastrado, você receberá instruções para redefinir a senha.'
            );
            setRecoverySubmitted(true);
        } catch (err: any) {
            const msg = err?.message || 'Falha ao enviar o e-mail de recuperação.';
            setRecoveryMessage(msg);
            setRecoveryError(msg);
            setRecoverySubmitted(true);
        } finally {
            setRecoveryLoading(false);
        }
    };

    const openRecoveryModal = () => {
        setIsRecoveryModalOpen(true);
        setRecoveryEmail('');
        setRecoverySubmitted(false);
        setRecoveryError('');
        setRecoveryMessage('');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-600 via-gray-100 to-gray-600 overflow-hidden">
            <div className="flex justify-center w-full">
                <img src={logo} alt="Logo Psifacilita" className="w-80 mb-1" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white rounded-xl shadow-lg p-8 sm:p-10 w-full max-w-md border border-gray-200">
                    <h2 className="text-center text-2xl sm:text-3xl font-semibold text-gray-800 mb-6">
                        Acesse sua conta
                    </h2>

                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                            <div className="flex">
                                <div className="text-red-500">{error}</div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-3" onSubmit={handleSubmit}>
                        <div>
                            <Label htmlFor="email" className="text-slate-950">
                                Email
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <Label htmlFor="password" className="text-slate-950">
                                Senha
                            </Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <Button type="submit" variant="primary" fullWidth loading={isLoading} disabled={isLoading}>
                                Entrar
                            </Button>
                        </div>
                    </form>

                    <div className="mt-3 text-center">
                        <Anchor
                            href="#"
                            className="text-sm text-600 underline"
                            onClick={(e) => {
                                e.preventDefault();
                                openRecoveryModal();
                            }}
                        >
                            Esqueci minha senha
                        </Anchor>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isRecoveryModalOpen}
                onClose={() => setIsRecoveryModalOpen(false)}
                title="Recuperação de senha"
                size="small"
                confirmButtonText=""
            >
                {!recoverySubmitted ? (
                    <form onSubmit={handleRecoverySubmit} className="space-y-4">
                        <div>
                            <p className="mb-4 text-sm text-gray-600">
                                Digite seu e-mail abaixo e enviaremos um link para criar uma nova senha.
                            </p>
                            <Label htmlFor="recovery-email">Email</Label>
                            <Input
                                id="recovery-email"
                                name="recovery-email"
                                type="email"
                                required
                                value={recoveryEmail}
                                onChange={(e) => setRecoveryEmail(e.target.value)}
                                placeholder="seu@email.com"
                                disabled={recoveryLoading}
                            />
                        </div>

                        {recoveryError && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700">
                                {recoveryError}
                            </div>
                        )}

                        <div className="flex justify-end space-x-2">
                            <Button variant="secondary" onClick={() => setIsRecoveryModalOpen(false)} type="button" disabled={recoveryLoading}>
                                Cancelar
                            </Button>
                            <Button variant="primary" type="submit" loading={recoveryLoading} disabled={recoveryLoading || !recoveryEmail}>
                                Enviar link
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-700">
                            {recoveryMessage || 'Solicitação processada.'}
                        </p>
                        <div className="flex justify-end">
                            <Button variant="primary" onClick={() => setIsRecoveryModalOpen(false)}>
                                Entendi
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Login;
