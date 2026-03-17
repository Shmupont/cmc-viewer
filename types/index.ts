export interface Holding {
  id: number
  ticker: string
  name: string
  asset_type: 'etf' | 'stock' | 'bond_etf' | 'cash'
  shares: number
  cost_basis: number | null
  created_at: string
  updated_at: string
}

export interface PriceData {
  ticker: string
  price: number
  prev_close: number
  day_change: number
  day_change_pct: number
  day_open: number
  day_high: number
  day_low: number
  volume: number
  market_cap: number
  pe_ratio: number
  eps: number
  dividend_yield: number
  beta: number
  aum: number
  expense_ratio: number
  week_52_high: number
  week_52_low: number
  last_updated: string
}

export interface PortfolioHolding extends Holding {
  price_data?: PriceData
  current_value?: number
  unrealized_gl?: number | null
  unrealized_gl_pct?: number | null
  day_change_value?: number
  pct_of_portfolio?: number
  description?: string
  quantity?: number
}

export interface PortfolioSummary {
  total_value: number
  total_cost: number
  total_gl: number
  total_gl_pct: number
  day_change: number
  day_change_pct: number
  cash: number
}

export interface YieldCurvePoint {
  tenor: string
  value: number | null
  months: number
}

export interface EarningsData {
  date: string
  period: string
  eps_estimate: number | null
  eps_actual: number | null
  revenue_estimate: number | null
  revenue_actual: number | null
}

export interface AnalystData {
  buy: number
  hold: number
  sell: number
  strong_buy: number
  strong_sell: number
  target_high: number
  target_low: number
  target_mean: number
  recommendation: string
}

export interface SignalData {
  id: number
  ticker: string
  signal_type: string
  trigger_summary: string
  brief: string
  conclusion: string
  metrics_json: string | null
  constituents_json: string | null
  position_value: number
  position_gl: number
  position_gl_pct: number
  day_pnl: number
  flavor: string
  triggered_at: string
}
