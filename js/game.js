// 積木建造家 Brick Builders — wake on Empty Isle with a hammer and a friend, and build a village out of it, brick by
// brick: break the land into what it is made of, make things at a workbench, wall in rooms (walls two high and a
// door) and furnish them (a bed makes a bedroom, a pot and a table a kitchen...), and the hearts the rooms bring raise
// your base, bringing villagers who live there, ask things of you and are happy when you build them a home. Farm by
// day; at night slimes come out of the dark, and Heiya fights them with you. Positions are in bricks (VS world units).
import * as THREE from '../lib/three.module.min.js';
import { VS, B, SOLID } from './voxel.js';
import { buildWorld, W as WW, D as DD, WL } from './worldgen.js';
import { ITEMS, DROP, RECIPES, ROOMS, LEVELS, VILLAGERS, STEPS } from './items.js';
import { makeFurn, FURN_SOLID, makeCrop, makeSlime } from './furniture.js';
import { makeFig } from './brick/minifig.js';
import { BUILDER, HEIYA } from './cast/builders.js';
import { makeFX } from './fx.js';
import { SFX, wake } from './sound.js';
import { music } from './music.js';

const $ = (id) => document.getElementById(id), q = new URLSearchParams(location.search);
let lang = (() => { try { return localStorage.getItem('builders.lang') || 'zh'; } catch (e) { return 'zh'; } })();
const T = (zh, en) => (lang === 'zh' ? zh : en), N = (o) => (o ? o[lang] || o.zh : '');
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), angWrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const ease = { in: (u) => u * u * u, out: (u) => 1 - (1 - u) ** 3, smooth: (u) => u * u * (3 - 2 * u) };
const DEF = { armR: -0.2, armL: -0.2, outR: 0, outL: 0, hipR: 0, hipL: 0, tilt: 0, roll: 0, yaw: 0, head: 0, fwd: 0, y: 0, wristR: 0, wristL: 0 };
function keyPose(K, t) { let i = 0; while (i < K.length - 2 && t >= K[i + 1].t) i++; const a = K[i], b = K[i + 1], u = clamp((t - a.t) / (b.t - a.t), 0, 1), e = (ease[b.ease] || ease.smooth)(u), p = {}; for (const k of Object.keys(DEF)) p[k] = (a.p[k] ?? DEF[k]) + ((b.p[k] ?? DEF[k]) - (a.p[k] ?? DEF[k])) * e; return p; }

// ---------------------------------------------------------------- the picture, the sky, the hours
const cv = $('cv'), R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.toneMapping = THREE.ACESFilmicToneMapping; R.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 300); scene.fog = new THREE.Fog('#a8c0d6', 40, 130);
const sky = new THREE.Mesh(new THREE.SphereGeometry(250, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sun: { value: V3(0, 1, 0) }, glow: { value: new THREE.Color() }, stars: { value: 0 } },
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 top, hor, sun, glow; uniform float stars; varying vec3 vD; float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); } void main(){ float y = max(vD.y, -0.1); vec3 c = mix(hor, top, smoothstep(0.0, 0.55, y)); float s = max(0.0, dot(vD, sun)); c += glow * (pow(s, 60.0) * 2.0 + pow(s, 6.0) * 0.25); if (stars > 0.0) { vec3 q = floor(vD * 300.0); c += vec3(step(0.997, h(q))) * stars * smoothstep(0.05, 0.4, y); } gl_FragColor = vec4(c, 1.0); }' }));
sky.renderOrder = -1; scene.add(sky);
const hemi = new THREE.HemisphereLight('#c4d8f0', '#6a5a48', 1.2), sun = new THREE.DirectionalLight('#fff0d8', 2.6); scene.add(hemi, sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 120 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
function resize() { R.setPixelRatio(Math.min(1.75, devicePixelRatio || 1)); R.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const HOURS = [[0.0, { top: '#060a1c', hor: '#22345e', glow: '#c8d8ff', sun: '#9ab4f0', sunI: 1.1, sky: '#5a6aa8', gr: '#2a2430', hemi: 1.0, fog: '#141c38', exp: 1.3, stars: 1 }], [0.22, { top: '#26345e', hor: '#f6b48e', glow: '#ffb080', sun: '#ffc49a', sunI: 1.8, sky: '#b0b6e0', gr: '#5a4a40', hemi: 1.1, fog: '#8a7a8e', exp: 1.05, stars: 0 }], [0.32, { top: '#2a64b8', hor: '#cfe2ee', glow: '#fff4d8', sun: '#fff0d8', sunI: 2.8, sky: '#c4d8f0', gr: '#6a5a48', hemi: 1.3, fog: '#a8c0d6', exp: 1.0, stars: 0 }], [0.68, { top: '#2a64b8', hor: '#cfe2ee', glow: '#fff4d8', sun: '#fff0d8', sunI: 2.8, sky: '#c4d8f0', gr: '#6a5a48', hemi: 1.3, fog: '#a8c0d6', exp: 1.0, stars: 0 }], [0.78, { top: '#1e2a4a', hor: '#f09a62', glow: '#ffa050', sun: '#ffb07a', sunI: 2.3, sky: '#aab4e8', gr: '#5a4a40', hemi: 1.3, fog: '#5a4a62', exp: 1.05, stars: 0 }], [0.88, { top: '#060a1c', hor: '#22345e', glow: '#c8d8ff', sun: '#9ab4f0', sunI: 1.1, sky: '#5a6aa8', gr: '#2a2430', hemi: 1.0, fog: '#141c38', exp: 1.3, stars: 1 }], [1.0, { top: '#060a1c', hor: '#22345e', glow: '#c8d8ff', sun: '#9ab4f0', sunI: 1.1, sky: '#5a6aa8', gr: '#2a2430', hemi: 1.0, fog: '#141c38', exp: 1.3, stars: 1 }]];
const ca = new THREE.Color(), cb = new THREE.Color();
function lightHour(tod, at) {
  let i = 0; while (i < HOURS.length - 2 && tod >= HOURS[i + 1][0]) i++; const [t0, a] = HOURS[i], [t1, b] = HOURS[i + 1], u = clamp((tod - t0) / (t1 - t0), 0, 1);
  const mix = (k) => ca.set(a[k]).lerp(cb.set(b[k]), u).clone(), num = (k) => a[k] + (b[k] - a[k]) * u, U = sky.material.uniforms;
  U.top.value.copy(mix('top')); U.hor.value.copy(mix('hor')); U.glow.value.copy(mix('glow')); U.stars.value = num('stars');
  const tq = Math.round(tod * 240) / 240, ang = (tq - 0.25) * Math.PI * 2, dir = tod > 0.22 && tod < 0.8 ? V3(Math.cos(ang) * 0.8, Math.max(0.12, Math.sin(ang)), 0.45).normalize() : V3(-0.3, 0.6, 0.5).normalize(); U.sun.value.copy(dir);
  sun.color.copy(mix('sun')); sun.intensity = num('sunI'); hemi.color.copy(mix('sky')); hemi.groundColor.copy(mix('gr')); hemi.intensity = num('hemi'); scene.fog.color.copy(mix('fog')); R.toneMappingExposure = num('exp');
  const texel = 52 / 2048, bx = V3().crossVectors(dir, V3(0, 1, 0)).normalize(), by = V3().crossVectors(bx, dir).normalize(), snap = bx.clone().multiplyScalar(Math.round(at.dot(bx) / texel) * texel).addScaledVector(by, Math.round(at.dot(by) / texel) * texel).addScaledVector(dir, at.dot(dir));
  sun.position.copy(snap).addScaledVector(dir, 50); sun.target.position.copy(snap); return num('stars') > 0.5;
}

// ---------------------------------------------------------------- the save: what you carry, what you changed, who lives here
const KEY = 'builders.save';
const S = (() => { const fresh = { v: 1, inv: {}, got: {}, hot: [null, null, null, null, null, null, null, null], sel: 0, edits: {}, furn: {}, crops: {}, rooms: {}, awarded: {}, happy: 0, level: 1, villagers: [], quests: {}, step: 0, placed: {}, stats: { cabbage: 0, slimes: 0, sown: 0 }, pos: null, tod: 0.3, hp: 10 };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.v === 1 && !q.has('new')) return { ...fresh, ...s, stats: { ...fresh.stats, ...s.stats } }; } catch (e) { /* a fresh start */ } return fresh; })();
const save = () => { try { S.tod = tod; S.pos = { x: me.x, y: me.y, z: me.z }; S.hp = player.hp; localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* full */ } };

