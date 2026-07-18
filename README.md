# The Inner Me — Coach Herb (live) — Setup

This gives Coach Herb a real brain, powered by Claude, running securely so your
API key is never exposed. You'll do this once. No command line — all through
websites you click around in. Budget about 15 minutes.

**Before you start, add your images:** put your existing `images` folder into
this project folder (next to `index.html`) so the photos come along.

---

## Step 1 — Get a Claude API key (about 5 min)

1. Go to **console.anthropic.com** and sign in (this is the *developer* console —
   separate from the claude.ai chat app).
2. Add a little credit: **Settings → Billing → Add credits**. $5–$10 is plenty to
   start; each conversation costs a fraction of a cent to a few cents.
3. Create the key: **Settings → API keys → Create Key**. Copy it and keep it
   somewhere safe. You'll paste it into Netlify in Step 3. **Never put this key in
   the website files or share it.**

---

## Step 2 — Put this project on GitHub (about 5 min)

1. Go to **github.com**, sign in (or make a free account).
2. Click **New repository**. Name it anything (e.g. `the-inner-me`). Leave it
   Public or Private — either works. Click **Create repository**.
3. On the new repo page, click **uploading an existing file**.
4. Drag **everything in this folder** into the upload box — `index.html`,
   `coach.html`, `netlify.toml`, your `images` folder, and the `netlify` folder
   (which contains `functions/coach.js`). Keep the folders as-is.
5. Click **Commit changes**.

---

## Step 3 — Connect GitHub to Netlify and add your key (about 5 min)

1. In **Netlify**, go to your site → or click **Add new site → Import an existing
   project → Deploy with GitHub**, and pick the repository you just made.
   (If you'd rather keep your current site, use **Site configuration → Build &
   deploy → Link repository** to point it at the new GitHub repo.)
2. Leave the build settings at their defaults and deploy.
3. Add your key: **Site configuration → Environment variables → Add a variable**.
   - Key: `ANTHROPIC_API_KEY`
   - Value: paste the key from Step 1.
   - Save.
4. Trigger one more deploy so the key is picked up: **Deploys → Trigger deploy →
   Deploy site**.

---

## Done — talk to Coach Herb

Open your site and click **Talk to Coach Herb** (top bar), or go straight to
`your-site-address/coach.html`. Type something real and he'll respond — hearing
you, reflecting it back, teaching into it, then offering to move forward or go
deeper.

From now on, to change anything: edit the file on GitHub (or re-upload it) and
Netlify redeploys automatically — no more dragging folders.

### Notes
- The model is set in `netlify/functions/coach.js` (the `MODEL` line). It's on
  `claude-sonnet-4-6` for a good balance of quality and cost. Change it to
  `claude-opus-4-8` for maximum depth (costs more per message).
- Coach Herb's personality, knowledge, method, and safety rules all live in the
  `SYSTEM_PROMPT` in that same file — edit it to refine who he is.
- If Coach Herb says he "isn't connected yet," the API key wasn't set or the site
  hasn't redeployed since you added it — repeat Step 3.3–3.4.
