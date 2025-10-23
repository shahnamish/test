import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { fetchMarketById } from '../services/bettingService';
import { Market } from '../types/bet';
import { formatCurrency, formatOdds } from '../utils/formatters';

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const EventInfo = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const EventTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const EventMeta = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textLight};
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const Select = styled.select`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.white};
  transition: border-color ${({ theme }) => theme.transitions.base};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.white};
  transition: border-color ${({ theme }) => theme.transitions.base};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Summary = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const SummaryLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textLight};
`;

const SummaryValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border: 2px solid ${({ theme, $variant }) => ($variant === 'primary' ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme, $variant }) => ($variant === 'primary' ? theme.colors.white : theme.colors.text)};
  background: ${({ theme, $variant }) => ($variant === 'primary' ? theme.colors.primary : theme.colors.white)};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    background: ${({ theme, $variant }) => ($variant === 'primary' ? '#1e40af' : theme.colors.backgroundAlt)};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  color: #16a34a;
  text-align: center;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textLight};
`;

const OrderPlacement = () => {
  const { marketId } = useParams<{ marketId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const locationMarket = location.state?.market as Market | undefined;
  const [market, setMarket] = useState<Market | null>(locationMarket ?? null);
  const [selectedOption, setSelectedOption] = useState('');
  const [stake, setStake] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(!locationMarket && !!marketId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (locationMarket || !marketId) {
      return;
    }

    let isActive = true;

    const loadMarket = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedMarket = await fetchMarketById(marketId);
        if (!isActive) {
          return;
        }
        if (fetchedMarket) {
          setMarket(fetchedMarket);
        } else {
          setError('Market not found. Please return to the bet scanner and try again.');
        }
      } catch (err) {
        if (isActive) {
          setError('Unable to load market data. Please try again later.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadMarket();

    return () => {
      isActive = false;
    };
  }, [locationMarket, marketId]);

  useEffect(() => {
    if (market && market.options.length > 0 && !selectedOption) {
      setSelectedOption(market.options[0].id);
    }
  }, [market, selectedOption]);

  if (loading) {
    return (
      <Container>
        <PageTitle>Order Placement</PageTitle>
        <Card>
          <LoadingState>Loading market details...</LoadingState>
        </Card>
      </Container>
    );
  }

  if (error || !market) {
    return (
      <Container>
        <PageTitle>Order Placement</PageTitle>
        <Card>
          <p>{error ?? 'Market not found. Please return to the bet scanner and try again.'}</p>
          <Button onClick={() => navigate('/bet-scanner')} $variant="primary">
            Back to Bet Scanner
          </Button>
        </Card>
      </Container>
    );
  }

  const selectedOptionData = market.options.find((opt) => opt.id === selectedOption);
  const stakeValue = parseFloat(stake) || 0;
  const potentialReturn = stakeValue * (selectedOptionData?.odds ?? 0);
  const potentialProfit = potentialReturn - stakeValue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    setTimeout(() => {
      navigate('/portfolio-dashboard');
    }, 2000);
  };

  if (submitted) {
    return (
      <Container>
        <PageTitle>Order Placement</PageTitle>
        <Card>
          <SuccessMessage>
            <h2>Order Placed Successfully!</h2>
            <p>Redirecting to your portfolio dashboard...</p>
          </SuccessMessage>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <PageTitle>Place Order</PageTitle>

      <EventInfo>
        <EventTitle>{market.eventName}</EventTitle>
        <EventMeta>
          {market.category} • {market.name}
        </EventMeta>
      </EventInfo>

      <Card>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="selection">Your Selection</Label>
            <Select id="selection" value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)} required>
              {market.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} ({formatOdds(option.odds)})
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="stake">Stake Amount ($)</Label>
            <Input
              id="stake"
              type="number"
              min="1"
              step="1"
              placeholder="Enter your stake"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              required
            />
          </FormGroup>

          {stakeValue > 0 && selectedOptionData && (
            <Summary>
              <SummaryItem>
                <SummaryLabel>Stake</SummaryLabel>
                <SummaryValue>{formatCurrency(stakeValue)}</SummaryValue>
              </SummaryItem>
              <SummaryItem>
                <SummaryLabel>Odds</SummaryLabel>
                <SummaryValue>{formatOdds(selectedOptionData.odds)}</SummaryValue>
              </SummaryItem>
              <SummaryItem>
                <SummaryLabel>Potential Return</SummaryLabel>
                <SummaryValue>{formatCurrency(potentialReturn)}</SummaryValue>
              </SummaryItem>
              <SummaryItem>
                <SummaryLabel>Potential Profit</SummaryLabel>
                <SummaryValue style={{ color: '#16a34a' }}>{formatCurrency(potentialProfit)}</SummaryValue>
              </SummaryItem>
            </Summary>
          )}

          <ButtonGroup>
            <Button type="button" onClick={() => navigate('/bet-scanner')}>
              Cancel
            </Button>
            <Button type="submit" $variant="primary" disabled={!stakeValue || stakeValue <= 0}>
              Place Order
            </Button>
          </ButtonGroup>
        </Form>
      </Card>
    </Container>
  );
};

export default OrderPlacement;
