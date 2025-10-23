import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { Market } from '../types/bet';
import { formatOdds } from '../utils/formatters';

type MarketCardProps = {
  market: Market;
};

const Card = styled.article<{ $highlight: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.white};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: transform ${({ theme }) => theme.transitions.base}, box-shadow ${({ theme }) => theme.transitions.base};

  ${({ $highlight }) =>
    $highlight &&
    css`
      border-color: rgba(37, 99, 235, 0.3);
      box-shadow: 0 20px 40px -20px rgba(37, 99, 235, 0.45);
    `}

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Category = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.secondary};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textLight};
  margin: 0;
`;

const OptionsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const OptionCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.backgroundAlt};
`;

const OptionName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const OptionMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
`;

const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`;

const StartTime = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textLight};
`;

const PopularBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.white};
  background: ${({ theme }) => theme.colors.primary};
`;

const ActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.white};
  text-decoration: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  transition: background ${({ theme }) => theme.transitions.base};

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
  }
`;

const MarketCard = ({ market }: MarketCardProps) => {
  const startTime = new Date(market.startTime);
  const formattedStartTime = startTime.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Card $highlight={market.popular} data-testid="market-card">
      <Header>
        <Category>{market.category}</Category>
        <Title>{market.eventName}</Title>
        <Subtitle>{market.name}</Subtitle>
      </Header>

      <OptionsList>
        {market.options.map((option) => (
          <OptionCard key={option.id}>
            <OptionName>{option.name}</OptionName>
            <OptionMeta>
              {formatOdds(option.odds)} odds
              {option.probability ? ` • ${(option.probability * 100).toFixed(0)}% implied` : ''}
            </OptionMeta>
          </OptionCard>
        ))}
      </OptionsList>

      <Footer>
        <div>
          <StartTime>Starts {formattedStartTime}</StartTime>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {market.popular && <PopularBadge>Popular</PopularBadge>}
          <ActionLink to={`/orders/new/${market.id}`} state={{ market }}>
            Place Order
          </ActionLink>
        </div>
      </Footer>
    </Card>
  );
};

export default MarketCard;