// ---------------------------------------------------------------- the island, with your changes on it
const Wd = buildWorld(7), V = Wd.V;
for (const [i, b] of Object.entries(S.edits)) V.a[+i] = b;
V.mesh(scene, (k) => { $('loadbar').style.width = (30 + k * 70) + '%'; });
const fx = makeFX(scene);
const idx = (x, y, z) => (y * DD + z) * WW + x, inWorld = (x, y, z) => x >= 0 && z >= 0 && y >= 0 && x < WW && z < DD && y < 56;
function setBlock(x, y, z, b) { V.set(x, y, z, b); S.edits[idx(x, y, z)] = b; V.touch(x, z); V.flush(); roomsDirty = 0.25; }
// ---- furniture and crops, each in a cell
const furn = new Map(), crops = new Map(), ck = (x, y, z) => x + ',' + y + ',' + z;
function addFurn(x, y, z, type, rot, fromSave) {
  const g = makeFurn(type); g.scale.setScalar(VS); g.position.set((x + 0.5) * VS, y * VS, (z + 0.5) * VS); g.rotation.y = rot * Math.PI / 2; scene.add(g);
  const f = { x, y, z, type, rot, g }; if (g.userData.light) { f.light = new THREE.PointLight(g.userData.light, 0, 6, 1.6); f.light.position.set(0, 0.9 * VS, 0); g.add(f.light); }
  furn.set(ck(x, y, z), f); if (type === 'door') furn.set(ck(x, y + 1, z), { ...f, upper: true, base: f }); if (!fromSave) { S.furn[ck(x, y, z)] = { type, rot }; roomsDirty = 0.25; } return f;
}
function removeFurn(f) { const b = f.base || f; scene.remove(b.g); furn.delete(ck(b.x, b.y, b.z)); if (b.type === 'door') furn.delete(ck(b.x, b.y + 1, b.z)); delete S.furn[ck(b.x, b.y, b.z)]; roomsDirty = 0.25; return b; }
for (const [k, v] of Object.entries(S.furn)) { const [x, y, z] = k.split(',').map(Number); addFurn(x, y, z, v.type, v.rot, true); }
function addCrop(x, y, z, t0, fromSave) { const c = { x, y, z, t0, stage: -1, g: null }; crops.set(ck(x, y, z), c); if (!fromSave) S.crops[ck(x, y, z)] = t0; growCrop(c); return c; }
const GROW = 70; // seconds a stage
function growCrop(c) { const st = Math.min(2, Math.floor((Date.now() - c.t0) / 1000 / GROW)); if (st === c.stage) return; c.stage = st; if (c.g) scene.remove(c.g); c.g = makeCrop(st); c.g.scale.setScalar(VS); c.g.position.set((c.x + 0.5) * VS, c.y * VS, (c.z + 0.5) * VS); scene.add(c.g); }
for (const [k, t0] of Object.entries(S.crops)) { const [x, y, z] = k.split(',').map(Number); addCrop(x, y, z, t0, true); }
// what blocks the way: bricks, and the solid furniture
const solidAt = (x, y, z) => { const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z); if (SOLID(V.get(X, Y, Z))) return true; const f = furn.get(ck(X, Y, Z)); return !!(f && FURN_SOLID[f.type] && y - Y < FURN_SOLID[f.type]); };

// ---------------------------------------------------------------- the people
const figs = [];
function makeFigure(build, o = {}) { const hero = build(scene), F = hero.F; const f = { hero, F, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, onGround: true, h: 1.9, r: 0.34, walkPh: Math.random() * 6, anim: null, hurtT: 0, ...o }; figs.push(f); return f; }
const me = makeFigure(BUILDER.build, { name: BUILDER.name }), pal = makeFigure(HEIYA.build, { name: HEIYA.name });
{ const p = S.pos || Wd.start; me.x = p.x; me.y = p.y + 0.3; me.z = p.z; pal.x = me.x + 1.2; pal.y = me.y; pal.z = me.z; }
const player = { hp: S.hp ?? 10, maxHp: 10, inv: 0, dead: 0, regenT: 0 };
const villagers = [];
function spawnVillager(v, arrive) { const f = makeFigure((sc) => { const F = makeFig(v.spec); sc.add(F.root); return { F }; }, { v, home: [Wd.start.x + (Math.random() - 0.5) * 8, Wd.start.z + (Math.random() - 0.5) * 8], state: 'wander', t: Math.random() * 3, heartT: 20 + Math.random() * 30 });
  if (arrive) { f.x = Wd.start.x + 30; f.z = Wd.start.z; } else { f.x = f.home[0]; f.z = f.home[1]; } f.y = V.top(Math.floor(f.x), Math.floor(f.z)) + 0.2; villagers.push(f); return f; }
for (const id of S.villagers) { const v = VILLAGERS.find((x) => x.id === id); if (v) spawnVillager(v, false); }
// ---- moving through bricks: a step up over one brick, gravity, water
function collides(f, x, y, z) { const r = f.r; for (const yy of [y + 0.002, y + f.h * 0.5, y + f.h - 0.05]) for (const [dx, dz] of [[-r, -r], [r, -r], [-r, r], [r, r]]) if (solidAt(x + dx, yy, z + dz)) return true; return false; }
function moveFig(f, dt) {
  const inW = V.get(Math.floor(f.x), Math.floor(f.y + 0.5), Math.floor(f.z)) === B.WATER;
  if (inW) { f.vy = Math.max(f.vy - 12 * dt, -3); f.vy += (f.wantUp ? 18 : 6) * dt; f.vy = Math.min(f.vy, 4.5); } else f.vy = Math.max(f.vy - 32 * dt, -40);
  f.onGround = false;
  for (const ax of ['x', 'z']) { const d = (ax === 'x' ? f.vx : f.vz) * dt; if (!d) continue; const nx = f.x + (ax === 'x' ? d : 0), nz = f.z + (ax === 'z' ? d : 0);
    if (!collides(f, nx, f.y, nz)) { f.x = nx; f.z = nz; continue; }
    if ((f.grounded || inW) && !collides(f, nx, f.y + 1.05, nz) && !collides(f, f.x, f.y + 1.05, f.z)) { f.y += 1.05; f.x = nx; f.z = nz; continue; }
    f.blocked = true; if (ax === 'x') f.vx = 0; else f.vz = 0; }
  const ny = f.y + f.vy * dt;
  if (f.vy < 0) { if (collides(f, f.x, ny, f.z)) { f.y = Math.floor(ny) + 1; const FY = Math.floor(ny); for (const [dx, dz] of [[0, 0]]) { const fu = furn.get(ck(Math.floor(f.x + dx), FY, Math.floor(f.z + dz))); if (fu && FURN_SOLID[fu.type]) f.y = FY + FURN_SOLID[fu.type]; } f.vy = 0; f.onGround = true; } else f.y = ny; }
  else if (f.vy > 0) { if (collides(f, f.x, ny, f.z)) f.vy = 0; else f.y = ny; }
  if (!f.onGround && f.vy === 0 && collides(f, f.x, f.y - 0.06, f.z)) f.onGround = true;
  f.grounded = f.onGround; f.inWater = inW; f.x = clamp(f.x, 2, WW - 3); f.z = clamp(f.z, 2, DD - 3); if (f.y < -4) { f.y = V.top(Math.floor(f.x), Math.floor(f.z)) + 1; f.vy = 0; }
}
function poseFig(f, dt, clock) {
  let p = { ...DEF }, face = { mouth: { smile: 0.45 } };
  if (f.anim) { const A = f.anim; A.t += dt * (A.rate || 1); Object.assign(p, keyPose(A.keys, A.t)); A.events?.forEach((e) => { if (!e.done && A.t >= e.t) { e.done = true; e.run(); } }); if (A.t >= A.len) { f.anim = null; A.end?.(); } }
  else if (f.lying) Object.assign(p, { tilt: -1.57, y: 0.35, armR: -0.2, armL: -0.2 });
  else { const sp = Math.hypot(f.vx, f.vz); f.walkPh += sp * dt * 1.4; const k = clamp(sp / 4, 0, 1), s = Math.sin(f.walkPh * 1.9);
    if (sp > 0.3 && f.onGround) Object.assign(p, { hipR: s * 0.7 * k, hipL: -s * 0.7 * k, armR: -0.2 - s * 0.7 * k, armL: -0.2 + s * 0.7 * k, outR: 0.12, outL: 0.12, tilt: 0.08 * k, y: Math.abs(Math.cos(f.walkPh * 1.9)) * 0.03 * k });
    else { p.armR = -0.25 + Math.sin(clock * 1.3 + f.walkPh) * 0.04; p.head = Math.sin(clock * 0.5 + f.walkPh) * 0.25; }
    if (!f.onGround && !f.inWater) Object.assign(p, { armR: f.vy > 0 ? -2.4 : -1.2, outR: 0.5, armL: -1.4, outL: 0.5, hipR: f.vy > 0 ? -1 : -0.3, hipL: 0.3 });
    if (f.inWater) Object.assign(p, { armR: -2.2 + Math.sin(clock * 6) * 1.2, armL: -2.2 - Math.sin(clock * 6) * 1.2, outR: 0.4, outL: 0.4, tilt: 0.5, y: -0.25 }); }
  if (f.hurtT > 0) { const k = f.hurtT / 0.35; p.tilt -= 0.4 * k; p.armR -= 0.6 * k; p.armL -= 0.6 * k; face = { blink: 1, browIn: 1, mouth: { open: 0.6, round: 0.6 } }; }
  if (f.happyT > 0) face = { happy: 1, mouth: { open: 0.5, smile: 1 } };
  f.blinkT = (f.blinkT ?? Math.random() * 3) - dt; if (f.blinkT < 0) { f.blinkT = 2 + Math.random() * 3; f.blinkOn = 0.13; } if (f.blinkOn > 0) { f.blinkOn -= dt; face.blink = 1; }
  const fw = V3(Math.sin(f.yaw), 0, Math.cos(f.yaw)), w = V3(f.x, f.y, f.z).addScaledVector(fw, p.fwd || 0);
  f.F.pose({ x: w.x * VS, y: (w.y + (p.y || 0) / VS) * VS, z: w.z * VS, yaw: f.yaw + (p.yaw || 0), tilt: p.tilt, roll: p.roll, hipR: p.hipR, hipL: p.hipL, armR: p.armR, armL: p.armL, outR: p.outR, outL: p.outL, wristR: p.wristR, wristL: p.wristL, head: p.head }); f.F.face(face);
  if (f.flash > 0) { f.flash -= dt; f.F.root.traverse((o) => { if (o.material?.emissive) o.material.emissive.setRGB(f.flash * 4, f.flash * 2, f.flash * 2); }); }
}

