import { ManagerWithSquad } from '@/lib/types'
import { FormResult } from '@/lib/api'

interface StandingsProps {
  managers: ManagerWithSquad[]
  form: Record<number, FormResult[]>
}

// Form indicator with improved visual design
function FormIndicator({ results }: { results: FormResult[] }) {
  if (results.length === 0) {
    return <span className="text-xs text-[var(--muted)]">-</span>
  }

  return (
    <div className="flex items-center gap-1" role="list" aria-label="Recent form">
      {results.map((r, i) => {
        const dotClass = {
          W: 'form-dot form-dot-win',
          D: 'form-dot form-dot-draw',
          L: 'form-dot form-dot-loss',
        }[r]

        const label = {
          W: 'Win',
          D: 'Draw',
          L: 'Loss',
        }[r]

        return (
          <span
            key={i}
            className={dotClass}
            role="listitem"
            aria-label={label}
            title={label}
          />
        )
      })}
    </div>
  )
}

// Rank badge with medal styling for top 3
function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const medalColors = {
      1: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      2: 'bg-slate-400/20 text-slate-300 border-slate-400/30',
      3: 'bg-amber-700/20 text-amber-600 border-amber-700/30',
    }[rank]

    return (
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border ${medalColors}`}
      >
        {rank}
      </span>
    )
  }

  return <span className="text-sm font-medium text-[var(--muted)] w-6 text-center">{rank}</span>
}

// Mobile card view for standings
function MobileStandingCard({
  manager,
  rank,
  form,
  isLeader,
}: {
  manager: ManagerWithSquad
  rank: number
  form: FormResult[]
  isLeader: boolean
}) {
  return (
    <div
      className={`p-3 border-b border-[var(--card-border)] last:border-b-0 ${
        isLeader ? 'bg-[var(--accent-muted)]' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <RankBadge rank={rank} />

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{manager.entry.entry_name}</div>
          <div className="text-xs text-[var(--muted)] truncate">
            {manager.entry.player_first_name} {manager.entry.player_last_name}
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold">{manager.standing.total}</div>
          <div className="text-[10px] text-[var(--muted)] uppercase">pts</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--card-border)]">
        <FormIndicator results={form} />

        <div className="flex items-center gap-3 text-xs">
          <span className="text-[var(--success)]">{manager.standing.matches_won}W</span>
          <span className="text-[var(--muted)]">{manager.standing.matches_drawn}D</span>
          <span className="text-[var(--danger)]">{manager.standing.matches_lost}L</span>
        </div>

        <div className="text-xs text-[var(--muted)]">
          {manager.standing.points_for} - {manager.standing.points_against}
        </div>
      </div>
    </div>
  )
}

export function Standings({ managers, form }: StandingsProps) {
  const sorted = [...managers].sort((a, b) => a.standing.rank - b.standing.rank)

  return (
    <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]">
      <header className="px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)]">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Standings
        </h2>
      </header>

      {/* Mobile view */}
      <div className="sm:hidden">
        {sorted.map((m, i) => (
          <MobileStandingCard
            key={m.entry.id}
            manager={m}
            rank={m.standing.rank}
            form={form[m.entry.id] || []}
            isLeader={i === 0}
          />
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--muted)] text-xs uppercase border-b border-[var(--card-border)]">
              <th className="text-left px-4 py-3 font-medium">#</th>
              <th className="text-left px-4 py-3 font-medium">Team</th>
              <th className="text-center px-3 py-3 font-medium">Form</th>
              <th className="text-center px-2 py-3 font-medium">W</th>
              <th className="text-center px-2 py-3 font-medium">D</th>
              <th className="text-center px-2 py-3 font-medium">L</th>
              <th className="text-right px-2 py-3 font-medium">PF</th>
              <th className="text-right px-2 py-3 font-medium">PA</th>
              <th className="text-right px-4 py-3 font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
              <tr
                key={m.entry.id}
                className={`border-b border-[var(--card-border)] last:border-b-0 row-hover ${
                  i === 0 ? 'bg-[var(--accent-muted)]' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <RankBadge rank={m.standing.rank} />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{m.entry.entry_name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {m.entry.player_first_name} {m.entry.player_last_name}
                  </div>
                </td>
                <td className="text-center px-3 py-3">
                  <FormIndicator results={form[m.entry.id] || []} />
                </td>
                <td className="text-center px-2 py-3 text-[var(--success)] font-medium">
                  {m.standing.matches_won}
                </td>
                <td className="text-center px-2 py-3 text-[var(--muted)]">
                  {m.standing.matches_drawn}
                </td>
                <td className="text-center px-2 py-3 text-[var(--danger)] font-medium">
                  {m.standing.matches_lost}
                </td>
                <td className="text-right px-2 py-3 tabular-nums">{m.standing.points_for}</td>
                <td className="text-right px-2 py-3 text-[var(--muted)] tabular-nums">
                  {m.standing.points_against}
                </td>
                <td className="text-right px-4 py-3 font-bold text-lg tabular-nums">
                  {m.standing.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <footer className="px-4 py-2 border-t border-[var(--card-border)] bg-[var(--card-elevated)]">
        <div className="flex items-center gap-4 text-[10px] text-[var(--muted)]">
          <span>PF = Points For</span>
          <span>PA = Points Against</span>
          <span>Pts = League Points</span>
        </div>
      </footer>
    </section>
  )
}
