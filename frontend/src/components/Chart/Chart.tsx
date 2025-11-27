import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
  type?: 'line' | 'bar';
    data: {
    labels: string[];
    datasets: {
      label: string;
      data: (number | null)[];
      borderColor: string | string[];
      backgroundColor?: string | string[];
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
  onElementClick?: (datasetLabel: string, index: number) => void;
  highlightState?: 'ativos' | 'inativos' | 'none';
}

const Chart: React.FC<ChartProps> = ({ type = 'line', data, onLegendClick, onElementClick, highlightState }) => {
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 8,
        bottom: 8,
        left: 6,
        right: 6
      }
    },
    animation: {
      duration: 800,
      easing: 'easeOutCubic'
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#374151',
          usePointStyle: true,
          padding: 16,
          boxWidth: 12,
          font: {
            size: 13,
            family: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
            weight: '600' as any
          },
          generateLabels: (chart: any) => {
            const original = (ChartJS.defaults.plugins && ChartJS.defaults.plugins.legend && ChartJS.defaults.plugins.legend.labels && ChartJS.defaults.plugins.legend.labels.generateLabels) as any;
            const labels = typeof original === 'function' ? original(chart) : [];

            return labels.map((label: any) => {
              const plainText = String(label.text || '');
              const isHighlighted =
                (highlightState === 'ativos' && plainText.includes('Ativos')) ||
                (highlightState === 'inativos' && plainText.includes('Inativos'));

              return {
                ...label,
                // Estilo para legenda destacada
                // Adicionar indicador visual para legenda destacada
                // Tornar clicável
                text: isHighlighted ? `★ ${plainText}` : plainText,
                onClick: (ev: any) => {
                  if (onLegendClick) onLegendClick(plainText);
                }
              };
            });
          }
          // Prevenir o comportamento padrão de mostrar/esconder dataset
        }
      },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#F9FAFB',
        bodyColor: '#E6E7E9',
        titleFont: { size: 13, family: 'Inter, system-ui' },
        bodyFont: { size: 12, family: 'Inter, system-ui' },
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            const value = context.formattedValue;
            return `${value} paciente${Number(value) === 1 ? '' : 's'}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(15,23,42,0.03)', display: false },
        ticks: { color: '#6B7280', padding: 8, maxRotation: 0 }
      },
      y: {
        grid: { color: 'rgba(15,23,42,0.04)' },
        ticks: {
          color: '#6B7280',
          stepSize: 1,
          padding: 8,
          callback: (val: any) => String(val)
        },
        beginAtZero: true
      }
    },
    elements: {
      bar: {
       borderRadius: 12,
        borderSkipped: false,
        maxBarThickness: 36,
        barPercentage: 0.72,
        categoryPercentage: 0.8
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        backgroundColor: '#fff',
        borderWidth: 2
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    hover: {
      mode: 'nearest' as const,
      intersect: true
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-4">
      <div className="h-80">
        {type === 'bar' ? (
          <Bar
            options={options}
            data={data}
            onClick={(event, elements) => {
              try {
                if (elements && (elements as any).length > 0) {
                  const el = (elements as any)[0];
                  const datasetIndex = el.datasetIndex as number;
                  const dataIndex = el.index as number;
                  const label = data.datasets?.[datasetIndex]?.label;
                  if (label && typeof onElementClick === 'function') onElementClick(String(label), dataIndex);
                }
              } catch (e) {
              
              }
            }}
          />
        ) : (
          <Line
            options={options}
            data={data}
            onClick={(event, elements) => {
              try {
                if (elements && (elements as any).length > 0) {
                  const el = (elements as any)[0];
                  const datasetIndex = el.datasetIndex as number;
                  const dataIndex = el.index as number;
                  const label = data.datasets?.[datasetIndex]?.label;
                  if (label && typeof onElementClick === 'function') onElementClick(String(label), dataIndex);
                }
              } catch (e) {
                // ignore
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Chart;