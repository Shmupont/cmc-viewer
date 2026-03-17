'use client'

import React, { useEffect, useState } from 'react'

interface DividendInfo {
  dividend_yield: number | null
  dividend_rate: number | null
  payout_ratio: number | null
  ex_date: string | null
  pay_date: string | null
}

export function DividendHistory({ ticker }: { ticker: string }): React.ReactElement {
  const [data, setData] = useState<DividendInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/company?ticker=${ticker}&type=dividends`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return <div className="h-24 flex items-center justify-center"><div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" /></div>
  if (!data || (!data.dividend_yield && !data.dividend_rate)) {
    return (
      <div className="bg-surface rounded-lg border border-border p-4">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-2">Dividends</p>
        <p className="text-text-muted text-xs text-center py-3">No dividend data available</p>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-3">Dividends</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Yield', val: data.dividend_yield != null ? `${(data.dividend_yield * 100).toFixed(2)}%` : '--' },
          { label: 'Annual Rate', val: data.dividend_rate != null ? `$${data.dividend_rate.toFixed(2)}` : '--' },
          { label: 'Payout Ratio', val: data.payout_ratio != null ? `${(data.payout_ratio * 100).toFixed(1)}%` : '--' },
          { label: 'Ex-Date', val: data.ex_date ?? '--' },
          { label: 'Pay Date', val: data.pay_date ?? '--' },
        ].map(({ label, val }) => (
          <div key={label} className="bg-surface-2 rounded p-2">
            <p className="text-[10px] text-text-muted">{label}</p>
            <p className="font-mono text-text-primary text-sm">{val}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
