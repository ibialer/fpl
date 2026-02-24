/**
 * FPL Draft League - Luck Analysis
 *
 * Run with: npx tsx scripts/luck-analysis.ts
 *
 * Analyzes H2H luck by computing:
 * 1. Close wins/losses (margin <= 5 points)
 * 2. Close wins/losses (margin <= 10 points)
 * 3. "Lucky wins" - wins where your score ranked 4th-6th among all 6 teams that GW
 *    (you beat your opponent but most other teams scored higher)
 * 4. "Unlucky losses" - losses where your score ranked 1st-3rd among all 6 teams
 *    (you lost but most other teams scored lower)
 */

const LEAGUE_ID = 37265
const API_BASE = 'https://draft.premierleague.com/api'

interface Match {
  event: number
  finished: boolean
  started: boolean
  league_entry_1: number
  league_entry_1_points: number
  league_entry_2: number
  league_entry_2_points: number
  winning_league_entry: number | null
}

interface LeagueEntry {
  id: number
  entry_name: string
  player_first_name: string
  player_last_name: string
}

interface ManagerStats {
  name: string
  teamName: string
  totalWins: number
  totalLosses: number
  totalDraws: number
  winsUpTo5: number
  winsUpTo10: number
  lossesUpTo5: number
  lossesUpTo10: number
  winsWithBottomHalfScore: number // won but scored in rank 4-6
  lossesWithTopHalfScore: number  // lost but scored in rank 1-3
}

