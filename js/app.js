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

const PUNCH_POOLS = {
  beginner: [
    "1-2", "1-1", "2-3", "1-3", "3-2",
    "1-2-3", "1-1-2", "2-3-2", "1-3-2", "1-2-1"
  ],
  intermediate: [
    "1-2-3", "1-1-2", "2-3-2", "1-2-3-2", "1-3-2",
    "1-2-6", "3-2-3", "1-4-3", "1-2-3-6", "2-3-6",
    "1-1-2-3", "3-2-3-2"
  ],
  advanced: [
    "1-2-3-2", "1-1-2-3-2", "1-2-3-6-3", "2-3-2-3-2",
    "1-2-6-3-2", "1-3-2-3-2", "1-2-3-2-3-2", "1-4-3-2",
    "1-2-5-2", "3-2-3-6-3", "1-1-2-3-6-3", "2-3-2-6-3"
  ]
};

// Advanced-only: defense/footwork chained directly with punches into one call.
const CHAINED_COMBOS = [
  "Slip left, 2-3, pivot right, 1-1-2",
  "Roll, 3-2, step in, 1-2-3",
  "Duck, 1-2, pull back, 2-3-2",
  "Parry, 2, pivot left, 1-2-3-2",
  "Slip right, 1-2, circle left, 2-3",
  "Block, step out, 1-1-2-3",
  "Duck, 3-2, roll, 2-3-2",
  "Slip left, slip right, 1-2-3",
  "Pivot left, 1-2, step in, 3-2-3",
  "Cover up, step out, 2-3-2-3",
  "Pull straight back, 1-2, circle right, 1-1-2",
  "Parry, 1-2-3, pivot right, 2-3"
];

// Pacing (seconds between calls) during Timed Rounds, by difficulty.
const PACE = {
  beginner: { min: 3.5, max: 5.0 },
  intermediate: { min: 2.5, max: 3.5 },
  advanced: { min: 1.5, max: 2.5 }
};

// Chance of a standalone defense call vs a punch combo (defense toggle on).
const DEFENSE_FREQ = { beginner: 0.15, intermediate: 0.3, advanced: 0.2 };
// Advanced-only: chance of using a fully chained defense+punch combo.
const CHAIN_FREQ = 0.4;

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateCall(difficulty, includeDefense) {
  const punchPool = PUNCH_POOLS[difficulty] || PUNCH_POOLS.advanced;

  if (!includeDefense) return pick(punchPool);

  if (difficulty === "advanced") {
    const r = Math.random();
    if (r < CHAIN_FREQ) return pick(CHAINED_COMBOS);
    if (r < CHAIN_FREQ + DEFENSE_FREQ.advanced) return pick(DEFENSE_MOVES);
    return pick(punchPool);
  }

  const freq = DEFENSE_FREQ[difficulty] ?? 0.2;
  if (Math.random() < freq) return pick(DEFENSE_MOVES);
  return pick(punchPool);
}

function speakableText(call) {
  // "1-2-3" -> "1, 2, 3" so the TTS engine pauses naturally between numbers.
  return call.replace(/-/g, ", ");
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
  defaultOpt.textContent = "Default";
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

function speak(text) {
  if (!synth) return;
  synth.cancel(); // don't let calls queue up and fall behind the pace
  const u = new SpeechSynthesisUtterance(text);
  u.rate = settings.rate;
  u.volume = settings.volume;
  if (settings.voiceURI) {
    const v = voices.find((v) => v.voiceURI === settings.voiceURI);
    if (v) u.voice = v;
  }
  synth.speak(u);
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
  els.callsList.appendChild(li);
  while (els.callsList.children.length > 8) {
    els.callsList.removeChild(els.callsList.firstChild);
  }
  els.callsList.scrollTop = els.callsList.scrollHeight;
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

  function scheduleNextCall() {
    if (callTimer) clearTimeout(callTimer);
    let gapSec;
    if (settings.mode === "freestyle") {
      gapSec = settings.freestyleInterval;
    } else {
      const pace = PACE[settings.difficulty] || PACE.advanced;
      gapSec = pace.min + Math.random() * (pace.max - pace.min);
    }
    callTimer = setTimeout(() => {
      const call = generateCall(settings.difficulty, settings.includeDefense);
      addCallToLog(call);
      speak(speakableText(call));
      scheduleNextCall();
    }, gapSec * 1000);
  }

  function startRoundsMode() {
    currentRound = 1;
    beginWorkPhase();
  }

  function beginWorkPhase() {
    state = "work";
    phaseDuration = settings.roundLength;
    phaseEndAt = performance.now() + phaseDuration * 1000;
    setPhaseUI("WORK", "work");
    els.roundCounter.textContent = `Round ${currentRound} of ${settings.numRounds}`;
    playBell("start");
    vibrate(100);
    scheduleNextCall();
    startTick();
  }

  function beginRestPhase() {
    state = "rest";
    phaseDuration = settings.restLength;
    phaseEndAt = performance.now() + phaseDuration * 1000;
    setPhaseUI("REST", "rest");
    if (callTimer) { clearTimeout(callTimer); callTimer = null; }
    speak("Rest");
    startTick();
  }

  function finishWorkout() {
    state = "done";
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
    speak("Let's work");
    scheduleNextCall();
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
    scheduleNextCall();
    startTick();
    setControlsForState();
  }

  function togglePause() {
    if (state === "paused") resume();
    else pause();
  }

  function stop() {
    clearTimers();
    if (synth) synth.cancel();
    state = "idle";
    currentRound = 0;
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

  return { start, togglePause, stop, isActive, refreshIdleDisplay, setControlsForState };
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
  speak("1, 2, 3. Slip left. Let's work.");
});

/* =========================================================================
   NAVIGATION
   ========================================================================= */

const workoutScreen = document.getElementById("workout-screen");
const settingsScreen = document.getElementById("settings-screen");

document.getElementById("settings-toggle").addEventListener("click", () => {
  workoutScreen.classList.remove("active");
  settingsScreen.classList.add("active");
});

document.getElementById("btn-done").addEventListener("click", () => {
  settingsScreen.classList.remove("active");
  workoutScreen.classList.add("active");
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
   INIT
   ========================================================================= */

applySettingsToUI();
refreshVoices();
workout.refreshIdleDisplay();
workout.setControlsForState();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
