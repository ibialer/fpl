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
  getDeadlineInfo,
  getTransactionsEvent,
  calculateStandingsFromGameweek,
  calculateTeamForm,
  calculateHeadToHead,
  calculateLuckMetrics,
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
    const deadlineInfo = getDeadlineInfo(bootstrapStatic)
    const managers = processManagersWithSquads(
      leagueDetails,
      elementStatus,
      bootstrapStatic
    )
    const currentFixtures = processFixtures(leagueDetails, currentEvent)
    const allMatches = processAllMatches(leagueDetails)

    // Fetch current GW breakdown and draft choices in parallel
    let pointsBreakdown = new Map<number, TeamPointsBreakdown>()
    let whatIfSquads: ReturnType<typeof processWhatIfSquads> = []

    const [breakdownResult, draftResult] = await Promise.allSettled([
      fetchPointsBreakdown(leagueDetails, bootstrapStatic, currentEvent),
      fetchDraftChoices(),
    ])

    if (breakdownResult.status === 'fulfilled') {
      pointsBreakdown = breakdownResult.value
    } else {
      console.error('Failed to fetch points breakdown:', breakdownResult.reason)
    }

    if (draftResult.status === 'fulfilled') {
      whatIfSquads = processWhatIfSquads(draftResult.value.choices, bootstrapStatic, leagueDetails)
    } else {
      console.error('Failed to fetch draft choices:', draftResult.reason)
    }

    // Determine which GW's transactions to show
    // After waiver deadline passes, show transactions for the upcoming GW
    const transactionsEvent = getTransactionsEvent(currentEvent, deadlineInfo)
    const recentTransactions = processTransactions(
      transactions,
      leagueDetails,
      bootstrapStatic,
      transactionsEvent
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

    // Calculate form, H2H, and luck metrics
    const luckMetrics = calculateLuckMetrics(leagueDetails)
    const form = Object.fromEntries(calculateTeamForm(leagueDetails))
    const h2h = Object.fromEntries(
      Array.from(calculateHeadToHead(leagueDetails).entries()).map(([k, v]) => [k, Object.fromEntries(v)])
    )

    return (
      <main className="pb-24">
        <Header
          leagueName={leagueDetails.league.name}
          currentEvent={currentEvent}
          deadlineInfo={deadlineInfo}
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
          transactionsEvent={transactionsEvent}
          whatIfSquads={whatIfSquads}
          luckMetrics={luckMetrics}
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