async function main() {
  console.log('Fetching league data...\n')

  const res = await fetch(`${API_BASE}/league/${LEAGUE_ID}/details`)
  if (!res.ok) {
    console.error(`Failed to fetch league data: ${res.status} ${res.statusText}`)
    process.exit(1)
  }
  const data = await res.json()

  const entries: LeagueEntry[] = data.league_entries
  const matches: Match[] = data.matches

  // Build name maps
  const nameMap = new Map<number, string>()
  const teamNameMap = new Map<number, string>()
  entries.forEach(e => {
    nameMap.set(e.id, `${e.player_first_name} ${e.player_last_name}`)
    teamNameMap.set(e.id, e.entry_name)
  })

  // Only finished matches
  const finishedMatches = matches.filter(m => m.finished)

  // Group matches by gameweek
  const matchesByGW = new Map<number, Match[]>()
  finishedMatches.forEach(m => {
    const existing = matchesByGW.get(m.event) || []
    existing.push(m)
    matchesByGW.set(m.event, existing)
  })

  // Initialize stats per manager
  const stats = new Map<number, ManagerStats>()
  entries.forEach(e => {
    stats.set(e.id, {
      name: nameMap.get(e.id)!,
      teamName: teamNameMap.get(e.id)!,
      totalWins: 0,
      totalLosses: 0,
      totalDraws: 0,
      winsUpTo5: 0,
      winsUpTo10: 0,
      lossesUpTo5: 0,
      lossesUpTo10: 0,
      winsWithBottomHalfScore: 0,
      lossesWithTopHalfScore: 0,
    })
  })

  // Process each gameweek
  for (const [gw, gwMatches] of matchesByGW) {
    // Collect all team scores for this GW to determine rankings
    const scores: { teamId: number; points: number }[] = []
    gwMatches.forEach(m => {
      scores.push({ teamId: m.league_entry_1, points: m.league_entry_1_points })
      scores.push({ teamId: m.league_entry_2, points: m.league_entry_2_points })
    })

    // Rank teams by points (highest = rank 1)
    scores.sort((a, b) => b.points - a.points)
    const rankMap = new Map<number, number>()
    scores.forEach((s, i) => {
      rankMap.set(s.teamId, i + 1)
    })

    // Process each match
    gwMatches.forEach(m => {
      const p1 = m.league_entry_1_points
      const p2 = m.league_entry_2_points
      const diff = Math.abs(p1 - p2)

      const s1 = stats.get(m.league_entry_1)!
      const s2 = stats.get(m.league_entry_2)!

      const rank1 = rankMap.get(m.league_entry_1)!
      const rank2 = rankMap.get(m.league_entry_2)!

      if (p1 > p2) {
        // Team 1 wins
        s1.totalWins++
        s2.totalLosses++

        if (diff <= 5) { s1.winsUpTo5++; s2.lossesUpTo5++ }
        if (diff <= 10) { s1.winsUpTo10++; s2.lossesUpTo10++ }

        // Lucky win: won but scored in bottom half (rank 4-6 of 6 teams)
        if (rank1 >= 4) s1.winsWithBottomHalfScore++
        // Unlucky loss: lost but scored in top half (rank 1-3)
        if (rank2 <= 3) s2.lossesWithTopHalfScore++
      } else if (p2 > p1) {
        // Team 2 wins
        s2.totalWins++
        s1.totalLosses++

        if (diff <= 5) { s2.winsUpTo5++; s1.lossesUpTo5++ }
        if (diff <= 10) { s2.winsUpTo10++; s1.lossesUpTo10++ }

        if (rank2 >= 4) s2.winsWithBottomHalfScore++
        if (rank1 <= 3) s1.lossesWithTopHalfScore++
      } else {
        // Draw
        s1.totalDraws++
        s2.totalDraws++
      }
    })
  }

  // Print results
  const totalGWs = matchesByGW.size
  const allStats = Array.from(stats.values())

  console.log('='.repeat(80))
  console.log('  FPL DRAFT LEAGUE - LUCK ANALYSIS')
  console.log('='.repeat(80))
  console.log(`  League: ${data.league.name}`)
  console.log(`  Finished Gameweeks: ${totalGWs}`)
  console.log(`  Teams: ${entries.length}`)
  console.log('='.repeat(80))

  // --- Table 1: Close Wins (<=5 pts) ---
  console.log('\n1) CLOSE WINS & LOSSES (margin <= 5 points)')
  console.log('-'.repeat(80))
  console.log(
    'Manager'.padEnd(22) +
    'Team'.padEnd(22) +
    'W<=5'.padEnd(8) +
    'L<=5'.padEnd(8) +
    'Net'.padEnd(8) +
    'Record (W/D/L)'
  )
  console.log('-'.repeat(80))
  const by5 = [...allStats].sort((a, b) => (b.winsUpTo5 - b.lossesUpTo5) - (a.winsUpTo5 - a.lossesUpTo5))
  by5.forEach(s => {
    const net = s.winsUpTo5 - s.lossesUpTo5
    console.log(
      s.name.padEnd(22) +
      s.teamName.substring(0, 20).padEnd(22) +
      String(s.winsUpTo5).padEnd(8) +
      String(s.lossesUpTo5).padEnd(8) +
      (net >= 0 ? `+${net}` : `${net}`).padEnd(8) +
      `${s.totalWins}/${s.totalDraws}/${s.totalLosses}`
    )
  })

  // --- Table 2: Close Wins (<=10 pts) ---
  console.log('\n2) CLOSE WINS & LOSSES (margin <= 10 points)')
  console.log('-'.repeat(80))
  console.log(
    'Manager'.padEnd(22) +
    'Team'.padEnd(22) +
    'W<=10'.padEnd(8) +
    'L<=10'.padEnd(8) +
    'Net'.padEnd(8) +
    'Record (W/D/L)'
  )
  console.log('-'.repeat(80))
  const by10 = [...allStats].sort((a, b) => (b.winsUpTo10 - b.lossesUpTo10) - (a.winsUpTo10 - a.lossesUpTo10))
  by10.forEach(s => {
    const net = s.winsUpTo10 - s.lossesUpTo10
    console.log(
      s.name.padEnd(22) +
      s.teamName.substring(0, 20).padEnd(22) +
      String(s.winsUpTo10).padEnd(8) +
      String(s.lossesUpTo10).padEnd(8) +
      (net >= 0 ? `+${net}` : `${net}`).padEnd(8) +
      `${s.totalWins}/${s.totalDraws}/${s.totalLosses}`
    )
  })

  // --- Table 3: Opponent Luck ---
  console.log('\n3) OPPONENT LUCK (scored in bottom half but won / scored in top half but lost)')
  console.log('-'.repeat(90))
  console.log(
    'Manager'.padEnd(22) +
    'Team'.padEnd(22) +
    'Lucky W'.padEnd(10) +
    'Unlucky L'.padEnd(12) +
    'Net Luck'.padEnd(10) +
    'Record (W/D/L)'
  )
  console.log('-'.repeat(90))
  const byLuck = [...allStats].sort((a, b) =>
    (b.winsWithBottomHalfScore - b.lossesWithTopHalfScore) -
    (a.winsWithBottomHalfScore - a.lossesWithTopHalfScore)
  )
  byLuck.forEach(s => {
    const net = s.winsWithBottomHalfScore - s.lossesWithTopHalfScore
    console.log(
      s.name.padEnd(22) +
      s.teamName.substring(0, 20).padEnd(22) +
      String(s.winsWithBottomHalfScore).padEnd(10) +
      String(s.lossesWithTopHalfScore).padEnd(12) +
      (net >= 0 ? `+${net}` : `${net}`).padEnd(10) +
      `${s.totalWins}/${s.totalDraws}/${s.totalLosses}`
    )
  })

  // --- Composite Ranking ---
  console.log('\n' + '='.repeat(90))
  console.log('  COMPOSITE LUCK RANKING')
  console.log('  Score = (Lucky Wins - Unlucky Losses) + (Close Wins<=5 - Close Losses<=5)')
  console.log('='.repeat(90))
  console.log(
    '#'.padEnd(4) +
    'Manager'.padEnd(22) +
    'Team'.padEnd(22) +
    'Score'.padEnd(8) +
    'Lucky W'.padEnd(10) +
    'Unlucky L'.padEnd(12) +
    'W<=5'.padEnd(7) +
    'L<=5'.padEnd(7)
  )
  console.log('-'.repeat(90))
  const byComposite = [...allStats].sort((a, b) => {
    const sa = (a.winsWithBottomHalfScore - a.lossesWithTopHalfScore) + (a.winsUpTo5 - a.lossesUpTo5)
    const sb = (b.winsWithBottomHalfScore - b.lossesWithTopHalfScore) + (b.winsUpTo5 - b.lossesUpTo5)
    return sb - sa
  })
  byComposite.forEach((s, i) => {
    const score = (s.winsWithBottomHalfScore - s.lossesWithTopHalfScore) + (s.winsUpTo5 - s.lossesUpTo5)
    console.log(
      String(i + 1).padEnd(4) +
      s.name.padEnd(22) +
      s.teamName.substring(0, 20).padEnd(22) +
      (score >= 0 ? `+${score}` : `${score}`).padEnd(8) +
      String(s.winsWithBottomHalfScore).padEnd(10) +
      String(s.lossesWithTopHalfScore).padEnd(12) +
      String(s.winsUpTo5).padEnd(7) +
      String(s.lossesUpTo5).padEnd(7)
    )
  })

  console.log('\n' + '-'.repeat(90))
  console.log('Legend:')
  console.log('  W<=5 / L<=5   = Wins/Losses decided by 5 points or fewer')
  console.log('  W<=10 / L<=10 = Wins/Losses decided by 10 points or fewer')
  console.log('  Lucky W       = Wins where your score ranked 4th-6th out of 6 teams that GW')
  console.log('  Unlucky L     = Losses where your score ranked 1st-3rd out of 6 teams that GW')
  console.log('  Net Luck      = Lucky Wins minus Unlucky Losses (positive = lucky)')
  console.log('')
}

main().catch(console.error)
