# CMC Viewer

A Bloomberg-style personal investment portfolio terminal built with Next.js 15. Ported from the original Electron app at [github.com/Shmupont/mission-control](https://github.com/Shmupont/mission-control).

## Features

- **Portfolio**: Real-time holdings with live prices via Yahoo Finance, G/L tracking, performance chart, allocation and sector views
- **Macro**: Yield curve, FRED rates (fed funds, SOFR, treasuries), inflation (CPI/PCE), credit spreads, DXY
- **Stock Detail**: TradingView-style candlestick chart with indicators (SMA, EMA, Bollinger, RSI), analyst consensus, EPS history
- **ETF Detail**: Holdings/constituents table, sector allocation chart, AUM/expense ratio
- **Company Profile**: Business description, key metrics, insider transactions, institutional ownership, analyst upgrades/downgrades, dividends
- **Research**: AI-powered equity research briefs (powered by Claude)
- **Compare**: Side-by-side multi-asset comparison with rebased performance chart
- **Analytics**: P&L attribution, risk scenarios, fixed income breakdown
- **Watchlist & Alerts**: Persistent watchlist with live prices; price alerts stored in PostgreSQL
- **AI Agent Panel**: Contextual analysis available on every page via Anthropic Claude

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via `pg` |
| Market Data | yahoo-finance2 (server-side) |
| Macro Data | FRED API |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Charts | lightweight-charts (TradingView), recharts |
| State | Zustand |
| Auth | httpOnly cookie (`cmc_auth=1`) |

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- API keys (see Environment Variables)

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd cmc-viewer
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cmc_viewer
DEMO_PASSWORD=your_secure_password
ANTHROPIC_API_KEY=sk-ant-...
FRED_API_KEY=your_fred_key          # optional, for macro data
FINNHUB_API_KEY=your_finnhub_key    # optional, for news
```

### 3. Initialize the database

```bash
psql $DATABASE_URL -f db/migrate.sql
```

This creates all tables and seeds the default portfolio holdings.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be prompted to log in with `DEMO_PASSWORD`.

### 5. Build for production

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DEMO_PASSWORD` | Yes | Login password |
| `ANTHROPIC_API_KEY` | Yes | Enables AI analysis and research features |
| `FRED_API_KEY` | No | FRED API for macro data (yield curve, inflation, DXY, credit spreads). Get free key at fred.stlouisfed.org |
| `FINNHUB_API_KEY` | No | Finnhub for news feed. Get free key at finnhub.io |

Without `FRED_API_KEY`, macro data endpoints return empty/null values with a placeholder message.

## Database Schema

```sql
portfolio_holdings   -- positions with shares, cost basis, asset type
portfolio_snapshots  -- daily portfolio value history (for performance chart)
watchlist            -- tracked tickers
alerts               -- price alerts with condition/threshold
```

## Project Structure

```
app/
  page.tsx                    # Dashboard
  portfolio/                  # Portfolio overview
  macro/                      # Macro economic data
  stock/[ticker]/             # Stock detail + chart
  etf/[ticker]/               # ETF detail + holdings
  company/[ticker]/           # Company profile + fundamentals
  research/                   # AI research brief generator
  compare/                    # Multi-asset comparison
  analytics/                  # Portfolio analytics
  login/                      # Auth gate
  api/                        # All API routes (server-side only)
components/
  layout/                     # AppShell, Sidebar, TopBar, StatusBar
  charts/                     # CandlestickChart, AllocationChart, etc.
  panels/                     # AlertsPanel, WatchlistPanel
  tables/                     # HoldingsTable, ConstituentTable
  company/                    # DividendHistory, InsiderTransactions, etc.
  analytics/                  # Attribution, RiskScenarios, FixedIncomePanel
  macro/                      # MacroGauges, SpreadHistory, CreditSpreads, DXYPanel
lib/
  db.ts                       # PostgreSQL pool
store/
  index.ts                    # Zustand global state
types/
  index.ts                    # Shared TypeScript interfaces
```

## Customizing Holdings

Edit `db/migrate.sql` to change the default seed data, or POST to the portfolio API:

```bash
curl -X POST http://localhost:3000/api/portfolio \
  -H "Content-Type: application/json" \
  -d '{"ticker":"MSFT","name":"Microsoft","shares":10,"cost_basis":300,"asset_type":"stock"}'
```

## Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Set up a PostgreSQL database (Vercel Postgres, Supabase, Neon, etc.)
5. Run `psql $DATABASE_URL -f db/migrate.sql` once to initialize

## License

MIT
