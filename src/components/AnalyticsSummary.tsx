import styled from 'styled-components';
import { PortfolioStats, PerformanceData } from '../types/bet';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

interface AnalyticsSummaryProps {
  stats: PortfolioStats;
  performance: PerformanceData[];
}

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const SummaryCard = styled.div<{ $accent?: 'primary' | 'neutral' | 'success' | 'warning' | 'info' }>`
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  ${({ $accent }) => {
    switch ($accent) {
      case 'primary':
        return 'border-color: rgba(37,99,235,0.2); box-shadow: 0 10px 30px -12px rgba(37,99,235,0.4);';
      case 'success':
        return 'border-color: rgba(34,197,94,0.25); box-shadow: 0 10px 30px -12px rgba(34,197,94,0.4);';
      case 'warning':
        return 'border-color: rgba(249,115,22,0.25); box-shadow: 0 10px 30px -12px rgba(249,115,22,0.4);';
      case 'info':
        return 'border-color: rgba(96,165,250,0.25); box-shadow: 0 10px 30px -12px rgba(96,165,250,0.35);';
      default:
        return '';
    }
  }};
`;

const Label = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Value = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Subtext = styled.div<{ $positive?: boolean; $negative?: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme, $positive, $negative }) => {
    if ($positive) return '#16a34a';
    if ($negative) return '#dc2626';
    return theme.colors.textLight;
  }};
`;

const SplitRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SummaryList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const SummaryItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textLight};

  & + & {
    margin-top: ${({ theme }) => theme.spacing.sm};
  }
`;

const AnalyticsSummary = ({ stats, performance }: AnalyticsSummaryProps) => {
  const lastPeriod = performance[performance.length - 1];
  const previousPeriod = performance[performance.length - 2];
  const profitDelta = lastPeriod && previousPeriod ? lastPeriod.profit - previousPeriod.profit : 0;
  const cumulativeChange = lastPeriod && previousPeriod ? lastPeriod.cumulativeProfit - previousPeriod.cumulativeProfit : 0;

  const avgMonthlyProfit = performance.length
    ? performance.reduce((sum, period) => sum + period.profit, 0) / performance.length
    : 0;

  const avgBetsPerMonth = performance.length
    ? performance.reduce((sum, period) => sum + period.betsPlaced, 0) / performance.length
    : 0;

  return (
    <SummaryGrid>
      <SummaryCard $accent="primary">
        <Label>Total Portfolio Value</Label>
        <Value>{formatCurrency(stats.totalReturns)}</Value>
        <Subtext $positive={stats.netProfit >= 0} $negative={stats.netProfit < 0}>
          Net profit {formatCurrency(stats.netProfit)} | ROI {formatPercent(stats.roi)}
        </Subtext>
      </SummaryCard>

      <SummaryCard $accent="success">
        <Label>Monthly Performance</Label>
        <SplitRow>
          <Value>{formatCurrency(lastPeriod ? lastPeriod.profit : 0)}</Value>
          <Subtext $positive={profitDelta >= 0} $negative={profitDelta < 0}>
            {profitDelta >= 0 ? '+' : ''}
            {formatCurrency(profitDelta)} vs previous month
          </Subtext>
        </SplitRow>
        <Subtext>{formatCurrency(avgMonthlyProfit)} average monthly profit</Subtext>
      </SummaryCard>

      <SummaryCard $accent="info">
        <Label>Performance Metrics</Label>
        <SummaryList>
          <SummaryItem>
            <span>Win rate</span>
            <span>{formatPercent(stats.winRate)}</span>
          </SummaryItem>
          <SummaryItem>
            <span>Total bets</span>
            <span>{formatNumber(stats.totalBets)}</span>
          </SummaryItem>
          <SummaryItem>
            <span>Winning bets</span>
            <span>{formatNumber(stats.wonBets)}</span>
          </SummaryItem>
          <SummaryItem>
            <span>Pending bets</span>
            <span>{formatNumber(stats.pendingBets)}</span>
          </SummaryItem>
        </SummaryList>
      </SummaryCard>

      <SummaryCard $accent="warning">
        <Label>Engagement</Label>
        <SplitRow>
          <Value>{formatNumber(Math.round(avgBetsPerMonth))}</Value>
          <Subtext>{Math.round(avgBetsPerMonth)} bets per month</Subtext>
        </SplitRow>
        <Subtext $positive={cumulativeChange >= 0} $negative={cumulativeChange < 0}>
          {cumulativeChange >= 0 ? '+' : ''}
          {formatCurrency(cumulativeChange)} cumulative change
        </Subtext>
      </SummaryCard>
    </SummaryGrid>
  );
};

export default AnalyticsSummary;
