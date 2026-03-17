'use client'

import React, { useId } from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
}

export function Sparkline({ data, width = 80, height = 32, color }: SparklineProps): React.ReactElement {
  const gradId = useId()

  if (!data || data.length < 2) {
    return <svg width={width} height={height} />
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 2

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - pad * 2) + pad
    const y = (height - pad) - ((v - min) / range) * (height - pad * 2)
    return [x, y] as [number, number]
  })

  const isUp = data[data.length - 1] >= data[0]
  const lineColor = color ?? (isUp ? '#22c55e' : '#ef4444')
  const fillColor = isUp ? '#22c55e' : '#ef4444'

  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const fillPath = linePath
    + ` L ${pts[pts.length - 1][0].toFixed(1)},${height}`
    + ` L ${pts[0][0].toFixed(1)},${height} Z`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
