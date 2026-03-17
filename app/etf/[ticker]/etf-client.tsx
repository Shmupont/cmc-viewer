'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CandlestickChart } from '@/components/charts/CandlestickChart'
import { AllocationChart } from '@/components/charts/AllocationChart'
import { ConstituentTable } from '@/components/tables/ConstituentTable'
import { AgentPanel } from '@/components/AgentPanel'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface ETFQuote {
  price: number
  prev_close: number
  day_change: number
  day_change_pct: number
  aum: number | null
  expense_ratio: number | null
  name: string
  week_52_high: number | null
  week_52_low: number | null
  volume: number | null
}

interface Constituent {
  ticker: string
  name: string
  weight: number
  sector: string
}

interface SectorAllocation {
  name: string
  value: number
}

export default function ETFClient({ ticker }: { ticker: string }): React.ReactElement {
  const router = useRouter()
  const [quote, setQuote] = useState<ETFQuote | null>(null)
  const [constituents, setConstituents] = useState<Constituent[]>([])
  const [sectorAlloc, setSectorAlloc] = useState<SectorAllocation[]>([])
  const [loading, setLoading] = useState(true)
  const [agentOpen, setAgentOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [quoteRes, holdingsRes] = await Promise.allSettled([
          fetch(`/api/market/quote?ticker=${ticker}`).then(r => r.json()),
          fetch(`/api/etf/holdings?ticker=${ticker}`).then(r => r.json()),
        ])
        if (quoteRes.status === 'fulfilled') setQuote(quoteRes.value)
        if (holdingsRes.status === 'fulfilled') {
          const h = holdingsRes.value
          if (Array.isArray(h.constituents)) setConstituents(h.constituents)
          if (Array.isArray(h.sectorAllocation)) setSectorAlloc(h.sectorAllocation)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [ticker])

  const fmt = (v: number | null | undefined, prefix = '$', decimals = 2): string => {
    if (v == null) return '--'
    return `${prefix}${v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
  }

  const fmtLarge = (v: number | null | undefined): string => {
    if (v == null) return '--'
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
    return fmt(v)
  }

  const context = quote
    ? `ETF: ${ticker} (${quote.name}), Price: $${quote.price?.toFixed(2)}, Day Change: ${quote.day_change_pct?.toFixed(2)}%, AUM: ${fmtLarge(quote.aum)}, Expense Ratio: ${quote.expense_ratio != null ? (quote.expense_ratio * 100).toFixed(2) + '%' : '--'}, 52W Range: ${fmt(quote.week_52_low)} - ${fmt(quote.week_52_high)}`
    : `ETF: ${ticker}`

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size={40} />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-text-muted hover:text-text-secondary text-sm">← Back</button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-text-primary text-xl font-bold font-mono">{ticker}</h1>
              <span className={`font-mono text-lg font-semibold ${quote && quote.day_change >= 0 ? 'text-positive' : 'text-negative'}`}>
                {quote ? `$${quote.price?.toFixed(2)}` : '--'}
              </span>
              {quote && (
                <span className={`text-sm ${quote.day_change >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {quote.day_change >= 0 ? '+' : ''}{quote.day_change?.toFixed(2)} ({quote.day_change_pct >= 0 ? '+' : ''}{quote.day_change_pct?.toFixed(2)}%)
                </span>
              )}
            </div>
            {quote && <p className="text-text-muted text-sm">{quote.name}</p>}
          </div>
        </div>
        <button
          onClick={() => setAgentOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-md transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /></svg>
          Analyze
        </button>
      </div>

      {/* Stat tiles */}
      {quote && (
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: 'AUM', val: fmtLarge(quote.aum) },
            { label: 'Expense Ratio', val: quote.expense_ratio != null ? `${(quote.expense_ratio * 100).toFixed(2)}%` : '--' },
            { label: '52W High', val: fmt(quote.week_52_high) },
            { label: '52W Low', val: fmt(quote.week_52_low) },
            { label: 'Volume', val: quote.volume != null ? quote.volume.toLocaleString() : '--' },
          ].map(({ label, val }) => (
            <div key={label} className="bg-surface border border-border rounded-lg p-4">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-2">{label}</p>
              <p className="font-mono font-semibold text-text-primary">{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="mb-6">
        <CandlestickChart ticker={ticker} />
      </div>

      {/* Holdings + Sector Allocation */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Top Holdings</p>
          {constituents.length > 0 ? (
            <ConstituentTable constituents={constituents} onRowClick={(t) => router.push(`/stock/${t}`)} />
          ) : (
            <p className="text-text-muted text-sm text-center py-6">Holdings data not available for this ETF.</p>
          )}
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Sector Allocation</p>
          {sectorAlloc.length > 0 ? (
            <AllocationChart data={sectorAlloc} height={260} />
          ) : (
            <p className="text-text-muted text-sm text-center py-6">No sector data.</p>
          )}
        </div>
      </div>

      <AgentPanel isOpen={agentOpen} onClose={() => setAgentOpen(false)} context={context} pageTitle={`${ticker} ETF Analysis`} />
    </div>
  )
}
