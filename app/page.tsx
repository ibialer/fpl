import { Header } from '@/components/Header'
import { Dashboard } from '@/components/Dashboard'
import { RefreshButton } from '@/components/RefreshButton'
import {
  fetchAllData,
  processManagersWithSquads,
  processFixtures,
  processAllMatches,
  processTransactions,
  getCurrentEvent,
  calculateStandingsFromGameweek,
  calculateTeamForm,
  calculateHeadToHead,
  fetchPointsBreakdown,
  fetchDraftChoices,
  processWhatIfSquads,
} from '@/lib/api'
import { TeamPointsBreakdown } from '@/lib/types'

const SUMMER_CHAMPIONSHIP_START = 20

export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    const { leagueDetails, elementStatus, bootstrapStatic, transactions } =
      await fetchAllData()

    const currentEvent = getCurrentEvent(bootstrapStatic)
    const managers = processManagersWithSquads(
      leagueDetails,
      elementStatus,
      bootstrapStatic
    )
    const currentFixtures = processFixtures(leagueDetails, currentEvent)
    const allMatches = processAllMatches(leagueDetails)

    // Fetch points breakdown for the current gameweek
    let pointsBreakdown: Map<number, TeamPointsBreakdown> = new Map()
    try {
      pointsBreakdown = await fetchPointsBreakdown(leagueDetails, bootstrapStatic, currentEvent)
    } catch (e) {
      console.error('Failed to fetch points breakdown:', e)
    }

    const recentTransactions = processTransactions(
      transactions,
      leagueDetails,
      bootstrapStatic,
      currentEvent
    )

    // Calculate Summer Championship standings (from GW 20 onwards)
    const summerStandingsMap = calculateStandingsFromGameweek(
      leagueDetails,
      SUMMER_CHAMPIONSHIP_START
    )
    const summerStandings = leagueDetails.league_entries.map((entry) => {
      const stats = summerStandingsMap.get(entry.id)!
      return {
        entry,
        wins: stats.wins,
        draws: stats.draws,
        losses: stats.losses,
        pointsFor: stats.pointsFor,
        pointsAgainst: stats.pointsAgainst,
        total: stats.wins * 3 + stats.draws,
        rank: 0,
      }
    })

    // Calculate form and H2H
    const form = Object.fromEntries(calculateTeamForm(leagueDetails))
    const h2h = Object.fromEntries(
      Array.from(calculateHeadToHead(leagueDetails).entries()).map(([k, v]) => [k, Object.fromEntries(v)])
    )

    // Fetch and process What If squads
    let whatIfSquads: ReturnType<typeof processWhatIfSquads> = []
    try {
      const draftChoices = await fetchDraftChoices()
      whatIfSquads = processWhatIfSquads(draftChoices.choices, bootstrapStatic, leagueDetails)
    } catch (e) {
      console.error('Failed to fetch draft choices:', e)
    }

    return (
      <main className="pb-24">
        <Header
          leagueName={leagueDetails.league.name}
          currentEvent={currentEvent}
        />

        <Dashboard
          currentEvent={currentEvent}
          managers={managers}
          currentFixtures={currentFixtures}
          allMatches={allMatches}
          pointsBreakdown={Object.fromEntries(pointsBreakdown)}
          form={form}
          summerStandings={summerStandings}
          h2h={h2h}
          entries={leagueDetails.league_entries}
          transactions={recentTransactions}
          whatIfSquads={whatIfSquads}
        />

        <RefreshButton />
      </main>
    )
  } catch (error) {
    console.error('Failed to load data:', error)
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] p-6 max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">Failed to load data</h1>
          <p className="text-[var(--muted)] mb-4">
            Could not connect to the FPL API. Please try again later.
          </p>
          <a
            href="/"
            className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded transition-colors"
          >
            Retry
          </a>
        </div>
      </main>
    )
  }
}
