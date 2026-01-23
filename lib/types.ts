// League Details Response
export interface LeagueDetails {
  league: League
  league_entries: LeagueEntry[]
  matches: Match[]
  standings: Standing[]
}

export interface League {
  id: number
  name: string
  admin_entry: number
  closed: boolean
  draft_dt: string
  draft_status: string
  scoring: string
  start_event: number
  stop_event: number
  trades: string
  transaction_mode: string
  variety: string
}

export interface LeagueEntry {
  entry_id: number
  entry_name: string
  id: number
  player_first_name: string
  player_last_name: string
  short_name: string
  waiver_pick: number
}

export interface Match {
  event: number
  finished: boolean
  started: boolean
  league_entry_1: number
  league_entry_1_points: number
  league_entry_2: number
  league_entry_2_points: number
  winning_league_entry: number | null
  winning_method: string | null
}

export interface Standing {
  league_entry: number
  rank: number
  last_rank: number
  rank_sort: number
  matches_played: number
  matches_won: number
  matches_drawn: number
  matches_lost: number
  points_for: number
  points_against: number
  total: number
}

// Element Status Response (Player Ownership)
export interface ElementStatusResponse {
  element_status: ElementStatus[]
}

export interface ElementStatus {
  element: number
  in_accepted_trade: boolean
  owner: number | null
  status: 'a' | 'o' // available or owned
}

// Bootstrap Static Response (Players and Teams)
export interface BootstrapStatic {
  elements: Player[]
  element_types: ElementType[]
  teams: Team[]
  events: Events
  fixtures: Record<string, Fixture[]>
}

export interface Fixture {
  id: number
  event: number
  team_a: number
  team_h: number
  team_a_score: number | null
  team_h_score: number | null
  finished: boolean
  started: boolean
}

export interface Events {
  current: number
  data: Event[]
}

export interface Player {
  id: number
  code: number
  first_name: string
  second_name: string
  web_name: string
  team: number
  element_type: number
  total_points: number
  goals_scored: number
  assists: number
  clean_sheets: number
  goals_conceded: number
  saves: number
  bonus: number
  form: string
  points_per_game: string
  now_cost: number
  status: string
  news: string
}

export interface ElementType {
  id: number
  plural_name: string
  plural_name_short: string
  singular_name: string
  singular_name_short: string
}

export interface Team {
  id: number
  name: string
  short_name: string
}

export interface Event {
  id: number
  name: string
  deadline_time: string
  finished: boolean
  is_current: boolean
  is_next: boolean
}

// Transactions Response
export interface TransactionsResponse {
  transactions: Transaction[]
}

export interface Transaction {
  id: number
  added: string
  element_in: number
  element_out: number
  entry: number
  event: number
  kind: 'w' | 'f' // waiver or free agent
  result: 'a' | 'di' | 'do' | null // accepted, declined-in, declined-out
  index: number | null
  priority: number | null
}

// Processed data types for components
export interface ManagerWithSquad {
  entry: LeagueEntry
  standing: Standing
  squad: Player[]
}

export interface FixtureWithNames {
  event: number
  team1Id: number
  team1Name: string
  team1PlayerName: string
  team1Points: number
  team2Id: number
  team2Name: string
  team2PlayerName: string
  team2Points: number
  finished: boolean
  started: boolean
  winner: string | null
}

export interface TransactionWithDetails {
  id: number
  event: number
  managerName: string
  playerIn: string
  playerInTeam: string
  playerInPhoto: string | null
  playerOut: string
  playerOutTeam: string
  playerOutPhoto: string | null
  type: 'waiver' | 'free'
  date: string
}

// Draft Choices Response
export interface DraftChoicesResponse {
  choices: DraftChoice[]
}

export interface DraftChoice {
  id: number
  element: number
  entry: number
  entry_name: string
  player_first_name: string
  player_last_name: string
  round: number
  pick: number
  index: number
}

// Entry Picks Response
export interface EntryPicksResponse {
  picks: Pick[]
}

export interface Pick {
  element: number
  position: number
  is_captain: boolean
  is_vice_captain: boolean
  multiplier: number
}

// Live Event Response
export interface LiveEventResponse {
  elements: Record<string, LiveElement>
  fixtures: LiveFixture[]
}

export interface LiveElement {
  stats: {
    total_points: number
    goals_scored: number
    assists: number
    clean_sheets: number
    bonus: number
    yellow_cards: number
    red_cards: number
    own_goals: number
    penalties_missed: number
    penalties_saved: number
    saves: number
    // Defensive stats
    clearances_blocks_interceptions: number
    recoveries: number
    tackles: number
    defensive_contribution: number
  }
  explain: Array<[Array<{ name: string; points: number; value: number; stat: string }>, number]>
}

export interface LiveFixture {
  id: number
  event: number
  team_a: number
  team_h: number
  finished: boolean
  started: boolean
}

// Processed types for points breakdown
export interface PlayerPoints {
  name: string
  points: number
  position: number
  isBenched: boolean
  positionName: string
  teamShortName: string
  opponentShortName: string
  isHome: boolean
  goals: number
  assists: number
  cleanSheet: boolean
  bonus: number
  yellowCards: number
  redCards: number
  hasPlayed: boolean
  // Defensive stats (for DEF and MID)
  defensiveContribution: number
}

export interface TeamPointsBreakdown {
  entryId: number
  teamName: string
  playerName: string
  totalPoints: number
  players: PlayerPoints[]
}

// What If types
export interface WhatIfSquad {
  entryId: number
  teamName: string
  managerName: string
  players: WhatIfPlayer[]
  totalPoints: number
}

export interface WhatIfPlayer {
  id: number
  name: string
  positionName: string
  teamShortName: string
  totalPoints: number
  draftRound: number
}

// Deadline info
export interface DeadlineInfo {
  nextEvent: number
  waiverDeadline: string | null
  lineupDeadline: string | null
}
