"use strict";

/* =========================================================================
   COMBO POOLS
   Curated, realistic boxing combinations. 1=jab 2=cross 3=lead hook
   4=rear hook 5=lead uppercut 6=rear uppercut
   ========================================================================= */

const DEFENSE_MOVES = [
  "Slip left", "Slip right", "Roll", "Duck", "Pull back",
  "Pull straight back", "Parry", "Block", "Cover up",
  "Pivot left", "Pivot right", "Step in", "Step out",
  "Circle left", "Circle right"
];

// Plain-English how-to for each defense/movement call, shown in Settings.
const DEFENSE_GLOSSARY = [
  ["Slip left", "Bend your knees slightly and shift your head and shoulders left, off the centerline, so a straight punch (like a jab) misses."],
  ["Slip right", "Same idea as Slip left, but shift your head and shoulders to the right instead."],
  ["Roll", "Bend at the knees and roll your head and shoulders under an incoming hook, staying low as it passes over you."],
  ["Duck", "Bend your knees and drop your head and upper body straight down to get under a punch, then come back up to stance."],
  ["Pull back", "Shift your weight onto your back leg and lean your upper body out of range, keeping your hands up, then return to stance."],
  ["Pull straight back", "Same as Pull back — lean straight back out of punching range without moving your feet, then reset."],
  ["Parry", "Use an open glove to give an incoming punch (usually the jab) a quick slap or push to redirect it off target."],
  ["Block", "Keep your forearms and gloves tight against your head and body to absorb punches rather than avoiding them."],
  ["Cover up", "Bring both gloves up tight against your head with elbows in, protecting your head and body together."],
  ["Pivot left", "Turn on the ball of your lead foot to rotate your whole body and change the angle you're facing."],
  ["Pivot right", "Turn on the ball of your rear foot to rotate your body the other way."],
  ["Step in", "Take one short step forward to close the distance and get back in punching range."],
  ["Step out", "Take one short step back to create distance and get out of range."],
  ["Circle left", "Move sideways to your left in small steps, staying on the balls of your feet, to change angle."],
  ["Circle right", "Same as Circle left, moving to your right instead."]
];

// Each combo carries a weight so bread-and-butter combos (1-2, 1-2-3...)
// get called far more often than specialty ones (6-5-2-1...), the way a
// real coach actually leans on the staples: 5 = staple, 3 = common,
// 1 = occasional variety.
const PUNCH_POOLS = {
  beginner: [
    { value: "1-2", weight: 5 }, { value: "1-1", weight: 3 },
    { value: "2-3", weight: 3 }, { value: "1-3", weight: 3 },
    { value: "3-2", weight: 3 }, { value: "1-5", weight: 1 },
    { value: "3-6", weight: 1 }, { value: "1-2-3", weight: 5 },
    { value: "1-1-2", weight: 3 }, { value: "2-3-2", weight: 3 },
    { value: "1-3-2", weight: 3 }, { value: "1-2-1", weight: 3 }
  ],
  intermediate: [
    { value: "1-2-3", weight: 5 }, { value: "1-1-2", weight: 5 },
    { value: "2-3-2", weight: 5 }, { value: "1-2-3-2", weight: 5 },
    { value: "1-3-2", weight: 3 }, { value: "1-2-6", weight: 1 },
    { value: "3-2-3", weight: 3 }, { value: "1-4-3", weight: 1 },
    { value: "1-2-3-6", weight: 1 }, { value: "2-3-6", weight: 1 },
    { value: "1-1-2-3", weight: 3 }, { value: "3-2-3-2", weight: 3 },
    { value: "1-2-1-2", weight: 3 }, { value: "6-3-2", weight: 1 },
    { value: "1-6-3-2", weight: 1 }
  ],
  advanced: [
    { value: "1-2-3-2", weight: 5 }, { value: "1-1-2-3-2", weight: 3 },
    { value: "1-2-3-6-3", weight: 3 }, { value: "2-3-2-3-2", weight: 3 },
    { value: "1-2-6-3-2", weight: 1 }, { value: "1-3-2-3-2", weight: 3 },
    { value: "1-2-3-2-3-2", weight: 1 }, { value: "1-4-3-2", weight: 1 },
    { value: "1-2-5-2", weight: 1 }, { value: "3-2-3-6-3", weight: 1 },
    { value: "1-1-2-3-6-3", weight: 1 }, { value: "2-3-2-6-3", weight: 1 },
    { value: "1-2-1-2-3", weight: 3 }, { value: "6-5-2-1", weight: 1 }
  ]
};