// ---------------------------------------------------------------- input
const keys = {}; let mouseDX = 0, mouseDY = 0, wheel = 0;
addEventListener('keydown', (e) => { if (menu.open && !['Escape', 'KeyE', 'KeyC', 'KeyI', 'ArrowUp', 'ArrowDown', 'Enter', 'KeyW', 'KeyS', 'Space'].includes(e.code)) return; keys[e.code] = true; if (!e.repeat) keys['_' + e.code] = true; wake(); music.start?.(); if (['Space', 'Tab'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', (e) => { keys[e.code] = false; });
const pressed = (c) => { if (keys['_' + c]) { keys['_' + c] = false; return true; } return false; };
cv.addEventListener('click', () => { wake(); music.start?.(); if (!menu.open && !matchMedia('(pointer: coarse)').matches && document.pointerLockElement !== cv) cv.requestPointerLock?.(); });
cv.addEventListener('mousedown', (e) => { if (document.pointerLockElement !== cv) return; if (e.button === 0) keys.Mouse0 = true; if (e.button === 2) keys._Mouse2 = true; });
addEventListener('mouseup', (e) => { if (e.button === 0) keys.Mouse0 = false; });
cv.addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('mousemove', (e) => { if (document.pointerLockElement === cv) { mouseDX += e.movementX; mouseDY += e.movementY; } });
addEventListener('wheel', (e) => { if (menu.open) return; if (document.pointerLockElement === cv || true) { S.sel = (S.sel + (e.deltaY > 0 ? 1 : 7)) % 8; hotbar(); } }, { passive: true });
const pad = { prev: [], mx: 0, mz: 0, on: false };
function pollPad(dt) { const gp = [...(navigator.getGamepads?.() || [])].find((g) => g && g.connected); if (!gp) { pad.mx = pad.mz = 0; return; } if (!pad.on) { pad.on = true; toast(T('已連接手把', 'Controller connected')); }
  const dz = (v) => (Math.abs(v) < 0.18 ? 0 : (v - Math.sign(v) * 0.18) / 0.82), b = (i) => !!gp.buttons[i]?.pressed; pad.mx = dz(gp.axes[0] || 0); pad.mz = dz(gp.axes[1] || 0); mouseDX += dz(gp.axes[2] || 0) * 900 * dt; mouseDY += dz(gp.axes[3] || 0) * 600 * dt;
  const map = { 0: 'Space', 2: 'Mouse0', 1: 'KeyE', 3: 'KeyI', 7: 'Mouse0', 6: '_Mouse2', 5: 'HotR', 4: 'HotL', 9: 'KeyC' }; for (const [i, code] of Object.entries(map)) { const now = b(+i); if (now && !pad.prev[i]) { if (code === 'HotR') { S.sel = (S.sel + 1) % 8; hotbar(); } else if (code === 'HotL') { S.sel = (S.sel + 7) % 8; hotbar(); } else if (code.startsWith('_')) keys[code] = true; else { keys[code] = true; keys['_' + code] = true; } } if (!now && pad.prev[i] && !code.startsWith('_') && !code.startsWith('Hot')) keys[code] = false; pad.prev[i] = now; }
  if (b(0)) keys.Space = true; const dpad = b(12) ? -1 : b(13) ? 1 : 0; if (dpad && dpad !== pad.d && menu.open) keys[dpad < 0 ? '_ArrowUp' : '_ArrowDown'] = true; pad.d = dpad; }

// ---------------------------------------------------------------- the camera, behind and above; the cross in the middle aims
const cam = { yaw: Math.PI, pitch: 0.3, dist: 6.5, pos: V3(), look: V3() };
function placeCamera(dt) {
  cam.yaw -= mouseDX * 0.0032; cam.pitch = clamp(cam.pitch + mouseDY * 0.0026, -0.5, 1.25); mouseDX = mouseDY = 0;
  const head = V3(me.x, me.y + me.h * 0.95, me.z), want = V3(Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch));
  // a little to the right of the head, over the shoulder, so the middle of the screen is ahead of you
  const right = V3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)); head.addScaledVector(right, 1.15); // over the right shoulder
  let d = cam.dist; for (let s = 0.4; s < cam.dist; s += 0.2) { const p = head.clone().addScaledVector(want, s); if (SOLID(V.get(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)))) { d = Math.max(0.8, s - 0.4); break; } }
  cam.pos.lerp(head.clone().addScaledVector(want, d), Math.min(1, dt * 14)); cam.look.lerp(head, Math.min(1, dt * 16));
  camera.position.copy(cam.pos).multiplyScalar(VS); camera.lookAt(cam.look.clone().multiplyScalar(VS)); sky.position.copy(camera.position);
  const sh = fx.S.shake * 0.12; camera.position.x += (Math.random() - 0.5) * sh; camera.position.y += (Math.random() - 0.5) * sh;
}
// what the cross is on: the first brick, piece of furniture or crop along the line of sight, within reach of you
const hl = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 })); hl.scale.setScalar(VS); scene.add(hl);
const ghost = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#9ae8ff', transparent: true, opacity: 0.18, depthWrite: false })); ghost.scale.setScalar(VS); scene.add(ghost);
function aim() {
  const o = camera.position.clone().divideScalar(VS), d = new THREE.Vector3(); camera.getWorldDirection(d);
  let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z); const sx = Math.sign(d.x), sy = Math.sign(d.y), sz = Math.sign(d.z);
  const tdx = Math.abs(1 / d.x), tdy = Math.abs(1 / d.y), tdz = Math.abs(1 / d.z); let tx = (sx > 0 ? x + 1 - o.x : o.x - x) * tdx, ty = (sy > 0 ? y + 1 - o.y : o.y - y) * tdy, tz = (sz > 0 ? z + 1 - o.z : o.z - z) * tdz;
  let prev = null, t = 0; const chest = V3(me.x, me.y + 1, me.z);
  for (let i = 0; i < 80 && t < 16; i++) {
    const c = V3(x + 0.5, y + 0.5, z + 0.5), far = c.distanceTo(chest);
    if (far < 5.5 && inWorld(x, y, z)) { const b = V.get(x, y, z), f = furn.get(ck(x, y, z)), cr = crops.get(ck(x, y, z));
      if (f) return { kind: 'furn', x, y, z, f: f.base || f, prev };
      if (cr) return { kind: 'crop', x, y, z, c: cr, prev };
      if (b !== B.AIR && b !== B.WATER) return { kind: 'block', x, y, z, b, prev };
      prev = [x, y, z]; }
    else if (far >= 5.5 && t > 3 && prev) break;
    if (tx < ty && tx < tz) { x += sx; t = tx; tx += tdx; } else if (ty < tz) { y += sy; t = ty; ty += tdy; } else { z += sz; t = tz; tz += tdz; }
  }
  return prev ? { kind: 'air', prev } : null;
}

