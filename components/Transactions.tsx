import { TransactionWithDetails } from '@/lib/types'

interface TransactionsProps {
  transactions: TransactionWithDetails[]
  currentEvent: number
}

// Transaction type badge
function TransactionTypeBadge({ type }: { type: 'waiver' | 'free' }) {
  const isWaiver = type === 'waiver'

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
        isWaiver
          ? 'bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]/20'
          : 'bg-[var(--card-border)] text-[var(--muted)]'
      }`}
    >
      {isWaiver ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      )}
      {isWaiver ? 'Waiver' : 'Free'}
    </span>
  )
}

// Player transfer visualization
function PlayerTransfer({
  playerIn,
  playerInTeam,
  playerOut,
  playerOutTeam,
}: {
  playerIn: string
  playerInTeam?: string
  playerOut: string
  playerOutTeam?: string
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {/* Player Out */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[var(--danger)] truncate">{playerOut}</div>
        {playerOutTeam && <div className="text-[10px] text-[var(--muted)]">{playerOutTeam}</div>}
      </div>

      {/* Arrow */}
      <div className="shrink-0">
        <svg
          className="w-5 h-5 text-[var(--muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>

      {/* Player In */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[var(--success)] truncate">{playerIn}</div>
        {playerInTeam && <div className="text-[10px] text-[var(--muted)]">{playerInTeam}</div>}
      </div>
    </div>
  )
}

// Transaction card
function TransactionCard({ transaction }: { transaction: TransactionWithDetails }) {
  return (
    <div className="p-4 border-b border-[var(--card-border)] last:border-b-0 hover:bg-[var(--card-border)]/20 transition-colors">
      {/* Header with manager and type */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[var(--card-border)] flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-[var(--muted)]">
              {transaction.managerName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-semibold text-sm truncate">{transaction.managerName}</span>
        </div>
        <TransactionTypeBadge type={transaction.type} />
      </div>

      {/* Player transfer */}
      <PlayerTransfer
        playerIn={transaction.playerIn}
        playerInTeam={transaction.playerInTeam}
        playerOut={transaction.playerOut}
        playerOutTeam={transaction.playerOutTeam}
      />
    </div>
  )
}

// Empty state
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
  // Group transactions by type
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
