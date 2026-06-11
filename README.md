# Baseball Scorecard

A Next.js 16 web app for keeping a traditional baseball scorecard — create a
game, build each team's lineup, and record the outcome of every plate
appearance inning by inning. Deployed to AWS Amplify Hosting, backed by
DynamoDB.

## What it does

A scorecard tracks, for each batter and inning, what happened when they came to
the plate. This app digitizes that:

- **Games list** (`/`) — create a new game (date + home/away team names) and see
  all saved games. Each game can be opened or deleted.
- **Game view** (`/game/[id]`) — the scoreboard: line score and status for both
  teams.
- **Team scorecard** (`/game/[id]/[team]`) — `team` is `home` or `away`. Shows
  that team's batting order and innings, with a toggle to flip between the two
  teams. "Add Inning" appends an empty frame for the team to bat through.
- **Plate appearance** (`/game/[id]/[team]/[inningNumber]/[lineupSpot]`) — the
  scoring form for one batter in one inning. Record the result (hit, walk,
  strikeout, out, etc.), how many bases the runner reached (an interactive
  diamond), and RBIs. Saving writes the plate appearance and returns you to the
  team scorecard.

### Scoring model

Each trip to the plate is a `PlateAppearance` carrying a `result` in standard
scorebook shorthand (`1B`, `HR`, `BB`, `K`, `ꓘ` for a called third strike, `GO`,
`DP`, `SF`, …). The model distinguishes plate appearances from official at-bats
(`countsAsAtBat` is false for walks, HBP, and sacrifices). See `lib/types.ts`
for the full domain model.

## Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- Server Components and **Server Actions** for all mutations (no client-side
  data fetching); pages are `force-dynamic` and read from DynamoDB per request
- **DynamoDB** via the AWS SDK v3 (`@aws-sdk/lib-dynamodb`)
- A **from-scratch design system in SCSS** — no Tailwind. See `styles/` and the
  live reference at `/styleguide`.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in region + table name
npm run dev
```

Open http://localhost:3000.

You'll need a DynamoDB table (default name `baseball-scorecard-games`) with a
string partition key `id`. Locally, set `DYNAMO_ACCESS_KEY_ID` /
`DYNAMO_SECRET_ACCESS_KEY` in `.env.local`; in Amplify, grant the compute role
DynamoDB access instead and leave those unset.

### Scripts
| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Layout
```
app/
  page.tsx                              games list + new-game form
  game/[id]/                            scoreboard for one game
    [team]/                             home/away scorecard (lineup + innings)
      [inningNumber]/[lineupSpot]/      plate-appearance scoring form
  api/games/                           list + create
  api/games/[id]/                      fetch / update / delete one game
  components/                          scoreboard, scorecard, diamond, forms, …
  styleguide/                          living design-system reference page
lib/        dynamo client, domain types, table + scoring helpers
styles/     SCSS design system (tokens, mixins, base, globals)
```

Data access is centralized: every DynamoDB call goes through `lib/dynamo.ts`
(`getDocClient()`), and table operations live in `lib/games.ts`.

## Styling

SCSS is compiled by Next/Turbopack's built-in Sass support — no loader config.
`styles/globals.scss` is imported once in `app/layout.tsx`; component styles use
CSS Modules named `*.module.scss` and pull in tokens + mixins via
`@use "…/styles/design" as *;`. The `/styleguide` page renders every color,
type size, spacing step, radius, shadow, button, and card straight from the
tokens, so it can't drift from the system.
