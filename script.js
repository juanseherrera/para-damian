const envelopeWrap = document.getElementById("envelopeWrap");
const envelope = document.getElementById("envelope");
const letter = document.querySelector(".letter-paper");
const hint = document.getElementById("hint");
const musicNote = document.getElementById("musicNote");

let state = "closed";
let audioContext = null;
let masterGain = null;
let musicTimer = null;
let musicStarted = false;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function startAmbientMusic() {
  if (musicStarted) return;
  musicStarted = true;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  audioContext = new AudioContext();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.0001;
  masterGain.connect(audioContext.destination);

  const notes = [
    [261.63, 0.00], [329.63, 0.45], [392.00, 0.90],
    [329.63, 1.35], [293.66, 1.80], [349.23, 2.25],
    [440.00, 2.70], [392.00, 3.15],
    [261.63, 3.80], [329.63, 4.25], [392.00, 4.70],
    [493.88, 5.15], [440.00, 5.60], [392.00, 6.05],
    [349.23, 6.50], [329.63, 6.95]
  ];

  const playNote = (frequency, offset) => {
    const now = audioContext.currentTime + offset;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.78);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.82);
  };

  const loop = () => {
    if (!audioContext) return;
    notes.forEach(([frequency, offset]) => playNote(frequency, offset));
    musicTimer = setTimeout(loop, 7600);
  };

  masterGain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 1.2);
  loop();
  musicNote.classList.add("active");
}

async function openEnvelope() {
  if (state !== "closed") return;

  state = "opening";
  startAmbientMusic();
  hint.style.opacity = "0";

  envelopeWrap.classList.remove("closing");
  envelopeWrap.classList.add("opening");

  await sleep(1150);

  envelopeWrap.classList.add("opened");
  state = "open";
}

async function closeEnvelope() {
  if (state !== "open") return;

  state = "closing";
  envelopeWrap.classList.remove("opened");
  envelopeWrap.classList.add("closing");

  await sleep(900);

  envelopeWrap.classList.remove("opening", "closing");
  hint.style.opacity = "";
  state = "closed";
}

envelope.addEventListener("click", (event) => {
  if (state === "closed") {
    event.preventDefault();
    openEnvelope();
  }
});

letter.addEventListener("click", (event) => {
  if (state === "open") {
    event.stopPropagation();
    closeEnvelope();
  }
});

// Evita que el gesto de arrastre/selección interfiera con la interacción.
envelope.addEventListener("dragstart", e => e.preventDefault());
letter.addEventListener("dragstart", e => e.preventDefault());

// Pausa visual de la música cuando la pestaña queda oculta y la retoma al volver.
document.addEventListener("visibilitychange", async () => {
  if (!audioContext) return;

  if (document.hidden) {
    if (audioContext.state === "running") {
      await audioContext.suspend();
    }
  } else if (musicStarted) {
    await audioContext.resume();
  }
});
