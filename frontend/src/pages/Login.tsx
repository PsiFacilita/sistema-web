import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button/Button';
import Input from '../components/Form/Input/Input';
import Label from '../components/Form/Label/Label';
import Anchor from '../components/Anchor/Anchor';
import Modal from '../components/Modal/Modal';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo-psifacilita.png';
import { FiMail, FiLock, FiArrowRight, FiHelpCircle, FiRefreshCw, FiShield } from 'react-icons/fi';

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

    const [is2faOpen, setIs2faOpen] = useState(false);
    const [challengeId, setChallengeId] = useState<string>('');
    const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [codeError, setCodeError] = useState<string>('');
    const [codeLoading, setCodeLoading] = useState<boolean>(false);
    const [rememberDevice, setRememberDevice] = useState<boolean>(false);
    const [resendLoading, setResendLoading] = useState<boolean>(false);
    const [resendCooldown, setResendCooldown] = useState<number>(0);

    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const navigate = useNavigate();
    const { completeLogin } = useAuth();

    const codeValue = useMemo(() => codeDigits.join(''), [codeDigits]);

    useEffect(() => {
        let timer: number | undefined;
        if (resendCooldown > 0) {
            timer = window.setInterval(() => {
                setResendCooldown((s) => (s > 0 ? s - 1 : 0));
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [resendCooldown]);

    const focusNext = (idx: number) => {
        if (idx < 5) inputsRef.current[idx + 1]?.focus();
    };

    const focusPrev = (idx: number) => {
        if (idx > 0) inputsRef.current[idx - 1]?.focus();
    };

    const handleDigitChange = (idx: number, val: string) => {
        setCodeError('');
        const cleaned = val.replace(/\D/g, '');
        if (!cleaned) {
            setCodeDigits((arr) => {
                const a = [...arr];
                a[idx] = '';
                return a;
            });
            return;
        }

        if (cleaned.length > 1) {
            const next = cleaned.slice(0, 6).split('');
            const filled = Array(6).fill('');
            for (let i = 0; i < next.length; i++) filled[i] = next[i];
            setCodeDigits(filled as string[]);
            const last = Math.min(next.length, 6) - 1;
            inputsRef.current[last]?.focus();
            return;
        }

        setCodeDigits((arr) => {
            const a = [...arr];
            a[idx] = cleaned;
            return a;
        });
        if (cleaned) focusNext(idx);
    };

    const handleDigitKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !codeDigits[idx]) {
            e.preventDefault();
            setCodeDigits((arr) => {
                const a = [...arr];
                a[idx] = '';
                return a;
            });
            focusPrev(idx);
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            focusPrev(idx);
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            focusNext(idx);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: email.trim(), password }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data?.message || 'Falha no login.');
            }

            if (data?.requires_2fa && data?.challenge_id) {
                setChallengeId(data.challenge_id);
                setIs2faOpen(true);
                setCodeDigits(['', '', '', '', '', '']);
                setRememberDevice(false);
                setResendCooldown(30);
                return;
            }

            completeLogin(data);
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            setError(err?.message || 'Ocorreu um erro durante o login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        setCodeError('');
        const code = codeValue.replace(/\D/g, '');
        if (code.length !== 6) {
            setCodeError('Informe os 6 dígitos.');
            return;
        }

        setCodeLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/2fa/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    challenge_id: challengeId,
                    code,
                    remember: rememberDevice,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data?.ok) {
                throw new Error(data?.message || 'Código inválido.');
            }

            completeLogin(data);
            setIs2faOpen(false);
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            setCodeError(err?.message || 'Falha ao validar o código.');
        } finally {
            setCodeLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0) return;
        setResendLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/2fa/resend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({}),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.ok) {
                throw new Error(data?.message || 'Não foi possível reenviar o código.');
            }
            setChallengeId(data.challenge_id);
            setCodeDigits(['', '', '', '', '', '']);
            setCodeError('');
            setResendCooldown(30);
        } catch (err: any) {
            setCodeError(err?.message || 'Erro ao reenviar o código.');
        } finally {
            setResendLoading(false);
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
        <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-sage-50 via-sage-25 to-sage-100">
            <div className="flex justify-center w-full mb-4 sm:mb-6">
                <img src={logo} alt="Logo Psifacilita" className="w-60 sm:w-72 lg:w-80 max-w-full h-auto" />
            </div>

            <div className="w-full max-w-md mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 lg:p-10 w-full border border-sage-200">
                    <h2 className="text-center text-xl sm:text-2xl lg:text-3xl font-semibold text-sage-800 mb-4 sm:mb-6">
                        Login
                    </h2>

                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                            <div className="flex">
                                <div className="text-red-500 text-sm">{error}</div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <Label htmlFor="email" className="text-sage-700 mb-2">
                                Email
                            </Label>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={18} />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    disabled={isLoading}
                                    className="pl-10 border-sage-200 focus:border-sage-400"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="password" className="text-sage-700 mb-2">
                                Senha
                            </Label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={18} />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                    className="pl-10 border-sage-200 focus:border-sage-400"
                                />
                            </div>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                variant="primary"
                                fullWidth
                                loading={isLoading}
                                disabled={isLoading}
                                className="bg-sage-600 hover:bg-sage-700 border-sage-600"
                                icon={<FiArrowRight size={18} />}
                            >
                                Entrar
                            </Button>
                        </div>
                    </form>

                    <div className="mt-4 text-center">
                        <Anchor
                            href="#"
                            className="text-sm text-sage-600 hover:text-sage-700 transition-colors flex items-center justify-center gap-2"
                            onClick={(e) => {
                                e.preventDefault();
                                openRecoveryModal();
                            }}
                        >
                            <FiHelpCircle size={16} />
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
                            <p className="mb-4 text-sm text-sage-600">
                                Digite seu e-mail abaixo e enviaremos um link para criar uma nova senha.
                            </p>
                            <Label htmlFor="recovery-email" className="text-sage-700 mb-2">Email</Label>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400" size={18} />
                                <Input
                                    id="recovery-email"
                                    name="recovery-email"
                                    type="email"
                                    required
                                    value={recoveryEmail}
                                    onChange={(e) => setRecoveryEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    disabled={recoveryLoading}
                                    className="pl-10 border-sage-200 focus:border-sage-400"
                                />
                            </div>
                        </div>

                        {recoveryError && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700">
                                {recoveryError}
                            </div>
                        )}

                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsRecoveryModalOpen(false)}
                                type="button"
                                disabled={recoveryLoading}
                                className="border-sage-300 text-sage-700 hover:bg-sage-50"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                loading={recoveryLoading}
                                disabled={recoveryLoading || !recoveryEmail}
                                className="bg-sage-600 hover:bg-sage-700 border-sage-600"
                            >
                                Enviar link
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-sage-700">
                            {recoveryMessage || 'Solicitação processada.'}
                        </p>
                        <div className="flex justify-end">
                            <Button
                                variant="primary"
                                onClick={() => setIsRecoveryModalOpen(false)}
                                className="bg-sage-600 hover:bg-sage-700"
                            >
                                Entendi
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={is2faOpen}
                onClose={() => setIs2faOpen(false)}
                title="Verificação em duas etapas"
                size="small"
                confirmButtonText=""
            >
                <div className="space-y-4">
                    <p className="text-sm text-sage-700">
                        Enviamos um código de 6 dígitos para o seu e-mail cadastrado.
                    </p>

                    <div className="flex justify-center gap-2">
                        {codeDigits.map((d, idx) => (
                            <input
                                key={idx}
                                ref={(el) => (inputsRef.current[idx] = el)}
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={1}
                                value={d}
                                onChange={(e) => handleDigitChange(idx, e.target.value)}
                                onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                                className="w-10 h-12 text-center text-lg border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-400"
                            />
                        ))}
                    </div>

                    <label className="flex items-center gap-2 text-sm text-sage-700">
                        <input
                            type="checkbox"
                            checked={rememberDevice}
                            onChange={(e) => setRememberDevice(e.target.checked)}
                        />
                        <span className="flex items-center gap-1">
                            <FiShield /> Lembrar este dispositivo por 30 dias
                        </span>
                    </label>

                    {codeError && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700">
                            {codeError}
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <Button
                            variant="primary"
                            onClick={handleVerifyCode}
                            loading={codeLoading}
                            disabled={codeLoading}
                            className="bg-sage-600 hover:bg-sage-700 border-sage-600"
                        >
                            Validar código
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={handleResendCode}
                            loading={resendLoading}
                            disabled={resendLoading || resendCooldown > 0}
                            icon={<FiRefreshCw />}
                            className="text-sage-700 hover:bg-sage-50"
                        >
                            {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar código'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Login;