// Advanced-only: defense/footwork chained directly with punches into one
// call. Each combo is a list of discrete phrases (spoken as separate
// utterances back-to-back) rather than one run-on sentence.
const CHAINED_COMBOS = [
  ["Slip left", "2-3", "pivot right", "1-1-2"],
  ["Roll", "3-2", "step in", "1-2-3"],
  ["Duck", "1-2", "pull back", "2-3-2"],
  ["Parry", "2", "pivot left", "1-2-3-2"],
  ["Slip right", "1-2", "circle left", "2-3"],
  ["Block", "step out", "1-1-2-3"],
  ["Duck", "3-2", "roll", "2-3-2"],
  ["Slip left", "slip right", "1-2-3"],
  ["Pivot left", "1-2", "step in", "3-2-3"],
  ["Cover up", "step out", "2-3-2-3"],
  ["Pull straight back", "1-2", "circle right", "1-1-2"],
  ["Parry", "1-2-3", "pivot right", "2-3"]
];

// Physical execution time (seconds) — how long it actually takes to throw
// one punch or perform one defensive movement, by difficulty. Faster
// difficulties assume a quicker, more fluid pace on the bag. The gap
// between calls is built from this rather than a flat range, so a 6-punch
// combo naturally gets more time than "1-2" — a coach paces off what you
// just asked for, not a stopwatch.
const PUNCH_THROW_TIME = { beginner: 0.55, intermediate: 0.45, advanced: 0.38 };
const DEFENSE_MOVE_TIME = 0.7;

// Small extra buffer on top of the estimated execution time, so there's a
// beat to reset before the next call — plus a touch of natural variation.
const PACE_BUFFER = {
  beginner: { min: 0.6, max: 1.0 },
  intermediate: { min: 0.4, max: 0.8 },
  advanced: { min: 0.3, max: 0.6 }
};

// Chance of a standalone defense call vs a punch combo (defense toggle on).
const DEFENSE_FREQ = { beginner: 0.15, intermediate: 0.3, advanced: 0.2 };
// Advanced-only: chance of using a fully chained defense+punch combo.
const CHAIN_FREQ = 0.4;
// Never let more than this many standalone defense/movement calls land
// back-to-back — punch combos (and chained combos, which include punches)
// don't count toward this streak.
const MAX_CONSECUTIVE_DEFENSE = 2;

// Chance of building on the previous combo ("1-2" -> "1-2-3") instead of a
// fresh unrelated pick, when the pool actually has an extension of it —
// mirrors a coach layering onto what you just threw.
const BUILD_FREQ = 0.3;

// Natural short counters to pair with a defensive move dynamically, so
// "slip left" can flow straight into "2" the way a coach actually calls
// it — at any difficulty, not just the hand-authored advanced chains.
const COUNTER_PUNCHES = {
  beginner: [
    { value: "2", weight: 5 }, { value: "1-2", weight: 3 }, { value: "2-3", weight: 2 }
  ],
  intermediate: [
    { value: "2-3", weight: 5 }, { value: "1-2", weight: 3 }, { value: "2-3-2", weight: 2 }
  ],
  advanced: [
    { value: "2-3", weight: 4 }, { value: "1-2-3", weight: 4 }, { value: "2-3-2", weight: 3 }
  ]
};
// Chance that a standalone defense call becomes "move + counter" instead of
// just the move alone, by difficulty.
const DYNAMIC_COUNTER_FREQ = { beginner: 0.2, intermediate: 0.4, advanced: 0.5 };

const PUNCH_SEGMENT_RE = /^[1-6](-[1-6])*$/;

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function pickWeighted(items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    if (r < item.weight) return item.value;
    r -= item.weight;
  }
  return items[items.length - 1].value;
}

function comboSegmentsOf(str) { return str.split("-"); }

// True if `candidate` is `base` with one or more punches added on the end
// — e.g. "1-2-3" extends "1-2". Used to find natural combo-building moves.
function isExtensionOf(candidate, base) {
  const c = comboSegmentsOf(candidate);
  const b = comboSegmentsOf(base);
  if (c.length <= b.length) return false;
  return b.every((seg, i) => c[i] === seg);
}

function getExtensions(base, pool) {
  return pool.filter((item) => isExtensionOf(item.value, base)).map((item) => item.value);
}

function makeSegment(text) {
  return { text, isPunch: PUNCH_SEGMENT_RE.test(text.trim()) };
}

function punchCall(combo) {
  return { display: combo, segments: [makeSegment(combo)], kind: "punch" };
}

function defenseCall(move) {
  return { display: move, segments: [makeSegment(move)], kind: "defense" };
}

function chainedCall(parts) {
  return {
    display: parts.join(", "),
    segments: parts.map(makeSegment),
    kind: "mixed"
  };
}

function defenseWithCounter(difficulty) {
  const move = pick(DEFENSE_MOVES);
  const counterPool = COUNTER_PUNCHES[difficulty] || COUNTER_PUNCHES.beginner;
  return chainedCall([move, pickWeighted(counterPool)]);
}

