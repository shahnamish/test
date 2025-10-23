import { Bet, BetFilters, Market, MarketFilters, PerformanceData, PortfolioStats } from '../types/bet';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withLatency = async <T>(value: T): Promise<T> => {
  await delay(180 + Math.random() * 220);
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

const request = async <T>(endpoint: string, fallback: T): Promise<T> => {
  if (!API_BASE_URL) {
    return withLatency(fallback);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error('Request failed');
    }
    return (await response.json()) as T;
  } catch (error) {
    return withLatency(fallback);
  }
};

const betHistoryDataset: Bet[] = [
  {
    id: 'B1001',
    marketType: 'sports',
    eventName: 'Premier League: Manchester United vs. Liverpool',
    selection: 'Liverpool Win',
    odds: 2.1,
    stake: 150,
    potentialReturn: 315,
    status: 'won',
    placedAt: '2024-01-12T18:30:00Z',
    settledAt: '2024-01-12T22:20:00Z',
    result: 165,
  },
  {
    id: 'B1002',
    marketType: 'sports',
    eventName: 'NBA: Lakers vs. Warriors',
    selection: 'Warriors +4.5',
    odds: 1.95,
    stake: 200,
    potentialReturn: 390,
    status: 'lost',
    placedAt: '2024-01-18T01:15:00Z',
    settledAt: '2024-01-18T04:45:00Z',
    result: -200,
  },
  {
    id: 'B1003',
    marketType: 'sports',
    eventName: 'NFL: Chiefs vs. Eagles',
    selection: 'Chiefs Win',
    odds: 1.82,
    stake: 250,
    potentialReturn: 455,
    status: 'won',
    placedAt: '2024-02-04T20:00:00Z',
    settledAt: '2024-02-04T23:45:00Z',
    result: 205,
  },
  {
    id: 'B1004',
    marketType: 'esports',
    eventName: 'League of Legends: Worlds Finals',
    selection: 'T1 Win 3-1',
    odds: 3.4,
    stake: 120,
    potentialReturn: 408,
    status: 'won',
    placedAt: '2024-02-17T12:10:00Z',
    settledAt: '2024-02-17T16:20:00Z',
    result: 288,
  },
  {
    id: 'B1005',
    marketType: 'casino',
    eventName: 'Blackjack Session',
    selection: 'Progressive Strategy',
    odds: 1.6,
    stake: 80,
    potentialReturn: 128,
    status: 'lost',
    placedAt: '2024-03-02T22:30:00Z',
    settledAt: '2024-03-02T23:50:00Z',
    result: -80,
  },
  {
    id: 'B1006',
    marketType: 'sports',
    eventName: 'Champions League: Real Madrid vs. Bayern Munich',
    selection: 'Over 2.5 Goals',
    odds: 1.9,
    stake: 300,
    potentialReturn: 570,
    status: 'pending',
    placedAt: '2024-03-10T19:00:00Z',
  },
  {
    id: 'B1007',
    marketType: 'politics',
    eventName: 'US Presidential Election 2024',
    selection: 'Candidate A',
    odds: 2.8,
    stake: 500,
    potentialReturn: 1400,
    status: 'pending',
    placedAt: '2024-03-15T15:30:00Z',
  },
  {
    id: 'B1008',
    marketType: 'sports',
    eventName: 'UFC 302: Main Event',
    selection: 'Knockout in Round 2',
    odds: 4.5,
    stake: 90,
    potentialReturn: 405,
    status: 'won',
    placedAt: '2024-03-20T05:05:00Z',
    settledAt: '2024-03-20T06:00:00Z',
    result: 315,
  },
  {
    id: 'B1009',
    marketType: 'sports',
    eventName: 'MLB: Yankees vs. Red Sox',
    selection: 'Red Sox Win',
    odds: 2.4,
    stake: 130,
    potentialReturn: 312,
    status: 'lost',
    placedAt: '2024-03-28T22:05:00Z',
    settledAt: '2024-03-29T01:15:00Z',
    result: -130,
  },
  {
    id: 'B1010',
    marketType: 'sports',
    eventName: 'Formula 1: Monaco GP',
    selection: 'Driver A Podium Finish',
    odds: 1.75,
    stake: 220,
    potentialReturn: 385,
    status: 'pending',
    placedAt: '2024-04-01T08:30:00Z',
  },
];

