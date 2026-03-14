'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PositionBadge } from './PlayerStats'
import { PLMatchesResponse, PLFixtureWithDetails, PLFixturePlayer } from '@/lib/types'

interface PLMatchesProps {
  currentEvent: number
}

function StatusBadge({ fixture }: { fixture: PLFixtureWithDetails }) {
  if (fixture.finished) {
    return <span className="text-xs font-semibold text-[var(--muted)]">FT</span>
  }
  if (fixture.finishedProvisional) {
    return <span className="text-xs font-semibold text-[var(--muted)]">FT</span>
  }
  if (fixture.started) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--success)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
        LIVE
      </span>
    )
  }
  const time = new Date(fixture.kickoffTime)
  return (
    <span className="text-xs text-[var(--muted)]">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

function getTop3BpsIds(home: PLFixturePlayer[], away: PLFixturePlayer[]): Set<number> {
  const all = [...home, ...away].sort((a, b) => b.bps - a.bps)
  const top3 = new Set<number>()
  let count = 0
  for (const p of all) {
    if (count >= 3) break
    if (p.bps > 0) {
      top3.add(p.id)
      count++
    }
  }
  return top3
}

function PlayerRow({ player, isTop3 }: { player: PLFixturePlayer; isTop3: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1 px-2 text-sm">
      <PositionBadge position={player.position} />
      <span className="flex-1 truncate">{player.web_name}</span>
      {player.owner && (
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)]"
          title={`Owned by ${player.owner}`}
        >
          {player.owner}
        </span>
      )}
      {player.goals_scored > 0 && (
        <span className="text-xs text-[var(--accent)]" title="Goals">
          {Array(player.goals_scored).fill('⚽').join('')}
        </span>
      )}
      {player.assists > 0 && (
        <span className="text-xs text-[var(--muted)]" title="Assists">
          {Array(player.assists).fill('🅰️').join('')}
        </span>
      )}
      {player.defensive_contribution > 0 && (
        <span
          className="text-[10px] font-medium px-1 py-0.5 rounded bg-[var(--card-border)] text-[var(--muted)]"
          title="Defensive contribution"
        >
          DC {player.defensive_contribution}
        </span>
      )}
      <span
        className={`text-xs font-bold min-w-[28px] text-right ${
          isTop3 ? 'text-[var(--warning)]' : 'text-[var(--foreground)]'
        }`}
        title="BPS"
      >
        {player.bps}{isTop3 && '★'}
      </span>
    </div>
  )
}

