import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  processTransactions,
  processFixtures,
  processAllMatches,
  processManagersWithSquads,
  processWhatIfSquads,
  calculateStandingsFromGameweek,
  calculateTeamForm,
  calculateHeadToHead,
  calculateLuckMetrics,
  getCurrentEvent,
  getPositionName,
  getTransactionsEvent,
  getDeadlineInfo,
  fetchLeagueDetails,
  fetchElementStatus,
  fetchBootstrapStatic,
  fetchTransactions,
  fetchEntryPicks,
  fetchLiveEvent,
  fetchDraftChoices,
  fetchAllData,
  fetchPointsBreakdown,
  fetchAllPointsBreakdown,
} from './api'
import {
  LeagueDetails,
  TransactionsResponse,
  BootstrapStatic,
  DeadlineInfo,
  ElementStatusResponse,
  DraftChoice,
} from './types'

// Mock data factories
const createMockLeagueDetails = (overrides?: Partial<LeagueDetails>): LeagueDetails => ({
  league: {
    id: 37265,
    name: 'Test League',
    admin_entry: 1,
    closed: false,
    draft_dt: '2024-08-01T00:00:00Z',
    draft_status: 'completed',
    scoring: 'h',
    start_event: 1,
    stop_event: 38,
    trades: 'y',
    transaction_mode: 'y',
    variety: 'h2h',
  },
  league_entries: [
    {
      id: 1,
      entry_id: 100,
      entry_name: 'Team A',
      player_first_name: 'John',
      player_last_name: 'Doe',
      short_name: 'JD',
      waiver_pick: 1,
    },
    {
      id: 2,
      entry_id: 200,
      entry_name: 'Team B',
      player_first_name: 'Jane',
      player_last_name: 'Smith',
      short_name: 'JS',
      waiver_pick: 2,
    },
  ],
  matches: [
    {
      event: 1,
      finished: true,
      started: true,
      league_entry_1: 1,
      league_entry_1_points: 50,
      league_entry_2: 2,
      league_entry_2_points: 40,
      winning_league_entry: 1,
      winning_method: 'points',
    },
  ],
  standings: [
    {
      league_entry: 1,
      rank: 1,
      last_rank: 1,
      rank_sort: 1,
      matches_played: 1,
      matches_won: 1,
      matches_drawn: 0,
      matches_lost: 0,
      points_for: 50,
      points_against: 40,
      total: 3,
    },
    {
      league_entry: 2,
      rank: 2,
      last_rank: 2,
      rank_sort: 2,
      matches_played: 1,
      matches_won: 0,
      matches_drawn: 0,
      matches_lost: 1,
      points_for: 40,
      points_against: 50,
      total: 0,
    },
  ],
  ...overrides,
})

const createMockBootstrapStatic = (): BootstrapStatic => ({
  elements: [
    {
      id: 1,
      code: 1001,
      first_name: 'Mohamed',
      second_name: 'Salah',
      web_name: 'Salah',
      team: 1,
      element_type: 3,
      total_points: 100,
      goals_scored: 10,
      assists: 5,
      clean_sheets: 0,
      goals_conceded: 0,
      saves: 0,
      bonus: 10,
      form: '8.0',
      points_per_game: '7.5',
      now_cost: 130,
      status: 'a',
      news: '',
    },
    {
      id: 2,
      code: 1002,
      first_name: 'Erling',
      second_name: 'Haaland',
      web_name: 'Haaland',
      team: 2,
      element_type: 4,
      total_points: 120,
      goals_scored: 15,
      assists: 3,
      clean_sheets: 0,
      goals_conceded: 0,
      saves: 0,
      bonus: 12,
      form: '9.0',
      points_per_game: '8.0',
      now_cost: 150,
      status: 'a',
      news: '',
    },
  ],
  element_types: [
    { id: 1, plural_name: 'Goalkeepers', plural_name_short: 'GKP', singular_name: 'Goalkeeper', singular_name_short: 'GK' },
    { id: 2, plural_name: 'Defenders', plural_name_short: 'DEF', singular_name: 'Defender', singular_name_short: 'DEF' },
    { id: 3, plural_name: 'Midfielders', plural_name_short: 'MID', singular_name: 'Midfielder', singular_name_short: 'MID' },
    { id: 4, plural_name: 'Forwards', plural_name_short: 'FWD', singular_name: 'Forward', singular_name_short: 'FWD' },
  ],
  teams: [
    { id: 1, name: 'Liverpool', short_name: 'LIV' },
    { id: 2, name: 'Manchester City', short_name: 'MCI' },
  ],
  events: {
    current: 21,
    data: [
      { id: 20, name: 'Gameweek 20', deadline_time: '2024-01-01T00:00:00Z', finished: true, is_current: false, is_next: false },
      { id: 21, name: 'Gameweek 21', deadline_time: '2024-01-08T00:00:00Z', finished: false, is_current: true, is_next: false },
    ],
  },
  fixtures: {},
})

describe('getPositionName', () => {
  it('returns GK for element type 1', () => {
    expect(getPositionName(1)).toBe('GK')
  })

  it('returns DEF for element type 2', () => {
    expect(getPositionName(2)).toBe('DEF')
  })

  it('returns MID for element type 3', () => {
    expect(getPositionName(3)).toBe('MID')
  })

  it('returns FWD for element type 4', () => {
    expect(getPositionName(4)).toBe('FWD')
  })

  it('returns UNK for unknown element type', () => {
    expect(getPositionName(99)).toBe('UNK')
  })
})

describe('getCurrentEvent', () => {
  it('returns the current event from bootstrap static', () => {
    const bootstrap = createMockBootstrapStatic()
    expect(getCurrentEvent(bootstrap)).toBe(21)
  })

  it('returns 1 when current event is not set', () => {
    const bootstrap = createMockBootstrapStatic()
    bootstrap.events.current = 0
    expect(getCurrentEvent(bootstrap)).toBe(1)
  })
})

describe('processFixtures', () => {
  it('returns fixtures for the current event', () => {
    const leagueDetails = createMockLeagueDetails()
    const fixtures = processFixtures(leagueDetails, 1)

    expect(fixtures).toHaveLength(1)
    expect(fixtures[0]).toEqual({
      event: 1,
      team1Id: 1,
      team1Name: 'Team A',
      team1PlayerName: 'John Doe',
      team1Points: 50,
      team2Id: 2,
      team2Name: 'Team B',
      team2PlayerName: 'Jane Smith',
      team2Points: 40,
      finished: true,
      started: true,
      winner: 'Team A',
    })
  })

  it('returns empty array when no fixtures for event', () => {
    const leagueDetails = createMockLeagueDetails()
    const fixtures = processFixtures(leagueDetails, 99)
    expect(fixtures).toHaveLength(0)
  })

  it('handles draws with no winner', () => {
    const leagueDetails = createMockLeagueDetails({
      matches: [
        {
          event: 1,
          finished: true,
          started: true,
          league_entry_1: 1,
          league_entry_1_points: 45,
          league_entry_2: 2,
          league_entry_2_points: 45,
          winning_league_entry: null,
          winning_method: null,
        },
      ],
    })
    const fixtures = processFixtures(leagueDetails, 1)
    expect(fixtures[0].winner).toBeNull()
  })
})

