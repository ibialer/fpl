import { TransactionWithDetails } from '@/lib/types'

interface TransactionsProps {
  transactions: TransactionWithDetails[]
  currentEvent: number
}

export function Transactions({ transactions, currentEvent }: TransactionsProps) {
  if (transactions.length === 0) {
    return (
      <section className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">
          GW {currentEvent} Transactions
        </h2>
        <p className="text-[var(--muted)] text-sm">No transactions this gameweek</p>
      </section>
    )
  }

  return (
    <section className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] overflow-hidden">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] px-4 py-3 border-b border-[var(--card-border)]">
        GW {currentEvent} Transactions
      </h2>
      <div className="divide-y divide-[var(--card-border)]">
        {transactions.map((t) => (
          <div key={t.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="font-medium text-sm">{t.managerName}</div>
                <div className="text-sm mt-1">
                  <span className="text-[var(--success)]">+ {t.playerIn}</span>
                  {t.playerInTeam && <span className="text-[var(--muted)]"> ({t.playerInTeam})</span>}
                  <span className="text-[var(--muted)]"> / </span>
                  <span className="text-[var(--danger)]">- {t.playerOut}</span>
                  {t.playerOutTeam && <span className="text-[var(--muted)]"> ({t.playerOutTeam})</span>}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-xs px-2 py-0.5 rounded ${
                    t.type === 'waiver'
                      ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                      : 'bg-[var(--muted)]/20 text-[var(--muted)]'
                  }`}
                >
                  {t.type === 'waiver' ? 'Waiver' : 'Free'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
