# FPL Draft League App - Project Notes

## League Info
- **League ID:** 37265
- **League Name:** Hogwarts
- **Players:** 6 friends

## Design Decisions
- **No authentication** - public app, anyone with link can view
- **Dark mode only** - no theme toggle
- **Manual refresh only** - avoid FPL API rate limits (no polling)
- **Mobile-first** - but works on desktop too

## Key Features
- **Gameweek widget** - shows H2H matchups with expandable player breakdown
  - Shows player position, team, opponent, points
  - Stat icons: goals, assists, clean sheets, cards
- **Standings** - main league table (full season)
- **Summer Championship** - separate table starting from GW 20+
- **Transactions** - shows only current GW transactions

## API Endpoints Used
All from `https://draft.premierleague.com/api/`:
- `/league/{id}/details` - league info, standings, matches
- `/league/{id}/element-status` - player ownership
- `/bootstrap-static` - all players, teams, positions
- `/draft/league/{id}/transactions` - trades and waivers
- `/entry/{id}/event/{gw}` - team picks for a gameweek
- `/event/{gw}/live` - live points and fixtures

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Vitest for testing
- Deployed on Vercel

## Testing
- Run `npm test` to run all tests
- Run `npm run test:watch` for watch mode
- Tests cover: processTransactions, processFixtures, calculateStandingsFromGameweek, getCurrentEvent, getPositionName

## Deploy Process
Always run tests before deploying:
```bash
npm test && npm run build && vercel --prod
```