// A coach pushes pace and leans harder into pure punch output in a round's
// final third (the "championship round" push), and is a bit more measured
// early on. `progress` is 0..1 elapsed/duration through the current work
// phase, or null outside Timed Rounds (Freestyle stays flat/user-paced).
function roundPhaseMultipliers(progress) {
  if (progress == null) return { pace: 1, defense: 1 };
  if (progress < 1 / 3) return { pace: 1.15, defense: 1 };
  if (progress < 2 / 3) return { pace: 1, defense: 1 };
  return { pace: 0.82, defense: 0.75 };
}

function estimateExecutionSeconds(call, difficulty) {
  const punchTime = PUNCH_THROW_TIME[difficulty] || PUNCH_THROW_TIME.advanced;
  return call.segments.reduce(
    (sum, seg) => sum + (seg.isPunch ? comboSegmentsOf(seg.text).length * punchTime : DEFENSE_MOVE_TIME),
    0
  );
}

// The rest gap after a call finishes speaking, before the next one starts —
// scaled to how long the call actually takes to physically perform, and to
// where the round is (a coach paces the final push differently than the
// opening feel-out).
function paceGapSeconds(call, difficulty, roundProgress) {
  const buf = PACE_BUFFER[difficulty] || PACE_BUFFER.advanced;
  const buffer = buf.min + Math.random() * (buf.max - buf.min);
  const phase = roundPhaseMultipliers(roundProgress);
  return (estimateExecutionSeconds(call, difficulty) + buffer) * phase.pace;
}

// `ctx`: { recentKinds, lastCombo, lastDisplay, roundProgress }
//  - recentKinds: kind ("defense"/"punch"/"mixed") of the last few calls,
//    most recent last — caps consecutive standalone defense calls.
//  - lastCombo: the last plain punch combo called (for combo-building).
//  - lastDisplay: the exact last call's display text (no-repeat guard).
//  - roundProgress: 0..1 through the current round, or null in Freestyle.
function generateCall(difficulty, includeDefense, ctx) {
  const { recentKinds, lastCombo, lastDisplay, roundProgress } = ctx;
  const punchPool = PUNCH_POOLS[difficulty] || PUNCH_POOLS.advanced;
  const phase = roundPhaseMultipliers(roundProgress);

  function freshPunchCall() {
    if (lastCombo && Math.random() < BUILD_FREQ) {
      const extensions = getExtensions(lastCombo, punchPool);
      if (extensions.length) return punchCall(pick(extensions));
    }
    return punchCall(pickWeighted(punchPool));
  }

  function standaloneOrCounter() {
    const dynFreq = DYNAMIC_COUNTER_FREQ[difficulty] ?? 0.2;
    return Math.random() < dynFreq ? defenseWithCounter(difficulty) : defenseCall(pick(DEFENSE_MOVES));
  }

  function buildCall() {
    if (!includeDefense) return freshPunchCall();

    const blockDefense =
      recentKinds.length >= MAX_CONSECUTIVE_DEFENSE &&
      recentKinds.slice(-MAX_CONSECUTIVE_DEFENSE).every((k) => k === "defense");
    const defenseFreq = (DEFENSE_FREQ[difficulty] ?? 0.2) * phase.defense;

    if (difficulty === "advanced") {
      const chainFreq = CHAIN_FREQ * phase.defense;
      const r = Math.random();
      if (r < chainFreq) return chainedCall(pick(CHAINED_COMBOS));
      if (!blockDefense && r < chainFreq + defenseFreq) return standaloneOrCounter();
      return freshPunchCall();
    }

    if (!blockDefense && Math.random() < defenseFreq) return standaloneOrCounter();
    return freshPunchCall();
  }

  // A coach never says the exact same thing twice in a row — one retry is
  // enough to drive that down to near-zero regardless of which branch
  // above produced the repeat.
  let call = buildCall();
  if (lastDisplay && call.display === lastDisplay) call = buildCall();
  return call;
}

/* =========================================================================
   SETTINGS (persisted to localStorage)
   ========================================================================= */

const DEFAULT_SETTINGS = {
  mode: "rounds",              // "rounds" | "freestyle"
  roundLength: 180,            // seconds
  restLength: 60,               // seconds
  numRounds: 5,
  freestyleInterval: 4,        // seconds
  difficulty: "advanced",
  includeDefense: true,
  voiceURI: "",
  rate: 1.0,
  volume: 1.0,
  soundOn: true,
  vibrationOn: true
};

const STORAGE_KEY = "bagwork.settings.v1";

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

let settings = loadSettings();

/* =========================================================================
   SPEECH
   ========================================================================= */

