# Boxing Bag Workout App — Build Spec

A single-page web app (mobile-first, works from a phone browser) that acts as a virtual boxing instructor: it calls out punch numbers, combos, defensive moves, and footwork out loud while you work the bag, timed in rounds like a real class.

## Core concept
No backend, no login — a self-contained HTML/CSS/JS app using the Web Speech API (`speechSynthesis`) for voice callouts, runnable locally or hosted as a static site (GitHub Pages, Netlify, Vercel). Designed to be added to your phone's home screen (PWA-style) and used one-handed / hands-free during a workout.

## Punch numbering (standard gym system)
- 1 = jab (lead hand)
- 2 = cross (rear hand)
- 3 = lead hook
- 4 = rear hook
- 5 = lead uppercut
- 6 = rear uppercut

Combos are called as number strings, e.g. "1-2-3", "2-3-2".

## Defensive / movement calls (named, not numbered)
Mixed in alongside punch numbers, e.g.:
- Slip left / slip right
- Roll (under a hook)
- Duck
- Pull back / pull straight back
- Parry
- Block / cover up
- Pivot left / pivot right
- Step in / step out
- Circle left / circle right

These should be toggleable — user can enable/disable defense & movement calls independently of punches.

## Session modes (user picks per session; default = Timed Rounds)
1. **Timed Rounds** (default): configurable round length (default 3 min) and rest length (default 1 min), configurable number of rounds (default 5). Bell/buzzer sound at round start and end. Instructor calls combos continuously through each round at a set pace; goes silent (or calls out rest cues) during rest.
2. **Freestyle**: no rounds/timer — continuously calls combos at an adjustable interval (e.g. every 2–6 seconds) until manually stopped.

## Difficulty levels (user-selectable, default = Advanced/Higher difficulty)
- **Beginner**: 2–3 punch combos, slower pace, fewer defensive calls, longer gaps between calls.
- **Intermediate**: 3–4 punch combos, moderate pace, regular mix of defense/movement.
- **Advanced (default)**: 4–6 punch combos, faster pace, frequent defensive/footwork combinations chained with punches (e.g. "slip left, 2-3, pivot right, 1-1-2"), shorter gaps.

Combo pools should be curated per level (not just longer random strings — real, sensible boxing combinations) and expandable later.

## Settings/config screen
- Session mode (Rounds / Freestyle)
- Round length, rest length, number of rounds (Rounds mode)
- Call interval (Freestyle mode)
- Difficulty level
- Toggle: punches only vs. punches + defense/movement
- Voice selection / rate / volume (browser TTS voices vary by device)
- Optional: sound on/off for bell, vibration on round end (mobile haptics via Vibration API)

## Workout screen (what's shown during a session)
- Large current round / timer display
- Last few calls as text (in case you glance down)
- Big Start/Pause/Stop controls (thumb-reachable, since hands may be gloved/sweaty)
- Round counter (e.g. "Round 3 of 5")

## Technical notes
- `window.speechSynthesis` + `SpeechSynthesisUtterance` for callouts — no API keys or network calls needed, works offline once loaded.
- Pre-warm/prime speech synthesis on first user tap (mobile browsers require a user gesture before audio will play).
- Keep screen awake during workout via the Screen Wake Lock API (`navigator.wakeLock`), since bag work means no one's tapping the phone.
- Store settings in localStorage so preferences persist between sessions.
- Should be a PWA (manifest.json + basic service worker) so it can be added to the home screen and optionally work offline.

## Stretch ideas (not required for v1)
- Custom combo builder / editor
- Different "instructor" voice personalities or accents
- Workout history log (rounds completed, streaks)
- Warm-up and cool-down round presets
