import { LeagueEntry } from '@/lib/types'

interface SummerStanding {
  entry: LeagueEntry
  wins: number
  draws: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  total: number
  rank: number
}

interface SummerStandingsProps {
  standings: SummerStanding[]
}

export function SummerStandings({ standings }: SummerStandingsProps) {
  const sorted = [...standings].sort((a, b) => {
    // Sort by total points first, then by points difference
    if (b.total !== a.total) return b.total - a.total
    return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)
  })

  // Check if championship has started (any matches played)
  const hasStarted = sorted.some(s => s.wins + s.draws + s.losses > 0)

  if (!hasStarted) {
    return (
      <section className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] overflow-hidden">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] px-4 py-3 border-b border-[var(--card-border)]">
          Summer Championship
        </h2>
        <div className="px-4 py-6 text-center text-[var(--muted)]">
          <p>Starts from Gameweek 20</p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] overflow-hidden">
      <h2 className="text-sm font-semibold uppercase tracking-wide px-4 py-3 border-b border-[var(--card-border)]">
        <span className="text-[var(--warning)]">Summer Championship</span>
        <span className="text-[var(--muted)] text-xs font-normal ml-2">(GW 20+)</span>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--muted)] text-xs uppercase">
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">Team</th>
              <th className="text-center px-2 py-2">W</th>
              <th className="text-center px-2 py-2">D</th>
              <th className="text-center px-2 py-2">L</th>
              <th className="text-right px-2 py-2">PF</th>
              <th className="text-right px-2 py-2">PA</th>
              <th className="text-right px-4 py-2">Pts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr
                key={s.entry.id}
                className={`border-t border-[var(--card-border)] ${
                  i === 0 ? 'bg-[var(--warning)]/10' : ''
                }`}
              >
                <td className="px-4 py-3 font-medium">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{s.entry.entry_name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {s.entry.player_first_name} {s.entry.player_last_name}
                  </div>
                </td>
                <td className="text-center px-2 py-3 text-[var(--success)]">
                  {s.wins}
                </td>
                <td className="text-center px-2 py-3 text-[var(--muted)]">
                  {s.draws}
                </td>
                <td className="text-center px-2 py-3 text-[var(--danger)]">
                  {s.losses}
                </td>
                <td className="text-right px-2 py-3">{s.pointsFor}</td>
                <td className="text-right px-2 py-3 text-[var(--muted)]">
                  {s.pointsAgainst}
                </td>
                <td className="text-right px-4 py-3 font-bold">{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
