'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface AgentPanelProps {
  isOpen: boolean
  onClose: () => void
  context: string
  pageTitle: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const ANALYZE_PROMPT =
  'Generate a comprehensive analysis report based on the context. Lead with downside risks. Be specific with numbers. Conclude with a clear risk assessment.'

export function AgentPanel({ isOpen, onClose, context, pageTitle }: AgentPanelProps): React.ReactElement | null {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [followUp, setFollowUp] = useState('')
  const hasGenerated = useRef(false)
  const endRef = useRef<HTMLDivElement>(null)

  const generate = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analytics/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: ANALYZE_PROMPT, history: [], context }),
      })
      const result = await res.json()
      if (!result.ok) throw new Error(result.content)
      setMessages([{ role: 'assistant', content: result.content ?? 'No response.' }])
    } catch (err) {
      setMessages([{ role: 'assistant', content: `Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}` }])
    } finally {
      setLoading(false)
    }
  }, [context])

  useEffect(() => {
    if (isOpen && !hasGenerated.current) {
      hasGenerated.current = true
      generate()
    }
  }, [isOpen, generate])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendFollowUp(): Promise<void> {
    const text = followUp.trim()
    if (!text || loading) return
    setFollowUp('')
    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setLoading(true)
    try {
      const res = await fetch('/api/analytics/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, context }),
      })
      const result = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: result.content ?? 'No response.' }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error generating response.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleClose(): void {
    hasGenerated.current = false
    setMessages([])
    setFollowUp('')
    setLoading(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative w-[400px] h-full bg-[#0a0f18] border-l border-white/10 shadow-2xl flex flex-col z-10 animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
            <span className="text-white text-sm font-medium">{pageTitle}</span>
          </div>
          <button onClick={handleClose} className="text-slate-500 hover:text-white transition-colors text-xl leading-none w-6 h-6 flex items-center justify-center">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loading && messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-slate-300 text-sm font-medium">Analyzing...</p>
                <p className="text-slate-600 text-xs mt-1">Reading your portfolio data</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'user' ? (
                <div className="text-right">
                  <span className="inline-block bg-blue-500/20 border border-blue-500/30 text-blue-200 text-xs px-3 py-1.5 rounded-lg max-w-[90%] text-left">
                    {msg.content}
                  </span>
                </div>
              ) : (
                <div className="text-sm leading-relaxed">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-white font-bold text-base mt-4 mb-2 pb-1 border-b border-white/10">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-white font-semibold text-sm mt-4 mb-2 pb-1 border-b border-white/10">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-slate-200 font-semibold text-xs mt-3 mb-1 uppercase tracking-wide">{children}</h3>,
                      p: ({ children }) => <p className="text-slate-300 text-xs leading-relaxed mb-2">{children}</p>,
                      strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                      ul: ({ children }) => <ul className="list-none space-y-1 mb-3">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-slate-300 text-xs">{children}</ol>,
                      li: ({ children }) => (
                        <li className="text-slate-300 text-xs flex gap-2 items-start">
                          <span className="text-blue-400 mt-0.5 flex-shrink-0">›</span>
                          <span>{children}</span>
                        </li>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-3 rounded-lg border border-white/10 max-w-full">
                          <table className="text-xs border-collapse w-full">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
                      th: ({ children }) => <th className="px-2 py-1.5 text-left text-slate-400 font-mono font-medium border-b border-white/10 text-[10px] uppercase tracking-wide whitespace-nowrap">{children}</th>,
                      td: ({ children }) => <td className="px-2 py-1.5 text-slate-300 border-b border-white/5 font-mono text-[11px]">{children}</td>,
                      tr: ({ children }) => <tr className="hover:bg-white/5 transition-colors">{children}</tr>,
                      hr: () => <hr className="border-white/10 my-4" />,
                      blockquote: ({ children }) => <blockquote className="border-l-2 border-blue-400/50 pl-3 my-2 text-slate-400 italic text-xs">{children}</blockquote>,
                      code: ({ children }) => <code className="bg-white/5 text-blue-300 px-1.5 py-0.5 rounded text-[10px] font-mono">{children}</code>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}

          {loading && messages.length > 0 && (
            <div className="flex items-center gap-2 px-1 py-2">
              <div className="w-4 h-4 rounded-full border-2 border-transparent border-t-blue-400 animate-spin flex-shrink-0" />
              <span className="text-slate-500 text-xs">Thinking...</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length > 0 && (
          <div className="flex-shrink-0 px-4 py-3 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendFollowUp() }}
                placeholder="Ask a follow-up..."
                disabled={loading}
                className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 disabled:opacity-50"
              />
              <button
                onClick={sendFollowUp}
                disabled={!followUp.trim() || loading}
                className="px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-md transition-colors disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