const synth = window.speechSynthesis;
let voices = [];
let speechPrimed = false;

// Browser TTS quality varies wildly by voice. Score voices so we can
// auto-pick a natural-sounding one instead of leaving it to whatever the
// browser's arbitrary default happens to be (often a flat, robotic voice).
const PREFERRED_VOICE_RE = /\bdaniel\b/i; // picked as the house instructor voice when available
const GOOD_VOICE_NAME_RE = /neural|enhanced|premium|natural|siri/i;
const GOOD_VOICE_NAMES_RE = /samantha|alex|daniel|karen|moira|tessa|serena|ava|nicky|aaron|evan|nathan|zoe|allison|susan|tom/i;
const GOOD_ONLINE_RE = /google (us|uk) english|microsoft .*online/i;
const NOVELTY_VOICE_RE = /novelty|zarvox|trinoids|bells|boing|bubbles|cellos|deranged|hysterical|pipe organ|organ|whisper|bahh|albert|bad news|good news|jester|wobble|superstar|junior|ralph|kathy|fred/i;

function scoreVoice(v) {
  let score = 0;
  if (PREFERRED_VOICE_RE.test(v.name)) score += 500;
  if (GOOD_VOICE_NAME_RE.test(v.name)) score += 100;
  if (GOOD_VOICE_NAMES_RE.test(v.name)) score += 40;
  if (GOOD_ONLINE_RE.test(v.name)) score += 40;
  if (NOVELTY_VOICE_RE.test(v.name)) score -= 200;
  if (v.lang && v.lang.toLowerCase().startsWith("en")) score += 20;
  if (v.default) score += 5;
  return score;
}

function autoVoiceURI() {
  if (!voices.length) return "";
  return voices.reduce((best, v) => (scoreVoice(v) > scoreVoice(best) ? v : best)).voiceURI;
}

function resolveVoice() {
  const uri = settings.voiceURI || autoVoiceURI();
  return voices.find((v) => v.voiceURI === uri) || null;
}

function refreshVoices() {
  voices = synth ? synth.getVoices() : [];
  populateVoiceSelect();
}

function populateVoiceSelect() {
  const sel = document.getElementById("opt-voice");
  const current = settings.voiceURI;
  sel.innerHTML = "";

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "Auto (recommended)";
  sel.appendChild(defaultOpt);

  voices.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v.voiceURI;
    opt.textContent = `${v.name} (${v.lang})`;
    sel.appendChild(opt);
  });

  sel.value = voices.some((v) => v.voiceURI === current) ? current : "";
}

function primeSpeech() {
  if (speechPrimed || !synth) return;
  speechPrimed = true;
  // A near-silent utterance unlocks audio on mobile browsers that require
  // a user gesture before speechSynthesis will actually produce sound.
  const u = new SpeechSynthesisUtterance(" ");
  u.volume = 0;
  synth.speak(u);
}

// Punch numbers get a speed boost relative to defense/movement phrases so
// combos snap out quickly while named moves stay clearly enunciated.
const PUNCH_RATE_MULTIPLIER = 1.25;

function buildUtterance(text, isPunch) {
  const u = new SpeechSynthesisUtterance(text);
  u.rate = isPunch ? Math.min(2.4, settings.rate * PUNCH_RATE_MULTIPLIER) : settings.rate;
  u.volume = settings.volume;
  const v = resolveVoice();
  if (v) u.voice = v;
  return u;
}

// Speaks a plain, single-phrase line (rest/start/complete announcements).
function speak(text) {
  if (!synth) return;
  synth.cancel();
  synth.speak(buildUtterance(text, false));
}

// Punches flow straight into each other, but a defense/movement segment
// (slip, duck, pivot...) needs a real beat afterward to actually perform
// the move before the next segment or call comes in.
const PUNCH_SEGMENT_GAP_MS = 150;
const DEFENSE_SEGMENT_GAP_MS = 600;

// Speaks a call's segments back-to-back as separate utterances, so each one
// fully completes (no mid-word cutoffs) before the next starts. Invokes
// `onDone` once the whole call has finished.
function speakCall(call, onDone) {
  if (!synth) { onDone(); return; }
  synth.cancel();
  let i = 0;
  function speakNext() {
    if (i >= call.segments.length) { onDone(); return; }
    const seg = call.segments[i++];
    const text = seg.isPunch ? seg.text.replace(/-/g, ", ") : seg.text;
    const u = buildUtterance(text, seg.isPunch);
    const gap = seg.isPunch ? PUNCH_SEGMENT_GAP_MS : DEFENSE_SEGMENT_GAP_MS;
    u.onend = () => setTimeout(speakNext, gap);
    u.onerror = () => setTimeout(speakNext, gap);
    synth.speak(u);
  }
  speakNext();
}

