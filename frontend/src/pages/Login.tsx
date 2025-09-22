import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';
import Input from '../components/Form/Input/Input';
import Label from '../components/Form/Label/Label';
import Anchor from '../components/Anchor/Anchor';
import Modal from '../components/Modal/Modal';
import logo from '../assets/images/logo-psifacilita.png';

const API_URL =
    (import.meta as any).env?.VITE_BACKEND_URL ||
    (import.meta as any).env?.BACKEND_URL ||
    'http://localhost:5000';

const Login: () => JSX.Element = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [otpOpen, setOtpOpen] = useState(false);
    const [challengeId, setChallengeId] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [rememberDevice, setRememberDevice] = useState(true);
    const [otpError, setOtpError] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [recoverySubmitted, setRecoverySubmitted] = useState(false);
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const [recoveryMessage, setRecoveryMessage] = useState('');
    const [recoveryError, setRecoveryError] = useState('');

    const navigate = useNavigate();

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
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                setError(data?.message || 'Ocorreu um erro durante o login');
                return;
            }
            if (data?.requires_2fa && data?.challenge_id) {
                setChallengeId(data.challenge_id);
                setOtpOpen(true);
                return;
            }
            if (data?.ok) {
                navigate('/dashboard', { replace: true });
                return;
            }
            setError('Falha ao autenticar.');
        } catch (err: any) {
            setError(err?.message || 'Ocorreu um erro durante o login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setOtpError('');
        setOtpLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/2fa/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ challenge_id: challengeId, code: otpCode.trim(), remember: !!rememberDevice }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.ok) {
                setOtpError(data?.message || 'Código inválido.');
                return;
            }
            setOtpOpen(false);
            navigate('/dashboard', { replace: true });
        } catch {
            setOtpError('Erro ao verificar o código.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setOtpError('');
        setOtpLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/2fa/resend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({}),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.ok) {
                setOtpError(data?.message || 'Não foi possível reenviar.');
                return;
            }
            setChallengeId(data.challenge_id);
            setOtpCode('');
        } catch {
            setOtpError('Não foi possível reenviar.');
        } finally {
            setOtpLoading(false);
        }
    };

    const openRecoveryModal = () => {
        setIsRecoveryModalOpen(true);
        setRecoveryEmail('');
        setRecoverySubmitted(false);
        setRecoveryError('');
        setRecoveryMessage('');
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
            try { data = await res.json(); } catch {}
            if (!res.ok) {
                const msg = data?.message || 'Não foi possível processar sua solicitação.';
                setRecoveryMessage(msg);
                setRecoveryError(msg);
                setRecoverySubmitted(true);
                return;
            }
            setRecoveryMessage(data?.message || 'Se este e-mail estiver cadastrado, você receberá instruções para redefinir a senha.');
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

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-600 via-gray-100 to-gray-600 overflow-hidden">
            <div className="flex justify-center w-full">
                <img src={logo} alt="Logo Psifacilita" className="w-80 mb-1" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white rounded-xl shadow-lg p-8 sm:p-10 w-full max-w-md border border-gray-200">
                    <h2 className="text-center text-2xl sm:text-3xl font-semibold text-gray-800 mb-6">Acesse sua conta</h2>

                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                            <div className="flex">
                                <div className="text-red-500">{error}</div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-3" onSubmit={handleSubmit}>
                        <div>
                            <Label htmlFor="email" className="text-slate-950">Email</Label>
                            <Input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" disabled={isLoading} />
                        </div>

                        <div>
                            <Label htmlFor="password" className="text-slate-950">Senha</Label>
                            <Input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={isLoading} />
                        </div>

                        <div>
                            <Button type="submit" variant="primary" fullWidth loading={isLoading} disabled={isLoading}>Entrar</Button>
                        </div>
                    </form>

                    <div className="mt-3 text-center">
                        <Anchor href="#" className="text-sm text-600 underline" onClick={(e) => { e.preventDefault(); openRecoveryModal(); }}>Esqueci minha senha</Anchor>
                    </div>
                </div>
            </div>

            <Modal isOpen={otpOpen} onClose={() => {}} title="Two-factor verification" size="small" confirmButtonText="">
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                        <Label htmlFor="otp">6-digit code</Label>
                        <Input id="otp" name="otp" type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} required value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g,''))} disabled={otpLoading} />
                    </div>

                    <div className="flex items-center gap-2">
                        <input id="rememberDevice" type="checkbox" checked={rememberDevice} onChange={(e)=>setRememberDevice(e.target.checked)} disabled={otpLoading} />
                        <label htmlFor="rememberDevice" className="text-sm">Remember this device for 30 days</label>
                    </div>

                    {otpError && <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700">{otpError}</div>}

                    <div className="flex justify-between">
                        <button type="button" className="text-sm underline" onClick={handleResendOtp} disabled={otpLoading}>Resend code</button>
                        <div className="flex gap-2">
                            <Button variant="secondary" type="button" onClick={()=>setOtpOpen(false)} disabled={otpLoading}>Cancel</Button>
                            <Button variant="primary" type="submit" loading={otpLoading} disabled={otpLoading || otpCode.length!==6}>Verify</Button>
                        </div>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isRecoveryModalOpen} onClose={() => setIsRecoveryModalOpen(false)} title="Recuperação de senha" size="small" confirmButtonText="">
                {!recoverySubmitted ? (
                    <form onSubmit={handleRecoverySubmit} className="space-y-4">
                        <div>
                            <p className="mb-4 text-sm text-gray-600">Digite seu e-mail abaixo e enviaremos um link para criar uma nova senha.</p>
                            <Label htmlFor="recovery-email">Email</Label>
                            <Input id="recovery-email" name="recovery-email" type="email" required value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} placeholder="seu@email.com" disabled={recoveryLoading} />
                        </div>
                        {recoveryError && <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700">{recoveryError}</div>}
                        <div className="flex justify-end space-x-2">
                            <Button variant="secondary" onClick={() => setIsRecoveryModalOpen(false)} type="button" disabled={recoveryLoading}>Cancelar</Button>
                            <Button variant="primary" type="submit" loading={recoveryLoading} disabled={recoveryLoading || !recoveryEmail}>Enviar link</Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-700">{recoveryMessage || 'Solicitação processada.'}</p>
                        <div className="flex justify-end">
                            <Button variant="primary" onClick={() => setIsRecoveryModalOpen(false)}>Entendi</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Login;
