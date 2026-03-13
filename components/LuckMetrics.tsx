import { LuckMetricsData } from '@/lib/api'

interface LuckMetricsProps {
  luckMetrics: LuckMetricsData[]
}

function rowHighlightClass(index: number, total: number): string {
  if (index === 0) return 'bg-[var(--success-muted)]'
  if (index === total - 1) return 'bg-[var(--danger-muted)]'
  return ''
}

function LuckIndexBadge({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-xs text-[var(--muted)]">0</span>
  }

  const isPositive = value > 0
  return (
    <span
      className={`text-xs font-bold ${
        isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
      }`}
    >
      {isPositive ? '+' : ''}{value}
    </span>
  )
}

// Mobile card view
function MobileLuckCard({ data }: { data: LuckMetricsData }) {
  return (
    <div className="p-3 border-b border-[var(--card-border)] last:border-b-0">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-medium text-sm">{data.teamName}</div>
          <div className="text-xs text-[var(--muted)]">{data.managerName}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-[var(--muted)] uppercase">Luck</div>
          <LuckIndexBadge value={data.luckIndex} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Narrow Wins</span>
          <span className="font-medium">{data.narrowWins}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Opp Avg Pts</span>
          <span className="font-medium">{data.opponentAvgPoints}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Lucky Wins</span>
          <span className="font-medium text-[var(--success)]">{data.luckyWins}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Unlucky Losses</span>
          <span className="font-medium text-[var(--danger)]">{data.unluckyLosses}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Expected W</span>
          <span className="font-medium">{data.expectedWins}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Actual W</span>
          <span className="font-medium">{data.actualWins}</span>
        </div>
      </div>
    </div>
  )
}

export function LuckMetrics({ luckMetrics }: LuckMetricsProps) {
  if (luckMetrics.length === 0) {
    return (
      <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]">
        <header className="px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Luck Index
          </h2>
        </header>
        <div className="p-8 text-center">
          <h3 className="text-sm font-semibold mb-1">No data yet</h3>
          <p className="text-[var(--muted)] text-sm">Luck metrics will appear after matches are played</p>
        </div>
      </section>
    )
  }

  // Sort by luck index descending (luckiest first)
  const sorted = [...luckMetrics].sort((a, b) => b.luckIndex - a.luckIndex)

  return (
    <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]">
      <header className="px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)]">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Luck Index
        </h2>
      </header>

      {/* Mobile view */}
      <div className="sm:hidden">
        {sorted.map((data) => (
          <MobileLuckCard key={data.entryId} data={data} />
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--muted)] text-xs uppercase border-b border-[var(--card-border)]">
              <th className="text-left px-4 py-3 font-medium">Team</th>
              <th className="text-center px-3 py-3 font-medium" title="Wins by 5 points or less">Narrow W</th>
              <th className="text-center px-3 py-3 font-medium" title="Average points scored by opponents">Opp Avg</th>
              <th className="text-center px-3 py-3 font-medium" title="Won while placing 4th-5th in GW points">Lucky W</th>
              <th className="text-center px-3 py-3 font-medium" title="Lost while placing top 3 in GW points">Unlucky L</th>
              <th className="text-center px-3 py-3 font-medium" title="Expected wins based on points vs all opponents">Exp W</th>
              <th className="text-center px-3 py-3 font-medium">Actual W</th>
              <th className="text-center px-3 py-3 font-medium" title="Composite luck score based on all metrics">Luck</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((data, i) => (
              <tr
                key={data.entryId}
                className={`border-b border-[var(--card-border)] last:border-b-0 row-hover ${rowHighlightClass(i, sorted.length)}`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{data.teamName}</div>
                  <div className="text-xs text-[var(--muted)]">{data.managerName}</div>
                </td>
                <td className="text-center px-3 py-3 tabular-nums">{data.narrowWins}</td>
                <td className="text-center px-3 py-3 tabular-nums">{data.opponentAvgPoints}</td>
                <td className="text-center px-3 py-3 tabular-nums text-[var(--success)] font-medium">
                  {data.luckyWins}
                </td>
                <td className="text-center px-3 py-3 tabular-nums text-[var(--danger)] font-medium">
                  {data.unluckyLosses}
                </td>
                <td className="text-center px-3 py-3 tabular-nums">{data.expectedWins}</td>
                <td className="text-center px-3 py-3 tabular-nums">{data.actualWins}</td>
                <td className="text-center px-3 py-3">
                  <LuckIndexBadge value={data.luckIndex} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <footer className="px-4 py-2 border-t border-[var(--card-border)] bg-[var(--card-elevated)]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[var(--muted)]">
          <span>Narrow W = Won by 5 pts or less</span>
          <span>Lucky W = Won while 4th-5th in GW</span>
          <span>Unlucky L = Lost while top 3 in GW</span>
          <span>Luck = Composite score (+ lucky, - unlucky)</span>
        </div>
      </footer>
    </section>
  )
}
