// Web Audio API Synthesizer for Workout Beeps, Whistles, and Interval Signals

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Coach countdown beep (3, 2, 1) or higher pitch for GO!
 */
export function playBeep(isGo: boolean = false) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  const freq = isGo ? 880 : 440; // A5 for GO, A4 for countdown
  const duration = isGo ? 0.35 : 0.15;

  osc.type = isGo ? 'triangle' : 'sine';
  osc.frequency.setValueAtTime(freq, now);

  g.gain.setValueAtTime(0.001, now);
  g.gain.linearRampToValueAtTime(0.25, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(g);
  g.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

/**
 * Whistle sound for interval changes (e.g. Work started or Rest)
 */
export function playWhistle() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(2200, now);
  osc.frequency.linearRampToValueAtTime(2800, now + 0.1);
  osc.frequency.linearRampToValueAtTime(2400, now + 0.25);

  g.gain.setValueAtTime(0.001, now);
  g.gain.linearRampToValueAtTime(0.2, now + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

  osc.connect(g);
  g.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.3);
}

/**
 * Victory fanfare / completion chime
 */
export function playWorkoutFanfare() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const startTime = now + idx * 0.12;
    const duration = 0.6;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    g.gain.setValueAtTime(0.001, startTime);
    g.gain.linearRampToValueAtTime(0.22, startTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(g);
    g.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

/**
 * Mobile vibration trigger
 */
export function triggerWorkoutVibration(pattern: number | number[] = 50) {
  if (typeof window === 'undefined') return;
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}
