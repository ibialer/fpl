'use client'

import { useState, useMemo } from 'react'
import { FixtureWithNames, TeamPointsBreakdown, PlayerPoints } from '@/lib/types'

interface ResultsProps {
  matches: FixtureWithNames[]
  currentEvent: number
  allPointsBreakdown: Record<number, Record<number, TeamPointsBreakdown>>
}

interface TeamOption {
  id: number
  name: string
}

// Position badge component
function PositionBadge({ position }: { position: string }) {
  const positionClass = {
    GK: 'pos-gk',
    DEF: 'pos-def',
    MID: 'pos-mid',
    FWD: 'pos-fwd',
  }[position] || ''

  return <span className={`pos-badge ${positionClass}`}>{position}</span>
}

// Helper to render stat icons
function StatIcons({ player, isTopScorer }: { player: PlayerPoints; isTopScorer?: boolean }) {
  const icons: React.ReactNode[] = []

  // Star for top scorer
  if (isTopScorer && player.points > 0) {
    icons.push(
      <span
        key="star"
        className="text-[var(--warning)] drop-shadow-[0_0_3px_var(--warning)]"
        title="Top scorer this match"
        aria-label="Top scorer"
      >
        ★
      </span>
    )
  }

  // Goals
  for (let i = 0; i < player.goals; i++) {
    icons.push(
      <span key={`goal-${i}`} title="Goal" className="stat-icon">
        ⚽
      </span>
    )
  }

  // Assists
  for (let i = 0; i < player.assists; i++) {
    icons.push(
      <span key={`assist-${i}`} title="Assist" className="stat-icon">
        🅰️
      </span>
    )
  }

  // Clean sheet
  if (player.cleanSheet && ['GK', 'DEF', 'MID'].includes(player.positionName)) {
    icons.push(
      <span key="cs" title="Clean sheet" className="stat-icon">
        🛡️
      </span>
    )
  }

  // Yellow cards
  for (let i = 0; i < player.yellowCards; i++) {
    icons.push(
      <span key={`yellow-${i}`} title="Yellow card" className="stat-icon">
        🟨
      </span>
    )
  }

  // Red cards
  for (let i = 0; i < player.redCards; i++) {
    icons.push(
      <span key={`red-${i}`} title="Red card" className="stat-icon">
        🟥
      </span>
    )
  }

  if (icons.length === 0) return null

  return <span className="inline-flex items-center gap-0.5 ml-1">{icons}</span>
}

