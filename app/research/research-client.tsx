'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface ResearchResult {
  ticker: string
  thesis: string
  timestamp: string
}

export default function ResearchClient(): React.ReactElement {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ResearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<ResearchResult | null>(null)

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })
      const data = await res.json()
      if (data.ok) {
        const result: ResearchResult = {
          ticker: data.ticker ?? query.trim().toUpperCase(),
          thesis: data.content,
          timestamp: new Date().toLocaleTimeString(),
        }
        setResults(prev => [result, ...prev])
        setSelected(result)
        setQuery('')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar: research history */}
      <div className="w-56 border-r border-border flex flex-col shrink-0">
        <div className="p-3 border-b border-border">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted">Research History</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {results.length === 0 && (
            <p className="text-text-muted text-xs p-3">No research yet.</p>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => setSelected(r)}
              className={`w-full text-left p-3 border-b border-border/50 hover:bg-surface-2 transition-colors ${selected === r ? 'bg-surface-2' : ''}`}
            >
              <p className="font-mono text-sm text-accent font-semibold">{r.ticker}</p>
              <p className="text-[10px] text-text-muted">{r.timestamp}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-border">
          <form onSubmit={handleResearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter ticker or company name (e.g. AAPL, Tesla, NVDA)..."
              className="flex-1 bg-surface-2 border border-border rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <LoadingSpinner size={14} /> : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              )}
              Analyze
            </button>
          </form>
          <p className="text-xs text-text-muted mt-1.5">
            AI-powered equity research: thesis generation, risk factors, and key metrics.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <LoadingSpinner size={32} />
              <p className="text-text-muted text-sm">Generating research brief...</p>
            </div>
          )}

          {!loading && !selected && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <div>
                <p className="text-text-secondary text-sm font-medium">Research any equity</p>
                <p className="text-text-muted text-xs mt-1">Enter a ticker or company name to generate an AI research brief</p>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'META', 'TSLA'].map(t => (
                  <button
                    key={t}
                    onClick={() => setQuery(t)}
                    className="px-3 py-1.5 bg-surface-2 border border-border text-xs font-mono text-text-secondary hover:border-accent hover:text-accent rounded transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && selected && (
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-text-primary text-lg font-bold font-mono">{selected.ticker}</h2>
                <span className="text-xs text-text-muted bg-surface-2 border border-border rounded px-2 py-0.5">{selected.timestamp}</span>
              </div>
              <div className="prose prose-invert max-w-none text-sm">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="text-text-secondary text-sm leading-relaxed mb-3">{children}</p>,
                    h1: ({ children }) => <h1 className="text-text-primary text-base font-bold mb-3 mt-5">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-text-primary text-sm font-bold mb-2 mt-4 uppercase tracking-wider text-[11px]">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-text-primary text-sm font-semibold mb-2 mt-3">{children}</h3>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-text-secondary">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-text-secondary">{children}</ol>,
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                    strong: ({ children }) => <strong className="text-text-primary font-semibold">{children}</strong>,
                    code: ({ children }) => <code className="bg-surface-2 border border-border rounded px-1 py-0.5 text-xs font-mono text-accent">{children}</code>,
                    blockquote: ({ children }) => <blockquote className="border-l-2 border-accent pl-3 italic text-text-muted">{children}</blockquote>,
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-3">
                        <table className="w-full text-xs border border-border rounded">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => <th className="text-left text-text-muted py-2 px-3 border-b border-border bg-surface-2 font-medium">{children}</th>,
                    td: ({ children }) => <td className="py-2 px-3 border-b border-border/50 text-text-secondary font-mono">{children}</td>,
                  }}
                >
                  {selected.thesis}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
