# BFit Pulse for Mac

A small native Mac app that gives the live BFit Pulse website its own window, Dock icon, and keyboard shortcuts. Built with Swift, AppKit, and Apple's WKWebView. It uses the same public website and UCLA-linked count feed; there is no second copy of the gym data.

## Open or install

- Build from source to create **BFit Pulse.app** in this folder, or use the ready-made downloads in `../downloads/`.
- For installation, open **BFit-Pulse-Mac.dmg** from the repository’s `downloads/` folder and drag **BFit Pulse** onto **Applications**. Then launch it from Applications or Spotlight.
- **BFit-Pulse-Mac.zip** in `downloads/` is an alternative. Unzip it and move **BFit Pulse.app** into Applications.

You can keep the app in the Dock while it is running. No Node.js, npm, or development tools are needed to run the compiled app.

## How it works

- The native window loads https://bfit-pulse.atomicmacaron2.chatgpt.site/.
- The website checks for updated counts every 15 seconds while visible. Changes normally appear within about 30 seconds, plus network delay, after the provider publishes them.
- An internet connection and the hosted website are required. The app is not an offline attendance database.
- Improvements made to the live website appear in the app automatically. Rebuilding is only needed for changes to the native app itself or its website address.
- UCLA information, maps, and other external links open in your default browser.
- Optional ChatGPT sign-in and community submissions open in your browser, where you can complete them. Browser login cookies are not copied into the app.

## Controls

- **Command-R:** reload the website.
- **Command-1:** return to the live-count home page.
- **Command-L:** open the website in your browser.
- **Command-+ / Command-- / Command-0:** zoom in, out, or reset.
- **Command-[ / Command-]:** browser back and forward when available.
- **Command-Q:** quit. Closing the app's only window also quits it.

The toolbar has Back, Forward, Reload, and Open in Browser buttons. If the main page cannot load, a native connection message offers Try Again and Open Website in Browser.

## Edit or rebuild

The native app source is in **Source/Main.swift**. The website address is the `siteURL` constant near the top. Icon drawing code is **Source/Icon.swift**; app metadata is **Info.plist**. The website's separate editable source remains in the neighboring **web** folder.

To rebuild on a Mac with Xcode or compatible Command Line Tools:

```sh
bash build.sh
```

The script compiles Apple silicon and Intel executables, combines them into one universal app, generates its icon, and applies a local ad hoc signature. You can select an intermediate build folder with `BFIT_BUILD_DIR=/absolute/path bash build.sh`.

The deployment target is macOS 13 or later. The universal executable contains both arm64 and x86_64 architectures; it has been run and visually checked on the Apple silicon Mac used to build it. Intel and older macOS runtime behavior have not been tested on separate hardware.

## Signing and distribution

This is a personal, locally built app with an ad hoc signature. It is **not Apple-notarized or signed with a paid Developer ID certificate**. No such certificate was available on this Mac. Public distribution with the usual macOS developer verification would require Developer ID signing and notarization. The app does not disable Gatekeeper or alter system security settings.

Independent student project; not affiliated with UCLA, Connect2, or OpenAI. The live site retains its own data-source attribution and freshness messages.
