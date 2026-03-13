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
