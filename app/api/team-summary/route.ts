import OpenAI from 'openai'

let openai: OpenAI | null = null
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openai
}

interface RivalrySummary {
  opponentName: string
  wins: number
  draws: number
  losses: number
}

interface DraftHighlight {
  name: string
  round: number
  totalPoints: number
  deltaFromRoundAvg: number
}

interface TeamSummaryRequest {
  entryId: number
  teamName: string
  managerName: string
  currentRank: number
  record: { wins: number; draws: number; losses: number }
  totalPoints: number
  bestGW: { event: number; points: number } | null
  worstGW: { event: number; points: number } | null
  benchPoints: number
  avgGWPoints: number
  form: string
  rivalries: RivalrySummary[]
  draftHits: DraftHighlight[]
  draftMisses: DraftHighlight[]
}

export async function POST(request: Request) {
  try {
    const data: TeamSummaryRequest = await request.json()

    const systemPrompt = `You are a witty sports commentator for a Fantasy Premier League draft league called "Hogwarts".
Write engaging, fun season narratives for individual managers. Use a casual, entertaining tone.
Keep it to 3-4 sentences total.
Reference specific player performances, draft picks, rivalries, or form streaks to bring the narrative to life.
Name at least one specific high and one specific low.
Don't use emojis.`

    const rivalryLines = data.rivalries
      .slice(0, 3)
      .map((r) => `  vs ${r.opponentName}: ${r.wins}W-${r.draws}D-${r.losses}L`)
      .join('\n')

    const hitsText = data.draftHits.length > 0
      ? data.draftHits.map((h) => `${h.name} (round ${h.round}, ${h.totalPoints} pts, +${h.deltaFromRoundAvg.toFixed(0)} vs avg)`).join('; ')
      : 'none'

    const missesText = data.draftMisses.length > 0
      ? data.draftMisses.map((h) => `${h.name} (round ${h.round}, ${h.totalPoints} pts, ${h.deltaFromRoundAvg.toFixed(0)} vs avg)`).join('; ')
      : 'none'

    const bestGWText = data.bestGW ? `GW${data.bestGW.event} (${data.bestGW.points} pts)` : 'N/A'
    const worstGWText = data.worstGW ? `GW${data.worstGW.event} (${data.worstGW.points} pts)` : 'N/A'

    const userPrompt = `Write a season narrative for this manager:

Team: ${data.teamName} (manager ${data.managerName})
Current rank: ${data.currentRank}
Record: ${data.record.wins}W-${data.record.draws}D-${data.record.losses}L
Total points: ${data.totalPoints}
Average GW: ${data.avgGWPoints.toFixed(1)}
Best GW: ${bestGWText}
Worst GW: ${worstGWText}
Left on bench this season: ${data.benchPoints} pts
Recent form (last 5): ${data.form || 'N/A'}

Rivalries:
${rivalryLines || '  none'}

Draft hits (outperformed their round): ${hitsText}
Draft misses (underperformed their round): ${missesText}

Write 3-4 entertaining sentences summarizing the season so far. Name specific players and rivalries. Don't just list stats - tell a story.`

    const stream = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 400,
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
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
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
    console.error('Error generating team summary:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate summary', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
