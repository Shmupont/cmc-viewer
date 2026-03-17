'use client'

import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { StatusBar } from './StatusBar'
import { AlertsPanel } from '@/components/panels/AlertsPanel'
import { WatchlistPanel } from '@/components/panels/WatchlistPanel'

export function AppShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const [showAlerts, setShowAlerts] = useState(false)
  const [showWatchlist, setShowWatchlist] = useState(false)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-base">
      <TopBar
        onAlertsClick={() => setShowAlerts(true)}
        onWatchlistClick={() => setShowWatchlist(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onAlertsClick={() => setShowAlerts(true)}
          onWatchlistClick={() => setShowWatchlist(true)}
        />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
      <StatusBar />
      {showAlerts && <AlertsPanel onClose={() => setShowAlerts(false)} />}
      {showWatchlist && <WatchlistPanel onClose={() => setShowWatchlist(false)} />}
    </div>
  )
}
