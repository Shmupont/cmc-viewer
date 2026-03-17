'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface YieldCurvePoint { tenor: string; value: number | null; months: number }

const TENOR_ORDER = ['1M', '3M', '6M', '1Y', '2Y', '5Y', '7Y', '10Y', '20Y', '30Y']

export function YieldCurveChart({ current, oneMonthAgo, oneYearAgo }: {
  current: YieldCurvePoint[]
  oneMonthAgo?: YieldCurvePoint[]
  oneYearAgo?: YieldCurvePoint[]
}): React.ReactElement {
  const data = TENOR_ORDER.map((tenor) => ({
    tenor,
    current: current.find((p) => p.tenor === tenor)?.value ?? null,
    oneMonthAgo: oneMonthAgo?.find((p) => p.tenor === tenor)?.value ?? null,
    oneYearAgo: oneYearAgo?.find((p) => p.tenor === tenor)?.value ?? null,
  })).filter((d) => d.current !== null)

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
        <XAxis dataKey="tenor" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(2)}%`} domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }}
          labelStyle={{ color: '#e2e8f0' }}
          itemStyle={{ color: '#94a3b8' }}
          formatter={(v: number) => `${v?.toFixed(2)}%`}
        />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        <Line type="monotone" dataKey="current" name="Current" stroke="#3b82f6" strokeWidth={2} dot={false} />
        {oneMonthAgo && <Line type="monotone" dataKey="oneMonthAgo" name="1M Ago" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />}
        {oneYearAgo && <Line type="monotone" dataKey="oneYearAgo" name="1Y Ago" stroke="#64748b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />}
      </LineChart>
    </ResponsiveContainer>
  )
}
