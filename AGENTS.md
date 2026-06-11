<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Baseball Scorecard

Next.js 16 (App Router) app for keeping score of a baseball game. Deployed to
AWS Amplify Hosting; persistence is DynamoDB via the AWS SDK v3.

## Conventions
- **Styling:** a from-scratch design system written in SCSS (no Tailwind).
  Sass is supported natively by Next/Turbopack — no loader config needed.
  Tokens/mixins/base are partials in `styles/` (`_tokens.scss`, `_mixins.scss`,
  `_base.scss`); component styles import the design system via
  `@use "…/design" as *;` and use CSS Modules (`*.module.scss`).
- **Data:** all DynamoDB access goes through `lib/dynamo.ts` (`getDocClient()`).
  Domain types live in `lib/types.ts`; table access helpers in `lib/games.ts`.
- **Env:** see `.env.local.example`. Credentials are optional locally and
  unset in prod (the Amplify IAM role supplies them).
