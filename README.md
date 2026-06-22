# Round Door Studios

Bilingual Mandarin/English children's storytelling platform. Built with Next.js 15 App Router + TypeScript.

## Development

```bash
npm install
npm run dev       # http://localhost:3000
```

## Database (Supabase)

The site uses Supabase (Postgres) for story data, auth, and subscriptions.

### Setup

1. Copy your Supabase keys into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

2. Run the schema SQL in the Supabase SQL Editor (see `scripts/seed.ts` header for table definitions).

### Seeding

Story data lives in `lib/stories.ts` (catalog metadata) and `content/<slug>/*.json` (story content). To push the local data to Supabase:

```bash
npm run seed
```

The seed script uses `upsert` so it is safe to run repeatedly — existing rows are updated, not duplicated. Run it whenever you add or update a story.

**Workflow for new/updated stories:**
1. Edit `lib/stories.ts` and/or `content/<slug>/*.json` locally
2. Run `npm run seed`
3. Changes are live in the DB

## Testing

### Unit tests (Vitest)

Fast — no browser needed. Run these after every change.

```bash
npm test              # watch mode (re-runs on save)
npm test -- --run     # single pass
```

Covers: story catalog data, ruby annotation rendering, script toggle logic.

### E2E tests (Playwright)

Playwright drives a real browser against a running dev server. **The dev server must be running before you start E2E tests** — start it in one terminal and leave it up:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:e2e              # headless (Chromium + Mobile Safari)
npm run test:e2e:ui           # interactive Playwright UI
npx playwright test --project=chromium   # Chromium only (faster)
```

The Playwright config uses `reuseExistingServer: true` locally, so it will reuse your running server rather than starting a new one. If no server is running when the tests start, Playwright will attempt to launch one — but the cold-start delay can cause the first batch of tests to fail with `ERR_CONNECTION_REFUSED`. Always keep a warm dev server running to avoid this.

Tests cover: homepage, library, and story page flows across desktop and mobile viewports.

If tests fail, the HTML report is at `playwright-report/index.html`.

### Run everything

To run unit tests and E2E in one shot (requires a running dev server — see above):

```bash
npm run test:all
```

### CI

GitHub Actions runs unit tests + Chromium E2E on every push and PR. The `main` branch requires all checks to pass before merging.
