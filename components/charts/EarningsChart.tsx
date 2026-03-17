'use client'

import React, { useEffect, useRef, useState } from 'react'

interface EarningsPoint {
  period: string
  date: string
  actual: number | null
  estimate: number | null
  surprisePct: number | null
  isFuture: boolean
}

function formatPeriod(dateStr: string): string {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const year = d.getFullYear()
  const q = month <= 3 ? 1 : month <= 6 ? 2 : month <= 9 ? 3 : 4
  return `Q${q} '${String(year).slice(2)}`
}

function getSurpriseColor(surprisePct: number | null): string {
  if (surprisePct === null) return '#64748b'
  if (surprisePct > 2) return '#22c55e'
  if (surprisePct < -2) return '#ef4444'
  return '#f59e0b'
}

function getSurpriseLabel(surprisePct: number | null): string {
  if (surprisePct === null) return ''
  if (surprisePct > 2) return `Beat +${surprisePct.toFixed(1)}%`
  if (surprisePct < -2) return `Missed ${surprisePct.toFixed(1)}%`
  return `In-line ${surprisePct > 0 ? '+' : ''}${surprisePct.toFixed(1)}%`
}

export function EarningsChart({ ticker }: { ticker: string }): React.ReactElement {
  const [data, setData] = useState<EarningsPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: EarningsPoint } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    setData([]); setLoading(true)
    fetch(`/api/market/earnings?ticker=${encodeURIComponent(ticker)}`)
      .then((r) => r.json())
      .then((hist: Record<string, unknown>[]) => {
        const points: EarningsPoint[] = hist.slice(0, 8).reverse().map((q) => {
          const dateStr = (q.date ?? q.period ?? '') as string
          const actual = typeof q.eps_actual === 'number' ? q.eps_actual : null
          const estimate = typeof q.eps_estimate === 'number' ? q.eps_estimate : null
          return {
            period: formatPeriod(dateStr), date: dateStr, actual, estimate,
            surprisePct: actual != null && estimate != null && estimate !== 0
              ? ((actual - estimate) / Math.abs(estimate)) * 100 : null,
            isFuture: false,
          }
        })
        setData(points)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return <div className="w-full h-48 bg-white/[0.02] rounded-lg animate-pulse" />
  if (data.length === 0) return <div className="w-full h-48 flex items-center justify-center text-slate-600 text-xs">No earnings data available</div>

  const W = 580; const H = 200
  const PAD = { top: 24, right: 24, bottom: 36, left: 52 }
  const chartW = W - PAD.left - PAD.right; const chartH = H - PAD.top - PAD.bottom

  const allValues = data.flatMap((d) => [d.actual, d.estimate]).filter((v): v is number => v !== null)
  const yMin = allValues.length ? Math.min(...allValues) * (Math.min(...allValues) < 0 ? 1.2 : 0.8) : -1
  const yMax = allValues.length ? Math.max(...allValues) * 1.2 : 1
  const yRange = yMax - yMin || 1

  const toY = (v: number): number => PAD.top + chartH - ((v - yMin) / yRange) * chartH
  const toX = (i: number): number => PAD.left + (i / Math.max(data.length - 1, 1)) * chartW
  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (i / 4) * yRange)

  const actualPoints = data.map((d, i) => d.actual !== null ? `${toX(i)},${toY(d.actual)}` : null).filter(Boolean)
  const linePath = actualPoints.length > 1 ? `M ${actualPoints.join(' L ')}` : null

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-4 mb-3 text-xs">
        {[['#22c55e', 'Beat'], ['#f59e0b', 'In-line'], ['#ef4444', 'Miss']].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <svg width="16" height="16"><circle cx="8" cy="8" r="5" fill={color} /></svg>
            <span className="text-slate-500">{label}</span>
          </div>
        ))}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} onMouseLeave={() => setTooltip(null)}>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)} stroke="#1e2d3d" strokeWidth="1" />
            <text x={PAD.left - 6} y={toY(v)} textAnchor="end" dominantBaseline="middle" fill="#475569" fontSize="9" fontFamily="monospace">{v.toFixed(2)}</text>
          </g>
        ))}
        {linePath && <path d={linePath} fill="none" stroke="#334155" strokeWidth="1.5" strokeLinejoin="round" />}
        {data.map((d, i) => {
          const x = toX(i); const yEst = d.estimate !== null ? toY(d.estimate) : null; const yAct = d.actual !== null ? toY(d.actual) : null
          const color = d.isFuture ? '#3b82f6' : getSurpriseColor(d.surprisePct)
          return (
            <g key={i} onMouseEnter={() => {
              const rect = svgRef.current?.getBoundingClientRect()
              if (rect) setTooltip({ x: x * (rect.width / W) + rect.left, y: rect.top, point: d })
            }}>
              {yEst !== null && yAct !== null && Math.abs(yEst - yAct) > 3 && (
                <line x1={x} y1={yEst} x2={x} y2={yAct} stroke={color} strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
              )}
              {yEst !== null && <circle cx={x} cy={yEst} r={6} fill="none" stroke={d.isFuture ? '#3b82f6' : '#64748b'} strokeWidth="1.5" strokeDasharray={d.isFuture ? '3 2' : undefined} opacity={d.isFuture ? 0.9 : 0.6} />}
              {yAct !== null && !d.isFuture && <circle cx={x} cy={yAct} r={7} fill={color} opacity={0.95} style={{ cursor: 'pointer' }} />}
              <text x={x} y={H - PAD.bottom + 14} textAnchor="middle" fill={d.isFuture ? '#3b82f6' : '#475569'} fontSize="9" fontFamily="monospace" fontStyle={d.isFuture ? 'italic' : 'normal'}>{d.period}</text>
            </g>
          )
        })}
      </svg>
      {tooltip && (
        <div className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg text-xs shadow-xl" style={{ background: '#0a0e17', border: '1px solid #1e2d3d', left: tooltip.x + 12, top: tooltip.y + 8, minWidth: 160 }}>
          <div className="font-semibold text-white mb-1">{tooltip.point.period}</div>
          {tooltip.point.actual !== null && <div className="flex justify-between gap-4"><span className="text-slate-400">Actual EPS</span><span className="font-mono text-white">${tooltip.point.actual.toFixed(2)}</span></div>}
          {tooltip.point.estimate !== null && <div className="flex justify-between gap-4"><span className="text-slate-400">Estimate</span><span className="font-mono text-slate-300">${tooltip.point.estimate.toFixed(2)}</span></div>}
          {tooltip.point.surprisePct !== null && (
            <div className="flex justify-between gap-4 mt-1 pt-1 border-t border-white/10">
              <span className="text-slate-400">Surprise</span>
              <span className="font-mono font-semibold" style={{ color: getSurpriseColor(tooltip.point.surprisePct) }}>{getSurpriseLabel(tooltip.point.surprisePct)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
