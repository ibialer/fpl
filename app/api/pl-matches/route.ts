import { NextRequest, NextResponse } from 'next/server'
import {
  fetchBootstrapStatic,
  fetchLiveEvent,
  getCurrentEvent,
  getPositionName,
} from '@/lib/api'
import { PLFixtureWithDetails, PLFixturePlayer, PLMatchesResponse } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const bootstrapStatic = await fetchBootstrapStatic()
    const currentEvent = getCurrentEvent(bootstrapStatic)
    const totalEvents = bootstrapStatic.events.data.length

    const eventParam = request.nextUrl.searchParams.get('event')
    const event = eventParam ? parseInt(eventParam, 10) : currentEvent

    if (isNaN(event) || event < 1 || event > totalEvents) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
    }

    // Build team lookup
    const teamMap = new Map(bootstrapStatic.teams.map((t) => [t.id, t]))

    // Build player lookup
    const playerMap = new Map(bootstrapStatic.elements.map((p) => [p.id, p]))

    // Get fixtures for this GW
    const gwFixtures = bootstrapStatic.fixtures[String(event)] || []

    // Try to fetch live data (will fail for future GWs)
    let liveData: Awaited<ReturnType<typeof fetchLiveEvent>> | null = null
    try {
      liveData = await fetchLiveEvent(event)
    } catch {
      // No live data for future gameweeks
    }

    // Pre-group live players by fixture ID for O(n+m) lookup
    const playersByFixture = new Map<number, { home: PLFixturePlayer[]; away: PLFixturePlayer[] }>()
    if (liveData) {
      // Initialize fixture buckets
      for (const f of gwFixtures) {
        playersByFixture.set(f.id, { home: [], away: [] })
      }

      for (const [elementId, element] of Object.entries(liveData.elements)) {
        const player = playerMap.get(parseInt(elementId, 10))
        if (!player || element.stats.minutes === 0) continue

        // Check which fixture(s) this player appeared in via explain field
        for (const [, fixtureId] of element.explain || []) {
          const bucket = playersByFixture.get(fixtureId)
          if (!bucket) continue

          const fixture = gwFixtures.find((f) => f.id === fixtureId)
          if (!fixture) continue

          const plPlayer: PLFixturePlayer = {
            id: player.id,
            web_name: player.web_name,
            position: getPositionName(player.element_type),
            team: player.team,
            bps: element.stats.bps || 0,
            bonus: element.stats.bonus || 0,
            minutes: element.stats.minutes,
            goals_scored: element.stats.goals_scored,
            assists: element.stats.assists,
            clean_sheets: element.stats.clean_sheets,
            defensive_contribution: element.stats.defensive_contribution || 0,
          }

          if (player.team === fixture.team_h) {
            bucket.home.push(plPlayer)
          } else {
            bucket.away.push(plPlayer)
          }
        }
      }
    }

    const fixtures: PLFixtureWithDetails[] = gwFixtures.map((f) => {
      const homeTeamData = teamMap.get(f.team_h)
      const awayTeamData = teamMap.get(f.team_a)

      const bucket = playersByFixture.get(f.id)
      const homePlayers = bucket?.home || []
      const awayPlayers = bucket?.away || []

      // Sort by BPS descending
      homePlayers.sort((a, b) => b.bps - a.bps)
      awayPlayers.sort((a, b) => b.bps - a.bps)

      return {
        id: f.id,
        event: f.event,
        homeTeam: {
          id: f.team_h,
          name: homeTeamData?.name || 'Unknown',
          shortName: homeTeamData?.short_name || '???',
        },
        awayTeam: {
          id: f.team_a,
          name: awayTeamData?.name || 'Unknown',
          shortName: awayTeamData?.short_name || '???',
        },
        homeScore: f.team_h_score,
        awayScore: f.team_a_score,
        kickoffTime: f.kickoff_time,
        minutes: f.minutes,
        started: f.started,
        finished: f.finished,
        homePlayers,
        awayPlayers,
      }
    })

    // Sort: live first, then by kickoff time (pre-compute timestamps)
    const kickoffTimestamps = new Map(fixtures.map((f) => [f.id, new Date(f.kickoffTime).getTime()]))
    fixtures.sort((a, b) => {
      const aLive = a.started && !a.finished ? 1 : 0
      const bLive = b.started && !b.finished ? 1 : 0
      if (aLive !== bLive) return bLive - aLive
      return kickoffTimestamps.get(a.id)! - kickoffTimestamps.get(b.id)!
    })

    const response: PLMatchesResponse = {
      event,
      totalEvents,
      currentEvent,
      fixtures,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch PL matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PL matches' },
      { status: 500 }
    )
  }
}
