import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import Title from '../components/Title/Title';
import Card from '../components/Card/Card';
import Chart from '../components/Chart/Chart';
import MainLayout from '../components/layout/MainLayout/MainLayout';

type Cards = { ativos: number; inativos: number; agendadas: number; };
type GraficoRow = { mes: number; ativos: number; inativos: number; };

type HighlightType = 'ativos' | 'inativos' | 'none';

const Dashboard: React.FC = () => {
    const [cards, setCards] = useState<Cards>({ ativos: 0, inativos: 0, agendadas: 0 });
    const [grafico, setGrafico] = useState<GraficoRow[]>([]);
    const [highlight, setHighlight] = useState<HighlightType>('none');
    const { user, ready } = useAuth();

    useEffect(() => {
        if (!ready || !user) return;
        const fetchDashboard = async () => {
            const res = await api.get('/api/dashboard');
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

    const handleHighlight = (type: HighlightType) => {
        if (highlight === type) {
            setHighlight('none'); // Clique novamente para remover o destaque
        } else {
            setHighlight(type);
        }
    };

    const getDatasetConfig = () => {
        const baseAtivos = {
            label: 'Pacientes Ativos',
            data: grafico.map((g) => g.ativos),
            borderColor: '#7ff177',
            backgroundColor: 'rgba(127, 241, 119, 0.1)',
            tension: 0.4,
            fill: true,
        };

        const baseInativos = {
            label: 'Pacientes Inativos',
            data: grafico.map((g) => g.inativos),
            borderColor: '#116917',
            backgroundColor: 'rgba(17, 105, 23, 0.1)',
            tension: 0.4,
            fill: true,
        };

        // Aplicar destaque conforme o estado
        if (highlight === 'ativos') {
            return [
                {
                    ...baseAtivos,
                    borderWidth: 4,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    pointBackgroundColor: '#4CAF50',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                },
                {
                    ...baseInativos,
                    borderWidth: 1,
                    borderDash: [5, 5],
                    borderColor: 'rgba(17, 105, 23, 0.5)',
                    backgroundColor: 'rgba(17, 105, 23, 0.05)',
                    pointRadius: 3,
                }
            ];
        } else if (highlight === 'inativos') {
            return [
                {
                    ...baseAtivos,
                    borderWidth: 1,
                    borderDash: [5, 5],
                    borderColor: 'rgba(127, 241, 119, 0.5)',
                    backgroundColor: 'rgba(127, 241, 119, 0.05)',
                    pointRadius: 3,
                },
                {
                    ...baseInativos,
                    borderWidth: 4,
                    borderColor: '#2E7D32',
                    backgroundColor: 'rgba(46, 125, 50, 0.2)',
                    pointBackgroundColor: '#2E7D32',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                }
            ];
        } else {
            return [
                {
                    ...baseAtivos,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                },
                {
                    ...baseInativos,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                }
            ];
        }
    };

    const dashboardCards = [
        { 
            title: 'Pacientes Ativos', 
            value: cards.ativos,
        },
        { 
            title: 'Pacientes Inativos', 
            value: cards.inativos,
        },
        { 
            title: 'Consultas Agendadas', 
            value: cards.agendadas,
        },
    ];

    return (
        <MainLayout>
            <Title level={1} className="text-sage-700">Dashboard</Title>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {dashboardCards.map((card, i) => (
                    <Card 
                        key={i}
                        variant="elevated"
                        className="h-full bg-white text-sage-800 border-0 hover:scale-105 transition-all duration-300 p-4 sm:p-6"
                    >
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-light mb-2">{card.value}</p>
                        <p className="text-sage-600 font-medium text-sm sm:text-base">{card.title}</p>
                    </Card>
                ))}
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-sage-100">
                <Title level={2} className="text-sage-700 mb-3 sm:mb-4 text-lg sm:text-xl">Evolução de Pacientes</Title>
                <div className="overflow-x-auto">
                    <Chart 
                        type="line"
                        data={{
                            labels: grafico.map((g) => `Mês ${g.mes}`),
                            datasets: getDatasetConfig(),
                        }}
                        onLegendClick={handleHighlight}
                        highlightState={highlight}
                    />
                </div>
            </div>
        </MainLayout>
    );
};

export default Dashboard;