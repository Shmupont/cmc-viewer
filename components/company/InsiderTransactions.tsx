'use client'

import React, { useEffect, useState } from 'react'

interface Transaction {
  name: string
  relation: string
  transaction_type: string
  shares: number | null
  value: number | null
  date: string
}

export function InsiderTransactions({ ticker }: { ticker: string }): React.ReactElement {
  const [data, setData] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/company?ticker=${ticker}&type=insider`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return <div className="h-32 flex items-center justify-center"><div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" /></div>

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-3">Insider Transactions</p>
      {data.length === 0 ? (
        <p className="text-text-muted text-xs text-center py-4">No insider transactions available</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left text-text-muted py-2 px-2">Person</th>
                <th className="text-left text-text-muted py-2 px-2">Role</th>
                <th className="text-left text-text-muted py-2 px-2">Transaction</th>
                <th className="text-right text-text-muted py-2 px-2">Shares</th>
                <th className="text-right text-text-muted py-2 px-2">Value</th>
                <th className="text-right text-text-muted py-2 px-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t, i) => {
                const isBuy = t.transaction_type?.toLowerCase().includes('buy') || t.transaction_type?.toLowerCase().includes('purchase')
                return (
                  <tr key={i} className="border-b border-border/30 hover:bg-surface-2">
                    <td className="py-1.5 px-2 text-text-secondary">{t.name}</td>
                    <td className="py-1.5 px-2 text-text-muted">{t.relation}</td>
                    <td className={`py-1.5 px-2 font-mono text-xs ${isBuy ? 'text-positive' : 'text-negative'}`}>{t.transaction_type}</td>
                    <td className="py-1.5 px-2 font-mono text-right text-text-secondary">{t.shares?.toLocaleString() ?? '--'}</td>
                    <td className="py-1.5 px-2 font-mono text-right text-text-secondary">{t.value ? `$${(t.value / 1e6).toFixed(1)}M` : '--'}</td>
                    <td className="py-1.5 px-2 text-right text-text-muted">{t.date}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
