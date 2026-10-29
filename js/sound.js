// The sounds of a move, synthesised: the qi gathering (a rising hum and wind), the cut (a hiss of steel), the crescent
// leaving (a deep thump and a ringing), its flight (a tearing whoosh), and bricks split and falling (cracks, clatter).
let ac = null, out = null, muted = false, clock = null, tap = null;
let rs = 12345; const rnd = () => ((rs = (rs * 16807) % 2147483647) / 2147483647);
export const mute = (b) => { muted = b; };
// for recording: everything also goes to a stream; for rendering: an offline context and a clock set from outside
export function recordTap() { wake(); if (!tap) { tap = ac.createMediaStreamDestination(); out.connect(tap); } return tap.stream; }
export function offline(ctx) { ac = ctx; out = ctx.createGain(); out.gain.value = 0.5; const c = ctx.createDynamicsCompressor(); out.connect(c).connect(ctx.destination); amb = null; muted = false; clock = 0; }
export const setClock = (t) => { clock = t; };
export const audio = () => ({ ac, out });
// the sound of a place, looped quietly under a scene: rain, a night of crickets, wind on the road, birds in a yard
let amb = null;
function loopBuffer(kind) {
  const sr = ac.sampleRate, n = sr * 4, b = ac.createBuffer(1, n, sr), d = b.getChannelData(0);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const w = rnd() * 2 - 1, t = i / sr;
    if (kind === 'rain') { lp += (w - lp) * 0.35; d[i] = lp * 0.5 + (rnd() < 0.0016 ? (rnd() - 0.5) * 0.9 : 0); }
    else if (kind === 'wind') { lp += (w - lp) * 0.02; d[i] = lp * 2.2 * (0.6 + 0.4 * Math.sin(t * 1.3) * Math.sin(t * 0.7)); }
    else if (kind === 'night') { lp += (w - lp) * 0.01; const ch = ((t * 3.1) % 1 < 0.18 ? Math.sin(t * 2 * Math.PI * 4200) * Math.max(0, Math.sin(((t * 3.1) % 1) / 0.18 * Math.PI)) * 0.12 : 0) + ((t * 2.3 + 0.4) % 1 < 0.12 ? Math.sin(t * 2 * Math.PI * 3700) * 0.08 : 0); d[i] = lp * 0.8 + ch; }
    else if (kind === 'birds') { lp += (w - lp) * 0.015; const ph = (t * 0.9) % 1, chirp = ph < 0.08 ? Math.sin(2 * Math.PI * (2600 + 1800 * ph / 0.08) * t) * 0.12 * Math.sin(ph / 0.08 * Math.PI) : 0; d[i] = lp * 0.5 + chirp; }
    else d[i] = 0;
  }
  return b;
}
export function ambience(kind) {
  if (!ac) return; if (amb) { const a = amb, t = now(); a.g.gain.setTargetAtTime(0.0001, t, 0.3); a.s.stop(t + 1.5); amb = null; }
  if (!kind || muted) return;
  const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = loopBuffer(kind); s.loop = true; g.gain.value = 0.0001; g.gain.setTargetAtTime({ rain: 0.35, wind: 0.3, night: 0.4, birds: 0.3 }[kind] || 0.3, now(), 0.6); s.connect(g).connect(out); s.start(now()); amb = { s, g };
}
export function wake() { if (clock != null && ac instanceof OfflineAudioContext) return; if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); out = ac.createGain(); out.gain.value = 0.5; const c = ac.createDynamicsCompressor(); out.connect(c).connect(ac.destination); } if (ac.state === 'suspended') ac.resume(); }
const now = () => (clock != null ? clock : ac.currentTime);
function noise(dur, { at = 0, f0 = 800, f1 = 800, q = 1, vol = 0.4, type = 'bandpass', a = 0.01 } = {}) {
  if (muted) return;
  const t = now() + at, n = Math.ceil(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = rnd() * 2 - 1;
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f).connect(g).connect(out); s.start(t); s.stop(t + dur + 0.05);
}
function tone(f0, f1, dur, { at = 0, vol = 0.3, type = 'sine', a = 0.01 } = {}) {
  if (muted) return;
  const t = now() + at, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05);
}
export const SFX = {
  ambience: (k) => ambience(k),
  gavel() { if (!ac) return; tone(900, 600, 0.08, { vol: 0.6, type: 'square' }); noise(0.12, { f0: 2500, f1: 1200, q: 2, vol: 0.6, a: 0.002 }); tone(180, 120, 0.15, { vol: 0.5, type: 'triangle' }); },
  scream() { if (!ac || muted) return; const t = now(), o = ac.createOscillator(), b = ac.createBiquadFilter(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(700, t); o.frequency.linearRampToValueAtTime(1100, t + 0.25); o.frequency.exponentialRampToValueAtTime(420, t + 1.1); b.type = 'bandpass'; b.frequency.value = 1500; b.Q.value = 2.5; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2); o.connect(b).connect(g).connect(out); o.start(t); o.stop(t + 1.3); },
  crash() { if (!ac) return; noise(0.5, { f0: 3000, f1: 800, q: 0.8, vol: 0.5 }); for (let i = 0; i < 8; i++) noise(0.06, { at: 0.05 + rnd() * 0.4, f0: 2000 + rnd() * 3000, f1: 1500, q: 5, vol: 0.15, a: 0.003 }); },
  gong(k = 1) { if (!ac) return; tone(110, 100, 2.2, { vol: 0.35 * k, type: 'sine', a: 0.01 }); tone(165, 150, 1.8, { vol: 0.15 * k }); tone(330, 310, 1.2, { vol: 0.08 * k }); noise(0.2, { f0: 600, f1: 300, q: 1, vol: 0.2 * k }); },
  steps(k = 1) { if (!ac) return; for (let i = 0; i < 6; i++) noise(0.05, { at: i * 0.16, f0: 500, f1: 300, q: 1.5, vol: 0.12 * k, a: 0.004 }); },
  clash(k = 1) { if (!ac) return; tone(70, 30, 0.9, { vol: 0.9 * k }); noise(0.6, { f0: 3000, f1: 200, q: 0.6, vol: 0.6 * k, type: 'lowpass' }); tone(1320, 1250, 1.0, { vol: 0.08, at: 0.02 }); tone(1980, 1900, 0.8, { vol: 0.05, at: 0.02 }); noise(1.1, { at: 0.05, f0: 1500, f1: 300, q: 2, vol: 0.2, a: 0.2 }); },
  // a cold laugh: ha, ha, ha, falling, through a mouth-like filter, echoing
  laugh(rate = 1) { if (!ac || muted) return; const t0 = now(), dl = ac.createDelay(1), fb = ac.createGain(), wet = ac.createGain(); dl.delayTime.value = 0.23; fb.gain.value = 0.35; wet.gain.value = 0.5; dl.connect(fb).connect(dl); dl.connect(wet).connect(out);
    [0, 0.2, 0.4, 0.66].forEach((at, i) => { const t = t0 + at / rate, d = (i === 3 ? 0.3 : 0.15) / rate, f = 175 - i * 12, o = ac.createOscillator(), b1 = ac.createBiquadFilter(), b2 = ac.createBiquadFilter(), g = ac.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.15, t); o.frequency.exponentialRampToValueAtTime(f * 0.85, t + d); b1.type = 'bandpass'; b1.frequency.value = 750; b1.Q.value = 5; b2.type = 'bandpass'; b2.frequency.value = 1150; b2.Q.value = 6;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(b1).connect(g); o.connect(b2).connect(g); g.connect(out); g.connect(dl); o.start(t); o.stop(t + d + 0.05); }); },
  palm(rate = 1) { if (!ac) return; const k = 1 / rate; tone(60, 28, 1.0 * k, { vol: 0.9 }); noise(1.3 * k, { f0: 900, f1: 90, q: 0.7, vol: 0.6, type: 'lowpass', a: 0.03 }); noise(1.1 * k, { f0: 320, f1: 160, q: 2, vol: 0.35, a: 0.08 }); },
  thud(k = 1) { if (!ac) return; tone(120, 55, 0.18, { vol: 0.6 * k }); noise(0.1, { f0: 1500, f1: 400, q: 0.8, vol: 0.4 * k, type: 'lowpass' }); },
  // a cry, by mouth: a voiced glide through a vowel-ish filter (higher for a kid)
  ouch(kid = false, kind = 'light') { if (!ac || muted) return; const f = kid ? 520 : 300, d = kind === 'down' ? 0.45 : 0.25, t = now(); const o = ac.createOscillator(), b = ac.createBiquadFilter(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.3, t); o.frequency.exponentialRampToValueAtTime(f * 0.7, t + d); b.type = 'bandpass'; b.frequency.value = kid ? 1400 : 900; b.Q.value = 3; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(b).connect(g).connect(out); o.start(t); o.stop(t + d + 0.05); },
  swing(k = 1) { if (!ac) return; noise(0.2, { f0: 2500, f1: 500, q: 1.2, vol: 0.35 * k }); },
  talk(kid = false) { if (!ac) return; const f = (kid ? 380 : 220) * (0.85 + rnd() * 0.3); tone(f, f * 0.9, 0.07, { vol: 0.05, type: 'triangle' }); },
  flick() { if (!ac) return; tone(260, 420, 0.12, { vol: 0.35, type: 'triangle' }); noise(0.05, { f0: 1500, f1: 900, q: 2, vol: 0.2 }); },
  windup(rate = 1) { if (!ac) return; const k = 1 / rate; noise(0.75 * k, { f0: 250, f1: 2200, q: 3, vol: 0.28, a: 0.5 * k }); noise(0.75 * k, { f0: 600, f1: 3200, q: 6, vol: 0.12, a: 0.6 * k }); },
  kick() { if (!ac) return; tone(150, 45, 0.25, { vol: 0.9 }); noise(0.08, { f0: 2500, f1: 600, q: 0.8, vol: 0.5, type: 'lowpass' }); },
  whirl(rate = 1) { if (!ac) return; const k = 1 / rate; noise(0.7 * k, { f0: 3000, f1: 500, q: 4, vol: 0.35, a: 0.03 }); noise(0.7 * k, { f0: 1200, f1: 300, q: 2, vol: 0.25, a: 0.05 }); },
  blast(big = 1) { if (!ac) return; tone(90, 28, 0.6, { vol: 0.8 * big }); noise(0.4, { f0: 1800, f1: 150, q: 0.7, vol: 0.55 * big, type: 'lowpass' }); for (let i = 0; i < 10; i++) { const at = 0.15 + rnd() * 0.8; noise(0.05, { at, f0: 1800 + rnd() * 2600, f1: 1500, q: 6, vol: 0.1 + rnd() * 0.12, a: 0.003 }); } },
  bounce() { if (!ac) return; tone(180, 90, 0.12, { vol: 0.45, type: 'triangle' }); },
  trap() { if (!ac) return; tone(140, 80, 0.1, { vol: 0.35, type: 'triangle' }); noise(0.05, { f0: 900, f1: 500, q: 1, vol: 0.15 }); },
  gather(rate = 1) { if (!ac) return; const k = 1 / rate; noise(0.8 * k, { f0: 300, f1: 1800, q: 2, vol: 0.18, a: 0.5 * k }); tone(110, 220, 0.8 * k, { vol: 0.12, a: 0.6 * k, type: 'triangle' }); tone(660, 1320, 0.8 * k, { vol: 0.04, a: 0.7 * k }); },
  cut(rate = 1) { if (!ac) return; noise(0.22 / rate, { f0: 6000, f1: 900, q: 1.5, vol: 0.5 }); },
  launch(rate = 1) { if (!ac) return; const k = 1 / rate; tone(140, 40, 0.5 * k, { vol: 0.7, type: 'sine' }); noise(0.35 * k, { f0: 1200, f1: 200, q: 0.8, vol: 0.4, type: 'lowpass' }); tone(1760, 1700, 1.2 * k, { vol: 0.06, at: 0.02, a: 0.02 }); tone(2640, 2600, 0.9 * k, { vol: 0.04, at: 0.02 }); noise(0.9 * k, { at: 0.05, f0: 2500, f1: 600, q: 3, vol: 0.25, a: 0.1 }); },
  hit(big = 1) { if (!ac) return; noise(0.12, { f0: 3000, f1: 1500, q: 1, vol: 0.5 * big }); tone(90, 50, 0.3, { vol: 0.4 * big }); for (let i = 0; i < 7; i++) { const at = 0.25 + rnd() * 0.6; noise(0.05, { at, f0: 2200 + rnd() * 2500, f1: 1800, q: 6, vol: 0.12 + rnd() * 0.1, a: 0.003 }); } },
};
