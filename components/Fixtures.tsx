'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FixtureWithNames, TeamPointsBreakdown, PlayerPoints, PerGameStat } from '@/lib/types'

interface FixturesProps {
  fixtures: FixtureWithNames[]
  currentEvent: number
  pointsBreakdown: Record<number, TeamPointsBreakdown>
}

// Position badge component with proper styling
function PositionBadge({ position }: { position: string }) {
  const positionClass = {
    GK: 'pos-gk',
    DEF: 'pos-def',
    MID: 'pos-mid',
    FWD: 'pos-fwd',
  }[position] || ''

  return <span className={`pos-badge ${positionClass}`}>{position}</span>
}

// Inline stat icons - only key stats (goals, assists, clean sheets, red cards)
function StatIcons({ player, isTopScorer }: { player: PlayerPoints; isTopScorer?: boolean }) {
  const stats: React.ReactNode[] = []

  // Star for top scorer
  if (isTopScorer && player.points > 0) {
    stats.push(
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
    stats.push(
      <span key={`goal-${i}`} title="Goal" className="stat-icon">
        ⚽
      </span>
    )
  }

  // Assists
  for (let i = 0; i < player.assists; i++) {
    stats.push(
      <span key={`assist-${i}`} title="Assist" className="stat-icon">
        🅰️
      </span>
    )
  }

  // Clean sheet
  if (player.cleanSheet && ['GK', 'DEF', 'MID'].includes(player.positionName)) {
    stats.push(
      <span key="cs" title="Clean sheet" className="stat-icon">
        🛡️
      </span>
    )
  }

  // Red cards (important - player sent off)
  for (let i = 0; i < player.redCards; i++) {
    stats.push(
      <span key={`red-${i}`} title="Red card" className="stat-icon">
        🟥
      </span>
    )
  }

  if (stats.length === 0) return null

  return <span className="inline-flex items-center gap-0.5 ml-1">{stats}</span>
}

// Per-game stat icons for the detail popup
function GameStatIcons({ game, positionName, defensiveContribution }: { game: PerGameStat; positionName: string; defensiveContribution?: number }) {
  const icons: React.ReactNode[] = []

  for (let i = 0; i < game.goals; i++) {
    icons.push(<span key={`g-${i}`} title="Goal" className="stat-icon">⚽</span>)
  }
  for (let i = 0; i < game.assists; i++) {
    icons.push(<span key={`a-${i}`} title="Assist" className="stat-icon">🅰️</span>)
  }
  if (game.cleanSheet && ['GK', 'DEF', 'MID'].includes(positionName)) {
    icons.push(<span key="cs" title="Clean sheet" className="stat-icon">🛡️</span>)
  }
  for (let i = 0; i < game.yellowCards; i++) {
    icons.push(<span key={`y-${i}`} title="Yellow card" className="stat-icon">🟨</span>)
  }
  for (let i = 0; i < game.redCards; i++) {
    icons.push(<span key={`r-${i}`} title="Red card" className="stat-icon">🟥</span>)
  }
  for (let i = 0; i < game.ownGoals; i++) {
    icons.push(<span key={`og-${i}`} title="Own goal" className="stat-icon text-[var(--danger)]">OG</span>)
  }
  if (game.penaltiesMissed > 0) {
    icons.push(<span key="pm" title="Penalty missed" className="stat-icon text-[var(--danger)]">PM</span>)
  }
  if (game.saves >= 3) {
    icons.push(
      <span key="sv" title={`${game.saves} saves`} className="text-[9px] text-[var(--muted)]">
        {game.saves}sv
      </span>
    )
  }
  if (defensiveContribution && defensiveContribution > 0 && ['DEF', 'MID'].includes(positionName)) {
    icons.push(
      <span key="dc" title={`${defensiveContribution} defensive contributions`} className="text-[9px] text-[var(--muted)] bg-[var(--card-border)] px-1 py-0.5 rounded">
        DC:{defensiveContribution}
      </span>
    )
  }

  if (icons.length === 0) return null
  return <span className="inline-flex items-center gap-0.5 flex-wrap">{icons}</span>
}

// Player detail popup - shows per-game breakdown
function PlayerDetailPopover({ player }: { player: PlayerPoints }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const hasDetails = player.hasPlayed || player.perGameStats.length > 0

  if (!hasDetails) return null

  const games = player.perGameStats.length > 0
    ? player.perGameStats
    : null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
        className={`w-4 h-4 rounded-full text-[9px] font-bold leading-none flex items-center justify-center transition-colors ${
          isOpen
            ? 'bg-[var(--accent)] text-white'
            : 'bg-[var(--card-border)] text-[var(--muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--accent)]'
        }`}
        title="View details"
        aria-label="Player details"
      >
        i
      </button>
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 z-[var(--z-dropdown)] min-w-[200px] bg-[var(--card-elevated)] border border-[var(--card-border)] rounded-lg shadow-[var(--card-shadow-lg)] animate-scale-in overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {games ? (
            <div className="divide-y divide-[var(--card-border)]">
              {games.map((game, idx) => (
                <div key={idx} className="px-3 py-2 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-[var(--muted)] uppercase">
                      {game.isHome ? 'vs' : '@'} {game.opponentShortName}
                    </span>
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        game.points > 0 ? 'text-[var(--success)]' : game.points < 0 ? 'text-[var(--danger)]' : 'text-[var(--muted)]'
                      }`}
                    >
                      {game.points}pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] tabular-nums ${
                          game.minutes > 0 && game.minutes < 60
                            ? 'text-[var(--warning)] font-medium'
                            : 'text-[var(--muted)]'
                        }`}
                      >
                        {game.minutes}&apos;
                      </span>
                      <GameStatIcons
                        game={game}
                        positionName={player.positionName}
                        defensiveContribution={idx === 0 ? player.defensiveContribution : undefined}
                      />
                    </div>
                    {game.bonus > 0 && (
                      <span className="text-[9px] font-medium text-[var(--accent)] bg-[var(--accent-muted)] px-1 py-0.5 rounded">
                        +{game.bonus}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-[10px] text-[var(--muted)]">
              {player.minutesPlayed > 0 ? `${player.minutesPlayed} min played` : 'No data available'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Progress indicator for players played
function PlayersProgress({ played, total }: { played: number; total: number }) {
  const percentage = (played / total) * 100
  const isComplete = played === total

  return (
    <div className="flex items-center gap-2">
      {/* Progress bar */}
      <div className="progress-bar w-12 sm:w-16">
        <div
          className={`progress-bar-fill ${isComplete ? 'bg-[var(--success)]' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {/* Count */}
      <span
        className={`text-[10px] font-medium tabular-nums ${
          isComplete ? 'text-[var(--success)]' : 'text-[var(--muted)]'
        }`}
      >
        {played}/{total}
      </span>
    </div>
  )
}

// Live badge component
function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs bg-[var(--success)] text-black px-3 py-1 rounded-full font-semibold animate-pulse-live">
      <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse-dot" />
      LIVE
    </span>
  )
}

// Score display component
function ScoreDisplay({
  score,
  isWinning,
  isStarted,
}: {
  score: number
  isWinning: boolean
  isStarted: boolean
}) {
  return (
    <span
      className={`text-2xl sm:text-3xl font-bold min-w-[2.5ch] text-center tabular-nums transition-colors ${
        isStarted && isWinning
          ? 'text-[var(--success)]'
          : isStarted
          ? 'text-[var(--foreground)]'
          : 'text-[var(--muted)]'
      }`}
    >
      {isStarted ? score : '-'}
    </span>
  )
}

// Team info component for fixture card
function TeamInfo({
  name,
  managerName,
  isWinning,
  isStarted,
  align,
}: {
  name: string
  managerName: string
  isWinning: boolean
  isStarted: boolean
  align: 'left' | 'right'
}) {
  return (
    <div className={`flex-1 min-w-0 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <div
        className={`font-semibold text-sm sm:text-base truncate transition-colors ${
          isStarted && isWinning ? 'text-[var(--success)]' : ''
        }`}
      >
        {name}
      </div>
      <div className="text-xs text-[var(--muted)] truncate">{managerName}</div>
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
    <div className="bg-gradient-to-b from-[var(--background)] to-[var(--card)] rounded-lg border border-[var(--card-border)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--card-border)] bg-[var(--card)]">
        <span className="text-xs font-semibold truncate">{teamName}</span>
        <PlayersProgress played={playersPlayed} total={starters.length} />
      </div>

      {/* Players list */}
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
                <span
                  className={`truncate ${!p.hasPlayed ? 'text-[var(--muted)]' : ''}`}
                  title={p.name}
                >
                  {p.name}
                </span>
                <StatIcons player={p} isTopScorer={isTop} />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Fixture info - hidden on mobile for space */}
                <span className="hidden sm:inline text-[10px] text-[var(--muted)]">
                  {p.opponents.length > 0
                    ? `${p.teamShortName} ${p.opponents.map((o) => `${o.isHome ? 'v' : '@'} ${o.opponentShortName}`).join(', ')}`
                    : `${p.teamShortName} ${p.isHome ? 'v' : '@'} ${p.opponentShortName}`}
                </span>

                {/* Points */}
                <span
                  className={`font-semibold min-w-[3ch] text-right tabular-nums ${
                    p.points > 0
                      ? 'text-[var(--success)]'
                      : p.points < 0
                      ? 'text-[var(--danger)]'
                      : 'text-[var(--muted)]'
                  }`}
                >
                  {p.hasPlayed ? p.points : '-'}
                </span>

                {/* Bonus */}
                {p.bonus > 0 && (
                  <span className="text-[10px] font-medium text-[var(--accent)] bg-[var(--accent-muted)] px-1 py-0.5 rounded">
                    +{p.bonus}
                  </span>
                )}

                {/* Info popup with per-game details */}
                <PlayerDetailPopover player={p} />
              </div>
            </div>
          )
        })}

        {/* Bench section */}
        {bench.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--card-border)]">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
                Bench
              </span>
              <div className="flex-1 h-px bg-[var(--card-border)]" />
            </div>
            {bench.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs text-[var(--muted)] gap-1.5 px-2 py-1 opacity-70"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[10px] w-6">{p.positionName}</span>
                  <span className="truncate">{p.name}</span>
                  <StatIcons player={p} />
                </div>
                <span className="shrink-0 tabular-nums">({p.hasPlayed ? p.points : '-'})</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// Fixture card component
function FixtureCard({
  fixture,
  pointsBreakdown,
  isExpanded,
  onToggle,
}: {
  fixture: FixtureWithNames
  pointsBreakdown: Record<number, TeamPointsBreakdown>
  isExpanded: boolean
  onToggle: () => void
}) {
  const team1Breakdown = pointsBreakdown[fixture.team1Id]
  const team2Breakdown = pointsBreakdown[fixture.team2Id]
  const hasBreakdown = team1Breakdown && team2Breakdown

  const isLive = fixture.started && !fixture.finished

  // Use calculated points from breakdown during live GW, API points when finished
  const team1Points = isLive && team1Breakdown ? team1Breakdown.totalPoints : fixture.team1Points
  const team2Points = isLive && team2Breakdown ? team2Breakdown.totalPoints : fixture.team2Points

  const team1Winning = team1Points > team2Points
  const team2Winning = team2Points > team1Points
  const pointsDiff = Math.abs(team1Points - team2Points)

  return (
    <div
      className={`transition-colors ${
        isLive ? 'bg-gradient-to-r from-[var(--success-muted)] via-transparent to-[var(--success-muted)]' : ''
      }`}
    >
      {/* Main fixture row */}
      <button
        onClick={onToggle}
        disabled={!hasBreakdown}
        className={`w-full px-4 py-4 transition-all touch-target ${
          hasBreakdown ? 'hover:bg-[var(--card-border)]/20 cursor-pointer' : 'cursor-default'
        }`}
        aria-expanded={isExpanded}
        aria-label={`${fixture.team1Name} vs ${fixture.team2Name}, tap to ${isExpanded ? 'hide' : 'show'} breakdown`}
      >
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Team 1 */}
          <TeamInfo
            name={fixture.team1Name}
            managerName={fixture.team1PlayerName}
            isWinning={team1Winning}
            isStarted={fixture.started}
            align="right"
          />

          {/* Score */}
          <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4">
            <ScoreDisplay
              score={team1Points}
              isWinning={team1Winning}
              isStarted={fixture.started}
            />

            <div className="flex flex-col items-center">
              <span className="text-[var(--muted)] text-lg font-light">:</span>
              {isLive && pointsDiff > 0 && (
                <span className="text-[9px] text-[var(--muted)] bg-[var(--card-border)] px-1.5 py-0.5 rounded-full tabular-nums">
                  +{pointsDiff}
                </span>
              )}
            </div>

            <ScoreDisplay
              score={team2Points}
              isWinning={team2Winning}
              isStarted={fixture.started}
            />
          </div>

          {/* Team 2 */}
          <TeamInfo
            name={fixture.team2Name}
            managerName={fixture.team2PlayerName}
            isWinning={team2Winning}
            isStarted={fixture.started}
            align="left"
          />
        </div>

        {/* Live badge */}
        {isLive && (
          <div className="text-center mt-3">
            <LiveBadge />
          </div>
        )}

        {/* Expand/collapse indicator */}
        {hasBreakdown && (
          <div className="flex items-center justify-center mt-3">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                isExpanded
                  ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                  : 'bg-[var(--card-border)]/50 text-[var(--muted)] hover:bg-[var(--card-border)]'
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
              <span>{isExpanded ? 'Hide' : 'View'} Players</span>
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
      </button>

      {/* Expanded breakdown */}
      {isExpanded && hasBreakdown && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
          <TeamBreakdown breakdown={team1Breakdown} teamName={fixture.team1Name} />
          <TeamBreakdown breakdown={team2Breakdown} teamName={fixture.team2Name} />
        </div>
      )}
    </div>
  )
}

// Empty state component
function EmptyState({ currentEvent }: { currentEvent: number }) {
  return (
    <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-8 text-center">
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold mb-1">No fixtures this week</h3>
      <p className="text-[var(--muted)] text-sm">
        Gameweek {currentEvent} has no scheduled matches
      </p>
    </section>
  )
}

// Main Fixtures component
export function Fixtures({ fixtures, currentEvent, pointsBreakdown }: FixturesProps) {
  const [expandedFixture, setExpandedFixture] = useState<number | null>(null)

  if (fixtures.length === 0) {
    return <EmptyState currentEvent={currentEvent} />
  }

  return (
    <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow-md)]">
      {/* Section header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)]">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Gameweek {currentEvent}
        </h2>
        <span className="text-xs text-[var(--muted)]">
          {fixtures.length} {fixtures.length === 1 ? 'match' : 'matches'}
        </span>
      </header>

      {/* Fixture list */}
      <div className="divide-y divide-[var(--card-border)]">
        {fixtures.map((fixture, index) => (
          <FixtureCard
            key={index}
            fixture={fixture}
            pointsBreakdown={pointsBreakdown}
            isExpanded={expandedFixture === index}
            onToggle={() => setExpandedFixture(expandedFixture === index ? null : index)}
          />
        ))}
      </div>
    </section>
  )
}
