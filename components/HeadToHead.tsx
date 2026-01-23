import { LeagueEntry } from '@/lib/types'
import { H2HRecord } from '@/lib/api'

interface HeadToHeadProps {
  entries: LeagueEntry[]
  h2h: Record<number, Record<number, H2HRecord>>
}

// Record cell with improved visualization
function RecordCell({ record, isHighlighted }: { record: H2HRecord; isHighlighted?: boolean }) {
  const total = record.wins + record.draws + record.losses
  if (total === 0) {
    return (
      <span className="text-[var(--muted)] text-xs">-</span>
    )
  }

  // Determine dominant result based on wins vs losses
  const isDominant = record.wins > record.losses
  const isLosing = record.losses > record.wins
  const bgClass = isDominant
    ? 'bg-[var(--success-muted)]'
    : isLosing
    ? 'bg-[var(--danger-muted)]'
    : ''

  return (
    <div
      className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded transition-colors ${bgClass} ${
        isHighlighted ? 'ring-2 ring-[var(--accent)]' : ''
      }`}
    >
      {/* W-D-L display */}
      <div className="flex items-center gap-0.5 text-[11px] font-medium">
        <span className="text-[var(--success)]">{record.wins}</span>
        <span className="text-[var(--muted)]">-</span>
        <span className="text-[var(--muted)]">{record.draws}</span>
        <span className="text-[var(--muted)]">-</span>
        <span className="text-[var(--danger)]">{record.losses}</span>
      </div>

      {/* Mini bar visualization */}
      <div className="flex w-full h-1 rounded-full overflow-hidden bg-[var(--card-border)]">
        {record.wins > 0 && (
          <div
            className="h-full bg-[var(--success)]"
            style={{ width: `${(record.wins / total) * 100}%` }}
          />
        )}
        {record.draws > 0 && (
          <div
            className="h-full bg-[var(--muted)]"
            style={{ width: `${(record.draws / total) * 100}%` }}
          />
        )}
        {record.losses > 0 && (
          <div
            className="h-full bg-[var(--danger)]"
            style={{ width: `${(record.losses / total) * 100}%` }}
          />
        )}
      </div>
    </div>
  )
}

// Mobile-friendly H2H card view
function MobileH2HView({
  entries,
  h2h,
}: {
  entries: LeagueEntry[]
  h2h: Record<number, Record<number, H2HRecord>>
}) {
  return (
    <div className="divide-y divide-[var(--card-border)]">
      {entries.map((rowEntry) => {
        const opponents = entries.filter((e) => e.id !== rowEntry.id)
        const hasAnyMatches = opponents.some((colEntry) => {
          const record = h2h[rowEntry.id]?.[colEntry.id]
          return record && record.wins + record.draws + record.losses > 0
        })

        if (!hasAnyMatches) return null

        return (
          <div key={rowEntry.id} className="p-3">
            {/* Team header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold">{rowEntry.short_name}</span>
              <span className="text-xs text-[var(--muted)]">{rowEntry.entry_name}</span>
            </div>

            {/* Records grid */}
            <div className="grid grid-cols-2 gap-2">
              {opponents.map((colEntry) => {
                const record = h2h[rowEntry.id]?.[colEntry.id] || {
                  wins: 0,
                  draws: 0,
                  losses: 0,
                  pointsFor: 0,
                  pointsAgainst: 0,
                }
                const total = record.wins + record.draws + record.losses

                if (total === 0) return null

                const isDominant = record.wins > record.losses
                const isLosing = record.losses > record.wins
                const bgClass = isDominant
                  ? 'bg-[var(--success-muted)]'
                  : isLosing
                  ? 'bg-[var(--danger-muted)]'
                  : 'bg-[var(--background)]'

                return (
                  <div
                    key={colEntry.id}
                    className={`flex items-center justify-between p-2 rounded-lg ${bgClass}`}
                  >
                    <span className="text-xs font-medium text-[var(--muted)]">
                      vs {colEntry.short_name}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-medium">
                      <span className="text-[var(--success)]">{record.wins}</span>
                      <span className="text-[var(--muted)]">-</span>
                      <span className="text-[var(--muted)]">{record.draws}</span>
                      <span className="text-[var(--muted)]">-</span>
                      <span className="text-[var(--danger)]">{record.losses}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function HeadToHead({ entries, h2h }: HeadToHeadProps) {
  // Sort entries by id for consistent ordering
  const sortedEntries = [...entries].sort((a, b) => a.id - b.id)

  // Check if there are any matches played
  const hasAnyMatches = sortedEntries.some((rowEntry) =>
    sortedEntries.some((colEntry) => {
      if (rowEntry.id === colEntry.id) return false
      const record = h2h[rowEntry.id]?.[colEntry.id]
      return record && record.wins + record.draws + record.losses > 0
    })
  )

  return (
    <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)]">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Head to Head
        </h2>
        <span className="text-xs text-[var(--muted)]">
          {sortedEntries.length} teams
        </span>
      </header>

      {!hasAnyMatches ? (
        <div className="p-8 text-center">
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
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold mb-1">No head-to-head data yet</h3>
          <p className="text-[var(--muted)] text-sm">Records will appear after matches are played</p>
        </div>
      ) : (
        <>
          {/* Mobile view */}
          <div className="sm:hidden">
            <MobileH2HView entries={sortedEntries} h2h={h2h} />
          </div>

          {/* Desktop matrix view */}
          <div className="hidden sm:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--muted)] text-xs">
                  <th className="text-left px-3 py-3 sticky left-0 bg-[var(--card)] z-10 font-medium border-r border-[var(--card-border)]">
                    vs
                  </th>
                  {sortedEntries.map((entry) => (
                    <th
                      key={entry.id}
                      className="text-center px-2 py-3 min-w-[70px] font-medium"
                    >
                      <div
                        className="font-semibold truncate max-w-[80px] mx-auto"
                        title={entry.entry_name}
                      >
                        {entry.short_name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((rowEntry) => (
                  <tr key={rowEntry.id} className="border-t border-[var(--card-border)]">
                    <td className="px-3 py-2 sticky left-0 bg-[var(--card)] z-10 border-r border-[var(--card-border)]">
                      <div
                        className="font-semibold text-xs truncate max-w-[80px]"
                        title={rowEntry.entry_name}
                      >
                        {rowEntry.short_name}
                      </div>
                    </td>
                    {sortedEntries.map((colEntry) => (
                      <td key={colEntry.id} className="text-center px-2 py-2">
                        {rowEntry.id === colEntry.id ? (
                          <span className="inline-block w-full h-full bg-[var(--card-border)]/50 rounded py-2">
                            <span className="text-[var(--muted)] text-xs">-</span>
                          </span>
                        ) : (
                          <RecordCell
                            record={
                              h2h[rowEntry.id]?.[colEntry.id] || {
                                wins: 0,
                                draws: 0,
                                losses: 0,
                                pointsFor: 0,
                                pointsAgainst: 0,
                              }
                            }
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <footer className="px-4 py-3 border-t border-[var(--card-border)] bg-[var(--card-elevated)]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--muted)]">
              <span>
                Record shown as{' '}
                <span className="text-[var(--success)] font-medium">W</span>-D-
                <span className="text-[var(--danger)] font-medium">L</span>{' '}
                (row vs column)
              </span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-[var(--success-muted)]" />
                  Winning record
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-[var(--danger-muted)]" />
                  Losing record
                </span>
              </div>
            </div>
          </footer>
        </>
      )}
    </section>
  )
}
