'use client'

import React, { useEffect, useState } from 'react'
import { Sparkline } from '@/components/Sparkline'
import { PostItNote } from '@/components/PostItNote'
import type { PortfolioHolding } from '@/types'

interface SignalData {
  id: number
  trigger_summary: string
  conclusion: string
}

const ETF_PROVIDER: Record<string, string> = {
  SHV: 'iShares', IBB: 'iShares',
  XLF: 'SPDR', XLV: 'SPDR', XLY: 'SPDR',
  VDC: 'Vanguard', VDE: 'Vanguard', VIS: 'Vanguard',
  VGT: 'Vanguard', VNQ: 'Vanguard', VPU: 'Vanguard',
}

function fmt$(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '--'
  return '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function ETFCard({
  holding, onClick, alertSignal, weeklySignal, dailySignal,
  onAlertClick, onWeeklyClick, onDailyClick,
}: {
  holding: PortfolioHolding
  onClick: () => void
  alertSignal?: SignalData
  weeklySignal?: SignalData
  dailySignal?: SignalData
  onAlertClick?: () => void
  onWeeklyClick?: () => void
  onDailyClick?: () => void
}): React.ReactElement {
  const [sparkData, setSparkData] = useState<number[]>([])
  const price = holding.price_data
  const provider = ETF_PROVIDER[holding.ticker] ?? 'ETF'
  const dayPct = price?.day_change_pct ?? 0
  const dayUp = dayPct >= 0
  const glUp = (holding.unrealized_gl ?? 0) >= 0

  useEffect(() => {
    fetch(`/api/market/intraday?ticker=${holding.ticker}`)
      .then((r) => r.json())
      .then((c: number[]) => { if (c?.length > 1) setSparkData(c) })
      .catch(() => {})
  }, [holding.ticker])

  const hasAny = (alertSignal && onAlertClick) || (weeklySignal && onWeeklyClick) || (dailySignal && onDailyClick)

  return (
    <div
      onClick={onClick}
      className="relative bg-surface border border-border rounded-lg p-4 cursor-pointer hover:border-border-bright hover:bg-surface-2 transition-all"
    >
      {hasAny && (
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          {dailySignal && onDailyClick && (
            <PostItNote signal={dailySignal} flavor="daily" onClick={(e) => { e.stopPropagation(); onDailyClick() }} />
          )}
          {weeklySignal && onWeeklyClick && (
            <PostItNote signal={weeklySignal} flavor="weekly" onClick={(e) => { e.stopPropagation(); onWeeklyClick() }} />
          )}
          {alertSignal && onAlertClick && (
            <PostItNote signal={alertSignal} flavor="alert" onClick={(e) => { e.stopPropagation(); onAlertClick() }} />
          )}
        </div>
      )}
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          <span className="text-accent font-mono font-bold text-sm">{holding.ticker}</span>
          <span className="text-[10px] text-neutral bg-surface-2 px-1.5 py-0.5 rounded">
            {holding.asset_type === 'bond_etf' ? 'Bond ETF' : 'ETF'}
          </span>
        </div>
        <span className="text-[10px] text-text-muted">{provider}</span>
      </div>
      <p className="text-text-muted text-[11px] mb-3 truncate">{holding.name}</p>
      <div className="flex justify-between items-end mb-3">
        <div>
          <div className="font-mono text-text-primary text-lg font-semibold leading-tight">
            {price?.price ? '$' + price.price.toFixed(2) : '--'}
          </div>
          <div className={`font-mono text-xs font-medium ${dayUp ? 'text-positive' : 'text-negative'}`}>
            {price ? `${dayUp ? '+' : ''}${dayPct.toFixed(2)}%` : '--'}
          </div>
        </div>
        <Sparkline data={sparkData} width={80} height={32} />
      </div>
      <div className="border-t border-border pt-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">Position</span>
          <span className="font-mono text-text-secondary">{fmt$(holding.current_value)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">Unrealized G/L</span>
          <span className={`font-mono font-medium ${holding.unrealized_gl != null ? (glUp ? 'text-positive' : 'text-negative') : 'text-text-muted'}`}>
            {holding.unrealized_gl != null
              ? `${glUp ? '+' : '-'}${fmt$(holding.unrealized_gl)} (${glUp ? '+' : ''}${(holding.unrealized_gl_pct ?? 0).toFixed(2)}%)`
              : '--'}
          </span>
        </div>
      </div>
    </div>
  )
}
