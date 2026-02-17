// Sound engine using Web Audio API - no external files needed!
// All sounds are synthesized in real-time ✨

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // Resume if suspended (mobile browsers require user gesture)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Play a single tone
function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.15,
  delay: number = 0
) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

// Spin start - wooshy ascending
export function playSpinSound() {
  for (let i = 0; i < 8; i++) {
    playTone(200 + i * 50, 0.08, "sawtooth", 0.06, i * 0.04);
  }
}

// Each reel stopping - chunky thud
export function playReelStopSound(reelIndex: number) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(80 + reelIndex * 15, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);

  // Add a click noise
  playTone(600, 0.03, "square", 0.08);
}

// Win sound - happy ascending melody
export function playWinSound() {
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    playTone(freq, 0.2, "sine", 0.12, i * 0.12);
    playTone(freq * 1.5, 0.15, "triangle", 0.05, i * 0.12); // harmony
  });
}

// Big win - epic fanfare
export function playBigWinSound() {
  // Fanfare melody
  const melody = [523, 523, 659, 784, 659, 784, 1047, 1047];
  melody.forEach((freq, i) => {
    playTone(freq, 0.18, "sine", 0.13, i * 0.1);
    playTone(freq * 0.5, 0.2, "triangle", 0.06, i * 0.1); // bass
  });
  // Sparkle effect
  for (let i = 0; i < 6; i++) {
    playTone(2000 + Math.random() * 2000, 0.08, "sine", 0.04, 0.8 + i * 0.06);
  }
}

// Scatter hit - magical shimmer
export function playScatterSound() {
  // Rising magical tones
  for (let i = 0; i < 10; i++) {
    playTone(
      800 + i * 200,
      0.3 - i * 0.02,
      "sine",
      0.08,
      i * 0.06
    );
  }
  // Sparkles
  for (let i = 0; i < 8; i++) {
    playTone(
      1500 + Math.random() * 3000,
      0.15,
      "sine",
      0.04,
      0.3 + i * 0.08
    );
  }
}

// Lose sound - sad descending wah wah
export function playLoseSound() {
  const ctx = getAudioContext();

  // Sad trombone - wah wah wahhhh
  const notes = [392, 370, 349, 233]; // G4, F#4, F4, Bb3
  const durations = [0.25, 0.25, 0.25, 0.6];

  notes.forEach((freq, i) => {
    const startTime = i < 3 ? i * 0.28 : 0.84;
    playTone(freq, durations[i], "sawtooth", 0.07, startTime);

    // Add vibrato on last note
    if (i === 3) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();

      vibrato.frequency.setValueAtTime(5, ctx.currentTime + startTime);
      vibratoGain.gain.setValueAtTime(8, ctx.currentTime + startTime);

      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      vibrato.start(ctx.currentTime + startTime);
      osc.start(ctx.currentTime + startTime);
      vibrato.stop(ctx.currentTime + startTime + 0.7);
      osc.stop(ctx.currentTime + startTime + 0.7);
    }
  });
}

// Near miss - tease/suspense
export function playNearMissSound() {
  playTone(400, 0.15, "sine", 0.1, 0);
  playTone(500, 0.15, "sine", 0.1, 0.15);
  playTone(450, 0.4, "triangle", 0.08, 0.3);
}

// Button click
export function playClickSound() {
  playTone(800, 0.05, "square", 0.06);
  playTone(1200, 0.03, "sine", 0.04, 0.02);
}

// Bet change click
export function playBetChangeSound() {
  playTone(600, 0.04, "sine", 0.08);
}

// Coin counting (for win display)
export function playCoinSound() {
  playTone(1800 + Math.random() * 400, 0.06, "sine", 0.08);
}

// Free spin awarded jingle
export function playFreeSpinSound() {
  const notes = [784, 988, 1175, 1568]; // G5, B5, D6, G6
  notes.forEach((freq, i) => {
    playTone(freq, 0.25, "sine", 0.1, i * 0.08);
    playTone(freq * 0.75, 0.2, "triangle", 0.05, i * 0.08);
  });
}

// Initialize audio on first user interaction
export function initAudio() {
  getAudioContext();
}
