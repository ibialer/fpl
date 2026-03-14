'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { TabNavigation, TabIcons } from './TabNavigation'
import { GWSummary } from './GWSummary'
import { Fixtures } from './Fixtures'
import { Standings } from './Standings'
import { SummerStandings } from './SummerStandings'
import { HeadToHead } from './HeadToHead'
import { Transactions } from './Transactions'
import { Results } from './Results'
import { UpcomingFixtures } from './UpcomingFixtures'
import { WhatIf } from './WhatIf'
import { LuckMetrics } from './LuckMetrics'
import {
  ManagerWithSquad,
  Match,
  TransactionWithDetails,
  TeamPointsBreakdown,
  LeagueEntry,
  WhatIfSquad,
  FixtureWithNames,
} from '@/lib/types'
import { FormResult, H2HRecord, LuckMetricsData, processAllMatches } from '@/lib/api'

interface SummerStandingEntry {
  entry: LeagueEntry
  wins: number
  draws: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  total: number
  rank: number
}

interface DashboardProps {
  currentEvent: number
  managers: ManagerWithSquad[]
  currentFixtures: FixtureWithNames[]
  matches: Match[]
  pointsBreakdown: Record<number, TeamPointsBreakdown>
  form: Record<number, FormResult[]>
  summerStandings: SummerStandingEntry[]
  h2h: Record<number, Record<number, H2HRecord>>
  entries: LeagueEntry[]
  transactions: TransactionWithDetails[]
  transactionsEvent: number
  luckMetrics: LuckMetricsData[]
}

const TABS = [
  { id: 'live', label: 'Live', icon: TabIcons.live },
  { id: 'results', label: 'Results', icon: TabIcons.results },
  { id: 'fixtures', label: 'Fixtures', icon: TabIcons.fixtures },
  { id: 'whatif', label: 'What If?', icon: TabIcons.whatif },
]

export function Dashboard({
  currentEvent,
  managers,
  currentFixtures,
  matches,
  pointsBreakdown,
  form,
  summerStandings,
  h2h,
  entries,
  transactions,
  transactionsEvent,
  luckMetrics,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState('live')
  const [allPointsBreakdown, setAllPointsBreakdown] = useState<Record<number, Record<number, TeamPointsBreakdown>> | null>(null)
  const [breakdownLoading, setBreakdownLoading] = useState(false)
  const [breakdownError, setBreakdownError] = useState(false)
  const [whatIfSquads, setWhatIfSquads] = useState<WhatIfSquad[] | null>(null)
  const [whatIfLoading, setWhatIfLoading] = useState(false)
  const [whatIfError, setWhatIfError] = useState(false)

  const allMatches = useMemo(
    () => processAllMatches({ league_entries: entries, matches } as import('@/lib/types').LeagueDetails),
    [entries, matches]
  )

  const fetchBreakdown = useCallback(async () => {
    if (allPointsBreakdown || breakdownLoading) return
    setBreakdownLoading(true)
    setBreakdownError(false)
    try {
      const res = await fetch('/api/points-breakdown')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setAllPointsBreakdown(data)
    } catch {
      setBreakdownError(true)
    } finally {
      setBreakdownLoading(false)
    }
  }, [allPointsBreakdown, breakdownLoading])

  const fetchWhatIf = useCallback(async () => {
    if (whatIfSquads || whatIfLoading) return
    setWhatIfLoading(true)
    setWhatIfError(false)
    try {
      const res = await fetch('/api/what-if')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setWhatIfSquads(data)
    } catch {
      setWhatIfError(true)
    } finally {
      setWhatIfLoading(false)
    }
  }, [whatIfSquads, whatIfLoading])

  useEffect(() => {
    if (activeTab === 'results') {
      fetchBreakdown()
    }
    if (activeTab === 'whatif') {
      fetchWhatIf()
    }
  }, [activeTab, fetchBreakdown, fetchWhatIf])

  return (
    <div className="min-h-screen">
      <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-6xl mx-auto px-4 py-6 safe-area-bottom">
        <div
          key={activeTab}
          className="tab-content"
          role="tabpanel"
          id={`${activeTab}-panel`}
          aria-labelledby={activeTab}
        >
          {activeTab === 'live' && (
            <div className="space-y-6 stagger-children">
              {/* AI-Generated GW Summary */}
              <GWSummary
                currentEvent={currentEvent}
                fixtures={currentFixtures}
                pointsBreakdown={pointsBreakdown}
                form={form}
                h2h={h2h}
                luckMetrics={luckMetrics}
              />

              {/* Current Gameweek Fixtures */}
              <Fixtures
                fixtures={currentFixtures}
                currentEvent={currentEvent}
                pointsBreakdown={pointsBreakdown}
              />

              {/* Standings tables - side by side on larger screens */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Standings managers={managers} form={form} />
                <SummerStandings standings={summerStandings} />
              </div>

              {/* Luck Index */}
              <LuckMetrics luckMetrics={luckMetrics} />

              {/* Head to Head matrix */}
              <HeadToHead entries={entries} h2h={h2h} />

              {/* Transactions */}
              <Transactions transactions={transactions} currentEvent={transactionsEvent} />
            </div>
          )}

          {activeTab === 'results' && (
            breakdownLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-[var(--muted)]">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm">Loading results...</span>
                </div>
              </div>
            ) : breakdownError ? (
              <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-8 text-center">
                <p className="text-[var(--muted)] text-sm mb-3">Failed to load results data</p>
                <button
                  onClick={() => { setBreakdownError(false); fetchBreakdown() }}
                  className="text-sm text-[var(--accent)] hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <Results matches={allMatches} currentEvent={currentEvent} allPointsBreakdown={allPointsBreakdown || {}} />
            )
          )}

          {activeTab === 'fixtures' && (
            <UpcomingFixtures matches={allMatches} currentEvent={currentEvent} />
          )}

          {activeTab === 'whatif' && (
            whatIfLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-[var(--muted)]">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm">Loading what-if data...</span>
                </div>
              </div>
            ) : whatIfError ? (
              <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-8 text-center">
                <p className="text-[var(--muted)] text-sm mb-3">Failed to load what-if data</p>
                <button
                  onClick={() => { setWhatIfError(false); fetchWhatIf() }}
                  className="text-sm text-[var(--accent)] hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : whatIfSquads ? (
              <WhatIf squads={whatIfSquads} />
            ) : null
          )}
        </div>
      </main>
    </div>
  )
}
