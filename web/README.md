# BFit Pulse

A dedicated, mobile-friendly site for the public BFit counts linked by UCLA Recreation, with an optional community observation form. Independent student project; not affiliated with UCLA, NOM, or Connect2.

Public site: https://bfit-pulse.atomicmacaron2.chatgpt.site

## Start here

This is the **website source** inside the bfit-pulse repository. Open the repository root in VS Code, Cursor, or another editor. Run website commands from this `web/` folder; the deployed app runs on Sites / Cloudflare.

After installing dependencies and initializing this clone’s local database, double-click **Start-BFit.command**, then open the Local URL printed in Terminal (normally http://localhost:5173). Keep Terminal open while editing. React and CSS changes refresh automatically. Stop the server with Control-C. If macOS does not open the launcher, run `zsh Start-BFit.command` from Terminal in this folder.

On another computer, install **Node.js 24 LTS** (includes npm), run `npm ci`, complete the local database setup below, then run `npm run dev`.

To request changes, say **“Edit the bfit-pulse repository’s web folder: [your change]”** and point your editor or Codex chat at this repository.

## Where to edit things

| File | What it controls |
| --- | --- |
| `app/pulse-app.tsx` | Main navigation, live dashboard, visit page, data explanation, optional report form |
| `app/ucla-counts.tsx` | Count display, 15-second auto-refresh, source links, freshness warnings |
| `app/globals.css` | Colors, fonts, spacing, mobile and desktop layout |
| `lib/bfit-hours.ts` | Published hours parser, Pacific-time opening/closing rules, and attendance visibility |
| `data/bfit-hours-fall-2026.json` | Researched fallback, date limits, and source citations |
| `app/api/hours/route.ts` | Fetches and caches UCLA’s published hours |
| `app/bfit-hours-panel.tsx` | Open/Closed status, next opening, regular and holiday hours |
| `lib/ucla-counts.ts` | Public source URLs, BFit filtering, capacity math, timestamp interpretation |
| `app/api/ucla-counts/route.ts` | Server-side provider fetch, shared cache, last-known-count fallback |
| `lib/network.ts` | Full-request deadlines so stalled network/body reads can recover |
| `lib/pulse.ts` | Optional observation categories and report types |
| `app/api/pulse/route.ts` | Observation persistence, sign-in, permissions, cooldown |
| `db/schema.ts` | Reports and last-successful source snapshot tables |
| `drizzle/` | Versioned SQL migrations; never edit an applied migration |
| `app/layout.tsx` | Browser title, description, icon |
| `public/favicon.svg` | App icon |
| `.openai/hosting.json` | Sites project ID and Cloudflare database binding |
| `tests/ucla-counts.test.mjs` | Count, timestamp, freshness, and validation tests |
| `PILOT-PROPOSAL.md` | Proposal you can adapt for UCLA |

## Software and services

- **React 19 + TypeScript** for the interface and app code.
- **Vinext + Vite** for local development and production builds.
- **CSS + Lucide icons** for the design.
- **Cloudflare Workers** for hosted server routes.
- **Cloudflare D1 / SQLite + Drizzle** for the shared count cache and optional reports.
- **Sites plugin** for source repository, hosting, access permissions, and deployments.
- **ChatGPT sign-in through Sites** for optional report submissions; it does not verify UCLA affiliation.
- **Git** for tracked source revisions.

No AI API or paid mapping API is required at runtime. Account-specific hosting limits or costs are not assumed by this app.

## What the site shows

The default page is dedicated to real source counts. It displays the five BFit zones currently supplied by UCLA’s public widget: Cardio Zones 1&2, Flexibility Zones, Free Weight & Squat Zones, Cable/Synergy Zones, and Selectorized Zone. Cards use familiar names such as Stretching and Weight machines. Original UCLA area names are preserved in the data and listed under “What do count and capacity mean?” on the dashboard.

The app shows each reported count, listed zone capacity, percentage, and source update time. Open-zone counts and capacities are summed for the top summary. Those sums are **not a deduplicated turnstile total or a verified building occupancy/safety limit**. Closed zones are labeled and excluded from that summary. No forecast, sample data, or community estimate is presented as source data.

An optional collapsed section lets users read or share community observations. These never modify the UCLA-linked counts. New observations require sign-in, an on-site confirmation, and a server-enforced one-minute cooldown. On-site presence and UCLA affiliation are not independently verified.

## Exactly where the counts come from

UCLA’s [BFit page](https://recreation.ucla.edu/facilities/bfit) links to the public [Connect2 count widget](https://www.connect2mycloud.com/Widgets/Data/locationCount?facility=803&key=73829a91-48cb-4b7b-bd0b-8cf4134c04cd&type=bar). Its public JavaScript reads `GetCountsByAccount` at `goboardapi.azurewebsites.net`. BFit Pulse uses that same endpoint server-side and returns only **FacilityId 803** (BFit).

The widget key in the URL is intentionally public and browser-visible, not a private credential. No private provider account or credentials are used. This public endpoint has no contracted stability guarantee; coordinate with UCLA/Connect2 before an official campus launch.

Count values use `LastCount`; capacities use `TotalCapacity`. Percentages are calculated from those fields, matching the widget. Do not use `CountOfParticipants` or `PercetageCapacity`; they can be zero even when `LastCount` is nonzero. Duplicate zone IDs or invalid count/capacity values are rejected rather than fabricating a subtotal.

## Automatic updates and source freshness

- While visible, the live view checks every **15 seconds** without reloading.
- Returning to the tab or focusing the window triggers a check; a manual Refresh button is also available.
- A **15-second shared D1 cache** limits repeated provider requests. Each request owns its network work; pending fetch promises are never reused across visitor requests. Multiple requests can occasionally fetch concurrently at cache expiry.
- Normal source changes should appear within roughly **30 seconds** of becoming available, plus network delays. This is polling, not a push/event subscription. Background browser throttling and outages can delay updates.
- Source fetches are bounded to six seconds, optional database reads/writes to 1.5 seconds each, and browser requests to 12 seconds. A stalled request releases the refresh control and allows automatic retries. Existing displayed counts stay visible with a warning.
- The displayed **source update time** stays unchanged if the source count has not been updated. “Last check” shows the app’s separate check time.
- A source timestamp over 60 minutes old, missing/invalid, or over five minutes in the future triggers a warning.
- On provider failure, the last saved counts remain visible with a warning and their original timestamps. Without a saved snapshot, show an unavailable state and source links, never sample counts.

The provider currently returns timestamps without a time zone. The app interprets those as **America/Los_Angeles / campus Pacific time**, including DST, and discloses that assumption on screen. Original timestamp strings are preserved. Confirm this interpretation with UCLA/Connect2 for an official launch.

## Local database setup

Local preview and the hosted site have separate databases. This fresh clone needs its own local database. Build once and apply both migrations in order. Do not replay already-applied migrations.

```sh
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_daffy_thunderbolts.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_watery_lilandra.sql
npm run dev
```

For schema changes, edit `db/schema.ts`, run `npm run db:generate`, inspect the new SQL migration, and apply it locally before publishing. Sites applies hosted migrations during deployment.

Local report sign-in uses the starter’s loopback-only test identity at `/signin-with-chatgpt?return_to=/`; hosted sign-in is handled by Sites. The preserved staff API permission path is server-restricted by `STAFF_USER_IDS`; there is no staff workflow in the current dedicated interface.

## Validation

```sh
node node_modules/typescript/bin/tsc --noEmit
node --test tests/*.test.mjs
npm run build
```

Tests cover source fields, BFit-only filtering, names and timestamps, summer/winter Pacific offsets, invalid and nonexistent dates, stale/future updates, closed zones, missing values, duplicate zones, and over-capacity reports. Network regression tests cover hung connections, stalled response bodies, recovery after timeout, unreadable responses, and bounded cache operations. The local API is also compared with the public provider feed, and browser checks cover the count layout, automatic refresh, and optional reports.

## Data, access, and editing

The site is **public**: anyone can view counts without signing in. Only the owner has source editing access. Optional report submission requires ChatGPT sign-in. Report API reads omit user IDs. Reports store a site-specific user ID, category, area, source, and timestamp; no name, email, photo, or GPS trace is stored with a report. Reports are displayed for 30 minutes and pruned after 24 hours on the next successful write, not on a schedule. Agree stronger moderation, retention, and affiliation checks before a campus trial.

The source cache stores only the latest normalized BFit snapshot, not raw all-facility data or personal information. Editing code locally does not automatically update the public website; ask Codex to publish changes when ready.


## Open and closed status

The dashboard gives opening hours priority over attendance. It shows **Closed** before opening, after closing, and on confirmed special closure dates, even if old provider rows still claim Open. Attendance numbers are hidden while closed; the app does not invent a zero. After reopening, counts from before the current opening period are withheld until the source posts an updated report. Fresh source reports marking every area closed also suppress attendance.

`/api/hours` reads the Hours section of UCLA’s BFit page, caches its parsed schedule in the existing D1 snapshot table for 15 minutes, and falls back to the last verified schedule if retrieval/parsing fails. The browser checks hours every five minutes and on focus, with an independent clock updating the opening/closing display each second. These are separate from the count feed’s 15-second checks. Count polling pauses during known closures. Campus time is `America/Los_Angeles`; opening boundaries are inclusive and closing boundaries exclusive. 12 AM means the end of the prior opening day. Published closings after midnight can carry into the next day; an explicit all-day closure wins over a carryover.

Researched November 11, 2026 from https://recreation.ucla.edu/facilities/bfit:

- Monday–Thursday 6 AM–midnight; Friday 6 AM–9 PM; Saturday 9 AM–6 PM; Sunday 9 AM–9 PM.
- Nov 10: 6 AM–9 PM. Nov 11: closed. Nov 25: 6 AM–3 PM. Nov 26–28: closed.
- UCLA also posts October 3–6 special hours; those are retained as dated source entries.
- The source says **Sunday 11/28: 3 PM–9 PM**, while November 28, 2026 is Saturday and is explicitly in the closure range. We preserve the confirmed Saturday closure and mark the nearby Sunday (Nov 29) as requiring confirmation. We do not silently move the 3 PM opening to Nov 29. If UCLA corrects the date, the parser accepts the corrected hours.

Regular Fall 2026 hours are conservatively limited to the reviewed fall term, ending Dec 11, 2026 per https://registrar.ucla.edu/calendars/annual-academic-calendar. This does not assert a gym closure on Dec 12: it returns **Hours need confirmation** beyond the review window unless a dated special entry covers the day. The gym page has not published its December/winter-break schedule at the time of research; Recreation says December facility hours are updated when finalized (https://recreation.ucla.edu/member-services). General university holidays and other gyms’ schedules are never assumed to be BFit closure dates.

The parser is deliberately restricted to the reviewed Fall 2026 schedule. A new season/year or unsupported format requires review, not automatic reuse of old weekly hours or annual repetition of old holiday dates. Last verified hours remain linked and attributed; future unconfirmed times hide attendance rather than implying the gym is open. Tests cover regular days, midnight, early mornings, weekends, holiday overrides, overnight special hours, date conflicts/corrections, Pacific time, unreviewed periods, and suppression of pre-opening attendance.
