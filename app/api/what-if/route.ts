import { NextResponse } from 'next/server'
import {
  fetchLeagueDetails,
  fetchBootstrapStatic,
  fetchDraftChoices,
  processWhatIfSquads,
} from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [leagueDetails, bootstrapStatic, draftChoices] = await Promise.all([
      fetchLeagueDetails(),
      fetchBootstrapStatic(),
      fetchDraftChoices(),
    ])

    const squads = processWhatIfSquads(
      draftChoices.choices,
      bootstrapStatic,
      leagueDetails
    )

    return NextResponse.json(squads)
  } catch (error) {
    console.error('Failed to fetch what-if data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch what-if data' },
      { status: 500 }
    )
  }
}
