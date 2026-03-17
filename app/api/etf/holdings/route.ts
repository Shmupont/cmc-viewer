import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let yf: any = null
async function getYF() {
  if (!yf) { const mod = await import('yahoo-finance2'); yf = mod.default }
  return yf
}

// Fallback hardcoded top holdings for common ETFs
const ETF_HOLDINGS_FALLBACK: Record<string, Array<{ ticker: string; name: string; weight: number; sector: string }>> = {
  XLF: [
    { ticker: 'BRK.B', name: 'Berkshire Hathaway', weight: 13.2, sector: 'Financials' },
    { ticker: 'JPM', name: 'JPMorgan Chase', weight: 11.8, sector: 'Financials' },
    { ticker: 'V', name: 'Visa', weight: 8.5, sector: 'Financials' },
    { ticker: 'MA', name: 'Mastercard', weight: 7.2, sector: 'Financials' },
    { ticker: 'BAC', name: 'Bank of America', weight: 4.8, sector: 'Financials' },
    { ticker: 'WFC', name: 'Wells Fargo', weight: 3.9, sector: 'Financials' },
    { ticker: 'GS', name: 'Goldman Sachs', weight: 3.5, sector: 'Financials' },
    { ticker: 'MS', name: 'Morgan Stanley', weight: 2.8, sector: 'Financials' },
    { ticker: 'SPGI', name: 'S&P Global', weight: 2.6, sector: 'Financials' },
    { ticker: 'BLK', name: 'BlackRock', weight: 2.4, sector: 'Financials' },
  ],
  XLV: [
    { ticker: 'LLY', name: 'Eli Lilly', weight: 13.5, sector: 'Healthcare' },
    { ticker: 'UNH', name: 'UnitedHealth Group', weight: 12.8, sector: 'Healthcare' },
    { ticker: 'JNJ', name: 'Johnson & Johnson', weight: 8.2, sector: 'Healthcare' },
    { ticker: 'ABBV', name: 'AbbVie', weight: 7.5, sector: 'Healthcare' },
    { ticker: 'MRK', name: 'Merck', weight: 5.6, sector: 'Healthcare' },
    { ticker: 'TMO', name: 'Thermo Fisher', weight: 4.8, sector: 'Healthcare' },
    { ticker: 'ABT', name: 'Abbott Labs', weight: 4.2, sector: 'Healthcare' },
    { ticker: 'ISRG', name: 'Intuitive Surgical', weight: 3.5, sector: 'Healthcare' },
    { ticker: 'DHR', name: 'Danaher', weight: 3.1, sector: 'Healthcare' },
    { ticker: 'PFE', name: 'Pfizer', weight: 2.8, sector: 'Healthcare' },
  ],
  VGT: [
    { ticker: 'MSFT', name: 'Microsoft', weight: 18.5, sector: 'Technology' },
    { ticker: 'AAPL', name: 'Apple', weight: 17.2, sector: 'Technology' },
    { ticker: 'NVDA', name: 'NVIDIA', weight: 15.8, sector: 'Technology' },
    { ticker: 'AVGO', name: 'Broadcom', weight: 5.2, sector: 'Technology' },
    { ticker: 'AMD', name: 'Advanced Micro Devices', weight: 3.4, sector: 'Technology' },
    { ticker: 'INTC', name: 'Intel', weight: 2.8, sector: 'Technology' },
    { ticker: 'QCOM', name: 'Qualcomm', weight: 2.5, sector: 'Technology' },
    { ticker: 'TXN', name: 'Texas Instruments', weight: 2.2, sector: 'Technology' },
    { ticker: 'NOW', name: 'ServiceNow', weight: 2.0, sector: 'Technology' },
    { ticker: 'INTU', name: 'Intuit', weight: 1.9, sector: 'Technology' },
  ],
  IBB: [
    { ticker: 'REGN', name: 'Regeneron Pharmaceuticals', weight: 8.2, sector: 'Biotech' },
    { ticker: 'VRTX', name: 'Vertex Pharmaceuticals', weight: 7.5, sector: 'Biotech' },
    { ticker: 'GILD', name: 'Gilead Sciences', weight: 6.8, sector: 'Biotech' },
    { ticker: 'AMGN', name: 'Amgen', weight: 6.2, sector: 'Biotech' },
    { ticker: 'MRNA', name: 'Moderna', weight: 4.5, sector: 'Biotech' },
    { ticker: 'BIIB', name: 'Biogen', weight: 3.8, sector: 'Biotech' },
    { ticker: 'ILMN', name: 'Illumina', weight: 3.2, sector: 'Biotech' },
    { ticker: 'ALNY', name: 'Alnylam Pharmaceuticals', weight: 2.9, sector: 'Biotech' },
    { ticker: 'SGEN', name: 'Seagen', weight: 2.5, sector: 'Biotech' },
    { ticker: 'BMRN', name: 'BioMarin Pharmaceutical', weight: 2.2, sector: 'Biotech' },
  ],
  VNQ: [
    { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', weight: 11.2, sector: 'Real Estate' },
    { ticker: 'AMT', name: 'American Tower', weight: 8.5, sector: 'Real Estate' },
    { ticker: 'PLD', name: 'Prologis', weight: 7.8, sector: 'Real Estate' },
    { ticker: 'CCI', name: 'Crown Castle', weight: 6.2, sector: 'Real Estate' },
    { ticker: 'EQIX', name: 'Equinix', weight: 5.5, sector: 'Real Estate' },
    { ticker: 'PSA', name: 'Public Storage', weight: 4.8, sector: 'Real Estate' },
    { ticker: 'O', name: 'Realty Income', weight: 4.2, sector: 'Real Estate' },
    { ticker: 'DLR', name: 'Digital Realty', weight: 3.5, sector: 'Real Estate' },
    { ticker: 'WELL', name: 'Welltower', weight: 3.2, sector: 'Real Estate' },
    { ticker: 'AVB', name: 'AvalonBay Communities', weight: 2.8, sector: 'Real Estate' },
  ],
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  const upper = ticker.toUpperCase()

  // Try Yahoo Finance first
  try {
    const yahooFinance = await getYF()
    const summary = await yahooFinance.quoteSummary(upper, { modules: ['topHoldings'] })
    const holdings = summary?.topHoldings?.holdings ?? []

    if (holdings.length > 0) {
      return NextResponse.json({
        ticker: upper,
        holdings: holdings.map((h: Record<string, unknown>) => ({
          ticker: h.symbol ?? '',
          name: h.holdingName ?? '',
          weight: typeof h.holdingPercent === 'number' ? h.holdingPercent * 100 : 0,
          sector: '',
        })),
      })
    }
  } catch {
    // fall through to fallback
  }

  // Use fallback
  const fallback = ETF_HOLDINGS_FALLBACK[upper] ?? []
  return NextResponse.json({ ticker: upper, holdings: fallback })
}