if (synth) {
  synth.addEventListener?.("voiceschanged", refreshVoices);
  synth.onvoiceschanged = refreshVoices;
}

/* =========================================================================
   BELL / BUZZER (synthesized via Web Audio — no asset files needed)
   ========================================================================= */

let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function tone(freq, startTime, duration, gainPeak = 0.35) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

// A short, sharp square-wave hit — closer to a percussive clacker/knock
// than the round bell's sine tone, so the two are easy to tell apart.
function clack(startTime, freq = 1700, gainPeak = 0.32) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.09);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + 0.1);
}

function playBell(kind) {
  if (!settings.soundOn) return;
  const ctx = getAudioCtx();
  const now = ctx.currentTime;
  if (kind === "start") {
    tone(1400, now, 0.35);
    tone(1400, now + 0.4, 0.35);
  } else if (kind === "end") {
    tone(700, now, 0.5);
    tone(700, now + 0.55, 0.5);
    tone(700, now + 1.1, 0.6);
  } else if (kind === "done") {
    [0, 0.35, 0.7, 1.05].forEach((t, i) => tone(900 + i * 120, now + t, 0.4));
  } else if (kind === "warning") {
    // Mimics a corner's 10-second clacker: three rapid knocks.
    [0, 0.16, 0.32].forEach((t) => clack(now + t));
  }
}

function vibrate(pattern) {
  if (settings.vibrationOn && navigator.vibrate) navigator.vibrate(pattern);
}

/* =========================================================================
   WAKE LOCK
   ========================================================================= */

let wakeLock = null;
async function acquireWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch (e) {
    /* ignore — non-fatal if unsupported or denied */
  }
}
function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && workout.isActive()) {
    acquireWakeLock();
  }
});

/* =========================================================================
   WORKOUT ENGINE
   ========================================================================= */

const els = {
  roundCounter: document.getElementById("round-counter"),
  modePill: document.getElementById("mode-pill"),
  phaseLabel: document.getElementById("phase-label"),
  timerDisplay: document.getElementById("timer-display"),
  callsList: document.getElementById("calls-list"),
  btnStart: document.getElementById("btn-start"),
  btnPause: document.getElementById("btn-pause"),
  btnStop: document.getElementById("btn-stop")
};

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function addCallToLog(text) {
  const placeholder = els.callsList.querySelector(".call-placeholder");
  if (placeholder) placeholder.remove();
  const li = document.createElement("li");
  li.textContent = text;
  els.callsList.prepend(li);
  while (els.callsList.children.length > 8) {
    els.callsList.removeChild(els.callsList.lastChild);
  }
  els.callsList.scrollTop = 0;
}

