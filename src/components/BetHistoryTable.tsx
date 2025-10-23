import styled from 'styled-components';
import { Bet } from '../types/bet';
import { formatCurrency, formatOdds } from '../utils/formatters';

type BetHistoryTableProps = {
  bets: Bet[];
};

const TableContainer = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
`;

const TableTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin: 0;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.text};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Thead = styled.thead`
  background: ${({ theme }) => theme.colors.backgroundAlt};
`;

const Th = styled.th`
  text-align: left;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textLight};
  white-space: nowrap;
`;

const Tbody = styled.tbody``;

const Tr = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundAlt};
  }
`;

const Td = styled.td`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
`;

const StatusBadge = styled.span<{ $status: Bet['status'] }>`
  display: inline-block;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-transform: capitalize;
  background: ${({ theme, $status }) => {
    switch ($status) {
      case 'won':
        return 'rgba(34, 197, 94, 0.1)';
      case 'lost':
        return 'rgba(239, 68, 68, 0.1)';
      case 'pending':
        return 'rgba(249, 115, 22, 0.1)';
      default:
        return theme.colors.backgroundAlt;
    }
  }};
  color: ${({ theme, $status }) => {
    switch ($status) {
      case 'won':
        return '#16a34a';
      case 'lost':
        return '#dc2626';
      case 'pending':
        return '#ea580c';
      default:
        return theme.colors.textLight;
    }
  }};
`;

const ResultText = styled.span<{ $isProfit: boolean }>`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ $isProfit }) => ($isProfit ? '#16a34a' : '#dc2626')};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.textLight};
`;

const BetHistoryTable = ({ bets }: BetHistoryTableProps) => {
  if (bets.length === 0) {
    return (
      <TableContainer>
        <TableTitle>Bet History</TableTitle>
        <EmptyState>No bets found</EmptyState>
      </TableContainer>
    );
  }

  return (
    <TableContainer>
      <TableTitle>Bet History</TableTitle>
      <TableWrapper>
        <Table>
          <Thead>
            <Tr>
              <Th>Event</Th>
              <Th>Selection</Th>
              <Th>Odds</Th>
              <Th>Stake</Th>
              <Th>Potential Return</Th>
              <Th>Status</Th>
              <Th>Result</Th>
            </Tr>
          </Thead>
          <Tbody>
            {bets.map((bet) => (
              <Tr key={bet.id}>
                <Td>{bet.eventName}</Td>
                <Td>{bet.selection}</Td>
                <Td>{formatOdds(bet.odds)}</Td>
                <Td>{formatCurrency(bet.stake)}</Td>
                <Td>{formatCurrency(bet.potentialReturn)}</Td>
                <Td>
                  <StatusBadge $status={bet.status}>{bet.status}</StatusBadge>
                </Td>
                <Td>
                  {bet.result !== undefined ? (
                    <ResultText $isProfit={bet.result > 0}>
                      {bet.result > 0 ? '+' : ''}
                      {formatCurrency(bet.result)}
                    </ResultText>
                  ) : (
                    '-'
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableWrapper>
    </TableContainer>
  );
};

export default BetHistoryTable;
