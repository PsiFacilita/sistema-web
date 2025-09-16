import axios from 'axios';

const API_URL = (import.meta as any).env?.BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth.token');
    if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.response?.status === 401) {
            // zera o estado local do cliente
            localStorage.removeItem('auth.token');
            localStorage.removeItem('auth.user');
            // volta para a tela de login (no seu app é "/")
            window.location.href = '/';
            return;
        }
        return Promise.reject(err);
    }
);

export default api;
