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
      id: 1, event: 21, managerName: 'Manager', playerIn: 'Salah',
      playerOut: 'Bruno', type: 'waiver' as const, date: '2024-01-01',
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

  it('shows defensive contribution for DEF and MID players', () => {
    const breakdownWithPlayers = {
      1: {
        entryId: 1, teamName: 'Home Team', playerName: 'Manager A',
        totalPoints: 55, players: [
          { name: 'Defender', points: 6, position: 1, isBenched: false, positionName: 'DEF',
            teamShortName: 'ARS', opponentShortName: 'CHE', isHome: true, opponents: [{ opponentShortName: 'CHE', isHome: true, started: true }],
            goals: 0, assists: 0, cleanSheet: true, bonus: 0, yellowCards: 0, redCards: 0, hasPlayed: true, defensiveContribution: 5 },
          { name: 'Midfielder', points: 8, position: 2, isBenched: false, positionName: 'MID',
            teamShortName: 'ARS', opponentShortName: 'CHE', isHome: true, opponents: [{ opponentShortName: 'CHE', isHome: true, started: true }],
            goals: 1, assists: 0, cleanSheet: false, bonus: 0, yellowCards: 0, redCards: 0, hasPlayed: true, defensiveContribution: 3 },
          { name: 'Forward', points: 10, position: 3, isBenched: false, positionName: 'FWD',
            teamShortName: 'ARS', opponentShortName: 'CHE', isHome: true, opponents: [{ opponentShortName: 'CHE', isHome: true, started: true }],
            goals: 2, assists: 0, cleanSheet: false, bonus: 0, yellowCards: 0, redCards: 0, hasPlayed: true, defensiveContribution: 2 },
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
    // Should show defensive contribution count for DEF (5) and MID (3) but not FWD
    expect(container.textContent).toContain('DC:5')
    expect(container.textContent).toContain('DC:3')
    expect(container.textContent).not.toContain('DC:2') // FWD should not show defensive contribution
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
