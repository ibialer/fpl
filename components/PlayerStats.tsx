'use client'

import React, { useState, useRef, useEffect } from 'react'
import { PlayerPoints, PerGameStat } from '@/lib/types'

export function PositionBadge({ position }: { position: string }) {
  const positionClass = {
    GK: 'pos-gk',
    DEF: 'pos-def',
    MID: 'pos-mid',
    FWD: 'pos-fwd',
  }[position] || ''

  return <span className={`pos-badge ${positionClass}`}>{position}</span>
}

export function StatIcons({ player, isTopScorer }: { player: PlayerPoints; isTopScorer?: boolean }) {
  const icons: React.ReactNode[] = []

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

  for (let i = 0; i < player.goals; i++) {
    icons.push(
      <span key={`goal-${i}`} title="Goal" className="stat-icon">
        ⚽
      </span>
    )
  }

  for (let i = 0; i < player.assists; i++) {
    icons.push(
      <span key={`assist-${i}`} title="Assist" className="stat-icon">
        🅰️
      </span>
    )
  }

  if (player.cleanSheet && ['GK', 'DEF', 'MID'].includes(player.positionName)) {
    icons.push(
      <span key="cs" title="Clean sheet" className="stat-icon">
        🛡️
      </span>
    )
  }

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

export function GameStatIcons({ game, positionName }: { game: PerGameStat; positionName: string }) {
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
  for (let i = 0; i < game.penaltiesMissed; i++) {
    icons.push(<span key={`pm-${i}`} title="Penalty missed" className="stat-icon text-[var(--danger)]">PM</span>)
  }
  for (let i = 0; i < game.penaltiesSaved; i++) {
    icons.push(<span key={`ps-${i}`} title="Penalty saved" className="stat-icon text-[var(--success)]">PS</span>)
  }
  if (game.saves >= 3 && positionName === 'GK') {
    icons.push(
      <span key="sv" title={`${game.saves} saves`} className="text-[9px] text-[var(--muted)] bg-[var(--card-border)] px-1 py-0.5 rounded">
        S:{game.saves}
      </span>
    )
  }
  if (game.goalsConceeded >= 2 && ['GK', 'DEF'].includes(positionName)) {
    icons.push(
      <span key="gc" title={`${game.goalsConceeded} goals conceded`} className="text-[9px] text-[var(--danger)] bg-[var(--card-border)] px-1 py-0.5 rounded">
        GC:{game.goalsConceeded}
      </span>
    )
  }
  if (game.defensiveContribution > 0 && ['DEF', 'MID'].includes(positionName)) {
    icons.push(
      <span key="dc" title={`${game.defensiveContribution} defensive contributions`} className="text-[9px] text-[var(--muted)] bg-[var(--card-border)] px-1 py-0.5 rounded">
        DC:{game.defensiveContribution}
      </span>
    )
  }

  if (icons.length === 0) return null
  return <span className="inline-flex items-center gap-0.5 flex-wrap">{icons}</span>
}

export function PlayerDetailPopover({ player }: { player: PlayerPoints }) {
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

  const hasDetails = player.hasPlayed || (player.perGameStats && player.perGameStats.length > 0)
  if (!hasDetails) return null

  const games = player.perGameStats && player.perGameStats.length > 0 ? player.perGameStats : null

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
                      <GameStatIcons game={game} positionName={player.positionName} />
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
