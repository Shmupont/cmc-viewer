'use client'

import React, { useEffect, useRef, useState } from 'react'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

interface CompareItem {
  ticker: string
  name: string
  price: number
  day_change_pct: number
  week_52_high: number | null
  week_52_low: number | null
  market_cap: number | null
  pe_ratio: number | null
  beta: number | null
}

interface RebasedPoint {
  date: string
  [ticker: string]: number | string
}

type Range = '1mo' | '3mo' | '6mo' | '1y' | '5y'

export default function CompareClient(): React.ReactElement {
  const [tickers, setTickers] = useState<string[]>(['SPY', 'QQQ'])
  const [input, setInput] = useState('')
  const [quotes, setQuotes] = useState<Record<string, CompareItem>>({})
  const [chartData, setChartData] = useState<RebasedPoint[]>([])
  const [range, setRange] = useState<Range>('1y')
  const [loading, setLoading] = useState(false)

  const fetchData = async (tickerList: string[], r: Range) => {
    setLoading(true)
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers: tickerList, range: r }),
      })
      const data = await res.json()
      if (data.quotes) setQuotes(data.quotes)
      if (data.rebased) setChartData(data.rebased)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tickers.length > 0) fetchData(tickers, range)
  }, [tickers, range])

  const addTicker = () => {
    const t = input.trim().toUpperCase()
    if (!t || tickers.includes(t) || tickers.length >= 6) return
    const next = [...tickers, t]
    setTickers(next)
    setInput('')
  }

  const removeTicker = (t: string) => {
    setTickers(prev => prev.filter(x => x !== t))
    setQuotes(prev => { const n = { ...prev }; delete n[t]; return n })
  }

  const fmtLarge = (v: number | null | undefined): string => {
    if (v == null) return '--'
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
    return `$${(v / 1e6).toFixed(0)}M`
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary text-xl font-semibold">Compare</h1>
      </div>

      {/* Ticker input */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-2 flex-wrap flex-1">
          {tickers.map((t, i) => (
            <div key={t} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono border"
              style={{ borderColor: COLORS[i % COLORS.length], color: COLORS[i % COLORS.length] }}>
              {t}
              <button onClick={() => removeTicker(t)} className="hover:text-white ml-1 opacity-60 hover:opacity-100">×</button>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); addTicker() }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="Add ticker..."
            maxLength={10}
            className="bg-surface-2 border border-border rounded px-3 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent w-32"
          />
          <button type="submit"
            className="px-3 py-1.5 bg-accent hover:bg-accent/90 text-white text-sm rounded transition-colors">
            Add
          </button>
        </form>
      </div>

      {/* Range selector */}
      <div className="flex gap-1 mb-6">
        {(['1mo', '3mo', '6mo', '1y', '5y'] as Range[]).map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-3 py-1 text-xs rounded transition-colors ${range === r ? 'bg-accent text-white' : 'bg-surface-2 text-text-muted hover:text-text-secondary border border-border'}`}>
            {r}
          </button>
        ))}
      </div>

      {/* Rebased performance chart */}
      <div className="bg-surface border border-border rounded-lg p-4 mb-6">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Relative Performance (rebased to 100)</p>
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size={32} /></div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }}
                formatter={(v: number, name: string) => [`${v.toFixed(2)}`, name]}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
              {tickers.map((t, i) => (
                <Line key={t} type="monotone" dataKey={t} stroke={COLORS[i % COLORS.length]} strokeWidth={1.5} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-text-muted text-sm text-center py-8">Add tickers to compare performance.</p>
        )}
      </div>

      {/* Comparison table */}
      {Object.keys(quotes).length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Side-by-Side Comparison</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-muted py-2 px-3 text-xs font-normal">Ticker</th>
                  <th className="text-left text-text-muted py-2 px-3 text-xs font-normal">Name</th>
                  <th className="text-right text-text-muted py-2 px-3 text-xs font-normal">Price</th>
                  <th className="text-right text-text-muted py-2 px-3 text-xs font-normal">Day %</th>
                  <th className="text-right text-text-muted py-2 px-3 text-xs font-normal">52W High</th>
                  <th className="text-right text-text-muted py-2 px-3 text-xs font-normal">52W Low</th>
                  <th className="text-right text-text-muted py-2 px-3 text-xs font-normal">Market Cap</th>
                  <th className="text-right text-text-muted py-2 px-3 text-xs font-normal">P/E</th>
                  <th className="text-right text-text-muted py-2 px-3 text-xs font-normal">Beta</th>
                </tr>
              </thead>
              <tbody>
                {tickers.filter(t => quotes[t]).map((t, i) => {
                  const q = quotes[t]
                  return (
                    <tr key={t} className="border-b border-border/50 hover:bg-surface-2">
                      <td className="py-2 px-3 font-mono font-bold text-sm" style={{ color: COLORS[i % COLORS.length] }}>{t}</td>
                      <td className="py-2 px-3 text-text-secondary text-xs max-w-[160px] truncate">{q.name}</td>
                      <td className="py-2 px-3 font-mono text-text-primary text-right">${q.price?.toFixed(2)}</td>
                      <td className={`py-2 px-3 font-mono text-right ${q.day_change_pct >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {q.day_change_pct >= 0 ? '+' : ''}{q.day_change_pct?.toFixed(2)}%
                      </td>
                      <td className="py-2 px-3 font-mono text-text-secondary text-right">{q.week_52_high != null ? `$${q.week_52_high.toFixed(2)}` : '--'}</td>
                      <td className="py-2 px-3 font-mono text-text-secondary text-right">{q.week_52_low != null ? `$${q.week_52_low.toFixed(2)}` : '--'}</td>
                      <td className="py-2 px-3 font-mono text-text-secondary text-right">{fmtLarge(q.market_cap)}</td>
                      <td className="py-2 px-3 font-mono text-text-secondary text-right">{q.pe_ratio?.toFixed(1) ?? '--'}</td>
                      <td className="py-2 px-3 font-mono text-text-secondary text-right">{q.beta?.toFixed(2) ?? '--'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
