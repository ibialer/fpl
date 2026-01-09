import { LeagueEntry } from '@/lib/types'
import { H2HRecord } from '@/lib/api'

interface HeadToHeadProps {
  entries: LeagueEntry[]
  h2h: Record<number, Record<number, H2HRecord>>
}

function RecordCell({ record }: { record: H2HRecord }) {
  const total = record.wins + record.draws + record.losses
  if (total === 0) return <span className="text-[var(--muted)]">-</span>

  return (
    <div className="text-xs">
      <span className="text-[var(--success)]">{record.wins}</span>
      <span className="text-[var(--muted)]">-</span>
      <span className="text-[var(--muted)]">{record.draws}</span>
      <span className="text-[var(--muted)]">-</span>
      <span className="text-[var(--danger)]">{record.losses}</span>
    </div>
  )
}

export function HeadToHead({ entries, h2h }: HeadToHeadProps) {
  // Sort entries by id for consistent ordering
  const sortedEntries = [...entries].sort((a, b) => a.id - b.id)

  return (
    <section className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] overflow-hidden">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] px-4 py-3 border-b border-[var(--card-border)]">
        Head to Head
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--muted)] text-xs">
              <th className="text-left px-3 py-2 sticky left-0 bg-[var(--card)]">vs</th>
              {sortedEntries.map((entry) => (
                <th key={entry.id} className="text-center px-2 py-2 min-w-[60px]">
                  <div className="font-medium truncate max-w-[80px]" title={entry.entry_name}>
                    {entry.short_name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map((rowEntry) => (
              <tr key={rowEntry.id} className="border-t border-[var(--card-border)]">
                <td className="px-3 py-2 sticky left-0 bg-[var(--card)]">
                  <div className="font-medium text-xs" title={rowEntry.entry_name}>
                    {rowEntry.short_name}
                  </div>
                </td>
                {sortedEntries.map((colEntry) => (
                  <td key={colEntry.id} className="text-center px-2 py-2">
                    {rowEntry.id === colEntry.id ? (
                      <span className="text-[var(--muted)]">-</span>
                    ) : (
                      <RecordCell record={h2h[rowEntry.id]?.[colEntry.id] || { wins: 0, draws: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 }} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-xs text-[var(--muted)] border-t border-[var(--card-border)]">
        Record shown as <span className="text-[var(--success)]">W</span>-D-<span className="text-[var(--danger)]">L</span> (row vs column)
      </div>
    </section>
  )
}
