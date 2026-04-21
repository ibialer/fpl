import { notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { ManagerProfile } from '@/components/ManagerProfile'
import { RefreshButton } from '@/components/RefreshButton'
import {
  fetchAllData,
  fetchDraftChoices,
  fetchAllPointsBreakdown,
  getCurrentEvent,
  getDeadlineInfo,
  calculateTeamForm,
  calculateHeadToHead,
  calculateSeasonTrajectory,
  calculateLeagueAverageTrajectory,
  calculateGWExtremes,
  calculateBenchPoints,
  calculateDraftRecap,
  getRivalryData,
  getEntryTransactions,
} from '@/lib/api'

export const dynamic = 'force-dynamic'

interface TeamPageProps {
  params: Promise<{ entryId: string }>
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { entryId: entryIdParam } = await params
  const entryId = Number(entryIdParam)
  if (!Number.isFinite(entryId)) notFound()

  let allData: Awaited<ReturnType<typeof fetchAllData>>
  let draftChoicesResponse: Awaited<ReturnType<typeof fetchDraftChoices>>
  try {
    ;[allData, draftChoicesResponse] = await Promise.all([
      fetchAllData(),
      fetchDraftChoices(),
    ])
  } catch (error) {
    console.error('Failed to load team profile:', error)
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] p-6 max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">Failed to load team</h1>
          <p className="text-[var(--muted)] mb-4">
            Could not connect to the FPL API. Please try again later.
          </p>
          <a
            href="/"
            className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded transition-colors"
          >
            Back to league
          </a>
        </div>
      </main>
    )
  }

  const { leagueDetails, bootstrapStatic, transactions } = allData

  const entry = leagueDetails.league_entries.find((e) => e.id === entryId)
  if (!entry) notFound()

  const standing = leagueDetails.standings.find((s) => s.league_entry === entryId)
  if (!standing) notFound()

  const currentEvent = getCurrentEvent(bootstrapStatic)
  const deadlineInfo = getDeadlineInfo(bootstrapStatic)

  const formMap = calculateTeamForm(leagueDetails)
  const form = formMap.get(entryId) || []

  const h2h = calculateHeadToHead(leagueDetails)
  const rivalries = getRivalryData(h2h, leagueDetails.league_entries, entryId)

  const trajectory = calculateSeasonTrajectory(leagueDetails, entryId)
  const leagueAvgTrajectory = calculateLeagueAverageTrajectory(leagueDetails)
  const extremes = calculateGWExtremes(leagueDetails, entryId)

  // Bench points requires fetching all finished GW breakdowns — can be expensive
  let benchPoints = 0
  try {
    const allBreakdowns = await fetchAllPointsBreakdown(leagueDetails, bootstrapStatic, currentEvent)
    benchPoints = calculateBenchPoints(allBreakdowns, entryId)
  } catch (err) {
    console.error('Failed to compute bench points:', err)
  }

  const draftRecap = calculateDraftRecap(
    draftChoicesResponse.choices,
    bootstrapStatic,
    entryId,
    leagueDetails
  )

  const entryTransactions = getEntryTransactions(
    transactions,
    leagueDetails,
    bootstrapStatic,
    entryId
  )

  return (
    <main className="pb-24">
      <Header
        leagueName={leagueDetails.league.name}
        currentEvent={currentEvent}
        deadlineInfo={deadlineInfo}
      />

      <ManagerProfile
        entry={entry}
        standing={standing}
        form={form}
        trajectory={trajectory}
        leagueAvgTrajectory={leagueAvgTrajectory}
        extremes={extremes}
        benchPoints={benchPoints}
        rivalries={rivalries}
        draftRecap={draftRecap}
        transactions={entryTransactions}
      />

      <RefreshButton />
    </main>
  )
}
