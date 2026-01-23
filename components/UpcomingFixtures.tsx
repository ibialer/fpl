'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { FixtureWithNames } from '@/lib/types'

interface UpcomingFixturesProps {
  matches: FixtureWithNames[]
  currentEvent: number
}

interface TeamOption {
  id: number
  name: string
}

// Custom dropdown component with glassmorphism styling
function TeamFilter({
  teams,
  selectedTeamId,
  onSelect,
}: {
  teams: TeamOption[]
  selectedTeamId: number | null
  onSelect: (id: number | null) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSelect = (teamId: number | null) => {
    onSelect(teamId)
    setIsOpen(false)
  }

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-4 shadow-[var(--card-shadow)]">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Label */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted)] flex items-center justify-center">
            <svg
              className="w-4 h-4 text-[var(--accent)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">Filter by team</span>
        </div>

        {/* Custom dropdown */}
        <div ref={dropdownRef} className="relative flex-1 sm:max-w-xs">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label="Select team filter"
            className={`
              w-full min-h-[44px] px-4 py-2.5
              flex items-center justify-between gap-2
              glass rounded-lg
              border transition-all duration-200
              touch-target btn-press
              ${
                isOpen
                  ? 'border-[var(--accent)] ring-2 ring-[var(--accent-muted)]'
                  : selectedTeamId
                  ? 'border-[var(--accent)]/50 bg-[var(--accent-muted)]'
                  : 'border-[var(--card-border)] hover:border-[var(--card-border-hover)]'
              }
            `}
          >
            <span
              className={`truncate text-sm ${
                selectedTeam ? 'font-medium text-[var(--foreground)]' : 'text-[var(--muted)]'
              }`}
            >
              {selectedTeam ? selectedTeam.name : 'All Teams'}
            </span>
            <svg
              className={`w-4 h-4 text-[var(--muted)] transition-transform duration-200 shrink-0 ${
                isOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {isOpen && (
            <div
              role="listbox"
              className="absolute z-[var(--z-dropdown)] top-full left-0 right-0 mt-2 py-1 glass rounded-lg border border-[var(--card-border)] shadow-[var(--card-shadow-lg)] animate-scale-in overflow-hidden"
            >
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {/* All Teams option */}
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedTeamId === null}
                  onClick={() => handleSelect(null)}
                  className={`
                    w-full px-4 py-3 text-left text-sm
                    flex items-center justify-between gap-2
                    transition-colors touch-target
                    ${
                      selectedTeamId === null
                        ? 'bg-[var(--accent-muted)] text-[var(--accent)] font-medium'
                        : 'text-[var(--foreground)] hover:bg-[var(--card-border)]/50'
                    }
                  `}
                >
                  <span>All Teams</span>
                  {selectedTeamId === null && (
                    <svg
                      className="w-4 h-4 text-[var(--accent)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Divider */}
                <div className="h-px bg-[var(--card-border)] mx-2 my-1" />

                {/* Team options */}
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    role="option"
                    aria-selected={selectedTeamId === team.id}
                    onClick={() => handleSelect(team.id)}
                    className={`
                      w-full px-4 py-3 text-left text-sm
                      flex items-center justify-between gap-2
                      transition-colors touch-target
                      ${
                        selectedTeamId === team.id
                          ? 'bg-[var(--accent-muted)] text-[var(--accent)] font-medium'
                          : 'text-[var(--foreground)] hover:bg-[var(--card-border)]/50'
                      }
                    `}
                  >
                    <span className="truncate">{team.name}</span>
                    {selectedTeamId === team.id && (
                      <svg
                        className="w-4 h-4 text-[var(--accent)] shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clear filter button */}
        {selectedTeamId && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] bg-[var(--accent-muted)] hover:bg-[var(--accent-muted)] rounded-lg transition-colors touch-target"
            aria-label="Clear team filter"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>
    </div>
  )
}

// Empty state
function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-8 text-center">
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <p className="text-[var(--muted)] text-sm">{message}</p>
    </div>
  )
}

// Fixture card for upcoming matches
function UpcomingFixtureCard({ match }: { match: FixtureWithNames }) {
  return (
    <div className="px-4 py-4 hover:bg-[var(--card-border)]/20 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Team 1 */}
        <div className="flex-1 min-w-0 text-right">
          <div className="font-semibold text-sm truncate">{match.team1Name}</div>
          <div className="text-xs text-[var(--muted)] truncate">{match.team1PlayerName}</div>
        </div>

        {/* VS badge */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--card-border)]/50 shrink-0">
          <span className="text-sm font-bold text-[var(--muted)]">VS</span>
        </div>

        {/* Team 2 */}
        <div className="flex-1 min-w-0 text-left">
          <div className="font-semibold text-sm truncate">{match.team2Name}</div>
          <div className="text-xs text-[var(--muted)] truncate">{match.team2PlayerName}</div>
        </div>
      </div>
    </div>
  )
}

export function UpcomingFixtures({ matches, currentEvent }: UpcomingFixturesProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

  // Extract unique teams from all matches
  const teams = useMemo(() => {
    const teamMap = new Map<number, string>()
    matches.forEach((m) => {
      teamMap.set(m.team1Id, m.team1Name)
      teamMap.set(m.team2Id, m.team2Name)
    })
    return Array.from(teamMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [matches])

  // Get all unfinished matches (future fixtures), grouped by gameweek
  const upcomingMatches = matches
    .filter((m) => !m.finished && !m.started)
    .filter(
      (m) =>
        selectedTeamId === null ||
        m.team1Id === selectedTeamId ||
        m.team2Id === selectedTeamId
    )
    .sort((a, b) => a.event - b.event)

  // Group by gameweek
  const matchesByGW = upcomingMatches.reduce((acc, match) => {
    if (!acc[match.event]) {
      acc[match.event] = []
    }
    acc[match.event].push(match)
    return acc
  }, {} as Record<number, FixtureWithNames[]>)

  const gameweeks = Object.keys(matchesByGW)
    .map(Number)
    .sort((a, b) => a - b)

  if (matches.filter((m) => !m.finished && !m.started).length === 0) {
    return <EmptyState message="No upcoming fixtures" />
  }

  return (
    <div className="space-y-4">
      <TeamFilter teams={teams} selectedTeamId={selectedTeamId} onSelect={setSelectedTeamId} />

      {gameweeks.length === 0 && selectedTeamId !== null && (
        <EmptyState message="No upcoming fixtures for this team" />
      )}

      {gameweeks.map((gw) => (
        <section
          key={gw}
          className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-[var(--card-shadow)]"
        >
          <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)] bg-[var(--card-elevated)]">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              Gameweek {gw}
            </h3>
            <span className="text-xs text-[var(--muted)]">
              {matchesByGW[gw].length} {matchesByGW[gw].length === 1 ? 'match' : 'matches'}
            </span>
          </header>
          <div className="divide-y divide-[var(--card-border)]">
            {matchesByGW[gw].map((m, i) => (
              <UpcomingFixtureCard key={i} match={m} />
            ))}
          </div>
        </section>
      ))}

      {/* Summary footer */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-4 shadow-[var(--card-shadow)]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--muted)]">Total upcoming matches</span>
          <span className="font-semibold">{upcomingMatches.length}</span>
        </div>
        {selectedTeamId && (
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-[var(--muted)]">
              For {teams.find((t) => t.id === selectedTeamId)?.name}
            </span>
            <span className="font-semibold">{gameweeks.length} gameweeks</span>
          </div>
        )}
      </div>
    </div>
  )
}
