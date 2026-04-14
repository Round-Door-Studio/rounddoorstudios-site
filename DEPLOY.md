# Round Door Studios — Deployment Guide

## Overview
This is a single-file static website (`index.html`). No build step needed.  
Hosting: **Vercel** (free tier) → custom domain `www.rounddoorstudio.com`

---

## Step 1 — Set up Mailchimp (free, ~5 min)

Mailchimp's free plan covers up to **500 contacts** and is plenty for a waitlist.

1. Sign up or log in at [mailchimp.com](https://mailchimp.com)
2. Go to **Audience → Manage Audience → Signup forms**
3. Choose **Embedded forms**
4. In the embed code, find the `<form action="...">` line — copy that full URL  
   It looks like: `https://yourdomain.us1.list-manage.com/subscribe/post?u=abc123&amp;id=def456`
5. Open `index.html` and replace the three placeholder values:
   - `MAILCHIMP_ACTION_URL` → the URL you just copied (use `&` not `&amp;`)
   - `MAILCHIMP_U_VALUE` → the `u=` part of that URL (e.g. `abc123`)
   - `MAILCHIMP_ID_VALUE` → the `id=` part of that URL (e.g. `def456`)
6. Also update the honeypot field name:  
   `b_MAILCHIMP_U_VALUE_MAILCHIMP_ID_VALUE` → e.g. `b_abc123_def456`

---

## Step 2 — Push to GitHub

1. Create a new **public** repo at [github.com/new](https://github.com/new)  
   Name it something like `rounddoorstudios-site`
2. In your terminal, from this folder:

```bash
git init
git add index.html
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rounddoorstudios-site.git
git push -u origin main
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

Whenever you edit `index.html`, just push to GitHub:

```bash
git add index.html
git commit -m "Update site"
git push
```

Vercel auto-redeploys in ~30 seconds.
