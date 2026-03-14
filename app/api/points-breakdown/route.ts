import { NextResponse } from 'next/server'
import {
  fetchLeagueDetails,
  fetchBootstrapStatic,
  getCurrentEvent,
  fetchAllPointsBreakdown,
} from '@/lib/api'
import { TeamPointsBreakdown } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [leagueDetails, bootstrapStatic] = await Promise.all([
      fetchLeagueDetails(),
      fetchBootstrapStatic(),
    ])

    const currentEvent = getCurrentEvent(bootstrapStatic)
    const allPointsBreakdown = await fetchAllPointsBreakdown(
      leagueDetails,
      bootstrapStatic,
      currentEvent
    )

    // Convert Map<number, Map<number, TeamPointsBreakdown>> to serializable object
    const serialized: Record<number, Record<number, TeamPointsBreakdown>> = {}
    for (const [event, breakdown] of allPointsBreakdown.entries()) {
      serialized[event] = Object.fromEntries(breakdown)
    }

    return NextResponse.json(serialized)
  } catch (error) {
    console.error('Failed to fetch points breakdown:', error)
    return NextResponse.json(
      { error: 'Failed to fetch points breakdown' },
      { status: 500 }
    )
  }
}