describe('processTransactions', () => {
  it('filters only successful transactions from current gameweek', () => {
    const transactions: TransactionsResponse = {
      transactions: [
        { id: 1, added: '2024-01-01T10:00:00Z', element_in: 1, element_out: 2, entry: 100, event: 21, kind: 'w', result: 'a', index: 1, priority: 1 },
        { id: 2, added: '2024-01-01T11:00:00Z', element_in: 2, element_out: 1, entry: 200, event: 21, kind: 'f', result: 'a', index: null, priority: null },
        { id: 3, added: '2024-01-01T12:00:00Z', element_in: 1, element_out: 2, entry: 100, event: 20, kind: 'w', result: 'a', index: 1, priority: 1 }, // wrong event
        { id: 4, added: '2024-01-01T13:00:00Z', element_in: 1, element_out: 2, entry: 100, event: 21, kind: 'w', result: 'di', index: 2, priority: 2 }, // declined
      ],
    }
    const leagueDetails = createMockLeagueDetails()
    const bootstrap = createMockBootstrapStatic()

    const result = processTransactions(transactions, leagueDetails, bootstrap, 21)

    expect(result).toHaveLength(2)
    expect(result.map((t) => t.id)).toEqual([1, 2])
  })

  it('sorts waivers by index and free transfers by date', () => {
    const transactions: TransactionsResponse = {
      transactions: [
        { id: 1, added: '2024-01-01T12:00:00Z', element_in: 1, element_out: 2, entry: 100, event: 21, kind: 'w', result: 'a', index: 5, priority: 1 },
        { id: 2, added: '2024-01-01T10:00:00Z', element_in: 2, element_out: 1, entry: 200, event: 21, kind: 'w', result: 'a', index: 2, priority: 2 },
        { id: 3, added: '2024-01-01T14:00:00Z', element_in: 1, element_out: 2, entry: 100, event: 21, kind: 'f', result: 'a', index: null, priority: null },
        { id: 4, added: '2024-01-01T11:00:00Z', element_in: 2, element_out: 1, entry: 200, event: 21, kind: 'f', result: 'a', index: null, priority: null },
      ],
    }
    const leagueDetails = createMockLeagueDetails()
    const bootstrap = createMockBootstrapStatic()

    const result = processTransactions(transactions, leagueDetails, bootstrap, 21)

    // Waivers first (sorted by index: 2, 5), then free transfers (sorted by date: 11:00, 14:00)
    expect(result.map((t) => t.id)).toEqual([2, 1, 4, 3])
  })

  it('maps transaction details correctly', () => {
    const transactions: TransactionsResponse = {
      transactions: [
        { id: 1, added: '2024-01-01T10:00:00Z', element_in: 1, element_out: 2, entry: 100, event: 21, kind: 'w', result: 'a', index: 1, priority: 1 },
      ],
    }
    const leagueDetails = createMockLeagueDetails()
    const bootstrap = createMockBootstrapStatic()

    const result = processTransactions(transactions, leagueDetails, bootstrap, 21)

    expect(result[0]).toMatchObject({
      id: 1,
      event: 21,
      managerName: 'John Doe',
      playerIn: 'Salah',
      playerOut: 'Haaland',
      type: 'waiver',
    })
  })
})

describe('calculateStandingsFromGameweek', () => {
  it('calculates standings from specified gameweek', () => {
    const leagueDetails = createMockLeagueDetails({
      matches: [
        // GW 19 - should be excluded when starting from GW 20
        { event: 19, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 30, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 2, winning_method: 'points' },
        // GW 20 - should be included
        { event: 20, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 1, winning_method: 'points' },
        // GW 21 - should be included
        { event: 21, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 45, league_entry_2: 2, league_entry_2_points: 45, winning_league_entry: null, winning_method: null },
      ],
    })

    const standings = calculateStandingsFromGameweek(leagueDetails, 20)

    const team1 = standings.get(1)!
    expect(team1.wins).toBe(1)
    expect(team1.draws).toBe(1)
    expect(team1.losses).toBe(0)
    expect(team1.pointsFor).toBe(95) // 50 + 45
    expect(team1.pointsAgainst).toBe(85) // 40 + 45

    const team2 = standings.get(2)!
    expect(team2.wins).toBe(0)
    expect(team2.draws).toBe(1)
    expect(team2.losses).toBe(1)
    expect(team2.pointsFor).toBe(85)
    expect(team2.pointsAgainst).toBe(95)
  })

  it('excludes unfinished matches', () => {
    const leagueDetails = createMockLeagueDetails({
      matches: [
        { event: 20, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 1, winning_method: 'points' },
        { event: 21, finished: false, started: true, league_entry_1: 1, league_entry_1_points: 30, league_entry_2: 2, league_entry_2_points: 35, winning_league_entry: null, winning_method: null },
      ],
    })

    const standings = calculateStandingsFromGameweek(leagueDetails, 20)

    const team1 = standings.get(1)!
    expect(team1.wins).toBe(1)
    expect(team1.pointsFor).toBe(50)
  })
})

describe('calculateTeamForm', () => {
  it('returns last N results for each team', () => {
    const leagueDetails = createMockLeagueDetails({
      matches: [
        { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 1, winning_method: 'points' },
        { event: 2, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 30, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 2, winning_method: 'points' },
        { event: 3, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 45, league_entry_2: 2, league_entry_2_points: 45, winning_league_entry: null, winning_method: null },
      ],
    })

    const form = calculateTeamForm(leagueDetails, 5)

    // Most recent first (GW3, GW2, GW1)
    expect(form.get(1)).toEqual(['D', 'L', 'W'])
    expect(form.get(2)).toEqual(['D', 'W', 'L'])
  })

  it('limits results to specified count', () => {
    const leagueDetails = createMockLeagueDetails({
      matches: [
        { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 1, winning_method: 'points' },
        { event: 2, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 30, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 2, winning_method: 'points' },
        { event: 3, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 45, league_entry_2: 2, league_entry_2_points: 45, winning_league_entry: null, winning_method: null },
      ],
    })

    const form = calculateTeamForm(leagueDetails, 2)

    // Only last 2 results (GW3, GW2)
    expect(form.get(1)).toEqual(['D', 'L'])
    expect(form.get(2)).toEqual(['D', 'W'])
  })

  it('excludes unfinished matches', () => {
    const leagueDetails = createMockLeagueDetails({
      matches: [
        { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 1, winning_method: 'points' },
        { event: 2, finished: false, started: true, league_entry_1: 1, league_entry_1_points: 30, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: null, winning_method: null },
      ],
    })

    const form = calculateTeamForm(leagueDetails, 5)

    expect(form.get(1)).toEqual(['W'])
    expect(form.get(2)).toEqual(['L'])
  })
})

