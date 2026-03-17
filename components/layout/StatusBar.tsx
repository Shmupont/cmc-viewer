'use client'

import React, { useEffect, useState } from 'react'
import { useAppStore } from '@/store'
import { formatDistanceToNow } from 'date-fns'

export function StatusBar(): React.ReactElement {
  const { isMarketOpen, lastUpdated, checkMarketStatus } = useAppStore()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
      checkMarketStatus()
    }, 1000)
    return () => clearInterval(interval)
  }, [checkMarketStatus])

  const nextRefreshMin = lastUpdated
    ? Math.max(0, 5 - Math.floor((now.getTime() - lastUpdated.getTime()) / 60000))
    : 5
  const nextRefreshSec = lastUpdated
    ? Math.max(0, 60 - Math.floor(((now.getTime() - lastUpdated.getTime()) % 60000) / 1000))
    : 0

  return (
    <div className="h-6 flex items-center px-4 bg-surface border-t border-border text-xs text-text-muted gap-4 flex-shrink-0">
      <span>
        Last updated:{' '}
        {lastUpdated ? formatDistanceToNow(lastUpdated, { addSuffix: true }) : 'never'}
      </span>
      <span className="text-border">|</span>
      <span>
        Market:{' '}
        <span className={isMarketOpen ? 'text-positive' : 'text-neutral'}>
          {isMarketOpen ? 'Open' : 'Closed'}
        </span>
      </span>
      <span className="text-border">|</span>
      <span>
        Next refresh: {nextRefreshMin}m {nextRefreshSec}s
      </span>
    </div>
  )
}