const performanceDataset: PerformanceData[] = [
  { date: '2023-07-01', profit: 120, cumulativeProfit: 120, betsPlaced: 12 },
  { date: '2023-08-01', profit: 85, cumulativeProfit: 205, betsPlaced: 10 },
  { date: '2023-09-01', profit: -60, cumulativeProfit: 145, betsPlaced: 14 },
  { date: '2023-10-01', profit: 140, cumulativeProfit: 285, betsPlaced: 16 },
  { date: '2023-11-01', profit: 190, cumulativeProfit: 475, betsPlaced: 18 },
  { date: '2023-12-01', profit: -40, cumulativeProfit: 435, betsPlaced: 11 },
  { date: '2024-01-01', profit: 220, cumulativeProfit: 655, betsPlaced: 19 },
  { date: '2024-02-01', profit: 310, cumulativeProfit: 965, betsPlaced: 21 },
  { date: '2024-03-01', profit: 150, cumulativeProfit: 1115, betsPlaced: 17 },
  { date: '2024-04-01', profit: 95, cumulativeProfit: 1210, betsPlaced: 15 },
  { date: '2024-05-01', profit: 135, cumulativeProfit: 1345, betsPlaced: 18 },
  { date: '2024-06-01', profit: 175, cumulativeProfit: 1520, betsPlaced: 20 },
];

const marketsDataset: Market[] = [
  {
    id: 'MKT-01',
    type: 'sports',
    name: 'Moneyline',
    eventName: 'NFL: Kansas City Chiefs vs. Philadelphia Eagles',
    options: [
      { id: 'MKT-01-1', name: 'Kansas City Chiefs', odds: 1.88, probability: 0.51 },
      { id: 'MKT-01-2', name: 'Philadelphia Eagles', odds: 2.05, probability: 0.49 },
    ],
    startTime: '2024-04-14T20:15:00Z',
    popular: true,
    category: 'NFL',
  },
  {
    id: 'MKT-02',
    type: 'sports',
    name: 'Total Points',
    eventName: 'NBA: Boston Celtics vs. Denver Nuggets',
    options: [
      { id: 'MKT-02-1', name: 'Over 227.5', odds: 1.92, probability: 0.52 },
      { id: 'MKT-02-2', name: 'Under 227.5', odds: 1.92, probability: 0.48 },
    ],
    startTime: '2024-04-15T00:30:00Z',
    popular: true,
    category: 'NBA',
  },
  {
    id: 'MKT-03',
    type: 'esports',
    name: 'Match Winner',
    eventName: 'CS:GO Major Finals',
    options: [
      { id: 'MKT-03-1', name: 'Team Alpha', odds: 1.75, probability: 0.57 },
      { id: 'MKT-03-2', name: 'Team Omega', odds: 2.05, probability: 0.43 },
    ],
    startTime: '2024-04-22T14:00:00Z',
    popular: false,
    category: 'CS:GO',
  },
  {
    id: 'MKT-04',
    type: 'sports',
    name: 'Goal Scorer',
    eventName: 'Premier League: Arsenal vs. Tottenham',
    options: [
      { id: 'MKT-04-1', name: 'Bukayo Saka', odds: 2.4, probability: 0.39 },
      { id: 'MKT-04-2', name: 'Harry Kane', odds: 2.2, probability: 0.41 },
    ],
    startTime: '2024-04-20T15:00:00Z',
    popular: true,
    category: 'Premier League',
  },
  {
    id: 'MKT-05',
    type: 'politics',
    name: 'Election Winner',
    eventName: 'European Parliament Election 2024',
    options: [
      { id: 'MKT-05-1', name: 'Coalition X', odds: 1.6, probability: 0.62 },
      { id: 'MKT-05-2', name: 'Coalition Y', odds: 2.3, probability: 0.38 },
    ],
    startTime: '2024-06-01T08:00:00Z',
    popular: false,
    category: 'Elections',
  },
  {
    id: 'MKT-06',
    type: 'sports',
    name: 'Match Winner',
    eventName: 'UEFA Champions League: Real Madrid vs. Bayern Munich',
    options: [
      { id: 'MKT-06-1', name: 'Real Madrid', odds: 1.98, probability: 0.53 },
      { id: 'MKT-06-2', name: 'Bayern Munich', odds: 1.95, probability: 0.47 },
    ],
    startTime: '2024-05-09T19:00:00Z',
    popular: true,
    category: 'Champions League',
  },
  {
    id: 'MKT-07',
    type: 'sports',
    name: 'Grand Slam Winner',
    eventName: 'Tennis: Roland Garros 2024',
    options: [
      { id: 'MKT-07-1', name: 'Player A', odds: 2.6, probability: 0.37 },
      { id: 'MKT-07-2', name: 'Player B', odds: 3.1, probability: 0.31 },
    ],
    startTime: '2024-05-28T10:00:00Z',
    popular: false,
    category: 'Tennis',
  },
  {
    id: 'MKT-08',
    type: 'sports',
    name: 'First Goal Scorer',
    eventName: 'MLS: LA Galaxy vs. NYCFC',
    options: [
      { id: 'MKT-08-1', name: 'Chicharito', odds: 3.5, probability: 0.32 },
      { id: 'MKT-08-2', name: 'Talles Magno', odds: 3.8, probability: 0.28 },
    ],
    startTime: '2024-04-18T01:30:00Z',
    popular: false,
    category: 'MLS',
  },
];

