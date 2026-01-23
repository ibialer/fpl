'use client'

import { useState, useEffect } from 'react'
import { FixtureWithNames, TeamPointsBreakdown } from '@/lib/types'

interface GWSummaryProps {
  currentEvent: number
  fixtures: FixtureWithNames[]
  pointsBreakdown: Record<number, TeamPointsBreakdown>
}

export function GWSummary({ currentEvent, fixtures, pointsBreakdown }: GWSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/gw-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentEvent,
            fixtures,
            pointsBreakdown,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch summary')
        }

        const data = await response.json()
        setSummary(data.summary)
      } catch (err) {
        setError('Could not load AI summary')
        console.error('Error fetching GW summary:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [currentEvent, fixtures, pointsBreakdown])

  return (
    <section className="bg-gradient-to-r from-[var(--accent)]/10 to-[var(--card)] rounded-lg border border-[var(--accent)]/30 overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--accent)]/20 flex items-center gap-2">
        <span className="text-sm">AI Summary</span>
        <span className="text-xs bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-0.5 rounded">
          GW {currentEvent}
        </span>
      </div>
      <div className="px-4 py-3">
        {loading && (
          <div className="space-y-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-11/12" />
            <div className="skeleton h-4 w-4/5" />
          </div>
        )}
        {error && (
          <div className="text-[var(--danger)] text-sm">{error}</div>
        )}
        {!loading && !error && summary && (
          <p className="text-sm leading-relaxed tab-content">{summary}</p>
        )}
      </div>
    </section>
  )
}
