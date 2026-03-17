'use client'

import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export function SpreadHistory(): React.ReactElement {
  const [data, setData] = useState<Array<{ date: string; value: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/macro?series=spread_history')
      .then((r) => r.json())
      .then((d) => setData(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const latest = data[data.length - 1]?.value ?? null
  const isInverted = (latest ?? 0) < 0

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted">2Y/10Y Spread</p>
        {latest !== null && (
          <span className={`text-xs font-mono font-bold ${isInverted ? 'text-negative' : 'text-positive'}`}>
            {latest.toFixed(2)}% {isInverted ? '⚠ INVERTED' : ''}
          </span>
        )}
      </div>
      {loading ? (
        <div className="h-40 flex items-center justify-center"><div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" /></div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data.slice(-90)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} tickCount={4} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v: number) => `${v.toFixed(2)}%`} />
            <Tooltip
              contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }}
              formatter={(v: number) => [`${v.toFixed(3)}%`, '2Y/10Y Spread']}
              itemStyle={{ color: '#94a3b8' }}
            />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1.5} />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
