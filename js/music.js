// The music: a plucked zither (a guzheng, synthesised by Karplus–Strong) wandering a pentatonic scale, slow and spare
// in the open, a little different in each land (higher and brighter in town, lower in the bamboo, sparse at night),
// with a frame drum and faster runs when a fight is on.
import { audio } from './sound.js';

const PENTA = [0, 2, 4, 7, 9]; // gong shang jue zhi yu
const MOODS = { open: { root: 50, tempo: 0.62, density: 0.55 }, manor: { root: 50, tempo: 0.7, density: 0.5 }, village: { root: 52, tempo: 0.6, density: 0.55 }, town: { root: 55, tempo: 0.5, density: 0.7 }, bamboo: { root: 45, tempo: 0.8, density: 0.4 }, lake: { root: 52, tempo: 0.85, density: 0.35 }, temple: { root: 43, tempo: 0.95, density: 0.3 }, cliff: { root: 47, tempo: 0.55, density: 0.6 }, fort: { root: 45, tempo: 0.45, density: 0.7 }, falls: { root: 48, tempo: 0.9, density: 0.35 } };
let started = false, mood = MOODS.open, fighting = false, next = 0, deg = 2, bus = null, timer = null;
function pluck(ac, out, t, midi, vol = 0.22, len = 2.2) {
  const f = 440 * 2 ** ((midi - 69) / 12), sr = ac.sampleRate, n = Math.ceil(sr * len), b = ac.createBuffer(1, n, sr), d = b.getChannelData(0), P = Math.max(2, Math.round(sr / f));
  const ring = new Float32Array(P); for (let i = 0; i < P; i++) ring[i] = (Math.random() * 2 - 1) * (i < P / 2 ? 1 : 0.6);
  let idx = 0, damp = 0.996 - Math.min(0.01, f / 80000);
  for (let i = 0; i < n; i++) { const a = ring[idx], c = ring[(idx + 1) % P], v = (a + c) * 0.5 * damp; ring[idx] = v; d[i] = a * (i < 40 ? i / 40 : 1); idx = (idx + 1) % P; }
  const s = ac.createBufferSource(), g = ac.createGain(), lp = ac.createBiquadFilter(); s.buffer = b; lp.type = 'lowpass'; lp.frequency.value = 2600; g.gain.value = vol; s.connect(lp).connect(g).connect(out); s.start(t);
}
function drum(ac, out, t, vol = 0.3) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.25); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.connect(g).connect(out); o.start(t); o.stop(t + 0.35); }
function tick() {
  const { ac, out } = audio(); if (!ac || ac.state !== 'running') return;
  if (!bus) { bus = ac.createGain(); bus.gain.value = 0.55; const dl = ac.createDelay(1), fb = ac.createGain(), wet = ac.createGain(); dl.delayTime.value = 0.37; fb.gain.value = 0.32; wet.gain.value = 0.35; bus.connect(out); bus.connect(dl); dl.connect(fb).connect(dl); dl.connect(wet).connect(out); }
  const now = ac.currentTime; if (next < now) next = now + 0.1;
  while (next < now + 0.6) {
    const beat = fighting ? 0.24 : mood.tempo, dens = fighting ? 0.85 : mood.density;
    if (Math.random() < dens) { deg = Math.max(0, Math.min(9, deg + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)])); const midi = mood.root + 12 * Math.floor(deg / 5) + PENTA[deg % 5]; pluck(ac, bus, next, midi, fighting ? 0.16 : 0.2); if (Math.random() < 0.25) pluck(ac, bus, next, midi - 12, 0.12, 3); }
    if (fighting && Math.round(next / beat) % 2 === 0) drum(ac, bus, next, 0.28);
    next += beat * (Math.random() < 0.2 ? 2 : 1);
  }
}
export const music = {
  start() { if (started) return; started = true; timer = setInterval(tick, 200); },
  mood(id) { mood = MOODS[id] || MOODS.open; },
  fight(on) { fighting = on; },
};