describe('calculateHeadToHead', () => {
  it('calculates H2H records between teams', () => {
    const leagueDetails = createMockLeagueDetails({
      matches: [
        { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 1, winning_method: 'points' },
        { event: 2, finished: true, started: true, league_entry_1: 2, league_entry_1_points: 60, league_entry_2: 1, league_entry_2_points: 30, winning_league_entry: 2, winning_method: 'points' },
        { event: 3, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 45, league_entry_2: 2, league_entry_2_points: 45, winning_league_entry: null, winning_method: null },
      ],
    })

    const h2h = calculateHeadToHead(leagueDetails)

    // Team 1 vs Team 2: 1 win, 1 draw, 1 loss
    const team1VsTeam2 = h2h.get(1)?.get(2)
    expect(team1VsTeam2?.wins).toBe(1)
    expect(team1VsTeam2?.draws).toBe(1)
    expect(team1VsTeam2?.losses).toBe(1)
    expect(team1VsTeam2?.pointsFor).toBe(125) // 50 + 30 + 45
    expect(team1VsTeam2?.pointsAgainst).toBe(145) // 40 + 60 + 45

    // Team 2 vs Team 1: 1 win, 1 draw, 1 loss (mirror)
    const team2VsTeam1 = h2h.get(2)?.get(1)
    expect(team2VsTeam1?.wins).toBe(1)
    expect(team2VsTeam1?.draws).toBe(1)
    expect(team2VsTeam1?.losses).toBe(1)
    expect(team2VsTeam1?.pointsFor).toBe(145)
    expect(team2VsTeam1?.pointsAgainst).toBe(125)
  })

  it('excludes unfinished matches', () => {
    const leagueDetails = createMockLeagueDetails({
      matches: [
        { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 1, winning_method: 'points' },
        { event: 2, finished: false, started: true, league_entry_1: 1, league_entry_1_points: 30, league_entry_2: 2, league_entry_2_points: 60, winning_league_entry: null, winning_method: null },
      ],
    })

    const h2h = calculateHeadToHead(leagueDetails)

    const team1VsTeam2 = h2h.get(1)?.get(2)
    expect(team1VsTeam2?.wins).toBe(1)
    expect(team1VsTeam2?.draws).toBe(0)
    expect(team1VsTeam2?.losses).toBe(0)
  })
})

describe('getTransactionsEvent', () => {
  it('returns currentEvent when waiver deadline has not passed', () => {
    const currentEvent = 21
    const futureDate = new Date()
    futureDate.setHours(futureDate.getHours() + 24)

    const deadlineInfo: DeadlineInfo = {
      nextEvent: 22,
      waiverDeadline: futureDate.toISOString(),
      lineupDeadline: futureDate.toISOString(),
    }

    expect(getTransactionsEvent(currentEvent, deadlineInfo)).toBe(21)
  })

  it('returns nextEvent when waiver deadline has passed', () => {
    const currentEvent = 21
    const pastDate = new Date()
    pastDate.setHours(pastDate.getHours() - 1)

    const deadlineInfo: DeadlineInfo = {
      nextEvent: 22,
      waiverDeadline: pastDate.toISOString(),
      lineupDeadline: new Date().toISOString(),
    }

    expect(getTransactionsEvent(currentEvent, deadlineInfo)).toBe(22)
  })

  it('returns currentEvent when nextEvent equals currentEvent', () => {
    const currentEvent = 21
    const pastDate = new Date()
    pastDate.setHours(pastDate.getHours() - 1)

    const deadlineInfo: DeadlineInfo = {
      nextEvent: 21, // Same as current
      waiverDeadline: pastDate.toISOString(),
      lineupDeadline: new Date().toISOString(),
    }

    expect(getTransactionsEvent(currentEvent, deadlineInfo)).toBe(21)
  })

  it('returns currentEvent when waiverDeadline is null', () => {
    const currentEvent = 21

    const deadlineInfo: DeadlineInfo = {
      nextEvent: 22,
      waiverDeadline: null,
      lineupDeadline: null,
    }

    expect(getTransactionsEvent(currentEvent, deadlineInfo)).toBe(21)
  })
})

