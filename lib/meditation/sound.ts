// Web Audio API Synthesizer for Zen bells, Singing Bowls and Breathing Cues

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
 * Plays a rich Tibetan singing bowl sound
 */
export function playSingingBowl(pitch: number = 260) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const harmonics = [
    { mult: 1.0, gain: 0.5, decay: 4.5 },
    { mult: 2.76, gain: 0.28, decay: 3.8 },
    { mult: 5.4, gain: 0.15, decay: 2.5 },
    { mult: 8.93, gain: 0.08, decay: 1.8 },
  ];

  harmonics.forEach(({ mult, gain, decay }) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch * mult, now);

    // subtle vibrato
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(3.2, now);
    lfoGain.gain.setValueAtTime(1.5, now);
    lfo.connect(osc.frequency);
    lfo.start(now);
    lfo.stop(now + decay);

    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc.connect(g);
    g.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + decay);
  });
}

/**
 * Plays a gentle, pleasant chime for breathing phase change
 */
export function playChime(type: 'inhale' | 'hold' | 'exhale') {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  const freq = type === 'inhale' ? 440 : type === 'hold' ? 523.25 : 392;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * (type === 'inhale' ? 1.08 : type === 'exhale' ? 0.95 : 1), now + 0.8);

  g.gain.setValueAtTime(0.001, now);
  g.gain.linearRampToValueAtTime(0.18, now + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

  osc.connect(g);
  g.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 1.2);
}

/**
 * Trigger subtle haptic vibration on mobile devices
 */
export function triggerVibration(pattern: number | number[] = 40) {
  if (typeof window === 'undefined') return;
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}
