'use client'

import React, { useState } from 'react'
import { FixtureWithNames, TeamPointsBreakdown, PlayerPoints } from '@/lib/types'

interface FixturesProps {
  fixtures: FixtureWithNames[]
  currentEvent: number
  pointsBreakdown: Record<number, TeamPointsBreakdown>
}

// Helper to render stat icons
function StatIcons({ player }: { player: PlayerPoints }) {
  const icons: React.ReactNode[] = []

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

  // Defensive contribution (only for DEF and MID, show count)
  if (player.defensiveContribution > 0 && ['DEF', 'MID'].includes(player.positionName)) {
    icons.push(
      <span key="dc" className="text-[var(--accent)]" title="Defensive contributions">
        🦺{player.defensiveContribution}
      </span>
    )
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

  return <span className="ml-1">{icons}</span>
}

export function Fixtures({ fixtures, currentEvent, pointsBreakdown }: FixturesProps) {
  const [expandedFixture, setExpandedFixture] = useState<number | null>(null)

  if (fixtures.length === 0) {
    return (
      <section className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">
          Gameweek {currentEvent}
        </h2>
        <p className="text-[var(--muted)] text-sm">No fixtures this week</p>
      </section>
    )
  }

  return (
    <section className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] overflow-hidden">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] px-4 py-3 border-b border-[var(--card-border)]">
        Gameweek {currentEvent}
      </h2>
      <div className="divide-y divide-[var(--card-border)]">
        {fixtures.map((f, i) => {
          const isExpanded = expandedFixture === i
          const team1Breakdown = pointsBreakdown[f.team1Id]
          const team2Breakdown = pointsBreakdown[f.team2Id]
          const hasBreakdown = team1Breakdown && team2Breakdown

          // Use calculated points from breakdown during live GW, API points when finished
          const isLive = f.started && !f.finished
          const team1Points = isLive && team1Breakdown ? team1Breakdown.totalPoints : f.team1Points
          const team2Points = isLive && team2Breakdown ? team2Breakdown.totalPoints : f.team2Points

          return (
            <div key={i}>
              <button
                onClick={() => setExpandedFixture(isExpanded ? null : i)}
                className="w-full px-4 py-3 hover:bg-[var(--card-border)]/30 transition-colors"
                disabled={!hasBreakdown}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 text-right">
                    <div
                      className={`font-medium ${
                        f.started && team1Points > team2Points
                          ? 'text-[var(--success)]'
                          : ''
                      }`}
                    >
                      {f.team1Name}
                    </div>
                    <div className="text-xs text-[var(--muted)]">{f.team1PlayerName}</div>
                  </div>
                  <div className="flex items-center gap-2 px-3">
                    <span
                      className={`text-lg font-bold min-w-[2ch] text-right ${
                        f.started && team1Points > team2Points
                          ? 'text-[var(--success)]'
                          : ''
                      }`}
                    >
                      {f.started ? team1Points : '-'}
                    </span>
                    <span className="text-[var(--muted)]">:</span>
                    <span
                      className={`text-lg font-bold min-w-[2ch] text-left ${
                        f.started && team2Points > team1Points
                          ? 'text-[var(--success)]'
                          : ''
                      }`}
                    >
                      {f.started ? team2Points : '-'}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <div
                      className={`font-medium ${
                        f.started && team2Points > team1Points
                          ? 'text-[var(--success)]'
                          : ''
                      }`}
                    >
                      {f.team2Name}
                    </div>
                    <div className="text-xs text-[var(--muted)]">{f.team2PlayerName}</div>
                  </div>
                </div>
                {!f.finished && f.started && (
                  <div className="text-center mt-1">
                    <span className="text-xs bg-[var(--success)] text-black px-2 py-0.5 rounded-full">
                      LIVE
                    </span>
                  </div>
                )}
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
                      {f.team1Name}
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
                      {f.team2Name}
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
}
