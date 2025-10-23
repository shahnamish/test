import { useEffect, useState } from 'react';
import styled from 'styled-components';
import AnalyticsSummary from '../components/AnalyticsSummary';
import BetHistoryTable from '../components/BetHistoryTable';
import PerformanceChart from '../components/PerformanceChart';
import { fetchBetHistory, fetchPerformance, fetchPortfolioStats } from '../services/bettingService';
import { Bet, BetFilters, PerformanceData, PortfolioStats } from '../types/bet';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const FilterContainer = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const Select = styled.select`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.white};
  transition: border-color ${({ theme }) => theme.transitions.base};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.white};
  transition: border-color ${({ theme }) => theme.transitions.base};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.textLight};
`;

const ErrorState = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  color: #dc2626;
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const PortfolioDashboard = () => {
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [betHistory, setBetHistory] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<BetFilters>({
    marketType: undefined,
    status: undefined,
    searchQuery: '',
  });

  useEffect(() => {
    let isActive = true;

    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsData, performanceData] = await Promise.all([
          fetchPortfolioStats(),
          fetchPerformance(),
        ]);
        if (!isActive) {
          return;
        }
        setStats(statsData);
        setPerformance(performanceData);
      } catch (err) {
        if (isActive) {
          setError('Failed to load portfolio data. Please try again later.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void fetchOverview();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchBets = async () => {
      try {
        const bets = await fetchBetHistory(filters);
        if (!isActive) {
          return;
        }
        setBetHistory(bets);
      } catch (err) {
        if (isActive) {
          setError('Failed to load bet history. Please try again later.');
        }
      }
    };

    void fetchBets();

    return () => {
      isActive = false;
    };
  }, [filters]);

  const handleFilterChange = <K extends keyof BetFilters>(key: K, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : (value as BetFilters[K]),
    }));
  };

  if (loading) {
    return (
      <Container>
        <PageTitle>Portfolio Dashboard</PageTitle>
        <LoadingState>Loading portfolio data...</LoadingState>
      </Container>
    );
  }

  if (error && !stats) {
    return (
      <Container>
        <PageTitle>Portfolio Dashboard</PageTitle>
        <ErrorState>{error}</ErrorState>
      </Container>
    );
  }

  return (
    <Container>
      <PageTitle>Portfolio Dashboard</PageTitle>

      {stats && (
        <Section>
          <AnalyticsSummary stats={stats} performance={performance} />
        </Section>
      )}

      {performance.length > 0 && (
        <Section>
          <PerformanceChart data={performance} />
        </Section>
      )}

      <Section>
        <FilterContainer>
          <FilterGrid>
            <FilterGroup>
              <Label htmlFor="marketType">Market Type</Label>
              <Select
                id="marketType"
                value={filters.marketType ?? ''}
                onChange={(e) => handleFilterChange('marketType', e.target.value)}
              >
                <option value="">All Markets</option>
                <option value="sports">Sports</option>
                <option value="esports">Esports</option>
                <option value="casino">Casino</option>
                <option value="politics">Politics</option>
              </Select>
            </FilterGroup>
            <FilterGroup>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={filters.status ?? ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </FilterGroup>
            <FilterGroup>
              <Label htmlFor="searchQuery">Search</Label>
              <Input
                id="searchQuery"
                type="text"
                placeholder="Search by event or selection..."
                value={filters.searchQuery ?? ''}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              />
            </FilterGroup>
          </FilterGrid>
        </FilterContainer>

        <BetHistoryTable bets={betHistory} />
      </Section>
    </Container>
  );
};

export default PortfolioDashboard;
