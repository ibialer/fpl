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

// Rank badge with summer championship styling
function SummerRankBadge({ rank }: { rank: number }) {
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

// Mobile card view for summer standings
function MobileSummerCard({
  standing,
  rank,
  isLeader,
}: {
  standing: SummerStanding
  rank: number
  isLeader: boolean
}) {
  const pointsDiff = standing.pointsFor - standing.pointsAgainst

  return (
    <div
      className={`p-3 border-b border-[var(--card-border)] last:border-b-0 ${
        isLeader ? 'bg-[var(--warning-muted)]' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <SummerRankBadge rank={rank} />

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{standing.entry.entry_name}</div>
          <div className="text-xs text-[var(--muted)] truncate">
            {standing.entry.player_first_name} {standing.entry.player_last_name}
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-[var(--warning)]">{standing.total}</div>
          <div className="text-[10px] text-[var(--muted)] uppercase">pts</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--card-border)]">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[var(--success)]">{standing.wins}W</span>
          <span className="text-[var(--muted)]">{standing.draws}D</span>
          <span className="text-[var(--danger)]">{standing.losses}L</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--muted)]">
            {standing.pointsFor} - {standing.pointsAgainst}
          </span>
          <span
            className={`font-medium ${
              pointsDiff > 0
                ? 'text-[var(--success)]'
                : pointsDiff < 0
                ? 'text-[var(--danger)]'
                : 'text-[var(--muted)]'
            }`}
          >
            ({pointsDiff > 0 ? '+' : ''}
            {pointsDiff})
          </span>
        </div>
      </div>
    </div>
  )
}

// Empty state for when championship hasn't started
function EmptyState() {
  return (
    <div className="p-8 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--warning-muted)] flex items-center justify-center">
        <svg
          className="w-6 h-6 text-[var(--warning)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold mb-1 text-[var(--warning)]">Summer Championship</h3>
      <p className="text-[var(--muted)] text-sm">Starts from Gameweek 20</p>
    </div>
  )
}

export function SummerStandings({ standings }: SummerStandingsProps) {
  const sorted = [...standings].sort((a, b) => {
    // Sort by total points first, then by points difference
    if (b.total !== a.total) return b.total - a.total
    return b.pointsFor - b.pointsAgainst - (a.pointsFor - a.pointsAgainst)
  })

  // Check if championship has started (any matches played)
  const hasStarted = sorted.some((s) => s.wins + s.draws + s.losses > 0)

  return (
    <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]">
      <header className="px-4 py-3 border-b border-[var(--card-border)] bg-gradient-to-r from-[var(--warning-muted)] to-[var(--card-elevated)]">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-[var(--warning)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
            />
          </svg>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--warning)]">
            Summer Championship
          </h2>
          <span className="text-xs bg-[var(--warning-muted)] text-[var(--warning)] px-2 py-0.5 rounded-full">
            GW 20+
          </span>
        </div>
      </header>

      {!hasStarted ? (
        <EmptyState />
      ) : (
        <>
          {/* Mobile view */}
          <div className="sm:hidden">
            {sorted.map((s, i) => (
              <MobileSummerCard key={s.entry.id} standing={s} rank={i + 1} isLeader={i === 0} />
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--muted)] text-xs uppercase border-b border-[var(--card-border)]">
                  <th className="text-left px-4 py-3 font-medium">#</th>
                  <th className="text-left px-4 py-3 font-medium">Team</th>
                  <th className="text-center px-2 py-3 font-medium">W</th>
                  <th className="text-center px-2 py-3 font-medium">D</th>
                  <th className="text-center px-2 py-3 font-medium">L</th>
                  <th className="text-right px-2 py-3 font-medium">PF</th>
                  <th className="text-right px-2 py-3 font-medium">PA</th>
                  <th className="text-right px-2 py-3 font-medium">+/-</th>
                  <th className="text-right px-4 py-3 font-medium">Pts</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => {
                  const pointsDiff = s.pointsFor - s.pointsAgainst

                  return (
                    <tr
                      key={s.entry.id}
                      className={`border-b border-[var(--card-border)] last:border-b-0 row-hover ${
                        i === 0 ? 'bg-[var(--warning-muted)]' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <SummerRankBadge rank={i + 1} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{s.entry.entry_name}</div>
                        <div className="text-xs text-[var(--muted)]">
                          {s.entry.player_first_name} {s.entry.player_last_name}
                        </div>
                      </td>
                      <td className="text-center px-2 py-3 text-[var(--success)] font-medium">
                        {s.wins}
                      </td>
                      <td className="text-center px-2 py-3 text-[var(--muted)]">{s.draws}</td>
                      <td className="text-center px-2 py-3 text-[var(--danger)] font-medium">
                        {s.losses}
                      </td>
                      <td className="text-right px-2 py-3 tabular-nums">{s.pointsFor}</td>
                      <td className="text-right px-2 py-3 text-[var(--muted)] tabular-nums">
                        {s.pointsAgainst}
                      </td>
                      <td
                        className={`text-right px-2 py-3 tabular-nums font-medium ${
                          pointsDiff > 0
                            ? 'text-[var(--success)]'
                            : pointsDiff < 0
                            ? 'text-[var(--danger)]'
                            : 'text-[var(--muted)]'
                        }`}
                      >
                        {pointsDiff > 0 ? '+' : ''}
                        {pointsDiff}
                      </td>
                      <td className="text-right px-4 py-3 font-bold text-lg text-[var(--warning)] tabular-nums">
                        {s.total}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <footer className="px-4 py-2 border-t border-[var(--card-border)] bg-[var(--card-elevated)]">
            <div className="flex items-center gap-4 text-[10px] text-[var(--muted)]">
              <span>PF = Points For</span>
              <span>PA = Points Against</span>
              <span>+/- = Points Difference</span>
            </div>
          </footer>
        </>
      )}
    </section>
  )
}
