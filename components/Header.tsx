'use client'

import { useEffect, useState } from 'react'
import { DeadlineInfo } from '@/lib/types'

interface HeaderProps {
  leagueName: string
  currentEvent: number
  deadlineInfo: DeadlineInfo
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function getTimeRemaining(isoDate: string | null): TimeRemaining | null {
  if (!isoDate) return null
  const date = new Date(isoDate)
  const now = new Date()
  const diff = date.getTime() - now.getTime()

  if (diff <= 0) return null

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    total: diff,
  }
}

function formatDeadlineDate(isoDate: string | null): string {
  if (!isoDate) return 'TBD'
  const date = new Date(isoDate)
  const now = new Date()

  if (date < now) return 'Passed'

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return date.toLocaleDateString('en-GB', options)
}

// Urgency levels for styling
type UrgencyLevel = 'normal' | 'warning' | 'urgent' | 'critical'

function getUrgencyLevel(time: TimeRemaining | null): UrgencyLevel {
  if (!time) return 'normal'

  const hoursRemaining = time.total / (1000 * 60 * 60)

  if (hoursRemaining <= 1) return 'critical'
  if (hoursRemaining <= 6) return 'urgent'
  if (hoursRemaining <= 24) return 'warning'
  return 'normal'
}

function CountdownTimer({
  deadline,
  label,
  icon,
}: {
  deadline: string | null
  label: string
  icon: React.ReactNode
}) {
  const [time, setTime] = useState<TimeRemaining | null>(null)
  const [hasPassed, setHasPassed] = useState(false)

  useEffect(() => {
    if (!deadline) return

    const updateTime = () => {
      const remaining = getTimeRemaining(deadline)
      setTime(remaining)
      setHasPassed(remaining === null && new Date(deadline) < new Date())
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [deadline])

  const urgency = getUrgencyLevel(time)

  const urgencyStyles = {
    normal: 'bg-[var(--card)] border-[var(--card-border)]',
    warning: 'bg-[var(--warning-muted)] border-[var(--warning)]/30',
    urgent: 'bg-[var(--danger-muted)] border-[var(--danger)]/30',
    critical: 'bg-[var(--danger-muted)] border-[var(--danger)]/50 animate-urgent',
    passed: 'bg-[var(--card-border)] border-[var(--card-border)]',
  }

  const textStyles = {
    normal: 'text-[var(--foreground)]',
    warning: 'text-[var(--warning)]',
    urgent: 'text-[var(--danger)]',
    critical: 'text-[var(--danger)]',
    passed: 'text-[var(--muted)]',
  }

  const currentStyle = hasPassed ? 'passed' : urgency

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${urgencyStyles[currentStyle]}`}
      role="timer"
      aria-label={`${label} deadline countdown`}
    >
      {/* Icon */}
      <div className={`text-sm ${textStyles[currentStyle]}`}>{icon}</div>

      {/* Label and countdown */}
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
          {label}
        </span>

        {hasPassed ? (
          <span className="text-base font-bold text-[var(--muted)]">Passed</span>
        ) : time ? (
          <>
            {/* Timer segments */}
            <div className="flex items-baseline gap-1">
              {time.days > 0 && (
                <>
                  <span className={`text-base font-bold tabular-nums ${textStyles[urgency]}`}>
                    {time.days}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] mr-1">d</span>
                </>
              )}
              <span className={`text-base font-bold tabular-nums ${textStyles[urgency]}`}>
                {time.hours.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] text-[var(--muted)]">:</span>
              <span className={`text-base font-bold tabular-nums ${textStyles[urgency]}`}>
                {time.minutes.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] text-[var(--muted)]">:</span>
              <span className={`text-base font-bold tabular-nums ${textStyles[urgency]}`}>
                {time.seconds.toString().padStart(2, '0')}
              </span>
            </div>
            {/* Date below countdown */}
            <span className="text-[10px] text-[var(--muted)]">
              {formatDeadlineDate(deadline)}
            </span>
          </>
        ) : (
          <span className="text-sm text-[var(--muted)]">TBD</span>
        )}
      </div>

      {/* Urgency indicator */}
      {(urgency === 'urgent' || urgency === 'critical') && !hasPassed && (
        <div className="w-2 h-2 rounded-full bg-[var(--danger)] animate-pulse-dot" />
      )}
    </div>
  )
}

// Compact timer for very small screens
function CompactCountdownTimer({
  deadline,
  label,
}: {
  deadline: string | null
  label: string
}) {
  const [time, setTime] = useState<TimeRemaining | null>(null)
  const [hasPassed, setHasPassed] = useState(false)

  useEffect(() => {
    if (!deadline) return

    const updateTime = () => {
      const remaining = getTimeRemaining(deadline)
      setTime(remaining)
      setHasPassed(remaining === null && new Date(deadline) < new Date())
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [deadline])

  const urgency = getUrgencyLevel(time)
  const isUrgent = urgency === 'urgent' || urgency === 'critical'

  const formatCompact = () => {
    if (!time) return ''
    if (time.days > 0) {
      return `${time.days}d ${time.hours}h`
    }
    return `${time.hours.toString().padStart(2, '0')}:${time.minutes
      .toString()
      .padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col">
      <div className={`flex items-center gap-2 ${isUrgent && !hasPassed ? 'text-[var(--danger)]' : ''}`}>
        <span className="text-xs text-[var(--muted)]">{label}:</span>
        {hasPassed ? (
          <span className="text-sm font-semibold text-[var(--muted)]">Passed</span>
        ) : time ? (
          <>
            <span className={`text-sm font-mono font-semibold ${isUrgent ? 'animate-urgent' : ''}`}>
              {formatCompact()}
            </span>
            {isUrgent && <span className="live-dot" />}
          </>
        ) : (
          <span className="text-sm text-[var(--muted)]">TBD</span>
        )}
      </div>
      {/* Date below */}
      {!hasPassed && time && (
        <span className="text-[10px] text-[var(--muted)] ml-auto">
          {formatDeadlineDate(deadline)}
        </span>
      )}
    </div>
  )
}

export function Header({ leagueName, currentEvent, deadlineInfo }: HeaderProps) {
  return (
    <header className="sticky top-0 z-[var(--z-sticky)] glass border-b border-[var(--card-border)] safe-area-top">
      <div className="max-w-6xl mx-auto px-4 py-3">
        {/* Desktop layout */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          {/* League info */}
          <div className="min-w-0 flex-shrink-0">
            <h1 className="text-xl font-bold truncate">{leagueName}</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--muted)]">Gameweek {currentEvent}</span>
              {deadlineInfo.nextEvent !== currentEvent && (
                <span className="text-xs bg-[var(--accent-muted)] text-[var(--accent)] px-2 py-0.5 rounded-full">
                  Next: GW {deadlineInfo.nextEvent}
                </span>
              )}
            </div>
          </div>

          {/* Countdown timers */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <CountdownTimer
              deadline={deadlineInfo.waiverDeadline}
              label="Waivers"
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              }
            />
            <CountdownTimer
              deadline={deadlineInfo.lineupDeadline}
              label="Lineups"
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
            />
          </div>
        </div>

        {/* Mobile layout */}
        <div className="sm:hidden">
          {/* Top row: League name and GW */}
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold truncate">{leagueName}</h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-medium bg-[var(--card)] px-2.5 py-1 rounded-lg">
                GW {currentEvent}
              </span>
            </div>
          </div>

          {/* Deadline timers row */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-[var(--card-border)]">
            <CompactCountdownTimer deadline={deadlineInfo.waiverDeadline} label="Waivers" />
            <CompactCountdownTimer deadline={deadlineInfo.lineupDeadline} label="Lineups" />
          </div>
        </div>
      </div>
    </header>
  )
}
