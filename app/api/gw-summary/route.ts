import OpenAI from 'openai'
import { FixtureWithNames, PlayerPoints, TeamPointsBreakdown } from '@/lib/types'
import { FormResult, H2HRecord, LuckMetricsData } from '@/lib/api'

// Lazy initialization to avoid build-time errors when OPENAI_API_KEY is not set
let openai: OpenAI | null = null
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

interface GWSummaryRequest {
  currentEvent: number
  fixtures: FixtureWithNames[]
  pointsBreakdown: Record<number, TeamPointsBreakdown>
  form?: Record<number, FormResult[]>
  h2h?: Record<number, Record<number, H2HRecord>>
  luckMetrics?: LuckMetricsData[]
}

function formatPlayerStats(p: PlayerPoints): string {
  const parts: string[] = [`${p.name} (${p.positionName}, ${p.teamShortName}) ${p.points}pts`]
  const stats: string[] = []
  if (p.goals > 0) stats.push(`${p.goals}G`)
  if (p.assists > 0) stats.push(`${p.assists}A`)
  if (p.cleanSheet) stats.push('CS')
  if (p.bonus > 0) stats.push(`${p.bonus}BP`)
  if (p.yellowCards > 0) stats.push('YC')
  if (p.redCards > 0) stats.push('RC')
  if (stats.length > 0) parts.push(`[${stats.join(', ')}]`)
  return parts.join(' ')
}

export async function POST(request: Request) {
  try {
    const { currentEvent, fixtures, pointsBreakdown, form, h2h, luckMetrics }: GWSummaryRequest = await request.json()

    // Determine GW status
    const allFinished = fixtures.every((f) => f.finished)
    const anyStarted = fixtures.some((f) => f.started)
    const gwStatus = allFinished ? 'finished' : anyStarted ? 'in_progress' : 'not_started'

    if (gwStatus === 'not_started') {
      const encoder = new TextEncoder()
      const msg = `Gameweek ${currentEvent} hasn't started yet. Check back once the first match kicks off!`
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: msg, status: gwStatus })}\n\n`))
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          },
        }),
        { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } }
      )
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

      // Use calculated points from breakdown during live GW, API points when finished
      const isLive = fixture.started && !fixture.finished
      const team1Points = isLive && team1Breakdown ? team1Breakdown.totalPoints : fixture.team1Points
      const team2Points = isLive && team2Breakdown ? team2Breakdown.totalPoints : fixture.team2Points

      // Top 3 scorers per team (more context than just the top 1)
      const team1Top = [...team1Played].sort((a, b) => b.points - a.points).slice(0, 3)
      const team2Top = [...team2Played].sort((a, b) => b.points - a.points).slice(0, 3)

      // Form strings
      const team1Form = form?.[fixture.team1Id]
      const team2Form = form?.[fixture.team2Id]

      // H2H record
      const h2hRecord = h2h?.[fixture.team1Id]?.[fixture.team2Id]

      return { fixture, team1Points, team2Points, team1Top, team2Top, team1ToPlay, team2ToPlay, team1Form, team2Form, h2hRecord }
    })

    // Build luck context
    const luckByTeam = new Map<number, LuckMetricsData>()
    if (luckMetrics) {
      for (const lm of luckMetrics) luckByTeam.set(lm.entryId, lm)
    }

    // Build the prompt
    const systemPrompt = `You are a witty sports commentator for a Fantasy Premier League draft league called "Hogwarts".
Write engaging, fun summaries of the gameweek matchups. Use a casual, entertaining tone.
Keep it concise - 2-3 sentences per match maximum.
Reference specific player performances (goals, assists, clean sheets, bonus points) to make it vivid.
If a match is still in progress, mention who's leading and any exciting players yet to play.
If someone has already won (big lead, no players left for opponent), declare the victory.
When relevant, weave in form streaks, head-to-head history, or luck index to add narrative depth.
Don't use emojis.`

    const matchLines = matchContexts.map((m, i) => {
      const f = m.fixture
      const status = f.finished ? 'FINISHED' : f.started ? 'LIVE' : 'Not started'
      const lines = [
        `Match ${i + 1}: ${f.team1Name} (${f.team1PlayerName}) ${m.team1Points} - ${m.team2Points} ${f.team2Name} (${f.team2PlayerName}) [${status}]`,
      ]

      if (m.team1Top.length > 0)
        lines.push(`  ${f.team1Name} top performers: ${m.team1Top.map(formatPlayerStats).join('; ')}`)
      if (m.team2Top.length > 0)
        lines.push(`  ${f.team2Name} top performers: ${m.team2Top.map(formatPlayerStats).join('; ')}`)

      if (m.team1ToPlay.length > 0)
        lines.push(`  ${f.team1Name} yet to play: ${m.team1ToPlay.map((p) => `${p.name} (${p.teamShortName})`).join(', ')}`)
      else
        lines.push(`  ${f.team1Name} has no players left`)
      if (m.team2ToPlay.length > 0)
        lines.push(`  ${f.team2Name} yet to play: ${m.team2ToPlay.map((p) => `${p.name} (${p.teamShortName})`).join(', ')}`)
      else
        lines.push(`  ${f.team2Name} has no players left`)

      if (m.team1Form)
        lines.push(`  ${f.team1Name} form (last 5): ${m.team1Form.join('')}`)
      if (m.team2Form)
        lines.push(`  ${f.team2Name} form (last 5): ${m.team2Form.join('')}`)

      if (m.h2hRecord)
        lines.push(`  H2H record (${f.team1Name} perspective): ${m.h2hRecord.wins}W-${m.h2hRecord.draws}D-${m.h2hRecord.losses}L`)

      const luck1 = luckByTeam.get(f.team1Id)
      const luck2 = luckByTeam.get(f.team2Id)
      if (luck1) lines.push(`  ${f.team1Name} luck index: ${luck1.luckIndex.toFixed(1)} (${luck1.luckyWins} lucky wins, ${luck1.unluckyLosses} unlucky losses)`)
      if (luck2) lines.push(`  ${f.team2Name} luck index: ${luck2.luckIndex.toFixed(1)} (${luck2.luckyWins} lucky wins, ${luck2.unluckyLosses} unlucky losses)`)

      return lines.join('\n')
    })

    const userPrompt = `Summarize Gameweek ${currentEvent} for our FPL draft league.

Status: ${gwStatus === 'finished' ? 'All matches complete' : 'Matches in progress'}

${matchLines.join('\n\n')}

Write a brief, entertaining summary. Reference specific player stats to bring the action to life. If matches are in progress, focus on drama and what's still to come. If finished, summarize results. Use form, H2H history, and luck index where they add to the narrative.`

    // Stream the response
    const stream = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.8,
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text, status: gwStatus })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error generating GW summary:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate summary', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
