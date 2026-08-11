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
