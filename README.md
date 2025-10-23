# Portfolio Application

A modern, responsive portfolio website with betting portfolio tracking and market scanning capabilities. Built with React, TypeScript, styled-components, and React Router.

## Features

- **Global Theming**: Comprehensive theme system using styled-components with customizable colors, typography, spacing, and more
- **Responsive Layout**: Mobile-first design with responsive header, footer, and layout wrapper
- **Navigation**: 
  - Desktop navigation with smooth hover effects and active state indicators
  - Mobile-responsive burger menu with smooth animations
- **Portfolio Dashboard**: 
  - Real-time performance analytics with visual charts
  - Comprehensive bet history table with filtering capabilities
  - Portfolio statistics including ROI, win rate, and profitability metrics
  - Monthly performance tracking
- **Bet Scanner**: 
  - Browse available markets across multiple categories (Sports, Esports, Politics, Casino)
  - Advanced filtering by market type, category, and search
  - Highlight popular betting opportunities
  - Direct integration with order placement
- **Order Placement**: 
  - Intuitive bet placement interface
  - Real-time calculation of potential returns and profit
  - Seamless integration with portfolio tracking
- **Backend Synchronization**: 
  - Automatic data sync with backend services
  - Fallback to mock data when backend is unavailable
  - Configurable via environment variables
- **Routing**: React Router configuration with the following pages:
  - Home/About
  - Projects
  - Blog
  - Resume
  - Contact
  - Portfolio Dashboard
  - Bet Scanner
  - Order Placement

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **styled-components** - CSS-in-JS with theming support
- **React Router v6** - Client-side routing
- **Vite** - Fast build tool and dev server

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### End-to-End Tests

Run the complete end-to-end test suite:

```bash
npm run test:e2e
```

The tests cover:
- Portfolio dashboard with analytics and performance charts
- Bet scanner with filtering and search
- Order placement workflow
- Backend synchronization and data fetching
- Complete user flows from portfolio → scanner → order placement

## Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── Header.tsx          # Main header with logo
│   ├── Nav.tsx             # Navigation links component
│   ├── BurgerMenu.tsx      # Mobile burger menu
│   ├── Footer.tsx          # Page footer
│   ├── Layout.tsx          # Layout wrapper component
│   ├── AnalyticsSummary.tsx # Portfolio analytics cards
│   ├── BetHistoryTable.tsx # Bet history table with filters
│   ├── PerformanceChart.tsx # Performance visualization chart
│   └── MarketCard.tsx      # Market display card
├── pages/                   # Page components
│   ├── Home.tsx
│   ├── About.tsx
│   ├── Projects.tsx
│   ├── Blog.tsx
│   ├── Resume.tsx
│   ├── Contact.tsx
│   ├── PortfolioDashboard.tsx # Portfolio tracking dashboard
│   ├── BetScanner.tsx      # Market scanner with filters
│   └── OrderPlacement.tsx  # Order placement interface
├── services/                # Backend service integrations
│   └── bettingService.ts   # Betting data API client
├── types/                   # TypeScript type definitions
│   └── bet.ts              # Betting-related types
├── utils/                   # Utility functions
│   └── formatters.ts       # Number and currency formatters
├── theme/                   # Theme configuration
│   ├── theme.ts            # Theme values
│   ├── GlobalStyles.ts     # Global CSS styles
│   └── styled.d.ts         # TypeScript definitions
├── App.tsx                  # Main app with router
└── main.tsx                 # Application entry point

tests/
└── e2e/                     # End-to-end tests
    ├── portfolio-dashboard.spec.ts
    ├── bet-scanner.spec.ts
    ├── order-placement.spec.ts
    ├── backend-sync.spec.ts
    └── full-user-flow.spec.ts
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory to configure backend integration:

```env
VITE_API_BASE_URL=https://your-api-backend.com/api
```

If `VITE_API_BASE_URL` is not set, the application will use mock data with simulated network latency.

## Customization

### Theme

Edit `src/theme/theme.ts` to customize colors, fonts, spacing, breakpoints, and other design tokens.

### Navigation Links

Modify the `navLinks` array in `src/components/Nav.tsx` to add, remove, or update navigation links.

### Pages

Add new pages in `src/pages/` and configure routes in `src/App.tsx`.

### Backend Integration

The betting service (`src/services/bettingService.ts`) provides a flexible interface that:
- Attempts to fetch from the backend API if `VITE_API_BASE_URL` is configured
- Falls back to mock data if the backend is unavailable
- Simulates realistic network latency for a better development experience

To integrate with a real backend, ensure your API endpoints match:
- `GET /portfolio/stats` - Portfolio statistics
- `GET /portfolio/performance` - Performance data over time
- `GET /portfolio/bets` - Bet history with optional filters
- `GET /markets` - Available markets with optional filters
- `GET /markets/popular` - Popular markets
- `GET /markets/:id` - Individual market details
