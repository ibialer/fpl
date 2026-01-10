'use client'

import { DeadlineInfo } from '@/lib/types'

interface HeaderProps {
  leagueName: string
  currentEvent: number
  deadlineInfo: DeadlineInfo
}

function formatDeadline(isoDate: string | null): string {
  if (!isoDate) return 'TBD'
  const date = new Date(isoDate)
  const now = new Date()

  // Check if deadline has passed
  if (date < now) return 'Passed'

  // Format the date
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return date.toLocaleDateString('en-GB', options)
}

export function Header({ leagueName, currentEvent, deadlineInfo }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-[var(--background)] border-b border-[var(--card-border)] px-4 py-3">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{leagueName}</h1>
          <p className="text-sm text-[var(--muted)]">Gameweek {currentEvent}</p>
        </div>
        <div className="flex flex-col sm:items-end gap-1 text-xs">
          <div className="text-[var(--muted)] font-medium">GW {deadlineInfo.nextEvent} Deadlines</div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--muted)]">Waivers:</span>
            <span className="font-medium">{formatDeadline(deadlineInfo.waiverDeadline)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--muted)]">Lineups:</span>
            <span className="font-medium">{formatDeadline(deadlineInfo.lineupDeadline)}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
