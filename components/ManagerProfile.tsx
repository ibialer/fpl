'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  TransactionWithDetails,
  LeagueEntry,
  Standing,
} from '@/lib/types'
import {
  FormResult,
  SeasonTrajectoryPoint,
  GWExtremes,
  DraftRecapEntry,
  RivalryEntry,
} from '@/lib/api'
import { RankBadge } from './RankBadge'
import { TransactionCard } from './TransactionCard'
import { FormIndicator } from './FormIndicator'
import { PositionBadge } from './PlayerStats'

interface ManagerProfileProps {
  entry: LeagueEntry
  standing: Standing
  form: FormResult[]
  trajectory: SeasonTrajectoryPoint[]
  leagueAvgTrajectory: Array<{ event: number; avgCumPoints: number }>
  extremes: GWExtremes
  benchPoints: number
  rivalries: RivalryEntry[]
  draftRecap: DraftRecapEntry[]
  transactions: TransactionWithDetails[]
}

function ProfileHeader({
  entry,
  standing,
  form,
}: {
  entry: LeagueEntry
  standing: Standing
  form: FormResult[]
}) {
  return (
    <section className="bg-gradient-to-br from-[var(--card-elevated)] to-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow-md)]">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <RankBadge rank={standing.rank} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{entry.entry_name}</h1>
            <div className="text-sm text-[var(--muted)] truncate">
              {entry.player_first_name} {entry.player_last_name}
            </div>
            <div className="mt-3 flex items-center flex-wrap gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--muted)] uppercase tracking-wide">Form</span>
                <FormIndicator results={form} />
              </div>
              <span className="text-[var(--success)] font-medium">{standing.matches_won}W</span>
              <span className="text-[var(--muted)]">{standing.matches_drawn}D</span>
              <span className="text-[var(--danger)] font-medium">{standing.matches_lost}L</span>
              <span className="text-[var(--muted)]">
                {standing.points_for} PF · {standing.points_against} PA
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-bold tabular-nums">{standing.total}</div>
            <div className="text-[10px] text-[var(--muted)] uppercase tracking-wide">Pts</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SeasonChart({
  trajectory,
  leagueAvg,
}: {
  trajectory: SeasonTrajectoryPoint[]
  leagueAvg: Array<{ event: number; avgCumPoints: number }>
}) {
  const [hover, setHover] = useState<number | null>(null)

  const width = 640
  const height = 180
  const padX = 36
  const padY = 22
  const plotW = width - padX * 2
  const plotH = height - padY * 2

  const chart = useMemo(() => {
    if (trajectory.length === 0) return null

    let minEvent = Infinity
    let maxEvent = -Infinity
    let maxCum = 1
    for (const p of trajectory) {
      if (p.event < minEvent) minEvent = p.event
      if (p.event > maxEvent) maxEvent = p.event
      if (p.cumPoints > maxCum) maxCum = p.cumPoints
    }
    for (const p of leagueAvg) {
      if (p.avgCumPoints > maxCum) maxCum = p.avgCumPoints
    }
    const eventSpan = Math.max(1, maxEvent - minEvent)
    const maxY = maxCum * 1.05

    const xFor = (event: number) => padX + ((event - minEvent) / eventSpan) * plotW
    const yFor = (v: number) => padY + plotH - (v / maxY) * plotH

    const linePath = trajectory
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.event).toFixed(1)} ${yFor(p.cumPoints).toFixed(1)}`)
      .join(' ')

    const avgPath = leagueAvg
      .map(
        (p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.event).toFixed(1)} ${yFor(p.avgCumPoints).toFixed(1)}`
      )
      .join(' ')

    const tickEvents: number[] = []
    for (let e = minEvent; e <= maxEvent; e += Math.max(1, Math.ceil(eventSpan / 6))) {
      tickEvents.push(e)
    }
    if (tickEvents[tickEvents.length - 1] !== maxEvent) tickEvents.push(maxEvent)

    return { minEvent, maxEvent, maxY, xFor, yFor, linePath, avgPath, tickEvents }
  }, [trajectory, leagueAvg, plotW, plotH])

  if (!chart) {
    return (
      <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]">
        <header className="px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Season Trajectory
          </h2>
        </header>
        <div className="p-8 text-center text-sm text-[var(--muted)]">
          Chart will appear after first finished gameweek.
        </div>
      </section>
    )
  }

  const { maxY, xFor, yFor, linePath, avgPath, tickEvents } = chart

  const hovered = hover !== null ? trajectory.find((p) => p.event === hover) : null

  return (
    <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]">
      <header className="px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)] flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Season Trajectory
        </h2>
        <div className="flex items-center gap-3 text-[10px] text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5 bg-[var(--accent)]" /> This team
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5 border-t border-dashed border-[var(--muted)]" /> League avg
          </span>
        </div>
      </header>
      <div className="p-2 relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          role="img"
          aria-label="Season trajectory chart"
        >
          {/* gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <line
              key={i}
              x1={padX}
              y1={padY + plotH * t}
              x2={padX + plotW}
              y2={padY + plotH * t}
              stroke="var(--card-border)"
              strokeWidth={1}
            />
          ))}
          {/* League average line */}
          <path
            d={avgPath}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            opacity={0.7}
          />
          {/* This team line */}
          <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
          {/* Dots */}
          {trajectory.map((p) => (
            <g key={p.event}>
              <circle
                cx={xFor(p.event)}
                cy={yFor(p.cumPoints)}
                r={hover === p.event ? 5 : 3}
                fill="var(--accent)"
                stroke="var(--card)"
                strokeWidth={2}
              />
              <rect
                x={xFor(p.event) - 10}
                y={padY}
                width={20}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(p.event)}
                onMouseLeave={() => setHover(null)}
                onTouchStart={() => setHover(p.event)}
                style={{ cursor: 'pointer' }}
              />
            </g>
          ))}
          {/* X axis ticks */}
          {tickEvents.map((e) => (
            <text
              key={e}
              x={xFor(e)}
              y={height - 4}
              textAnchor="middle"
              fontSize={10}
              fill="var(--muted)"
            >
              GW{e}
            </text>
          ))}
          {/* Y axis min/max */}
          <text x={4} y={yFor(maxY) + 4} fontSize={10} fill="var(--muted)">
            {Math.round(maxY)}
          </text>
          <text x={4} y={yFor(0) + 4} fontSize={10} fill="var(--muted)">
            0
          </text>
        </svg>
        {hovered && (
          <div
            className="absolute top-2 right-2 bg-[var(--card-elevated)] border border-[var(--card-border)] rounded-md px-2.5 py-1.5 text-xs shadow-[var(--card-shadow)] pointer-events-none"
          >
            <div className="font-semibold">GW {hovered.event}</div>
            <div className="text-[var(--muted)]">
              +{hovered.gwPoints} pts · total {hovered.cumPoints}
            </div>
            <div className="text-[var(--muted)]">Rank {hovered.cumRank}</div>
          </div>
        )}
      </div>
    </section>
  )
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: 'success' | 'danger' | 'accent' | 'warning'
}) {
  const accentClass = {
    success: 'text-[var(--success)]',
    danger: 'text-[var(--danger)]',
    accent: 'text-[var(--accent)]',
    warning: 'text-[var(--warning)]',
  }[accent || 'accent']

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-3 shadow-[var(--card-shadow)]">
      <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className={`text-xl sm:text-2xl font-bold tabular-nums mt-1 ${accentClass}`}>{value}</div>
      {sub && <div className="text-[10px] text-[var(--muted)] mt-0.5">{sub}</div>}
    </div>
  )
}

