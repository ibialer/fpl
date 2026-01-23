'use client'

import { useState, useEffect } from 'react'
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

function getCountdown(isoDate: string | null): string | null {
  if (!isoDate) return null
  const date = new Date(isoDate)
  const now = new Date()
  const diff = date.getTime() - now.getTime()

  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else {
    return `${minutes}m ${seconds}s`
  }
}

function CountdownTimer({ deadline, label }: { deadline: string | null; label: string }) {
  const [countdown, setCountdown] = useState<string | null>(null)

  useEffect(() => {
    if (!deadline) return

    const updateCountdown = () => {
      setCountdown(getCountdown(deadline))
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [deadline])

  if (!countdown) return null

  const isUrgent = countdown.includes('m') && !countdown.includes('h') && !countdown.includes('d')

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
      isUrgent
        ? 'bg-[var(--danger)]/20 border border-[var(--danger)]/30'
        : 'bg-[var(--card)] border border-[var(--card-border)]'
    }`}>
      <span className="text-[var(--muted)] text-xs">{label}:</span>
      <span className={`font-mono text-sm font-medium ${isUrgent ? 'text-[var(--danger)]' : 'text-[var(--foreground)]'}`}>
        {countdown}
      </span>
    </div>
  )
}

export function Header({ leagueName, currentEvent, deadlineInfo }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--card-border)] px-4 py-3">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{leagueName}</h1>
          <p className="text-sm text-[var(--muted)]">Gameweek {currentEvent}</p>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          <div className="text-[var(--muted)] text-xs font-medium uppercase tracking-wide">
            GW {deadlineInfo.nextEvent} Deadlines
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CountdownTimer deadline={deadlineInfo.waiverDeadline} label="Waivers" />
            <CountdownTimer deadline={deadlineInfo.lineupDeadline} label="Lineups" />
          </div>
          <div className="flex items-center gap-4 text-[10px] text-[var(--muted)]">
            <span>Waivers: {formatDeadline(deadlineInfo.waiverDeadline)}</span>
            <span>Lineups: {formatDeadline(deadlineInfo.lineupDeadline)}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