// ---------------------------------------------------------------- what you carry
const have = (id) => S.inv[id] || 0;
function give(id, n = 1, at) {
  if (!id || n <= 0) return; S.inv[id] = have(id) + n; S.got[id] = (S.got[id] || 0) + n;
  if (!S.hot.includes(id) && (ITEMS[id].block != null || ITEMS[id].furn || ITEMS[id].seed || ITEMS[id].food)) { const e = S.hot.indexOf(null); if (e >= 0) S.hot[e] = id; }
  popUp(`${ITEMS[id].icon} +${n}`, at); hotbar(); stepCheck();
}
function take(id, n = 1) { S.inv[id] = have(id) - n; if (S.inv[id] <= 0) { delete S.inv[id]; } hotbar(); }
const tool = () => (have('ironHammer') ? 3 : have('copperHammer') ? 2 : 1);
// ---------------------------------------------------------------- breaking, building, using
let swing = 0, aimNow = null; const dmg = new Map();
const SWING = [{ t: 0, p: { armR: -0.4, outR: 0.1 } }, { t: 0.1, p: { armR: -2.8, outR: 0.2, tilt: -0.1 } }, { t: 0.2, ease: 'in', p: { armR: -0.6, outR: 0.1, tilt: 0.2, fwd: 0.1 } }, { t: 0.32, p: { armR: -0.4 } }];
function act() { // the hammer comes down on what is in front of you: a slime, a crop, a piece of furniture, a brick
  if (me.anim) return; const target = aimNow;
  me.anim = { keys: SWING, len: 0.32, t: 0, events: [{ t: 0.18, run: () => {
    SFX.swing?.(0.6);
    const sl = slimes.find((s) => s.alive && Math.hypot(s.x - me.x, s.z - me.z) < 2.4 && Math.abs(angWrap(Math.atan2(s.x - me.x, s.z - me.z) - me.yaw)) < 1.1);
    if (sl) { hitSlime(sl, tool(), me); return; }
    if (!target || target.kind === 'air') return; if (target.kind === 'block' && crops.get(ck(target.x, target.y + 1, target.z))) { const c = crops.get(ck(target.x, target.y + 1, target.z)); act.crop = { kind: 'crop', x: c.x, y: c.y, z: c.z, c }; } else act.crop = null; const tgt = act.crop || target; const { x, y, z } = tgt;
    if (tgt.kind === 'crop') { const c = tgt.c; scene.remove(c.g); crops.delete(ck(x, y, z)); delete S.crops[ck(x, y, z)]; if (c.stage >= 2) { give('cabbage', 1 + (Math.random() < 0.4 ? 1 : 0), V3(x + 0.5, y + 0.5, z + 0.5)); if (Math.random() < 0.6) give('seed', 1); S.stats.cabbage++; questCheck(); SFX.flick?.(); } else give('seed', 1); burst(x, y, z, '#6ac04a'); return; }
    if (target.kind === 'furn') { const f = removeFurn(target.f); give(Object.keys(ITEMS).find((k) => ITEMS[k].furn === f.type), 1, V3(x + 0.5, y + 0.5, z + 0.5)); SFX.thud?.(0.6); burst(x, y, z, '#a8743a'); return; }
    const b = target.b, D = DROP[b]; if (!D) { SFX.thud?.(0.4); return; }
    const k = ck(x, y, z), need = Math.max(1, Math.ceil(D[1] / tool())), got = (dmg.get(k) || 0) + 1; SFX.thud?.(0.5); burst(x, y, z, '#' + new THREE.Color(colorOf(b)).getHexString(), 4);
    if (got < need) { dmg.set(k, got); hl.userData.shake = 0.15; return; }
    dmg.delete(k); setBlock(x, y, z, B.AIR); burst(x, y, z, '#' + new THREE.Color(colorOf(b)).getHexString(), 14); SFX.kick?.();
    if (D[0]) give(D[0], 1, V3(x + 0.5, y + 0.5, z + 0.5)); if (D[2] && Math.random() < D[2][1]) give(D[2][0], 1);
    if (b === B.FARM || V.get(x, y + 1, z) === B.AIR) { const c = crops.get(ck(x, y + 1, z)); if (c) { scene.remove(c.g); crops.delete(ck(x, y + 1, z)); delete S.crops[ck(x, y + 1, z)]; } }
    // what stood on it falls with it
    const above = furn.get(ck(x, y + 1, z)); if (above && !above.upper) { removeFurn(above); give(Object.keys(ITEMS).find((kk) => ITEMS[kk].furn === above.type), 1); }
  } }] };
}
const colorOf = (b) => ({ 1: '#5a9a3e', 2: '#8a6440', 3: '#8a8a86', 4: '#d8c48a', 6: '#5a3a24', 7: '#9a6a3e', 13: '#2e6e34', 14: '#3e8a3a', 16: '#6e6e6a', 25: '#a8b060', 27: '#b8683e', 31: '#c8743a', 32: '#c8b4a4', 33: '#34343a', 34: '#5a3a20' })[b] || '#9a9a9a';
function burst(x, y, z, c, n = 10) { const col = new THREE.Color(c); for (let i = 0; i < n; i++) fx.puff(V3(x + 0.5, y + 0.5, z + 0.5).multiplyScalar(VS), V3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3), 0.5, [col.r * 1.2, col.g * 1.2, col.b * 1.2], 1.5, 6); }
function place() { // lay the brick, set the furniture, sow the seed, or eat
  const id = S.hot[S.sel]; if (!id || !have(id)) return; const it = ITEMS[id];
  if (it.food) { if (player.hp >= player.maxHp) { toast(T('現在不餓', 'Not hungry')); return; } take(id); player.hp = Math.min(player.maxHp, player.hp + it.food); SFX.flick?.(); toast(T(`吃了${it.zh}，體力 +${it.food}`, `Ate the ${it.en}: +${it.food}`)); hud(); return; }
  const tg = aimNow; if (!tg) return;
  if (it.seed) { if (tg.kind === 'block' && tg.b === B.FARM && !furn.get(ck(tg.x, tg.y + 1, tg.z)) && !crops.get(ck(tg.x, tg.y + 1, tg.z)) && V.get(tg.x, tg.y + 1, tg.z) === B.AIR) { take(id); addCrop(tg.x, tg.y + 1, tg.z, Date.now()); S.stats.sown++; SFX.flick?.(); stepCheck(); } else toast(T('種子要撒在田地上', 'Seeds go on farmland')); return; }
  if (id === 'farmland' && tg.kind === 'block' && [B.GRASS, B.DIRT].includes(tg.b) && V.get(tg.x, tg.y + 1, tg.z) === B.AIR) { take(id); setBlock(tg.x, tg.y, tg.z, B.FARM); SFX.thud?.(0.4); burst(tg.x, tg.y, tg.z, '#5a3a20', 6); return; }
  if (!tg.prev || tg.kind === 'air') return; const [x, y, z] = tg.prev; if (!inWorld(x, y, z)) return;
  if (furn.get(ck(x, y, z)) || crops.get(ck(x, y, z))) return;
  // not where someone stands
  for (const f of [me, pal, ...villagers]) { if (Math.floor(f.x - f.r) <= x && x <= Math.floor(f.x + f.r) && Math.floor(f.z - f.r) <= z && z <= Math.floor(f.z + f.r) && y >= Math.floor(f.y) && y <= Math.floor(f.y + f.h - 0.01)) { if (it.block != null) { toast(T('這裡有人站著', 'Someone is standing there')); return; } } }
  if (it.block != null) { take(id); setBlock(x, y, z, it.block); SFX.thud?.(0.5); burst(x, y, z, '#ffffff', 4); return; }
  if (it.furn) {
    if (!SOLID(V.get(x, y - 1, z)) && !['lantern', 'torch'].includes(it.furn)) { toast(T('要放在地上', 'It has to stand on the ground')); return; }
    if (it.furn === 'door' && (SOLID(V.get(x, y + 1, z)) || furn.get(ck(x, y + 1, z)))) { toast(T('門需要兩格高的空間', 'A door needs two bricks of space')); return; }
    const rot = ((Math.round(angWrap(me.yaw + Math.PI) / (Math.PI / 2)) % 4) + 4) % 4; take(id); addFurn(x, y, z, it.furn, rot); SFX.thud?.(0.6); burst(x, y, z, '#ffe8a0', 8);
    S.placed[it.furn] = true; stepCheck(); return; }
}
function use() { // E: talk, sleep, craft, open
  const near = nearThing(); if (!near) return;
  if (near.kind === 'villager') return talk(near.f);
  if (near.kind === 'heart') return;
  const f = near.f;
  if (f.type === 'workbench') return craftMenu('bench');
  if (f.type === 'pot') return craftMenu('pot');
  if (f.type === 'bed') { if (tod > 0.75 || tod < 0.2) { fade(() => { tod = 0.26; player.hp = player.maxHp; for (const s of slimes) s.alive = false; toast(T('一覺睡到天亮，體力全滿', 'You sleep till morning: full health')); save(); }); } else toast(T('天黑了才能睡', 'You can sleep once it’s dark')); return; }
  if (f.type === 'door') { f.open = !f.open; f.g.rotation.y = f.rot * Math.PI / 2 + (f.open ? Math.PI / 2 : 0); SFX.flick?.(); return; }
  if (f.type === 'chest') { toast(T('箱子裡空空的（東西都在你的背包裡）', 'Empty — everything you carry is in your bag')); return; }
}
function nearThing() {
  for (const f of villagers) if (Math.hypot(f.x - me.x, f.z - me.z) < 2.4 && !f.lying) return { kind: 'villager', f };
  let best = null, bd = 2.3; for (const f of furn.values()) { if (f.upper) continue; const d = Math.hypot(f.x + 0.5 - me.x, f.z + 0.5 - me.z); if (d < bd && Math.abs(f.y - me.y) < 2) { bd = d; best = f; } }
  return best && ['workbench', 'pot', 'bed', 'door', 'chest'].includes(best.type) ? { kind: 'furn', f: best } : null;
}

