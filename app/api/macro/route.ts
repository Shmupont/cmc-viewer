import { NextResponse } from 'next/server'

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations'

const SERIES_MAP: Record<string, string> = {
  dff: 'DFF',       // Fed Funds Rate
  dgs2: 'DGS2',     // 2Y Treasury
  dgs5: 'DGS5',     // 5Y Treasury
  dgs10: 'DGS10',   // 10Y Treasury
  dgs30: 'DGS30',   // 30Y Treasury
  cpi: 'CPIAUCSL',  // CPI
  corecpi: 'CPILFESL', // Core CPI
  pce: 'PCEPI',     // PCE
  vix: 'VIXCLS',    // VIX
  unrate: 'UNRATE', // Unemployment
  t10yie: 'T10YIE', // 10Y Breakeven Inflation
  t10y2y: 'T10Y2Y', // 10Y-2Y Spread
  bamlc0: 'BAMLC0A0CM',   // IG Credit Spread
  bamlh0: 'BAMLH0A0HYM2', // HY Credit Spread
  dxy: 'DTWEXBGS',  // DXY (Trade-weighted dollar)
}

async function fetchFRED(seriesId: string, limit: number = 30): Promise<Array<{ date: string; value: number | null }>> {
  const key = process.env.FRED_API_KEY
  if (!key) return []

  const url = `${FRED_BASE}?series_id=${seriesId}&api_key=${key}&file_type=json&sort_order=desc&limit=${limit}`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return []

  const data = await res.json()
  return (data.observations ?? [])
    .filter((o: { value: string }) => o.value !== '.')
    .map((o: { date: string; value: string }) => ({
      date: o.date,
      value: parseFloat(o.value),
    }))
    .reverse()
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const series = searchParams.get('series')
  const limit = parseInt(searchParams.get('limit') ?? '30')

  try {
    // Special: rates (multiple series at once)
    if (series === 'rates') {
      const [dff, dgs2, dgs10] = await Promise.all([
        fetchFRED('DFF', 1),
        fetchFRED('DGS2', 1),
        fetchFRED('DGS10', 1),
      ])
      return NextResponse.json({
        rates: {
          fedFunds: dff[0]?.value ?? null,
          twoYear: dgs2[0]?.value ?? null,
          tenYear: dgs10[0]?.value ?? null,
          spread: (dgs10[0]?.value ?? 0) - (dgs2[0]?.value ?? 0) || null,
        },
      })
    }

    // Yield curve
    if (series === 'yield_curve') {
      const TENORS = [
        { key: 'DGS1MO', tenor: '1M', months: 1 },
        { key: 'DGS3MO', tenor: '3M', months: 3 },
        { key: 'DGS6MO', tenor: '6M', months: 6 },
        { key: 'DGS1',   tenor: '1Y', months: 12 },
        { key: 'DGS2',   tenor: '2Y', months: 24 },
        { key: 'DGS5',   tenor: '5Y', months: 60 },
        { key: 'DGS10',  tenor: '10Y', months: 120 },
        { key: 'DGS20',  tenor: '20Y', months: 240 },
        { key: 'DGS30',  tenor: '30Y', months: 360 },
      ]
      const results = await Promise.all(TENORS.map((t) => fetchFRED(t.key, 1)))
      const curve = TENORS.map((t, i) => ({
        tenor: t.tenor,
        months: t.months,
        value: results[i][0]?.value ?? null,
      }))
      return NextResponse.json({ data: curve })
    }

    // Inflation
    if (series === 'inflation') {
      const [cpi, corecpi, pce] = await Promise.all([
        fetchFRED('CPIAUCSL', 48),
        fetchFRED('CPILFESL', 48),
        fetchFRED('PCEPI', 48),
      ])
      return NextResponse.json({ cpi, corecpi, pce })
    }

    // Credit spreads
    if (series === 'credit_spreads') {
      const [ig, hy] = await Promise.all([
        fetchFRED('BAMLC0A0CM', 365),
        fetchFRED('BAMLH0A0HYM2', 365),
      ])
      return NextResponse.json({ ig, hy })
    }

    // Spread history (10Y-2Y)
    if (series === 'spread_history') {
      const data = await fetchFRED('T10Y2Y', 365)
      return NextResponse.json({ data })
    }

    // DXY
    if (series === 'dxy') {
      const data = await fetchFRED('DTWEXBGS', 90)
      return NextResponse.json({ data })
    }

    // Single series by name
    if (series) {
      const seriesId = SERIES_MAP[series.toLowerCase()] ?? series.toUpperCase()
      const data = await fetchFRED(seriesId, limit)
      return NextResponse.json({ data })
    }

    return NextResponse.json({ error: 'series parameter required' }, { status: 400 })
  } catch (err) {
    console.error('[api/macro]', err)
    return NextResponse.json({ error: 'Failed to fetch macro data' }, { status: 500 })
  }
}
