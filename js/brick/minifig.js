// A minifigure, built to the real proportions (in millimetres, then scaled: an adult stands 1.5 units, a child on
// short legs 1.15): legs that swing at the hip, hips, a tapered torso with its print, arms bent at the elbow that
// turn at the shoulder, C-shaped hands that turn at the wrist, a neck, a round head with a stud on top and a printed
// face (redrawn as the expression changes), and a moulded hairpiece or hat. Glossy plastic.
//   const F = makeFig(spec); scene.add(F.root); F.pose({...}); F.face({...})
import * as THREE from '../../lib/three.module.min.js';
import { mergeGeometries } from '../../lib/addons/BufferGeometryUtils.js';

export const YELLOW = '#f6c83a';
const S = 1.5 / 40; // units per millimetre
export const plastic = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.28, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.22, ...o });

// a box with rounded edges: a rounded rectangle extruded, with a bevel (w across x, h up y, d along z, centred)
export function rbox(w, h, d, r = 0.6) {
  const s = new THREE.Shape(), x = -w / 2 + r, y = -h / 2 + r, W = w - 2 * r, H = h - 2 * r, b = Math.min(r * 0.8, d * 0.2);
  s.moveTo(x, y - r); s.lineTo(x + W, y - r); s.quadraticCurveTo(x + W + r, y - r, x + W + r, y); s.lineTo(x + W + r, y + H); s.quadraticCurveTo(x + W + r, y + H + r, x + W, y + H + r);
  s.lineTo(x, y + H + r); s.quadraticCurveTo(x - r, y + H + r, x - r, y + H); s.lineTo(x - r, y); s.quadraticCurveTo(x - r, y - r, x, y - r);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.9, bevelSegments: 3, curveSegments: 6 });
  g.translate(0, 0, -(d - 2 * b) / 2); g.computeVertexNormals(); return g;
}
function trapezoid(wb, wt, h, d) { // the torso: wider at the bottom, front and back faces flat, bevelled
  const s = new THREE.Shape(); s.moveTo(-wb / 2, 0); s.lineTo(wb / 2, 0); s.lineTo(wt / 2, h); s.lineTo(-wt / 2, h); s.closePath();
  const b = 0.7, g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: 0.6, bevelSegments: 3 });
  g.translate(0, 0, -(d - 2 * b) / 2); return g;
}
function lathe(points, seg = 40, phiStart = Math.PI) { return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg, phiStart); }
function stud(r = 2.4, h = 1.7) { return lathe([[0, 0], [r, 0], [r, h - 0.3], [r - 0.3, h], [0, h]], 24); }

const geoCache = {};
const cached = (k, f) => (geoCache[k] ||= f());