// ---------------------------------------------------------------- rooms: walls two high all round, a door; what is in it
let roomsDirty = 1; const roomCells = new Set();
function detectRooms() {
  const doors = [...furn.values()].filter((f) => f.type === 'door' && !f.upper), found = new Map(); roomCells.clear();
  const wall = (x, y, z) => (SOLID(V.get(x, y, z)) && SOLID(V.get(x, y + 1, z))) || furn.get(ck(x, y, z))?.type === 'door';
  for (const d of doors) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const sx = d.x + dx, sz = d.z + dz, y = d.y; if (wall(sx, y, sz)) continue;
    const seen = new Set([sx + ',' + sz]), queue = [[sx, sz]]; let leak = false;
    while (queue.length) { const [x, z] = queue.pop(); if (seen.size > 160 || x < 1 || z < 1 || x > WW - 2 || z > DD - 2) { leak = true; break; } for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + ax, nz = z + az, k = nx + ',' + nz; if (seen.has(k) || wall(nx, y, nz)) continue; seen.add(k); queue.push([nx, nz]); } }
    if (leak || seen.size < 4) continue;
    const cells = [...seen].sort(), key = y + ':' + cells[0] + ':' + cells.length; if (found.has(key)) continue;
    const count = {}; for (const c of cells) { const [x, z] = c.split(',').map(Number); for (const yy of [y, y + 1]) { const f = furn.get(ck(x, yy, z)); if (f && !f.upper) count[f.type] = (count[f.type] || 0) + 1; } roomCells.add(x + ',' + y + ',' + z); }
    const type = ROOMS.find((r) => Object.entries(r.need).every(([k, n]) => (count[k] || 0) >= n));
    found.set(key, { key, type: type.id, cells, y, door: d });
  }
  const before = S.rooms; S.rooms = {}; for (const r of found.values()) S.rooms[r.key] = r.type;
  for (const r of found.values()) { const aw = (S.awarded[r.key] ||= []); if (!aw.includes(r.type)) { aw.push(r.type); const R0 = ROOMS.find((x) => x.id === r.type); banner(T(`完成：${R0.zh}！`, `${R0.en} built!`), '#ffd84a', `♥ +${R0.hearts}`); SFX.gong?.(0.8); addHappy(R0.hearts, V3(r.door.x + 0.5, r.y + 2, r.door.z + 0.5)); questCheck(); } }
  void before; stepCheck(); hud();
}
// ---------------------------------------------------------------- hearts, base level, villagers
function addHappy(n, at) {
  S.happy += n; popUp(`♥ +${n}`, at, '#ff6a8a'); const lv = LEVELS.filter((h) => S.happy >= h).length;
  if (lv > S.level) { S.level = lv; banner(T(`基地升到 Lv${lv}！`, `Base level ${lv}!`), '#7ae0ff', T('有新的配方可以做了', 'New recipes to make')); SFX.gong?.(1); for (let i = 0; i < 30; i++) fx.puff(V3(me.x, me.y + 1, me.z).multiplyScalar(VS), V3((Math.random() - 0.5) * 4, 2 + Math.random() * 3, (Math.random() - 0.5) * 4), 1.2, [1.5, 1.3, 0.5], 1, -1); }
  for (const v of VILLAGERS) if (v.at <= S.level && !S.villagers.includes(v.id) && Object.keys(S.rooms).length > 0) { S.villagers.push(v.id); const f = spawnVillager(v, true); f.state = 'arrive'; setTimeout(() => banner(T(`${v.zh}（${v.role.zh}）來到了基地！`, `${v.en} the ${v.role.en.toLowerCase()} has come to live here!`), '#9af0a8'), 2500); }
  stepCheck(); hud(); save();
}
function talk(f) {
  const v = f.v, Q = v.quest, st = S.quests[Q.id]; f.yaw = Math.atan2(me.x - f.x, me.z - f.z);
  if (st === 'done') { const c = v.chat[Math.floor(Math.random() * v.chat.length)]; return say(v, N(c)); }
  if (st === 'given') { if (questMet(Q)) { S.quests[Q.id] = 'done'; f.happyT = 2; banner(T('任務完成！', 'Request done!'), '#ffd84a', `♥ +${Q.reward}`); addHappy(Q.reward, V3(f.x, f.y + 2.5, f.z)); return say(v, N(Q.done)); } return say(v, N(Q) + T('（還沒完成）', ' (not yet)')); }
  S.quests[Q.id] = 'given'; save(); goalBox(); return say(v, N(Q));
}
function questMet(Q) { const g = Q.goal; if (g.cabbage) return S.stats.cabbage >= g.cabbage; if (g.slimes) return S.stats.slimes >= g.slimes; if (g.room) return Object.values(S.rooms).includes(g.room); return false; }
function questCheck() { for (const v of VILLAGERS) if (S.quests[v.quest.id] === 'given' && questMet(v.quest)) toast(T(`${v.zh}的請求完成了，去跟他說吧！`, `${v.en}'s request is done — go and tell them!`)); }
function stepCheck() {
  const st = STEPS[S.step]; if (!st) return; const g = st.goal;
  const ok = (g.dirt && (S.got.dirt || 0) >= g.dirt) || (g.wood && (S.got.wood || 0) >= g.wood) || (g.placed && S.placed[g.placed]) || (g.anyRoom && Object.keys(S.rooms).length) || (g.room && Object.values(S.rooms).includes(g.room)) || (g.sown && S.stats.sown >= g.sown) || (g.level && S.level >= g.level);
  if (ok) { S.step++; SFX.flick?.(); toast(T('✔ ' + st.zh, '✔ ' + st.en)); if (S.step === 2) setTimeout(() => toast(T('提示：按 C 打開隨身製作', 'Tip: press C to craft by hand')), 1500); }
  goalBox();
}
// ---------------------------------------------------------------- slimes, at night
const slimes = [];
function spawnSlime() {
  const a = Math.random() * Math.PI * 2, r = 16 + Math.random() * 14, x = Math.floor(me.x + Math.cos(a) * r), z = Math.floor(me.z + Math.sin(a) * r); if (x < 4 || z < 4 || x > WW - 5 || z > DD - 5) return;
  const y = V.top(x, z); if (V.get(x, y - 1, z) !== B.GRASS || y <= WL + 1 || roomCells.has(x + ',' + y + ',' + z)) return;
  const g = makeSlime(Math.random() < 0.15 ? '#e05a8a' : '#3a8ae0'); g.scale.setScalar(VS * 1.3); scene.add(g); slimes.push({ g, x: x + 0.5, y, z: z + 0.5, vx: 0, vy: 0, vz: 0, hp: 3, alive: true, hopT: Math.random(), hitT: 0, yaw: 0, flash: 0 });
}
function hitSlime(s, d, from) { s.hp -= d; s.flash = 0.2; const dx = s.x - from.x, dz = s.z - from.z, l = Math.hypot(dx, dz) || 1; s.vx = dx / l * 7; s.vz = dz / l * 7; s.vy = 6; SFX.hit?.(0.6); SFX.bounce?.(); fx.hitSparks(V3(s.x, s.y + 0.5, s.z).multiplyScalar(VS), V3(dx / l, 0.5, dz / l)); fx.S.shake = Math.max(fx.S.shake, 0.15);
  if (s.hp <= 0) { s.alive = false; burst(s.x - 0.5, s.y, s.z - 0.5, '#5aa8ff', 18); give('slime', 1, V3(s.x, s.y + 0.6, s.z)); if (Math.random() < 0.25) give('seed', 1); S.stats.slimes++; questCheck(); } }
