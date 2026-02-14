'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { FixtureWithNames, TeamPointsBreakdown, PlayerPoints, PerGameStat } from '@/lib/types'

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

// Inline stat icons - only key stats (goals, assists, clean sheets, red cards)
function StatIcons({ player, isTopScorer }: { player: PlayerPoints; isTopScorer?: boolean }) {
  const icons: React.ReactNode[] = []

  if (isTopScorer && player.points > 0) {
    icons.push(
      <span key="star" className="text-[var(--warning)] drop-shadow-[0_0_3px_var(--warning)]" title="Top scorer this match" aria-label="Top scorer">★</span>
    )
  }
  for (let i = 0; i < player.goals; i++) {
    icons.push(<span key={`goal-${i}`} title="Goal" className="stat-icon">⚽</span>)
  }
  for (let i = 0; i < player.assists; i++) {
    icons.push(<span key={`assist-${i}`} title="Assist" className="stat-icon">🅰️</span>)
  }
  if (player.cleanSheet && ['GK', 'DEF', 'MID'].includes(player.positionName)) {
    icons.push(<span key="cs" title="Clean sheet" className="stat-icon">🛡️</span>)
  }
  for (let i = 0; i < player.redCards; i++) {
    icons.push(<span key={`red-${i}`} title="Red card" className="stat-icon">🟥</span>)
  }

  if (icons.length === 0) return null
  return <span className="inline-flex items-center gap-0.5 ml-1">{icons}</span>
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
    icons.push(<span key="sv" title={`${game.saves} saves`} className="text-[9px] text-[var(--muted)]">{game.saves}sv</span>)
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
                  {p.opponents.length > 0
                    ? `${p.teamShortName} ${p.opponents.map((o) => `${o.isHome ? 'v' : '@'} ${o.opponentShortName}`).join(', ')}`
                    : `${p.teamShortName} ${p.isHome ? 'v' : '@'} ${p.opponentShortName}`}
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
                <PlayerDetailPopover player={p} />
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

// Custom dropdown component with glassmorphism styling
function TeamFilter({
  teams,
  selectedTeamId,
  onSelect,
}: {
  teams: TeamOption[]
  selectedTeamId: number | null
  onSelect: (id: number | null) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSelect = (teamId: number | null) => {
    onSelect(teamId)
    setIsOpen(false)
  }

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-4 shadow-[var(--card-shadow)]">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Label */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted)] flex items-center justify-center">
            <svg
              className="w-4 h-4 text-[var(--accent)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">Filter by team</span>
        </div>

        {/* Custom dropdown */}
        <div ref={dropdownRef} className="relative flex-1 sm:max-w-xs">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label="Select team filter"
            className={`
              w-full min-h-[44px] px-4 py-2.5
              flex items-center justify-between gap-2
              glass rounded-lg
              border transition-all duration-200
              touch-target btn-press
              ${
                isOpen
                  ? 'border-[var(--accent)] ring-2 ring-[var(--accent-muted)]'
                  : selectedTeamId
                  ? 'border-[var(--accent)]/50 bg-[var(--accent-muted)]'
                  : 'border-[var(--card-border)] hover:border-[var(--card-border-hover)]'
              }
            `}
          >
            <span
              className={`truncate text-sm ${
                selectedTeam ? 'font-medium text-[var(--foreground)]' : 'text-[var(--muted)]'
              }`}
            >
              {selectedTeam ? selectedTeam.name : 'All Teams'}
            </span>
            <svg
              className={`w-4 h-4 text-[var(--muted)] transition-transform duration-200 shrink-0 ${
                isOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {isOpen && (
            <div
              role="listbox"
              className="absolute z-[var(--z-dropdown)] top-full left-0 right-0 mt-2 py-1 glass rounded-lg border border-[var(--card-border)] shadow-[var(--card-shadow-lg)] animate-scale-in overflow-hidden"
            >
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {/* All Teams option */}
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedTeamId === null}
                  onClick={() => handleSelect(null)}
                  className={`
                    w-full px-4 py-3 text-left text-sm
                    flex items-center justify-between gap-2
                    transition-colors touch-target
                    ${
                      selectedTeamId === null
                        ? 'bg-[var(--accent-muted)] text-[var(--accent)] font-medium'
                        : 'text-[var(--foreground)] hover:bg-[var(--card-border)]/50'
                    }
                  `}
                >
                  <span>All Teams</span>
                  {selectedTeamId === null && (
                    <svg
                      className="w-4 h-4 text-[var(--accent)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Divider */}
                <div className="h-px bg-[var(--card-border)] mx-2 my-1" />

                {/* Team options */}
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    role="option"
                    aria-selected={selectedTeamId === team.id}
                    onClick={() => handleSelect(team.id)}
                    className={`
                      w-full px-4 py-3 text-left text-sm
                      flex items-center justify-between gap-2
                      transition-colors touch-target
                      ${
                        selectedTeamId === team.id
                          ? 'bg-[var(--accent-muted)] text-[var(--accent)] font-medium'
                          : 'text-[var(--foreground)] hover:bg-[var(--card-border)]/50'
                      }
                    `}
                  >
                    <span className="truncate">{team.name}</span>
                    {selectedTeamId === team.id && (
                      <svg
                        className="w-4 h-4 text-[var(--accent)] shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
                        <div className="flex items-center justify-center mt-2">
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
