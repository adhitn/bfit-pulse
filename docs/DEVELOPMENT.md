# Editing and publishing BFit Pulse

## Open the project

Clone `https://github.com/adhitn/bfit-pulse.git` and open the resulting `bfit-pulse` folder in your editor. This repository contains both applications; website commands run from `web/` and native app commands from `macos/`.

## Find the right file

| Change | File |
| --- | --- |
| Navigation, dashboard content, optional observation form | `web/app/pulse-app.tsx` |
| Count cards, totals, freshness messages | `web/app/ucla-counts.tsx` |
| Colors, spacing, fonts, responsive layout | `web/app/globals.css` |
| Open/closed banner and hours list | `web/app/bfit-hours-panel.tsx` |
| Hours fetch and browser clock | `web/app/use-bfit-hours.ts` |
| Hours parsing, Pacific boundaries, count suppression | `web/lib/bfit-hours.ts` |
| Reviewed hours and their citations | `web/data/bfit-hours-fall-2026.json` |
| Count normalization and source details | `web/lib/ucla-counts.ts` |
| Server endpoints | `web/app/api/` |
| Database schema and migrations | `web/db/`, `web/drizzle/` |
| Browser title and favicon | `web/app/layout.tsx`, `web/public/favicon.svg` |
| Mac URL, window, toolbar, shortcuts | `macos/Source/Main.swift` |
| Mac icon generator | `macos/Source/Icon.swift` |
| Mac app metadata and build | `macos/Info.plist`, `macos/build.sh` |

For a future Codex request, say **"Edit the bfit-pulse repository: [desired change]"** and point the chat at this folder.

## Local website workflow

Use Node.js 24. Run `npm ci` from `web/`, then follow the initial database setup in the root README. After setup, run `npm run dev` from `web/`. Keep the server running while editing; the browser reloads code changes. Stop it with Control-C.

Run these checks before pushing code changes:

```sh
cd web
node --test tests/*.test.mjs
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

Public source endpoints work without private UCLA credentials. The optional staff configuration is documented in `web/.env.example`; keep real server settings in the hosting environment or an ignored local `.dev.vars` file. Do not commit local databases, report exports, credentials, or generated development state.

## Save changes to GitHub

From the repository root:

```sh
git status
git add web/app/pulse-app.tsx web/app/globals.css
git commit -m "Improve the BFit dashboard"
git push origin main
```

Adjust the listed paths to the files you changed. GitHub Actions runs checks after pushes and pull requests. The web job installs locked dependencies, runs the test suite, checks TypeScript, and builds. The Mac job builds both architectures and uploads a ZIP as a temporary workflow artifact.

Git authentication is separate from browsing the public repository. Use your preferred GitHub sign-in method, GitHub Desktop, or the connected GitHub tools in Codex; do not put account tokens in source files or remote URLs.

## Publish the live website

A GitHub push saves code; it does not deploy it. The existing live website remains hosted through its Sites project, identified in `web/.openai/hosting.json`. That identifier is configuration, not a password. The platform supplies the actual Cloudflare database binding and hosted sign-in.

Ask Codex to **publish the website changes to the existing BFit Pulse site** after reviewing and validating them. The Sites publishing workflow expects a standalone website source tree, with `app/`, `package.json`, and `.openai/hosting.json` at its checkout root. From this monorepo, prepare the `web/` contents as that standalone tree, then use the existing project and its normal commit/build/version/deploy workflow. Do not create a second hosting project merely because the source is also on GitHub.

The original working folders used to build the prototype remain separate local copies. Changes made in one copy do not automatically synchronize the others. Use this GitHub repository for tracked ongoing work and explicitly publish the `web/` tree when ready.

## Build and share the Mac app

On a Mac with Xcode or compatible Command Line Tools:

```sh
cd macos
bash build.sh
```

This creates `macos/BFit Pulse.app`, ignored by Git. `BFIT_BUILD_DIR` can point intermediate files elsewhere. To create a new ZIP while preserving the app bundle:

```sh
ditto -c -k --sequesterRsrc --keepParent "BFit Pulse.app" ../downloads/BFit-Pulse-Mac.zip
```

Rebuild downloads after native source changes. Website-only changes appear through the hosted URL without rebuilding; Command-R reloads a running app. The checked-in downloads are the original universal prototype build, created November 10, 2026. See `downloads/README.md` for checksums and distribution status.
