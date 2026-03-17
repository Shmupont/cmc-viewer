'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, ColorType, Time, CrosshairMode } from 'lightweight-charts'

type Range = '1M' | '3M' | '6M' | '1Y'
const RANGES: Range[] = ['1M', '3M', '6M', '1Y']
const RANGE_DAYS: Record<Range, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }

function subDays(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
}

interface Stats {
  totalReturnDollar: number
  totalReturnPct: number
  vsSPYPct: number | null
  vsQQQPct: number | null
}

export function PortfolioPerformanceChart(): React.ReactElement {
  const mainRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const portfolioSeries = useRef<ISeriesApi<'Line'> | null>(null)
  const spySeries = useRef<ISeriesApi<'Line'> | null>(null)
  const qqqSeries = useRef<ISeriesApi<'Line'> | null>(null)

  const [range, setRange] = useState<Range>('1Y')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (!mainRef.current) return
    const chart = createChart(mainRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#0f1623' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1a2535' }, horzLines: { color: '#1a2535' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#1e2d3d' },
      timeScale: { borderColor: '#1e2d3d', timeVisible: false },
      width: mainRef.current.clientWidth, height: 240,
    })

    portfolioSeries.current = chart.addLineSeries({ color: '#3b82f6', lineWidth: 2, priceLineVisible: false, lastValueVisible: true })
    spySeries.current = chart.addLineSeries({ color: '#64748b', lineWidth: 1, priceLineVisible: false, lastValueVisible: true, lineStyle: 2 })
    qqqSeries.current = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1, priceLineVisible: false, lastValueVisible: true, lineStyle: 2 })
    chartRef.current = chart

    const ro = new ResizeObserver(() => {
      if (mainRef.current) chart.applyOptions({ width: mainRef.current.clientWidth })
    })
    ro.observe(mainRef.current)
    return () => { ro.disconnect(); chart.remove() }
  }, [])

  useEffect(() => { loadData() }, [range])

  async function loadData(): Promise<void> {
    if (!portfolioSeries.current) return
    setLoading(true)
    try {
      const cutoff = subDays(RANGE_DAYS[range])
      const [snapsRes, spyRes, qqqRes] = await Promise.allSettled([
        fetch('/api/portfolio/snapshot').then((r) => r.json()),
        fetch(`/api/market/history?ticker=SPY&range=1y`).then((r) => r.json()),
        fetch(`/api/market/history?ticker=QQQ&range=1y`).then((r) => r.json()),
      ])

      const snaps: Array<{ snapshot_date: string; total_value: string }> =
        snapsRes.status === 'fulfilled' ? snapsRes.value : []
      const filtered = snaps.filter((s) => s.snapshot_date >= cutoff)

      if (filtered.length > 0) {
        const portfolioData = filtered.map((s) => ({
          time: s.snapshot_date as Time, value: Number(s.total_value),
        }))
        portfolioSeries.current?.setData(portfolioData)

        const startValue = Number(filtered[0].total_value)
        const endValue = Number(filtered[filtered.length - 1].total_value)
        const returnDollar = endValue - startValue
        const returnPct = startValue > 0 ? (returnDollar / startValue) * 100 : 0

        const rebase = (hist: Array<{ date: string; close: number }>): Array<{ time: Time; value: number }> => {
          const relevant = hist.filter((h) => h.date >= cutoff && h.close > 0)
          if (!relevant.length) return []
          const base = relevant[0].close
          return relevant.map((h) => ({ time: h.date as Time, value: (h.close / base) * startValue }))
        }

        const spyData = spyRes.status === 'fulfilled' ? rebase(spyRes.value) : []
        const qqqData = qqqRes.status === 'fulfilled' ? rebase(qqqRes.value) : []

        spySeries.current?.setData(spyData)
        qqqSeries.current?.setData(qqqData)
        chartRef.current?.timeScale().fitContent()

        const benchReturn = (data: Array<{ time: Time; value: number }>): number | null => {
          if (data.length < 2) return null
          const s = data[0].value; const e = data[data.length - 1].value
          return s > 0 ? ((e - s) / s) * 100 : null
        }

        setStats({ totalReturnDollar: returnDollar, totalReturnPct: returnPct, vsSPYPct: benchReturn(spyData), vsQQQPct: benchReturn(qqqData) })
      }
    } catch (err) {
      console.error('[PortfolioPerformanceChart]', err)
    } finally { setLoading(false) }
  }

  const fmt = (n: number): string => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const glColor = (n: number): string => n >= 0 ? 'text-green-400' : 'text-red-400'

  return (
    <div className="bg-surface rounded-lg border border-border p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-mono text-text-secondary tracking-wider uppercase">Portfolio Performance</h2>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-2 py-1 text-xs rounded font-mono transition-colors ${range === r ? 'bg-accent text-white' : 'text-text-muted hover:text-text-secondary hover:bg-surface-2'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total Return', val: `${stats.totalReturnDollar >= 0 ? '+' : ''}$${fmt(stats.totalReturnDollar)}`, color: glColor(stats.totalReturnDollar) },
            { label: 'Return %', val: `${stats.totalReturnPct >= 0 ? '+' : ''}${fmt(stats.totalReturnPct)}%`, color: glColor(stats.totalReturnPct) },
            { label: 'vs SPY', val: stats.vsSPYPct !== null ? `${(stats.totalReturnPct - stats.vsSPYPct) >= 0 ? '+' : ''}${fmt(stats.totalReturnPct - stats.vsSPYPct)}%` : '--', color: stats.vsSPYPct !== null ? glColor(stats.totalReturnPct - stats.vsSPYPct) : 'text-slate-500' },
            { label: 'vs QQQ', val: stats.vsQQQPct !== null ? `${(stats.totalReturnPct - stats.vsQQQPct) >= 0 ? '+' : ''}${fmt(stats.totalReturnPct - stats.vsQQQPct)}%` : '--', color: stats.vsQQQPct !== null ? glColor(stats.totalReturnPct - stats.vsQQQPct) : 'text-slate-500' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-white/[0.03] rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">{label}</div>
              <div className={`text-lg font-mono font-semibold ${color}`}>{val}</div>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-surface/50 z-10 rounded"><div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" /></div>}
        <div ref={mainRef} />
      </div>

      <div className="flex gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-blue-500" /><span className="text-slate-500">Portfolio</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-slate-500" /><span className="text-slate-500">SPY</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-amber-500" /><span className="text-slate-500">QQQ</span></div>
      </div>
    </div>
  )
}