const calculatePortfolioStats = (betHistory: Bet[]): PortfolioStats => {
  const completedBets = betHistory.filter((bet) => bet.status === 'won' || bet.status === 'lost');
  const pendingBets = betHistory.filter((bet) => bet.status === 'pending');
  const totalStaked = betHistory.reduce((sum, bet) => sum + bet.stake, 0);
  const totalReturns = completedBets.reduce((sum, bet) => sum + (bet.result ?? 0) + bet.stake, 0);
  const netProfit = completedBets.reduce((sum, bet) => sum + (bet.result ?? 0), 0);
  const wonBets = completedBets.filter((bet) => bet.status === 'won').length;
  const lostBets = completedBets.filter((bet) => bet.status === 'lost').length;
  const roi = totalStaked === 0 ? 0 : (netProfit / totalStaked) * 100;
  const winRate = completedBets.length === 0 ? 0 : (wonBets / completedBets.length) * 100;

  return {
    totalBets: betHistory.length,
    wonBets,
    lostBets,
    pendingBets: pendingBets.length,
    totalStaked,
    totalReturns,
    netProfit,
    roi,
    winRate,
  };
};

const filterBets = (bets: Bet[], filters?: BetFilters): Bet[] => {
  if (!filters) {
    return bets;
  }

  return bets.filter((bet) => {
    const matchesMarketType = filters.marketType ? bet.marketType === filters.marketType : true;
    const matchesStatus = filters.status ? bet.status === filters.status : true;
    const matchesSearch = filters.searchQuery
      ? `${bet.eventName} ${bet.selection}`.toLowerCase().includes(filters.searchQuery.toLowerCase())
      : true;
    const placedAt = new Date(bet.placedAt).getTime();
    const matchesFrom = filters.dateFrom ? placedAt >= new Date(filters.dateFrom).getTime() : true;
    const matchesTo = filters.dateTo ? placedAt <= new Date(filters.dateTo).getTime() : true;

    return matchesMarketType && matchesStatus && matchesSearch && matchesFrom && matchesTo;
  });
};

const filterMarkets = (markets: Market[], filters?: MarketFilters): Market[] => {
  if (!filters) {
    return markets;
  }

  return markets.filter((market) => {
    const matchesType = filters.type ? market.type === filters.type : true;
    const matchesCategory = filters.category ? market.category === filters.category : true;
    const matchesPopular = filters.popularOnly ? market.popular : true;
    const matchesSearch = filters.searchQuery
      ? `${market.eventName} ${market.options.map((option) => option.name).join(' ')}`
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase())
      : true;

    return matchesType && matchesCategory && matchesPopular && matchesSearch;
  });
};

export const fetchPortfolioStats = async (): Promise<PortfolioStats> => {
  const stats = calculatePortfolioStats(betHistoryDataset);
  return request('/portfolio/stats', stats);
};

export const fetchPerformance = async (): Promise<PerformanceData[]> => {
  return request('/portfolio/performance', performanceDataset);
};

export const fetchBetHistory = async (filters?: BetFilters): Promise<Bet[]> => {
  const data = filterBets(betHistoryDataset, filters);
  return request('/portfolio/bets', data);
};

export const fetchMarkets = async (filters?: MarketFilters): Promise<Market[]> => {
  const data = filterMarkets(marketsDataset, filters);
  return request('/markets', data);
};

export const fetchPopularMarkets = async (): Promise<Market[]> => {
  const data = marketsDataset.filter((market) => market.popular);
  return request('/markets/popular', data);
};

export const fetchMarketById = async (marketId: string): Promise<Market | null> => {
  const market = marketsDataset.find((item) => item.id === marketId) ?? null;
  return request(`/markets/${marketId}`, market as Market | null);
};