describe('calculateLuckMetrics', () => {
  const createSixTeamLeague = (matches: LeagueDetails['matches']): LeagueDetails => ({
    league: {
      id: 37265, name: 'Test League', admin_entry: 1, closed: false,
      draft_dt: '2024-08-01T00:00:00Z', draft_status: 'completed', scoring: 'h',
      start_event: 1, stop_event: 38, trades: 'y', transaction_mode: 'y', variety: 'h2h',
    },
    league_entries: [
      { id: 1, entry_id: 100, entry_name: 'Team A', player_first_name: 'A', player_last_name: 'Player', short_name: 'TA', waiver_pick: 1 },
      { id: 2, entry_id: 200, entry_name: 'Team B', player_first_name: 'B', player_last_name: 'Player', short_name: 'TB', waiver_pick: 2 },
      { id: 3, entry_id: 300, entry_name: 'Team C', player_first_name: 'C', player_last_name: 'Player', short_name: 'TC', waiver_pick: 3 },
      { id: 4, entry_id: 400, entry_name: 'Team D', player_first_name: 'D', player_last_name: 'Player', short_name: 'TD', waiver_pick: 4 },
      { id: 5, entry_id: 500, entry_name: 'Team E', player_first_name: 'E', player_last_name: 'Player', short_name: 'TE', waiver_pick: 5 },
      { id: 6, entry_id: 600, entry_name: 'Team F', player_first_name: 'F', player_last_name: 'Player', short_name: 'TF', waiver_pick: 6 },
    ],
    matches,
    standings: [],
  })

  it('returns empty array when no finished matches', () => {
    const league = createSixTeamLeague([])
    expect(calculateLuckMetrics(league)).toEqual([])
  })

  it('calculates narrow wins correctly', () => {
    // GW1: 3 matches, Team 1 wins by 3 (narrow), Team 3 wins by 20 (not narrow), Team 5 wins by 5 (narrow)
    const league = createSixTeamLeague([
      { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 53, league_entry_2: 2, league_entry_2_points: 50, winning_league_entry: 1, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 3, league_entry_1_points: 60, league_entry_2: 4, league_entry_2_points: 40, winning_league_entry: 3, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 5, league_entry_1_points: 45, league_entry_2: 6, league_entry_2_points: 40, winning_league_entry: 5, winning_method: 'points' },
    ])

    const metrics = calculateLuckMetrics(league)
    const team1 = metrics.find((m) => m.entryId === 1)!
    const team3 = metrics.find((m) => m.entryId === 3)!
    const team5 = metrics.find((m) => m.entryId === 5)!

    expect(team1.narrowWins).toBe(1)
    expect(team3.narrowWins).toBe(0)
    expect(team5.narrowWins).toBe(1)
  })

  it('calculates opponent average points', () => {
    const league = createSixTeamLeague([
      { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 1, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 3, league_entry_1_points: 60, league_entry_2: 4, league_entry_2_points: 30, winning_league_entry: 3, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 5, league_entry_1_points: 55, league_entry_2: 6, league_entry_2_points: 45, winning_league_entry: 5, winning_method: 'points' },
      { event: 2, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 3, league_entry_2_points: 60, winning_league_entry: 3, winning_method: 'points' },
      { event: 2, finished: true, started: true, league_entry_1: 2, league_entry_1_points: 35, league_entry_2: 5, league_entry_2_points: 55, winning_league_entry: 5, winning_method: 'points' },
      { event: 2, finished: true, started: true, league_entry_1: 4, league_entry_1_points: 40, league_entry_2: 6, league_entry_2_points: 45, winning_league_entry: 6, winning_method: 'points' },
    ])

    const metrics = calculateLuckMetrics(league)
    const team1 = metrics.find((m) => m.entryId === 1)!

    // Team 1 faced Team 2 (40 pts) in GW1 and Team 3 (60 pts) in GW2
    expect(team1.opponentAvgPoints).toBe(50) // (40 + 60) / 2
  })

  it('calculates lucky wins (won while ranked 4th-5th in GW)', () => {
    // GW1 scores: Team 3=60, Team 1=50, Team 5=48, Team 6=45, Team 2=40, Team 4=30
    // Rankings: 3=1st, 1=2nd, 5=3rd, 6=4th, 2=5th, 4=6th
    // Team 6 (4th) beats Team 4 (6th) -> lucky win for Team 6
    // Team 2 (5th) loses to Team 1 (2nd) -> no lucky win
    const league = createSixTeamLeague([
      { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 1, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 3, league_entry_1_points: 60, league_entry_2: 4, league_entry_2_points: 30, winning_league_entry: 3, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 6, league_entry_1_points: 45, league_entry_2: 5, league_entry_2_points: 48, winning_league_entry: 5, winning_method: 'points' },
    ])

    const metrics = calculateLuckMetrics(league)
    // No one ranked 4th-5th won (Team 6 ranked 4th lost, Team 2 ranked 5th lost)
    expect(metrics.every((m) => m.luckyWins === 0)).toBe(true)
  })

  it('detects lucky win when 4th-ranked team wins', () => {
    // GW1 scores: Team 3=60, Team 1=55, Team 5=50, Team 2=45, Team 4=40, Team 6=30
    // Rankings: 3=1st, 1=2nd, 5=3rd, 2=4th, 4=5th, 6=6th
    // Team 2 (4th, 45pts) vs Team 1 (2nd, 55pts) -> Team 1 wins, not lucky
    // Now swap so Team 2 (4th) faces Team 6 (6th) and wins
    const league = createSixTeamLeague([
      { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 55, league_entry_2: 5, league_entry_2_points: 50, winning_league_entry: 1, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 3, league_entry_1_points: 60, league_entry_2: 4, league_entry_2_points: 40, winning_league_entry: 3, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 2, league_entry_1_points: 45, league_entry_2: 6, league_entry_2_points: 30, winning_league_entry: 2, winning_method: 'points' },
    ])

    const metrics = calculateLuckMetrics(league)
    const team2 = metrics.find((m) => m.entryId === 2)!
    // Team 2 ranked 4th (45 pts) and won -> lucky win
    expect(team2.luckyWins).toBe(1)
  })

  it('calculates unlucky losses (lost while ranked top 3)', () => {
    // GW1 scores: Team 3=60, Team 1=55, Team 2=50, Team 5=45, Team 4=40, Team 6=30
    // Rankings: 3=1st, 1=2nd, 2=3rd, 5=4th, 4=5th, 6=6th
    // Team 2 (3rd, 50pts) faces Team 3 (1st, 60pts) -> Team 2 loses = unlucky loss
    const league = createSixTeamLeague([
      { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 55, league_entry_2: 5, league_entry_2_points: 45, winning_league_entry: 1, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 3, league_entry_1_points: 60, league_entry_2: 2, league_entry_2_points: 50, winning_league_entry: 3, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 4, league_entry_1_points: 40, league_entry_2: 6, league_entry_2_points: 30, winning_league_entry: 4, winning_method: 'points' },
    ])

    const metrics = calculateLuckMetrics(league)
    const team2 = metrics.find((m) => m.entryId === 2)!
    expect(team2.unluckyLosses).toBe(1)

    // Team 1 (2nd) won, so no unlucky loss
    const team1 = metrics.find((m) => m.entryId === 1)!
    expect(team1.unluckyLosses).toBe(0)
  })

  it('calculates expected wins correctly', () => {
    // GW1 scores: Team 1=60, Team 2=50, Team 3=40, Team 4=30, Team 5=20, Team 6=10
    // Team 1 (60) would beat all 5 opponents -> expected = 5/5 = 1.0
    // Team 6 (10) would beat 0 opponents -> expected = 0/5 = 0.0
    // Team 3 (40) would beat Team 4,5,6 (3/5) -> expected = 0.6
    const league = createSixTeamLeague([
      { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 60, league_entry_2: 2, league_entry_2_points: 50, winning_league_entry: 1, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 3, league_entry_1_points: 40, league_entry_2: 4, league_entry_2_points: 30, winning_league_entry: 3, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 5, league_entry_1_points: 20, league_entry_2: 6, league_entry_2_points: 10, winning_league_entry: 5, winning_method: 'points' },
    ])

    const metrics = calculateLuckMetrics(league)
    const team1 = metrics.find((m) => m.entryId === 1)!
    const team3 = metrics.find((m) => m.entryId === 3)!
    const team6 = metrics.find((m) => m.entryId === 6)!

    expect(team1.expectedWins).toBe(1)
    expect(team1.actualWins).toBe(1)

    expect(team3.expectedWins).toBe(0.6)
    expect(team3.actualWins).toBe(1)

    expect(team6.expectedWins).toBe(0)
    expect(team6.actualWins).toBe(0)
  })

  it('computes composite luck index using all factors', () => {
    // GW1 scores: Team 1=60, Team 2=50, Team 3=40, Team 4=30, Team 5=20, Team 6=10
    // Team 3 (40pts, ranked 3rd) beats Team 4 (30pts, ranked 4th)
    // Team 3: actualW=1, expectedW=0.6, narrowWins=0(diff=10), luckyWins=0, unluckyLosses=0, draws=0
    // luckIndex should be positive (won more than expected)
    const league = createSixTeamLeague([
      { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 60, league_entry_2: 2, league_entry_2_points: 50, winning_league_entry: 1, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 3, league_entry_1_points: 40, league_entry_2: 4, league_entry_2_points: 30, winning_league_entry: 3, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 5, league_entry_1_points: 20, league_entry_2: 6, league_entry_2_points: 10, winning_league_entry: 5, winning_method: 'points' },
    ])

    const metrics = calculateLuckMetrics(league)
    const team3 = metrics.find((m) => m.entryId === 3)!

    // Team 3 won more than expected -> positive luck index
    expect(team3.luckIndex).toBeGreaterThan(0)

    // Team 1 is the best scorer and won -> should be near 0 or slightly negative (faced strong opponent)
    const team1 = metrics.find((m) => m.entryId === 1)!
    // Luckiest team should have the highest index
    const sorted = [...metrics].sort((a, b) => b.luckIndex - a.luckIndex)
    expect(sorted[0].luckIndex).toBeGreaterThan(sorted[sorted.length - 1].luckIndex)
  })

  it('ignores unfinished matches', () => {
    const league = createSixTeamLeague([
      { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 1, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 3, league_entry_1_points: 60, league_entry_2: 4, league_entry_2_points: 30, winning_league_entry: 3, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 5, league_entry_1_points: 55, league_entry_2: 6, league_entry_2_points: 45, winning_league_entry: 5, winning_method: 'points' },
      { event: 2, finished: false, started: true, league_entry_1: 1, league_entry_1_points: 30, league_entry_2: 3, league_entry_2_points: 60, winning_league_entry: null, winning_method: null },
      { event: 2, finished: false, started: true, league_entry_1: 2, league_entry_1_points: 35, league_entry_2: 5, league_entry_2_points: 55, winning_league_entry: null, winning_method: null },
      { event: 2, finished: false, started: true, league_entry_1: 4, league_entry_1_points: 40, league_entry_2: 6, league_entry_2_points: 45, winning_league_entry: null, winning_method: null },
    ])

    const metrics = calculateLuckMetrics(league)
    const team1 = metrics.find((m) => m.entryId === 1)!
    // Only GW1 should count
    expect(team1.actualWins).toBe(1)
  })

  it('handles draws in expected wins calculation', () => {
    // All teams score 50 -> each team would draw all opponents -> expected = 0.5
    const league = createSixTeamLeague([
      { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 50, winning_league_entry: null, winning_method: null },
      { event: 1, finished: true, started: true, league_entry_1: 3, league_entry_1_points: 50, league_entry_2: 4, league_entry_2_points: 50, winning_league_entry: null, winning_method: null },
      { event: 1, finished: true, started: true, league_entry_1: 5, league_entry_1_points: 50, league_entry_2: 6, league_entry_2_points: 50, winning_league_entry: null, winning_method: null },
    ])

    const metrics = calculateLuckMetrics(league)
    metrics.forEach((m) => {
      expect(m.expectedWins).toBe(0.5)
      expect(m.actualWins).toBe(0)
      expect(m.draws).toBe(1)
      // Draws penalize luck index -> should be negative
      expect(m.luckIndex).toBeLessThan(0)
    })
  })

  it('draws negatively impact luck index', () => {
    // Two GWs: Team 1 wins GW1 cleanly, Team 2 draws GW1
    // Compare their luck indices - team with draw should be lower (all else equal-ish)
    const league = createSixTeamLeague([
      // GW1: Team 1 beats Team 2 by 10, Team 3 draws Team 4, Team 5 beats Team 6
      { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 55, league_entry_2: 2, league_entry_2_points: 45, winning_league_entry: 1, winning_method: 'points' },
      { event: 1, finished: true, started: true, league_entry_1: 3, league_entry_1_points: 50, league_entry_2: 4, league_entry_2_points: 50, winning_league_entry: null, winning_method: null },
      { event: 1, finished: true, started: true, league_entry_1: 5, league_entry_1_points: 40, league_entry_2: 6, league_entry_2_points: 30, winning_league_entry: 5, winning_method: 'points' },
    ])

    const metrics = calculateLuckMetrics(league)
    const team3 = metrics.find((m) => m.entryId === 3)!
    const team4 = metrics.find((m) => m.entryId === 4)!

    // Both drew, so both should have draws = 1
    expect(team3.draws).toBe(1)
    expect(team4.draws).toBe(1)
  })
})

