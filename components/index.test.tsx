/**
 * Component Tests
 *
 * These tests verify that our UI components render correctly and respond to user interactions.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'

// Cleanup after each test to prevent DOM pollution
afterEach(() => {
  cleanup()
})

// Mock scrollIntoView which is not available in jsdom
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

// Import all components
import { Header } from './Header'
import { TabNavigation } from './TabNavigation'
import { Standings } from './Standings'
import { SummerStandings } from './SummerStandings'
import { HeadToHead } from './HeadToHead'
import { Transactions } from './Transactions'
import { Results } from './Results'
import { UpcomingFixtures } from './UpcomingFixtures'
import { WhatIf } from './WhatIf'
import { Fixtures } from './Fixtures'
import { LuckMetrics } from './LuckMetrics'

// ===== HEADER =====
describe('Header', () => {
  const deadlineInfo = {
    nextEvent: 22,
    waiverDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    lineupDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 2 days
  }

  it('renders league name and gameweek', () => {
    render(<Header leagueName="Hogwarts League" currentEvent={21} deadlineInfo={deadlineInfo} />)
    // Mobile and desktop layouts both render the league name
    expect(screen.getAllByText('Hogwarts League').length).toBeGreaterThan(0)
    expect(screen.getByText('Gameweek 21')).toBeInTheDocument()
  })

  it('renders deadline info', () => {
    render(<Header leagueName="Hogwarts League" currentEvent={21} deadlineInfo={deadlineInfo} />)
    expect(screen.getByText('Waivers:')).toBeInTheDocument()
    expect(screen.getByText('Lineups:')).toBeInTheDocument()
  })
})

// ===== TAB NAVIGATION =====
describe('TabNavigation', () => {
  const tabs = [
    { id: 'live', label: 'Live' },
    { id: 'results', label: 'Results' },
  ]

  it('renders all tabs and handles clicks', () => {
    const onTabChange = vi.fn()
    render(<TabNavigation tabs={tabs} activeTab="live" onTabChange={onTabChange} />)

    expect(screen.getByText('Live')).toBeInTheDocument()
    expect(screen.getByText('Results')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Results'))
    expect(onTabChange).toHaveBeenCalledWith('results')
  })
})

// ===== STANDINGS =====
describe('Standings', () => {
  const mockManager = {
    entry: {
      id: 1, entry_id: 100, entry_name: 'Test Team',
      player_first_name: 'John', player_last_name: 'Doe',
      short_name: 'JD', waiver_pick: 1,
    },
    standing: {
      league_entry: 1, rank: 1, last_rank: 1, rank_sort: 1,
      matches_played: 10, matches_won: 6, matches_drawn: 2, matches_lost: 2,
      points_for: 450, points_against: 380, total: 20,
    },
    squad: [],
  }

  it('renders standings table with team data', () => {
    render(<Standings managers={[mockManager]} form={{}} />)
    expect(screen.getByText('Standings')).toBeInTheDocument()
    // Mobile and desktop layouts both render the team name
    expect(screen.getAllByText('Test Team').length).toBeGreaterThan(0)
  })

  it('shows form indicators when provided', () => {
    render(<Standings managers={[mockManager]} form={{ 1: ['W', 'L'] }} />)
    // New design uses form-dot CSS classes with aria-labels (mobile + desktop views)
    expect(screen.getAllByLabelText('Win').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Loss').length).toBeGreaterThan(0)
  })
})

// ===== SUMMER STANDINGS =====
describe('SummerStandings', () => {
  const createStanding = (id: number, name: string, wins: number) => ({
    entry: {
      id, entry_id: id * 100, entry_name: name,
      player_first_name: 'Player', player_last_name: String(id),
      short_name: name.substring(0, 2), waiver_pick: id,
    },
    wins, draws: 0, losses: 0, pointsFor: 100, pointsAgainst: 80,
    total: wins * 3, rank: 0,
  })

  it('shows not started message when no matches', () => {
    const standings = [createStanding(1, 'Team', 0)]
    standings[0].wins = 0
    standings[0].total = 0
    render(<SummerStandings standings={standings} />)
    expect(screen.getByText('Starts from Gameweek 20')).toBeInTheDocument()
  })

  it('renders standings when matches played', () => {
    render(<SummerStandings standings={[createStanding(1, 'Active Team', 2)]} />)
    expect(screen.getAllByText('Summer Championship').length).toBeGreaterThan(0)
    // Mobile and desktop layouts both render the team name
    expect(screen.getAllByText('Active Team').length).toBeGreaterThan(0)
  })
})

// ===== HEAD TO HEAD =====
describe('HeadToHead', () => {
  const entries = [
    { id: 1, entry_id: 100, entry_name: 'Team A', player_first_name: 'A', player_last_name: 'A', short_name: 'TA', waiver_pick: 1 },
    { id: 2, entry_id: 200, entry_name: 'Team B', player_first_name: 'B', player_last_name: 'B', short_name: 'TB', waiver_pick: 2 },
  ]

  // H2H data with at least one match played to show the matrix
  const h2hWithMatches = {
    1: { 2: { wins: 1, draws: 0, losses: 0, pointsFor: 50, pointsAgainst: 40 } },
    2: { 1: { wins: 0, draws: 0, losses: 1, pointsFor: 40, pointsAgainst: 50 } },
  }

  it('renders H2H matrix', () => {
    render(<HeadToHead entries={entries} h2h={h2hWithMatches} />)
    expect(screen.getByText('Head to Head')).toBeInTheDocument()
    // Desktop and mobile views both render the short names
    expect(screen.getAllByText('TA').length).toBeGreaterThanOrEqual(2)
  })
})

// ===== TRANSACTIONS =====
describe('Transactions', () => {
  it('shows empty state when no transactions', () => {
    render(<Transactions transactions={[]} currentEvent={21} />)
    expect(screen.getByText('No transactions')).toBeInTheDocument()
  })

  it('renders transactions list', () => {
    const transactions = [{
      id: 1, event: 21, managerName: 'Manager', playerIn: 'Salah', playerInTeam: 'LIV',
      playerOut: 'Bruno', playerOutTeam: 'MUN', type: 'waiver' as const, date: '2024-01-01',
    }]
    render(<Transactions transactions={transactions} currentEvent={21} />)
    expect(screen.getByText('Manager')).toBeInTheDocument()
    expect(screen.getByText('Waiver')).toBeInTheDocument()
  })
})

// ===== RESULTS =====
describe('Results', () => {
  const createMatch = (event: number, finished: boolean) => ({
    event, team1Id: 1, team1Name: `Team ${event}A`, team1PlayerName: 'Player A',
    team1Points: 50, team2Id: 2, team2Name: `Team ${event}B`, team2PlayerName: 'Player B',
    team2Points: 40, finished, started: finished, winner: finished ? `Team ${event}A` : null,
  })

  it('shows empty state when no results', () => {
    render(<Results matches={[]} currentEvent={21} allPointsBreakdown={{}} />)
    expect(screen.getByText('No results yet')).toBeInTheDocument()
  })

  it('renders finished matches grouped by gameweek', () => {
    const { container } = render(<Results matches={[createMatch(20, true), createMatch(21, true)]} currentEvent={21} allPointsBreakdown={{}} />)
    expect(container.textContent).toContain('Gameweek 20')
    expect(container.textContent).toContain('Gameweek 21')
  })
})

// ===== UPCOMING FIXTURES =====
describe('UpcomingFixtures', () => {
  const createMatch = (event: number) => ({
    event, team1Id: 1, team1Name: `Team ${event}A`, team1PlayerName: 'Player A',
    team1Points: 0, team2Id: 2, team2Name: `Team ${event}B`, team2PlayerName: 'Player B',
    team2Points: 0, finished: false, started: false, winner: null,
  })

  it('shows empty state when no fixtures', () => {
    render(<UpcomingFixtures matches={[]} currentEvent={21} />)
    expect(screen.getByText('No upcoming fixtures')).toBeInTheDocument()
  })

  it('renders upcoming fixtures', () => {
    render(<UpcomingFixtures matches={[createMatch(22)]} currentEvent={21} />)
    expect(screen.getByText('Gameweek 22')).toBeInTheDocument()
  })
})

// ===== FIXTURES =====
describe('Fixtures', () => {
  const fixture = {
    event: 21, team1Id: 1, team1Name: 'Home Team', team1PlayerName: 'Manager A',
    team1Points: 55, team2Id: 2, team2Name: 'Away Team', team2PlayerName: 'Manager B',
    team2Points: 42, finished: true, started: true, winner: 'Home Team',
  }

  const createPointsBreakdown = (team1Total: number, team2Total: number) => ({
    1: {
      entryId: 1, teamName: 'Home Team', playerName: 'Manager A',
      totalPoints: team1Total, players: [],
    },
    2: {
      entryId: 2, teamName: 'Away Team', playerName: 'Manager B',
      totalPoints: team2Total, players: [],
    },
  })

  it('shows empty state when no fixtures', () => {
    render(<Fixtures fixtures={[]} currentEvent={21} pointsBreakdown={{}} />)
    expect(screen.getByText('No fixtures this week')).toBeInTheDocument()
  })

  it('renders fixtures with scores', () => {
    const { container } = render(<Fixtures fixtures={[fixture]} currentEvent={21} pointsBreakdown={{}} />)
    expect(container.textContent).toContain('Gameweek 21')
    expect(container.textContent).toContain('Home Team')
    expect(container.textContent).toContain('55')
  })

  it('shows LIVE indicator for ongoing matches', () => {
    const liveFixture = { ...fixture, finished: false }
    render(<Fixtures fixtures={[liveFixture]} currentEvent={21} pointsBreakdown={{}} />)
    expect(screen.getByText('LIVE')).toBeInTheDocument()
  })

  it('uses calculated points from breakdown during live GW', () => {
    const liveFixture = { ...fixture, finished: false, team1Points: 0, team2Points: 0 }
    const breakdown = createPointsBreakdown(67, 54)
    const { container } = render(
      <Fixtures fixtures={[liveFixture]} currentEvent={21} pointsBreakdown={breakdown} />
    )
    // Should show calculated points (67, 54) not API points (0, 0)
    expect(container.textContent).toContain('67')
    expect(container.textContent).toContain('54')
    expect(container.textContent).not.toMatch(/\b0\b.*:.*\b0\b/) // Not showing 0 : 0
  })

  it('uses API points when GW is finished', () => {
    const finishedFixture = { ...fixture, finished: true, team1Points: 55, team2Points: 42 }
    const breakdown = createPointsBreakdown(67, 54) // Different from API points
    const { container } = render(
      <Fixtures fixtures={[finishedFixture]} currentEvent={21} pointsBreakdown={breakdown} />
    )
    // Should show API points (55, 42) not calculated points (67, 54)
    expect(container.textContent).toContain('55')
    expect(container.textContent).toContain('42')
  })

  it('highlights leading team during live match', () => {
    const liveFixture = { ...fixture, finished: false, team1Points: 0, team2Points: 0 }
    const breakdown = createPointsBreakdown(67, 54)
    const { container } = render(
      <Fixtures fixtures={[liveFixture]} currentEvent={21} pointsBreakdown={breakdown} />
    )
    // Home Team (67 pts) should be highlighted as they are leading
    const homeTeamElement = screen.getByText('Home Team')
    expect(homeTeamElement.className).toContain('text-[var(--success)]')
  })

  it('shows info popup with details including DC for DEF and MID players', () => {
    const breakdownWithPlayers = {
      1: {
        entryId: 1, teamName: 'Home Team', playerName: 'Manager A',
        totalPoints: 55, players: [
          { name: 'Defender', points: 6, position: 1, isBenched: false, positionName: 'DEF',
            teamShortName: 'ARS', opponentShortName: 'CHE', isHome: true, opponents: [{ opponentShortName: 'CHE', isHome: true, started: true }],
            goals: 0, assists: 0, cleanSheet: true, bonus: 0, yellowCards: 0, redCards: 0, minutesPlayed: 90, hasPlayed: true, defensiveContribution: 5,
            perGameStats: [{ fixtureId: 1, opponentShortName: 'CHE', isHome: true, minutes: 90, goals: 0, assists: 0, cleanSheet: true, yellowCards: 0, redCards: 0, bonus: 0, saves: 0, penaltiesSaved: 0, penaltiesMissed: 0, ownGoals: 0, goalsConceeded: 0, defensiveContribution: 5, points: 6 }] },
          { name: 'Midfielder', points: 8, position: 2, isBenched: false, positionName: 'MID',
            teamShortName: 'ARS', opponentShortName: 'CHE', isHome: true, opponents: [{ opponentShortName: 'CHE', isHome: true, started: true }],
            goals: 1, assists: 0, cleanSheet: false, bonus: 0, yellowCards: 0, redCards: 0, minutesPlayed: 74, hasPlayed: true, defensiveContribution: 3,
            perGameStats: [{ fixtureId: 1, opponentShortName: 'CHE', isHome: true, minutes: 74, goals: 1, assists: 0, cleanSheet: false, yellowCards: 0, redCards: 0, bonus: 0, saves: 0, penaltiesSaved: 0, penaltiesMissed: 0, ownGoals: 0, goalsConceeded: 0, defensiveContribution: 3, points: 8 }] },
          { name: 'Forward', points: 10, position: 3, isBenched: false, positionName: 'FWD',
            teamShortName: 'ARS', opponentShortName: 'CHE', isHome: true, opponents: [{ opponentShortName: 'CHE', isHome: true, started: true }],
            goals: 2, assists: 0, cleanSheet: false, bonus: 0, yellowCards: 0, redCards: 0, minutesPlayed: 90, hasPlayed: true, defensiveContribution: 2,
            perGameStats: [{ fixtureId: 1, opponentShortName: 'CHE', isHome: true, minutes: 90, goals: 2, assists: 0, cleanSheet: false, yellowCards: 0, redCards: 0, bonus: 0, saves: 0, penaltiesSaved: 0, penaltiesMissed: 0, ownGoals: 0, goalsConceeded: 0, defensiveContribution: 2, points: 10 }] },
        ],
      },
      2: {
        entryId: 2, teamName: 'Away Team', playerName: 'Manager B',
        totalPoints: 42, players: [],
      },
    }
    const { container } = render(
      <Fixtures fixtures={[fixture]} currentEvent={21} pointsBreakdown={breakdownWithPlayers} />
    )
    // Click to expand the fixture
    const button = container.querySelector('button')
    if (button) fireEvent.click(button)
    // Each player with hasPlayed should have an info button
    const infoButtons = screen.getAllByTitle('View details')
    expect(infoButtons.length).toBe(3)
    // Click the Defender's info button to open popup - DC should show
    fireEvent.click(infoButtons[0])
    expect(container.textContent).toContain('DC:5')
    // Click the Midfielder's info button - DC should show
    fireEvent.click(infoButtons[1])
    expect(container.textContent).toContain('DC:3')
  })
})

// ===== LUCK METRICS =====
describe('LuckMetrics', () => {
  const mockData = [
    {
      entryId: 1, teamName: 'Lucky Team', managerName: 'John Doe',
      narrowWins: 3, opponentAvgPoints: 42.5, luckyWins: 2, unluckyLosses: 0,
      expectedWins: 8.2, actualWins: 11, draws: 1, luckIndex: 2.8,
    },
    {
      entryId: 2, teamName: 'Unlucky Team', managerName: 'Jane Smith',
      narrowWins: 1, opponentAvgPoints: 55.3, luckyWins: 0, unluckyLosses: 3,
      expectedWins: 10.5, actualWins: 7, draws: 4, luckIndex: -3.5,
    },
  ]

  it('shows empty state when no data', () => {
    render(<LuckMetrics luckMetrics={[]} />)
    expect(screen.getByText('No data yet')).toBeInTheDocument()
  })

  it('renders luck metrics table with team data', () => {
    render(<LuckMetrics luckMetrics={mockData} />)
    expect(screen.getByText('Luck Index')).toBeInTheDocument()
    // Both mobile and desktop render team names
    expect(screen.getAllByText('Lucky Team').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Unlucky Team').length).toBeGreaterThan(0)
  })

  it('sorts by luck delta descending (luckiest first)', () => {
    const { container } = render(<LuckMetrics luckMetrics={mockData} />)
    const teamNames = container.querySelectorAll('.font-medium')
    // First team should be "Lucky Team" (delta +2.8) before "Unlucky Team" (delta -3.5)
    const textContents = Array.from(teamNames).map((el) => el.textContent)
    const luckyIdx = textContents.indexOf('Lucky Team')
    const unluckyIdx = textContents.indexOf('Unlucky Team')
    expect(luckyIdx).toBeLessThan(unluckyIdx)
  })

  it('displays positive delta with + prefix', () => {
    const { container } = render(<LuckMetrics luckMetrics={mockData} />)
    expect(container.textContent).toContain('+2.8')
  })

  it('displays negative delta', () => {
    const { container } = render(<LuckMetrics luckMetrics={mockData} />)
    expect(container.textContent).toContain('-3.5')
  })
})

// ===== WHAT IF =====
describe('WhatIf', () => {
  const squad = {
    entryId: 1, teamName: 'Draft Team', managerName: 'Manager',
    players: [{ id: 1, name: 'Salah', positionName: 'MID', teamShortName: 'LIV', totalPoints: 150, draftRound: 1 }],
    totalPoints: 500,
  }

  it('shows empty state when no squads', () => {
    render(<WhatIf squads={[]} />)
    expect(screen.getByText('No draft data available')).toBeInTheDocument()
  })

  it('renders squad rankings', () => {
    const { container } = render(<WhatIf squads={[squad]} />)
    expect(screen.getByText('Draft Team')).toBeInTheDocument()
    // 500 appears multiple times in the new design (stats summary + squad card)
    expect(container.textContent).toContain('500')
  })

  it('expands to show players when clicked', () => {
    const { container } = render(<WhatIf squads={[squad]} />)
    const showButton = container.querySelector('button')
    if (showButton) fireEvent.click(showButton)
    expect(screen.getByText('Salah')).toBeInTheDocument()
  })
})

// ===== PLAYER STATS =====
import { PositionBadge, StatIcons, GameStatIcons, PlayerDetailPopover } from './PlayerStats'
import { PlayerPoints, PerGameStat } from '@/lib/types'

const createMockPlayer = (overrides?: Partial<PlayerPoints>): PlayerPoints => ({
  name: 'TestPlayer', points: 5, position: 1, isBenched: false,
  positionName: 'MID', teamShortName: 'ARS', opponentShortName: 'CHE',
  isHome: true, opponents: [{ opponentShortName: 'CHE', isHome: true, started: true }],
  goals: 0, assists: 0, cleanSheet: false, bonus: 0, yellowCards: 0,
  redCards: 0, minutesPlayed: 90, hasPlayed: true, defensiveContribution: 0,
  perGameStats: [],
  ...overrides,
})

const createMockGameStat = (overrides?: Partial<PerGameStat>): PerGameStat => ({
  fixtureId: 1, opponentShortName: 'CHE', isHome: true,
  minutes: 90, goals: 0, assists: 0, cleanSheet: false,
  yellowCards: 0, redCards: 0, bonus: 0, saves: 0,
  penaltiesSaved: 0, penaltiesMissed: 0, ownGoals: 0,
  goalsConceeded: 0, defensiveContribution: 0, points: 5,
  ...overrides,
})

describe('PositionBadge', () => {
  it('renders position text with correct class', () => {
    const { container } = render(<PositionBadge position="GK" />)
    const badge = container.querySelector('.pos-badge')
    expect(badge).toBeInTheDocument()
    expect(badge?.textContent).toBe('GK')
    expect(badge?.className).toContain('pos-gk')
  })

  it('renders each position with its CSS class', () => {
    const positions = ['GK', 'DEF', 'MID', 'FWD']
    const classes = ['pos-gk', 'pos-def', 'pos-mid', 'pos-fwd']
    positions.forEach((pos, i) => {
      const { container } = render(<PositionBadge position={pos} />)
      expect(container.querySelector(`.${classes[i]}`)).toBeInTheDocument()
      cleanup()
    })
  })
})

describe('StatIcons', () => {
  it('renders goal icons for each goal scored', () => {
    const player = createMockPlayer({ goals: 2 })
    const { container } = render(<StatIcons player={player} />)
    const goals = container.querySelectorAll('[title="Goal"]')
    expect(goals).toHaveLength(2)
  })

  it('renders assist icons', () => {
    const player = createMockPlayer({ assists: 1 })
    const { container } = render(<StatIcons player={player} />)
    expect(container.querySelector('[title="Assist"]')).toBeInTheDocument()
  })

  it('renders clean sheet for GK, DEF, MID but not FWD', () => {
    for (const pos of ['GK', 'DEF', 'MID']) {
      const { container } = render(<StatIcons player={createMockPlayer({ cleanSheet: true, positionName: pos })} />)
      expect(container.querySelector('[title="Clean sheet"]')).toBeInTheDocument()
      cleanup()
    }
    const { container } = render(<StatIcons player={createMockPlayer({ cleanSheet: true, positionName: 'FWD' })} />)
    expect(container.querySelector('[title="Clean sheet"]')).not.toBeInTheDocument()
  })

  it('renders top scorer star when isTopScorer and points > 0', () => {
    const player = createMockPlayer({ points: 10 })
    render(<StatIcons player={player} isTopScorer />)
    expect(screen.getByLabelText('Top scorer')).toBeInTheDocument()
  })

  it('returns null when no stat icons to show', () => {
    const player = createMockPlayer()
    const { container } = render(<StatIcons player={player} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders red card icons', () => {
    const player = createMockPlayer({ redCards: 1 })
    const { container } = render(<StatIcons player={player} />)
    expect(container.querySelector('[title="Red card"]')).toBeInTheDocument()
  })
})

describe('GameStatIcons', () => {
  it('renders goal and assist icons', () => {
    const game = createMockGameStat({ goals: 1, assists: 2 })
    const { container } = render(<GameStatIcons game={game} positionName="MID" />)
    expect(container.querySelectorAll('[title="Goal"]')).toHaveLength(1)
    expect(container.querySelectorAll('[title="Assist"]')).toHaveLength(2)
  })

  it('shows saves badge for GK with 3+ saves', () => {
    const game = createMockGameStat({ saves: 4 })
    const { container } = render(<GameStatIcons game={game} positionName="GK" />)
    expect(container.textContent).toContain('S:4')
  })

  it('does not show saves badge for non-GK', () => {
    const game = createMockGameStat({ saves: 4 })
    const { container } = render(<GameStatIcons game={game} positionName="DEF" />)
    expect(container.textContent).not.toContain('S:4')
  })

  it('shows goals conceded for GK/DEF with 2+', () => {
    const game = createMockGameStat({ goalsConceeded: 3 })
    const { container } = render(<GameStatIcons game={game} positionName="DEF" />)
    expect(container.textContent).toContain('GC:3')
  })

  it('shows DC for DEF/MID with positive value', () => {
    const game = createMockGameStat({ defensiveContribution: 5 })
    const { container } = render(<GameStatIcons game={game} positionName="DEF" />)
    expect(container.textContent).toContain('DC:5')
  })

  it('shows own goal and penalty missed icons', () => {
    const game = createMockGameStat({ ownGoals: 1, penaltiesMissed: 1 })
    const { container } = render(<GameStatIcons game={game} positionName="FWD" />)
    expect(container.querySelector('[title="Own goal"]')).toBeInTheDocument()
    expect(container.querySelector('[title="Penalty missed"]')).toBeInTheDocument()
  })

  it('returns null when no stats to display', () => {
    const game = createMockGameStat()
    const { container } = render(<GameStatIcons game={game} positionName="FWD" />)
    expect(container.innerHTML).toBe('')
  })
})

describe('PlayerDetailPopover', () => {
  it('returns null for player that has not played', () => {
    const player = createMockPlayer({ hasPlayed: false, perGameStats: [] })
    const { container } = render(<PlayerDetailPopover player={player} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders info button for player that has played', () => {
    const player = createMockPlayer({ hasPlayed: true })
    render(<PlayerDetailPopover player={player} />)
    expect(screen.getByTitle('View details')).toBeInTheDocument()
  })

  it('opens popover on click showing per-game stats', () => {
    const player = createMockPlayer({
      perGameStats: [createMockGameStat({ opponentShortName: 'LIV', points: 8, minutes: 90 })],
    })
    const { container } = render(<PlayerDetailPopover player={player} />)
    fireEvent.click(screen.getByTitle('View details'))
    expect(container.textContent).toContain('LIV')
    expect(container.textContent).toContain('8pts')
  })

  it('closes popover on outside click', () => {
    const player = createMockPlayer({
      perGameStats: [createMockGameStat({ opponentShortName: 'LIV', points: 8 })],
    })
    const { container } = render(<div><div data-testid="outside">outside</div><PlayerDetailPopover player={player} /></div>)
    fireEvent.click(screen.getByTitle('View details'))
    expect(container.textContent).toContain('8pts')
    // Click outside to close
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(container.textContent).not.toContain('8pts')
  })
})

// ===== REFRESH BUTTON =====
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

import { RefreshButton } from './RefreshButton'

describe('RefreshButton', () => {
  it('renders with refresh aria-label', () => {
    render(<RefreshButton />)
    expect(screen.getByLabelText('Refresh data')).toBeInTheDocument()
  })

  it('disables button while refreshing', () => {
    render(<RefreshButton />)
    const button = screen.getByLabelText('Refresh data')
    fireEvent.click(button)
    expect(button).toBeDisabled()
  })
})

// ===== GW SUMMARY =====
import { GWSummary } from './GWSummary'

describe('GWSummary', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const defaultProps = {
    currentEvent: 21,
    fixtures: [] as import('@/lib/types').FixtureWithNames[],
    pointsBreakdown: {},
  }

  it('renders header with AI Summary and GW number', () => {
    // Mock fetch to return a pending promise (stays in loading state)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}))
    render(<GWSummary {...defaultProps} />)
    expect(screen.getByText('AI Summary')).toBeInTheDocument()
    expect(screen.getByText('GW 21')).toBeInTheDocument()
  })

  it('shows loading skeleton initially', () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}))
    render(<GWSummary {...defaultProps} />)
    expect(screen.getByLabelText('Loading summary')).toBeInTheDocument()
  })

  it('shows error state on fetch failure', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'))
    render(<GWSummary {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Could not load AI summary')).toBeInTheDocument()
    })
  })

  it('shows retry button on error', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'))
    render(<GWSummary {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeInTheDocument()
    })
  })

  it('shows quick stats for live and completed matches', () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}))
    const fixtures = [
      { event: 21, team1Id: 1, team1Name: 'A', team1PlayerName: 'P', team1Points: 50, team2Id: 2, team2Name: 'B', team2PlayerName: 'Q', team2Points: 40, finished: true, started: true, winner: 'A' },
      { event: 21, team1Id: 3, team1Name: 'C', team1PlayerName: 'R', team1Points: 30, team2Id: 4, team2Name: 'D', team2PlayerName: 'S', team2Points: 20, finished: false, started: true, winner: null },
    ]
    render(<GWSummary {...defaultProps} fixtures={fixtures} />)
    expect(screen.getByText('1 live')).toBeInTheDocument()
    expect(screen.getByText('1 completed')).toBeInTheDocument()
  })

  it('renders footer disclaimer', () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}))
    render(<GWSummary {...defaultProps} />)
    expect(screen.getByText('AI-generated summary based on current gameweek data')).toBeInTheDocument()
  })

  it('streams summary text from SSE response', async () => {
    const encoder = new TextEncoder()
    const chunks = [
      encoder.encode('data: {"text":"Hello "}\n\n'),
      encoder.encode('data: {"text":"world!"}\n\ndata: [DONE]\n\n'),
    ]
    let chunkIndex = 0

    const mockReader = {
      read: vi.fn().mockImplementation(() => {
        if (chunkIndex < chunks.length) {
          return Promise.resolve({ done: false, value: chunks[chunkIndex++] })
        }
        return Promise.resolve({ done: true, value: undefined })
      }),
    }

    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
    })

    render(<GWSummary {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Hello world!')).toBeInTheDocument()
    })
  })

  it('shows non-ok fetch as error', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false })
    render(<GWSummary {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Could not load AI summary')).toBeInTheDocument()
    })
  })

  it('shows upcoming count for not-started matches', () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}))
    const fixtures = [
      { event: 21, team1Id: 1, team1Name: 'A', team1PlayerName: 'P', team1Points: 0, team2Id: 2, team2Name: 'B', team2PlayerName: 'Q', team2Points: 0, finished: false, started: false, winner: null },
    ]
    render(<GWSummary {...defaultProps} fixtures={fixtures} />)
    expect(screen.getByText('1 upcoming')).toBeInTheDocument()
  })
})

// ===== RESULTS (expanded) =====
describe('Results (expanded)', () => {
  const createMatch = (event: number, finished: boolean, team1Id = 1, team2Id = 2) => ({
    event, team1Id, team1Name: `Team${team1Id}`, team1PlayerName: `Player${team1Id}`,
    team1Points: 50, team2Id, team2Name: `Team${team2Id}`, team2PlayerName: `Player${team2Id}`,
    team2Points: 40, finished, started: finished, winner: finished ? `Team${team1Id}` : null,
  })

  it('renders team filter dropdown', () => {
    render(<Results matches={[createMatch(20, true)]} currentEvent={21} allPointsBreakdown={{}} />)
    expect(screen.getByText('Filter by team')).toBeInTheDocument()
    expect(screen.getByLabelText('Select team filter')).toBeInTheDocument()
  })

  it('opens team filter and shows team options', () => {
    render(<Results matches={[createMatch(20, true)]} currentEvent={21} allPointsBreakdown={{}} />)
    fireEvent.click(screen.getByLabelText('Select team filter'))
    // "All Teams" appears in both button text and dropdown option
    expect(screen.getAllByText('All Teams').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('option', { name: 'Team1' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Team2' })).toBeInTheDocument()
  })

  it('filters results by selected team', () => {
    const matches = [
      createMatch(20, true, 1, 2),
      createMatch(20, true, 3, 4),
    ]
    const { container } = render(<Results matches={matches} currentEvent={21} allPointsBreakdown={{}} />)
    // Both matches visible initially
    expect(container.textContent).toContain('Team1')
    expect(container.textContent).toContain('Team3')

    // Filter by Team1
    fireEvent.click(screen.getByLabelText('Select team filter'))
    fireEvent.click(screen.getByRole('option', { name: 'Team1' }))
    // Team3 match should be hidden
    expect(container.textContent).toContain('Team1')
    expect(container.textContent).not.toContain('Team3')
  })

  it('shows expanded breakdown when match has breakdown data', () => {
    const match = createMatch(20, true)
    const breakdown = {
      20: {
        1: { entryId: 1, teamName: 'Team1', playerName: 'Player1', totalPoints: 50, players: [] },
        2: { entryId: 2, teamName: 'Team2', playerName: 'Player2', totalPoints: 40, players: [] },
      },
    }
    const { container } = render(<Results matches={[match]} currentEvent={21} allPointsBreakdown={breakdown} />)
    // "View Players" button should exist
    expect(container.textContent).toContain('View')
    // Click to expand
    const buttons = container.querySelectorAll('button')
    const viewButton = Array.from(buttons).find(b => b.textContent?.includes('View'))
    if (viewButton) fireEvent.click(viewButton)
    // Breakdown team names should appear
    expect(container.textContent).toContain('Team1')
  })

  it('highlights winning team name', () => {
    const match = { ...createMatch(20, true), team1Points: 60, team2Points: 35 }
    const { container } = render(<Results matches={[match]} currentEvent={21} allPointsBreakdown={{}} />)
    const team1Elements = container.querySelectorAll('.text-\\[var\\(--success\\)\\]')
    expect(team1Elements.length).toBeGreaterThan(0)
  })

  it('closes team filter dropdown on Escape key', () => {
    render(<Results matches={[createMatch(20, true)]} currentEvent={21} allPointsBreakdown={{}} />)
    fireEvent.click(screen.getByLabelText('Select team filter'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

// ===== UPCOMING FIXTURES (expanded) =====
describe('UpcomingFixtures (expanded)', () => {
  const createUpcomingMatch = (event: number, team1Id = 1, team2Id = 2) => ({
    event, team1Id, team1Name: `Team${team1Id}`, team1PlayerName: `Player${team1Id}`,
    team1Points: 0, team2Id, team2Name: `Team${team2Id}`, team2PlayerName: `Player${team2Id}`,
    team2Points: 0, finished: false, started: false, winner: null,
  })

  it('renders team filter dropdown', () => {
    render(<UpcomingFixtures matches={[createUpcomingMatch(22)]} currentEvent={21} />)
    expect(screen.getByText('Filter by team')).toBeInTheDocument()
  })

  it('filters fixtures by selected team', () => {
    const matches = [
      createUpcomingMatch(22, 1, 2),
      createUpcomingMatch(22, 3, 4),
    ]
    const { container } = render(<UpcomingFixtures matches={matches} currentEvent={21} />)
    expect(container.textContent).toContain('Team3')

    fireEvent.click(screen.getByLabelText('Select team filter'))
    fireEvent.click(screen.getByRole('option', { name: 'Team1' }))
    expect(container.textContent).not.toContain('Team3')
  })

  it('shows match count per gameweek', () => {
    const matches = [
      createUpcomingMatch(22, 1, 2),
      createUpcomingMatch(22, 3, 4),
    ]
    render(<UpcomingFixtures matches={matches} currentEvent={21} />)
    expect(screen.getByText('2 matches')).toBeInTheDocument()
  })

  it('shows singular "match" for single fixture', () => {
    render(<UpcomingFixtures matches={[createUpcomingMatch(22)]} currentEvent={21} />)
    expect(screen.getByText('1 match')).toBeInTheDocument()
  })

  it('shows summary footer with total count', () => {
    const matches = [createUpcomingMatch(22), createUpcomingMatch(23)]
    render(<UpcomingFixtures matches={matches} currentEvent={21} />)
    expect(screen.getByText('Total upcoming matches')).toBeInTheDocument()
    // Should show count = 2
    const { container } = render(<UpcomingFixtures matches={matches} currentEvent={21} />)
    expect(container.textContent).toContain('2')
  })

  it('shows team-specific info in footer when filtered', () => {
    const matches = [createUpcomingMatch(22, 1, 2), createUpcomingMatch(23, 1, 3)]
    render(<UpcomingFixtures matches={matches} currentEvent={21} />)
    fireEvent.click(screen.getByLabelText('Select team filter'))
    fireEvent.click(screen.getByRole('option', { name: 'Team1' }))
    expect(screen.getByText(/For Team1/)).toBeInTheDocument()
  })

  it('renders VS badge in fixture card', () => {
    render(<UpcomingFixtures matches={[createUpcomingMatch(22)]} currentEvent={21} />)
    expect(screen.getByText('VS')).toBeInTheDocument()
  })

  it('shows player names in fixture cards', () => {
    render(<UpcomingFixtures matches={[createUpcomingMatch(22)]} currentEvent={21} />)
    expect(screen.getByText('Player1')).toBeInTheDocument()
    expect(screen.getByText('Player2')).toBeInTheDocument()
  })

  it('groups multiple gameweeks correctly', () => {
    const matches = [
      createUpcomingMatch(22, 1, 2),
      createUpcomingMatch(23, 1, 2),
      createUpcomingMatch(24, 1, 2),
    ]
    render(<UpcomingFixtures matches={matches} currentEvent={21} />)
    expect(screen.getByText('Gameweek 22')).toBeInTheDocument()
    expect(screen.getByText('Gameweek 23')).toBeInTheDocument()
    expect(screen.getByText('Gameweek 24')).toBeInTheDocument()
  })
})

// ===== PL MATCHES (full component) =====
import { PLMatches } from './PLMatches'

describe('PLMatches (component)', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  const createPLMatchesResponse = () => ({
    event: 21,
    totalEvents: 38,
    currentEvent: 21,
    fixtures: [
      {
        id: 1, event: 21,
        homeTeam: { id: 1, name: 'Arsenal', shortName: 'ARS' },
        awayTeam: { id: 2, name: 'Chelsea', shortName: 'CHE' },
        homeScore: 2, awayScore: 1,
        kickoffTime: '2024-01-13T15:00:00Z',
        started: true, finished: true, finishedProvisional: true,
        homePlayers: [
          { id: 1, web_name: 'Saka', position: 'MID', team: 1, bps: 35, bonus: 3, minutes: 90, goals_scored: 1, assists: 1, clean_sheets: 0, defensive_contribution: 2, owner: 'Manager1' },
          { id: 2, web_name: 'Rice', position: 'MID', team: 1, bps: 20, bonus: 0, minutes: 90, goals_scored: 0, assists: 0, clean_sheets: 0, defensive_contribution: 5, owner: null },
        ],
        awayPlayers: [
          { id: 3, web_name: 'Palmer', position: 'MID', team: 2, bps: 28, bonus: 1, minutes: 90, goals_scored: 1, assists: 0, clean_sheets: 0, defensive_contribution: 0, owner: 'Manager2' },
        ],
      },
    ],
  })

  it('shows loading skeleton and GW navigation initially', () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}))
    render(<PLMatches currentEvent={21} />)
    expect(screen.getByText('Gameweek 21')).toBeInTheDocument()
    expect(screen.getByLabelText('Previous gameweek')).toBeInTheDocument()
    expect(screen.getByLabelText('Next gameweek')).toBeInTheDocument()
  })

  it('shows error state on fetch failure', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false })
    render(<PLMatches currentEvent={21} />)
    await waitFor(() => {
      expect(screen.getByText('Failed to load PL fixtures')).toBeInTheDocument()
      expect(screen.getByText('Try again')).toBeInTheDocument()
    })
  })

  it('renders fixtures after successful fetch', async () => {
    const response = createPLMatchesResponse()
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(response),
    })
    render(<PLMatches currentEvent={21} />)
    await waitFor(() => {
      expect(screen.getByLabelText(/Arsenal vs Chelsea/)).toBeInTheDocument()
    })
    expect(screen.getByText(/2 - 1/)).toBeInTheDocument()
  })

  it('expands fixture to show player details with owner badges', async () => {
    const response = createPLMatchesResponse()
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(response),
    })
    render(<PLMatches currentEvent={21} />)
    await waitFor(() => {
      expect(screen.getByLabelText(/Arsenal vs Chelsea/)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByLabelText(/Arsenal vs Chelsea/))
    expect(screen.getByText('Saka')).toBeInTheDocument()
    expect(screen.getByText('Palmer')).toBeInTheDocument()
    expect(screen.getByText('Manager1')).toBeInTheDocument()
    expect(screen.getByText('Manager2')).toBeInTheDocument()
  })

  it('shows empty state when no fixtures in GW', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ event: 21, totalEvents: 38, currentEvent: 21, fixtures: [] }),
    })
    render(<PLMatches currentEvent={21} />)
    await waitFor(() => {
      expect(screen.getByText('No fixtures this week')).toBeInTheDocument()
    })
  })

  it('shows bonus points and DC for players', async () => {
    const response = createPLMatchesResponse()
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(response),
    })
    render(<PLMatches currentEvent={21} />)
    await waitFor(() => {
      expect(screen.getByLabelText(/Arsenal vs Chelsea/)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByLabelText(/Arsenal vs Chelsea/))
    // Saka has bonus=3
    expect(screen.getByText('+3')).toBeInTheDocument()
    // Rice has DC=5
    expect(screen.getByText('DC:5')).toBeInTheDocument()
  })

  it('shows match count per day group', async () => {
    const response = createPLMatchesResponse()
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(response),
    })
    render(<PLMatches currentEvent={21} />)
    await waitFor(() => {
      expect(screen.getByText('1 match')).toBeInTheDocument()
    })
  })

  it('shows Live badge for started but unfinished fixture', async () => {
    const response = {
      event: 21, totalEvents: 38, currentEvent: 21,
      fixtures: [{
        id: 1, event: 21,
        homeTeam: { id: 1, name: 'Arsenal', shortName: 'ARS' },
        awayTeam: { id: 2, name: 'Chelsea', shortName: 'CHE' },
        homeScore: 1, awayScore: 0,
        kickoffTime: '2024-01-13T15:00:00Z',
        started: true, finished: false, finishedProvisional: false,
        homePlayers: [], awayPlayers: [],
      }],
    }
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true, json: () => Promise.resolve(response),
    })
    render(<PLMatches currentEvent={21} />)
    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument()
    })
  })

  it('shows kickoff time for not-started fixture', async () => {
    const response = {
      event: 21, totalEvents: 38, currentEvent: 21,
      fixtures: [{
        id: 1, event: 21,
        homeTeam: { id: 1, name: 'Arsenal', shortName: 'ARS' },
        awayTeam: { id: 2, name: 'Chelsea', shortName: 'CHE' },
        homeScore: null, awayScore: null,
        kickoffTime: '2024-01-13T15:00:00Z',
        started: false, finished: false, finishedProvisional: false,
        homePlayers: [], awayPlayers: [],
      }],
    }
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true, json: () => Promise.resolve(response),
    })
    render(<PLMatches currentEvent={21} />)
    await waitFor(() => {
      // Should show "vs" instead of a score for unstarted fixture
      expect(screen.getByText('vs')).toBeInTheDocument()
    })
  })

  it('navigates to next gameweek on forward button click', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ event: 21, totalEvents: 38, currentEvent: 21, fixtures: [] }),
    })
    render(<PLMatches currentEvent={21} />)
    await waitFor(() => {
      expect(screen.getByText('No fixtures this week')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByLabelText('Next gameweek'))
    expect(screen.getByText('Gameweek 22')).toBeInTheDocument()
  })

  it('navigates to previous gameweek on back button click', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ event: 21, totalEvents: 38, currentEvent: 21, fixtures: [] }),
    })
    render(<PLMatches currentEvent={21} />)
    await waitFor(() => {
      expect(screen.getByText('No fixtures this week')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByLabelText('Previous gameweek'))
    expect(screen.getByText('Gameweek 20')).toBeInTheDocument()
  })

  it('shows goal and assist icons for players', async () => {
    const response = createPLMatchesResponse()
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true, json: () => Promise.resolve(response),
    })
    render(<PLMatches currentEvent={21} />)
    await waitFor(() => {
      expect(screen.getByLabelText(/Arsenal vs Chelsea/)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByLabelText(/Arsenal vs Chelsea/))
    // Saka has 1 goal and 1 assist, Palmer has 1 goal
    const goals = screen.getAllByTitle('Goal')
    expect(goals.length).toBe(2)
    const assists = screen.getAllByTitle('Assist')
    expect(assists.length).toBe(1)
  })

  it('collapses expanded fixture on second click', async () => {
    const response = createPLMatchesResponse()
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true, json: () => Promise.resolve(response),
    })
    render(<PLMatches currentEvent={21} />)
    await waitFor(() => {
      expect(screen.getByLabelText(/Arsenal vs Chelsea/)).toBeInTheDocument()
    })
    // Expand
    fireEvent.click(screen.getByLabelText(/Arsenal vs Chelsea/))
    expect(screen.getByText('Saka')).toBeInTheDocument()
    // Collapse
    fireEvent.click(screen.getByLabelText(/Arsenal vs Chelsea/))
    expect(screen.queryByText('Saka')).not.toBeInTheDocument()
  })
})

// ===== PL MATCHES (computeBpsStats) =====
import { computeBpsStats } from './PLMatches'
import { PLFixturePlayer } from '@/lib/types'

function makePlayer(overrides: Partial<PLFixturePlayer> & { id: number; bps: number }): PLFixturePlayer {
  return {
    web_name: `Player${overrides.id}`,
    position: 'MID',
    team: 1,
    bonus: 0,
    minutes: 90,
    goals_scored: 0,
    assists: 0,
    clean_sheets: 0,
    defensive_contribution: 0,
    owner: null,
    ...overrides,
  }
}

describe('computeBpsStats', () => {
  it('ranks players by BPS descending across both teams', () => {
    const home = [makePlayer({ id: 1, bps: 30 }), makePlayer({ id: 2, bps: 20 })]
    const away = [makePlayer({ id: 3, bps: 25 }), makePlayer({ id: 4, bps: 15 })]
    const { ranks, maxBps } = computeBpsStats(home, away)

    expect(maxBps).toBe(30)
    expect(ranks.get(1)).toBe(1)
    expect(ranks.get(3)).toBe(2)
    expect(ranks.get(2)).toBe(3)
    expect(ranks.get(4)).toBe(4)
  })

  it('gives tied players the same rank', () => {
    const home = [makePlayer({ id: 1, bps: 30 })]
    const away = [makePlayer({ id: 2, bps: 30 }), makePlayer({ id: 3, bps: 10 })]
    const { ranks } = computeBpsStats(home, away)

    expect(ranks.get(1)).toBe(1)
    expect(ranks.get(2)).toBe(1)
    expect(ranks.get(3)).toBe(3)
  })

  it('excludes players with 0 BPS', () => {
    const home = [makePlayer({ id: 1, bps: 10 })]
    const away = [makePlayer({ id: 2, bps: 0 })]
    const { ranks, maxBps } = computeBpsStats(home, away)

    expect(maxBps).toBe(10)
    expect(ranks.get(1)).toBe(1)
    expect(ranks.has(2)).toBe(false)
  })

  it('handles empty player lists', () => {
    const { ranks, maxBps } = computeBpsStats([], [])
    expect(maxBps).toBe(0)
    expect(ranks.size).toBe(0)
  })
})
