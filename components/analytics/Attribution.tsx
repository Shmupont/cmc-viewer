'use client'

import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts'

type Period = '1D' | '1W' | '1M' | '3M' | '1Y'

interface Contribution {
  ticker: string
  return_pct: number
}

export function Attribution(): React.ReactElement {
  const [period, setPeriod] = useState<Period>('1M')
  const [data, setData] = useState<Contribution[]>([])
  const [benchmark, setBenchmark] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?type=attribution&period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.contributions ?? [])
        setBenchmark(d.benchmark ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [period])

  const PERIODS: Period[] = ['1D', '1W', '1M', '3M', '1Y']

  return (
    <div className="space-y-6">
      {/* Period selector + benchmark chip */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs rounded font-mono transition-colors ${period === p ? 'bg-accent text-white' : 'text-text-muted hover:text-text-secondary hover:bg-surface-2'}`}>
              {p}
            </button>
          ))}
        </div>
        {benchmark !== null && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">SPY:</span>
            <span className={`text-xs font-mono font-semibold ${benchmark >= 0 ? 'text-positive' : 'text-negative'}`}>
              {benchmark >= 0 ? '+' : ''}{benchmark.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div className="bg-surface rounded-lg border border-border p-4">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Holding Returns</p>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="ticker" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
              <Tooltip
                contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }}
                itemStyle={{ color: '#94a3b8' }}
                formatter={(v: number) => [`${v.toFixed(2)}%`, 'Return']}
              />
              <ReferenceLine y={0} stroke="#334155" />
              <Bar dataKey="return_pct" radius={[2, 2, 0, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.return_pct >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="border-b border-border">
            <tr>
              <th className="text-left text-text-muted py-2 px-4">Ticker</th>
              <th className="text-right text-text-muted py-2 px-4">Return</th>
              <th className="text-right text-text-muted py-2 px-4">vs SPY</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.ticker} className="border-b border-border/30 hover:bg-surface-2">
                <td className="py-2 px-4 font-mono text-accent">{d.ticker}</td>
                <td className={`py-2 px-4 font-mono text-right ${d.return_pct >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {d.return_pct >= 0 ? '+' : ''}{d.return_pct.toFixed(2)}%
                </td>
                <td className={`py-2 px-4 font-mono text-right ${benchmark !== null ? (d.return_pct - benchmark >= 0 ? 'text-positive' : 'text-negative') : 'text-text-muted'}`}>
                  {benchmark !== null ? `${(d.return_pct - benchmark) >= 0 ? '+' : ''}${(d.return_pct - benchmark).toFixed(2)}%` : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
