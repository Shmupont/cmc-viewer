import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let yf: any = null
async function getYF() {
  if (!yf) { const mod = await import('yahoo-finance2'); yf = mod.default }
  return yf
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')
  const type = searchParams.get('type') ?? 'profile'
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  try {
    const yahooFinance = await getYF()

    if (type === 'profile') {
      const summary = await yahooFinance.quoteSummary(ticker, {
        modules: ['assetProfile', 'summaryDetail', 'defaultKeyStatistics', 'quoteType', 'financialData'],
      })
      const ap = summary?.assetProfile
      const sd = summary?.summaryDetail
      const ks = summary?.defaultKeyStatistics
      const fd = summary?.financialData

      return NextResponse.json({
        ticker: ticker.toUpperCase(),
        name: summary?.quoteType?.longName ?? ticker.toUpperCase(),
        description: ap?.longBusinessSummary ?? '',
        sector: ap?.sector ?? '',
        industry: ap?.industry ?? '',
        website: ap?.website ?? '',
        country: ap?.country ?? '',
        employees: ap?.fullTimeEmployees ?? null,
        logo: `https://logo.clearbit.com/${ap?.website?.replace(/https?:\/\//, '')}`,
        pe: sd?.trailingPE ?? null,
        forward_pe: sd?.forwardPE ?? null,
        market_cap: sd?.marketCap ?? null,
        enterprise_value: ks?.enterpriseValue ?? null,
        ev_revenue: ks?.enterpriseToRevenue ?? null,
        ev_ebitda: ks?.enterpriseToEbitda ?? null,
        profit_margin: fd?.profitMargins ?? null,
        roe: fd?.returnOnEquity ?? null,
        roa: fd?.returnOnAssets ?? null,
        revenue: fd?.totalRevenue ?? null,
        revenue_growth: fd?.revenueGrowth ?? null,
        earnings_growth: fd?.earningsGrowth ?? null,
        current_ratio: fd?.currentRatio ?? null,
        debt_to_equity: fd?.debtToEquity ?? null,
        free_cashflow: fd?.freeCashflow ?? null,
      })
    }

    if (type === 'insider') {
      const summary = await yahooFinance.quoteSummary(ticker, { modules: ['insiderTransactions'] })
      const transactions = summary?.insiderTransactions?.transactions ?? []
      return NextResponse.json(transactions.slice(0, 20).map((t: Record<string, unknown>) => ({
        name: t.filerName,
        relation: t.filerRelation,
        transaction_type: t.transactionDescription,
        shares: t.shares,
        value: t.value,
        date: t.startDate instanceof Date ? t.startDate.toISOString().split('T')[0] : String(t.startDate ?? ''),
      })))
    }

    if (type === 'institutional') {
      const summary = await yahooFinance.quoteSummary(ticker, {
        modules: ['institutionOwnership', 'majorHoldersBreakdown'],
      })
      const holders = summary?.institutionOwnership?.ownershipList ?? []
      const breakdown = summary?.majorHoldersBreakdown
      return NextResponse.json({
        holders: holders.slice(0, 15).map((h: Record<string, unknown>) => ({
          name: h.organization,
          pct_held: h.pctHeld,
          shares: h.position,
          value: h.value,
        })),
        breakdown: {
          insiders_pct: breakdown?.insidersPercentHeld ?? null,
          institutions_pct: breakdown?.institutionsPercentHeld ?? null,
          float_pct: breakdown?.institutionsFloatPercentHeld ?? null,
        },
      })
    }

    if (type === 'upgrades') {
      const summary = await yahooFinance.quoteSummary(ticker, { modules: ['upgradeDowngradeHistory'] })
      const history = summary?.upgradeDowngradeHistory?.history ?? []
      return NextResponse.json(history.slice(0, 15).map((u: Record<string, unknown>) => ({
        firm: u.firm,
        from_grade: u.fromGrade,
        to_grade: u.toGrade,
        action: u.action,
        date: u.epochGradeDate
          ? new Date((u.epochGradeDate as number) * 1000).toISOString().split('T')[0]
          : '',
      })))
    }

    if (type === 'dividends') {
      const summary = await yahooFinance.quoteSummary(ticker, {
        modules: ['calendarEvents', 'summaryDetail'],
      })
      const sd = summary?.summaryDetail
      const cal = summary?.calendarEvents
      return NextResponse.json({
        dividend_yield: sd?.dividendYield ?? null,
        dividend_rate: sd?.dividendRate ?? null,
        payout_ratio: sd?.payoutRatio ?? null,
        ex_date: cal?.exDividendDate instanceof Date
          ? cal.exDividendDate.toISOString().split('T')[0]
          : null,
        pay_date: cal?.dividendDate instanceof Date
          ? cal.dividendDate.toISOString().split('T')[0]
          : null,
      })
    }

    if (type === 'peers') {
      const PEER_MAP: Record<string, string[]> = {
        GOOGL: ['META', 'MSFT', 'AMZN', 'NFLX'],
        AAPL: ['MSFT', 'GOOGL', 'META', 'AMZN'],
        MSFT: ['GOOGL', 'AAPL', 'AMZN', 'CRM'],
        META: ['GOOGL', 'SNAP', 'PINS', 'TWTR'],
        AMZN: ['MSFT', 'GOOGL', 'BABA', 'WMT'],
        TSLA: ['F', 'GM', 'NIO', 'RIVN'],
        NVDA: ['AMD', 'INTC', 'QCOM', 'TXN'],
      }
      const peers = PEER_MAP[ticker.toUpperCase()] ?? ['SPY', 'QQQ', 'IWM']
      return NextResponse.json(peers)
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch (err) {
    console.error('[api/company]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
