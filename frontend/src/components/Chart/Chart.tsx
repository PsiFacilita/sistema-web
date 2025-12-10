import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
  type?: 'line';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor?: string;
      tension?: number;
      fill?: boolean;
      borderWidth?: number;
      borderDash?: number[];
      pointRadius?: number;
      pointHoverRadius?: number;
      pointBackgroundColor?: string;
      pointBorderColor?: string;
      pointBorderWidth?: number;
    }[];
  };
  onLegendClick?: (datasetLabel: string) => void;
  highlightState?: 'ativos' | 'inativos' | 'none';
}

const Chart: React.FC<ChartProps> = ({ data, onLegendClick, highlightState }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#6B7280',
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'system-ui'
          },
          // Tornar a legenda clicável
          generateLabels: (chart: any) => {
            const original = ChartJS.defaults.plugins.legend.labels.generateLabels;
            const labels = original.call(this, chart);
            
            return labels.map(label => {
              // Adicionar estilo de destaque baseado no highlightState
              const isHighlighted = 
                (highlightState === 'ativos' && label.text === 'Pacientes Ativos') ||
                (highlightState === 'inativos' && label.text === 'Pacientes Inativos');
              
              return {
                ...label,
                // Estilo para legenda destacada
                font: {
                  ...label.font,
                  weight: isHighlighted ? 'bold' : 'normal'
                },
                // Adicionar indicador visual para legenda destacada
                text: isHighlighted ? `★ ${label.text}` : label.text,
                // Tornar clicável
                onClick: (e: any) => {
                  if (onLegendClick) {
                    const type = label.text === 'Pacientes Ativos' ? 'ativos' : 
                                label.text === 'Pacientes Inativos' ? 'inativos' : 'none';
                    onLegendClick(type);
                  }
                }
              };
            });
          }
        },
        onClick: (e: any, legendItem: any, legend: any) => {
          // Prevenir o comportamento padrão de mostrar/esconder dataset
          e.stopPropagation();
        }
      },
      tooltip: {
        backgroundColor: '#4B5563',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#6B7280' }
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#6B7280' },
        beginAtZero: true
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        backgroundColor: '#fff',
        borderWidth: 2
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    hover: {
      mode: 'nearest' as const,
      intersect: true
    }
  };

  return (
    <div className="w-full">
      <div className="h-80">
        <Line options={options} data={data} />
      </div>
    </div>
  );
};

export default Chart;