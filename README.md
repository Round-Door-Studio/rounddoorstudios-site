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

Story data is authored locally in `lib/stories.ts` (catalog metadata) and `content/<slug>/*.json` (story content files). The seed script uses `upsert` — safe to run repeatedly. Existing rows are updated, not duplicated.

**Always preview before writing.** The default `npm run seed` is a dry run — it fetches the current DB state and shows exactly what would change without writing anything:

```bash
npm run seed        # dry run — shows a diff, writes nothing
npm run seed:write  # applies the changes to production
```

Example dry run output:
```
DRY RUN — no writes will be made. Pass --write to apply.

Stories

  ~ fox-borrows-tigers-might
    released: false → true
    blurb: null → "A clever fox borrows the tiger's fearsome reputation..."
  · frog-at-the-bottom-of-the-well (no changes)

Dry run complete. Run with --write to apply.
```

**Workflow for publishing a new episode:**
1. Add the story entry to `lib/stories.ts` (set `released: false` until ready)
2. Add content files to `content/<slug>/` — `story.json`, `vocab.json`, `questions.json`, `activities.json`
3. Run `npm run seed` and review the diff
4. Set `released: true` in `lib/stories.ts` when ready to go live
5. Run `npm run seed` again to confirm the diff looks right
6. Run `npm run seed:write` — story is live, no deploy needed

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

Playwright drives a real browser. The Playwright config uses `reuseExistingServer: true` locally, so it reuses a running dev server if one is up — otherwise it starts one automatically.

```bash
npm run test:e2e              # Chromium only (default locally)
npm run test:e2e:ui           # interactive Playwright UI
npx playwright test --project=chromium   # explicit Chromium
npx playwright test --project="Mobile Safari"   # WebKit only
```

Locally only Chromium runs by default — Mobile Safari (WebKit) requires macOS 15+ and runs in CI on Ubuntu. Tests cover auth flows, story page interactions, content gating, and nav across desktop and mobile viewports.

If tests fail, the HTML report is at `playwright-report/index.html`.

### Node.js version

This project requires **Node.js 22 LTS**. Node 24 has a known incompatibility with Playwright's module resolver. Use [nvm](https://github.com/nvm-sh/nvm) to manage versions — a `.nvmrc` is included:

```bash
nvm use   # switches to Node 22 automatically
```

### Run everything

```bash
npm run test:local   # unit tests + Chromium E2E (daily use)
npm run test:all     # unit tests + Chromium + Mobile Safari (mirrors CI, run before merging)
```

### CI

GitHub Actions (`.github/workflows/ci.yml`) runs two parallel jobs on every push and PR to `main`:
- **Lint, Typecheck & Unit Tests** — fast, no browser needed
- **E2E Tests** — builds the app and runs Playwright on Chromium + Mobile Safari

All checks must pass before merging.

