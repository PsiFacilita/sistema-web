import axios from 'axios';

const API_URL = (import.meta as any).env?.BACKEND_URL || 'http://localhost:5000';

// Adicionando log para verificar a URL da API
console.log("API_URL configurada como:", API_URL);

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth.token');
    console.log("API Request:", {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        tokenStart: token ? token.substring(0, 10) + '...' : 'none'
    });
    
    if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => {
        console.log("API Response:", {
            url: res.config.url,
            status: res.status,
            dataReceived: !!res.data
        });
        return res;
    },
    (err) => {
        console.error("API Error:", {
            url: err.config?.url,
            status: err.response?.status,
            message: err.message,
            data: err.response?.data
        });
        
        if (err?.response?.status === 401) {
            // zera o estado local do cliente
            console.warn("Erro 401 detectado, limpando dados de autenticação");
            localStorage.removeItem('auth.token');
            localStorage.removeItem('auth.user');
            // volta para a tela de login (no seu app é "/")
            window.location.href = '/';
            return;
        }
        return Promise.reject(err);
    }
);

// Verificação do token no carregamento
const token = localStorage.getItem('auth.token');
console.log("Token disponível no carregamento:", token ? "Sim (inicia com " + token.substring(0, 10) + "...)" : "Não");

export default api;
