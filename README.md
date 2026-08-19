# Bag Work — Boxing Bag Instructor

A mobile-first, offline-capable PWA that calls out punch combos, defensive
moves, and footwork out loud while you work the bag — timed in rounds like a
real class. No backend, no login, no build step: plain HTML/CSS/JS using the
Web Speech API.

## Features

- **Timed Rounds** mode (configurable round/rest length and number of
  rounds) or **Freestyle** mode (continuous calls at an adjustable interval)
- Three difficulty levels — Beginner, Intermediate, Advanced — each with a
  curated pool of realistic combos and its own calling pace
- Optional defense & movement calls (slips, rolls, pivots, footwork), on
  Advanced these get chained directly into punch combos
- Voice, speech rate, and volume selection (uses whatever TTS voices your
  browser/device provides)
- Synthesized start/end bell (no audio files needed), haptic vibration on
  round end
- Keeps the screen awake during a workout (Screen Wake Lock API)
- Settings persist between sessions via `localStorage`
- Installable to your phone's home screen; works offline after first load

## Running locally

This is a static site — no build step. Serve the folder with any static
file server, e.g.:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` on your phone or desktop browser.

> Note: `speechSynthesis` and the Wake Lock API require a secure context
> (`https://` or `localhost`) on mobile browsers.

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In **Settings → Pages**, set the source to the `main` branch, root
   folder.
3. Your app will be live at `https://<username>.github.io/<repo>/`. All
   asset paths in this app are relative, so it works fine hosted at a
   subpath.

## Adding to your phone's home screen

- **iOS (Safari)**: open the site → Share → *Add to Home Screen*.
- **Android (Chrome)**: open the site → menu (⋮) → *Add to Home screen* /
  *Install app*.

## Punch numbering

1 = jab · 2 = cross · 3 = lead hook · 4 = rear hook · 5 = lead uppercut ·
6 = rear uppercut. Combos are called as number strings, e.g. "1-2-3".