function stepSlimes(dt, night) {
  if (night && slimes.filter((s) => s.alive).length < 6 && Math.random() < dt * 0.25) spawnSlime();
  for (const s of slimes) {
    if (!s.alive) { s.g.scale.multiplyScalar(0.85); if (s.g.scale.x < 0.02) scene.remove(s.g); continue; }
    if (!night && Math.random() < dt * 0.15) { s.alive = false; continue; } // they melt away by day
    const dx = me.x - s.x, dz = me.z - s.z, d = Math.hypot(dx, dz); s.hopT -= dt; s.hitT -= dt;
    const gy = V.top(Math.floor(s.x), Math.floor(s.z)); if (s.y > gy) s.vy -= 26 * dt; s.y += s.vy * dt; if (s.y <= gy) { s.y = gy; s.vy = 0; s.vx *= 0.8; s.vz *= 0.8; }
    if (s.y === gy && s.hopT <= 0) { s.hopT = 0.7 + Math.random() * 0.5; const chase = d < 14 && player.dead <= 0, a = chase ? Math.atan2(dx, dz) : Math.random() * 6.28; s.yaw = a; s.vx = Math.sin(a) * (chase ? 3.6 : 1.5); s.vz = Math.cos(a) * (chase ? 3.6 : 1.5); s.vy = 6.5; }
    const nx = s.x + s.vx * dt, nz = s.z + s.vz * dt; if (!SOLID(V.get(Math.floor(nx), Math.floor(s.y + 0.3), Math.floor(nz))) && !roomCells.has(Math.floor(nx) + ',' + Math.floor(s.y) + ',' + Math.floor(nz))) { s.x = nx; s.z = nz; } else { s.vx *= -0.5; s.vz *= -0.5; }
    if (d < 0.9 && Math.abs(me.y - s.y) < 1.2 && s.hitT <= 0) { s.hitT = 1.2; hurt(1, s); }
    const sq = s.y === gy ? 1 - Math.max(0, s.hopT - 0.55) * 0.6 : 1.1; s.g.position.set(s.x * VS, s.y * VS, s.z * VS); s.g.rotation.y = s.yaw; s.g.children[0].scale.set(1 / sq * 0.9 + 0.1, 0.8 * sq, 1 / sq * 0.9 + 0.1);
    if (s.flash > 0) { s.flash -= dt; s.g.userData.body.material.emissive.setRGB(s.flash * 5, s.flash * 5, s.flash * 5); } else s.g.userData.body.material.emissive.setRGB(0, 0, 0);
  }
  for (let i = slimes.length - 1; i >= 0; i--) if (!slimes[i].alive && slimes[i].g.scale.x < 0.02) slimes.splice(i, 1);
}
function hurt(n, from) { if (player.inv > 0 || player.dead > 0) return; player.hp -= n; player.inv = 1; player.regenT = 6; me.hurtT = 0.35; const dx = me.x - from.x, dz = me.z - from.z, l = Math.hypot(dx, dz) || 1; me.vx = dx / l * 7; me.vz = dz / l * 7; me.vy = 5; SFX.ouch?.(true, 'light'); fx.S.shake = 0.25;
  if (player.hp <= 0) { player.dead = 2; toast(T('昏倒了……', 'You faint…')); } hud(); }
