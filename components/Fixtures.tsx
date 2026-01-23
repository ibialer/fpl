'use client'

import React, { useState } from 'react'
import { FixtureWithNames, TeamPointsBreakdown, PlayerPoints } from '@/lib/types'

interface FixturesProps {
  fixtures: FixtureWithNames[]
  currentEvent: number
  pointsBreakdown: Record<number, TeamPointsBreakdown>
}

// Get background color based on position
function getPositionBg(positionName: string): string {
  switch (positionName) {
    case 'GK':
      return 'bg-[var(--pos-gk)]'
    case 'DEF':
      return 'bg-[var(--pos-def)]'
    case 'MID':
      return 'bg-[var(--pos-mid)]'
    case 'FWD':
      return 'bg-[var(--pos-fwd)]'
    default:
      return ''
  }
}

// Helper to render stat icons
function StatIcons({ player, isTopScorer }: { player: PlayerPoints; isTopScorer?: boolean }) {
  const icons: React.ReactNode[] = []

  // Star for top scorer
  if (isTopScorer && player.points > 0) {
    icons.push(
      <span key="star" className="text-[var(--warning)]" title="Top scorer">
        ★
      </span>
    )
  }

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

  // Defensive contribution (only for DEF and MID, show count) - appears last with space
  if (player.defensiveContribution > 0 && ['DEF', 'MID'].includes(player.positionName)) {
    icons.push(
      <span key="dc" className="text-[var(--muted)] text-[10px]" title="Defensive contributions">
        {' '}DC:{player.defensiveContribution}
      </span>
    )
  }

  if (icons.length === 0) return null

  return <span className="ml-1">{icons}</span>
}

// Progress bar for players played
function PlayersProgress({ played, total }: { played: number; total: number }) {
  const percentage = (played / total) * 100

  return (
    <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
      <div className="w-16 h-1.5 bg-[var(--card-border)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span>{played}/{total}</span>
    </div>
  )
}

// Team breakdown component
function TeamBreakdown({
  breakdown,
  teamName,
}: {
  breakdown: TeamPointsBreakdown
  teamName: string
}) {
  const starters = breakdown.players.filter((p) => !p.isBenched)
  const bench = breakdown.players.filter((p) => p.isBenched)
  const playersPlayed = starters.filter((p) => p.hasPlayed).length

  // Find top scorer among starters
  const topScorer = starters.reduce(
    (max, p) => (p.points > max.points ? p : max),
    starters[0]
  )

  return (
    <div className="bg-gradient-to-b from-[var(--background)] to-[var(--card)] rounded-lg p-3 shadow-[var(--card-shadow)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[var(--muted)]">{teamName}</span>
        <PlayersProgress played={playersPlayed} total={starters.length} />
      </div>
      <div className="space-y-1">
        {starters.map((p, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between text-xs gap-1 px-2 py-1 rounded ${getPositionBg(
              p.positionName
            )} transition-colors`}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-[var(--muted)] w-7 shrink-0 font-medium">{p.positionName}</span>
              <span className={`truncate ${!p.hasPlayed ? 'text-[var(--muted)]' : ''}`}>
                {p.name}
              </span>
              <StatIcons player={p} isTopScorer={p === topScorer} />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[var(--muted)] text-[10px]">
                {p.teamShortName} {p.isHome ? 'v' : '@'} {p.opponentShortName}
              </span>
              <span
                className={`font-medium text-right min-w-[2ch] ${
                  p.points > 0
                    ? 'text-[var(--success)]'
                    : p.points < 0
                    ? 'text-[var(--danger)]'
                    : 'text-[var(--muted)]'
                }`}
              >
                {p.hasPlayed ? p.points : '-'}
                {p.bonus > 0 && <span className="text-[var(--accent)]"> +{p.bonus}</span>}
              </span>
            </div>
          </div>
        ))}
        {bench.length > 0 && (
          <>
            <div className="text-[10px] text-[var(--muted)] mt-2 pt-2 border-t border-[var(--card-border)] uppercase tracking-wider">
              Bench
            </div>
            {bench.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs text-[var(--muted)] gap-1 px-2 py-0.5 opacity-60"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="w-7 shrink-0">{p.positionName}</span>
                  <span className="truncate">{p.name}</span>
                  <StatIcons player={p} />
                </div>
                <span className="shrink-0">
                  ({p.hasPlayed ? p.points : '-'})
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export function Fixtures({ fixtures, currentEvent, pointsBreakdown }: FixturesProps) {
  const [expandedFixture, setExpandedFixture] = useState<number | null>(null)

  if (fixtures.length === 0) {
    return (
      <section className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] p-4 shadow-[var(--card-shadow)]">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">
          Gameweek {currentEvent}
        </h2>
        <p className="text-[var(--muted)] text-sm">No fixtures this week</p>
      </section>
    )
  }

  return (
    <section className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]">
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

          // Calculate points difference for visual indicator
          const pointsDiff = Math.abs(team1Points - team2Points)
          const team1Winning = team1Points > team2Points
          const team2Winning = team2Points > team1Points

          return (
            <div key={i} className={isLive ? 'bg-gradient-to-r from-[var(--success)]/5 via-transparent to-[var(--success)]/5' : ''}>
              <button
                onClick={() => setExpandedFixture(isExpanded ? null : i)}
                className="w-full px-4 py-4 hover:bg-[var(--card-border)]/20 transition-all duration-200"
                disabled={!hasBreakdown}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 text-right">
                    <div
                      className={`font-medium transition-colors ${
                        f.started && team1Winning ? 'text-[var(--success)]' : ''
                      }`}
                    >
                      {f.team1Name}
                    </div>
                    <div className="text-xs text-[var(--muted)]">{f.team1PlayerName}</div>
                  </div>

                  <div className="flex items-center gap-3 px-4">
                    <span
                      className={`text-2xl font-bold min-w-[2ch] text-right transition-all ${
                        f.started && team1Winning ? 'text-[var(--success)]' : ''
                      }`}
                    >
                      {f.started ? team1Points : '-'}
                    </span>

                    <div className="flex flex-col items-center">
                      <span className="text-[var(--muted)] text-lg">:</span>
                      {isLive && pointsDiff > 0 && (
                        <span className="text-[10px] text-[var(--muted)]">
                          +{pointsDiff}
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-2xl font-bold min-w-[2ch] text-left transition-all ${
                        f.started && team2Winning ? 'text-[var(--success)]' : ''
                      }`}
                    >
                      {f.started ? team2Points : '-'}
                    </span>
                  </div>

                  <div className="flex-1 text-left">
                    <div
                      className={`font-medium transition-colors ${
                        f.started && team2Winning ? 'text-[var(--success)]' : ''
                      }`}
                    >
                      {f.team2Name}
                    </div>
                    <div className="text-xs text-[var(--muted)]">{f.team2PlayerName}</div>
                  </div>
                </div>

                {isLive && (
                  <div className="text-center mt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs bg-[var(--success)] text-black px-3 py-1 rounded-full font-medium animate-pulse-live">
                      <span className="w-1.5 h-1.5 bg-black rounded-full" />
                      LIVE
                    </span>
                  </div>
                )}

                {hasBreakdown && (
                  <div className="text-center mt-2">
                    <span className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                      {isExpanded ? '▲ Hide breakdown' : '▼ Show breakdown'}
                    </span>
                  </div>
                )}
              </button>

              {isExpanded && hasBreakdown && (
                <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 tab-content">
                  <TeamBreakdown breakdown={team1Breakdown} teamName={f.team1Name} />
                  <TeamBreakdown breakdown={team2Breakdown} teamName={f.team2Name} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
