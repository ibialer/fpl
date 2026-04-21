import Link from 'next/link'
import { TransactionWithDetails } from '@/lib/types'

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

function PlayerIcon({ type }: { type: 'in' | 'out' }) {
  const bgColor = type === 'in' ? 'bg-[var(--success-muted)]' : 'bg-[var(--danger-muted)]'
  const iconColor = type === 'in' ? 'text-[var(--success)]' : 'text-[var(--danger)]'

  return (
    <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center shrink-0`}>
      {type === 'in' ? (
        <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ) : (
        <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      )}
    </div>
  )
}

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
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <PlayerIcon type="out" />
          <div className="min-w-0">
            <div className="font-medium text-[var(--danger)] truncate">{playerOut}</div>
            {playerOutTeam && <div className="text-[10px] text-[var(--muted)]">{playerOutTeam}</div>}
          </div>
        </div>
      </div>

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

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <PlayerIcon type="in" />
          <div className="min-w-0">
            <div className="font-medium text-[var(--success)] truncate">{playerIn}</div>
            {playerInTeam && <div className="text-[10px] text-[var(--muted)]">{playerInTeam}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

interface TransactionCardProps {
  transaction: TransactionWithDetails
  showGW?: boolean
  linkManager?: boolean
}

export function TransactionCard({ transaction, showGW, linkManager = true }: TransactionCardProps) {
  const nameEl = (
    <span className="font-semibold text-sm truncate">{transaction.managerName}</span>
  )

  return (
    <div className="p-4 border-b border-[var(--card-border)] last:border-b-0 hover:bg-[var(--card-border)]/20 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[var(--card-border)] flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-[var(--muted)]">
              {transaction.managerName.charAt(0).toUpperCase()}
            </span>
          </div>
          {linkManager ? (
            <Link
              href={`/team/${transaction.entryId}`}
              className="min-w-0 hover:text-[var(--accent)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
            >
              {nameEl}
            </Link>
          ) : (
            nameEl
          )}
          {showGW && (
            <span className="text-[10px] uppercase tracking-wide text-[var(--muted)] bg-[var(--card-border)]/40 px-1.5 py-0.5 rounded">
              GW {transaction.event}
            </span>
          )}
        </div>
        <TransactionTypeBadge type={transaction.type} />
      </div>

      <PlayerTransfer
        playerIn={transaction.playerIn}
        playerInTeam={transaction.playerInTeam}
        playerOut={transaction.playerOut}
        playerOutTeam={transaction.playerOutTeam}
      />
    </div>
  )
}