const workout = (() => {
  let state = "idle"; // idle | work | rest | freestyle | done
  let phaseEndAt = 0;
  let phaseDuration = 0;
  let pausedRemaining = null;
  let currentRound = 0;
  let tickTimer = null;
  let callTimer = null;
  let freestyleElapsed = 0;
  let freestyleStartedAt = 0;
  let recentKinds = []; // last few call kinds, for the consecutive-defense cap
  let lastCombo = null; // last plain punch combo called, for combo-building
  let lastDisplay = null; // exact last call's text, for the no-repeat guard
  let callToken = 0; // bumped on pause/stop so stale callbacks are ignored
  let tenSecWarned = false; // has this round's 10-seconds-left cue fired yet

  // 0..1 through the current work phase, or null outside it (Freestyle
  // keeps a flat, user-set pace rather than a round-phase push).
  function roundProgress() {
    if (state !== "work" || phaseDuration <= 0) return null;
    const elapsed = phaseDuration - (phaseEndAt - performance.now()) / 1000;
    return Math.min(1, Math.max(0, elapsed / phaseDuration));
  }

  function isActive() {
    return state === "work" || state === "rest" || state === "freestyle";
  }

  function clearTimers() {
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    if (callTimer) { clearTimeout(callTimer); callTimer = null; }
  }

  function setPhaseUI(label, cls) {
    els.phaseLabel.textContent = label;
    els.phaseLabel.className = "phase-label" + (cls ? " " + cls : "");
  }

  // Speaks a call immediately, then — only once it has FULLY finished
  // speaking — waits a difficulty/mode-appropriate gap before the next one.
  // This guarantees every combo is heard in full rather than getting cut
  // off by a fixed timer that didn't account for how long the call takes.
  function speakNextCall() {
    if (callTimer) { clearTimeout(callTimer); callTimer = null; }
    const token = callToken;
    const call = generateCall(settings.difficulty, settings.includeDefense, {
      recentKinds, lastCombo, lastDisplay, roundProgress: roundProgress()
    });
    recentKinds.push(call.kind);
    if (recentKinds.length > MAX_CONSECUTIVE_DEFENSE) recentKinds.shift();
    if (call.kind === "punch") lastCombo = call.display;
    lastDisplay = call.display;
    addCallToLog(call.display);
    speakCall(call, () => {
      if (token !== callToken) return; // paused/stopped while speaking
      const dynamicGap = paceGapSeconds(call, settings.difficulty, roundProgress());
      // Freestyle's interval is the user's own chosen cadence — respect it
      // as a floor, but never let it cut a longer combo short.
      const gapSec = settings.mode === "freestyle"
        ? Math.max(settings.freestyleInterval, dynamicGap)
        : dynamicGap;
      callTimer = setTimeout(() => {
        if (token === callToken) speakNextCall();
      }, gapSec * 1000);
    });
  }

  function startRoundsMode() {
    currentRound = 1;
    beginWorkPhase();
  }

  function beginWorkPhase() {
    state = "work";
    phaseDuration = settings.roundLength;
    phaseEndAt = performance.now() + phaseDuration * 1000;
    tenSecWarned = false;
    setPhaseUI("WORK", "work");
    els.roundCounter.textContent = `Round ${currentRound} of ${settings.numRounds}`;
    playBell("start");
    vibrate(100);
    speakNextCall();
    startTick();
  }

  function beginRestPhase() {
    state = "rest";
    phaseDuration = settings.restLength;
    phaseEndAt = performance.now() + phaseDuration * 1000;
    setPhaseUI("REST", "rest");
    callToken++; // invalidate any call still mid-speech from the work phase
    if (callTimer) { clearTimeout(callTimer); callTimer = null; }
    speak("Rest");
    startTick();
  }

  function finishWorkout() {
    state = "done";
    callToken++;
    clearTimers();
    setPhaseUI("DONE", "done");
    els.timerDisplay.textContent = "00:00";
    els.roundCounter.textContent = `Workout complete — ${settings.numRounds} rounds`;
    playBell("done");
    vibrate([100, 60, 100, 60, 200]);
    speak("Workout complete. Great work.");
    releaseWakeLock();
    setControlsForState();
  }

  function startFreestyle() {
    state = "freestyle";
    freestyleStartedAt = performance.now();
    freestyleElapsed = 0;
    setPhaseUI("FREESTYLE", "work");
    els.roundCounter.textContent = "Freestyle";
    speakNextCall();
    startTick();
  }

  function startTick() {
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(tick, 200);
    tick();
  }

  function tick() {
    if (state === "freestyle") {
      const elapsed = (performance.now() - freestyleStartedAt) / 1000;
      els.timerDisplay.textContent = formatTime(elapsed);
      return;
    }
    if (state !== "work" && state !== "rest") return;
    const remaining = (phaseEndAt - performance.now()) / 1000;
    els.timerDisplay.textContent = formatTime(remaining);
    if (state === "work" && !tenSecWarned && remaining <= 10 && phaseDuration > 12) {
      tenSecWarned = true;
      playBell("warning");
      vibrate(60);
    }
    if (remaining <= 0) {
      onPhaseComplete();
    }
  }

  function onPhaseComplete() {
    if (state === "work") {
      playBell("end");
      vibrate(200);
      if (callTimer) { clearTimeout(callTimer); callTimer = null; }
      if (currentRound >= settings.numRounds) {
        finishWorkout();
      } else {
        beginRestPhase();
      }
    } else if (state === "rest") {
      currentRound += 1;
      beginWorkPhase();
    }
  }

  function setControlsForState() {
    const running = state === "work" || state === "rest" || state === "freestyle";
    els.btnStart.disabled = running;
    els.btnPause.disabled = state === "idle" || state === "done";
    els.btnPause.textContent = state === "paused" ? "Resume" : "Pause";
    els.btnStop.disabled = state === "idle";
  }

  let preParseState = null; // remembers state before pause

  function start() {
    if (state !== "idle" && state !== "done") return;
    primeSpeech();
    getAudioCtx();
    acquireWakeLock();
    els.callsList.innerHTML = '<li class="call-placeholder">Calls will appear here…</li>';
    recentKinds = [];
    lastCombo = null;
    lastDisplay = null;

    if (settings.mode === "rounds") {
      startRoundsMode();
    } else {
      startFreestyle();
    }
    setControlsForState();
  }

  function pause() {
    if (!isActive()) return;
    preParseState = state;
    callToken++;
    clearTimers();
    if (state === "freestyle") {
      freestyleElapsed = (performance.now() - freestyleStartedAt) / 1000;
    } else {
      pausedRemaining = (phaseEndAt - performance.now()) / 1000;
    }
    if (synth) synth.cancel();
    state = "paused";
    setPhaseUI("PAUSED");
    els.btnPause.textContent = "Resume";
    setControlsForState();
    els.btnPause.disabled = false;
  }

  function resume() {
    if (state !== "paused") return;
    state = preParseState;
    els.btnPause.textContent = "Pause";
    if (state === "freestyle") {
      freestyleStartedAt = performance.now() - freestyleElapsed * 1000;
      setPhaseUI("FREESTYLE", "work");
    } else {
      phaseEndAt = performance.now() + pausedRemaining * 1000;
      setPhaseUI(state === "work" ? "WORK" : "REST", state === "work" ? "work" : "rest");
    }
    if (state === "work" || state === "freestyle") speakNextCall();
    startTick();
    setControlsForState();
  }

  function togglePause() {
    if (state === "paused") resume();
    else pause();
  }

  function stop() {
    callToken++;
    clearTimers();
    if (synth) synth.cancel();
    state = "idle";
    currentRound = 0;
    recentKinds = [];
    lastCombo = null;
    lastDisplay = null;
    setPhaseUI("READY");
    els.timerDisplay.textContent = formatTime(settings.mode === "rounds" ? settings.roundLength : 0);
    els.roundCounter.textContent = "Ready";
    releaseWakeLock();
    setControlsForState();
  }

  function refreshIdleDisplay() {
    if (state !== "idle") return;
    els.modePill.textContent = settings.mode === "rounds" ? "Timed Rounds" : "Freestyle";
    els.timerDisplay.textContent = settings.mode === "rounds" ? formatTime(settings.roundLength) : "00:00";
  }

  return { start, pause, resume, togglePause, stop, isActive, refreshIdleDisplay, setControlsForState };
})();

