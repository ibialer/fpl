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

// Helper to render stat icons
function StatIcons({ player }: { player: PlayerPoints }) {
  const icons: string[] = []

  // Goals (one ball per goal)
  for (let i = 0; i < player.goals; i++) {
    icons.push('⚽')
  }

  // Assists
  for (let i = 0; i < player.assists; i++) {
    icons.push('🅰️')
  }

  // Clean sheet (only for GK, DEF, MID)
  if (player.cleanSheet && ['GK', 'DEF', 'MID'].includes(player.positionName)) {
    icons.push('🛡️')
  }

  // Yellow cards
  for (let i = 0; i < player.yellowCards; i++) {
    icons.push('🟨')
  }

  // Red cards
  for (let i = 0; i < player.redCards; i++) {
    icons.push('🟥')
  }

  if (icons.length === 0) return null

  return <span className="ml-1">{icons.join('')}</span>
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
    .filter((m) => selectedTeamId === null || m.team1Id === selectedTeamId || m.team2Id === selectedTeamId)
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
    return (
      <div className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] p-4">
        <p className="text-[var(--muted)] text-sm text-center">No results yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Team Filter */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] p-4">
        <div className="flex items-center gap-3">
          <label htmlFor="team-filter" className="text-sm font-medium text-[var(--muted)]">
            Filter by team:
          </label>
          <select
            id="team-filter"
            value={selectedTeamId ?? ''}
            onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 max-w-xs bg-[var(--background)] border border-[var(--card-border)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="">All Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {gameweeks.length === 0 && selectedTeamId !== null && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] p-4">
          <p className="text-[var(--muted)] text-sm text-center">No results for this team</p>
        </div>
      )}

      {gameweeks.map((gw) => {
        const gwBreakdown = allPointsBreakdown[gw] || {}

        return (
          <section
            key={gw}
            className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] overflow-hidden"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] px-4 py-3 border-b border-[var(--card-border)]">
              Gameweek {gw}
            </h3>
            <div className="divide-y divide-[var(--card-border)]">
              {matchesByGW[gw].map((m, i) => {
                const matchKey = `${gw}-${i}`
                const isExpanded = expandedMatch === matchKey
                const team1Breakdown = gwBreakdown[m.team1Id]
                const team2Breakdown = gwBreakdown[m.team2Id]
                const hasBreakdown = team1Breakdown && team2Breakdown

                return (
                  <div key={i}>
                    <button
                      onClick={() => setExpandedMatch(isExpanded ? null : matchKey)}
                      className="w-full px-4 py-3 hover:bg-[var(--card-border)]/30 transition-colors"
                      disabled={!hasBreakdown}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 text-right">
                          <div
                            className={`font-medium text-sm ${
                              m.team1Points > m.team2Points ? 'text-[var(--success)]' : ''
                            }`}
                          >
                            {m.team1Name}
                          </div>
                          <div className="text-xs text-[var(--muted)]">{m.team1PlayerName}</div>
                        </div>
                        <div className="flex items-center gap-2 px-3">
                          <span
                            className={`text-lg font-bold min-w-[2ch] text-right ${
                              m.team1Points > m.team2Points ? 'text-[var(--success)]' : ''
                            }`}
                          >
                            {m.team1Points}
                          </span>
                          <span className="text-[var(--muted)]">:</span>
                          <span
                            className={`text-lg font-bold min-w-[2ch] text-left ${
                              m.team2Points > m.team1Points ? 'text-[var(--success)]' : ''
                            }`}
                          >
                            {m.team2Points}
                          </span>
                        </div>
                        <div className="flex-1 text-left">
                          <div
                            className={`font-medium text-sm ${
                              m.team2Points > m.team1Points ? 'text-[var(--success)]' : ''
                            }`}
                          >
                            {m.team2Name}
                          </div>
                          <div className="text-xs text-[var(--muted)]">{m.team2PlayerName}</div>
                        </div>
                      </div>
                      {hasBreakdown && (
                        <div className="text-center mt-2">
                          <span className="text-xs text-[var(--muted)]">
                            {isExpanded ? '▲ Hide breakdown' : '▼ Show breakdown'}
                          </span>
                        </div>
                      )}
                    </button>

                    {isExpanded && hasBreakdown && (
                      <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Team 1 Breakdown */}
                        <div className="bg-[var(--background)] rounded-lg p-3">
                          <div className="text-xs font-semibold text-[var(--muted)] mb-2 text-center">
                            {m.team1Name}
                          </div>
                          <div className="space-y-1.5">
                            {team1Breakdown.players
                              .filter((p) => !p.isBenched)
                              .map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs gap-1">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <span className="text-[var(--muted)] w-7 shrink-0">{p.positionName}</span>
                                    <span className="truncate">{p.name}</span>
                                    <StatIcons player={p} />
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[var(--muted)]">
                                      {p.teamShortName} {p.isHome ? 'v' : '@'} {p.opponentShortName}
                                    </span>
                                    <span
                                      className={`font-medium text-right ${
                                        p.points > 0
                                          ? 'text-[var(--success)]'
                                          : p.points < 0
                                          ? 'text-[var(--danger)]'
                                          : 'text-[var(--muted)]'
                                      }`}
                                    >
                                      {p.points}
                                      {p.bonus > 0 && (
                                        <span className="text-[var(--accent)]"> ({p.bonus})</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            {team1Breakdown.players.some((p) => p.isBenched) && (
                              <>
                                <div className="text-xs text-[var(--muted)] mt-2 pt-2 border-t border-[var(--card-border)]">
                                  Bench
                                </div>
                                {team1Breakdown.players
                                  .filter((p) => p.isBenched)
                                  .map((p, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs text-[var(--muted)] gap-1">
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <span className="w-7 shrink-0">{p.positionName}</span>
                                        <span className="truncate">{p.name}</span>
                                        <StatIcons player={p} />
                                      </div>
                                      <span className="shrink-0">
                                        ({p.points})
                                        {p.bonus > 0 && (
                                          <span className="text-[var(--accent)]"> ({p.bonus})</span>
                                        )}
                                      </span>
                                    </div>
                                  ))}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Team 2 Breakdown */}
                        <div className="bg-[var(--background)] rounded-lg p-3">
                          <div className="text-xs font-semibold text-[var(--muted)] mb-2 text-center">
                            {m.team2Name}
                          </div>
                          <div className="space-y-1.5">
                            {team2Breakdown.players
                              .filter((p) => !p.isBenched)
                              .map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs gap-1">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <span className="text-[var(--muted)] w-7 shrink-0">{p.positionName}</span>
                                    <span className="truncate">{p.name}</span>
                                    <StatIcons player={p} />
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[var(--muted)]">
                                      {p.teamShortName} {p.isHome ? 'v' : '@'} {p.opponentShortName}
                                    </span>
                                    <span
                                      className={`font-medium text-right ${
                                        p.points > 0
                                          ? 'text-[var(--success)]'
                                          : p.points < 0
                                          ? 'text-[var(--danger)]'
                                          : 'text-[var(--muted)]'
                                      }`}
                                    >
                                      {p.points}
                                      {p.bonus > 0 && (
                                        <span className="text-[var(--accent)]"> ({p.bonus})</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            {team2Breakdown.players.some((p) => p.isBenched) && (
                              <>
                                <div className="text-xs text-[var(--muted)] mt-2 pt-2 border-t border-[var(--card-border)]">
                                  Bench
                                </div>
                                {team2Breakdown.players
                                  .filter((p) => p.isBenched)
                                  .map((p, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs text-[var(--muted)] gap-1">
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <span className="w-7 shrink-0">{p.positionName}</span>
                                        <span className="truncate">{p.name}</span>
                                        <StatIcons player={p} />
                                      </div>
                                      <span className="shrink-0">
                                        ({p.points})
                                        {p.bonus > 0 && (
                                          <span className="text-[var(--accent)]"> ({p.bonus})</span>
                                        )}
                                      </span>
                                    </div>
                                  ))}
                              </>
                            )}
                          </div>
                        </div>
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
