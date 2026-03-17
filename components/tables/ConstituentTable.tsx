'use client'

import React, { useState } from 'react'
import Link from 'next/link'

interface Constituent {
  ticker: string
  name: string
  weight: number
  sector: string
}

export function ConstituentTable({ constituents, onRowClick }: {
  constituents: Constituent[]
  onRowClick?: (ticker: string) => void
}): React.ReactElement {
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [sortKey, setSortKey] = useState('weight')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleSort = (key: string): void => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = constituents
    .filter((c) => {
      const q = search.toLowerCase()
      return c.ticker?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q) || c.sector?.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortKey]
      const bv = (b as unknown as Record<string, unknown>)[sortKey]
      if (av == null) return 1; if (bv == null) return -1
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })

  const displayed = showAll ? filtered : filtered.slice(0, 50)

  const colH = (label: string, key: string): React.ReactElement => (
    <th onClick={() => handleSort(key)}
      className="text-left text-xs text-text-muted py-2 px-3 cursor-pointer hover:text-text-secondary whitespace-nowrap">
      {label}{sortKey === key && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  )

  return (
    <div>
      <div className="mb-3">
        <input type="text" placeholder="Search by name or ticker..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface-2 border border-border rounded px-3 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className="text-left text-xs text-text-muted py-2 px-3">#</th>
              {colH('Company', 'name')}{colH('Ticker', 'ticker')}{colH('Weight%', 'weight')}{colH('Sector', 'sector')}
            </tr>
          </thead>
          <tbody>
            {displayed.map((c, i) => (
              <tr key={c.ticker}
                className="border-b border-border/50 hover:bg-surface-2 cursor-pointer"
                onClick={() => onRowClick?.(c.ticker)}>
                <td className="py-1.5 px-3 text-text-muted text-xs">{i + 1}</td>
                <td className="py-1.5 px-3 text-text-secondary text-xs max-w-[200px] truncate">{c.name}</td>
                <td className="py-1.5 px-3 text-xs">
                  <Link href={`/company/${c.ticker}`} className="font-mono text-accent hover:underline" onClick={(e) => e.stopPropagation()}>
                    {c.ticker}
                  </Link>
                </td>
                <td className="py-1.5 px-3 font-mono text-text-secondary text-xs">{c.weight?.toFixed(2)}%</td>
                <td className="py-1.5 px-3 text-text-muted text-xs">{c.sector ?? '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!showAll && filtered.length > 50 && (
        <button onClick={() => setShowAll(true)}
          className="mt-3 w-full py-2 text-xs text-text-muted hover:text-accent border border-border hover:border-accent rounded transition-colors">
          Load more ({filtered.length - 50} remaining)
        </button>
      )}
    </div>
  )
}
