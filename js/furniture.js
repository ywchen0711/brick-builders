// The furniture and the growing things, built of bricks: each made in a cell's own units (a cell is 1 × 1 × 1, the
// floor at y = 0), facing +z, for the game to scale and turn into place. And the slimes.
import * as THREE from '../lib/three.module.min.js';

const mats = {}; const M = (c, o = {}) => (mats[c + JSON.stringify(o)] ||= new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, ...o }));
const stud = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
function box(g, w, h, d, c, x, y, z, o) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, o)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; }
function studs(g, w, d, y, c, x0 = 0, z0 = 0) { for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) { const s = new THREE.Mesh(stud, M(c)); s.position.set(x0 + (i - (w - 1) / 2) * 0.32, y + 0.04, z0 + (j - (d - 1) / 2) * 0.32); g.add(s); } }
export function makeFurn(type) {
  const g = new THREE.Group();
  if (type === 'workbench') { box(g, 0.9, 0.12, 0.7, '#a8743a', 0, 0.62, 0); for (const [x, z] of [[-0.38, -0.28], [0.38, -0.28], [-0.38, 0.28], [0.38, 0.28]]) box(g, 0.1, 0.56, 0.1, '#6a4428', x, 0.28, z); box(g, 0.3, 0.08, 0.1, '#8a8e96', -0.15, 0.72, 0.1, { metalness: 0.6 }); box(g, 0.08, 0.06, 0.3, '#6a4428', 0.25, 0.71, -0.05); studs(g, 2, 2, 0.68, '#b8844a', 0.2, -0.15); }
  if (type === 'bed') { box(g, 0.9, 0.3, 1.8, '#d8b860', 0, 0.2, 0.4); box(g, 0.92, 0.1, 1.82, '#6a4428', 0, 0.04, 0.4); box(g, 0.6, 0.14, 0.4, '#f4f0e6', 0, 0.42, -0.25); box(g, 0.92, 0.5, 0.1, '#6a4428', 0, 0.3, -0.5); box(g, 0.84, 0.06, 1.0, '#c84a3a', 0, 0.37, 0.8); }
  if (type === 'door') { box(g, 0.9, 1.9, 0.12, '#8a5a32', 0, 0.95, 0); box(g, 0.94, 0.08, 0.16, '#5a3a20', 0, 1.9, 0); for (const y of [0.45, 1.4]) box(g, 0.86, 0.06, 0.15, '#5a3a20', 0, y, 0); const k = box(g, 0.08, 0.08, 0.2, '#d8a838', 0.32, 0.95, 0, { metalness: 0.6 }); void k; g.userData.panel = g.children[0]; }
  if (type === 'table') { box(g, 0.95, 0.1, 0.95, '#9a6a3e', 0, 0.68, 0); for (const [x, z] of [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]]) box(g, 0.1, 0.64, 0.1, '#6a4428', x, 0.32, z); studs(g, 3, 3, 0.73, '#a8744a'); }
  if (type === 'chair') { box(g, 0.55, 0.08, 0.55, '#9a6a3e', 0, 0.42, 0); for (const [x, z] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) box(g, 0.07, 0.4, 0.07, '#6a4428', x, 0.2, z); box(g, 0.55, 0.5, 0.07, '#9a6a3e', 0, 0.7, -0.24); }
  if (type === 'torch') { box(g, 0.08, 0.7, 0.08, '#6a4428', 0, 0.35, 0); const f = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 8), new THREE.MeshBasicMaterial({ color: '#ffb03a' })); f.position.y = 0.8; g.add(f); g.userData.flame = f; g.userData.light = '#ffa040'; }
  if (type === 'pot') { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.3, 0.42, 18), M('#3a3a40', { metalness: 0.5 })); m.position.y = 0.42; m.castShadow = true; g.add(m); const soup = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.02, 18), M('#c8803a')); soup.position.y = 0.62; g.add(soup); for (const [x, z] of [[-0.25, 0], [0.25, 0], [0, 0.25]]) box(g, 0.12, 0.22, 0.12, '#6a6a66', x, 0.1, z); const fire = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.2, 8), new THREE.MeshBasicMaterial({ color: '#ff7a2a' })); fire.position.y = 0.12; g.add(fire); g.userData.flame = fire; g.userData.light = '#ff7a3a'; }
  if (type === 'chest') { box(g, 0.8, 0.45, 0.55, '#8a4a1a', 0, 0.23, 0); box(g, 0.84, 0.15, 0.58, '#a85a24', 0, 0.52, 0); box(g, 0.86, 0.06, 0.6, '#d8a838', 0, 0.45, 0, { metalness: 0.6 }); box(g, 0.12, 0.14, 0.04, '#d8a838', 0, 0.4, 0.3, { metalness: 0.6 }); }
  if (type === 'plant') { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.3, 14), M('#b8683e')); p.position.y = 0.15; g.add(p); for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), M(i % 2 ? '#3a8a3a' : '#4aa04a')); l.position.set(Math.cos(i * 1.3) * 0.12, 0.42 + (i % 3) * 0.1, Math.sin(i * 1.3) * 0.12); g.add(l); } }
  if (type === 'lantern') { box(g, 0.1, 0.9, 0.1, '#3a3a40', 0, 0.45, 0); const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), new THREE.MeshStandardMaterial({ color: '#ff5a32', emissive: '#ff6a3a', emissiveIntensity: 1.2 })); l.position.y = 1.05; l.scale.y = 1.2; g.add(l); box(g, 0.3, 0.06, 0.3, '#d8a838', 0, 1.3, 0); g.userData.light = '#ff8a50'; }
  if (type === 'rug') { box(g, 0.98, 0.04, 0.98, '#8a4ab0', 0, 0.02, 0); box(g, 0.7, 0.045, 0.7, '#c87ae0', 0, 0.025, 0); }
  if (type === 'shelf') { box(g, 0.9, 1.6, 0.4, '#6a4428', 0, 0.8, -0.25); for (const y of [0.45, 0.95, 1.4]) for (let i = 0; i < 5; i++) box(g, 0.12, 0.34, 0.26, ['#c84a3a', '#3a6ab8', '#d8a838', '#3a8a4a', '#8a4ab0'][(i + Math.round(y * 3)) % 5], -0.3 + i * 0.15, y, -0.2); }
  return g;
}
// which furniture you cannot walk through, and how tall
export const FURN_SOLID = { workbench: 0.8, bed: 0.5, table: 0.8, chest: 0.6, pot: 0.7, shelf: 1.7 };
// a cabbage, in three stages
export function makeCrop(stage) {
  const g = new THREE.Group(); if (stage === 0) { for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 5), M('#6ac04a')); s.position.set((i - 1) * 0.15, 0.09, (i % 2) * 0.1); g.add(s); } return g; }
  const n = stage === 1 ? 4 : 7, r = stage === 1 ? 0.14 : 0.24; for (let i = 0; i < n; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), M(i % 2 ? '#7ac850' : '#5aa83a')); const a = i / n * Math.PI * 2; l.position.set(Math.cos(a) * r * 0.6, r * 0.8, Math.sin(a) * r * 0.6); l.scale.y = 0.7; g.add(l); }
  if (stage === 2) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), M('#c8e890')); c.position.y = 0.26; g.add(c); } return g;
}
// a slime: a blue jelly with a little top knot, big eyes and a smile
export function makeSlime(color = '#3a8ae0') {
  const g = new THREE.Group(), body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 14), new THREE.MeshPhysicalMaterial({ color, roughness: 0.15, clearcoat: 1, transmission: 0.15 }));
  body.scale.set(1, 0.8, 1); body.position.y = 0.34; body.castShadow = true; g.add(body); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 10), body.material); tip.position.y = 0.72; tip.rotation.z = 0.3; g.add(tip);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), M('#ffffff')); e.position.set(s * 0.14, 0.42, 0.34); g.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), M('#141414')); p.position.set(s * 0.14, 0.42, 0.4); g.add(p); }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 12, Math.PI), M('#c8283a')); mouth.position.set(0, 0.3, 0.37); mouth.rotation.z = Math.PI; g.add(mouth);
  g.userData.body = body; return g;
}
