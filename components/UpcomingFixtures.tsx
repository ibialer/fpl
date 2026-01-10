'use client'

import { useState, useMemo } from 'react'
import { FixtureWithNames } from '@/lib/types'

interface UpcomingFixturesProps {
  matches: FixtureWithNames[]
  currentEvent: number
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
    .filter((m) => selectedTeamId === null || m.team1Id === selectedTeamId || m.team2Id === selectedTeamId)
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
    return (
      <div className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] p-4">
        <p className="text-[var(--muted)] text-sm text-center">No upcoming fixtures</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Team Filter */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] p-4">
        <div className="flex items-center gap-3">
          <label htmlFor="fixtures-team-filter" className="text-sm font-medium text-[var(--muted)]">
            Filter by team:
          </label>
          <select
            id="fixtures-team-filter"
            value={selectedTeamId ?? ''}
            onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 max-w-xs bg-[var(--background)] border border-[var(--card-border)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="">All Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {gameweeks.length === 0 && selectedTeamId !== null && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] p-4">
          <p className="text-[var(--muted)] text-sm text-center">No upcoming fixtures for this team</p>
        </div>
      )}

      {gameweeks.map((gw) => (
        <section
          key={gw}
          className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] overflow-hidden"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] px-4 py-3 border-b border-[var(--card-border)]">
            Gameweek {gw}
          </h3>
          <div className="divide-y divide-[var(--card-border)]">
            {matchesByGW[gw].map((m, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 text-right">
                    <div className="font-medium text-sm">{m.team1Name}</div>
                    <div className="text-xs text-[var(--muted)]">{m.team1PlayerName}</div>
                  </div>
                  <div className="flex items-center gap-2 px-3">
                    <span className="text-lg font-bold text-[var(--muted)]">vs</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{m.team2Name}</div>
                    <div className="text-xs text-[var(--muted)]">{m.team2PlayerName}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
