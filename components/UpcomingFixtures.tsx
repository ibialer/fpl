import { FixtureWithNames } from '@/lib/types'

interface UpcomingFixturesProps {
  matches: FixtureWithNames[]
  currentEvent: number
}

export function UpcomingFixtures({ matches, currentEvent }: UpcomingFixturesProps) {
  // Get all unfinished matches (future fixtures), grouped by gameweek
  const upcomingMatches = matches
    .filter((m) => !m.finished && !m.started)
    .sort((a, b) => a.event - b.event)

  // Group by gameweek
  const matchesByGW = upcomingMatches.reduce((acc, match) => {
    if (!acc[match.event]) {
      acc[match.event] = []
    }
    acc[match.event].push(match)
    return acc
  }, {} as Record<number, FixtureWithNames[]>)

  const gameweeks = Object.keys(matchesByGW)
    .map(Number)
    .sort((a, b) => a - b)

  if (gameweeks.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] p-4">
        <p className="text-[var(--muted)] text-sm text-center">No upcoming fixtures</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {gameweeks.map((gw) => (
        <section
          key={gw}
          className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] overflow-hidden"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] px-4 py-3 border-b border-[var(--card-border)]">
            Gameweek {gw}
          </h3>
          <div className="divide-y divide-[var(--card-border)]">
            {matchesByGW[gw].map((m, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 text-right">
                    <div className="font-medium text-sm">{m.team1Name}</div>
                    <div className="text-xs text-[var(--muted)]">{m.team1PlayerName}</div>
                  </div>
                  <div className="flex items-center gap-2 px-3">
                    <span className="text-lg font-bold text-[var(--muted)]">vs</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{m.team2Name}</div>
                    <div className="text-xs text-[var(--muted)]">{m.team2PlayerName}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