function StatCards({
  extremes,
  benchPoints,
}: {
  extremes: GWExtremes
  benchPoints: number
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        label="Best GW"
        value={extremes.bestPoints || '-'}
        sub={extremes.bestGW ? `GW ${extremes.bestGW}` : 'No matches yet'}
        accent="success"
      />
      <StatCard
        label="Worst GW"
        value={extremes.worstPoints || '-'}
        sub={extremes.worstGW ? `GW ${extremes.worstGW}` : 'No matches yet'}
        accent="danger"
      />
      <StatCard
        label="Avg GW"
        value={extremes.matchesPlayed > 0 ? extremes.avgPoints.toFixed(1) : '-'}
        sub={`${extremes.matchesPlayed} GW played`}
        accent="accent"
      />
      <StatCard
        label="Bench Pts"
        value={benchPoints}
        sub="Left on the bench"
        accent="warning"
      />
    </div>
  )
}

function Rivalries({ rivalries }: { rivalries: RivalryEntry[] }) {
  if (rivalries.length === 0) {
    return null
  }

  return (
    <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]">
      <header className="px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)]">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Rivalries
        </h2>
      </header>
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {rivalries.map((r) => {
          const { wins, draws, losses, pointsFor, pointsAgainst } = r.record
          const total = wins + draws + losses
          const isDominant = wins > losses
          const isLosing = losses > wins
          const bgClass = isDominant
            ? 'bg-[var(--success-muted)]'
            : isLosing
            ? 'bg-[var(--danger-muted)]'
            : 'bg-[var(--background)]'

          return (
            <Link
              key={r.opponentId}
              href={`/team/${r.opponentId}`}
              className={`block p-3 rounded-lg border border-[var(--card-border)] hover:border-[var(--accent)]/50 transition-colors ${bgClass}`}
            >
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="font-semibold text-sm truncate">{r.opponentName}</span>
                <span className="text-[10px] text-[var(--muted)] shrink-0">
                  {total} {total === 1 ? 'match' : 'matches'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium">
                <span className="text-[var(--success)]">{wins}</span>
                <span className="text-[var(--muted)]">-</span>
                <span className="text-[var(--muted)]">{draws}</span>
                <span className="text-[var(--muted)]">-</span>
                <span className="text-[var(--danger)]">{losses}</span>
              </div>
              {total > 0 && (
                <>
                  <div className="flex w-full h-1 rounded-full overflow-hidden bg-[var(--card-border)] mt-2">
                    {wins > 0 && (
                      <div
                        className="h-full bg-[var(--success)]"
                        style={{ width: `${(wins / total) * 100}%` }}
                      />
                    )}
                    {draws > 0 && (
                      <div
                        className="h-full bg-[var(--muted)]"
                        style={{ width: `${(draws / total) * 100}%` }}
                      />
                    )}
                    {losses > 0 && (
                      <div
                        className="h-full bg-[var(--danger)]"
                        style={{ width: `${(losses / total) * 100}%` }}
                      />
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--muted)] mt-1.5 tabular-nums">
                    {pointsFor} - {pointsAgainst}
                  </div>
                </>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function DraftRecap({ recap }: { recap: DraftRecapEntry[] }) {
  if (recap.length === 0) return null

  return (
    <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]">
      <header className="px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)]">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Draft Recap
        </h2>
      </header>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--muted)] text-xs uppercase border-b border-[var(--card-border)]">
              <th className="text-left px-3 py-2.5 font-medium">R</th>
              <th className="text-left px-3 py-2.5 font-medium">Player</th>
              <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Team</th>
              <th className="text-right px-3 py-2.5 font-medium">Pts</th>
              <th className="text-right px-3 py-2.5 font-medium">vs Round</th>
            </tr>
          </thead>
          <tbody>
            {recap.map((pick) => {
              const delta = pick.deltaFromRoundAvg
              const deltaClass =
                delta > 0 ? 'text-[var(--success)]' : delta < 0 ? 'text-[var(--danger)]' : 'text-[var(--muted)]'
              return (
                <tr key={`${pick.round}-${pick.pick}`} className="border-b border-[var(--card-border)] last:border-b-0 row-hover">
                  <td className="px-3 py-2 text-[var(--muted)] tabular-nums">{pick.round}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <PositionBadge position={pick.position} />
                      <span className="font-medium truncate">{pick.playerName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[var(--muted)] text-xs hidden sm:table-cell">{pick.team}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">{pick.totalPoints}</td>
                  <td className={`px-3 py-2 text-right tabular-nums font-medium ${deltaClass}`}>
                    {delta > 0 ? '+' : ''}
                    {delta.toFixed(1)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TransactionsHistory({ transactions }: { transactions: TransactionWithDetails[] }) {
  return (
    <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]">
      <header className="px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)] flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Transactions
        </h2>
        <span className="text-xs text-[var(--muted)]">
          {transactions.length} total
        </span>
      </header>
      {transactions.length === 0 ? (
        <div className="p-8 text-center text-sm text-[var(--muted)]">
          No accepted waivers or free-agent moves yet.
        </div>
      ) : (
        <div className="divide-y divide-[var(--card-border)] max-h-[520px] overflow-y-auto custom-scrollbar">
          {transactions.map((t) => (
            <TransactionCard key={t.id} transaction={t} showGW linkManager={false} />
          ))}
        </div>
      )}
    </section>
  )
}

function AIIcon({ isLoading }: { isLoading?: boolean }) {
  return (
    <div
      className={`w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center shrink-0 ${
        isLoading ? 'animate-pulse' : ''
      }`}
    >
      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    </div>
  )
}

interface AISeasonNarrativeProps {
  entry: LeagueEntry
  standing: Standing
  extremes: GWExtremes
  benchPoints: number
  form: FormResult[]
  rivalries: RivalryEntry[]
  draftRecap: DraftRecapEntry[]
}

function AISeasonNarrative({
  entry,
  standing,
  extremes,
  benchPoints,
  form,
  rivalries,
  draftRecap,
}: AISeasonNarrativeProps) {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchSummary = async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setStreaming(false)
    setSummary('')
    setError(null)

    try {
      const hits = [...draftRecap]
        .filter((p) => p.deltaFromRoundAvg > 0)
        .sort((a, b) => b.deltaFromRoundAvg - a.deltaFromRoundAvg)
        .slice(0, 3)
        .map((p) => ({ name: p.playerName, round: p.round, totalPoints: p.totalPoints, deltaFromRoundAvg: p.deltaFromRoundAvg }))
      const misses = [...draftRecap]
        .filter((p) => p.deltaFromRoundAvg < 0)
        .sort((a, b) => a.deltaFromRoundAvg - b.deltaFromRoundAvg)
        .slice(0, 2)
        .map((p) => ({ name: p.playerName, round: p.round, totalPoints: p.totalPoints, deltaFromRoundAvg: p.deltaFromRoundAvg }))

      const response = await fetch('/api/team-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId: entry.id,
          teamName: entry.entry_name,
          managerName: `${entry.player_first_name} ${entry.player_last_name}`,
          currentRank: standing.rank,
          record: {
            wins: standing.matches_won,
            draws: standing.matches_drawn,
            losses: standing.matches_lost,
          },
          totalPoints: standing.points_for,
          bestGW: extremes.matchesPlayed > 0 ? { event: extremes.bestGW, points: extremes.bestPoints } : null,
          worstGW: extremes.matchesPlayed > 0 ? { event: extremes.worstGW, points: extremes.worstPoints } : null,
          benchPoints,
          avgGWPoints: extremes.avgPoints,
          form: form.join(''),
          rivalries: rivalries.slice(0, 5).map((r) => ({
            opponentName: r.opponentName,
            wins: r.record.wins,
            draws: r.record.draws,
            losses: r.record.losses,
          })),
          draftHits: hits,
          draftMisses: misses,
        }),
        signal: controller.signal,
      })

      if (!response.ok) throw new Error('Failed to fetch summary')
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      setLoading(false)
      setStreaming(true)
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              setStreaming(false)
              continue
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                accumulated += parsed.text
                setSummary(accumulated)
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError('Could not load season narrative')
      setLoading(false)
      setStreaming(false)
    }
  }

  useEffect(() => {
    fetchSummary()
    return () => abortRef.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id])

  return (
    <section className="bg-gradient-to-br from-[var(--accent-muted)] via-[var(--card)] to-purple-900/10 rounded-xl border border-[var(--accent)]/20 overflow-hidden shadow-[var(--card-shadow-md)]">
      <header className="px-4 py-3 border-b border-[var(--accent)]/20 bg-[var(--card)]/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gradient">AI Season Narrative</span>
          <span className="text-xs bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-0.5 rounded-full font-medium">
            {entry.short_name}
          </span>
        </div>
      </header>
      <div className="px-4 py-4">
        {loading && (
          <div className="flex items-start gap-3">
            <div className="skeleton w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-11/12" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          </div>
        )}
        {error && !loading && (
          <div className="text-sm text-[var(--danger)]">
            {error}{' '}
            <button
              onClick={fetchSummary}
              className="text-[var(--accent)] hover:underline focus:outline-none focus:underline ml-2"
            >
              Try again
            </button>
          </div>
        )}
        {!loading && !error && summary && (
          <div className="flex items-start gap-3">
            <AIIcon isLoading={streaming} />
            <div
              className={`flex-1 text-sm leading-relaxed whitespace-pre-wrap ${
                !streaming ? 'animate-fade-in' : ''
              }`}
            >
              {summary}
              {streaming && (
                <span className="inline-block w-1.5 h-4 bg-[var(--accent)] rounded-sm animate-pulse align-text-bottom ml-0.5" />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export function ManagerProfile({
  entry,
  standing,
  form,
  trajectory,
  leagueAvgTrajectory,
  extremes,
  benchPoints,
  rivalries,
  draftRecap,
  transactions,
}: ManagerProfileProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to league
        </Link>
      </div>

      <ProfileHeader entry={entry} standing={standing} form={form} />

      <AISeasonNarrative
        entry={entry}
        standing={standing}
        extremes={extremes}
        benchPoints={benchPoints}
        form={form}
        rivalries={rivalries}
        draftRecap={draftRecap}
      />

      <SeasonChart trajectory={trajectory} leagueAvg={leagueAvgTrajectory} />

      <StatCards extremes={extremes} benchPoints={benchPoints} />

      <Rivalries rivalries={rivalries} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DraftRecap recap={draftRecap} />
        <TransactionsHistory transactions={transactions} />
      </div>
    </div>
  )
}
