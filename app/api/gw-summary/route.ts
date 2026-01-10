import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { FixtureWithNames, TeamPointsBreakdown } from '@/lib/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface GWSummaryRequest {
  currentEvent: number
  fixtures: FixtureWithNames[]
  pointsBreakdown: Record<number, TeamPointsBreakdown>
}

export async function POST(request: Request) {
  try {
    const { currentEvent, fixtures, pointsBreakdown }: GWSummaryRequest = await request.json()

    // Determine GW status
    const allFinished = fixtures.every((f) => f.finished)
    const anyStarted = fixtures.some((f) => f.started)
    const gwStatus = allFinished ? 'finished' : anyStarted ? 'in_progress' : 'not_started'

    if (gwStatus === 'not_started') {
      return NextResponse.json({
        summary: `Gameweek ${currentEvent} hasn't started yet. Check back once the first match kicks off!`,
        status: gwStatus,
      })
    }

    // Build context for each match
    const matchContexts = fixtures.map((fixture) => {
      const team1Breakdown = pointsBreakdown[fixture.team1Id]
      const team2Breakdown = pointsBreakdown[fixture.team2Id]

      const team1Starters = team1Breakdown?.players.filter((p) => !p.isBenched) || []
      const team2Starters = team2Breakdown?.players.filter((p) => !p.isBenched) || []

      const team1Played = team1Starters.filter((p) => p.hasPlayed)
      const team2Played = team2Starters.filter((p) => p.hasPlayed)
      const team1ToPlay = team1Starters.filter((p) => !p.hasPlayed)
      const team2ToPlay = team2Starters.filter((p) => !p.hasPlayed)

      const team1TopScorer = team1Played.length > 0
        ? team1Played.reduce((max, p) => (p.points > max.points ? p : max), team1Played[0])
        : null
      const team2TopScorer = team2Played.length > 0
        ? team2Played.reduce((max, p) => (p.points > max.points ? p : max), team2Played[0])
        : null

      return {
        team1: fixture.team1Name,
        team1Manager: fixture.team1PlayerName,
        team1Points: fixture.team1Points,
        team2: fixture.team2Name,
        team2Manager: fixture.team2PlayerName,
        team2Points: fixture.team2Points,
        finished: fixture.finished,
        started: fixture.started,
        team1TopScorer: team1TopScorer ? `${team1TopScorer.name} (${team1TopScorer.points}pts)` : null,
        team2TopScorer: team2TopScorer ? `${team2TopScorer.name} (${team2TopScorer.points}pts)` : null,
        team1PlayersToPlay: team1ToPlay.map((p) => `${p.name} (${p.teamShortName})`),
        team2PlayersToPlay: team2ToPlay.map((p) => `${p.name} (${p.teamShortName})`),
        pointsDifference: Math.abs(fixture.team1Points - fixture.team2Points),
        leader: fixture.team1Points > fixture.team2Points
          ? fixture.team1Name
          : fixture.team2Points > fixture.team1Points
            ? fixture.team2Name
            : 'tied',
      }
    })

    // Build the prompt
    const systemPrompt = `You are a witty sports commentator for a Fantasy Premier League draft league called "Hogwarts".
Write engaging, fun summaries of the gameweek matchups. Use a casual, entertaining tone.
Keep it concise - 2-3 sentences per match maximum.
If a match is still in progress, mention who's leading and any exciting players yet to play.
If someone has already won (big lead, no players left for opponent), declare the victory.
Reference player performances where notable (goals, assists, big hauls).
Don't use emojis.`

    const userPrompt = `Summarize Gameweek ${currentEvent} for our FPL draft league.

Status: ${gwStatus === 'finished' ? 'All matches complete' : 'Matches in progress'}

Matches:
${matchContexts.map((m, i) => `
Match ${i + 1}: ${m.team1} (${m.team1Manager}) ${m.team1Points} - ${m.team2Points} ${m.team2} (${m.team2Manager})
- Status: ${m.finished ? 'FINISHED' : m.started ? 'LIVE' : 'Not started'}
- ${m.team1} top scorer: ${m.team1TopScorer || 'N/A'}
- ${m.team2} top scorer: ${m.team2TopScorer || 'N/A'}
${m.team1PlayersToPlay.length > 0 ? `- ${m.team1} players yet to play: ${m.team1PlayersToPlay.join(', ')}` : `- ${m.team1} has no players left`}
${m.team2PlayersToPlay.length > 0 ? `- ${m.team2} players yet to play: ${m.team2PlayersToPlay.join(', ')}` : `- ${m.team2} has no players left`}
`).join('\n')}

Write a brief, entertaining summary of the gameweek. If matches are in progress, focus on the drama and what's still to come. If finished, summarize the results.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.8,
    })

    const summary = completion.choices[0]?.message?.content || 'Unable to generate summary.'

    return NextResponse.json({
      summary,
      status: gwStatus,
    })
  } catch (error) {
    console.error('Error generating GW summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary', details: String(error) },
      { status: 500 }
    )
  }
}
