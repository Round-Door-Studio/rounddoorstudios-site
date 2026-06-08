# Round Door Studios — Deployment Guide

## Overview

This is a static website served directly from the repository root. No build step is needed.

The site is made from:
- Root HTML pages: `index.html`, `about.html`, `library.html`, `story.html`, `bundle.html`, `membership.html`
- Shared assets in `assets/`
- Story catalog data in `data/stories.js`
- Story content JSON in `content/<story-slug>/`

Hosting: Vercel static deployment → custom domain `www.rounddoorstudio.com`

For local testing, do not open `index.html` directly with `file://`. Run a local server instead:

```bash
python3 -m http.server 8123
```
Then visit http://127.0.0.1:8123/.


---

## Step 1 — Confirm the MailerLite waitlist form

The waitlist modal is powered by MailerLite and is defined in `assets/js/modal.js`.

The current form submits to:

```text
https://assets.mailerlite.com/jsonp/2318264/forms/186598057362589116/subscribe
```
You only need to update this if you create a new MailerLite form or switch accounts.

To update it:

In MailerLite, open your embedded/signup form.
Copy the form action URL.
Open assets/js/modal.js.
Replace the URL inside the waitlist form:
<form id="waitlistForm" action="YOUR_MAILERLITE_FORM_URL" method="post">
Keep the email input name as:
name="fields[email]"
Test the form on the deployed site or local server, then confirm the email appears in MailerLite.
For local testing, run:

```bash
python3 -m http.server 8123
Then visit http://127.0.0.1:8123/.
```

Small note: the form currently shows the success message after submit even though MailerLite is called with `no-cors`, so the real confirmation is checking that the email appears in MailerLite.

---

## Step 2 — Commit and push the website files

This folder is already a Git repo, so you do not need to create a new one. After you make website changes, commit the full static site, including HTML pages, assets, story data, and any deleted old files.

From the `RoundDoorStudios` folder, run:

```bash
git status
git add -A
git status
git commit -m "Update Round Door Studio website"
git push
```

Use `git add -A` instead of adding only `index.html`, because the site now depends on `assets/`, `content/`, `data/`, and the other root HTML pages.

If you are pushing a brand-new branch for the first time, use:

```bash
git push -u origin <branch-name>
```

---

## Step 3 — Deploy on Vercel (free)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"** → import your GitHub repo
3. Leave all settings as default (Vercel auto-detects a static HTML project)
4. Click **Deploy** — Vercel gives you a free `*.vercel.app` URL to preview

---

## Step 4 — Connect your custom domain

1. In your Vercel project, go to **Settings → Domains**
2. Add `www.rounddoorstudio.com`
3. Vercel shows you DNS records to add — go to your domain registrar (GoDaddy, Namecheap, etc.)
4. Add the records Vercel specifies (usually a CNAME pointing `www` → `cname.vercel-dns.com`)
5. Wait a few minutes for DNS to propagate — Vercel auto-provisions SSL (HTTPS)

**Tip:** Also add the apex domain `rounddoorstudio.com` (without www) in Vercel and set up a redirect to `www.rounddoorstudio.com` so both work.

---

## Future updates

Whenever you edit the website, commit and push all changed files:

```bash
git add -A
git commit -m "Update website"
git push
```

Vercel auto-redeploys in ~30 seconds.
