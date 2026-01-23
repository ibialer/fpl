import {
  LeagueDetails,
  ElementStatusResponse,
  BootstrapStatic,
  TransactionsResponse,
  ManagerWithSquad,
  FixtureWithNames,
  TransactionWithDetails,
  Player,
  EntryPicksResponse,
  LiveEventResponse,
  TeamPointsBreakdown,
  DraftChoicesResponse,
  DraftChoice,
  WhatIfSquad,
  WhatIfPlayer,
  DeadlineInfo,
} from './types'

const LEAGUE_ID = 37265

// For server-side fetching, use the FPL API directly
// For client-side, use our proxy
const getBaseUrl = () => {
  if (typeof window === 'undefined') {
    return 'https://draft.premierleague.com/api'
  }
  return '/api/fpl'
}

export async function fetchLeagueDetails(): Promise<LeagueDetails> {
  const res = await fetch(`${getBaseUrl()}/league/${LEAGUE_ID}/details`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to fetch league details')
  return res.json()
}

export async function fetchElementStatus(): Promise<ElementStatusResponse> {
  const res = await fetch(`${getBaseUrl()}/league/${LEAGUE_ID}/element-status`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to fetch element status')
  return res.json()
}

export async function fetchBootstrapStatic(): Promise<BootstrapStatic> {
  const res = await fetch(`${getBaseUrl()}/bootstrap-static`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to fetch bootstrap data')
  return res.json()
}

export async function fetchTransactions(): Promise<TransactionsResponse> {
  const res = await fetch(`${getBaseUrl()}/draft/league/${LEAGUE_ID}/transactions`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to fetch transactions')
  return res.json()
}

export async function fetchEntryPicks(entryId: number, event: number): Promise<EntryPicksResponse> {
  const res = await fetch(`${getBaseUrl()}/entry/${entryId}/event/${event}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Failed to fetch picks for entry ${entryId}`)
  return res.json()
}

export async function fetchLiveEvent(event: number): Promise<LiveEventResponse> {
  const res = await fetch(`${getBaseUrl()}/event/${event}/live`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Failed to fetch live data for event ${event}`)
  return res.json()
}

export async function fetchDraftChoices(): Promise<DraftChoicesResponse> {
  const res = await fetch(`${getBaseUrl()}/draft/${LEAGUE_ID}/choices`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to fetch draft choices')
  return res.json()
}

// Fetch all data needed for the dashboard
export async function fetchAllData() {
  const [leagueDetails, elementStatus, bootstrapStatic, transactions] = await Promise.all([
    fetchLeagueDetails(),
    fetchElementStatus(),
    fetchBootstrapStatic(),
    fetchTransactions(),
  ])

  return {
    leagueDetails,
    elementStatus,
    bootstrapStatic,
    transactions,
  }
}

// Process data for components
export function processManagersWithSquads(
  leagueDetails: LeagueDetails,
  elementStatus: ElementStatusResponse,
  bootstrapStatic: BootstrapStatic
): ManagerWithSquad[] {
  const playersMap = new Map<number, Player>()
  bootstrapStatic.elements.forEach((p) => playersMap.set(p.id, p))

  // Map entry_id to owned players
  const ownershipMap = new Map<number, Player[]>()
  elementStatus.element_status.forEach((es) => {
    if (es.owner) {
      const player = playersMap.get(es.element)
      if (player) {
        const existing = ownershipMap.get(es.owner) || []
        existing.push(player)
        ownershipMap.set(es.owner, existing)
      }
    }
  })

  return leagueDetails.league_entries.map((entry) => {
    const standing = leagueDetails.standings.find((s) => s.league_entry === entry.id)!
    const squad = ownershipMap.get(entry.entry_id) || []

    // Sort squad by position
    squad.sort((a, b) => a.element_type - b.element_type)

    return {
      entry,
      standing,
      squad,
    }
  })
}

export function processFixtures(
  leagueDetails: LeagueDetails,
  currentEvent: number
): FixtureWithNames[] {
  return processAllMatches(leagueDetails).filter((m) => m.event === currentEvent)
}

export function processAllMatches(leagueDetails: LeagueDetails): FixtureWithNames[] {
  const entryMap = new Map<number, string>()
  const playerMap = new Map<number, string>()
  leagueDetails.league_entries.forEach((e) => {
    entryMap.set(e.id, e.entry_name)
    playerMap.set(e.id, `${e.player_first_name} ${e.player_last_name}`)
  })

  return leagueDetails.matches.map((m) => ({
    event: m.event,
    team1Id: m.league_entry_1,
    team1Name: entryMap.get(m.league_entry_1) || 'Unknown',
    team1PlayerName: playerMap.get(m.league_entry_1) || 'Unknown',
    team1Points: m.league_entry_1_points,
    team2Id: m.league_entry_2,
    team2Name: entryMap.get(m.league_entry_2) || 'Unknown',
    team2PlayerName: playerMap.get(m.league_entry_2) || 'Unknown',
    team2Points: m.league_entry_2_points,
    finished: m.finished,
    started: m.started,
    winner: m.winning_league_entry
      ? entryMap.get(m.winning_league_entry) || null
      : null,
  }))
}

export function processTransactions(
  transactions: TransactionsResponse,
  leagueDetails: LeagueDetails,
  bootstrapStatic: BootstrapStatic,
  currentEvent: number
): TransactionWithDetails[] {
  const entryMap = new Map<number, string>()
  leagueDetails.league_entries.forEach((e) => {
    entryMap.set(e.entry_id, `${e.player_first_name} ${e.player_last_name}`)
  })

  const teamsMap = new Map<number, string>()
  bootstrapStatic.teams.forEach((t) => {
    teamsMap.set(t.id, t.short_name)
  })

  const playersMap = new Map<number, { name: string; team: string; photo: string | null }>()
  bootstrapStatic.elements.forEach((p) => {
    playersMap.set(p.id, {
      name: p.web_name,
      team: teamsMap.get(p.team) || '',
      photo: p.code ? `https://resources.premierleague.com/premierleague/photos/players/110x140/p${p.code}.png` : null,
    })
  })

  // Filter only successful transactions from the current gameweek
  const filtered = transactions.transactions.filter(
    (t) => t.result === 'a' && t.event === currentEvent
  )

  // Separate waivers and free transfers
  const waivers = filtered
    .filter((t) => t.kind === 'w')
    .sort((a, b) => (a.index || 0) - (b.index || 0)) // Index ascending (processing order)

  const freeTransfers = filtered
    .filter((t) => t.kind === 'f')
    .sort((a, b) => new Date(a.added).getTime() - new Date(b.added).getTime()) // Date ascending (old to new)

  // Waivers first, then free transfers
  return [...waivers, ...freeTransfers].map((t) => ({
    id: t.id,
    event: t.event,
    managerName: entryMap.get(t.entry) || 'Unknown',
    playerIn: playersMap.get(t.element_in)?.name || 'Unknown',
    playerInTeam: playersMap.get(t.element_in)?.team || '',
    playerInPhoto: playersMap.get(t.element_in)?.photo || null,
    playerOut: playersMap.get(t.element_out)?.name || 'Unknown',
    playerOutTeam: playersMap.get(t.element_out)?.team || '',
    playerOutPhoto: playersMap.get(t.element_out)?.photo || null,
    type: t.kind === 'w' ? 'waiver' : 'free',
    date: new Date(t.added).toLocaleDateString(),
  }))
}

export function getCurrentEvent(bootstrapStatic: BootstrapStatic): number {
  return bootstrapStatic.events.current || 1
}

// Determine which GW's transactions to display
// After waiver deadline passes but before the GW starts, show the upcoming GW's transactions
export function getTransactionsEvent(
  currentEvent: number,
  deadlineInfo: DeadlineInfo
): number {
  const now = new Date()

  // If waiver deadline for next GW has passed and next GW is different from current
  if (
    deadlineInfo.waiverDeadline &&
    deadlineInfo.nextEvent > currentEvent &&
    now > new Date(deadlineInfo.waiverDeadline)
  ) {
    return deadlineInfo.nextEvent
  }

  return currentEvent
}

export function getDeadlineInfo(bootstrapStatic: BootstrapStatic): DeadlineInfo {
  const currentEvent = bootstrapStatic.events.current || 1
  const events = bootstrapStatic.events.data || []
  const now = new Date()

  // Find the next event with a deadline that hasn't passed yet
  // Sort events by id to ensure we go through them in order
  const sortedEvents = [...events].sort((a, b) => a.id - b.id)

  let nextEvent = sortedEvents.find((e) => {
    if (!e.deadline_time) return false
    const deadline = new Date(e.deadline_time)
    return deadline > now
  })

  // If no future deadline found, use the last event
  if (!nextEvent) {
    nextEvent = sortedEvents[sortedEvents.length - 1]
  }

  if (!nextEvent) {
    return {
      nextEvent: currentEvent,
      waiverDeadline: null,
      lineupDeadline: null,
    }
  }

  const lineupDeadline = nextEvent.deadline_time

  // Waiver deadline is typically ~24 hours before lineup deadline
  // In FPL Draft, waivers process on Friday, lineups lock when first match starts
  let waiverDeadline: string | null = null
  if (lineupDeadline) {
    const deadline = new Date(lineupDeadline)
    // Waiver deadline is approximately 24 hours before lineup deadline
    deadline.setHours(deadline.getHours() - 24)
    waiverDeadline = deadline.toISOString()
  }

  return {
    nextEvent: nextEvent.id,
    waiverDeadline,
    lineupDeadline,
  }
}

// Calculate standings from matches starting at a specific gameweek
export function calculateStandingsFromGameweek(
  leagueDetails: LeagueDetails,
  fromGameweek: number
): Map<number, { wins: number; draws: number; losses: number; pointsFor: number; pointsAgainst: number }> {
  const standings = new Map<number, { wins: number; draws: number; losses: number; pointsFor: number; pointsAgainst: number }>()

  // Initialize all entries
  leagueDetails.league_entries.forEach((entry) => {
    standings.set(entry.id, { wins: 0, draws: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 })
  })

  // Process matches from the specified gameweek onwards
  leagueDetails.matches
    .filter((m) => m.event >= fromGameweek && m.finished)
    .forEach((m) => {
      const team1 = standings.get(m.league_entry_1)!
      const team2 = standings.get(m.league_entry_2)!

      team1.pointsFor += m.league_entry_1_points
      team1.pointsAgainst += m.league_entry_2_points
      team2.pointsFor += m.league_entry_2_points
      team2.pointsAgainst += m.league_entry_1_points

      if (m.league_entry_1_points > m.league_entry_2_points) {
        team1.wins++
        team2.losses++
      } else if (m.league_entry_2_points > m.league_entry_1_points) {
        team2.wins++
        team1.losses++
      } else {
        team1.draws++
        team2.draws++
      }
    })

  return standings
}

// Calculate form (last N results) for each team
export type FormResult = 'W' | 'D' | 'L'

export function calculateTeamForm(
  leagueDetails: LeagueDetails,
  count: number = 5
): Map<number, FormResult[]> {
  const form = new Map<number, FormResult[]>()

  // Initialize all entries
  leagueDetails.league_entries.forEach((entry) => {
    form.set(entry.id, [])
  })

  // Get finished matches sorted by event (most recent first)
  const finishedMatches = leagueDetails.matches
    .filter((m) => m.finished)
    .sort((a, b) => b.event - a.event)

  // Process matches and build form for each team
  finishedMatches.forEach((m) => {
    const team1Form = form.get(m.league_entry_1)!
    const team2Form = form.get(m.league_entry_2)!

    let team1Result: FormResult
    let team2Result: FormResult

    if (m.league_entry_1_points > m.league_entry_2_points) {
      team1Result = 'W'
      team2Result = 'L'
    } else if (m.league_entry_2_points > m.league_entry_1_points) {
      team1Result = 'L'
      team2Result = 'W'
    } else {
      team1Result = 'D'
      team2Result = 'D'
    }

    // Only add if we haven't reached the count yet
    if (team1Form.length < count) {
      team1Form.push(team1Result)
    }
    if (team2Form.length < count) {
      team2Form.push(team2Result)
    }
  })

  return form
}

// Calculate head-to-head records between all pairs of teams
export interface H2HRecord {
  wins: number
  draws: number
  losses: number
  pointsFor: number
  pointsAgainst: number
}

export function calculateHeadToHead(
  leagueDetails: LeagueDetails
): Map<number, Map<number, H2HRecord>> {
  const h2h = new Map<number, Map<number, H2HRecord>>()

  // Initialize all entries
  leagueDetails.league_entries.forEach((entry1) => {
    const innerMap = new Map<number, H2HRecord>()
    leagueDetails.league_entries.forEach((entry2) => {
      if (entry1.id !== entry2.id) {
        innerMap.set(entry2.id, { wins: 0, draws: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 })
      }
    })
    h2h.set(entry1.id, innerMap)
  })

  // Process all finished matches
  leagueDetails.matches
    .filter((m) => m.finished)
    .forEach((m) => {
      const team1Record = h2h.get(m.league_entry_1)?.get(m.league_entry_2)
      const team2Record = h2h.get(m.league_entry_2)?.get(m.league_entry_1)

      if (team1Record && team2Record) {
        team1Record.pointsFor += m.league_entry_1_points
        team1Record.pointsAgainst += m.league_entry_2_points
        team2Record.pointsFor += m.league_entry_2_points
        team2Record.pointsAgainst += m.league_entry_1_points

        if (m.league_entry_1_points > m.league_entry_2_points) {
          team1Record.wins++
          team2Record.losses++
        } else if (m.league_entry_2_points > m.league_entry_1_points) {
          team1Record.losses++
          team2Record.wins++
        } else {
          team1Record.draws++
          team2Record.draws++
        }
      }
    })

  return h2h
}

export function getPositionName(elementType: number): string {
  switch (elementType) {
    case 1:
      return 'GK'
    case 2:
      return 'DEF'
    case 3:
      return 'MID'
    case 4:
      return 'FWD'
    default:
      return 'UNK'
  }
}

// Fetch and process points breakdown for all teams in the league
export async function fetchPointsBreakdown(
  leagueDetails: LeagueDetails,
  bootstrapStatic: BootstrapStatic,
  currentEvent: number
): Promise<Map<number, TeamPointsBreakdown>> {
  // Build lookup maps
  const playerDataMap = new Map<number, { name: string; team: number; elementType: number }>()
  bootstrapStatic.elements.forEach((p) => {
    playerDataMap.set(p.id, { name: p.web_name, team: p.team, elementType: p.element_type })
  })

  const teamShortNameMap = new Map<number, string>()
  bootstrapStatic.teams.forEach((t) => teamShortNameMap.set(t.id, t.short_name))

  // Fetch live event data (includes fixtures for current GW)
  const liveData = await fetchLiveEvent(currentEvent)

  // Build fixture lookup: team -> opponent info from live event data
  const fixtureMap = new Map<number, { opponent: number; isHome: boolean; started: boolean }>()
  liveData.fixtures.forEach((f) => {
    fixtureMap.set(f.team_h, { opponent: f.team_a, isHome: true, started: f.started })
    fixtureMap.set(f.team_a, { opponent: f.team_h, isHome: false, started: f.started })
  })

  // Fetch picks for all entries in parallel
  const entryIds = leagueDetails.league_entries.map((e) => e.entry_id)
  const picksPromises = entryIds.map((id) => fetchEntryPicks(id, currentEvent))
  const allPicks = await Promise.all(picksPromises)

  const breakdownMap = new Map<number, TeamPointsBreakdown>()

  leagueDetails.league_entries.forEach((entry, index) => {
    const picks = allPicks[index].picks
    const players = picks.map((pick) => {
      const elementData = liveData.elements[String(pick.element)]
      const playerData = playerDataMap.get(pick.element)
      const fixtureInfo = playerData ? fixtureMap.get(playerData.team) : null
      const stats = elementData?.stats

      return {
        name: playerData?.name || 'Unknown',
        points: stats?.total_points || 0,
        position: pick.position,
        isBenched: pick.position > 11,
        positionName: playerData ? getPositionName(playerData.elementType) : 'UNK',
        teamShortName: playerData ? (teamShortNameMap.get(playerData.team) || '???') : '???',
        opponentShortName: fixtureInfo ? (teamShortNameMap.get(fixtureInfo.opponent) || '???') : '???',
        isHome: fixtureInfo?.isHome || false,
        goals: stats?.goals_scored || 0,
        assists: stats?.assists || 0,
        cleanSheet: (stats?.clean_sheets || 0) > 0,
        bonus: stats?.bonus || 0,
        yellowCards: stats?.yellow_cards || 0,
        redCards: stats?.red_cards || 0,
        hasPlayed: fixtureInfo?.started || false,
        defensiveContribution: stats?.defensive_contribution || 0,
      }
    })

    // Sort by position (starters first, then bench)
    players.sort((a, b) => a.position - b.position)

    // Calculate total points (only starters count)
    const totalPoints = players
      .filter((p) => !p.isBenched)
      .reduce((sum, p) => sum + p.points, 0)

    breakdownMap.set(entry.id, {
      entryId: entry.id,
      teamName: entry.entry_name,
      playerName: `${entry.player_first_name} ${entry.player_last_name}`,
      totalPoints,
      players,
    })
  })

  return breakdownMap
}

// Fetch points breakdown for all finished gameweeks
export async function fetchAllPointsBreakdown(
  leagueDetails: LeagueDetails,
  bootstrapStatic: BootstrapStatic,
  currentEvent: number
): Promise<Map<number, Map<number, TeamPointsBreakdown>>> {
  // Get all finished gameweeks from matches
  const finishedEvents = new Set<number>()
  leagueDetails.matches.forEach((m) => {
    if (m.finished) {
      finishedEvents.add(m.event)
    }
  })

  // Also include current event if it has started
  const currentMatch = leagueDetails.matches.find((m) => m.event === currentEvent && m.started)
  if (currentMatch) {
    finishedEvents.add(currentEvent)
  }

  const events = Array.from(finishedEvents).sort((a, b) => b - a)

  // Fetch breakdown for each event in parallel
  const breakdownPromises = events.map(async (event) => {
    try {
      const breakdown = await fetchPointsBreakdown(leagueDetails, bootstrapStatic, event)
      return { event, breakdown }
    } catch (e) {
      console.error(`Failed to fetch breakdown for GW ${event}:`, e)
      return { event, breakdown: new Map<number, TeamPointsBreakdown>() }
    }
  })

  const results = await Promise.all(breakdownPromises)

  // Build nested map: event -> entryId -> breakdown
  const allBreakdowns = new Map<number, Map<number, TeamPointsBreakdown>>()
  results.forEach(({ event, breakdown }) => {
    allBreakdowns.set(event, breakdown)
  })

  return allBreakdowns
}

// Process original draft squads for What If analysis
export function processWhatIfSquads(
  draftChoices: DraftChoice[],
  bootstrapStatic: BootstrapStatic,
  leagueDetails: LeagueDetails
): WhatIfSquad[] {
  // Build player lookup map
  const playerMap = new Map<number, Player>()
  bootstrapStatic.elements.forEach((p) => playerMap.set(p.id, p))

  // Build team short name map
  const teamShortNameMap = new Map<number, string>()
  bootstrapStatic.teams.forEach((t) => teamShortNameMap.set(t.id, t.short_name))

  // Build entry info map
  const entryMap = new Map<number, { teamName: string; managerName: string }>()
  leagueDetails.league_entries.forEach((e) => {
    entryMap.set(e.entry_id, {
      teamName: e.entry_name,
      managerName: `${e.player_first_name} ${e.player_last_name}`,
    })
  })

  // Group draft choices by entry
  const choicesByEntry = new Map<number, DraftChoice[]>()
  draftChoices.forEach((choice) => {
    const existing = choicesByEntry.get(choice.entry) || []
    existing.push(choice)
    choicesByEntry.set(choice.entry, existing)
  })

  // Build What If squads
  const squads: WhatIfSquad[] = []

  choicesByEntry.forEach((choices, entryId) => {
    const entryInfo = entryMap.get(entryId)
    if (!entryInfo) return

    // Sort choices by round
    choices.sort((a, b) => a.round - b.round)

    const players: WhatIfPlayer[] = choices.map((choice) => {
      const player = playerMap.get(choice.element)
      return {
        id: choice.element,
        name: player?.web_name || 'Unknown',
        positionName: player ? getPositionName(player.element_type) : 'UNK',
        teamShortName: player ? (teamShortNameMap.get(player.team) || '???') : '???',
        totalPoints: player?.total_points || 0,
        draftRound: choice.round,
      }
    })

    // Players are already sorted by draft round order

    const totalPoints = players.reduce((sum, p) => sum + p.totalPoints, 0)

    squads.push({
      entryId,
      teamName: entryInfo.teamName,
      managerName: entryInfo.managerName,
      players,
      totalPoints,
    })
  })

  // Sort squads by total points descending
  squads.sort((a, b) => b.totalPoints - a.totalPoints)

  return squads
}
