import { ManagerWithSquad } from '@/lib/types'
import { FormResult } from '@/lib/api'

interface StandingsProps {
  managers: ManagerWithSquad[]
  form: Record<number, FormResult[]>
}

function FormIndicator({ results }: { results: FormResult[] }) {
  const emoji = (r: FormResult) => {
    switch (r) {
      case 'W': return '🟢'
      case 'D': return '🟡'
      case 'L': return '🔴'
    }
  }

  return (
    <span className="text-xs tracking-wider">
      {results.map((r, i) => (
        <span key={i}>{emoji(r)}</span>
      ))}
    </span>
  )
}

export function Standings({ managers, form }: StandingsProps) {
  const sorted = [...managers].sort((a, b) => a.standing.rank - b.standing.rank)

  return (
    <section className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] overflow-hidden">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] px-4 py-3 border-b border-[var(--card-border)]">
        Standings
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--muted)] text-xs uppercase">
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">Team</th>
              <th className="text-center px-2 py-2">Form</th>
              <th className="text-center px-2 py-2">W</th>
              <th className="text-center px-2 py-2">D</th>
              <th className="text-center px-2 py-2">L</th>
              <th className="text-right px-2 py-2">PF</th>
              <th className="text-right px-2 py-2">PA</th>
              <th className="text-right px-4 py-2">Pts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
              <tr
                key={m.entry.id}
                className={`border-t border-[var(--card-border)] ${
                  i === 0 ? 'bg-[var(--accent)]/10' : ''
                }`}
              >
                <td className="px-4 py-3 font-medium">{m.standing.rank}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{m.entry.entry_name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {m.entry.player_first_name} {m.entry.player_last_name}
                  </div>
                </td>
                <td className="text-center px-2 py-3">
                  <FormIndicator results={form[m.entry.id] || []} />
                </td>
                <td className="text-center px-2 py-3 text-[var(--success)]">
                  {m.standing.matches_won}
                </td>
                <td className="text-center px-2 py-3 text-[var(--muted)]">
                  {m.standing.matches_drawn}
                </td>
                <td className="text-center px-2 py-3 text-[var(--danger)]">
                  {m.standing.matches_lost}
                </td>
                <td className="text-right px-2 py-3">{m.standing.points_for}</td>
                <td className="text-right px-2 py-3 text-[var(--muted)]">
                  {m.standing.points_against}
                </td>
                <td className="text-right px-4 py-3 font-bold">{m.standing.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
