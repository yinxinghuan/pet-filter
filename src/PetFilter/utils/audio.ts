// Minimal audio — tiny tap click + a 4-note ascending bell on result
// transition. Following the Album-Cover-Gen pattern of using one
// WebAudio context unlocked on first pointerdown. Per CLAUDE.md global
// rule: never play anything until first user gesture.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  try {
    const AC = (window.AudioContext ?? (window as any).webkitAudioContext);
    if (!AC) return null;
    ctx = new AC();
  } catch {
    return null;
  }
  return ctx;
}

export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume();
}

export function playClick(): void {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.frequency.value = 1200;
  osc.type = 'square';
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(0.04, c.currentTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.06);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.08);
}

export function playReveal(): void {
  const c = getCtx();
  if (!c) return;
  const notes = [523.25, 659.25, 784.0, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.frequency.value = freq;
    osc.type = 'triangle';
    const start = c.currentTime + i * 0.09;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.07, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
    osc.connect(g).connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.5);
  });
}

export function playShutter(): void {
  const c = getCtx();
  if (!c) return;
  // Noise burst → quick fall, mimicking a camera shutter.
  const buffer = c.createBuffer(1, c.sampleRate * 0.12, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.setValueAtTime(0.16, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.12);
  const filter = c.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 900;
  src.connect(filter).connect(g).connect(c.destination);
  src.start();
}
