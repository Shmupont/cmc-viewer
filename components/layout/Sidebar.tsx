'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/store'

const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    path: '/portfolio',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    id: 'research',
    label: 'Research',
    path: '/research',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    id: 'compare',
    label: 'Compare',
    path: '/compare',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
      </svg>
    ),
  },
  {
    id: 'macro',
    label: 'Macro',
    path: '/macro',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 20h20M5 20V10l7-7 7 7v10" /><path d="M9 20v-5h6v5" />
      </svg>
    ),
  },
]

interface SidebarProps {
  onAlertsClick?: () => void
  onWatchlistClick?: () => void
}

export function Sidebar({ onAlertsClick, onWatchlistClick }: SidebarProps): React.ReactElement {
  const pathname = usePathname()
  const isMarketOpen = useAppStore((s) => s.isMarketOpen)

  return (
    <div className="flex flex-col h-full w-20 bg-surface border-r border-border py-4 items-center flex-shrink-0">
      {/* Logo */}
      <div className="mb-6 text-accent font-mono font-bold text-xs tracking-widest">MC</div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 w-full px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== '/' && pathname.startsWith(item.path))
          return (
            <Link
              key={item.id}
              href={item.path}
              title={item.label}
              className={`
                flex flex-col items-center justify-center w-full py-2 rounded-md gap-1
                transition-colors duration-200
                ${isActive
                  ? 'bg-accent/20 text-accent'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-2'
                }
              `}
            >
              {item.icon}
              <span className="text-[9px] font-medium tracking-wide leading-none">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Watchlist + Alerts */}
      {(onWatchlistClick || onAlertsClick) && (
        <div className="flex flex-col gap-2 mb-3 w-full px-2">
          {onWatchlistClick && (
            <button
              onClick={onWatchlistClick}
              className="flex flex-col items-center justify-center w-full py-1.5 rounded-md gap-0.5 text-text-muted hover:text-amber-400 hover:bg-surface-2"
              title="Watchlist"
            >
              <span className="text-base leading-none">☆</span>
              <span className="text-[8px]">Watch</span>
            </button>
          )}
          {onAlertsClick && (
            <button
              onClick={onAlertsClick}
              className="flex flex-col items-center justify-center w-full py-1.5 rounded-md gap-0.5 text-text-muted hover:text-white hover:bg-surface-2"
              title="Alerts"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="text-[8px]">Alerts</span>
            </button>
          )}
        </div>
      )}

      {/* Market status */}
      <div className="flex flex-col items-center gap-1 mb-2">
        <div className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-positive' : 'bg-neutral'}`} />
        <span className={`text-[8px] font-mono ${isMarketOpen ? 'text-positive' : 'text-neutral'}`}>
          {isMarketOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </div>
    </div>
  )
}
