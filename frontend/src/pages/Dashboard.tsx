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
    const [showOnly, setShowOnly] = useState<HighlightType>('none');
    const [hiddenPoints, setHiddenPoints] = useState<{ativos: Set<number>; inativos: Set<number>}>({ativos: new Set(), inativos: new Set()});
    const { user, ready } = useAuth();

    // fetchDashboard é usado tanto no mount quanto ao receber eventos externos
    const fetchDashboard = async () => {
        if (!ready || !user) return;
        try {
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
        } catch (err) {
            console.error('Erro ao buscar dashboard:', err);
        }
    };

    useEffect(() => {
        fetchDashboard();

        const handler = () => fetchDashboard();
        window.addEventListener('patients:updated', handler as EventListener);
        return () => {
            window.removeEventListener('patients:updated', handler as EventListener);
        };
    }, [ready, user]);

    const handleHighlight = (datasetLabel: string) => {
        const label = (datasetLabel || '').toString();
        const type: HighlightType = label === 'ativos' || label === 'Pacientes Ativos' || label.includes('Ativos') ? 'ativos'
            : label === 'inativos' || label === 'Pacientes Inativos' || label.includes('Inativos') ? 'inativos'
            : 'none';

        if (highlight === type) {
            setHighlight('none');
        } else {
            setHighlight(type);
        }

        if (showOnly === type) {
            setShowOnly('none');
        } else {
            setShowOnly(type);
        }
    };

    const handleElementToggle = (datasetLabel: string, index: number) => {
        const label = (datasetLabel || '').toString();
        const type: HighlightType = label === 'ativos' || label === 'Pacientes Ativos' || label.includes('Ativos') ? 'ativos'
            : label === 'inativos' || label === 'Pacientes Inativos' || label.includes('Inativos') ? 'inativos'
            : 'none';

        if (type === 'none') return;

        setHiddenPoints(prev => {
            const ativos = new Set(prev.ativos);
            const inativos = new Set(prev.inativos);
            if (type === 'ativos') {
                if (ativos.has(index)) ativos.delete(index); else ativos.add(index);
            } else {
                if (inativos.has(index)) inativos.delete(index); else inativos.add(index);
            }
            return { ativos, inativos };
        });
    };

    const getDatasetConfig = () => {
        const baseAtivos = {
            label: 'Pacientes Ativos',
            data: grafico.map((g, i) => (hiddenPoints.ativos.has(i) ? null : g.ativos)),
            borderColor: '#7ff177',
            backgroundColor: grafico.map((g, i) => hiddenPoints.ativos.has(i) ? 'rgba(127, 241, 119, 0)' : 'rgba(127, 241, 119, 0.28)'),
            tension: 0.4,
            fill: true,
        };

        const baseInativos = {
            label: 'Pacientes Inativos',
            data: grafico.map((g, i) => (hiddenPoints.inativos.has(i) ? null : g.inativos)),
            borderColor: '#E53935',
            backgroundColor: grafico.map((g, i) => hiddenPoints.inativos.has(i) ? 'rgba(229, 57, 53, 0)' : 'rgba(229, 57, 53, 0.28)'),
            tension: 0.4,
            fill: true,
        };

        // Aplicar destaque conforme o estado
        if (highlight === 'ativos') {
            return [
                {
                    ...baseAtivos,
                    borderWidth: 2,
                    borderRadius: 8,
                    barThickness: 48,
                    maxBarThickness: 64,
                    barPercentage: 0.95,
                    categoryPercentage: 0.95,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.32)',
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
                    borderColor: 'rgba(229, 57, 53, 0.5)',
                    backgroundColor: 'rgba(229, 57, 53, 0.20)',
                    pointRadius: 3,
                }
            ];
        }

        if (highlight === 'inativos') {
            return [
                {
                    ...baseAtivos,
                    borderWidth: 1,
                    borderDash: [5, 5],
                    borderColor: 'rgba(127, 241, 119, 0.5)',
                    backgroundColor: 'rgba(127, 241, 119, 0.20)',
                    pointRadius: 3,
                },
                {
                    ...baseInativos,
                    borderWidth: 2,
                    borderRadius: 0,
                    barThickness: 48,
                    maxBarThickness: 64,
                    barPercentage: 0.85,
                    categoryPercentage: 0.85,
                    borderColor: '#C62828',
                    backgroundColor: 'rgba(229, 57, 53, 0.32)',
                    pointBackgroundColor: '#C62828',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                }
            ];
        }

        const datasets = [
            {
                ...baseAtivos,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderRadius: 8,
                barThickness: 40,
                maxBarThickness: 56,
                barPercentage: 0.6,
                categoryPercentage: 0.8,
            },
            {
                ...baseInativos,
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderRadius: 8,
                barThickness: 40,
                maxBarThickness: 56,
                barPercentage: 0.6,
                categoryPercentage: 0.8,
            }
        ];

        if (showOnly === 'ativos') {
            return [{ ...datasets[0], hidden: false }, { ...datasets[1], hidden: true }];
        }
        if (showOnly === 'inativos') {
            return [{ ...datasets[0], hidden: true }, { ...datasets[1], hidden: false }];
        }

        return datasets;
    };

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

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
                        type="bar"
                        data={{
                            labels: grafico.map((g) => monthNames[Math.max(0, Math.min(11, (Number(g.mes || 1) - 1)))]),
                            datasets: getDatasetConfig(),
                        }}
                        onLegendClick={handleHighlight}
                        onElementClick={handleElementToggle}
                        highlightState={highlight}
                    />
                </div>
            </div>
        </MainLayout>
    );
};

export default Dashboard;