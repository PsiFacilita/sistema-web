import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
    }[];
  };
}

const Chart: React.FC<ChartProps> = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Permite redimensionamento livre
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12, // Tamanho reduzido da legenda em mobile
          font: {
            size: window.innerWidth < 768 ? 10 : 12, // Fonte adaptável
          },
        },
      },
      title: {
        display: true,
        text: 'Estatísticas de Pacientes',
        font: {
          size: window.innerWidth < 768 ? 14 : 16,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
      },
    },
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[300px] h-64 md:h-80"> {/* Largura mínima + altura responsiva */}
        <Bar options={options} data={data} />
      </div>
    </div>
  );
};

export default Chart;