import { describe, it, expect } from 'vitest'
import {
  processTransactions,
  processFixtures,
  calculateStandingsFromGameweek,
  calculateTeamForm,
  calculateHeadToHead,
  getCurrentEvent,
  getPositionName,
  getTransactionsEvent,
} from './api'
import {
  LeagueDetails,
  TransactionsResponse,
  BootstrapStatic,
  DeadlineInfo,
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