// ---------------------------------------------------------------- the menus: crafting, the bag
const menu = { open: null, i: 0, items: [] };
function craftMenu(where) {
  const list = RECIPES.filter((r) => r[3] <= S.level && (where === 'hand' ? r[4] : where === 'pot' ? r[5] === 'pot' : !r[5]));
  menu.open = 'craft'; menu.where = where; menu.items = list; menu.i = 0; document.exitPointerLock?.(); drawMenu();
}
function drawMenu() {
  const el = $('menu'); el.hidden = false;
  if (menu.open === 'craft') {
    const title = { hand: T('隨身製作', 'Craft by hand'), bench: T('工作台', 'Workbench'), pot: T('大鍋', 'Cooking pot') }[menu.where];
    el.innerHTML = `<h3>${title}<small>${T('↑↓ 選擇・E/Enter 製作・Esc 關閉', '↑↓ choose · E/Enter make · Esc close')}</small></h3><div class="list">${menu.items.map((r, i) => { const it = ITEMS[r[0]], ok = Object.entries(r[2]).every(([k, n]) => have(k) >= n);
      return `<button data-i="${i}" class="${i === menu.i ? 'on' : ''} ${ok ? '' : 'no'}"><span class="ic">${it.icon}</span><b>${N(it)}${r[1] > 1 ? ' ×' + r[1] : ''}</b><small>${Object.entries(r[2]).map(([k, n]) => `${ITEMS[k].icon}${N(ITEMS[k])} ${have(k)}/${n}`).join('　')}</small></button>`; }).join('') || `<p>${T('還沒有可以做的東西', 'Nothing to make yet')}</p>`}</div>`
      + (menu.where === 'hand' ? `<p class="tip">${T('其他東西要在工作台做。', 'Everything else is made at a workbench.')}</p>` : '');
  }
  if (menu.open === 'bag') {
    const ids = Object.keys(S.inv); el.innerHTML = `<h3>${T('背包', 'Bag')}<small>${T(`點一樣東西放到快捷欄第 ${S.sel + 1} 格・Esc 關閉`, `Click an item to put it in hotbar slot ${S.sel + 1} · Esc close`)}</small></h3><div class="grid">${ids.map((k) => `<button data-k="${k}"><span class="ic">${ITEMS[k].icon}</span><b>${N(ITEMS[k])}</b><small>${have(k)}</small></button>`).join('') || `<p>${T('空空的', 'Empty')}</p>`}</div>`
      + `<p class="tip">${T(`基地 Lv${S.level}・幸福愛心 ♥${S.happy}・鎚子力量 ${tool()}・已打倒史萊姆 ${S.stats.slimes}・收成高麗菜 ${S.stats.cabbage}`, `Base level ${S.level} · ♥${S.happy} · hammer power ${tool()} · slimes beaten ${S.stats.slimes} · cabbages ${S.stats.cabbage}`)}</p>`;
  }
}
function closeMenu() { menu.open = null; $('menu').hidden = true; }
function craft(r) { if (!Object.entries(r[2]).every(([k, n]) => have(k) >= n)) { toast(T('材料不夠', 'Not enough materials')); SFX.thud?.(0.3); return; } for (const [k, n] of Object.entries(r[2])) take(k, n); give(r[0], r[1]); SFX.gong?.(0.4); if (ITEMS[r[0]].tool) { me.hero.setTool(tool()); toast(T(`鎚子變強了：力量 ${tool()}`, `Your hammer is stronger: power ${tool()}`)); } drawMenu(); }
$('menu').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.i != null) { menu.i = +b.dataset.i; craft(menu.items[menu.i]); } if (b.dataset.k) { const k = b.dataset.k, at = S.hot.indexOf(k); if (at >= 0) S.hot[at] = null; S.hot[S.sel] = k; hotbar(); drawMenu(); } });
// ---------------------------------------------------------------- the HUD
function hotbar() { $('hotbar').innerHTML = S.hot.map((id, i) => `<div class="slot ${i === S.sel ? 'on' : ''}" data-s="${i}"><i>${i + 1}</i>${id && have(id) ? `<span>${ITEMS[id].icon}</span><b>${have(id)}</b>` : ''}</div>`).join(''); const id = S.hot[S.sel]; $('selName').textContent = id && have(id) ? N(ITEMS[id]) : ''; }
$('hotbar').addEventListener('click', (e) => { const s = e.target.closest('[data-s]'); if (s) { S.sel = +s.dataset.s; hotbar(); } });
function hud() {
  $('hp').innerHTML = Array.from({ length: player.maxHp / 2 }, (_, i) => `<i class="h${clamp(player.hp - i * 2, 0, 2)}"></i>`).join('');
  const lo = LEVELS[S.level - 1] || 0, hi = LEVELS[S.level] ?? null; $('lvl').innerHTML = `<b>${T('基地', 'Base')} Lv${S.level}</b><span><i style="width:${hi ? (S.happy - lo) / (hi - lo) * 100 : 100}%"></i></span><small>♥ ${S.happy}${hi ? ' / ' + hi : ''}</small>`;
}
function goalBox() { const st = STEPS[S.step], qs = VILLAGERS.filter((v) => S.quests[v.quest.id] === 'given'); $('goal').innerHTML = (st ? `<p>◆ ${N(st)}</p>` : '') + qs.map((v) => `<p class="q">${questMet(v.quest) ? '✔' : '•'} ${v.zh}：${N(v.quest)}</p>`).join(''); }
let toastT = 0; function toast(s) { $('toast').textContent = s; $('toast').style.opacity = 1; toastT = 2.6; }
function banner(t, c, sub = '') { const b = $('banner'); b.innerHTML = `<b style="color:${c}">${t}</b>${sub ? `<small>${sub}</small>` : ''}`; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
function say(v, text) { const d = $('say'); d.innerHTML = `<b>${N(v)}<small>${N(v.role)}</small></b>${text}`; d.hidden = false; clearTimeout(say.t); say.t = setTimeout(() => (d.hidden = true), 4200); SFX.talk?.(); }
function popUp(text, at, color = '#ffffff') { const el = document.createElement('div'); el.className = 'pop'; el.textContent = text; el.style.color = color; document.body.appendChild(el); const p = (at || V3(me.x, me.y + 2.2, me.z)).clone().multiplyScalar(VS).project(camera); el.style.left = (p.x * 0.5 + 0.5) * innerWidth + 'px'; el.style.top = (-p.y * 0.5 + 0.5) * innerHeight + 'px'; setTimeout(() => el.remove(), 1100); }
function fade(f) { const el = $('fadeo'); el.style.opacity = 1; setTimeout(() => { f(); setTimeout(() => (el.style.opacity = 0), 300); }, 600); }
// hearts that rise from happy villagers
const hearts = []; const heartTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.font = '52px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('💗', 32, 36); return new THREE.CanvasTexture(c); })();
function heartFrom(f) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true })); s.scale.setScalar(0.5); scene.add(s); hearts.push({ s, x: f.x, y: f.y + 2.6, z: f.z, t: 0, n: 3 }); SFX.flick?.(); }

