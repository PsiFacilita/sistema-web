import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import Title from '../components/Title/Title';
import Card from '../components/Card/Card';
import Chart from '../components/Chart/Chart';
import MainLayout from '../components/layout/MainLayout/MainLayout';

type Cards = { ativos: number; inativos: number; agendadas: number; };
type GraficoRow = { mes: number; ativos: number; inativos: number; };

const Dashboard: React.FC = () => {
    const [cards, setCards] = useState<Cards>({ ativos: 0, inativos: 0, agendadas: 0 });
    const [grafico, setGrafico] = useState<GraficoRow[]>([]);
    const { user, ready } = useAuth();

    useEffect(() => {
        if (!ready || !user) return; // evita requisitar antes da auth hidratar
        const fetchDashboard = async () => {
            const res = await api.get('/api/dashboard'); // headers/Authorization já no interceptor
            const data = res.data ?? {};
            setCards({
                ativos: Number(data.cards?.ativos ?? 0),
                inativos: Number(data.cards?.inativos ?? 0),
                agendadas: Number(data.cards?.agendadas ?? 0),
            });
            const graficoRows: GraficoRow[] = Array.isArray(data.grafico)
                ? data.grafico.map((g: any) => ({
                    mes: Number(g.mes ?? 0),
                    ativos: Number(g.ativos ?? 0),
                    inativos: Number(g.inativos ?? 0),
                }))
                : [];
            setGrafico(graficoRows);
        };
        fetchDashboard();
    }, [ready, user]);

    const dashboardCards = [
        { title: 'Pacientes Ativos', value: cards.ativos, description: '' },
        { title: 'Pacientes Inativos', value: cards.inativos, description: '' },
        { title: 'Consultas Agendadas', value: cards.agendadas, description: '' },
    ];

    return (
        <MainLayout>
            <Title level={1} className="text-xl md:text-3xl">Dashboard</Title>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                {dashboardCards.map((card, i) => (
                    <Card key={i} title={card.title} className="h-full">
                        <p className="text-3xl font-semibold text-gray-900">{card.value}</p>
                        <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                    </Card>
                ))}
            </div>

            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
                <Title level={2} className="text-lg md:text-xl mb-3 md:mb-4">Pacientes Cadastrados</Title>
                <Chart data={{
                    labels: grafico.map((g) => `Mês ${g.mes}`),
                    datasets: [
                        { label: 'Pacientes Ativos', data: grafico.map((g) => g.ativos), backgroundColor: '#065f46' },
                        { label: 'Pacientes Inativos', data: grafico.map((g) => g.inativos), backgroundColor: '#903A1D' },
                    ],
                }} />
            </div>
        </MainLayout>
    );
};

export default Dashboard;
