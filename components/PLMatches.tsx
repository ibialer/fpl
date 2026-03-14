'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PositionBadge } from './PlayerStats'
import { PLMatchesResponse, PLFixtureWithDetails, PLFixturePlayer } from '@/lib/types'

interface PLMatchesProps {
  currentEvent: number
}

function StatusBadge({ fixture }: { fixture: PLFixtureWithDetails }) {
  if (fixture.finished || fixture.finishedProvisional) {
    return <span className="text-[10px] font-semibold text-[var(--muted)] uppercase w-[38px] text-center">FT</span>
  }
  if (fixture.started) {
    return (
      <span className="inline-flex items-center justify-center gap-1 text-[10px] font-semibold text-[var(--success)] uppercase w-[38px]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
        Live
      </span>
    )
  }
  const time = new Date(fixture.kickoffTime)
  return (
    <span className="text-[10px] text-[var(--muted)] tabular-nums w-[38px] text-center">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

export function computeBpsStats(home: PLFixturePlayer[], away: PLFixturePlayer[]): { ranks: Map<number, number>; maxBps: number } {
  const all = [...home, ...away].filter(p => p.bps > 0).sort((a, b) => b.bps - a.bps)
  const ranks = new Map<number, number>()
  let rank = 1
  for (let i = 0; i < all.length; i++) {
    if (i > 0 && all[i].bps < all[i - 1].bps) {
      rank = i + 1
    }
    ranks.set(all[i].id, rank)
  }
  return { ranks, maxBps: all[0]?.bps || 0 }
}

function PlayerRow({
  player,
  bpsRank,
}: {
  player: PLFixturePlayer
  bpsRank: number | undefined
}) {
  const isTop3 = bpsRank !== undefined && bpsRank <= 3
  const isOwned = player.owner !== null

  return (
    <div
      className={`flex items-center gap-2 py-1.5 px-2.5 rounded-md text-sm transition-colors ${
        isOwned ? 'bg-[var(--accent-muted)]' : ''
      }`}
    >
      {/* Position badge */}
      <PositionBadge position={player.position} />

      {/* Player name */}
      <span className={`flex-1 truncate ${!isOwned ? 'text-[var(--muted-foreground)]' : ''}`}>
        {player.web_name}
      </span>

      {/* Owner badge */}
      {isOwned && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-[var(--accent)]/30 text-[var(--accent)] shrink-0">
          {player.owner}
        </span>
      )}

      {/* Stats */}
      <div className="flex items-center gap-0.5 shrink-0">
        {Array.from({ length: player.goals_scored }, (_, i) => (
          <span key={`g${i}`} className="stat-icon" title="Goal">⚽</span>
        ))}
        {Array.from({ length: player.assists }, (_, i) => (
          <span key={`a${i}`} className="stat-icon" title="Assist">🅰️</span>
        ))}
        {player.clean_sheets > 0 && (player.position === 'GK' || player.position === 'DEF') && (
          <span className="stat-icon" title="Clean sheet">🛡️</span>
        )}
        {player.bonus > 0 && (
          <span
            className="text-[10px] font-semibold text-[var(--warning)] bg-[var(--warning-muted)] px-1 py-0.5 rounded"
            title={`${player.bonus} bonus points`}
          >
            +{player.bonus}
          </span>
        )}
        <span
          className="text-[10px] font-medium px-1 py-0.5 rounded bg-[var(--card-border)] text-[var(--muted)]"
          title="Defensive contribution"
        >
          DC:{player.defensive_contribution}
        </span>
      </div>

      {/* BPS value */}
      <span
        className={`text-[11px] font-bold min-w-[24px] text-right tabular-nums shrink-0 ${
          isTop3 ? 'text-[var(--warning)]' : 'text-[var(--muted)]'
        }`}
        title="BPS"
      >
        {player.bps}
      </span>
    </div>
  )
}

function FixtureRow({
  fixture,
  expanded,
  onToggle,
}: {
  fixture: PLFixtureWithDetails
  expanded: boolean
  onToggle: () => void
}) {
  const hasPlayers = fixture.homePlayers.length > 0 || fixture.awayPlayers.length > 0
  const bpsRanks = useMemo(
    () => (expanded ? computeBpsStats(fixture.homePlayers, fixture.awayPlayers).ranks : new Map<number, number>()),
    [expanded, fixture.homePlayers, fixture.awayPlayers]
  )

  const isLive = fixture.started && !fixture.finished && !fixture.finishedProvisional

  return (
    <div className={isLive ? 'bg-gradient-to-r from-[var(--success-muted)] via-transparent to-[var(--success-muted)]' : ''}>
      {/* Scoreline button */}
      <button
        onClick={onToggle}
        disabled={!hasPlayers}
        className={`w-full px-4 py-3 grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 sm:gap-3 transition-colors touch-target ${
          hasPlayers ? 'hover:bg-[var(--card-border)]/20 cursor-pointer' : 'cursor-default'
        }`}
        aria-expanded={expanded}
        aria-label={`${fixture.homeTeam.name} vs ${fixture.awayTeam.name}, tap to ${expanded ? 'hide' : 'show'} player details`}
      >
        {/* Left spacer — mirrors status+chevron width for centering */}
        <div className="flex items-center gap-2 invisible">
          <span className="w-[38px]">FT</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
        </div>

        {/* Home team */}
        <div className="text-right min-w-0">
          <span className="text-sm font-medium truncate block sm:hidden">{fixture.homeTeam.shortName}</span>
          <span className="text-sm font-medium truncate hidden sm:block">{fixture.homeTeam.name}</span>
        </div>

        {/* Score */}
        <div className="flex items-center justify-center shrink-0 w-[60px]">
          {fixture.started ? (
            <span className="text-lg font-bold tabular-nums text-center">
              {fixture.homeScore} - {fixture.awayScore}
            </span>
          ) : (
            <span className="text-xs text-[var(--muted)] text-center">vs</span>
          )}
        </div>

        {/* Away team */}
        <div className="text-left min-w-0">
          <span className="text-sm font-medium truncate block sm:hidden">{fixture.awayTeam.shortName}</span>
          <span className="text-sm font-medium truncate hidden sm:block">{fixture.awayTeam.name}</span>
        </div>

        {/* Status + chevron */}
        <div className="flex items-center gap-2 shrink-0 justify-end">
          <StatusBadge fixture={fixture} />
          {hasPlayers && (
            <svg
              className={`w-4 h-4 text-[var(--muted)] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
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
        <div className="border-t border-[var(--card-border)] px-4 py-3 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { team: fixture.homeTeam, players: fixture.homePlayers },
              { team: fixture.awayTeam, players: fixture.awayPlayers },
            ].map(({ team, players }) => (
              <div key={team.id}>
                <div className="flex items-center gap-2 mb-2 px-2.5">
                  <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">
                    {team.shortName}
                  </span>
                  <div className="flex-1 h-px bg-[var(--card-border)]" />
                </div>
                <div className="space-y-0.5">
                  {players.map((p) => (
                    <PlayerRow
                      key={p.id}
                      player={p}
                      bpsRank={bpsRanks.get(p.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
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

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]">
          <div className="px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)]">
            <div className="skeleton h-4 w-32" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-[var(--card-border)] last:border-b-0">
              <div className="flex items-center justify-between gap-4">
                <div className="skeleton h-4 w-16 ml-auto" />
                <div className="skeleton h-6 w-14" />
                <div className="skeleton h-4 w-16 mr-auto" />
                <div className="skeleton h-3 w-8" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--card-border)] flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-[var(--muted)] text-sm mb-3">Failed to load PL fixtures</p>
          <button
            onClick={() => fetchData(selectedEvent)}
            className="text-sm font-medium text-[var(--accent)] hover:underline touch-target"
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
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--card-border)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold mb-1">No fixtures this week</h3>
              <p className="text-[var(--muted)] text-sm">Gameweek {selectedEvent} has no scheduled matches</p>
            </div>
          ) : (
            dayGroups.map(([day, dayFixtures]) => (
              <section
                key={day}
                className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]"
              >
                {/* Section header */}
                <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)]">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {day}
                  </h3>
                  <span className="text-xs text-[var(--muted)]">
                    {dayFixtures.length} {dayFixtures.length === 1 ? 'match' : 'matches'}
                  </span>
                </header>

                {/* Fixture list */}
                <div className="divide-y divide-[var(--card-border)]">
                  {dayFixtures.map((f) => (
                    <FixtureRow
                      key={f.id}
                      fixture={f}
                      expanded={expandedFixtures.has(f.id)}
                      onToggle={() => toggleFixture(f.id)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      )}
    </div>
  )
}
