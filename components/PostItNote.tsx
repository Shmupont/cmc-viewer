'use client'

import React from 'react'

interface PostItNoteProps {
  signal: {
    id: number
    trigger_summary: string
    conclusion: string
  }
  flavor: 'alert' | 'weekly' | 'daily'
  onClick: (e: React.MouseEvent) => void
}

export function PostItNote({ signal, flavor, onClick }: PostItNoteProps): React.ReactElement {
  const isAlert = flavor === 'alert'
  const isWeekly = flavor === 'weekly'

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(e) }}
      title={signal.trigger_summary}
      className={`w-7 h-7 rounded-sm flex items-center justify-center text-[13px]
        shadow-[0_2px_4px_rgba(0,0,0,0.4)]
        hover:scale-110 transition-transform cursor-pointer
        ${isAlert
          ? 'bg-red-500 text-white border border-red-400/60'
          : isWeekly
          ? 'border border-slate-300/40 postit-glow-white'
          : 'bg-blue-500 text-white border border-blue-400/60'
        }`}
      style={{
        ...(isAlert ? { animation: 'postit-pulse-red 1.5s ease-in-out infinite' } : {}),
        ...(isWeekly ? { backgroundColor: '#f1f5f9', color: '#1e293b' } : {}),
        transform: 'rotate(1.5deg)',
      }}
    >
      📌
    </button>
  )
}
