'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PricePoint { date: string; value: number }

export function PriceChart({ data, color = '#3b82f6', height = 200 }: {
  data: PricePoint[]
  color?: string
  height?: number
}): React.ReactElement {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ background: '#0f1623', border: '1px solid #1e2d3d', borderRadius: 6 }}
          itemStyle={{ color: '#94a3b8' }}
        />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
