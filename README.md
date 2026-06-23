# Round Door Studios

Bilingual Mandarin/English children's storytelling platform. Built with Next.js 15 App Router + TypeScript.

## Development

```bash
npm install
npm run dev       # http://localhost:3000
```

---

## Database (Supabase)

The site uses Supabase (Postgres) for story catalog, story content, and user auth. All runtime reads go through the DB — no JSON files are read at runtime.

### Environment variables

Copy your Supabase keys into `.env.local` (never committed):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Teammates need their own `.env.local` with the same keys — get them from the Supabase dashboard under **Project Settings → API**.

### Schema

Three main tables:

| Table | Description |
|---|---|
| `stories` | Story catalog — metadata, titles, audio links, cover images |
| `story_content` | Story pack content — read-along, vocab, questions, activities (JSONB) |
| `profiles` | User profiles — name, email, synced from `auth.users` on signup |

Row-level security:
- **`stories`**: anon + authenticated can read released stories
- **`story_content`**: authenticated users only (service role used server-side for locked preview counts)
- **`profiles`**: users can read/write their own row

### Seeding

Story data is authored locally in `lib/stories.ts` (catalog metadata) and `content/<slug>/*.json` (story content files). Push to Supabase with:

```bash
npm run seed
```

The seed script uses `upsert` — safe to run repeatedly. Existing rows are updated, not duplicated.

**Workflow for publishing a new episode:**
1. Add the story entry to `lib/stories.ts` (set `released: true` when ready to go live)
2. Add content files to `content/<slug>/` — `story.json`, `vocab.json`, `questions.json`, `activities.json`
3. Run `npm run seed`
4. Story is live — no deploy needed

---

## Auth

Auth is handled by Supabase Auth with email/password and Google OAuth.

### How it works

- The auth modal lives in the Nav — "Login" and "Join the Circle" buttons when logged out
- Sign up collects name, email, and password. Name is stored in `user_metadata` and synced to the `profiles` table via a Postgres trigger
- Google OAuth redirects through Supabase and back to `/auth/callback`, which exchanges the code for a session
- Sessions are refreshed on every request via middleware
- After sign in/up: home page → redirects to `/library`; any other page → stays on current page
- Logout stays on the current page

### Content gating

- All pages (library, story pages) are publicly accessible
- Story Pack tabs (Read Along, New Words, Curious Questions, Culture Corner) are locked for logged-out users on stories 2+
- Story 1 (`frog-at-the-bottom-of-the-well`) is always fully open as a sample
- Locked users see blurred preview cards with real counts (vocab words, questions, activities) and a "Join the Circle" CTA

### Supabase Auth settings

| Setting | Value |
|---|---|
| Email confirmations | Disabled (users can sign in immediately after signup) |
| Google OAuth | Enabled — credentials in Supabase dashboard under Authentication → Providers |
| Password minimum | 8 characters (set in Authentication → Sign In / Providers → Email) |

### Profile trigger

A Postgres trigger auto-creates a `profiles` row on every new signup. If you need to re-create it:

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

To backfill existing auth users into `profiles`:

```sql
insert into public.profiles (id, email, full_name)
select id, email, raw_user_meta_data->>'full_name'
from auth.users
on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name;
```

---

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

> **Note:** Tests have not yet been updated to cover auth flows and story pack gating (Phase 2) or DB reads (Phase 3). Update the test suite before the next major release.
