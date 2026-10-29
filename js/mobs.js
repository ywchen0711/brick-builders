// 敵人 The things that come for you. Each kind lives somewhere and comes out at some hour:
//   slime 史萊姆 (night, meadows) and red slime 紅史萊姆 (night, tougher) — hop at you
//   bat 蝙蝠 (night, anywhere) — flutters down at you from the air
//   goblin 哥布林 (any hour, the western wood) — a little green brute with a club
//   skeleton 骷髏兵 (night, the north-eastern hills) — slow, hard, a rusty sword
// and two great ones:
//   kingslime 史萊姆王 — comes for the base the first night after it reaches level 3: hops after you, leaps high and
//            lands with a shockwave (its circle shows where), calls up slimes, rolls at you when angry
//   goblinking 哥布林王 — holds the goblins' camp in the wood: a club that smashes (its cone shows where), a charge (its
//            line shows where), a roar that brings goblins
// Every boss blow is shown on the ground first; a bar of his life across the top. They drop what makes 勇者之劍.
import * as THREE from '../lib/three.module.min.js';
import { makeSlime } from './furniture.js';
import { makeFig, plastic, rbox } from './brick/minifig.js';

const angW = (a) => Math.atan2(Math.sin(a), Math.cos(a)), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const MOBS = {
  slime: { zh: '史萊姆', en: 'Slime', hp: 3, dmg: 1, sp: 3.6, night: true, drop: [['slime', 1], ['seed', 0.25]] },
  redslime: { zh: '紅史萊姆', en: 'Red slime', hp: 6, dmg: 2, sp: 4.2, night: true, drop: [['slime', 1], ['slime', 0.6]] },
  bat: { zh: '蝙蝠', en: 'Bat', hp: 2, dmg: 1, sp: 5, night: true, fly: true, drop: [['wing', 1]] },
  goblin: { zh: '哥布林', en: 'Goblin', hp: 6, dmg: 2, sp: 3.4, fig: true, drop: [['hide', 1], ['copper', 0.25]] },
  skeleton: { zh: '骷髏兵', en: 'Skeleton', hp: 9, dmg: 3, sp: 2.6, night: true, fig: true, drop: [['bone', 1], ['iron', 0.3]] },
  kingslime: { zh: '史萊姆王', en: 'King Slime', hp: 70, dmg: 3, sp: 3.2, boss: true, drop: [['crown', 1], ['slime', 1]] },
  goblinking: { zh: '哥布林王', en: 'Goblin King', hp: 90, dmg: 3, sp: 3.4, boss: true, fig: true, drop: [['banner', 1], ['hide', 1]] },
};
export function mobEngine(C) {
  // C: scene, V, VS, B, SOLID, me(), pal(), world { wood, hills, start }, hurt(n, from), give(id, n, at), burst(x,y,z,color,n), fx, SFX, T, lang(), roomCells, banner, toast, popUp, onKill(mob)
  const { scene, VS } = C, V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), gy = (x, z) => C.V.top(Math.floor(x), Math.floor(z));
  const mobs = [];
  // ---------------------------------------------------------------- bodies
  function figBody(kind) {
    const spec = kind === 'goblin' ? { age: 'kid', skinBrick: '#6ab04a', swordBrows: true, colors: { top: '#7a5a32', bottom: '#4a3a24', shoes: '#3a2a18' }, outfit: { top: 'coat', bottom: 'pants' }, hair: { style: 'spiky', color: '#2a3a1a' } }
      : kind === 'skeleton' ? { age: 'adult', skinBrick: '#eeeee4', swordBrows: true, colors: { top: '#e4e4da', bottom: '#d4d4ca', shoes: '#c4c4ba' }, outfit: { top: 'tee', bottom: 'pants' }, hair: { style: 'bald', color: '#eeeee4' } }
      : { age: 'adult', skinBrick: '#4a9a3a', swordBrows: true, colors: { top: '#6a3a1e', bottom: '#3a2a18', shoes: '#2a1a10' }, outfit: { top: 'coat', bottom: 'pants' }, hair: { style: 'spiky', color: '#1a2a12' } };
    const F = makeFig(spec), grip = new THREE.Group(); grip.rotation.x = Math.PI / 2 - 1.05; F.hands[0].add(grip);
    const mk = (g, m, p) => { const o = new THREE.Mesh(g, m); o.castShadow = true; p.add(o); return o; };
    if (kind === 'skeleton') { mk(new THREE.CylinderGeometry(0.6, 0.6, 5, 8), plastic('#5a3a24'), grip).position.y = 1; mk(rbox(1.3, 20, 0.4, 0.2), plastic('#a8988a', { metalness: 0.5 }), grip).position.y = 13; for (const s of [-1, 1]) mk(new THREE.BoxGeometry(1.6, 1.6, 0.4), plastic('#1a1a1a'), F.headP).position.set(s * 1.8, 5.8, 4.9); }
    else { mk(new THREE.CylinderGeometry(1.0, 1.6, 15, 8), plastic('#6a4428'), grip).position.y = 6; for (let i = 0; i < 4; i++) mk(new THREE.ConeGeometry(0.6, 1.8, 6), plastic('#8a8a86'), grip).position.set(Math.cos(i * 1.6) * 1.5, 11 + i, Math.sin(i * 1.6) * 1.5); }
    if (kind === 'goblinking') { const crown = mk(new THREE.CylinderGeometry(5.4, 5.8, 3.2, 16, 1, true), plastic('#e8b830', { metalness: 0.7 }), F.headP); crown.position.y = 10.4; crown.material.side = THREE.DoubleSide; }
    if (kind !== 'skeleton') for (const s of [-1, 1]) { const ear = mk(new THREE.ConeGeometry(1.2, 4, 6), plastic(spec.skinBrick), F.headP); ear.position.set(s * 6.4, 6, 0); ear.rotation.z = -s * 1.2; }
    scene.add(F.root); return F;
  }
  function batBody() { const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: '#3a2a4a', roughness: 0.6 }); const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), m); g.add(b); const wl = new THREE.Group(), wr = new THREE.Group(); for (const [w, s] of [[wl, -1], [wr, 1]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.35), new THREE.MeshStandardMaterial({ color: '#4a3a5a', side: THREE.DoubleSide })); p.position.x = s * 0.32; w.add(p); g.add(w); } for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshBasicMaterial({ color: '#ff4a3a' })); e.position.set(s * 0.08, 0.06, 0.2); g.add(e); } g.userData = { wl, wr, body: b }; scene.add(g); return g; }
  function spawn(kind, x, z, o = {}) {
    const T0 = MOBS[kind], m = { kind, T: T0, x, z, y: gy(x, z), vx: 0, vy: 0, vz: 0, yaw: 0, hp: T0.hp, maxHp: T0.hp, alive: true, hopT: Math.random(), hitT: 0, atkT: 1 + Math.random(), flash: 0, t: 0, ...o };
    if (T0.fig) { m.F = figBody(kind); m.scale = kind === 'goblinking' ? 2.3 : 1; m.F.root.scale.setScalar(m.scale); m.walk = Math.random() * 6; }
    else if (kind === 'bat') { m.g = batBody(); m.g.scale.setScalar(VS * 1.6); m.y += 4; }
    else { m.g = makeSlime(kind === 'redslime' ? '#e04a5a' : kind === 'kingslime' ? '#3a8ae0' : '#3a8ae0'); m.scale = kind === 'kingslime' ? 4.2 : kind === 'redslime' ? 1.6 : 1.3; m.g.scale.setScalar(VS * m.scale); scene.add(m.g);
      if (kind === 'kingslime') { const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.18, 10, 1, true), new THREE.MeshStandardMaterial({ color: '#f0c030', metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide })); cr.position.y = 0.78; m.g.add(cr); for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 5), cr.material); p.position.set(Math.cos(i * 1.256) * 0.24, 0.92, Math.sin(i * 1.256) * 0.24); m.g.add(p); } } }
    m.r = (m.scale || 1) * 0.4; mobs.push(m); return m;
  }
  const remove = (m) => { if (m.F) scene.remove(m.F.root); if (m.g) scene.remove(m.g); };
  // ---------------------------------------------------------------- where and when they come
  const dist = (x, z, p) => Math.hypot(x - p[0], z - p[1]);
  function trySpawn(night) {
    const me = C.me(), a = Math.random() * Math.PI * 2, r = 16 + Math.random() * 16, x = Math.floor(me.x + Math.cos(a) * r), z = Math.floor(me.z + Math.sin(a) * r);
    if (x < 4 || z < 4 || x > 187 || z > 187) return; const y = gy(x, z); if (y <= 13 || C.roomCells.has(x + ',' + y + ',' + z)) return;
    const W = C.world, ground = C.V.get(x, y - 1, z), inWood = dist(x, z, W.wood) < 34, inHills = dist(x, z, W.hills) < 36, nearBase = dist(x, z, [W.start.x, W.start.z]) < 14;
    let kind = null;
    if (inWood && !nearBase && Math.random() < 0.5) kind = 'goblin';
    else if (night) { if (inHills) kind = Math.random() < 0.6 ? 'skeleton' : 'bat'; else if (ground === C.B.GRASS) kind = Math.random() < 0.15 ? 'bat' : Math.random() < 0.2 ? 'redslime' : 'slime'; }
    if (!kind) return; if (MOBS[kind].night && !night) return; spawn(kind, x + 0.5, z + 0.5);
  }
  // ---------------------------------------------------------------- shapes on the ground, before a great blow
  const decals = [];
  function decal(kind, o) {
    const g = new THREE.Group(); g.position.set(o.x * VS, (gy(o.x, o.z) + 0.06) * VS, o.z * VS); g.rotation.y = o.yaw || 0; g.scale.setScalar(VS); scene.add(g);
    const line = new THREE.MeshBasicMaterial({ color: '#ff3a2a', transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }), fill = new THREE.MeshBasicMaterial({ color: '#ff3a2a', transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
    let a, b; if (kind === 'circle') { a = new THREE.Mesh(new THREE.RingGeometry(o.r * 0.92, o.r, 48), line); b = new THREE.Mesh(new THREE.CircleGeometry(o.r, 48), fill); }
    else if (kind === 'cone') { a = new THREE.Mesh(new THREE.RingGeometry(o.r * 0.92, o.r, 32, 1, Math.PI / 2 - o.a, o.a * 2), line); b = new THREE.Mesh(new THREE.CircleGeometry(o.r, 32, Math.PI / 2 - o.a, o.a * 2), fill); }
    else { const gl = new THREE.PlaneGeometry(o.w, o.len); gl.translate(0, o.len / 2, 0); a = new THREE.Mesh(gl, line); a.scale.set(1, 1, 1); a.material.opacity = 0.25; b = new THREE.Mesh(gl.clone(), fill); }
    for (const q of [a, b]) { q.rotation.x = Math.PI / 2; g.add(q); }
    const d = { kind, o, g, b, t: 0, len: o.t, remove() { scene.remove(g); g.traverse((q) => q.geometry?.dispose()); } }; decals.push(d); return d;
  }
  const inside = (kind, o, x, z) => { const dx = x - o.x, dz = z - o.z; if (kind === 'circle') return Math.hypot(dx, dz) < o.r + 0.3; if (kind === 'cone') return Math.hypot(dx, dz) < o.r + 0.3 && Math.abs(angW(Math.atan2(dx, dz) - o.yaw)) < o.a + 0.1; const rx = dx * Math.cos(o.yaw) - dz * Math.sin(o.yaw), rz = dx * Math.sin(o.yaw) + dz * Math.cos(o.yaw); return rz > -0.5 && rz < o.len + 0.5 && Math.abs(rx) < o.w / 2 + 0.3; };
  const waves = [];
  function wave(x, z, r1, dur, dmg) { const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 64), new THREE.MeshBasicMaterial({ color: '#ffb03a', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(x * VS, (gy(x, z) + 0.1) * VS, z * VS); scene.add(m); waves.push({ m, x, z, r1, dur, dmg, t: 0, hit: false }); }
  // ---------------------------------------------------------------- the bosses' turns
  let bossCamp = null;
  function bossThink(m, dt) {
    const me = C.me(), dx = me.x - m.x, dz = me.z - m.z, d = Math.hypot(dx, dz); m.atkT -= dt;
    if (m.atk) { const a = m.atk; a.t += dt; const k = Math.min(1, a.t / a.tele); if (a.dc) { a.dc.t = a.t; a.dc.b.scale.setScalar(Math.max(0.01, a.dc.kind === 'line' ? 1 : k)); if (a.dc.kind === 'line') a.dc.b.scale.set(1, Math.max(0.01, k), 1); }
      a.pose?.(k, a.t - a.tele);
      if (!a.done && a.t >= a.tele) { a.done = true; a.dc?.remove(); a.hit(); }
      if (a.t >= a.tele + a.rec) { m.atk = null; m.atkT = (m.hp < m.maxHp / 2 ? 1.0 : 1.7) + Math.random(); } return true; }
    if (m.atkT > 0) return false;
    const angry = m.hp < m.maxHp / 2;
    if (m.kind === 'kingslime') {
      if (angry && !m.called) { m.called = true; for (let i = 0; i < 4; i++) spawn('slime', m.x + Math.cos(i * 1.57) * 4, m.z + Math.sin(i * 1.57) * 4, { keep: true }); C.banner(C.T('史萊姆王叫來了同伴！', 'King Slime calls his friends!'), '#5aa8ff'); }
      if (d < 14 && Math.random() < 0.6) { const at = { x: me.x, z: me.z }; m.atk = { tele: 1.15, rec: 0.8, t: 0, dc: decal('circle', { ...at, r: 4.2, t: 1.15 }), pose: (k) => { m.leap = k; if (k < 1) { m.x += (at.x - m.x) * Math.min(1, dt * 2.5); m.z += (at.z - m.z) * Math.min(1, dt * 2.5); } }, hit: () => { m.leap = 0; m.x = at.x; m.z = at.z; C.SFX.blast?.(1); C.SFX.thud?.(1.4); C.fx.S.shake = 0.6; if (Math.hypot(me.x - at.x, me.z - at.z) < 4.2) C.hurt(3, m); wave(at.x, at.z, 10, 0.9, 1); C.burst(at.x - 0.5, gy(at.x, at.z), at.z - 0.5, '#5aa8ff', 20); } }; return true; }
      if (angry && d < 18) { const yaw = Math.atan2(dx, dz), o = { x: m.x, z: m.z, yaw, len: 16, w: 3.6 }; m.atk = { tele: 0.9, rec: 0.9, t: 0, dc: decal('line', { ...o, t: 0.9 }), pose: (k, after) => { if (after > 0 && after < 0.6) { m.x += Math.sin(yaw) * 22 * dt; m.z += Math.cos(yaw) * 22 * dt; m.roll = (m.roll || 0) + dt * 20; } }, hit: () => { C.SFX.whirl?.(1); if (inside('line', o, me.x, me.z)) C.hurt(3, m); } }; return true; }
      return false;
    }
    if (m.kind === 'goblinking') {
      if (angry && !m.called) { m.called = true; for (let i = 0; i < 3; i++) spawn('goblin', m.x + Math.cos(i * 2) * 5, m.z + Math.sin(i * 2) * 5, { keep: true }); C.SFX.laugh?.(0.6); C.banner(C.T('哥布林王：「小的們，上！」', 'Goblin King: “At them, lads!”'), '#9ad860'); }
      if (d < 6) { const yaw = m.yaw, o = { x: m.x, z: m.z, r: 6.2, a: 1.0, yaw }; m.atk = { tele: 0.85, rec: 0.7, t: 0, dc: decal('cone', { ...o, t: 0.85 }), pose: (k, after) => { m.armR = after > 0 ? -0.3 : -3.0 * k; m.lean = after > 0 ? 0.4 : -0.2 * k; }, hit: () => { C.SFX.thud?.(1.5); C.SFX.blast?.(0.7); C.fx.S.shake = 0.5; if (inside('cone', o, me.x, me.z)) C.hurt(3, m); C.burst(m.x + Math.sin(yaw) * 3 - 0.5, m.y, m.z + Math.cos(yaw) * 3 - 0.5, '#8a6a4a', 16); } }; return true; }
      if (d < 16) { const yaw = Math.atan2(dx, dz), o = { x: m.x, z: m.z, yaw, len: Math.min(15, d + 3), w: 3 }; m.yaw = yaw; m.atk = { tele: 0.8, rec: 0.9, t: 0, dc: decal('line', { ...o, t: 0.8 }), pose: (k, after) => { m.lean = 0.3; if (after > 0 && after < 0.5) { m.x += Math.sin(yaw) * o.len / 0.5 * dt; m.z += Math.cos(yaw) * o.len / 0.5 * dt; m.walk += dt * 20; } }, hit: () => { C.SFX.swing?.(1.4); if (inside('line', o, me.x, me.z)) C.hurt(3, m); } }; return true; }
      return false;
    }
    return false;
  }
  // ---------------------------------------------------------------- a blow from you (or Heiya): the first of them in reach, in front
  function hitAt(from, yaw, reach, arc, dmg) {
    let best = null, bd = 1e9; for (const m of mobs) { if (!m.alive) continue; const dx = m.x - from.x, dz = m.z - from.z, d = Math.hypot(dx, dz) - m.r; if (d < reach && Math.abs(angW(Math.atan2(dx, dz) - yaw)) < arc && Math.abs(m.y - from.y) < 2.5 + (m.scale || 1)) if (d < bd) { bd = d; best = m; } }
    if (best) damage(best, dmg, from); return best;
  }
  function damage(m, dmg, from) {
    if (!m.alive) return; m.hp -= dmg; m.flash = 0.2; const dx = m.x - from.x, dz = m.z - from.z, l = Math.hypot(dx, dz) || 1, k = m.T.boss ? 0.15 : 1; m.vx = dx / l * 7 * k; m.vz = dz / l * 7 * k; m.vy = 5 * k; C.SFX.hit?.(0.6); C.fx.hitSparks(V3(m.x, m.y + 0.6 * (m.scale || 1), m.z).multiplyScalar(VS), V3(dx / l, 0.5, dz / l)); C.fx.S.shake = Math.max(C.fx.S.shake, m.T.boss ? 0.2 : 0.12);
    C.popUp(String(dmg), V3(m.x, m.y + 1.5 * (m.scale || 1), m.z), '#ffe8a0');
    if (m.hp <= 0) { m.alive = false; C.burst(m.x - 0.5, m.y, m.z - 0.5, m.kind.includes('slime') ? '#5aa8ff' : '#c8b8a0', m.T.boss ? 60 : 18); for (const [id, p] of m.T.drop) if (Math.random() < p || p >= 1) C.give(id, p > 1 ? p : 1, V3(m.x, m.y + 0.6, m.z)); C.onKill(m); if (m.atk?.dc) m.atk.dc.remove(); }
  }
  // ---------------------------------------------------------------- each moment
  const bar = document.createElement('div'); bar.style.cssText = 'position:fixed;left:50%;top:10px;transform:translateX(-50%);width:min(460px,70vw);z-index:6;display:none;text-align:center;font-weight:900;text-shadow:0 1px 4px #000'; bar.innerHTML = '<div id="bossN"></div><div style="height:12px;background:rgba(0,0,0,.55);border:2px solid #ffd84a;border-radius:6px;overflow:hidden;margin-top:3px"><i id="bossHp" style="display:block;height:100%;background:linear-gradient(#ff6a5a,#c8141e)"></i></div>'; document.body.appendChild(bar);
  function step(dt, night) {
    const me = C.me(); if (mobs.filter((m) => m.alive && !m.T.boss).length < (night ? 8 : 3) && Math.random() < dt * (night ? 0.4 : 0.12)) trySpawn(night);
    // the goblins' camp: the king waits there until you come near
    if (bossCamp && !bossCamp.awake && Math.hypot(me.x - bossCamp.x, me.z - bossCamp.z) < 16) { bossCamp.awake = true; C.banner(C.T('哥布林王', 'The Goblin King'), '#9ad860', C.T('頭目戰', 'Boss battle')); C.SFX.gong?.(1); }
    let boss = null;
    for (const m of mobs) {
      if (!m.alive) { if (m.F) { m.F.root.scale.multiplyScalar(0.88); if (m.F.root.scale.x < 0.03) remove(m); } else if (m.g) { m.g.scale.multiplyScalar(0.85); if (m.g.scale.x < 0.01) remove(m); } continue; }
      m.t += dt; m.hitT -= dt; const T0 = m.T, dx = me.x - m.x, dz = me.z - m.z, d = Math.hypot(dx, dz);
      if (T0.night && !night && !T0.boss && !m.keep && Math.random() < dt * 0.15) { m.alive = false; continue; } // they melt away by day
      if (d > 70 && !T0.boss) { m.alive = false; remove(m); continue; }
      if (T0.boss) { if (m.kind === 'goblinking' && !m.awake) { m.yaw += dt * 0.3; poseFig(m, 0); continue; } boss = m; }
      const busy = T0.boss && bossThink(m, dt), chase = d < (T0.boss ? 40 : 14) && C.alive();
      const g0 = gy(m.x, m.z);
      if (T0.fly) { const ty = chase ? me.y + 1.5 + Math.sin(m.t * 3) * 0.8 : g0 + 4 + Math.sin(m.t) * 1.5, a = chase ? Math.atan2(dx, dz) + Math.sin(m.t * 2) * 0.8 : m.t * 0.7; m.yaw = a; m.x += Math.sin(a) * T0.sp * dt; m.z += Math.cos(a) * T0.sp * dt; m.y += (ty - m.y) * Math.min(1, dt * 2); }
      else if (T0.fig) { if (!busy) { const sp = chase ? T0.sp : 1.2; if (chase) m.yaw += angW(Math.atan2(dx, dz) - m.yaw) * Math.min(1, dt * 6); else if (m.t % 4 < dt) m.yaw = Math.random() * 6.28; if (d > (T0.boss ? 4.5 : 1.3) || !chase) { const nx = m.x + Math.sin(m.yaw) * sp * dt, nz = m.z + Math.cos(m.yaw) * sp * dt; if (Math.abs(gy(nx, nz) - m.y) <= 1.1) { m.x = nx; m.z = nz; m.walk += sp * dt * 2.4; } } } }
      else if (!busy || m.kind === 'kingslime') { if (m.y <= g0 + 0.01 && (m.hopT -= dt) <= 0 && !busy) { m.hopT = (T0.boss ? 1.1 : 0.7) + Math.random() * 0.5; const a = chase ? Math.atan2(dx, dz) : Math.random() * 6.28; m.yaw = a; const sp = chase ? T0.sp : 1.5; m.vx = Math.sin(a) * sp; m.vz = Math.cos(a) * sp; m.vy = T0.boss ? 8 : 6.5; } }
      if (!T0.fly) { if (m.y > g0) m.vy -= 26 * dt; m.y += m.vy * dt; if (m.y <= g0) { m.y = g0; m.vy = 0; m.vx *= 0.8; m.vz *= 0.8; } const nx = m.x + m.vx * dt, nz = m.z + m.vz * dt; if (Math.abs(gy(nx, nz) - m.y) <= 1.2 && !C.roomCells.has(Math.floor(nx) + ',' + Math.floor(m.y) + ',' + Math.floor(nz))) { m.x = nx; m.z = nz; } else { m.vx *= -0.5; m.vz *= -0.5; } }
      if (m.leap) m.y = g0 + Math.sin(m.leap * Math.PI) * 9;
      // a touch (or a swing) hurts you
      if (!T0.boss && T0.fig && d < 1.6 && chase && (m.atkT -= dt) <= 0) { m.atkT = 1.4; m.swing = 0.35; setTimeout(() => { if (m.alive && Math.hypot(C.me().x - m.x, C.me().z - m.z) < 1.9) C.hurt(T0.dmg, m); }, 220); }
      else if (!T0.fig && d < m.r + 0.6 && Math.abs(me.y - m.y) < 1.2 + (m.scale || 1) * 0.5 && m.hitT <= 0) { m.hitT = 1.2; C.hurt(T0.dmg, m); }
      // drawn
      if (T0.fig) poseFig(m, dt); else if (m.kind === 'bat') { m.g.position.set(m.x * VS, m.y * VS, m.z * VS); m.g.rotation.y = m.yaw; const f = Math.sin(m.t * 22) * 0.9; m.g.userData.wl.rotation.z = f; m.g.userData.wr.rotation.z = -f; }
      else { const sq = m.y === g0 ? 1 - Math.max(0, m.hopT - (T0.boss ? 0.9 : 0.55)) * 0.6 : 1.1; m.g.position.set(m.x * VS, m.y * VS, m.z * VS); m.g.rotation.y = m.yaw; m.g.rotation.x = m.roll ? Math.sin(m.roll) * 0.3 : 0; m.g.children[0].scale.set(1 / sq * 0.9 + 0.1, 0.8 * sq, 1 / sq * 0.9 + 0.1); }
      const em = m.flash > 0 ? (m.flash -= dt, m.flash * 5) : 0; (m.F ? m.F.root : m.g).traverse((o) => { if (o.material?.emissive && o.material.emissive.r !== em) o.material.emissive.setRGB(em, em, em); });
    }
    for (let i = mobs.length - 1; i >= 0; i--) { const m = mobs[i]; if (!m.alive && (!m.F || m.F.root.scale.x < 0.03) && (!m.g || m.g.scale.x < 0.01)) mobs.splice(i, 1); }
    for (let i = waves.length - 1; i >= 0; i--) { const w = waves[i]; w.t += dt; const k = w.t / w.dur, r = 1 + (w.r1 - 1) * k; w.m.scale.setScalar(r * VS); w.m.material.opacity = 0.9 * (1 - k); const dd = Math.hypot(me.x - w.x, me.z - w.z); if (!w.hit && dd > r * 0.82 - 0.4 && dd < r + 0.4 && me.y - gy(me.x, me.z) < 1.1) { w.hit = true; C.hurt(w.dmg, { x: w.x, z: w.z }); } if (k >= 1) { scene.remove(w.m); waves.splice(i, 1); } }
    for (let i = decals.length - 1; i >= 0; i--) if (!decals[i].g.parent) decals.splice(i, 1);
    if (boss) { bar.style.display = 'block'; document.getElementById('bossN').textContent = boss.T[C.lang()]; document.getElementById('bossHp').style.width = Math.max(0, boss.hp / boss.maxHp * 100) + '%'; } else bar.style.display = 'none';
  }
  function poseFig(m, dt) {
    const s = Math.sin(m.walk || 0), sw = m.swing > 0 ? (m.swing -= dt, Math.sin((0.35 - m.swing) / 0.35 * Math.PI)) : 0;
    m.F.pose({ x: m.x * VS, y: m.y * VS, z: m.z * VS, yaw: m.yaw, tilt: (m.lean || 0) * 0.6 + sw * 0.25, roll: 0, hipR: s * 0.6, hipL: -s * 0.6, armR: m.armR ?? (-0.3 - sw * 2.4 - s * 0.4), armL: -0.2 + s * 0.4, outR: 0.1, outL: 0.1, wristR: 0, wristL: 0, head: 0 });
    m.F.face({ browIn: 1, mouth: { open: sw * 0.6, smile: -0.3 } }); if (m.atk == null) { m.armR = undefined; m.lean = 0; }
  }
  return {
    list: mobs, step, hitAt, spawn, damage,
    // the first night after the base reaches level 3, the King Slime comes for it
    kingSlime() { const W = C.world, a = Math.random() * 6.28; const m = spawn('kingslime', W.start.x + Math.cos(a) * 22, W.start.z + Math.sin(a) * 22); C.banner(C.T('史萊姆王來襲！', 'King Slime attacks!'), '#5aa8ff', C.T('保護基地！', 'Defend the base!')); C.SFX.gong?.(1); return m; },
    // the goblins' camp in the wood, its king waiting
    camp(x, z) { bossCamp = spawn('goblinking', x, z); bossCamp.awake = false; return bossCamp; },
    clearNight() { for (const m of mobs) if (m.T.night && !m.T.boss) m.alive = false; },
    bossOn: () => mobs.some((m) => m.alive && m.T.boss && (m.kind !== 'goblinking' || m.awake)),
  };
}
