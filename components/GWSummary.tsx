'use client'

import { useState, useEffect, useRef } from 'react'
import { FixtureWithNames, TeamPointsBreakdown } from '@/lib/types'
import { FormResult, H2HRecord, LuckMetricsData } from '@/lib/api'

interface GWSummaryProps {
  currentEvent: number
  fixtures: FixtureWithNames[]
  pointsBreakdown: Record<number, TeamPointsBreakdown>
  form?: Record<number, FormResult[]>
  h2h?: Record<number, Record<number, H2HRecord>>
  luckMetrics?: LuckMetricsData[]
}

// Skeleton loader for summary
function SummarySkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading summary">
      <div className="flex items-start gap-3">
        <div className="skeleton w-6 h-6 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-11/12" />
          <div className="skeleton h-4 w-4/5" />
        </div>
      </div>
    </div>
  )
}

// AI icon with animation
function AIIcon({ isLoading }: { isLoading?: boolean }) {
  return (
    <div
      className={`w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center shrink-0 ${
        isLoading ? 'animate-pulse' : ''
      }`}
    >
      <svg
        className="w-4 h-4 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    </div>
  )
}

// Error state
function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-[var(--danger-muted)] flex items-center justify-center shrink-0">
        <svg
          className="w-4 h-4 text-[var(--danger)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm text-[var(--danger)]">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs text-[var(--accent)] hover:underline focus:outline-none focus:underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

// Summary content
function SummaryContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean)

  return (
    <div className="flex items-start gap-3">
      <AIIcon isLoading={streaming} />
      <div className="flex-1 min-w-0">
        <div className="text-sm leading-relaxed">
          {sentences.map((sentence, index) => (
            <span
              key={index}
              className="inline animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {sentence}{' '}
            </span>
          ))}
          {streaming && <span className="inline-block w-1.5 h-4 bg-[var(--accent)] animate-pulse align-text-bottom" />}
        </div>
      </div>
    </div>
  )
}

export function GWSummary({ currentEvent, fixtures, pointsBreakdown, form, h2h, luckMetrics }: GWSummaryProps) {
  const [summary, setSummary] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchSummary = async () => {
    // Abort any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setStreaming(false)
    setSummary('')
    setError(null)

    try {
      const response = await fetch('/api/gw-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEvent,
          fixtures,
          pointsBreakdown,
          form,
          h2h,
          luckMetrics,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to fetch summary')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      setLoading(false)
      setStreaming(true)
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              setStreaming(false)
              continue
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                accumulated += parsed.text
                setSummary(accumulated)
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError('Could not load AI summary')
      setLoading(false)
      setStreaming(false)
      console.error('Error fetching GW summary:', err)
    }
  }

  useEffect(() => {
    fetchSummary()
    return () => abortRef.current?.abort()
  }, [currentEvent, fixtures, pointsBreakdown])

  // Calculate some quick stats for the header
  const totalMatches = fixtures.length
  const liveMatches = fixtures.filter((f) => f.started && !f.finished).length
  const completedMatches = fixtures.filter((f) => f.finished).length

  return (
    <section className="bg-gradient-to-br from-[var(--accent-muted)] via-[var(--card)] to-purple-900/10 rounded-xl border border-[var(--accent)]/20 overflow-hidden shadow-[var(--card-shadow-md)]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--accent)]/20 bg-[var(--card)]/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gradient">AI Summary</span>
          <span className="text-xs bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-0.5 rounded-full font-medium">
            GW {currentEvent}
          </span>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
          {liveMatches > 0 && (
            <span className="flex items-center gap-1 text-[var(--success)]">
              <span className="live-dot" />
              {liveMatches} live
            </span>
          )}
          {completedMatches > 0 && (
            <span>{completedMatches} completed</span>
          )}
          {totalMatches - liveMatches - completedMatches > 0 && (
            <span>{totalMatches - liveMatches - completedMatches} upcoming</span>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4">
        {loading && <SummarySkeleton />}
        {error && !loading && <ErrorState message={error} onRetry={fetchSummary} />}
        {!loading && !error && summary && <SummaryContent text={summary} streaming={streaming} />}
      </div>

      {/* Footer with disclaimer */}
      <footer className="px-4 py-2 border-t border-[var(--accent)]/10 bg-[var(--card)]/30">
        <p className="text-[10px] text-[var(--muted)] flex items-center gap-1">
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          AI-generated summary based on current gameweek data
        </p>
      </footer>
    </section>
  )
}
