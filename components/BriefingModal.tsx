'use client'

import React from 'react'

interface SignalData {
  id: number
  trigger_summary: string
  brief: string
  conclusion: string
  metrics_json: string | null
  constituents_json?: string | null
  position_value: number
  position_gl: number
  position_gl_pct: number
  day_pnl: number
  triggered_at: string
}

interface BriefingModalProps {
  ticker: string
  signal: SignalData
  flavor: 'alert' | 'weekly' | 'daily'
  onDismiss: () => void
  onClose: () => void
}

function fmt$(v: number): string {
  return '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(v: number): string {
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%'
}

export function BriefingModal({ ticker, signal, flavor, onDismiss, onClose }: BriefingModalProps): React.ReactElement {
  const isWeekly = flavor === 'weekly'
  const isDaily = flavor === 'daily'

  const metrics = (() => {
    try { return signal.metrics_json ? JSON.parse(signal.metrics_json) : null } catch { return null }
  })()

  const constituents: Array<{ ticker: string; name: string; day_change_pct: number }> = (() => {
    try { return signal.constituents_json ? JSON.parse(signal.constituents_json) : [] } catch { return [] }
  })()

  const triggeredDate = new Date(signal.triggered_at)
  const timeStr = triggeredDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const dateStr = triggeredDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const dayPnlUp = signal.day_pnl >= 0
  const glUp = signal.position_gl >= 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.70)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl mx-4 rounded-xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#0f1623' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-blue-400 text-lg">{ticker}</span>
              {isWeekly ? (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-500/20 text-slate-200 border border-slate-400/30">
                  📌 Weekly Brief — {signal.trigger_summary}
                </span>
              ) : isDaily ? (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  🔵 Daily Brief — {signal.trigger_summary}
                </span>
              ) : (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
                  ⚠ Alert — {signal.trigger_summary}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">{dateStr}{(!isWeekly && !isDaily) && ` at ${timeStr}`}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none ml-4 mt-0.5">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {signal.brief}
            </p>
          </div>

          <div className="rounded-lg border border-blue-500/30 bg-blue-500/[0.08] px-4 py-3">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-blue-400/70 mb-1">Conclusion</p>
            <p className="font-mono text-sm text-blue-200">{signal.conclusion}</p>
          </div>

          {metrics && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-500 mb-2">
                {isWeekly ? 'Week Metrics' : 'Metrics at Trigger'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(isWeekly ? [
                  { label: 'Week Open', value: metrics.week_open != null ? `$${Number(metrics.week_open).toFixed(2)}` : '--' },
                  { label: 'Week Close', value: metrics.week_close != null ? `$${Number(metrics.week_close).toFixed(2)}` : '--' },
                  { label: 'Week Chg', value: metrics.week_pct != null ? fmtPct(metrics.week_pct) : '--' },
                  { label: 'vs SPY', value: metrics.relative_performance ?? '--' },
                  { label: 'RSI Start', value: metrics.rsi_start != null ? Number(metrics.rsi_start).toFixed(1) : '--' },
                  { label: 'RSI End', value: metrics.rsi_end != null ? Number(metrics.rsi_end).toFixed(1) : '--' },
                ] : [
                  { label: 'Price', value: metrics.price != null ? `$${Number(metrics.price).toFixed(2)}` : '--' },
                  { label: 'Day Chg', value: metrics.day_change_pct != null ? fmtPct(metrics.day_change_pct) : '--' },
                  { label: 'RSI(14)', value: metrics.rsi != null ? Number(metrics.rsi).toFixed(1) : '--' },
                  { label: 'Volume', value: metrics.volume != null ? Number(metrics.volume).toLocaleString() : '--' },
                  { label: 'P/E', value: metrics.pe != null && metrics.pe > 0 ? Number(metrics.pe).toFixed(1) : '--' },
                  { label: 'Target Upside', value: metrics.target_mean && metrics.price
                    ? fmtPct(((metrics.target_mean - metrics.price) / metrics.price) * 100) : '--' },
                ]).map(({ label, value }) => (
                  <div key={label} className="bg-[#141d2e] rounded px-3 py-2">
                    <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
                    <p className="font-mono text-xs text-slate-200">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {constituents.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-500 mb-2">Top Constituent Moves</p>
              <div className="bg-[#141d2e] rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {constituents.map((c) => (
                      <tr key={c.ticker} className="border-b border-white/5 last:border-0">
                        <td className="px-3 py-1.5 font-mono text-blue-400 font-semibold w-16">{c.ticker}</td>
                        <td className="px-3 py-1.5 text-slate-400 truncate">{c.name}</td>
                        <td className={`px-3 py-1.5 font-mono text-right ${c.day_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {fmtPct(c.day_change_pct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-[#141d2e] rounded-lg px-4 py-3">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-500 mb-2">Position Impact</p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-slate-500 mb-0.5">Position Value</p>
                <p className="font-mono text-slate-200">{fmt$(signal.position_value)}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-0.5">Unrealized G/L</p>
                <p className={`font-mono ${glUp ? 'text-green-400' : 'text-red-400'}`}>
                  {glUp ? '+' : '-'}{fmt$(signal.position_gl)} ({fmtPct(signal.position_gl_pct)})
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-0.5">Today&apos;s Impact</p>
                <p className={`font-mono ${dayPnlUp ? 'text-green-400' : 'text-red-400'}`}>
                  {dayPnlUp ? '+' : '-'}{fmt$(signal.day_pnl)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Keep for later
          </button>
          <button
            onClick={onDismiss}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Mark as Read
          </button>
        </div>
      </div>
    </div>
  )
}