export function makeFig(spec) {
  const kid = spec.age === 'kid', C = spec.colors || {}, skin = spec.skinBrick || YELLOW;
  const legH = kid ? 7.8 : 12.0, hipY = legH + 1.2;
  const M = { skin: plastic(skin), top: plastic(C.top || '#3a7bd5'), bottom: plastic(C.bottom || '#2a3a6a'), shoes: plastic(C.shoes || C.bottom || '#2a3a6a'), hair: plastic(spec.hair?.color || '#3a2418', { roughness: 0.4 }) };
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); body.scale.setScalar(S);
  const mesh = (g, m, parent = body) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; };
  // ---- legs: each its own piece, hinged on the hip axle
  const legs = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(s * 3.9, hipY, 0); body.add(piv);
    const leg = mesh(cached('leg' + kid, () => rbox(7.4, legH - 0.6, 6.4, 0.9)), M.bottom, piv); leg.position.set(0, -legH / 2 - 0.9, -0.4);
    const foot = mesh(cached('foot' + kid, () => rbox(7.4, 3.2, 9.0, 0.8)), M.shoes, piv); foot.position.set(0, -hipY + 1.6 + 0.0, 0.9);
    legs.push(piv);
  }
  mesh(cached('hips', () => rbox(15.6, 3.4, 8.0, 0.8)), M.bottom).position.set(0, hipY + 0.6, 0);
  // a skirt over the legs (a short one, or a long slope to the floor)
  if (spec.outfit?.bottom === 'skirt') {
    const long = spec.age === 'elder' || spec.longSkirt, h = long ? hipY + 0.6 : 5.2;
    const g = cached('skirt' + long + kid, () => lathe([[0, 0], [long ? 9.6 : 9.4, 0], [long ? 9.2 : 9.2, 0.6], [8.6, h * 0.9], [8.2, h], [0, h]], 32));
    const sk = mesh(g, M.bottom); sk.scale.set(1, 1, 0.62); sk.position.set(0, hipY + 1.4 - h, 0.2);
  }
  // ---- torso, printed
  const tH = 12.8, tY = hipY + 2.3;
  const print = torsoPrint(spec), tm = [new THREE.MeshPhysicalMaterial({ map: print, roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.22 }), M.top];
  const torso = mesh(cached('torso', () => trapezoid(15.6, 12.2, tH, 8.0)), tm); torso.position.y = tY;
  // ---- neck, head, stud, face
  mesh(cached('neck', () => lathe([[0, 0], [3.2, 0], [3.2, 1.6], [0, 1.6]], 20)), M.skin).position.y = tY + tH + 0.6;
  const headP = new THREE.Group(); headP.position.y = tY + tH + 2.0; body.add(headP);
  const faceCanvas = document.createElement('canvas'); faceCanvas.width = 1024; faceCanvas.height = 256;
  const faceTex = new THREE.CanvasTexture(faceCanvas); faceTex.colorSpace = THREE.SRGBColorSpace; faceTex.anisotropy = 8;
  const head = mesh(cached('head', () => { const g = lathe([[0, 0], [3.6, 0], [4.5, 0.4], [5.0, 1.4], [5.05, 2.4], [5.05, 3.5], [5.05, 4.6], [5.05, 5.8], [5.05, 7.0], [5.0, 8.0], [4.5, 8.9], [3.6, 9.3], [0, 9.3]], 48); const p = g.attributes.position, u = g.attributes.uv; for (let i = 0; i < p.count; i++) u.setY(i, p.getY(i) / 9.3); return g; }), new THREE.MeshPhysicalMaterial({ map: faceTex, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 }), headP);
  mesh(cached('headstud', () => stud(2.5, 1.7)), M.skin, headP).position.y = 9.2;
  hairpiece(spec, headP, M, mesh);
  // ---- arms: from the shoulder, out and down, bending forward at the elbow; a hand at the wrist
  const arms = [], wrists = [], hands = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(s * 6.4, tY + tH - 2.6, 0); piv.rotation.z = s * 0.1; body.add(piv);
    const path = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(s * 1.6, -2.5, 0), new THREE.Vector3(s * 2.4, -6.2, 0.2), new THREE.Vector3(s * 2.5, -8.4, 1.4), new THREE.Vector3(s * 2.3, -9.6, 3.0)]);
    mesh(cached('arm' + s, () => mergeGeometries([new THREE.TubeGeometry(path, 24, 2.15, 14, false), new THREE.SphereGeometry(2.15, 14, 10).translate(0, 0.5, 0)])), M.top, piv);
    const cuff = mesh(cached('cuff', () => new THREE.CylinderGeometry(1.75, 1.75, 1.6, 14)), spec.outfit?.sleeves === 'short' ? M.skin : M.top, piv); cuff.position.set(s * 2.3, -9.9, 3.2); cuff.rotation.x = 1.05;
    const wr = new THREE.Group(); wr.position.set(s * 2.25, -10.4, 3.9); wr.rotation.x = 1.05; piv.add(wr);
    const hand = new THREE.Group(); hand.position.y = -1.6; wr.add(hand);
    const c = mesh(cached('hand', () => new THREE.TorusGeometry(1.75, 1.05, 12, 24, Math.PI * 1.55).rotateZ(Math.PI * 0.72).rotateY(Math.PI / 2)), M.skin, hand); c.position.y = -0.4;
    arms.push(piv); wrists.push(wr); hands.push(hand);
  }
  // the minifig's own rest: arms a little forward
  const F = {
    root, body, legs, arms, wrists, hands, headP, spec, kid, height: (kid ? 1.15 : 1.5), faceState: '',
    // a pose: { x, y, z, yaw, tilt, roll, hipL, hipR, armL, armR, outL, outR, wristL, wristR, head }
    pose(p) {
      root.position.set(p.x || 0, p.y || 0, p.z || 0); root.rotation.set(0, p.yaw || 0, 0);
      body.rotation.set(p.tilt || 0, 0, p.roll || 0, 'YXZ');
      legs[0].rotation.x = p.hipR ?? 0; legs[1].rotation.x = p.hipL ?? 0; // (the figure's right leg is at -x)
      arms[0].rotation.x = p.armR ?? -0.2; arms[1].rotation.x = p.armL ?? -0.2; arms[0].rotation.z = -0.1 - (p.outR || 0); arms[1].rotation.z = 0.1 + (p.outL || 0);
      wrists[0].rotation.y = p.wristR || 0; wrists[1].rotation.y = p.wristL || 0;
      headP.rotation.y = p.head || 0;
    },
    face(f) { const k = JSON.stringify(f); if (k === F.faceState) return; F.faceState = k; drawFace(faceCanvas.getContext('2d'), f, spec); faceTex.needsUpdate = true; },
    handWorld(which = 'R') { const h = hands[which === 'R' ? 0 : 1]; return h; },
  };
  F.pose({}); F.face({});
  return F;
}