// Team breakdown component for results
function TeamBreakdownResult({
  breakdown,
  teamName,
}: {
  breakdown: TeamPointsBreakdown
  teamName: string
}) {
  const starters = breakdown.players.filter((p) => !p.isBenched)
  const bench = breakdown.players.filter((p) => p.isBenched)

  // Find top scorer among starters
  const topScorer = starters.reduce(
    (max, p) => (p.points > max.points ? p : max),
    starters[0]
  )

  return (
    <div className="bg-[var(--background)] rounded-lg border border-[var(--card-border)] overflow-hidden">
      <div className="px-3 py-2 border-b border-[var(--card-border)] bg-[var(--card)]">
        <span className="text-xs font-semibold">{teamName}</span>
      </div>
      <div className="p-2 space-y-0.5">
        {starters.map((p, idx) => {
          const isTop = p === topScorer && p.points > 0

          return (
            <div
              key={idx}
              className={`flex items-center justify-between text-xs gap-1.5 px-2 py-1.5 rounded-md transition-colors ${
                isTop ? 'bg-[var(--warning-muted)] border border-[var(--warning)]/20' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <PositionBadge position={p.positionName} />
                <span className="truncate" title={p.name}>
                  {p.name}
                </span>
                <StatIcons player={p} isTopScorer={isTop} />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline text-[10px] text-[var(--muted)]">
                  {p.teamShortName} {p.isHome ? 'v' : '@'} {p.opponentShortName}
                </span>
                <span
                  className={`font-semibold min-w-[3ch] text-right tabular-nums ${
                    p.points > 0
                      ? 'text-[var(--success)]'
                      : p.points < 0
                      ? 'text-[var(--danger)]'
                      : 'text-[var(--muted)]'
                  }`}
                >
                  {p.points}
                </span>
                {p.bonus > 0 && (
                  <span className="text-[10px] font-medium text-[var(--accent)] bg-[var(--accent-muted)] px-1 py-0.5 rounded">
                    +{p.bonus}
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {bench.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--card-border)]">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
                Bench
              </span>
            </div>
            {bench.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs text-[var(--muted)] gap-1.5 px-2 py-0.5 opacity-60"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[10px] w-6">{p.positionName}</span>
                  <span className="truncate">{p.name}</span>
                  <StatIcons player={p} />
                </div>
                <span className="shrink-0 tabular-nums">
                  ({p.points})
                  {p.bonus > 0 && (
                    <span className="text-[var(--accent)]"> +{p.bonus}</span>
                  )}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// Team filter dropdown
function TeamFilter({
  teams,
  selectedTeamId,
  onSelect,
}: {
  teams: TeamOption[]
  selectedTeamId: number | null
  onSelect: (id: number | null) => void
}) {
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-4 shadow-[var(--card-shadow)]">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label
          htmlFor="results-team-filter"
          className="text-sm font-medium text-[var(--muted)] shrink-0"
        >
          Filter by team
        </label>
        <select
          id="results-team-filter"
          value={selectedTeamId ?? ''}
          onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
          className="flex-1 sm:max-w-xs bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-shadow"
        >
          <option value="">All Teams</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        {selectedTeamId && (
          <button
            onClick={() => onSelect(null)}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>
    </div>
  )
}

// Empty state
function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-8 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--card-border)] flex items-center justify-center">
        <svg
          className="w-6 h-6 text-[var(--muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <p className="text-[var(--muted)] text-sm">{message}</p>
    </div>
  )
}

export function Results({ matches, currentEvent, allPointsBreakdown }: ResultsProps) {
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

  // Extract unique teams from all matches
  const teams = useMemo(() => {
    const teamMap = new Map<number, string>()
    matches.forEach((m) => {
      teamMap.set(m.team1Id, m.team1Name)
      teamMap.set(m.team2Id, m.team2Name)
    })
    return Array.from(teamMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [matches])

  // Get all finished matches, grouped by gameweek (most recent first)
  const finishedMatches = matches
    .filter((m) => m.finished)
    .filter(
      (m) =>
        selectedTeamId === null ||
        m.team1Id === selectedTeamId ||
        m.team2Id === selectedTeamId
    )
    .sort((a, b) => b.event - a.event)

  // Group by gameweek
  const matchesByGW = finishedMatches.reduce((acc, match) => {
    if (!acc[match.event]) {
      acc[match.event] = []
    }
    acc[match.event].push(match)
    return acc
  }, {} as Record<number, FixtureWithNames[]>)

  const gameweeks = Object.keys(matchesByGW)
    .map(Number)
    .sort((a, b) => b - a)

  if (matches.filter((m) => m.finished).length === 0) {
    return <EmptyState message="No results yet" />
  }

  return (
    <div className="space-y-4">
      <TeamFilter teams={teams} selectedTeamId={selectedTeamId} onSelect={setSelectedTeamId} />

      {gameweeks.length === 0 && selectedTeamId !== null && (
        <EmptyState message="No results for this team" />
      )}

      {gameweeks.map((gw) => {
        const gwBreakdown = allPointsBreakdown[gw] || {}

        return (
          <section
            key={gw}
            className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]"
          >
            <header className="px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)]">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                Gameweek {gw}
              </h3>
            </header>
            <div className="divide-y divide-[var(--card-border)]">
              {matchesByGW[gw].map((m, i) => {
                const matchKey = `${gw}-${i}`
                const isExpanded = expandedMatch === matchKey
                const team1Breakdown = gwBreakdown[m.team1Id]
                const team2Breakdown = gwBreakdown[m.team2Id]
                const hasBreakdown = team1Breakdown && team2Breakdown

                const team1Won = m.team1Points > m.team2Points
                const team2Won = m.team2Points > m.team1Points

                return (
                  <div key={i}>
                    <button
                      onClick={() => setExpandedMatch(isExpanded ? null : matchKey)}
                      className="w-full px-4 py-3 hover:bg-[var(--card-border)]/20 transition-colors touch-target"
                      disabled={!hasBreakdown}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 text-right min-w-0">
                          <div
                            className={`font-medium text-sm truncate ${
                              team1Won ? 'text-[var(--success)]' : ''
                            }`}
                          >
                            {m.team1Name}
                          </div>
                          <div className="text-xs text-[var(--muted)] truncate">
                            {m.team1PlayerName}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3">
                          <span
                            className={`text-lg font-bold min-w-[2ch] text-right tabular-nums ${
                              team1Won ? 'text-[var(--success)]' : ''
                            }`}
                          >
                            {m.team1Points}
                          </span>
                          <span className="text-[var(--muted)]">:</span>
                          <span
                            className={`text-lg font-bold min-w-[2ch] text-left tabular-nums ${
                              team2Won ? 'text-[var(--success)]' : ''
                            }`}
                          >
                            {m.team2Points}
                          </span>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div
                            className={`font-medium text-sm truncate ${
                              team2Won ? 'text-[var(--success)]' : ''
                            }`}
                          >
                            {m.team2Name}
                          </div>
                          <div className="text-xs text-[var(--muted)] truncate">
                            {m.team2PlayerName}
                          </div>
                        </div>
                      </div>
                      {hasBreakdown && (
                        <div className="flex items-center justify-center gap-1 mt-2">
                          <svg
                            className={`w-4 h-4 text-[var(--muted)] transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                          <span className="text-xs text-[var(--muted)]">
                            {isExpanded ? 'Hide' : 'Show'} breakdown
                          </span>
                        </div>
                      )}
                    </button>

                    {isExpanded && hasBreakdown && (
                      <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                        <TeamBreakdownResult breakdown={team1Breakdown} teamName={m.team1Name} />
                        <TeamBreakdownResult breakdown={team2Breakdown} teamName={m.team2Name} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
