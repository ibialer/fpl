import { TransactionWithDetails } from '@/lib/types'
import { TransactionCard } from './TransactionCard'

interface TransactionsProps {
  transactions: TransactionWithDetails[]
  currentEvent: number
}

function EmptyState({ currentEvent }: { currentEvent: number }) {
  return (
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
            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold mb-1">No transactions</h3>
      <p className="text-[var(--muted)] text-sm">
        No waivers or free agent moves in Gameweek {currentEvent}
      </p>
    </div>
  )
}

export function Transactions({ transactions, currentEvent }: TransactionsProps) {
  const waivers = transactions.filter((t) => t.type === 'waiver')
  const freeAgents = transactions.filter((t) => t.type === 'free')

  return (
    <section className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)]">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          GW {currentEvent} Transactions
        </h2>
        {transactions.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            {waivers.length > 0 && (
              <span className="px-2 py-0.5 bg-[var(--accent-muted)] text-[var(--accent)] rounded-full">
                {waivers.length} waiver{waivers.length !== 1 ? 's' : ''}
              </span>
            )}
            {freeAgents.length > 0 && (
              <span className="px-2 py-0.5 bg-[var(--card-border)] rounded-full">
                {freeAgents.length} free
              </span>
            )}
          </div>
        )}
      </header>

      {transactions.length === 0 ? (
        <EmptyState currentEvent={currentEvent} />
      ) : (
        <div className="divide-y divide-[var(--card-border)]">
          {transactions.map((t) => (
            <TransactionCard key={t.id} transaction={t} />
          ))}
        </div>
      )}
    </section>
  )
}
