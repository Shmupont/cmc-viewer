'use client'

import React, { useState } from 'react'
import type { PortfolioHolding } from '@/types'

type SortDir = 'asc' | 'desc'

export function HoldingsTable({ holdings, onRowClick }: {
  holdings: PortfolioHolding[]
  onRowClick?: (holding: PortfolioHolding) => void
}): React.ReactElement {
  const [sortKey, setSortKey] = useState('pct_of_portfolio')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleSort = (key: string): void => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...holdings].sort((a, b) => {
    const av = (a as unknown as Record<string, unknown>)[sortKey]
    const bv = (b as unknown as Record<string, unknown>)[sortKey]
    if (av == null) return 1; if (bv == null) return -1
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const fmt = (v: number | null | undefined): string => {
    if (v == null || isNaN(Number(v))) return '--'
    return `$${Math.abs(Number(v)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  const fmtChg = (v: number | null | undefined): string => {
    if (v == null || isNaN(Number(v))) return '--'
    const abs = Math.abs(Number(v)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `${Number(v) >= 0 ? '+' : '-'}$${abs}`
  }
  const clr = (v: number | null | undefined): string => {
    if (v == null) return 'text-text-secondary'
    return Number(v) >= 0 ? 'text-positive' : 'text-negative'
  }

  const colH = (label: string, key: string): React.ReactElement => (
    <th onClick={() => handleSort(key)}
      className="text-left text-xs text-text-muted py-2 px-3 cursor-pointer hover:text-text-secondary whitespace-nowrap">
      {label}{sortKey === key && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  )

  const totals = holdings.reduce((acc, h) => ({
    value: acc.value + (h.current_value ?? 0),
    gl: acc.gl + (h.unrealized_gl ?? 0),
    dayChange: acc.dayChange + (h.day_change_value ?? 0),
  }), { value: 0, gl: 0, dayChange: 0 })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border">
          <tr>
            {colH('Ticker', 'ticker')}{colH('Name', 'name')}{colH('Type', 'asset_type')}
            {colH('Shares', 'shares')}{colH('Cost/sh', 'cost_basis')}{colH('Price', 'price')}
            {colH('Value', 'current_value')}{colH('Day $', 'day_change_value')}{colH('Day %', 'day_pct')}
            {colH('G/L $', 'unrealized_gl')}{colH('G/L %', 'unrealized_gl_pct')}{colH('% Port', 'pct_of_portfolio')}
          </tr>
        </thead>
        <tbody>
          {sorted.map((h) => (
            <tr key={h.ticker} onClick={() => onRowClick?.(h)}
              className="border-b border-border/50 hover:bg-surface-2 cursor-pointer">
              <td className="py-2 px-3 font-mono text-accent text-xs">{h.ticker}</td>
              <td className="py-2 px-3 text-text-secondary text-xs max-w-[160px] truncate">{h.name}</td>
              <td className="py-2 px-3 text-text-muted text-xs capitalize">{(h.asset_type ?? '').replace('_', ' ')}</td>
              <td className="py-2 px-3 font-mono text-text-secondary text-xs">{Number(h.shares).toLocaleString()}</td>
              <td className="py-2 px-3 font-mono text-text-secondary text-xs">{h.cost_basis ? `$${Number(h.cost_basis).toFixed(2)}` : '--'}</td>
              <td className="py-2 px-3 font-mono text-text-primary text-xs">{h.price_data?.price ? fmt(h.price_data.price) : '--'}</td>
              <td className="py-2 px-3 font-mono text-text-primary text-xs">{fmt(h.current_value)}</td>
              <td className={`py-2 px-3 font-mono text-xs ${clr(h.day_change_value)}`}>{fmtChg(h.day_change_value)}</td>
              <td className={`py-2 px-3 font-mono text-xs ${clr(h.price_data?.day_change_pct)}`}>
                {h.price_data?.day_change_pct != null ? `${h.price_data.day_change_pct >= 0 ? '+' : ''}${h.price_data.day_change_pct.toFixed(2)}%` : '--'}
              </td>
              <td className={`py-2 px-3 font-mono text-xs ${clr(h.unrealized_gl)}`}>{fmtChg(h.unrealized_gl)}</td>
              <td className={`py-2 px-3 font-mono text-xs ${clr(h.unrealized_gl_pct)}`}>
                {h.unrealized_gl_pct != null ? `${h.unrealized_gl_pct >= 0 ? '+' : ''}${h.unrealized_gl_pct.toFixed(2)}%` : '--'}
              </td>
              <td className="py-2 px-3 font-mono text-text-secondary text-xs">{(h.pct_of_portfolio ?? 0).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-border">
          <tr className="bg-surface-2">
            <td colSpan={6} className="py-2 px-3 text-text-muted text-xs font-semibold">TOTAL</td>
            <td className="py-2 px-3 font-mono text-text-primary text-xs font-semibold">{fmt(totals.value)}</td>
            <td className={`py-2 px-3 font-mono text-xs font-semibold ${clr(totals.dayChange)}`}>{fmtChg(totals.dayChange)}</td>
            <td />
            <td className={`py-2 px-3 font-mono text-xs font-semibold ${clr(totals.gl)}`}>{fmtChg(totals.gl)}</td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