// ---------------------------------------------------------------- the printed face (on the front of the head's band)
export function drawFace(g, f, spec) {
  const W = 1024, H = 256, cx = W / 2, sk = spec.skinBrick || YELLOW, ink = '#1c1414';
  g.fillStyle = sk; g.fillRect(0, 0, W, H);
  // the band runs around the head: x from 0 to 1024 is all the way round; the face is in the middle third
  const ey = 116 - (f.eyesUp || 0) * 6, ex = 62, look = f.look || [0, 0], kid = spec.age === 'kid';
  g.lineCap = 'round'; g.lineJoin = 'round';
  if ((f.blush || 0) > 0.05 || spec.cheeks) { g.fillStyle = `rgba(240,120,110,${0.25 + 0.45 * (f.blush || 0)})`; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 86, 160, 26, 13, 0, 0, Math.PI * 2); g.fill(); } }
  if (spec.eyeShadow) { g.fillStyle = spec.eyeShadow; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * ex, ey - 10, 34, 22, s * 0.25, 0, Math.PI * 2); g.fill(); } }
  for (const s of [-1, 1]) {
    const x = cx + s * ex, blink = f.blink || 0, big = f.eyes ?? 1;
    if ((f.happy || 0) > 0.5) { g.strokeStyle = ink; g.lineWidth = 9; g.beginPath(); g.arc(x, ey + 10, 16, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); continue; }
    if (blink > 0.6) { g.strokeStyle = ink; g.lineWidth = 8; g.beginPath(); g.moveTo(x - 15, ey + 2); g.quadraticCurveTo(x, ey + 8, x + 15, ey + 2); g.stroke(); continue; }
    const rx = (kid ? 18 : 15) * (0.85 + 0.15 * big), ry = (kid ? 23 : 19) * big;
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x, ey, rx + 5, ry + 4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = ink; g.beginPath(); g.ellipse(x + look[0] * 5, ey - look[1] * 4, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x + look[0] * 5 + rx * 0.35, ey - look[1] * 4 - ry * 0.35, rx * 0.32, 0, Math.PI * 2); g.fill();
    if (spec.lashes) { g.strokeStyle = ink; g.lineWidth = 6; g.beginPath(); g.moveTo(x + s * rx, ey - ry * 0.6); g.lineTo(x + s * (rx + 10), ey - ry * 0.95); g.stroke(); }
  }
  // brows (a swordsman's: slanted up toward the temples, drawn in)
  const br = f.brow || 0, bi = (f.browIn || 0) + (spec.swordBrows ? 0.45 : 0); g.strokeStyle = spec.browColor || ink; g.lineWidth = 9;
  for (const s of [-1, 1]) { const x = cx + s * ex, y = ey - 44 - br * 10; g.beginPath(); g.moveTo(x - s * 22, y + bi * 9); g.quadraticCurveTo(x, y - 6 + Math.abs(bi) * 2, x + s * 20, y - bi * 5); g.stroke(); }
  if (spec.paint === 'demon') { g.strokeStyle = spec.paintColor || '#b8102a'; g.lineWidth = 9; for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(cx + s2 * 30, ey - 20); g.quadraticCurveTo(cx + s2 * 100, ey - 40, cx + s2 * 120, ey - 90); g.stroke(); g.beginPath(); g.moveTo(cx + s2 * 40, ey + 28); g.quadraticCurveTo(cx + s2 * 90, ey + 50, cx + s2 * 110, ey + 20); g.stroke(); } }
  if (spec.mark) { g.fillStyle = spec.markColor || '#d02a3a'; const my2 = ey - 62; g.beginPath(); if (spec.mark === 'lotus') { for (const a of [-0.5, 0, 0.5]) { g.save(); g.translate(cx, my2 + 8); g.rotate(a); g.ellipse(0, -10, 6, 14, 0, 0, Math.PI * 2); g.restore(); } } else { g.moveTo(cx, my2 - 16); g.quadraticCurveTo(cx + 9, my2, cx, my2 + 10); g.quadraticCurveTo(cx - 9, my2, cx, my2 - 16); } g.fill(); }
  if (spec.mask) { g.fillStyle = spec.mask; g.beginPath(); g.moveTo(cx - 150, ey - 30); g.quadraticCurveTo(cx, ey - 70, cx + 150, ey - 30); g.lineTo(cx + 130, ey + 34); g.quadraticCurveTo(cx, ey + 60, cx - 130, ey + 34); g.closePath(); g.fill(); g.fillStyle = '#1c1414'; for (const s2 of [-1, 1]) { g.beginPath(); g.ellipse(cx + s2 * ex, ey, 22, 12, 0, 0, Math.PI * 2); g.fill(); } }
  // glasses, wrinkles, freckles, printed on
  if (spec.glasses) { g.strokeStyle = spec.glasses; g.lineWidth = 7; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * ex, ey, 38, 0, Math.PI * 2); g.stroke(); } g.beginPath(); g.moveTo(cx - ex + 38, ey - 4); g.quadraticCurveTo(cx, ey - 14, cx + ex - 38, ey - 4); g.stroke(); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * (ex + 38), ey - 4); g.lineTo(cx + s * (ex + 80), ey - 10); g.stroke(); } }
  if (spec.age === 'elder') { g.strokeStyle = 'rgba(120,70,30,0.6)'; g.lineWidth = 4; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 70, 175); g.quadraticCurveTo(cx + s * 80, 190, cx + s * 74, 205); g.stroke(); } }
  // a beard and moustache, stubble, a scar across an eye
  if (spec.beard) { g.fillStyle = spec.beard; g.beginPath(); g.moveTo(cx - 120, 150); g.quadraticCurveTo(cx - 110, 250, cx, 256); g.quadraticCurveTo(cx + 110, 250, cx + 120, 150); g.quadraticCurveTo(cx + 80, 215, cx, 222); g.quadraticCurveTo(cx - 80, 215, cx - 120, 150); g.fill(); g.beginPath(); g.moveTo(cx - 70, 178); g.quadraticCurveTo(cx, 150, cx + 70, 178); g.quadraticCurveTo(cx, 166, cx - 70, 178); g.fill(); }
  if (spec.stubble) { g.fillStyle = 'rgba(60,40,30,0.35)'; let sd = 7; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647); for (let i = 0; i < 160; i++) { const a = r() * Math.PI, d = 70 + r() * 40; g.fillRect(cx + Math.cos(a) * d * 1.3, 150 + Math.sin(a) * d * 0.85, 3, 3); } }
  if (spec.scar) { const x = cx + ex, y = ey; g.strokeStyle = '#a0402a'; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 30, y - 60); g.lineTo(x + 34, y + 48); g.stroke(); g.lineWidth = 4; for (let k = -2; k <= 2; k++) { const px = x + 2 + k * 13, py = y - 6 + k * 21; g.beginPath(); g.moveTo(px - 9, py + 5); g.lineTo(px + 9, py - 5); g.stroke(); } }
  if (spec.mustache) { g.strokeStyle = spec.mustache; g.lineWidth = 8; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 6, 170); g.quadraticCurveTo(cx + s * 40, 158, cx + s * 66, 182); g.stroke(); } }
  // a mole, printed where the spec says (side: 1 is the figure's own right, which is the left of the band as we look at it)
  if (spec.mole) { const m = spec.mole, x = cx - (m.side ?? 1) * (m.x ?? 74), y = m.y ?? 158; g.fillStyle = '#3a2418'; g.beginPath(); g.arc(x, y, m.r ?? 7, 0, Math.PI * 2); g.fill(); }
  // the mouth: shut it is a curve that smiles or frowns; open, a dark shape the vowel shapes, teeth and tongue
  const M = f.mouth || {}, op = Math.max(0, Math.min(1, M.open || 0)), sm = M.smile ?? 0.4, rd = M.round || 0, wd = M.wide ?? 0.4, my = 186, mw = 42 + 30 * wd - 18 * rd;
  if (op < 0.08 && f.smirk) { const k = f.smirk; g.strokeStyle = ink; g.lineWidth = 9; g.beginPath(); g.moveTo(cx + mw * 0.9, my + 4); g.quadraticCurveTo(cx - mw * 0.1, my + 6, cx - mw * 1.05, my - 26 * k); g.stroke(); g.lineWidth = 5; g.beginPath(); g.moveTo(cx - mw * 1.05, my - 26 * k); g.lineTo(cx - mw * 1.15, my - 30 * k); g.stroke(); return; }
  if (op < 0.08) { g.strokeStyle = ink; g.lineWidth = 9; g.beginPath(); g.moveTo(cx - mw, my - sm * 10); g.quadraticCurveTo(cx, my + sm * 26, cx + mw, my - sm * 10); g.stroke(); return; }
  const mh = 12 + 46 * op * (1 + 0.25 * rd);
  g.beginPath(); g.moveTo(cx - mw, my - sm * 8); g.quadraticCurveTo(cx, my + sm * 8, cx + mw, my - sm * 8); g.quadraticCurveTo(cx + mw * 0.8, my + mh, cx, my + mh + sm * 10); g.quadraticCurveTo(cx - mw * 0.8, my + mh, cx - mw, my - sm * 8); g.closePath();
  g.fillStyle = '#5a1418'; g.fill(); g.save(); g.clip(); g.fillStyle = '#ffffff'; g.fillRect(cx - mw, my - sm * 8 - 4, mw * 2, 14 * Math.min(1, op * 2)); g.fillStyle = '#e8606c'; g.beginPath(); g.ellipse(cx, my + mh, mw * 0.55, mh * 0.4, 0, 0, Math.PI * 2); g.fill(); g.restore();
  g.strokeStyle = ink; g.lineWidth = 6; g.stroke();
}

