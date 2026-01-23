'use client'

import { useState } from 'react'
import { WhatIfSquad } from '@/lib/types'

interface WhatIfProps {
  squads: WhatIfSquad[]
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

// Rank badge with medal styling - larger variant for card-based layout
function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    // Use same color scheme as Standings/SummerStandings for visual consistency
    const medalColors = {
      1: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      2: 'bg-slate-400/20 text-slate-300 border-slate-400/30',
      3: 'bg-amber-700/20 text-amber-600 border-amber-700/30',
    }[rank]

    const medalIcon = {
      1: '1st',
      2: '2nd',
      3: '3rd',
    }[rank]

    return (
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border ${medalColors}`}
      >
        {medalIcon}
      </div>
    )
  }

  return (
    <div className="w-10 h-10 rounded-full bg-[var(--card-border)] flex items-center justify-center font-bold text-sm text-[var(--muted)]">
      {rank}
    </div>
  )
}

// Squad ranking card
function SquadCard({
  squad,
  rank,
  isExpanded,
  onToggle,
}: {
  squad: WhatIfSquad
  rank: number
  isExpanded: boolean
  onToggle: () => void
}) {
  const isTop3 = rank <= 3

  return (
    <div
      className={`border-b border-[var(--card-border)] last:border-b-0 ${
        isTop3 ? 'bg-gradient-to-r from-[var(--warning-muted)] to-transparent' : ''
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 hover:bg-[var(--card-border)]/20 transition-colors touch-target"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <RankBadge rank={rank} />
            <div className="text-left min-w-0">
              <div className="font-semibold truncate">{squad.teamName}</div>
              <div className="text-xs text-[var(--muted)] truncate">{squad.managerName}</div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xl font-bold text-[var(--success)] tabular-nums">
              {squad.totalPoints.toLocaleString()}
            </div>
            <div className="text-[10px] text-[var(--muted)] uppercase">total points</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 mt-3">
          <svg
            className={`w-4 h-4 text-[var(--muted)] transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-xs text-[var(--muted)]">
            {isExpanded ? 'Hide' : 'Show'} squad
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="bg-[var(--background)] rounded-lg border border-[var(--card-border)] overflow-hidden">
            {/* Squad header */}
            <div className="px-3 py-2 border-b border-[var(--card-border)] bg-[var(--card)] flex items-center justify-between">
              <span className="text-xs font-semibold">Original Draft Squad</span>
              <span className="text-[10px] text-[var(--muted)]">
                {squad.players.length} players
              </span>
            </div>

            {/* Players list */}
            <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
              {squad.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md hover:bg-[var(--card-border)]/30 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <PositionBadge position={player.positionName} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium" title={player.name}>
                        {player.name}
                      </div>
                      <div className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                        <span>{player.teamShortName}</span>
                        <span className="text-[var(--card-border)]">|</span>
                        <span>Round {player.draftRound}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span
                      className={`font-semibold tabular-nums ${
                        player.totalPoints > 0 ? 'text-[var(--success)]' : 'text-[var(--muted)]'
                      }`}
                    >
                      {player.totalPoints}
                    </span>
                    <span className="text-[10px] text-[var(--muted)] ml-0.5">pts</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Squad summary */}
            <div className="px-3 py-2 border-t border-[var(--card-border)] bg-[var(--card)] flex items-center justify-between">
              <span className="text-xs text-[var(--muted)]">
                Avg per player: {Math.round(squad.totalPoints / squad.players.length)} pts
              </span>
              <span className="text-xs font-semibold text-[var(--success)]">
                Total: {squad.totalPoints.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Empty state
function EmptyState() {
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
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold mb-1">No draft data available</h3>
      <p className="text-[var(--muted)] text-sm">Draft information will appear here once available</p>
    </div>
  )
}

export function WhatIf({ squads }: WhatIfProps) {
  const [expandedSquad, setExpandedSquad] = useState<number | null>(null)

  if (squads.length === 0) {
    return <EmptyState />
  }

  // Calculate some stats
  const topScorer = squads[0]
  const avgPoints = Math.round(squads.reduce((sum, s) => sum + s.totalPoints, 0) / squads.length)
  const pointsSpread = squads[0].totalPoints - squads[squads.length - 1].totalPoints

  return (
    <div className="space-y-4">
      {/* Intro card */}
      <div className="bg-gradient-to-br from-purple-900/20 via-[var(--card)] to-[var(--accent-muted)] rounded-xl border border-purple-500/20 p-4 shadow-[var(--card-shadow)]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">What if no one made any transfers?</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              This shows each team's original draft squad and how many total points those players
              have scored this season. See who had the best draft!
            </p>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-3 text-center">
          <div className="text-xl font-bold text-[var(--success)] tabular-nums">
            {topScorer.totalPoints.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--muted)] uppercase mt-0.5">Best Draft</div>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-3 text-center">
          <div className="text-xl font-bold tabular-nums">{avgPoints.toLocaleString()}</div>
          <div className="text-[10px] text-[var(--muted)] uppercase mt-0.5">Average</div>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-3 text-center">
          <div className="text-xl font-bold text-[var(--accent)] tabular-nums">
            {pointsSpread.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--muted)] uppercase mt-0.5">Spread</div>
        </div>
      </div>

      {/* Rankings */}
      <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]">
        <header className="px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Draft Squad Rankings
          </h2>
        </header>
        <div>
          {squads.map((squad, index) => (
            <SquadCard
              key={squad.entryId}
              squad={squad}
              rank={index + 1}
              isExpanded={expandedSquad === squad.entryId}
              onToggle={() =>
                setExpandedSquad(expandedSquad === squad.entryId ? null : squad.entryId)
              }
            />
          ))}
        </div>
      </section>
    </div>
  )
}
