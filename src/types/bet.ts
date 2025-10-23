export type BetStatus = 'pending' | 'won' | 'lost' | 'cancelled';

export type MarketType = 'sports' | 'casino' | 'esports' | 'politics';

export interface Bet {
  id: string;
  marketType: MarketType;
  eventName: string;
  selection: string;
  odds: number;
  stake: number;
  potentialReturn: number;
  status: BetStatus;
  placedAt: string;
  settledAt?: string;
  result?: number;
}

export interface Market {
  id: string;
  type: MarketType;
  name: string;
  eventName: string;
  options: MarketOption[];
  startTime: string;
  popular: boolean;
  category: string;
}

export interface MarketOption {
  id: string;
  name: string;
  odds: number;
  probability?: number;
}

export interface PortfolioStats {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
  totalStaked: number;
  totalReturns: number;
  netProfit: number;
  roi: number;
  winRate: number;
}

export interface PerformanceData {
  date: string;
  profit: number;
  cumulativeProfit: number;
  betsPlaced: number;
}

export interface BetFilters {
  marketType?: MarketType;
  status?: BetStatus;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

export interface MarketFilters {
  type?: MarketType;
  category?: string;
  searchQuery?: string;
  popularOnly?: boolean;
}