function torsoPrint(spec) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d'), C = spec.colors || {}, t = spec.outfit?.top;
  g.fillStyle = C.top || '#3a7bd5'; g.fillRect(0, 0, 256, 256);
  const dark = 'rgba(0,0,0,0.28)', ink = '#1c1414';
  g.lineCap = 'round'; g.lineWidth = 5;
  if (t === 'hoodie') { g.strokeStyle = dark; g.beginPath(); g.moveTo(60, 120); g.lineTo(196, 120); g.lineTo(186, 70); g.moveTo(60, 120); g.lineTo(70, 70); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 6; for (const x of [112, 144]) { g.beginPath(); g.moveTo(x, 246); g.lineTo(x - 4, 190); g.stroke(); } g.fillStyle = dark; g.beginPath(); g.ellipse(128, 250, 70, 24, 0, Math.PI, 0); g.fill(); }
  if (t === 'tee' || !t) { g.strokeStyle = dark; g.lineWidth = 6; g.beginPath(); g.arc(128, 262, 40, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); g.fillStyle = '#ffffff'; g.font = 'bold 90px sans-serif'; g.textAlign = 'center'; g.fillText('★', 128, 150); }
  if (t === 'coat') { g.strokeStyle = dark; g.lineWidth = 6; g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.stroke(); g.fillStyle = '#f4e2b0'; for (const y of [70, 130, 190]) { g.beginPath(); g.arc(146, 256 - y, 9, 0, Math.PI * 2); g.fill(); } }
  if (t === 'robe') { // a wuxia robe: the outer robe crossed over the inner at the collar, trimmed, a sash at the waist, a pattern
    const R = spec.robe || {}, inner = R.inner || '#e8e8ee', trim = R.trim || '#c8a040', belt = R.belt || trim, ink = R.ink || 'rgba(255,255,255,0.25)';
    g.fillStyle = ink; for (let i = 0; i < 9; i++) { const x = 30 + (i * 67) % 200, y = 40 + (i * 89) % 170; g.beginPath(); g.arc(x, 256 - y, 9, 0, Math.PI * 2); g.arc(x + 12, 256 - y - 4, 7, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = inner; g.beginPath(); g.moveTo(72, 0); g.lineTo(184, 0); g.lineTo(128, 110); g.closePath(); g.fill();
    g.strokeStyle = trim; g.lineWidth = 16; g.beginPath(); g.moveTo(70, 0); g.lineTo(150, 150); g.lineTo(150, 256); g.stroke(); g.beginPath(); g.moveTo(186, 0); g.lineTo(140, 92); g.stroke();
    g.fillStyle = belt; g.fillRect(0, 214, 256, 30); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 242, 256, 4);
    if (R.tassel) { g.fillStyle = R.tassel; g.beginPath(); g.arc(196, 229, 9, 0, Math.PI * 2); g.fill(); }
  }
  if (spec.outfit?.apron) { g.fillStyle = spec.outfit.apron; g.beginPath(); g.moveTo(58, 0); g.lineTo(198, 0); g.lineTo(186, 160); g.lineTo(70, 160); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 4; g.stroke(); g.fillStyle = '#e8a0b0'; g.beginPath(); g.arc(128, 60, 14, 0, Math.PI * 2); g.fill(); }
  // the shape's uvs are in millimetres: x -7.8..7.8, y 0..12.8
  const t2 = new THREE.CanvasTexture(c); t2.colorSpace = THREE.SRGBColorSpace; t2.repeat.set(1 / 15.6, 1 / 12.8); t2.offset.set(0.5, 0); t2.wrapS = t2.wrapT = THREE.ClampToEdgeWrapping; return t2;
}

