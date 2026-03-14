# FPL Draft League Dashboard

Fantasy Premier League analytics dashboard for a 6-person draft league ("Hogwarts", League ID 37265).

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript (strict mode)
- Tailwind CSS with CSS custom properties (dark mode only)
- Vitest + Testing Library for tests
- Deployed on Vercel

## Commands

- `npm run dev` — start dev server
- `npm test` — run tests once (vitest run)
- `npm run test:watch` — run tests in watch mode
- `npm run lint` — run ESLint
- `npm run build` — production build
- `npm run deploy` — test + build + deploy to Vercel

## Architecture

- `app/page.tsx` — server component, fetches all data via `lib/api.ts` and passes as props
- `components/Dashboard.tsx` — client component with tab-based layout
- `lib/api.ts` — all data fetching and processing logic (dual-mode: direct API server-side, `/api/fpl` proxy client-side)
- `lib/types.ts` — shared TypeScript types
- `app/api/fpl/[...path]/route.ts` — proxy to FPL API (60s revalidate)
- `app/globals.css` — design tokens as CSS custom properties

## Code Conventions

- Components are `"use client"` with functional style and hooks
- Props interfaces defined inline above each component
- No global state management — server data passed as props, local state via useState
- Mobile-first responsive design with Tailwind utilities
- Tailwind classes + CSS variables (e.g. `var(--accent)`, `var(--card)`, `var(--pos-gk)`)
- Tests live alongside source files (`*.test.ts`, `*.test.tsx`)

## Design Rules

- Dark mode only — no theme toggle
- Manual refresh only — no polling (avoid FPL API rate limits)
- No authentication — public app
- Accessibility: 44x44px min touch targets, focus states, semantic HTML

## Testing

- Use Vitest (not Jest) — the project is configured for Vitest
- When adding new data processing functions in `lib/api.ts`, add corresponding tests in `lib/api.test.ts`
- Component tests go in `components/index.test.tsx`

## Working Principles

### Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
