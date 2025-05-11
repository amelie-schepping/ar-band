import "bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

// Loading Buttons + Animationen
import "ldbutton/index.min.css";
import "@loadingio/loading.css/loading.min.css";
import "@loadingio/loading.css/entries/metronome.min.css";
import "@loadingio/loading.css/entries/breath.min.css";

// Web Audio API Kontext
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// Basis-URL für GitHub Pages etc.
const basePath = import.meta.env.BASE_URL;

// Audiodateien
const audioFiles = {
  guitar: `${basePath}assets/audios/guitar.wav`,
  piano: `${basePath}assets/audios/piano.wav`,
  eguitar: `${basePath}assets/audios/eguitar.wav`,
  pad: `${basePath}assets/audios/pad.wav`,
  melody: `${basePath}assets/audios/melody.wav`,
  strings: `${basePath}assets/audios/strings.wav`,
};

// State-Verwaltung
const buffers = {};
const sources = {};
const loopDurations = {};
const isPlaying = {
  guitar: false,
  piano: false,
  eguitar: false,
  pad: false,
  melody: false,
  strings: false,
};

let startTime = null;

// Audiodateien laden
async function loadAudio(name, url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  buffers[name] = audioBuffer;
  loopDurations[name] = audioBuffer.duration;
}

// Loop abspielen, mit optionalem Delay für Sync
function playLoop(name, delay = 0) {
  const source = audioCtx.createBufferSource();
  source.buffer = buffers[name];
  source.loop = true;
  source.connect(audioCtx.destination);

  const startAt = audioCtx.currentTime + delay;
  source.start(startAt);
  sources[name] = source;
  isPlaying[name] = true;

  console.log(`[${name}] startet in ${delay.toFixed(2)}s`);
}

// Loop stoppen
function stopLoop(name) {
  if (sources[name]) {
    sources[name].stop();
    sources[name].disconnect();
    sources[name] = null;
  }
  isPlaying[name] = false;

  const anyStillPlaying = Object.values(isPlaying).some(Boolean);
  if (!anyStillPlaying) {
    startTime = null;
    console.log("Alle Loops gestoppt – startTime zurückgesetzt.");
  }
}

// UI-Zustände für Buttons
function setButtonWaiting(btn) {
  btn.classList.add("ld", "ld-breath");
}

function clearButtonWaiting(btn) {
  btn.classList.remove("ld", "ld-breath");
}

function setButtonActive(btn) {
  btn.classList.add("active");
}

function clearButtonActive(btn) {
  btn.classList.remove("active");
}

// Button-Logik
function setupButton(name) {
  const btn = document.getElementById(`${name}-btn`);

  btn.addEventListener("click", async () => {
    console.log(`Button '${name}' clicked`);

    // AudioContext aktivieren (z. B. bei erster User-Interaktion)
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    // Audio laden (nur beim ersten Mal)
    if (!buffers[name]) {
      await loadAudio(name, audioFiles[name]);
    }

    // Toggle-Logik: Wenn bereits aktiv, stoppen
    if (isPlaying[name]) {
      stopLoop(name);
      clearButtonActive(btn);
      return;
    }

    // Synchronisation vorbereiten
    const anyPlaying = Object.values(isPlaying).some(Boolean);
    let delay = 0;

    if (anyPlaying) {
      const duration = loopDurations[name];
      const offset = (audioCtx.currentTime - startTime) % duration;
      delay = duration - offset;

      console.log(`[${name}] wartet ${delay.toFixed(2)}s auf nächsten Takt`);
      setButtonWaiting(btn);

      setTimeout(() => {
        clearButtonWaiting(btn);
      }, delay * 1000);
    } else {
      startTime = audioCtx.currentTime;
    }

    // Loop einplanen
    playLoop(name, delay);
    setButtonActive(btn);
  });
}

//  Buttons initialisieren
setupButton("eguitar");
setupButton("piano");
setupButton("pad");
setupButton("strings");
setupButton("melody");