/* =========================================================================
   SETTINGS UI WIRING
   ========================================================================= */

const settingEls = {
  mode: document.getElementById("opt-mode"),
  roundsFields: document.getElementById("rounds-fields"),
  freestyleFields: document.getElementById("freestyle-fields"),
  roundMin: document.getElementById("opt-round-min"),
  roundSec: document.getElementById("opt-round-sec"),
  restMin: document.getElementById("opt-rest-min"),
  restSec: document.getElementById("opt-rest-sec"),
  numRounds: document.getElementById("opt-num-rounds"),
  interval: document.getElementById("opt-interval"),
  intervalVal: document.getElementById("opt-interval-val"),
  difficulty: document.getElementById("opt-difficulty"),
  defense: document.getElementById("opt-defense"),
  voice: document.getElementById("opt-voice"),
  rate: document.getElementById("opt-rate"),
  rateVal: document.getElementById("opt-rate-val"),
  volume: document.getElementById("opt-volume"),
  volumeVal: document.getElementById("opt-volume-val"),
  sound: document.getElementById("opt-sound"),
  vibration: document.getElementById("opt-vibration")
};

function applySettingsToUI() {
  settingEls.mode.value = settings.mode;
  settingEls.roundMin.value = Math.floor(settings.roundLength / 60);
  settingEls.roundSec.value = settings.roundLength % 60;
  settingEls.restMin.value = Math.floor(settings.restLength / 60);
  settingEls.restSec.value = settings.restLength % 60;
  settingEls.numRounds.value = settings.numRounds;
  settingEls.interval.value = settings.freestyleInterval;
  settingEls.intervalVal.textContent = settings.freestyleInterval;
  settingEls.difficulty.value = settings.difficulty;
  settingEls.defense.checked = settings.includeDefense;
  settingEls.rate.value = settings.rate;
  settingEls.rateVal.textContent = settings.rate.toFixed(1);
  settingEls.volume.value = settings.volume;
  settingEls.volumeVal.textContent = Math.round(settings.volume * 100);
  settingEls.sound.checked = settings.soundOn;
  settingEls.vibration.checked = settings.vibrationOn;
  toggleModeFields();
}

function toggleModeFields() {
  const isRounds = settingEls.mode.value === "rounds";
  settingEls.roundsFields.classList.toggle("hidden", !isRounds);
  settingEls.freestyleFields.classList.toggle("hidden", isRounds);
}

function readNumberField(el, min, max, fallback) {
  let v = parseInt(el.value, 10);
  if (isNaN(v)) v = fallback;
  return Math.min(max, Math.max(min, v));
}

