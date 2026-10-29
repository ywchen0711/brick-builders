// The effects of a move: the crescent of sword qi (a glowing, tapering crescent standing upright, with ghosts of
// itself trailing behind and a light that goes with it), the blade's light through the cut, sparks, the wind that
// turns round the feet while he gathers his qi, the ring that goes out along the floor, and the cut it leaves.
import * as THREE from '../lib/three.module.min.js';

const add = (o) => { o.renderOrder = 10; return o; };
// a crescent in the y-z plane, bowing forward (+z), tapering to points at both ends; uv.x runs along it
function crescentGeo(h = 1.0, thick = 0.16, side = 0.05, nu = 48, nv = 12) {
  const R = h * 0.95, a0 = Math.asin(Math.min(0.99, h / 2 / R)) * 1.25, pos = [], uv = [], idx = [];
  for (let i = 0; i <= nu; i++) {
    const u = i / nu, a = -a0 + 2 * a0 * u, taper = Math.pow(Math.sin(Math.PI * u), 0.8);
    const cy = Math.sin(a) * R, cz = Math.cos(a) * R - R, ny = Math.sin(a), nz = Math.cos(a);
    for (let j = 0; j <= nv; j++) {
      const th = j / nv * Math.PI * 2, r = Math.cos(th) * thick * taper, s = Math.sin(th) * side * taper, back = (1 - Math.cos(th)) * 0.5 * thick * 0.9 * taper; // a crescent: the back edge drawn in
      pos.push(s, cy + ny * (r - back), cz + nz * (r - back)); uv.push(u, j / nv);
    }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const qiMat = (core, edge, k = 1) => new THREE.ShaderMaterial({
  uniforms: { uA: { value: 0 }, uCore: { value: new THREE.Color(core) }, uEdge: { value: new THREE.Color(edge) }, uK: { value: k }, uT: { value: 0 } },
  vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform float uA, uK, uT; uniform vec3 uCore, uEdge; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){ float f = 1.0 - abs(dot(vN, vV)); float tp = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
      float flick = 0.85 + 0.15 * sin(vUv.x * 40.0 - uT * 30.0);
      vec3 c = mix(uCore * 1.5, uEdge * 1.0, pow(f, 0.7)) * flick; float a = uA * tp * mix(0.9, 0.25, f) * uK; gl_FragColor = vec4(c * a, a); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
});
let dot = null; function dotTex() { if (dot) return dot; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,0.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); dot = new THREE.CanvasTexture(c); return dot; }

export function makeFX(scene) {
  const root = new THREE.Group(); scene.add(root);
  // ---- the crescent, its outer glow, its ghosts, its light
  const wave = new THREE.Group(); root.add(wave); wave.visible = false;
  const core = add(new THREE.Mesh(crescentGeo(1, 0.15, 0.05), qiMat('#e8fbff', '#3ab8ff'))), glow = add(new THREE.Mesh(crescentGeo(1, 0.34, 0.12), qiMat('#9ae8ff', '#1a6aff', 0.22)));
  wave.add(core, glow);
  const ghosts = []; for (let i = 0; i < 6; i++) { const m = add(new THREE.Mesh(crescentGeo(1, 0.2, 0.07), qiMat('#bff2ff', '#2a8aff', 0.35))); root.add(m); m.visible = false; ghosts.push(m); }
  const wl = new THREE.PointLight('#6ad0ff', 0, 7, 1.6); wave.add(wl); wl.position.set(0, 0, 0.2);
  const bl = new THREE.PointLight('#6ad0ff', 0, 4, 1.8); root.add(bl); // the blade's light
  // ---- sparks and motes, one cloud of points
  const NP = 600, pp = new Float32Array(NP * 3), pc = new Float32Array(NP * 3), P = [];
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pc, 3));
  const pts = add(new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.07, map: dotTex(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))); pts.frustumCulled = false; root.add(pts);
  const spark = (p, v, life, col = [0.6, 0.9, 1.3], drag = 1.5, grav = 0, to = null) => { if (P.length < NP) P.push({ p: p.clone(), v: v.clone(), life, l0: life, col, drag, grav, to }); };
  // ---- the blade's light through the cut: a ribbon from the last positions of the blade's base and tip
  const NT = 22, tg = new THREE.BufferGeometry(), tpos = new Float32Array(NT * 2 * 3), tcol = new Float32Array(NT * 2 * 3), ti = [];
  for (let i = 0; i < NT - 1; i++) { const a = i * 2; ti.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  tg.setAttribute('position', new THREE.BufferAttribute(tpos, 3)); tg.setAttribute('color', new THREE.BufferAttribute(tcol, 3)); tg.setIndex(ti);
  const trail = add(new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }))); trail.frustumCulled = false; root.add(trail);
  const samples = [];
  // ---- the wind round his feet, the ring along the floor, the cut in the floor
  const winds = []; for (let i = 0; i < 3; i++) { const m = add(new THREE.Mesh(new THREE.TorusGeometry(0.55 + i * 0.18, 0.012, 6, 64, Math.PI * 1.3), new THREE.MeshBasicMaterial({ color: '#8adcff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))); m.rotation.x = Math.PI / 2; root.add(m); winds.push(m); }
  const ring = add(new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 64), new THREE.MeshBasicMaterial({ color: '#8adcff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; root.add(ring);
  const scarGlow = add(new THREE.Mesh(new THREE.PlaneGeometry(0.09, 1), new THREE.MeshBasicMaterial({ color: '#7ad8ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })));
  const scar = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 1), new THREE.MeshBasicMaterial({ color: '#0a0c10', transparent: true, opacity: 0, depthWrite: false }));
  for (const m of [scar, scarGlow]) { m.rotation.x = -Math.PI / 2; m.position.y = 0.065; m.visible = false; root.add(m); }

  // the burst where two blows meet: a ball of light that swells and fades
  const burst = add(new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: '#fff2d0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))); burst.visible = false; root.add(burst);
  const S = { wave: null, ring: null, shake: 0, burst: null };
  return {
    S,
    reset() { core.scale.set(1, 1, 1); glow.scale.set(1, 1, 1); burst.visible = false; S.burst = null; wave.visible = false; ghosts.forEach((g) => (g.visible = false)); S.wave = null; scar.visible = scarGlow.visible = false; P.length = 0; samples.length = 0; S.ring = null; },
    // the crescent sets off from a point, along a direction on the floor
    launch(from, dir) {
      S.wave = { p: from.clone(), d: dir.clone().setY(0).normalize(), age: 0, from: from.clone(), hist: [] };
      wave.visible = true; wave.lookAt(from.clone().add(S.wave.d)); wave.position.copy(from);
      S.ring = { p: new THREE.Vector3(from.x, 0, from.z), age: 0 }; S.shake = Math.max(S.shake, 0.22);
      scar.visible = scarGlow.visible = true; for (let i = 0; i < 40; i++) spark(from, new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.2) * 4).addScaledVector(dir, 2), 0.4 + Math.random() * 0.4, [0.7, 1.0, 1.4], 2.5, 3);
    },
    // each frame: where the blade is, how bright, whether the qi is being drawn in, whether the cut is on
    update(dt, t, o) {
      const { tip, base, glow: gk, gather, cutting, feet } = o, tint = o.tint || [0.4, 0.8, 1.2];
      bl.color.setRGB(Math.min(1, tint[0]), Math.min(1, tint[1]), Math.min(1, tint[2])); winds.forEach((w) => w.material.color.setRGB(Math.min(1, tint[0] * 0.9), Math.min(1, tint[1] * 0.9), Math.min(1, tint[2] * 0.9)));
      // the blade's light
      bl.position.copy(tip); bl.intensity = gk * 2.5;
      // the qi drawn in: motes from all round, pulled onto the blade; the wind turning
      if (gather > 0) for (let i = 0; i < 3; i++) { const a = Math.random() * 6.28, r = 1.2 + Math.random() * 1.2, p = new THREE.Vector3(feet.x + Math.cos(a) * r, 0.1 + Math.random() * 1.6, feet.z + Math.sin(a) * r); spark(p, new THREE.Vector3(), 0.5 + Math.random() * 0.3, tint, 0, 0, Math.random() < 0.6 ? 'tip' : 'base'); }
      winds.forEach((w, i) => { w.position.set(feet.x, 0.12 + i * 0.22, feet.z); w.rotation.z += dt * (3 + i * 1.5) * (i % 2 ? -1 : 1); w.material.opacity = gather * (0.5 - i * 0.1); w.scale.setScalar(1 - gather * 0.15 + Math.sin(t * 7 + i) * 0.03); });
      // the trail
      if (cutting) samples.unshift([base.clone(), tip.clone(), 1]); for (const s of samples) s[2] -= dt * 5; while (samples.length > NT || (samples.length && samples[samples.length - 1][2] <= 0)) samples.pop();
      for (let i = 0; i < NT; i++) { const s = samples[Math.min(i, samples.length - 1)], k = s ? Math.max(0, s[2]) * (1 - i / NT) : 0; const b = s ? s[0] : tip, e = s ? s[1] : tip; tpos.set([b.x, b.y, b.z, e.x, e.y, e.z], i * 6); tcol.set([0.05 * k, 0.22 * k, 0.45 * k, 0.55 * k, 0.8 * k, 1.0 * k], i * 6); }
      tg.attributes.position.needsUpdate = tg.attributes.color.needsUpdate = true; trail.visible = samples.length > 1;
      // the crescent
      const W = S.wave;
      if (W) {
        W.age += dt; const sp = 10.5 * (1 - Math.min(0.3, W.age * 0.15)); W.p.addScaledVector(W.d, sp * dt);
        const life = 1.5, k = Math.min(1, W.age / 0.05) * Math.max(0, 1 - Math.max(0, W.age - (life - 0.4)) / 0.4), h = 1.1 + W.age * 0.9;
        wave.position.copy(W.p); wave.scale.setScalar(h); core.material.uniforms.uA.value = k; glow.material.uniforms.uA.value = k; core.material.uniforms.uT.value = glow.material.uniforms.uT.value = t; wl.intensity = 7 * k;
        W.hist.unshift([W.p.clone(), h]); if (W.hist.length > 30) W.hist.pop();
        ghosts.forEach((g, i) => { const hh = W.hist[(i + 1) * 3]; g.visible = !!hh && k > 0; if (hh) { g.position.copy(hh[0]); g.quaternion.copy(wave.quaternion); g.scale.setScalar(hh[1]); g.material.uniforms.uA.value = k * (0.5 - i * 0.075); } });
        // sparks streaming off it, dust thrown up from the floor under it
        for (let i = 0; i < 4; i++) { const y = (Math.random() - 0.5) * h * 0.9, p = W.p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.08, y, 0)); if (p.y < 0.02) continue; spark(p, W.d.clone().multiplyScalar(-1.5 - Math.random() * 2).add(new THREE.Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.3), 0)), 0.35 + Math.random() * 0.25, [0.5, 0.9, 1.4], 2); }
        if (Math.random() < 0.8) spark(new THREE.Vector3(W.p.x, 0.05, W.p.z), new THREE.Vector3((Math.random() - 0.5) * 2, 1 + Math.random() * 2, 0).addScaledVector(W.d, -1), 0.5, [0.5, 0.45, 0.4], 1.5, 4);
        // the cut it leaves in the floor
        const len = W.p.clone().setY(0).distanceTo(W.from.clone().setY(0)), mid = W.from.clone().lerp(W.p, 0.5);
        for (const m of [scar, scarGlow]) { m.position.set(mid.x, 0.065, mid.z); m.scale.set(1, Math.max(0.01, len), 1); m.rotation.z = Math.atan2(-W.d.x, -W.d.z) + Math.PI; }
        scar.material.opacity = 0.7; scarGlow.material.opacity = Math.max(0, 1 - W.age / 2.2) * 0.9;
        if (W.age > life) { wave.visible = false; ghosts.forEach((g) => (g.visible = false)); wl.intensity = 0; if (W.age > 2.4) S.wave = null; }
      }
      if (!S.wave && scarGlow.visible) scarGlow.material.opacity = 0;
      // the ring along the floor
      if (S.ring) { S.ring.age += dt; const a = S.ring.age; ring.position.set(S.ring.p.x, 0.06, S.ring.p.z); ring.scale.setScalar((0.3 + a * 5) * (S.ring.size || 1)); ring.material.opacity = Math.max(0, 1 - a / 0.5) * 0.9; if (a > 0.5) S.ring = null; } else ring.material.opacity = 0;
      // the points
      for (let i = P.length - 1; i >= 0; i--) {
        const q = P[i]; q.life -= dt; if (q.life <= 0) { P.splice(i, 1); continue; }
        if (q.to) { const goal = q.to === 'tip' ? tip : tip.clone().lerp(base, 0.5); q.v.lerp(goal.clone().sub(q.p).multiplyScalar(4), Math.min(1, dt * 6)); if (q.p.distanceTo(goal) < 0.08) q.life = Math.min(q.life, 0.05); }
        q.v.multiplyScalar(Math.max(0, 1 - q.drag * dt)); q.v.y -= q.grav * dt; q.p.addScaledVector(q.v, dt); if (q.p.y < 0.02) { q.p.y = 0.02; q.v.y *= -0.3; }
      }
      for (let i = 0; i < NP; i++) { const q = P[i]; if (!q) { pc[i * 3] = pc[i * 3 + 1] = pc[i * 3 + 2] = 0; continue; } const k = Math.min(1, q.life / q.l0 * 1.5); pp.set([q.p.x, q.p.y, q.p.z], i * 3); pc.set([q.col[0] * k, q.col[1] * k, q.col[2] * k], i * 3); }
      pg.attributes.position.needsUpdate = pg.attributes.color.needsUpdate = true;
      if (S.burst) { const b = S.burst; b.age += dt; burst.visible = true; burst.position.copy(b.p); burst.scale.setScalar(0.2 + b.age * 4 * b.k); burst.material.opacity = Math.max(0, 1 - b.age / 0.35); if (b.age > 0.35) { S.burst = null; burst.visible = false; } }
      if (S.wave?.shrink) { const s = S.wave.shrink; core.scale.set(1, 1, 1).multiplyScalar(s); glow.scale.set(1, 1, 1).multiplyScalar(s); }
      S.shake = Math.max(0, S.shake - dt * 0.9);
    },
    clashBurst(p, k = 1) { S.burst = { p: p.clone(), age: 0, k }; for (let i = 0; i < 120; i++) { const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize().multiplyScalar(3 + Math.random() * 6); spark(p, v, 0.5 + Math.random() * 0.6, [[1.5, 1.3, 0.8], [0.6, 1.1, 1.6], [0.7, 1.4, 1.0]][i % 3], 2, 3); } S.ring = { p: new THREE.Vector3(p.x, 0, p.z), age: 0, size: 1.6 }; },
    // the crescent broken where it was met: gone in a shower of light
    breakWave() { const W = S.wave; if (!W) return; for (let i = 0; i < 50; i++) spark(W.p.clone().add(new THREE.Vector3(0, (Math.random() - 0.5) * 1.2, 0)), new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4), 0.5 + Math.random() * 0.4, [0.6, 1.0, 1.5], 2, 2); W.age = Math.max(W.age, 1.5); },
    hitSparks(p, d, kind) { S.shake = Math.max(S.shake, 0.3); const wind = kind === 'wind'; for (let i = 0; i < 60; i++) spark(p.clone().add(new THREE.Vector3(0, (Math.random() - 0.5) * (wind ? 0.6 : 1.4), 0)), new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4, (Math.random() - 0.3) * 3).addScaledVector(d, 3), 0.4 + Math.random() * 0.5, wind ? (Math.random() < 0.5 ? [0.6, 0.55, 0.45] : [0.7, 1.3, 1.0]) : Math.random() < 0.5 ? [1.4, 1.1, 0.6] : [0.6, 1.0, 1.5], 2, 5); },
    // a mote of dust, wind or light, for any move to throw about
    puff: (p, v, life, col, drag = 1.5, grav = 0) => spark(p, v, life, col, drag, grav),
    // a ring going out along the floor
    ringAt(p, size = 1) { S.ring = { p: new THREE.Vector3(p.x, 0, p.z), age: 0, size }; },
  };
}
