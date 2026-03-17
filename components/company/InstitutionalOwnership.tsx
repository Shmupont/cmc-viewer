'use client'

import React, { useEffect, useState } from 'react'

interface Holder {
  name: string
  pct_held: number | null
  shares: number | null
  value: number | null
}

interface Breakdown {
  insiders_pct: number | null
  institutions_pct: number | null
  float_pct: number | null
}

export function InstitutionalOwnership({ ticker }: { ticker: string }): React.ReactElement {
  const [holders, setHolders] = useState<Holder[]>([])
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/company?ticker=${ticker}&type=institutional`)
      .then((r) => r.json())
      .then((d) => { setHolders(d.holders ?? []); setBreakdown(d.breakdown ?? null) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return <div className="h-32 flex items-center justify-center"><div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" /></div>

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-3">Institutional Ownership</p>
      {breakdown && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Insiders', val: breakdown.insiders_pct },
            { label: 'Institutions', val: breakdown.institutions_pct },
            { label: 'Float %', val: breakdown.float_pct },
          ].map(({ label, val }) => (
            <div key={label} className="bg-surface-2 rounded p-2 text-center">
              <p className="text-[10px] text-text-muted">{label}</p>
              <p className="font-mono text-text-primary font-semibold text-sm">{val != null ? `${(val * 100).toFixed(1)}%` : '--'}</p>
            </div>
          ))}
        </div>
      )}
      {holders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left text-text-muted py-2 px-2">Institution</th>
                <th className="text-right text-text-muted py-2 px-2">% Held</th>
                <th className="text-right text-text-muted py-2 px-2">Shares</th>
              </tr>
            </thead>
            <tbody>
              {holders.slice(0, 10).map((h, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-surface-2">
                  <td className="py-1.5 px-2 text-text-secondary truncate max-w-[200px]">{h.name}</td>
                  <td className="py-1.5 px-2 font-mono text-right text-text-secondary">{h.pct_held != null ? `${(h.pct_held * 100).toFixed(2)}%` : '--'}</td>
                  <td className="py-1.5 px-2 font-mono text-right text-text-muted">{h.shares?.toLocaleString() ?? '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
