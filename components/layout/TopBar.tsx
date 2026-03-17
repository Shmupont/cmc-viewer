'use client'

import React, { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useAppStore } from '@/store'

interface TopBarProps {
  onAlertsClick?: () => void
  onWatchlistClick?: () => void
}

export function TopBar({ onAlertsClick, onWatchlistClick }: TopBarProps): React.ReactElement {
  const { portfolioSummary, macroRates, refreshMacro, refreshHoldings } = useAppStore()
  const [spx, setSpx] = useState<{ price: number | null; change: number | null }>({ price: null, change: null })
  const [vix, setVix] = useState<number | null>(null)

  useEffect(() => {
    loadMacroData()
    const interval = setInterval(loadMacroData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  async function loadMacroData(): Promise<void> {
    await Promise.allSettled([refreshMacro(), refreshHoldings()])
    try {
      const spxRes = await fetch('/api/market/quote?ticker=%5EGSPC')
      const spxData = await spxRes.json()
      if (spxData?.price) {
        setSpx({ price: spxData.price, change: spxData.day_change_pct })
      }
      const vixRes = await fetch('/api/macro?series=vix&limit=1')
      const vixData = await vixRes.json()
      if (vixData?.data?.[0]) setVix(vixData.data[0].value)
    } catch {
      // ignore
    }
  }

  const fmt = (v: number | null, decimals = 2): string => {
    if (v === null || isNaN(v)) return '--'
    return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  const fmtDollar = (v: number | null): string => {
    if (v === null || isNaN(v)) return '--'
    const abs = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `${v >= 0 ? '+' : '-'}$${abs}`
  }

  const colorOf = (v: number | null): string => {
    if (v === null) return 'text-text-secondary'
    return v >= 0 ? 'text-positive' : 'text-negative'
  }

  return (
    <div className="h-10 flex items-center px-4 bg-surface border-b border-border text-xs gap-4 flex-shrink-0">
      {/* S&P 500 */}
      <div className="flex items-center gap-1.5">
        <span className="text-text-muted">S&P</span>
        <span className="font-mono text-text-primary">{fmt(spx.price, 2)}</span>
        {spx.change !== null && (
          <span className={`font-mono ${colorOf(spx.change)}`}>
            {spx.change !== null ? `${spx.change >= 0 ? '+' : ''}${fmt(spx.change)}%` : '--'}
          </span>
        )}
      </div>

      <span className="text-border">|</span>

      {/* VIX */}
      <div className="flex items-center gap-1.5">
        <span className="text-text-muted">VIX</span>
        <span className="font-mono text-text-primary">{fmt(vix)}</span>
      </div>

      <span className="text-border">|</span>

      {/* 10Y Yield */}
      <div className="flex items-center gap-1.5">
        <span className="text-text-muted">10Y</span>
        <span className="font-mono text-text-primary">
          {macroRates?.tenYear != null ? `${fmt(macroRates.tenYear)}%` : '--'}
        </span>
      </div>

      <span className="text-border">|</span>

      {/* Fed Rate */}
      <div className="flex items-center gap-1.5">
        <span className="text-text-muted">Fed</span>
        <span className="font-mono text-text-primary">
          {macroRates?.fedFunds != null ? `${fmt(macroRates.fedFunds)}%` : '--'}
        </span>
      </div>

      <span className="text-border">|</span>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        <span className="text-text-muted text-xs">Portfolio</span>
        <span className="font-mono text-text-primary font-semibold text-sm">
          {portfolioSummary
            ? `$${portfolioSummary.total_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '--'}
        </span>
        {portfolioSummary && (
          <span className={`font-mono text-xs ${colorOf(portfolioSummary.day_change)}`}>
            {fmtDollar(portfolioSummary.day_change)} ({portfolioSummary.day_change >= 0 ? '+' : ''}{fmt(portfolioSummary.day_change_pct)}%)
          </span>
        )}
        <span className="text-border">|</span>
        <button onClick={onWatchlistClick} className="text-slate-500 hover:text-amber-400 transition-colors" title="Watchlist">☆</button>
        <button onClick={onAlertsClick} className="text-slate-500 hover:text-white transition-colors" title="Alerts">
          <Bell size={14} />
        </button>
      </div>
    </div>
  )
}