function FixtureCard({
  fixture,
  expanded,
  onToggle,
}: {
  fixture: PLFixtureWithDetails
  expanded: boolean
  onToggle: () => void
}) {
  const hasPlayers = fixture.homePlayers.length > 0 || fixture.awayPlayers.length > 0
  const top3 = expanded ? getTop3BpsIds(fixture.homePlayers, fixture.awayPlayers) : null

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden">
      {/* Collapsed header */}
      <button
        onClick={onToggle}
        disabled={!hasPlayers}
        className={`w-full px-4 py-3 flex items-center justify-between touch-target ${
          hasPlayers ? 'hover:bg-[var(--card-border)]/30 cursor-pointer' : 'cursor-default'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Home team */}
          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            <span className="text-sm truncate hidden sm:inline">{fixture.homeTeam.name}</span>
            <span className="text-xs font-bold text-[var(--muted)] w-8 text-right">{fixture.homeTeam.shortName}</span>
          </div>

          {/* Score or vs */}
          <div className="flex items-center gap-2 shrink-0">
            {fixture.started ? (
              <span className="text-base font-bold min-w-[50px] text-center">
                {fixture.homeScore} - {fixture.awayScore}
              </span>
            ) : (
              <span className="text-xs text-[var(--muted)] min-w-[50px] text-center">vs</span>
            )}
          </div>

          {/* Away team */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs font-bold text-[var(--muted)] w-8">{fixture.awayTeam.shortName}</span>
            <span className="text-sm truncate hidden sm:inline">{fixture.awayTeam.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-3 shrink-0">
          <StatusBadge fixture={fixture} />
          {hasPlayers && (
            <svg
              className={`w-4 h-4 text-[var(--muted)] transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>

      {/* Expanded player details */}
      {expanded && hasPlayers && (
        <div className="border-t border-[var(--card-border)] px-4 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Home players */}
            <div>
              <div className="text-xs font-semibold text-[var(--muted)] uppercase mb-2">
                {fixture.homeTeam.shortName}
              </div>
              <div className="space-y-0.5">
                {fixture.homePlayers.map((p) => (
                  <PlayerRow key={p.id} player={p} isTop3={top3!.has(p.id)} />
                ))}
              </div>
            </div>

            {/* Away players */}
            <div>
              <div className="text-xs font-semibold text-[var(--muted)] uppercase mb-2">
                {fixture.awayTeam.shortName}
              </div>
              <div className="space-y-0.5">
                {fixture.awayPlayers.map((p) => (
                  <PlayerRow key={p.id} player={p} isTop3={top3!.has(p.id)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function groupByDay(fixtures: PLFixtureWithDetails[]): Map<string, PLFixtureWithDetails[]> {
  const groups = new Map<string, PLFixtureWithDetails[]>()
  for (const f of fixtures) {
    const date = new Date(f.kickoffTime)
    const key = date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    const existing = groups.get(key) || []
    existing.push(f)
    groups.set(key, existing)
  }
  return groups
}

export function PLMatches({ currentEvent }: PLMatchesProps) {
  const [selectedEvent, setSelectedEvent] = useState(currentEvent)
  const [data, setData] = useState<PLMatchesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [expandedFixtures, setExpandedFixtures] = useState<Set<number>>(new Set())

  const fetchData = useCallback(async (event: number) => {
    setLoading(true)
    setError(false)
    setExpandedFixtures(new Set())
    try {
      const res = await fetch(`/api/pl-matches?event=${event}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json: PLMatchesResponse = await res.json()
      setData(json)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(selectedEvent)
  }, [selectedEvent, fetchData])

  const toggleFixture = (id: number) => {
    setExpandedFixtures((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const dayGroups = useMemo(
    () => (data ? Array.from(groupByDay(data.fixtures).entries()) : []),
    [data]
  )

  const totalEvents = data?.totalEvents || 38
  const canGoBack = selectedEvent > 1
  const canGoForward = selectedEvent < totalEvents

  return (
    <div className="space-y-4">
      {/* GW Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => canGoBack && setSelectedEvent((e) => e - 1)}
          disabled={!canGoBack}
          className="p-2 rounded-lg touch-target text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-border)]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous gameweek"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="text-lg font-bold min-w-[140px] text-center">Gameweek {selectedEvent}</h2>

        <button
          onClick={() => canGoForward && setSelectedEvent((e) => e + 1)}
          disabled={!canGoForward}
          className="p-2 rounded-lg touch-target text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-border)]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next gameweek"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-[var(--muted)]">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm">Loading fixtures...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-8 text-center">
          <p className="text-[var(--muted)] text-sm mb-3">Failed to load PL fixtures</p>
          <button
            onClick={() => fetchData(selectedEvent)}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Fixtures */}
      {!loading && !error && data && (
        <>
          {data.fixtures.length === 0 ? (
            <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-8 text-center">
              <p className="text-[var(--muted)] text-sm">No fixtures for this gameweek</p>
            </div>
          ) : (
            dayGroups.map(([day, dayFixtures]) => (
              <div key={day} className="space-y-2">
                <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide px-1">
                  {day}
                </h3>
                {dayFixtures.map((f) => (
                  <FixtureCard
                    key={f.id}
                    fixture={f}
                    expanded={expandedFixtures.has(f.id)}
                    onToggle={() => toggleFixture(f.id)}
                  />
                ))}
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
