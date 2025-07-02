import { useEffect, useState } from 'react';
import axios from 'axios';
import Title from '../components/Title/Title';
import Card from '../components/Card/Card';
import Chart from '../components/Chart/Chart';
import MainLayout from '../components/layout/MainLayout/MainLayout';

const Dashboard: React.FC = () => {
  const [cards, setCards] = useState({
    ativos: 0,
    inativos: 0,
    agendadas: 0,
  });
  const [grafico, setGrafico] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/dashboard', {
          withCredentials: true,
        });
        setCards(response.data.cards);
        setGrafico(response.data.grafico);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      }
    };

    fetchDashboard();
  }, []);

  const dashboardCards = [
    {
      title: 'Pacientes Ativos',
      value: cards.ativos,
      description: '',
    },
    {
      title: 'Pacientes Inativos',
      value: cards.inativos,
      description: '',
    },
    {
      title: 'Consultas Agendadas',
      value: cards.agendadas,
      description: '',
    },
  ];

  const chartData = {
    labels: grafico.map((g) => `Mês ${g.mes}`),
    datasets: [
      {
        label: 'Pacientes Ativos',
        data: grafico.map((g) => g.ativos),
        backgroundColor: '#065f46',
      },
      {
      label: 'Pacientes Inativos',
      data: grafico.map((g) => g.inativos),
      backgroundColor: '#903A1D',
      },
    ],
  };

  return (
    <MainLayout>
      <Title level={1} className="text-xl md:text-3xl">Dashboard</Title>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {dashboardCards.map((card, index) => (
          <Card
            key={index}
            title={card.title}
            className="h-full"
          >
            <p className="text-3xl font-semibold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.description}</p>
          </Card>
        ))}
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow">
        <Title level={2} className="text-lg md:text-xl mb-3 md:mb-4">
          Pacientes Cadastrados
        </Title>
        <Chart data={chartData} />
      </div>
    </MainLayout>
  );
};

export default Dashboard;