function commitSettingsFromUI() {
  settings.mode = settingEls.mode.value;
  const rMin = readNumberField(settingEls.roundMin, 0, 59, 3);
  const rSec = readNumberField(settingEls.roundSec, 0, 59, 0);
  settings.roundLength = Math.max(5, rMin * 60 + rSec);
  const restMin = readNumberField(settingEls.restMin, 0, 59, 1);
  const restSec = readNumberField(settingEls.restSec, 0, 59, 0);
  settings.restLength = Math.max(0, restMin * 60 + restSec);
  settings.numRounds = readNumberField(settingEls.numRounds, 1, 30, 5);
  settings.freestyleInterval = parseFloat(settingEls.interval.value);
  settings.difficulty = settingEls.difficulty.value;
  settings.includeDefense = settingEls.defense.checked;
  settings.voiceURI = settingEls.voice.value;
  settings.rate = parseFloat(settingEls.rate.value);
  settings.volume = parseFloat(settingEls.volume.value);
  settings.soundOn = settingEls.sound.checked;
  settings.vibrationOn = settingEls.vibration.checked;
  saveSettings(settings);
  workout.refreshIdleDisplay();
}

[
  settingEls.mode, settingEls.roundMin, settingEls.roundSec,
  settingEls.restMin, settingEls.restSec, settingEls.numRounds,
  settingEls.interval, settingEls.difficulty, settingEls.defense,
  settingEls.voice, settingEls.rate, settingEls.volume,
  settingEls.sound, settingEls.vibration
].forEach((el) => {
  el.addEventListener("change", () => {
    if (el === settingEls.mode) toggleModeFields();
    commitSettingsFromUI();
  });
});

settingEls.interval.addEventListener("input", () => {
  settingEls.intervalVal.textContent = parseFloat(settingEls.interval.value).toFixed(1).replace(/\.0$/, "");
});
settingEls.rate.addEventListener("input", () => {
  settingEls.rateVal.textContent = parseFloat(settingEls.rate.value).toFixed(1);
});
settingEls.volume.addEventListener("input", () => {
  settingEls.volumeVal.textContent = Math.round(parseFloat(settingEls.volume.value) * 100);
});

document.getElementById("btn-test-voice").addEventListener("click", () => {
  primeSpeech();
  commitSettingsFromUI();
  speakCall(chainedCall(["1-2-3", "Slip left", "2-3"]), () => {});
});

/* =========================================================================
   NAVIGATION
   ========================================================================= */

const workoutScreen = document.getElementById("workout-screen");
const settingsScreen = document.getElementById("settings-screen");
const glossaryScreen = document.getElementById("glossary-screen");
let settingsSnapshot = null; // settings as they were when the screen opened, for Cancel

function showScreen(screen) {
  [workoutScreen, settingsScreen, glossaryScreen].forEach((s) => s.classList.remove("active"));
  screen.classList.add("active");
}

document.getElementById("settings-toggle").addEventListener("click", () => {
  settingsSnapshot = { ...settings };
  showScreen(settingsScreen);
});

document.getElementById("glossary-toggle").addEventListener("click", () => {
  showScreen(glossaryScreen);
});

document.getElementById("btn-done").addEventListener("click", () => {
  showScreen(workoutScreen);
});

document.getElementById("btn-cancel").addEventListener("click", () => {
  if (settingsSnapshot) {
    settings = { ...settingsSnapshot };
    saveSettings(settings);
    applySettingsToUI();
    workout.refreshIdleDisplay();
  }
  showScreen(workoutScreen);
});

document.getElementById("btn-glossary-done").addEventListener("click", () => {
  showScreen(workoutScreen);
});

/* =========================================================================
   CONTROLS
   ========================================================================= */

els.btnStart.addEventListener("click", () => {
  primeSpeech();
  workout.start();
});
els.btnPause.addEventListener("click", () => {
  workout.togglePause();
});
els.btnStop.addEventListener("click", () => {
  workout.stop();
});

/* =========================================================================
   VOICE CONTROL (Siri Shortcuts)
   A Siri Shortcut can't call app code directly since this is a browser app
   with no native shell, but it can open a URL with a query param. Set up a
   Shortcut per action ("Open URL" -> e.g. index.html?action=start) and give
   it a Siri phrase like "start bag work" to drive this hands-free.
   ========================================================================= */

function handleVoiceActionParam() {
  const params = new URLSearchParams(window.location.search);
  const action = params.get("action");
  if (!action) return;
  history.replaceState(null, "", window.location.pathname + window.location.hash);

  switch (action) {
    case "start":
      primeSpeech();
      workout.start();
      break;
    case "pause":
      workout.pause();
      break;
    case "resume":
      workout.resume();
      break;
    case "stop":
      workout.stop();
      break;
  }
}

/* =========================================================================
   INIT
   ========================================================================= */

function renderDefenseGlossary() {
  const dl = document.getElementById("defense-glossary");
  dl.innerHTML = DEFENSE_GLOSSARY.map(
    ([term, desc]) => `<dt>${term}</dt><dd>${desc}</dd>`
  ).join("");
}

applySettingsToUI();
refreshVoices();
renderDefenseGlossary();
workout.refreshIdleDisplay();
workout.setControlsForState();
handleVoiceActionParam();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