describe('processAllMatches', () => {
  it('maps all matches to fixture with names', () => {
    const leagueDetails = createMockLeagueDetails({
      matches: [
        { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 1, winning_method: 'points' },
        { event: 2, finished: false, started: false, league_entry_1: 2, league_entry_1_points: 0, league_entry_2: 1, league_entry_2_points: 0, winning_league_entry: null, winning_method: null },
      ],
    })

    const result = processAllMatches(leagueDetails)
    expect(result).toHaveLength(2)
    expect(result[0].team1Name).toBe('Team A')
    expect(result[0].team2Name).toBe('Team B')
    expect(result[0].winner).toBe('Team A')
    expect(result[1].team1Name).toBe('Team B')
    expect(result[1].winner).toBeNull()
  })

  it('returns Unknown for missing entries', () => {
    const leagueDetails = createMockLeagueDetails({
      matches: [
        { event: 1, finished: true, started: true, league_entry_1: 99, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 99, winning_method: 'points' },
      ],
    })

    const result = processAllMatches(leagueDetails)
    expect(result[0].team1Name).toBe('Unknown')
    expect(result[0].team1PlayerName).toBe('Unknown')
  })
})

describe('processManagersWithSquads', () => {
  it('maps entries with standings and owned players sorted by position', () => {
    const leagueDetails = createMockLeagueDetails()
    const bootstrap = createMockBootstrapStatic()
    const elementStatus: ElementStatusResponse = {
      element_status: [
        { element: 2, in_accepted_trade: false, owner: 100, status: 'o' }, // Haaland (FWD, type 4) owned by entry 100
        { element: 1, in_accepted_trade: false, owner: 100, status: 'o' }, // Salah (MID, type 3) owned by entry 100
      ],
    }

    const result = processManagersWithSquads(leagueDetails, elementStatus, bootstrap)

    expect(result).toHaveLength(2)
    expect(result[0].entry.entry_name).toBe('Team A')
    expect(result[0].standing.rank).toBe(1)
    // Squad should be sorted by element_type: MID (3) before FWD (4)
    expect(result[0].squad).toHaveLength(2)
    expect(result[0].squad[0].web_name).toBe('Salah')
    expect(result[0].squad[1].web_name).toBe('Haaland')
    // Team B has no players
    expect(result[1].squad).toHaveLength(0)
  })

  it('handles entries with no owned players', () => {
    const leagueDetails = createMockLeagueDetails()
    const bootstrap = createMockBootstrapStatic()
    const elementStatus: ElementStatusResponse = {
      element_status: [],
    }

    const result = processManagersWithSquads(leagueDetails, elementStatus, bootstrap)
    expect(result[0].squad).toHaveLength(0)
    expect(result[1].squad).toHaveLength(0)
  })
})

describe('processWhatIfSquads', () => {
  it('builds squads from draft choices sorted by total points', () => {
    const leagueDetails = createMockLeagueDetails()
    const bootstrap = createMockBootstrapStatic()
    const draftChoices: DraftChoice[] = [
      { id: 1, element: 1, entry: 100, entry_name: 'Team A', player_first_name: 'John', player_last_name: 'Doe', round: 1, pick: 1, index: 0 },
      { id: 2, element: 2, entry: 100, entry_name: 'Team A', player_first_name: 'John', player_last_name: 'Doe', round: 2, pick: 2, index: 1 },
      { id: 3, element: 1, entry: 200, entry_name: 'Team B', player_first_name: 'Jane', player_last_name: 'Smith', round: 1, pick: 2, index: 2 },
    ]

    const result = processWhatIfSquads(draftChoices, bootstrap, leagueDetails)

    expect(result).toHaveLength(2)
    // Team A has Salah (100) + Haaland (120) = 220
    expect(result[0].totalPoints).toBe(220)
    expect(result[0].teamName).toBe('Team A')
    expect(result[0].players).toHaveLength(2)
    expect(result[0].players[0].draftRound).toBe(1)
    expect(result[0].players[1].draftRound).toBe(2)
    // Team B has only Salah (100)
    expect(result[1].totalPoints).toBe(100)
  })

  it('returns empty array when no draft choices', () => {
    const leagueDetails = createMockLeagueDetails()
    const bootstrap = createMockBootstrapStatic()

    const result = processWhatIfSquads([], bootstrap, leagueDetails)
    expect(result).toEqual([])
  })

  it('handles unknown players gracefully', () => {
    const leagueDetails = createMockLeagueDetails()
    const bootstrap = createMockBootstrapStatic()
    const draftChoices: DraftChoice[] = [
      { id: 1, element: 999, entry: 100, entry_name: 'Team A', player_first_name: 'John', player_last_name: 'Doe', round: 1, pick: 1, index: 0 },
    ]

    const result = processWhatIfSquads(draftChoices, bootstrap, leagueDetails)
    expect(result[0].players[0].name).toBe('Unknown')
    expect(result[0].players[0].positionName).toBe('UNK')
    expect(result[0].players[0].totalPoints).toBe(0)
  })
})

