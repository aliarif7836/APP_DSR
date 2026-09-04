# Appinventiv HR Dashboard – BDD Test Automation

Cucumber (BDD) + Playwright + TypeScript. Same structure as the PVR suite —
**feature → step definitions → page objects** — with a `.env` driving the URL
and credentials.

## Structure

```
src/
├── config/env.ts          # reads .env -> single source of truth (URL, creds, browser)
├── world/custom-world.ts  # per-scenario `this`: browser/context/page + page-object cache
├── hooks/hooks.ts         # Before/After: launch browser, screenshot on failure
├── pages/
│   ├── PageHelper.ts      # base class
│   ├── LoginPage.ts       # credentials login (selectors verified on live site)
│   └── DsrPage.ts         # DSR -> My DSR -> +Add (selectors are best-guess, see TODOs)
├── steps/
│   ├── login.steps.ts
│   └── dsr.steps.ts
└── features/
    ├── login.feature
    └── dsr.feature
```

## Setup

```bash
npm install
npx playwright install    # downloads browser binaries (skip if already installed)
```

## Configure

Everything env-specific lives in `.env`:

```
BASE_URL=https://dashboard.appinventiv.com
ADMIN_EMAIL=your.name@appinventiv.com
ADMIN_PASSWORD=your-password
BROWSER=chromium
HEADLESS=false
```

**Set your real password in `.env` before running** (it ships with
`ADMIN_PASSWORD=CHANGE_ME`). `.env` is gitignored — never commit it.

## Run

```bash
npm test                  # all features
npm run test:headed       # visible browser
npm run test:login        # only @login
npm run test:dsr          # only @dsr (logs in first via Background)
npm run dry               # dry-run: verifies steps resolve, no browser needed
```

HTML report lands at `reports/cucumber-report.html`.

## Login flow (how it works on this site)

The login page hides the email/password form by default. `LoginPage` does:

1. Open `/admin/dashboard` (redirects to login when logged out)
2. Click **Login with Credentials** (`button.credLoginBtn`) to reveal `#hrm-form`
3. Fill `#iusername` and `#ipassword`
4. Click the form's **Login** submit button
5. Wait for the URL to become `/admin/dashboard`

These selectors were verified against the live site.

## What still needs your input

The **DSR pages sit behind login**, so `DsrPage.ts` uses text-based
best-guess selectors (`a:has-text("DSR")`, `a:has-text("My DSR")`,
`+Add` button) with `TODO` markers. If a step fails there: log in manually,
right-click the menu/button -> Inspect, and replace the selector with the
real id/class. Then keep adding new scripts the same way:

1. Create `src/pages/XyzPage.ts` extending `PageHelper`, selectors in one `elements` object.
2. Add steps in `src/steps/xyz.steps.ts` (use `this` typed as `CustomWorld`).
3. Register the page object on `CustomWorld` if you cache it on `this`.
4. Write `src/features/xyz.feature`.

---

## Automated daily runs (GitHub Actions)

`.github/workflows/daily-dsr.yml` files the DSR without anyone opening a
terminal.

**Schedule:** `30 13 * * 1-5` — Mon–Fri at **13:30 UTC = 19:00 IST**.
GitHub cron is always UTC and does not follow DST or Indian holidays.

**Manual run:** Actions → *Daily DSR* → *Run workflow*. Optional inputs:

| Input | Effect |
|---|---|
| `description` | Today's DSR text. Overrides `dsr-description.txt`. |
| `estimated_hours` | Overrides `DSR_ESTIMATED_HOURS`. |
| `dry_run` | Opens the form but does **not** submit (runs `@TC_DASH_DSR_1`). |

### Required repository secrets

Settings → Secrets and variables → Actions → *Secrets*:

| Secret | Value |
|---|---|
| `ADMIN_EMAIL` | Your official Appinventiv email |
| `ADMIN_PASSWORD` | Your dashboard password |

There are **no fallback credentials in the code**. A run without these
secrets fails at the verification step with a clear message.

### Optional repository variables

Settings → Secrets and variables → Actions → *Variables*. All have defaults:

| Variable | Default |
|---|---|
| `BASE_URL` | `https://dashboard.appinventiv.com` |
| `DSR_PROJECT` | `Whataburger` |
| `DSR_ESTIMATED_HOURS` | `8:30` |
| `DSR_USED_AI_TOOLS` | `yes` |

### Where the description comes from

1. `DSR_DESCRIPTION` env var — set by a manual run's `description` input.
2. `dsr-description.txt` — the committed file, used by scheduled runs.

A scheduled run has no one to type the text, so **it submits whatever is
committed in `dsr-description.txt`**. Keep that file current, or trigger the
workflow manually with the `description` input each day.

### Results

Every run uploads a `dsr-run-<number>` artifact containing
`reports/cucumber-report.html` and the end-of-scenario screenshots.
Retained for 14 days.
