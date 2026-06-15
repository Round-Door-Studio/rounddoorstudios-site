# Round Door Studios

Bilingual Mandarin/English children's storytelling platform. Built with Next.js 15 App Router + TypeScript.

## Development

```bash
npm install
npm run dev       # http://localhost:3000
```

## Testing

### Unit tests (Vitest)

Fast — no browser needed. Run these after every change.

```bash
npm test              # watch mode (re-runs on save)
npm test -- --run     # single pass
```

Covers: story catalog data, ruby annotation rendering, script toggle logic.

### E2E tests (Playwright)

Spins up the Next.js dev server and drives a real browser. Run these before opening a PR or after larger changes.

```bash
npm run test:e2e              # headless (Chromium + Mobile Safari)
npm run test:e2e:ui           # interactive Playwright UI
npx playwright test --project=chromium   # Chromium only (faster)
```

Tests cover: homepage, library, and story page flows across desktop and mobile viewports.

If tests fail, the HTML report is at `playwright-report/index.html`.

### CI

GitHub Actions runs unit tests + Chromium E2E on every push and PR. The `main` branch requires all checks to pass before merging.
