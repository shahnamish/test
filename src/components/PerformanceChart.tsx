import { useMemo } from 'react';
import styled from 'styled-components';
import { PerformanceData } from '../types/bet';

type PerformanceChartProps = {
  data: PerformanceData[];
};

const ChartContainer = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
`;

const ChartTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.text};
`;

const ChartSvg = styled.svg`
  width: 100%;
  height: 300px;
  overflow: visible;
`;

const AxisLabel = styled.text`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  fill: ${({ theme }) => theme.colors.textLight};
`;

const GridLine = styled.line`
  stroke: ${({ theme }) => theme.colors.border};
  stroke-width: 1;
`;

const PerformanceChart = ({ data }: PerformanceChartProps) => {
  const { points, minProfit, maxProfit } = useMemo(() => {
    if (data.length === 0) {
      return { points: [], minProfit: 0, maxProfit: 0 };
    }

    const profits = data.map((d) => d.cumulativeProfit);
    const min = Math.min(...profits, 0);
    const max = Math.max(...profits);

    return { points: data, minProfit: min, maxProfit: max };
  }, [data]);

  const chartWidth = 800;
  const chartHeight = 300;
  const padding = 50;
  const graphWidth = chartWidth - padding * 2;
  const graphHeight = chartHeight - padding * 2;

  const scaleX = graphWidth / Math.max(points.length - 1, 1);
  const scaleY = maxProfit === minProfit ? 1 : graphHeight / (maxProfit - minProfit);

  const pathData = points
    .map((point, index) => {
      const x = padding + index * scaleX;
      const y = padding + graphHeight - (point.cumulativeProfit - minProfit) * scaleY;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const areaPath = points.length > 0 ? `${pathData} L ${padding + (points.length - 1) * scaleX} ${padding + graphHeight} L ${padding} ${padding + graphHeight} Z` : '';

  const gridLines = [];
  const numLines = 5;
  for (let i = 0; i <= numLines; i++) {
    const y = padding + (i * graphHeight) / numLines;
    const value = maxProfit - (i * (maxProfit - minProfit)) / numLines;
    gridLines.push({ y, value });
  }

  return (
    <ChartContainer>
      <ChartTitle>Cumulative Profit Over Time</ChartTitle>
      <ChartSvg viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <defs>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {gridLines.map(({ y, value }, index) => (
          <g key={index}>
            <GridLine x1={padding} y1={y} x2={chartWidth - padding} y2={y} />
            <AxisLabel x={padding - 10} y={y + 4} textAnchor="end">
              ${Math.round(value)}
            </AxisLabel>
          </g>
        ))}

        {points.length > 0 && (
          <>
            <path d={areaPath} fill="url(#areaGradient)" />
            <path d={pathData} fill="none" stroke="#2563eb" strokeWidth="3" />

            {points.map((point, index) => {
              const x = padding + index * scaleX;
              const y = padding + graphHeight - (point.cumulativeProfit - minProfit) * scaleY;
              return (
                <g key={index}>
                  <circle cx={x} cy={y} r="5" fill="#2563eb" />
                  {index % 2 === 0 && (
                    <AxisLabel x={x} y={chartHeight - padding + 20} textAnchor="middle">
                      {new Date(point.date).toLocaleDateString('en-US', { month: 'short' })}
                    </AxisLabel>
                  )}
                </g>
              );
            })}
          </>
        )}
      </ChartSvg>
    </ChartContainer>
  );
};

export default PerformanceChart;