function hairpiece(spec, headP, M, mesh) {
  const st = spec.hair?.style || 'short', hat = spec.hat;
  const cap = (k = 1.0, top = 0.5) => { // the crown, and the hair coming down behind and at the sides to the level of the ears
    const g = new THREE.SphereGeometry(5.75 * k, 36, 18, 0, Math.PI * 2, 0, Math.PI * top); g.scale(1, 0.78, 1); const m = mesh(g, M.hair, headP);
    const back = mesh(new THREE.CylinderGeometry(5.8 * k, 5.8 * k, 4.4, 36, 1, true, Math.PI * 0.36, Math.PI * 1.28), M.hair, headP); back.position.y = 5.0; back.material = M.hair;
    M.hair.side = THREE.DoubleSide; return m; };
  if (st === 'spiky') {
    cap(1.0, 0.5).position.y = 7.0;
    for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2, r = 4.2, cone = mesh(new THREE.ConeGeometry(1.9, 4.4, 10), M.hair, headP); cone.position.set(Math.sin(a) * r, 9.4 + (i % 2) * 0.6, Math.cos(a) * r * 0.95 - 0.6); cone.rotation.set(Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9); }
    const fr = mesh(new THREE.SphereGeometry(5.9, 30, 12, Math.PI * 0.65, Math.PI * 0.7, Math.PI * 0.36, Math.PI * 0.14), M.hair, headP); fr.position.y = 5.8; // the fringe
  } else if (st === 'ponytail') {
    cap(1.0, 0.5).position.y = 7.0;
    const fr = mesh(new THREE.SphereGeometry(5.95, 30, 12, Math.PI * 0.6, Math.PI * 0.8, Math.PI * 0.34, Math.PI * 0.16), M.hair, headP); fr.position.y = 5.9;
    const tail = mesh(new THREE.CapsuleGeometry(2.0, 6.5, 6, 12), M.hair, headP); tail.position.set(-4.6, 7.0, -3.6); tail.rotation.set(0.5, 0, 0.6);
    if (spec.hair.clip) { const cl = mesh(rbox(3.2, 1.6, 1.4, 0.4), plastic(spec.hair.clip), headP); cl.position.set(3.4, 10.2, 3.2); cl.rotation.z = -0.5; }
    const tie = mesh(new THREE.TorusGeometry(1.7, 0.6, 8, 16), plastic('#e0404a'), headP); tie.position.set(-3.6, 8.8, -2.8); tie.rotation.set(1.2, 0, 0.6);
  } else if (st === 'bun') {
    cap(1.0, 0.5).position.y = 7.0; const b = mesh(new THREE.SphereGeometry(3.0, 20, 14), M.hair, headP); b.position.set(0, 11.6, -2.2);
  } else if (st !== 'bald') cap(1.0, 0.5).position.y = 7.0;
  if (hat?.type === 'cap') { const h = mesh(new THREE.SphereGeometry(6.0, 30, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), plastic(hat.color), headP); h.position.y = 6.8; const b = mesh(rbox(9, 0.8, 6, 0.4), plastic(hat.color), headP); b.position.set(0, 5.4, 5.4); }
}
