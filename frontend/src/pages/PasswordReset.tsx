import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card/Card';
import Input from '../components/Form/Input';

const API_URL =
    (import.meta as any).env?.VITE_BACKEND_URL ||
    (import.meta as any).env?.BACKEND_URL ||
    'http://localhost:5000';

const PasswordReset: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [valid, setValid] = useState(false);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitMsg, setSubmitMsg] = useState('');

    useEffect(() => {
        let active = true;
        const run = async () => {
            if (!token) {
                navigate('/', { replace: true });
                return;
            }
            try {
                const res = await fetch(`${API_URL}/auth/password/validate/${encodeURIComponent(token)}`);
                const data = await res.json().catch(() => ({}));
                if (!active) return;
                if (!res.ok || !data?.ok) {
                    navigate('/', { replace: true });
                    return;
                }
                setValid(true);
            } catch {
                navigate('/', { replace: true });
            } finally {
                if (active) setLoading(false);
            }
        };
        run();
        return () => {
            active = false;
        };
    }, [token, navigate]);

    const handlePasswordReset = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!token) return;
        if (password !== confirm) {
            setSubmitMsg('As senhas não conferem.');
            return;
        }
        setSubmitting(true);
        setSubmitMsg('');
        try {
            const res = await fetch(`${API_URL}/auth/password/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password, password_confirmation: confirm }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.ok === false) {
                setSubmitMsg(data?.message || 'Não foi possível redefinir a senha.');
                return;
            }
            setSubmitMsg(data?.message || 'Senha redefinida com sucesso.');
            setTimeout(() => navigate('/', { replace: true }), 1500);
        } catch {
            setSubmitMsg('Não foi possível redefinir a senha.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">Carregando…</div>;
    if (!valid) return <></>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-semibold text-center text-gray-800 mb-2">Redefinir Senha</h1>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-gray-700 mb-1 pl-3" htmlFor="new-password">Nova Senha</label>
                        <Input
                            id="new-password"
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword((e.target as HTMLInputElement).value)}
                            className="w-full p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={submitting}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-gray-700 mb-1 pl-3" htmlFor="confirm-password">Confirmar Nova Senha</label>
                        <Input
                            id="confirm-password"
                            type="password"
                            required
                            value={confirm}
                            onChange={e => setConfirm((e.target as HTMLInputElement).value)}
                            className="w-full p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={submitting}
                        />
                    </div>
                    {submitMsg && <div className="text-sm text-center text-gray-700">{submitMsg}</div>}
                    <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-60"
                        disabled={submitting || !password || !confirm || password !== confirm}
                    >
                        Redefinir Senha
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default PasswordReset;
