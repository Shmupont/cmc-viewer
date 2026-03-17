CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  shares DECIMAL(15,6) NOT NULL DEFAULT 0,
  cost_basis DECIMAL(15,2),
  asset_type VARCHAR(50) DEFAULT 'stock',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  total_value DECIMAL(15,2),
  total_cost DECIMAL(15,2),
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR(20) NOT NULL UNIQUE,
  added_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR(20) NOT NULL,
  condition VARCHAR(50),
  target_price DECIMAL(15,2),
  triggered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed default holdings (Coleman's Merrill Lynch portfolio)
INSERT INTO portfolio_holdings (ticker, name, shares, cost_basis, asset_type) VALUES
  ('GOOGL', 'Alphabet Inc.', 33, 142.50, 'stock'),
  ('AAPL', 'Apple Inc.', 35, 178.25, 'stock'),
  ('SHV', 'iShares Short Treasury Bond ETF', 100, 110.45, 'bond_etf'),
  ('IBB', 'iShares Biotechnology ETF', 10, 138.20, 'etf'),
  ('XLF', 'Financial Select Sector SPDR', 150, 38.75, 'etf'),
  ('XLV', 'Health Care Select Sector SPDR', 46, 134.60, 'etf'),
  ('XLY', 'Consumer Discretionary Select Sector SPDR', 40, 175.30, 'etf'),
  ('VDC', 'Vanguard Consumer Staples ETF', 30, 196.40, 'etf'),
  ('VDE', 'Vanguard Energy ETF', 31, 118.90, 'etf'),
  ('VIS', 'Vanguard Industrials ETF', 20, 212.75, 'etf'),
  ('VGT', 'Vanguard Information Technology ETF', 20, 448.50, 'etf'),
  ('VNQ', 'Vanguard Real Estate ETF', 146.7, 82.30, 'etf'),
  ('VPU', 'Vanguard Utilities ETF', 16, 148.20, 'etf'),
  ('CASH', 'Cash & Equivalents', 13656, NULL, 'cash')
ON CONFLICT DO NOTHING;
