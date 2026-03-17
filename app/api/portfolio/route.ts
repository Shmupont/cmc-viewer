import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let yf: any = null
async function getYF() {
  if (!yf) { const mod = await import('yahoo-finance2'); yf = mod.default }
  return yf
}

interface DBHolding {
  id: number
  ticker: string
  name: string
  shares: string | number
  cost_basis: string | number | null
  asset_type: string
  created_at: string
  updated_at: string
}

export async function GET(): Promise<NextResponse> {
  try {
    const holdings = await query<DBHolding>('SELECT * FROM portfolio_holdings ORDER BY asset_type, ticker')

    // Fetch live prices for non-cash holdings
    const yahooFinance = await getYF()
    const nonCash = holdings.filter((h) => h.asset_type !== 'cash')

    const priceMap: Record<string, Record<string, unknown>> = {}
    await Promise.allSettled(
      nonCash.map(async (h) => {
        try {
          const q = await yahooFinance.quote(h.ticker)
          priceMap[h.ticker] = q
        } catch {
          // ignore
        }
      })
    )

    let totalValue = 0
    let totalCost = 0
    let totalDayChange = 0

    const enriched = holdings.map((h) => {
      const shares = Number(h.shares)
      const costBasis = h.cost_basis ? Number(h.cost_basis) : null

      if (h.asset_type === 'cash') {
        totalValue += shares
        return {
          ...h,
          shares,
          cost_basis: costBasis,
          description: h.name,
          quantity: shares,
          current_value: shares,
          unrealized_gl: null,
          unrealized_gl_pct: null,
          day_change_value: 0,
        }
      }

      const q = priceMap[h.ticker] as Record<string, number> | undefined
      const price = q?.regularMarketPrice ?? null
      const prevClose = q?.regularMarketPreviousClose ?? null
      const dayChangePct = q?.regularMarketChangePercent ?? null
      const dayChange = q?.regularMarketChange ?? null

      const currentValue = price ? price * shares : null
      const costTotal = costBasis ? costBasis * shares : null
      const unrealizedGL = currentValue && costTotal ? currentValue - costTotal : null
      const unrealizedGLPct = unrealizedGL && costTotal ? (unrealizedGL / costTotal) * 100 : null
      const dayChangeValue = dayChange ? dayChange * shares : 0

      if (currentValue) totalValue += currentValue
      if (costTotal) totalCost += costTotal
      totalDayChange += dayChangeValue

      return {
        ...h,
        shares,
        cost_basis: costBasis,
        description: h.name,
        quantity: shares,
        current_value: currentValue,
        unrealized_gl: unrealizedGL,
        unrealized_gl_pct: unrealizedGLPct,
        day_change_value: dayChangeValue,
        price_data: price ? {
          ticker: h.ticker,
          price,
          prev_close: prevClose,
          day_change: dayChange,
          day_change_pct: dayChangePct,
          day_open: q?.regularMarketOpen ?? null,
          day_high: q?.regularMarketDayHigh ?? null,
          day_low: q?.regularMarketDayLow ?? null,
          volume: q?.regularMarketVolume ?? null,
          market_cap: q?.marketCap ?? null,
          pe_ratio: q?.trailingPE ?? null,
          eps: q?.epsTrailingTwelveMonths ?? null,
          dividend_yield: q?.dividendYield ?? null,
          beta: null,
          week_52_high: q?.fiftyTwoWeekHigh ?? null,
          week_52_low: q?.fiftyTwoWeekLow ?? null,
          aum: null,
          expense_ratio: null,
          last_updated: new Date().toISOString(),
        } : undefined,
      }
    })

    const totalGL = totalValue - totalCost
    const totalGLPct = totalCost > 0 ? (totalGL / totalCost) * 100 : 0
    const dayChangePct = totalValue > 0 ? (totalDayChange / (totalValue - totalDayChange)) * 100 : 0

    const cash = holdings.find((h) => h.asset_type === 'cash')

    return NextResponse.json({
      holdings: enriched,
      summary: {
        total_value: totalValue,
        total_cost: totalCost,
        total_gl: totalGL,
        total_gl_pct: totalGLPct,
        day_change: totalDayChange,
        day_change_pct: dayChangePct,
        cash: cash ? Number(cash.shares) : 0,
      },
    })
  } catch (err) {
    console.error('[api/portfolio]', err)
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { ticker, name, shares, cost_basis, asset_type } = body

    const result = await query(
      `INSERT INTO portfolio_holdings (ticker, name, shares, cost_basis, asset_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [ticker?.toUpperCase(), name, shares, cost_basis, asset_type ?? 'stock']
    )

    return NextResponse.json(result[0])
  } catch (err) {
    console.error('[api/portfolio POST]', err)
    return NextResponse.json({ error: 'Failed to add holding' }, { status: 500 })
  }
}
