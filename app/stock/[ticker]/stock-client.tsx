'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CandlestickChart } from '@/components/charts/CandlestickChart'
import { AgentPanel } from '@/components/AgentPanel'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, ReferenceLine } from 'recharts'
import Link from 'next/link'

interface StockQuote {
  price: number
  prev_close: number
  day_change: number
  day_change_pct: number
  market_cap: number | null
  pe_ratio: number | null
  beta: number | null
  week_52_high: number | null
  week_52_low: number | null
  volume: number | null
  avg_volume: number | null
  name: string
  eps: number | null
  forward_pe: number | null
  dividend_yield: number | null
}

interface AnalystData {
  buy: number
  hold: number
  sell: number
  strong_buy: number
  strong_sell: number
  target_price: number | null
  rating: string | null
}

interface EarningsPoint {
  date: string
  actual: number | null
  estimate: number | null
}

export default function StockClient({ ticker }: { ticker: string }): React.ReactElement {
  const router = useRouter()
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [analyst, setAnalyst] = useState<AnalystData | null>(null)
  const [earnings, setEarnings] = useState<EarningsPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [agentOpen, setAgentOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [quoteRes, analystRes, earningsRes] = await Promise.allSettled([
          fetch(`/api/market/quote?ticker=${ticker}`).then(r => r.json()),
          fetch(`/api/company?ticker=${ticker}&type=analyst`).then(r => r.json()),
          fetch(`/api/company?ticker=${ticker}&type=earnings`).then(r => r.json()),
        ])
        if (quoteRes.status === 'fulfilled') setQuote(quoteRes.value)
        if (analystRes.status === 'fulfilled') setAnalyst(analystRes.value)
        if (earningsRes.status === 'fulfilled' && Array.isArray(earningsRes.value)) setEarnings(earningsRes.value)
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

  const analystRatingData = analyst ? [
    { name: 'Strong Buy', val: analyst.strong_buy, color: '#16a34a' },
    { name: 'Buy', val: analyst.buy, color: '#22c55e' },
    { name: 'Hold', val: analyst.hold, color: '#f59e0b' },
    { name: 'Sell', val: analyst.sell, color: '#ef4444' },
    { name: 'Strong Sell', val: analyst.strong_sell, color: '#b91c1c' },
  ].filter(d => d.val > 0) : []

  const context = quote
    ? `Stock: ${ticker} (${quote.name}), Price: $${quote.price?.toFixed(2)}, Day Change: ${quote.day_change_pct?.toFixed(2)}%, Market Cap: ${fmtLarge(quote.market_cap)}, P/E: ${quote.pe_ratio?.toFixed(1) ?? '--'}, Beta: ${quote.beta?.toFixed(2) ?? '--'}, EPS: ${fmt(quote.eps)}, 52W: ${fmt(quote.week_52_low)} - ${fmt(quote.week_52_high)}${analyst ? `, Analyst Target: ${fmt(analyst.target_price)}, Rating: ${analyst.rating ?? '--'}` : ''}`
    : `Stock: ${ticker}`

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
        <div className="flex items-center gap-2">
          <Link href={`/company/${ticker}`} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-md transition-colors">
            Company Profile
          </Link>
          <button
            onClick={() => setAgentOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /></svg>
            Analyze
          </button>
        </div>
      </div>

      {/* Stat tiles */}
      {quote && (
        <div className="grid grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Market Cap', val: fmtLarge(quote.market_cap) },
            { label: 'P/E Ratio', val: quote.pe_ratio?.toFixed(1) ?? '--' },
            { label: 'Fwd P/E', val: quote.forward_pe?.toFixed(1) ?? '--' },
            { label: 'EPS', val: fmt(quote.eps) },
            { label: 'Beta', val: quote.beta?.toFixed(2) ?? '--' },
            { label: 'Div Yield', val: quote.dividend_yield != null ? `${(quote.dividend_yield * 100).toFixed(2)}%` : '--' },
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

      {/* Analyst + Earnings */}
      <div className="grid grid-cols-2 gap-6">
        {/* Analyst consensus */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Analyst Consensus</p>
          {analyst ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-lg font-bold ${analyst.rating === 'Buy' || analyst.rating === 'Strong Buy' ? 'text-positive' : analyst.rating === 'Sell' ? 'text-negative' : 'text-warning'}`}>
                    {analyst.rating ?? '--'}
                  </p>
                  <p className="text-xs text-text-muted">Price Target: <span className="font-mono text-text-primary">{fmt(analyst.target_price)}</span></p>
                  {quote && analyst.target_price && (
                    <p className={`text-xs font-mono ${analyst.target_price > quote.price ? 'text-positive' : 'text-negative'}`}>
                      {analyst.target_price > quote.price ? '+' : ''}{(((analyst.target_price - quote.price) / quote.price) * 100).toFixed(1)}% upside
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Coverage</p>
                  <p className="font-mono text-text-primary">{(analyst.strong_buy + analyst.buy + analyst.hold + analyst.sell + analyst.strong_sell)} analysts</p>
                </div>
              </div>
              {analystRatingData.length > 0 && (
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={analystRatingData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }}
                      formatter={(v: number) => [v, 'Analysts']}
                      itemStyle={{ color: '#94a3b8' }}
                    />
                    <Bar dataKey="val" radius={[2, 2, 0, 0]}>
                      {analystRatingData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-6">No analyst data available.</p>
          )}
        </div>

        {/* Earnings */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">EPS History</p>
          {earnings.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={earnings} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v: number) => `$${v.toFixed(2)}`} />
                <Tooltip
                  contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }}
                  formatter={(v: number, name: string) => [`$${v?.toFixed(2)}`, name === 'actual' ? 'Actual EPS' : 'Estimate']}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <ReferenceLine y={0} stroke="#1e2d3d" />
                <Line type="monotone" dataKey="estimate" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="estimate" />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} name="actual" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-muted text-sm text-center py-6">No earnings data available.</p>
          )}
        </div>
      </div>

      <AgentPanel isOpen={agentOpen} onClose={() => setAgentOpen(false)} context={context} pageTitle={`${ticker} Stock Analysis`} />
    </div>
  )
}