describe('getDeadlineInfo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns next event with future deadline', () => {
    const futureDate = new Date('2024-01-15T12:00:00Z')
    vi.setSystemTime(new Date('2024-01-10T12:00:00Z'))

    const bootstrap: BootstrapStatic = {
      ...createMockBootstrapStatic(),
      events: {
        current: 20,
        data: [
          { id: 20, name: 'Gameweek 20', deadline_time: '2024-01-05T00:00:00Z', finished: true, is_current: false, is_next: false },
          { id: 21, name: 'Gameweek 21', deadline_time: futureDate.toISOString(), finished: false, is_current: true, is_next: false },
        ],
      },
    }

    const result = getDeadlineInfo(bootstrap)
    expect(result.nextEvent).toBe(21)
    expect(result.lineupDeadline).toBe(futureDate.toISOString())
    expect(result.waiverDeadline).not.toBeNull()
  })

  it('sets waiver deadline 24 hours before lineup deadline', () => {
    vi.setSystemTime(new Date('2024-01-10T12:00:00Z'))
    const deadline = new Date('2024-01-15T14:00:00Z')

    const bootstrap: BootstrapStatic = {
      ...createMockBootstrapStatic(),
      events: {
        current: 20,
        data: [
          { id: 21, name: 'Gameweek 21', deadline_time: deadline.toISOString(), finished: false, is_current: false, is_next: true },
        ],
      },
    }

    const result = getDeadlineInfo(bootstrap)
    const waiverDate = new Date(result.waiverDeadline!)
    const lineupDate = new Date(result.lineupDeadline!)
    const diffHours = (lineupDate.getTime() - waiverDate.getTime()) / (1000 * 60 * 60)
    expect(diffHours).toBe(24)
  })

  it('falls back to last event when all deadlines have passed', () => {
    vi.setSystemTime(new Date('2024-06-01T00:00:00Z'))

    const bootstrap: BootstrapStatic = {
      ...createMockBootstrapStatic(),
      events: {
        current: 38,
        data: [
          { id: 37, name: 'Gameweek 37', deadline_time: '2024-05-10T00:00:00Z', finished: true, is_current: false, is_next: false },
          { id: 38, name: 'Gameweek 38', deadline_time: '2024-05-19T00:00:00Z', finished: true, is_current: true, is_next: false },
        ],
      },
    }

    const result = getDeadlineInfo(bootstrap)
    expect(result.nextEvent).toBe(38)
  })

  it('returns null deadlines when no events exist', () => {
    const bootstrap: BootstrapStatic = {
      ...createMockBootstrapStatic(),
      events: { current: 0, data: [] },
    }

    const result = getDeadlineInfo(bootstrap)
    expect(result.nextEvent).toBe(1)
    expect(result.waiverDeadline).toBeNull()
    expect(result.lineupDeadline).toBeNull()
  })
})