// ---------------------------------------------------------------- each moment
let tod = S.tod ?? 0.3, last = performance.now(), clock = 0, saveT = 5, studT = 0;
me.hero.setTool(tool());
function step(dt) {
  clock += dt; tod = (tod + dt / 480) % 1; pollPad(dt);
  const night = tod > 0.82 || tod < 0.2;
  // ---- menus take the keys while open
  if (menu.open) { if (pressed('Escape') || (menu.open === 'bag' && pressed('KeyI')) || (menu.open === 'craft' && menu.where === 'hand' && pressed('KeyC'))) closeMenu();
    else if (menu.open === 'craft') { if (pressed('ArrowUp') || pressed('KeyW')) { menu.i = (menu.i + menu.items.length - 1) % menu.items.length; drawMenu(); } if (pressed('ArrowDown') || pressed('KeyS')) { menu.i = (menu.i + 1) % menu.items.length; drawMenu(); } if ((pressed('KeyE') || pressed('Enter') || pressed('Space')) && menu.items[menu.i]) craft(menu.items[menu.i]); } }
  const busy = !!menu.open || player.dead > 0;
  const fwd = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) - pad.mz, side = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + pad.mx;
  let mx = 0, mz = 0; if (!busy) { const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw); mx = -sy * fwd + cy * side; mz = -cy * fwd - sy * side; const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; } }
  const top = me.inWater ? 3 : keys.ShiftLeft ? 7.5 : 5.2; me.vx += (mx * top - me.vx) * Math.min(1, dt * 12); me.vz += (mz * top - me.vz) * Math.min(1, dt * 12);
  if (Math.hypot(mx, mz) > 0.15) me.yaw += angWrap(Math.atan2(mx, mz) - me.yaw) * Math.min(1, dt * 12);
  else if (!busy && (keys.Mouse0 || keys.KeyJ || keys._Mouse2 || keys.KeyK)) me.yaw += angWrap(cam.yaw + Math.PI - me.yaw) * Math.min(1, dt * 14); // face where you aim
  me.wantUp = keys.Space; if (!busy && pressed('Space') && (me.onGround || me.inWater)) { me.vy = 11; me.onGround = false; }
  aimNow = busy ? null : aim();
  if (!busy) {
    if (keys.Mouse0 || keys.KeyJ) act();
    if (pressed('_Mouse2') || keys._Mouse2 || pressed('KeyK')) { keys._Mouse2 = false; place(); }
    if (pressed('KeyE')) use(); if (pressed('KeyC')) craftMenu('hand'); if (pressed('KeyI')) { menu.open = 'bag'; document.exitPointerLock?.(); drawMenu(); }
    for (let i = 1; i <= 8; i++) if (pressed('Digit' + i)) { S.sel = i - 1; hotbar(); }
  }
  if (player.dead > 0) { player.dead -= dt; if (player.dead <= 0) { const bed = [...furn.values()].find((f) => f.type === 'bed'); const p = bed ? { x: bed.x + 0.5, z: bed.z + 1.5 } : Wd.start; me.x = p.x; me.z = p.z; me.y = V.top(Math.floor(p.x), Math.floor(p.z)) + 0.2; player.hp = player.maxHp; player.inv = 2; toast(T('在基地醒來了', 'You wake at your base')); hud(); } }
  moveFig(me, dt); player.inv = Math.max(0, player.inv - dt); me.hurtT = Math.max(0, me.hurtT - dt);
  player.regenT -= dt; if (player.regenT <= 0 && player.hp < player.maxHp && player.hp > 0) { player.regenT = 8; player.hp++; hud(); }
  // ---- Heiya: follows; fights any slime near
  { const foe = slimes.filter((s) => s.alive).sort((a, b) => Math.hypot(a.x - pal.x, a.z - pal.z) - Math.hypot(b.x - pal.x, b.z - pal.z))[0], fd = foe ? Math.hypot(foe.x - pal.x, foe.z - pal.z) : 99;
    const tgt = foe && fd < 9 && Math.hypot(foe.x - me.x, foe.z - me.z) < 14 ? foe : null, tx = tgt ? tgt.x : me.x - Math.sin(me.yaw) * 1.6, tz = tgt ? tgt.z : me.z - Math.cos(me.yaw) * 1.6, dx = tx - pal.x, dz = tz - pal.z, d = Math.hypot(dx, dz);
    if (Math.hypot(me.x - pal.x, me.z - pal.z) > 24) { pal.x = me.x - 1; pal.z = me.z - 1; pal.y = me.y + 0.5; pal.vy = 0; }
    const sp = tgt ? (d > 1.2 ? 6 : 0) : (d > 1.8 ? clamp(d * 2.5, 0, 7) : 0); pal.vx = d > 0.1 ? dx / d * sp : 0; pal.vz = d > 0.1 ? dz / d * sp : 0; if (d > 0.2) pal.yaw += angWrap(Math.atan2(dx, dz) - pal.yaw) * Math.min(1, dt * 8);
    pal.atkT = (pal.atkT || 0) - dt; if (tgt && d < 1.6 && pal.atkT <= 0 && !pal.anim) { pal.atkT = 0.9; pal.anim = { keys: [{ t: 0, p: { armR: -0.3 } }, { t: 0.1, p: { armR: -2.4, armL: -1.4, tilt: -0.1 } }, { t: 0.2, ease: 'in', p: { armR: -0.4, armL: 0.4, tilt: 0.25, fwd: 0.2 } }, { t: 0.35, p: {} }], len: 0.35, t: 0, events: [{ t: 0.2, run: () => tgt.alive && hitSlime(tgt, 1, pal) }] }; }
    if (pal.blocked && pal.onGround) pal.vy = 10; pal.blocked = false; moveFig(pal, dt); }
  // ---- villagers: wander near home, walk in on arrival, sleep in a bed at night, hearts when happy
  const beds = [...furn.values()].filter((f) => f.type === 'bed');
  villagers.forEach((f, vi) => {
    f.t -= dt; f.happyT = Math.max(0, (f.happyT || 0) - dt); let tx = f.home[0], tz = f.home[1], sp = 0;
    const bed = beds[vi]; if (night && bed) { tx = bed.x + 0.5; tz = bed.z + 0.5; } else f.lying = false;
    if (f.state === 'arrive') { sp = 3.5; if (Math.hypot(tx - f.x, tz - f.z) < 2) f.state = 'wander'; }
    else if (night && bed) { if (Math.hypot(tx - f.x, tz - f.z) > 0.6) sp = 2.5; else { f.lying = true; f.x = tx; f.z = tz; f.y = bed.y + 0.3; f.yaw = bed.rot * Math.PI / 2; f.vx = f.vz = 0; return; } }
    else { if (f.t <= 0) { f.t = 2 + Math.random() * 4; f.goal = [f.home[0] + (Math.random() - 0.5) * 10, f.home[1] + (Math.random() - 0.5) * 10]; } if (f.goal) { tx = f.goal[0]; tz = f.goal[1]; } sp = Math.hypot(tx - f.x, tz - f.z) > 0.8 ? 1.6 : 0; }
    const dx = tx - f.x, dz = tz - f.z, d = Math.hypot(dx, dz) || 1; f.vx = dx / d * sp; f.vz = dz / d * sp; if (sp) f.yaw += angWrap(Math.atan2(dx, dz) - f.yaw) * Math.min(1, dt * 5);
    if (f.blocked && f.onGround) f.vy = 10; f.blocked = false; moveFig(f, dt);
    f.heartT -= dt; if (f.heartT <= 0 && Object.keys(S.rooms).length && !night) { f.heartT = 35 + Math.random() * 35; heartFrom(f); }
  });
  for (let i = hearts.length - 1; i >= 0; i--) { const h = hearts[i]; h.t += dt; h.s.position.set(h.x * VS, (h.y + Math.sin(h.t * 3) * 0.2) * VS, h.z * VS); if (Math.hypot(h.x - me.x, h.z - me.z) < 2.6) { scene.remove(h.s); hearts.splice(i, 1); addHappy(h.n, V3(h.x, h.y, h.z)); SFX.gong?.(0.3); } else if (h.t > 90) { scene.remove(h.s); hearts.splice(i, 1); } }
  stepSlimes(dt, night);
  // ---- crops grow (in real time, even while you are away); rooms looked at again after changes
  if (Math.floor(clock) !== Math.floor(clock - dt)) for (const c of crops.values()) growCrop(c);
  if (roomsDirty > 0) { roomsDirty -= dt; if (roomsDirty <= 0) detectRooms(); }
  // ---- everyone posed; the aim marked; lamps lit at night
  for (const f of figs) poseFig(f, dt, clock);
  if (aimNow && aimNow.kind !== 'air') { hl.visible = true; const sh = hl.userData.shake > 0 ? (hl.userData.shake -= dt, (Math.random() - 0.5) * 0.06) : 0; hl.position.set((aimNow.x + 0.5 + sh) * VS, (aimNow.y + 0.5) * VS, (aimNow.z + 0.5) * VS); } else hl.visible = false;
  const it = ITEMS[S.hot[S.sel]]; if (aimNow?.prev && it && (it.block != null || it.furn) && have(S.hot[S.sel])) { ghost.visible = true; ghost.position.set((aimNow.prev[0] + 0.5) * VS, (aimNow.prev[1] + 0.5) * VS, (aimNow.prev[2] + 0.5) * VS); } else ghost.visible = false;
  for (const f of furn.values()) { if (f.upper) continue; if (f.light) f.light.intensity = night ? 3 : 0.4; if (f.g.userData.flame) f.g.userData.flame.scale.setScalar(0.9 + Math.sin(clock * 14 + f.x) * 0.12); }
  fx.update(dt, clock, { tip: V3(), base: V3(), glow: 0, gather: 0, cutting: false, feet: V3(me.x, me.y, me.z).multiplyScalar(VS) });
  studT -= dt; if (studT < 0) { studT = 0.4; V.studsNear(scene, me.x, me.z); }
  lightHour(tod, V3(me.x, me.y, me.z).multiplyScalar(VS)); music.fight?.(slimes.some((s) => s.alive && Math.hypot(s.x - me.x, s.z - me.z) < 12));
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').style.opacity = 0; }
  if (Math.floor(clock * 2) !== Math.floor((clock - dt) * 2)) hud();
  saveT -= dt; if (saveT < 0) { saveT = 8; save(); }
}
function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; step(dt); placeCamera(dt); R.render(scene, camera); requestAnimationFrame(loop); }
// ---------------------------------------------------------------- start
$('loading').classList.add('gone'); setTimeout(() => $('loading').remove(), 800);
$('lang').onclick = () => { lang = lang === 'zh' ? 'en' : 'zh'; try { localStorage.setItem('builders.lang', lang); } catch (e) { /* */ } labels(); };
function labels() { $('lang').textContent = lang === 'zh' ? 'EN' : '中'; $('help').textContent = T('WASD 移動・空白鍵 跳・左鍵/J 敲擊・右鍵/K 放置・滾輪/1-8 選東西・E 使用/對話・C 隨身製作・I 背包・Shift 跑', 'WASD move · Space jump · left click/J hit · right click/K place · wheel/1-8 choose · E use/talk · C craft · I bag · Shift run'); hotbar(); hud(); goalBox(); }
labels(); roomsDirty = 0.5;
if (!S.got.dirt && !Object.keys(S.edits).length) setTimeout(() => { banner(T('空蕩島', 'Empty Isle'), '#ffd84a', T('在這座荒島上，蓋出一座熱鬧的村莊吧！', 'Build a lively village on this empty island!')); say({ zh: '黑牙', en: 'Heiya', role: { zh: '夥伴', en: 'Friend' } }, T('喂，建造家。這座島什麼都沒有……用你那把鎚子敲敲看吧。', 'Hey, builder. There’s nothing on this island… go on, hit something with that hammer.')); }, 900);
requestAnimationFrame(loop);
window.GAME = { S, V, me, pal, step, addHappy, talk, hitSlime, aim: () => aimNow, act, place, use, give, have, craftMenu, detectRooms, furn, crops, slimes, villagers, spawnSlime, setBlock, addFurn, cam, camera, render: () => { placeCamera(1); R.render(scene, camera); }, set tod(v) { tod = v; }, get tod() { return tod; }, menu, keys };
window.DONE = true;
