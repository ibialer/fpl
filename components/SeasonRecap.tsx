import Link from 'next/link'
import { ManagerWithSquad, Match, LeagueEntry } from '@/lib/types'
import { LuckMetricsData, H2HRecord, SeasonAward, calculateSeasonAwards } from '@/lib/api'
import { TEAM_LINK_CLASS } from '@/lib/styles'
import { RankBadge } from './RankBadge'

interface SummerStandingEntry {
  entry: LeagueEntry
  wins: number
  draws: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  total: number
  rank: number
}

interface SeasonRecapProps {
  managers: ManagerWithSquad[]
  matches: Match[]
  entries: LeagueEntry[]
  luckMetrics: LuckMetricsData[]
  summerStandings: SummerStandingEntry[]
  h2h: Record<number, Record<number, H2HRecord>>
}

// Maps an award's tone to the colour used for its stat + emoji bubble.
const TONE: Record<SeasonAward['tone'], { text: string; bubble: string }> = {
  accent: { text: 'text-[var(--accent)]', bubble: 'bg-[var(--accent-muted)]' },
  success: { text: 'text-[var(--success)]', bubble: 'bg-[var(--success-muted)]' },
  danger: { text: 'text-[var(--danger)]', bubble: 'bg-[var(--danger-muted)]' },
  warning: { text: 'text-[var(--warning)]', bubble: 'bg-[var(--warning-muted)]' },
}

function AwardCard({ award }: { award: SeasonAward }) {
  const tone = TONE[award.tone]
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-4 shadow-[var(--card-shadow)] flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          className={`flex items-center justify-center w-10 h-10 rounded-lg text-xl shrink-0 ${tone.bubble}`}
          aria-hidden
        >
          {award.emoji}
        </span>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide">{award.title}</div>
          <div className="text-[11px] text-[var(--muted)] leading-tight">{award.description}</div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <Link href={`/team/${award.entryId}`} className={`block min-w-0 ${TEAM_LINK_CLASS}`}>
          <div className="font-semibold text-sm truncate">{award.teamName}</div>
          <div className="text-xs text-[var(--muted)] truncate">{award.managerName}</div>
        </Link>
        <div className="text-right shrink-0">
          <div className={`text-xl font-bold tabular-nums ${tone.text}`}>{award.stat}</div>
          <div className="text-[10px] uppercase text-[var(--muted)]">{award.statLabel}</div>
        </div>
      </div>

      {award.detail && (
        <div className="text-[11px] text-[var(--muted)] border-t border-[var(--card-border)] pt-2">
          {award.detail}
        </div>
      )}
    </div>
  )
}

function ChampionBanner({ champion }: { champion: ManagerWithSquad }) {
  const { entry, standing } = champion
  return (
    <section className="relative overflow-hidden rounded-xl border border-[var(--warning)]/40 bg-gradient-to-br from-[var(--warning-muted)] to-[var(--card)] p-5 sm:p-6 shadow-[var(--card-shadow-md)]">
      <div className="flex items-center gap-4">
        <div className="text-4xl sm:text-5xl" aria-hidden>
          🏆
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] sm:text-xs uppercase tracking-widest text-[var(--warning)] font-bold">
            League Champion
          </div>
          <Link href={`/team/${entry.id}`} className={`inline-block ${TEAM_LINK_CLASS}`}>
            <h2 className="text-xl sm:text-2xl font-bold truncate">{entry.entry_name}</h2>
          </Link>
          <div className="text-xs sm:text-sm text-[var(--muted)] truncate">
            {entry.player_first_name} {entry.player_last_name}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl sm:text-3xl font-bold tabular-nums">{standing.total}</div>
          <div className="text-[10px] uppercase text-[var(--muted)]">league pts</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 sm:gap-6 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--success)] font-semibold">{standing.matches_won}W</span>
          <span className="text-[var(--muted)]">{standing.matches_drawn}D</span>
          <span className="text-[var(--danger)] font-semibold">{standing.matches_lost}L</span>
        </div>
        <div className="text-[var(--muted)]">
          <span className="tabular-nums text-[var(--foreground)] font-medium">{standing.points_for}</span> PF
        </div>
        <div className="text-[var(--muted)]">
          <span className="tabular-nums text-[var(--foreground)] font-medium">{standing.points_against}</span> PA
        </div>
      </div>
    </section>
  )
}

function FinalTable({ managers }: { managers: ManagerWithSquad[] }) {
  const sorted = [...managers].sort((a, b) => a.standing.rank - b.standing.rank)
  return (
    <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]">
      <header className="px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)]">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Final Standings</h2>
      </header>
      <div>
        {sorted.map((m, i) => (
          <div
            key={m.entry.id}
            className={`flex items-center gap-3 px-4 py-2.5 border-b border-[var(--card-border)] last:border-b-0 row-hover ${
              i === 0 ? 'bg-[var(--accent-muted)]' : ''
            }`}
          >
            <RankBadge rank={m.standing.rank} />
            <Link href={`/team/${m.entry.id}`} className={`flex-1 min-w-0 ${TEAM_LINK_CLASS}`}>
              <div className="font-medium text-sm truncate">{m.entry.entry_name}</div>
              <div className="text-xs text-[var(--muted)] truncate">
                {m.entry.player_first_name} {m.entry.player_last_name}
              </div>
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-[var(--success)]">{m.standing.matches_won}W</span>
              <span className="text-[var(--muted)]">{m.standing.matches_drawn}D</span>
              <span className="text-[var(--danger)]">{m.standing.matches_lost}L</span>
            </div>
            <div className="hidden sm:block text-xs text-[var(--muted)] tabular-nums w-12 text-right">
              {m.standing.points_for}
            </div>
            <div className="text-right w-10">
              <div className="text-base font-bold tabular-nums">{m.standing.total}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function SeasonRecap({
  managers,
  matches,
  entries,
  luckMetrics,
  summerStandings,
  h2h,
}: SeasonRecapProps) {
  const champion = managers.find((m) => m.standing.rank === 1)
  const awards = calculateSeasonAwards(managers, matches, entries, luckMetrics, summerStandings, h2h)

  return (
    <div className="space-y-6 stagger-children">
      {champion && <ChampionBanner champion={champion} />}

      <FinalTable managers={managers} />

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] mb-3 px-1">
          Season Awards
        </h2>
        {awards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {awards.map((award) => (
              <AwardCard key={award.id} award={award} />
            ))}
          </div>
        ) : (
          <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-8 text-center">
            <p className="text-[var(--muted)] text-sm">Awards will appear once the season is underway</p>
          </div>
        )}
      </section>
    </div>
  )
}