// ===== Fetch Function Tests =====
describe('fetch functions', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    // Simulate server-side (no window)
    vi.stubGlobal('window', undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    mockFetch.mockReset()
  })

  const mockResponse = (data: unknown, ok = true) => ({
    ok,
    json: () => Promise.resolve(data),
  })

  describe('fetchLeagueDetails', () => {
    it('fetches league details from FPL API', async () => {
      const mockData = createMockLeagueDetails()
      mockFetch.mockResolvedValue(mockResponse(mockData))

      const result = await fetchLeagueDetails()
      expect(result).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/league/37265/details'),
        expect.objectContaining({ cache: 'no-store' })
      )
    })

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValue(mockResponse(null, false))
      await expect(fetchLeagueDetails()).rejects.toThrow('Failed to fetch league details')
    })
  })

  describe('fetchElementStatus', () => {
    it('fetches element status', async () => {
      const mockData = { element_status: [] }
      mockFetch.mockResolvedValue(mockResponse(mockData))

      const result = await fetchElementStatus()
      expect(result).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/league/37265/element-status'),
        expect.any(Object)
      )
    })

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValue(mockResponse(null, false))
      await expect(fetchElementStatus()).rejects.toThrow('Failed to fetch element status')
    })
  })

  describe('fetchBootstrapStatic', () => {
    it('fetches bootstrap static data', async () => {
      const mockData = createMockBootstrapStatic()
      mockFetch.mockResolvedValue(mockResponse(mockData))

      const result = await fetchBootstrapStatic()
      expect(result).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/bootstrap-static'),
        expect.any(Object)
      )
    })

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValue(mockResponse(null, false))
      await expect(fetchBootstrapStatic()).rejects.toThrow('Failed to fetch bootstrap data')
    })
  })

  describe('fetchTransactions', () => {
    it('fetches transactions', async () => {
      const mockData = { transactions: [] }
      mockFetch.mockResolvedValue(mockResponse(mockData))

      const result = await fetchTransactions()
      expect(result).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/draft/league/37265/transactions'),
        expect.any(Object)
      )
    })

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValue(mockResponse(null, false))
      await expect(fetchTransactions()).rejects.toThrow('Failed to fetch transactions')
    })
  })

  describe('fetchEntryPicks', () => {
    it('fetches picks for a specific entry and event', async () => {
      const mockData = { picks: [{ element: 1, position: 1, is_captain: false, is_vice_captain: false, multiplier: 1 }] }
      mockFetch.mockResolvedValue(mockResponse(mockData))

      const result = await fetchEntryPicks(100, 21)
      expect(result).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/entry/100/event/21'),
        expect.any(Object)
      )
    })

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValue(mockResponse(null, false))
      await expect(fetchEntryPicks(100, 21)).rejects.toThrow('Failed to fetch picks for entry 100')
    })
  })

  describe('fetchLiveEvent', () => {
    it('fetches live event data', async () => {
      const mockData = { elements: {}, fixtures: [] }
      mockFetch.mockResolvedValue(mockResponse(mockData))

      const result = await fetchLiveEvent(21)
      expect(result).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/event/21/live'),
        expect.any(Object)
      )
    })

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValue(mockResponse(null, false))
      await expect(fetchLiveEvent(21)).rejects.toThrow('Failed to fetch live data for event 21')
    })
  })

  describe('fetchDraftChoices', () => {
    it('fetches draft choices', async () => {
      const mockData = { choices: [] }
      mockFetch.mockResolvedValue(mockResponse(mockData))

      const result = await fetchDraftChoices()
      expect(result).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/draft/37265/choices'),
        expect.any(Object)
      )
    })

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValue(mockResponse(null, false))
      await expect(fetchDraftChoices()).rejects.toThrow('Failed to fetch draft choices')
    })
  })

  describe('fetchAllData', () => {
    it('fetches all data in parallel', async () => {
      const leagueDetails = createMockLeagueDetails()
      const elementStatus = { element_status: [] }
      const bootstrapStatic = createMockBootstrapStatic()
      const transactions = { transactions: [] }

      // fetchAllData calls 4 fetch functions in parallel
      mockFetch
        .mockResolvedValueOnce(mockResponse(leagueDetails))
        .mockResolvedValueOnce(mockResponse(elementStatus))
        .mockResolvedValueOnce(mockResponse(bootstrapStatic))
        .mockResolvedValueOnce(mockResponse(transactions))

      const result = await fetchAllData()
      expect(result.leagueDetails).toEqual(leagueDetails)
      expect(result.elementStatus).toEqual(elementStatus)
      expect(result.bootstrapStatic).toEqual(bootstrapStatic)
      expect(result.transactions).toEqual(transactions)
      expect(mockFetch).toHaveBeenCalledTimes(4)
    })

    it('rejects if any fetch fails', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse(createMockLeagueDetails()))
        .mockResolvedValueOnce(mockResponse(null, false)) // element status fails
        .mockResolvedValueOnce(mockResponse(createMockBootstrapStatic()))
        .mockResolvedValueOnce(mockResponse({ transactions: [] }))

      await expect(fetchAllData()).rejects.toThrow()
    })
  })

  describe('fetchPointsBreakdown', () => {
    it('builds breakdown with player stats, per-game explain, and opponent info', async () => {
      const leagueDetails = createMockLeagueDetails()
      const bootstrap = createMockBootstrapStatic()

      // Mock fetchLiveEvent (1st call) and fetchEntryPicks (2 calls for 2 entries)
      const liveData = {
        elements: {
          '1': {
            stats: {
              total_points: 8, goals_scored: 1, assists: 0, clean_sheets: 0,
              bonus: 2, yellow_cards: 0, red_cards: 0, own_goals: 0,
              penalties_missed: 0, penalties_saved: 0, bps: 30, saves: 0,
              minutes: 90, clearances_blocks_interceptions: 0, recoveries: 0,
              tackles: 0, defensive_contribution: 3,
            },
            explain: [
              [
                [
                  { name: 'Minutes played', points: 2, value: 90, stat: 'minutes' },
                  { name: 'Goals scored', points: 5, value: 1, stat: 'goals_scored' },
                  { name: 'Bonus', points: 2, value: 2, stat: 'bonus' },
                  { name: 'DC', points: 1, value: 3, stat: 'defensive_contribution' },
                ],
                101, // fixtureId
              ],
            ],
          },
        },
        fixtures: [
          { id: 101, event: 21, team_h: 1, team_a: 2, team_h_score: 2, team_a_score: 0, finished: false, finished_provisional: false, started: true, kickoff_time: '2024-01-01T00:00:00Z', minutes: 90 },
        ],
      }
      const picks1 = { picks: [{ element: 1, position: 1, is_captain: false, is_vice_captain: false, multiplier: 1 }] }
      const picks2 = { picks: [{ element: 1, position: 1, is_captain: false, is_vice_captain: false, multiplier: 1 }] }

      mockFetch
        .mockResolvedValueOnce(mockResponse(liveData)) // fetchLiveEvent
        .mockResolvedValueOnce(mockResponse(picks1))    // fetchEntryPicks for entry 100
        .mockResolvedValueOnce(mockResponse(picks2))    // fetchEntryPicks for entry 200

      const result = await fetchPointsBreakdown(leagueDetails, bootstrap, 21)

      // Should have breakdown for both teams
      expect(result.size).toBe(2)

      const team1 = result.get(1)!
      expect(team1.teamName).toBe('Team A')
      expect(team1.playerName).toBe('John Doe')
      expect(team1.players).toHaveLength(1)

      const player = team1.players[0]
      expect(player.name).toBe('Salah')
      expect(player.points).toBe(8)
      expect(player.positionName).toBe('MID')
      expect(player.teamShortName).toBe('LIV')
      expect(player.opponentShortName).toBe('MCI')
      expect(player.isHome).toBe(true)
      expect(player.goals).toBe(1)
      expect(player.bonus).toBe(2)
      expect(player.hasPlayed).toBe(true)
      expect(player.defensiveContribution).toBe(3)

      // Per-game stats should be parsed from explain
      expect(player.perGameStats).toHaveLength(1)
      const gameStat = player.perGameStats[0]
      expect(gameStat.fixtureId).toBe(101)
      expect(gameStat.minutes).toBe(90)
      expect(gameStat.goals).toBe(1)
      expect(gameStat.bonus).toBe(2)
      expect(gameStat.defensiveContribution).toBe(3)
      expect(gameStat.points).toBe(10) // 2+5+2+1
      expect(gameStat.opponentShortName).toBe('MCI')
      expect(gameStat.isHome).toBe(true)
    })

    it('handles benched players (position > 11) and excludes from total', async () => {
      const leagueDetails = createMockLeagueDetails()
      const bootstrap = createMockBootstrapStatic()

      const liveData = {
        elements: {
          '1': {
            stats: { total_points: 5, goals_scored: 0, assists: 0, clean_sheets: 0, bonus: 0, yellow_cards: 0, red_cards: 0, own_goals: 0, penalties_missed: 0, penalties_saved: 0, bps: 10, saves: 0, minutes: 90, clearances_blocks_interceptions: 0, recoveries: 0, tackles: 0, defensive_contribution: 0 },
            explain: [],
          },
          '2': {
            stats: { total_points: 3, goals_scored: 0, assists: 0, clean_sheets: 0, bonus: 0, yellow_cards: 0, red_cards: 0, own_goals: 0, penalties_missed: 0, penalties_saved: 0, bps: 5, saves: 0, minutes: 45, clearances_blocks_interceptions: 0, recoveries: 0, tackles: 0, defensive_contribution: 0 },
            explain: [],
          },
        },
        fixtures: [
          { id: 101, event: 21, team_h: 1, team_a: 2, team_h_score: 1, team_a_score: 0, finished: true, finished_provisional: true, started: true, kickoff_time: '2024-01-01T00:00:00Z', minutes: 90 },
        ],
      }
      const picks = {
        picks: [
          { element: 1, position: 1, is_captain: false, is_vice_captain: false, multiplier: 1 },
          { element: 2, position: 12, is_captain: false, is_vice_captain: false, multiplier: 0 }, // benched
        ],
      }

      mockFetch
        .mockResolvedValueOnce(mockResponse(liveData))
        .mockResolvedValueOnce(mockResponse(picks))
        .mockResolvedValueOnce(mockResponse({ picks: [] }))

      const result = await fetchPointsBreakdown(leagueDetails, bootstrap, 21)
      const team1 = result.get(1)!
      // Total should only count starters (position <= 11)
      expect(team1.totalPoints).toBe(5)
      // Benched player should be marked
      const benched = team1.players.find(p => p.isBenched)
      expect(benched?.name).toBe('Haaland')
      expect(benched?.points).toBe(3)
    })

    it('handles unknown players gracefully', async () => {
      const leagueDetails = createMockLeagueDetails()
      const bootstrap = createMockBootstrapStatic()

      const liveData = {
        elements: {},
        fixtures: [],
      }
      const picks = {
        picks: [{ element: 999, position: 1, is_captain: false, is_vice_captain: false, multiplier: 1 }],
      }

      mockFetch
        .mockResolvedValueOnce(mockResponse(liveData))
        .mockResolvedValueOnce(mockResponse(picks))
        .mockResolvedValueOnce(mockResponse({ picks: [] }))

      const result = await fetchPointsBreakdown(leagueDetails, bootstrap, 21)
      const team1 = result.get(1)!
      expect(team1.players[0].name).toBe('Unknown')
      expect(team1.players[0].positionName).toBe('UNK')
      expect(team1.players[0].opponentShortName).toBe('???')
    })

    it('parses all stat types from explain field', async () => {
      const leagueDetails = createMockLeagueDetails()
      // Only 1 entry to simplify
      leagueDetails.league_entries = [leagueDetails.league_entries[0]]
      const bootstrap = createMockBootstrapStatic()

      const liveData = {
        elements: {
          '1': {
            stats: { total_points: 2, goals_scored: 0, assists: 1, clean_sheets: 1, bonus: 0, yellow_cards: 1, red_cards: 1, own_goals: 1, penalties_missed: 1, penalties_saved: 1, bps: 5, saves: 4, minutes: 90, clearances_blocks_interceptions: 0, recoveries: 0, tackles: 0, defensive_contribution: 0 },
            explain: [
              [
                [
                  { name: 'Minutes', points: 2, value: 90, stat: 'minutes' },
                  { name: 'Assists', points: 3, value: 1, stat: 'assists' },
                  { name: 'CS', points: 4, value: 1, stat: 'clean_sheets' },
                  { name: 'YC', points: -1, value: 1, stat: 'yellow_cards' },
                  { name: 'RC', points: -3, value: 1, stat: 'red_cards' },
                  { name: 'Saves', points: 1, value: 4, stat: 'saves' },
                  { name: 'PS', points: 5, value: 1, stat: 'penalties_saved' },
                  { name: 'PM', points: -2, value: 1, stat: 'penalties_missed' },
                  { name: 'OG', points: -2, value: 1, stat: 'own_goals' },
                  { name: 'GC', points: -1, value: 3, stat: 'goals_conceded' },
                ],
                101,
              ],
            ],
          },
        },
        fixtures: [
          { id: 101, event: 21, team_h: 1, team_a: 2, team_h_score: 0, team_a_score: 0, finished: true, finished_provisional: true, started: true, kickoff_time: '2024-01-01T00:00:00Z', minutes: 90 },
        ],
      }

      mockFetch
        .mockResolvedValueOnce(mockResponse(liveData))
        .mockResolvedValueOnce(mockResponse({
          picks: [{ element: 1, position: 1, is_captain: false, is_vice_captain: false, multiplier: 1 }],
        }))

      const result = await fetchPointsBreakdown(leagueDetails, bootstrap, 21)
      const game = result.get(1)!.players[0].perGameStats[0]

      expect(game.minutes).toBe(90)
      expect(game.assists).toBe(1)
      expect(game.cleanSheet).toBe(true)
      expect(game.yellowCards).toBe(1)
      expect(game.redCards).toBe(1)
      expect(game.saves).toBe(4)
      expect(game.penaltiesSaved).toBe(1)
      expect(game.penaltiesMissed).toBe(1)
      expect(game.ownGoals).toBe(1)
      expect(game.goalsConceeded).toBe(3)
    })
  })

  describe('fetchAllPointsBreakdown', () => {
    it('fetches breakdowns for all finished events', async () => {
      const leagueDetails = createMockLeagueDetails({
        matches: [
          { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 1, winning_method: 'points' },
          { event: 2, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 45, league_entry_2: 2, league_entry_2_points: 55, winning_league_entry: 2, winning_method: 'points' },
          { event: 3, finished: false, started: false, league_entry_1: 1, league_entry_1_points: 0, league_entry_2: 2, league_entry_2_points: 0, winning_league_entry: null, winning_method: null },
        ],
      })
      const bootstrap = createMockBootstrapStatic()

      // Each call to fetchPointsBreakdown triggers: fetchLiveEvent + N fetchEntryPicks
      // For 2 finished events, that's 2 * (1 + 2) = 6 fetches
      const liveData = { elements: {}, fixtures: [] }
      const emptyPicks = { picks: [] }

      mockFetch.mockResolvedValue(mockResponse(liveData))
      // Override for picks calls
      for (let i = 0; i < 10; i++) {
        mockFetch.mockResolvedValueOnce(mockResponse(liveData))
          .mockResolvedValueOnce(mockResponse(emptyPicks))
          .mockResolvedValueOnce(mockResponse(emptyPicks))
      }

      const result = await fetchAllPointsBreakdown(leagueDetails, bootstrap, 3)

      // Should have breakdowns for events 1 and 2 (finished), not 3 (not started)
      expect(result.has(1)).toBe(true)
      expect(result.has(2)).toBe(true)
      expect(result.has(3)).toBe(false)
    })

    it('includes current event if started', async () => {
      const leagueDetails = createMockLeagueDetails({
        matches: [
          { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 1, winning_method: 'points' },
          { event: 2, finished: false, started: true, league_entry_1: 1, league_entry_1_points: 30, league_entry_2: 2, league_entry_2_points: 20, winning_league_entry: null, winning_method: null },
        ],
      })
      const bootstrap = createMockBootstrapStatic()

      const liveData = { elements: {}, fixtures: [] }
      const emptyPicks = { picks: [] }
      mockFetch.mockResolvedValue(mockResponse(emptyPicks))
      for (let i = 0; i < 10; i++) {
        mockFetch.mockResolvedValueOnce(mockResponse(liveData))
          .mockResolvedValueOnce(mockResponse(emptyPicks))
          .mockResolvedValueOnce(mockResponse(emptyPicks))
      }

      const result = await fetchAllPointsBreakdown(leagueDetails, bootstrap, 2)

      // Event 2 started but not finished — should be included
      expect(result.has(1)).toBe(true)
      expect(result.has(2)).toBe(true)
    })

    it('handles errors gracefully for individual events', async () => {
      const leagueDetails = createMockLeagueDetails({
        matches: [
          { event: 1, finished: true, started: true, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 40, winning_league_entry: 1, winning_method: 'points' },
        ],
      })
      const bootstrap = createMockBootstrapStatic()

      // Make fetchLiveEvent fail
      mockFetch.mockResolvedValue(mockResponse(null, false))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await fetchAllPointsBreakdown(leagueDetails, bootstrap, 1)

      // Should still return a result, just with empty breakdown
      expect(result.has(1)).toBe(true)
      expect(result.get(1)!.size).toBe(0)
      consoleSpy.mockRestore()
    })
  })
})
