// Bootstrap
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const basePath = import.meta.env.BASE_URL;

const audioFiles = {
  guitar: `${basePath}assets/audios/guitar.wav`,
  piano: `${basePath}assets/audios/piano.wav`,
};

const buffers = {};
const sources = {};
const loopDurations = {};
const isPlaying = {
  guitar: false,
  piano: false,
};

let startTime = null;

// Audio laden & Loop-Dauer speichern
async function loadAudio(name, url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  buffers[name] = audioBuffer;
  loopDurations[name] = audioBuffer.duration;
}

// Einen Loop synchron starten
function playLoop(name) {
  const source = audioCtx.createBufferSource();
  source.buffer = buffers[name];
  source.loop = true;

  source.connect(audioCtx.destination);

  const duration = loopDurations[name];
  const offset = (audioCtx.currentTime - startTime) % duration;
  const delay = duration - offset;
  const startAt = audioCtx.currentTime + delay;

  source.start(startAt);
  sources[name] = source;
  isPlaying[name] = true;

  const statusText = document.getElementById("status-text");

  // Live-Countdown starten
  const start = performance.now();
  const interval = setInterval(() => {
    const elapsed = (performance.now() - start) / 1000;
    const remaining = Math.max(0, delay - elapsed);
    statusText.textContent = `${name} startet in ${remaining.toFixed(
      1
    )} Sekunden…`;

    if (remaining <= 0) {
      clearInterval(interval);
      statusText.textContent = "";
    }
  }, 100); // alle 100ms aktualisieren

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
}

// Button-Handler
function setupButton(name) {
  const btn = document.getElementById(`${name}-btn`);
  btn.addEventListener("click", async () => {
    console.log(`Button '${name}' clicked`);

    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    console.log("AudioContext state:", audioCtx.state);

    if (!startTime) {
      startTime = audioCtx.currentTime;
    }

    if (!buffers[name]) {
      await loadAudio(name, audioFiles[name]);
    }

    if (isPlaying[name]) {
      stopLoop(name);
      btn.classList.remove("active");
    } else {
      playLoop(name);
      btn.classList.add("active");
    }
  });
}

setupButton("guitar");
setupButton("piano");
