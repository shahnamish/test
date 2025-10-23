import { useEffect, useState } from 'react';
import styled from 'styled-components';
import MarketCard from '../components/MarketCard';
import { fetchMarkets, fetchPopularMarkets } from '../services/bettingService';
import { Market, MarketFilters } from '../types/bet';

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

const FilterSection = styled.section`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.sm};
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: ${({ theme }) => theme.colors.primary};
`;

const CheckboxLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
`;

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const MarketGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
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

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing['3xl']};
  text-align: center;
  color: ${({ theme }) => theme.colors.textLight};

  h3 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.base};
  }
`;

const ErrorState = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  color: #dc2626;
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const BetScanner = () => {
  const [popularMarkets, setPopularMarkets] = useState<Market[]>([]);
  const [allMarkets, setAllMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<MarketFilters>({
    type: undefined,
    category: undefined,
    searchQuery: '',
    popularOnly: false,
  });

  useEffect(() => {
    let isActive = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [popular, all] = await Promise.all([fetchPopularMarkets(), fetchMarkets(filters)]);

        if (!isActive) {
          return;
        }

        setPopularMarkets(popular);
        setAllMarkets(all);
      } catch (err) {
        if (isActive) {
          setError('Failed to load markets. Please try again later.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isActive = false;
    };
  }, [filters]);

  const handleFilterChange = <K extends keyof MarketFilters>(key: K, value: string | boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: typeof value === 'string' && value === '' ? undefined : (value as MarketFilters[K]),
    }));
  };

  if (loading) {
    return (
      <Container>
        <PageTitle>Bet Scanner</PageTitle>
        <LoadingState>Loading available markets...</LoadingState>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <PageTitle>Bet Scanner</PageTitle>
        <ErrorState>{error}</ErrorState>
      </Container>
    );
  }

  return (
    <Container>
      <PageTitle>Bet Scanner</PageTitle>

      <FilterSection>
        <FilterGrid>
          <FilterGroup>
            <Label htmlFor="marketType">Market Type</Label>
            <Select
              id="marketType"
              value={filters.type ?? ''}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="sports">Sports</option>
              <option value="esports">Esports</option>
              <option value="casino">Casino</option>
              <option value="politics">Politics</option>
            </Select>
          </FilterGroup>

          <FilterGroup>
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={filters.category ?? ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="NFL">NFL</option>
              <option value="NBA">NBA</option>
              <option value="Premier League">Premier League</option>
              <option value="Champions League">Champions League</option>
              <option value="CS:GO">CS:GO</option>
              <option value="Tennis">Tennis</option>
              <option value="Elections">Elections</option>
            </Select>
          </FilterGroup>

          <FilterGroup>
            <Label htmlFor="searchQuery">Search</Label>
            <Input
              id="searchQuery"
              type="text"
              placeholder="Search events, markets..."
              value={filters.searchQuery ?? ''}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            />
          </FilterGroup>

          <FilterGroup>
            <Label>&nbsp;</Label>
            <CheckboxContainer>
              <Checkbox
                id="popularOnly"
                type="checkbox"
                checked={filters.popularOnly ?? false}
                onChange={(e) => handleFilterChange('popularOnly', e.target.checked)}
              />
              <CheckboxLabel htmlFor="popularOnly">Show popular bets only</CheckboxLabel>
            </CheckboxContainer>
          </FilterGroup>
        </FilterGrid>
      </FilterSection>

      {!filters.popularOnly && popularMarkets.length > 0 && (
        <Section>
          <SectionTitle>Popular Markets</SectionTitle>
          <MarketGrid>
            {popularMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </MarketGrid>
        </Section>
      )}

      <Section>
        <SectionTitle>All Markets</SectionTitle>
        {allMarkets.length === 0 ? (
          <EmptyState>
            <h3>No markets found</h3>
            <p>Try adjusting your filters to see more results.</p>
          </EmptyState>
        ) : (
          <MarketGrid>
            {allMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </MarketGrid>
        )}
      </Section>
    </Container>
  );
};

export default BetScanner;
