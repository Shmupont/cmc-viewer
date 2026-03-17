'use client'

import React, { useEffect, useState } from 'react'

interface FixedIncomeData {
  ticker: string
  duration: number
  dv01: number
  rate_sensitivity: Array<{ rate_change: string; portfolio_impact: number }>
}

export function FixedIncomePanel(): React.ReactElement {
  const [data, setData] = useState<FixedIncomeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // SHV is the primary fixed income holding: ~0.5yr duration, $100 shares × $110 = $11,000
    const shvValue = 100 * 110.45
    const duration = 0.5
    const dv01 = (shvValue * duration) / 10000

    setData({
      ticker: 'SHV',
      duration,
      dv01,
      rate_sensitivity: [
        { rate_change: '+100bps', portfolio_impact: -(shvValue * duration * 0.01) },
        { rate_change: '+50bps',  portfolio_impact: -(shvValue * duration * 0.005) },
        { rate_change: '-50bps',  portfolio_impact:  (shvValue * duration * 0.005) },
        { rate_change: '-100bps', portfolio_impact:  (shvValue * duration * 0.01) },
      ],
    })
    setLoading(false)
  }, [])

  if (loading) return <div className="h-32 flex items-center justify-center"><div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" /></div>
  if (!data) return <div className="text-center text-text-muted py-12 text-sm">No fixed income data</div>

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-lg border border-border p-4">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">SHV — Fixed Income Summary</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Position', value: `$${(100 * 110.45).toLocaleString()}`, sub: '100 shares' },
            { label: 'Duration', value: `${data.duration}yr`, sub: 'Modified Duration' },
            { label: 'DV01', value: `$${data.dv01.toFixed(2)}`, sub: 'Per basis point' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-surface-2 rounded-lg p-3">
              <p className="text-[10px] text-text-muted mb-1">{label}</p>
              <p className="font-mono text-text-primary font-semibold">{value}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-border p-4">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-4">Rate Sensitivity</p>
        <table className="w-full text-xs">
          <thead className="border-b border-border">
            <tr>
              <th className="text-left text-text-muted py-2 px-3">Rate Change</th>
              <th className="text-right text-text-muted py-2 px-3">Portfolio Impact</th>
            </tr>
          </thead>
          <tbody>
            {data.rate_sensitivity.map((row) => (
              <tr key={row.rate_change} className="border-b border-border/30">
                <td className="py-2 px-3 font-mono text-text-secondary">{row.rate_change}</td>
                <td className={`py-2 px-3 font-mono text-right ${row.portfolio_impact >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {row.portfolio_impact >= 0 ? '+' : ''}${row.portfolio_impact.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
