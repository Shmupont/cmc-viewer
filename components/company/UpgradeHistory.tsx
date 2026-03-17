'use client'

import React, { useEffect, useState } from 'react'

interface Upgrade {
  firm: string
  from_grade: string
  to_grade: string
  action: string
  date: string
}

export function UpgradeHistory({ ticker }: { ticker: string }): React.ReactElement {
  const [data, setData] = useState<Upgrade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/company?ticker=${ticker}&type=upgrades`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return <div className="h-24 flex items-center justify-center"><div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" /></div>

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted mb-3">Analyst Actions</p>
      {data.length === 0 ? (
        <p className="text-text-muted text-xs text-center py-4">No upgrade history available</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left text-text-muted py-2 px-2">Firm</th>
                <th className="text-left text-text-muted py-2 px-2">Action</th>
                <th className="text-left text-text-muted py-2 px-2">From</th>
                <th className="text-left text-text-muted py-2 px-2">To</th>
                <th className="text-right text-text-muted py-2 px-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u, i) => {
                const isUpgrade = u.action?.toLowerCase().includes('upgrad') || u.action?.toLowerCase().includes('raisd')
                const isDowngrade = u.action?.toLowerCase().includes('downgrad')
                return (
                  <tr key={i} className="border-b border-border/30 hover:bg-surface-2">
                    <td className="py-1.5 px-2 text-text-secondary">{u.firm}</td>
                    <td className={`py-1.5 px-2 font-mono text-xs capitalize ${isUpgrade ? 'text-positive' : isDowngrade ? 'text-negative' : 'text-text-muted'}`}>{u.action}</td>
                    <td className="py-1.5 px-2 text-text-muted">{u.from_grade || '--'}</td>
                    <td className="py-1.5 px-2 text-text-secondary font-medium">{u.to_grade || '--'}</td>
                    <td className="py-1.5 px-2 text-right text-text-muted">{u.date}</td>
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
