'use client'

import { useState } from 'react'
import { TabNavigation } from './TabNavigation'
import { Fixtures } from './Fixtures'
import { Standings } from './Standings'
import { SummerStandings } from './SummerStandings'
import { HeadToHead } from './HeadToHead'
import { Transactions } from './Transactions'
import { Results } from './Results'
import { UpcomingFixtures } from './UpcomingFixtures'
import { WhatIf } from './WhatIf'
import {
  ManagerWithSquad,
  FixtureWithNames,
  TransactionWithDetails,
  TeamPointsBreakdown,
  LeagueEntry,
  WhatIfSquad,
} from '@/lib/types'
import { FormResult, H2HRecord } from '@/lib/api'

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
  allMatches: FixtureWithNames[]
  pointsBreakdown: Record<number, TeamPointsBreakdown>
  form: Record<number, FormResult[]>
  summerStandings: SummerStandingEntry[]
  h2h: Record<number, Record<number, H2HRecord>>
  entries: LeagueEntry[]
  transactions: TransactionWithDetails[]
  whatIfSquads: WhatIfSquad[]
}

const TABS = [
  { id: 'live', label: 'Live' },
  { id: 'results', label: 'Results' },
  { id: 'fixtures', label: 'Fixtures' },
  { id: 'whatif', label: 'What If?' },
]

export function Dashboard({
  currentEvent,
  managers,
  currentFixtures,
  allMatches,
  pointsBreakdown,
  form,
  summerStandings,
  h2h,
  entries,
  transactions,
  whatIfSquads,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState('live')

  return (
    <div>
      <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'live' && (
          <div className="space-y-6">
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

            {/* Head to Head matrix */}
            <HeadToHead entries={entries} h2h={h2h} />

            {/* Transactions */}
            <Transactions transactions={transactions} currentEvent={currentEvent} />
          </div>
        )}

        {activeTab === 'results' && (
          <Results matches={allMatches} currentEvent={currentEvent} />
        )}

        {activeTab === 'fixtures' && (
          <UpcomingFixtures matches={allMatches} currentEvent={currentEvent} />
        )}

        {activeTab === 'whatif' && (
          <WhatIf squads={whatIfSquads} />
        )}
      </div>
    </div>
  )
}
