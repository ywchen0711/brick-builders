// (Brick Builders: ores, farmland, thatch and red brick added.)
// The world in bricks: a grid of 1×1 bricks (each 0.6 wide and tall, the size of 2×2 studs), stored as one byte each.
// It is drawn in chunks of 32×32 columns: only the faces that touch air (or water) are made, each tinted the brick's
// colour (a touch lighter or darker brick to brick, like a real build), shaded by its side, and edged with a bevel so
// every brick reads as a brick. Every top is painted with its studs; real ones stand on the bricks near the player.
//   const V = new Voxels(W, H, D); V.set(x, y, z, B.GRASS); V.mesh(scene); V.studsNear(px, pz)
import * as THREE from '../lib/three.module.min.js';

export const VS = 0.6; // a brick, in world units (a minifig stands 1.5)
export const B = { AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4, WATER: 5, WOOD: 6, PLANK: 7, ROOF: 8, WALL: 9, RED: 10, GOLD: 11, BAMBOO: 12, LEAF: 13, LEAF2: 14, PATH: 15, GREY: 16, BLOSSOM: 17, MOSS: 18, CLIFF: 19, GLOW: 20, DARK: 21, SNOW: 22, JADE: 23, PAPER: 24, REED: 25, BAMLEAF: 26, CLAY: 27, RUST: 28, MAPLE: 29, CRACK: 30, COPPER: 31, IRON: 32, COAL: 33, FARM: 34, STRAW: 35, BRICK: 36 };
export const COLOR = {
  [B.GRASS]: '#5a9a3e', [B.DIRT]: '#8a6440', [B.STONE]: '#8a8a86', [B.SAND]: '#d8c48a', [B.WATER]: '#3a7ab8', [B.WOOD]: '#5a3a24', [B.PLANK]: '#9a6a3e', [B.ROOF]: '#30343e',
  [B.WALL]: '#e6e0d2', [B.RED]: '#b0281e', [B.GOLD]: '#d8a838', [B.BAMBOO]: '#7ab048', [B.LEAF]: '#2e6e34', [B.LEAF2]: '#3e8a3a', [B.PATH]: '#a89c84', [B.GREY]: '#6e6e6a',
  [B.BLOSSOM]: '#f0a8c0', [B.MOSS]: '#4a6a34', [B.CLIFF]: '#b0644a', [B.GLOW]: '#ffcf70', [B.DARK]: '#2a2a2e', [B.SNOW]: '#f2f4f6', [B.JADE]: '#3ab08a', [B.PAPER]: '#f0e6cc',
  [B.REED]: '#a8b060', [B.BAMLEAF]: '#5aa040', [B.CLAY]: '#b8683e', [B.RUST]: '#8a4030', [B.MAPLE]: '#d8582a', [B.CRACK]: '#857a6a',
  [B.COPPER]: '#c8743a', [B.IRON]: '#c8b4a4', [B.COAL]: '#34343a', [B.FARM]: '#5a3a20', [B.STRAW]: '#d8b860', [B.BRICK]: '#b4503e',
};
export const SOLID = (b) => b !== B.AIR && b !== B.WATER && b !== B.REED;
const SEE = (b) => b === B.AIR || b === B.WATER || b === B.REED || b === B.GLOW; // faces next to these are drawn
const hash = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

let bevel = null;
function bevelTex() { // a brick face: light in the middle, a darker rim, the soft shine of plastic
  if (bevel) return bevel; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64); g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 61, 61);
  g.strokeStyle = 'rgba(255,255,255,0.0)'; const gr = g.createLinearGradient(0, 0, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.16)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.08)'); g.fillStyle = gr; g.fillRect(3, 3, 58, 58);
  bevel = new THREE.CanvasTexture(c); bevel.colorSpace = THREE.SRGBColorSpace; bevel.anisotropy = 8; return bevel;
}
// the top of a brick: the same face with its four studs painted on (lit from the upper left, a soft shadow to the lower
// right), so the ground far off already reads as bricks; near the player the real studs stand on these very spots
let studTop = null;
function studTex() {
  if (studTop) return studTop; const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  g.drawImage(bevelTex().image, 0, 0, N, N); const r = N * 0.15;
  for (const [u, v] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
    const x = u * N, y = v * N;
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.arc(x + r * 0.28, y + r * 0.28, r * 1.08, 0, Math.PI * 2); g.fill(); // the shadow it casts
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.75, '#f4f4f4'); gr.addColorStop(1, '#d8d8d8');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = N / 96; g.stroke(); // its rim
  }
  studTop = new THREE.CanvasTexture(c); studTop.colorSpace = THREE.SRGBColorSpace; studTop.anisotropy = 16; return studTop;
}
// the six faces: normal, the four corners (as offsets in the cell), and the side's shade
const FACES = [
  { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], s: 1.0 }, { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], s: 0.5 },
  { n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], s: 0.8 }, { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], s: 0.72 },
  { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], s: 0.88 }, { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], s: 0.66 },
];
const UV = [[0, 0], [1, 0], [1, 1], [0, 1]];

export class Voxels {
  constructor(W, H, D) { this.W = W; this.H = H; this.D = D; this.a = new Uint8Array(W * H * D); this.CH = 32; this.chunks = new Map(); this.dirty = new Set(); }
  idx(x, y, z) { return (y * this.D + z) * this.W + x; }
  get(x, y, z) { if (x < 0 || z < 0 || x >= this.W || z >= this.D || y < 0) return y < 0 ? B.STONE : B.AIR; if (y >= this.H) return B.AIR; return this.a[(y * this.D + z) * this.W + x]; }
  set(x, y, z, b) { if (x < 0 || z < 0 || y < 0 || x >= this.W || z >= this.D || y >= this.H) return; this.a[(y * this.D + z) * this.W + x] = b; }
  // the height of the first air above the ground at a column (where you would stand)
  top(x, z) { for (let y = this.H - 1; y >= 0; y--) if (SOLID(this.get(x, y, z))) return y + 1; return 0; }
  topAny(x, z) { for (let y = this.H - 1; y >= 0; y--) if (this.get(x, y, z) !== B.AIR) return y + 1; return 0; }
  fill(x0, y0, z0, x1, y1, z1, b) { for (let y = Math.max(0, y0); y <= Math.min(this.H - 1, y1); y++) for (let z = Math.max(0, z0); z <= Math.min(this.D - 1, z1); z++) for (let x = Math.max(0, x0); x <= Math.min(this.W - 1, x1); x++) this.a[(y * this.D + z) * this.W + x] = b; }
  // ---------------------------------------------------------------- drawing
  buildChunk(cx, cz) {
    const C = this.CH, pos = [], col = [], uv = [], idx = [], tidx = [], wpos = [], widx = [], color = new THREE.Color(), tint = new THREE.Color();
    for (let z = cz * C; z < Math.min(this.D, cz * C + C); z++) for (let x = cx * C; x < Math.min(this.W, cx * C + C); x++) {
      for (let y = 0; y < this.H; y++) {
        const b = this.a[(y * this.D + z) * this.W + x]; if (b === B.AIR) continue;
        if (b === B.WATER) { if (this.get(x, y + 1, z) === B.AIR) { const v = wpos.length / 3; wpos.push(x, y + 0.88, z + 1, x + 1, y + 0.88, z + 1, x + 1, y + 0.88, z, x, y + 0.88, z); widx.push(v, v + 1, v + 2, v, v + 2, v + 3); } continue; }
        color.set(COLOR[b] || '#ff00ff'); const r = hash(x, y, z), k = 0.92 + r * 0.14; // brick to brick, a little lighter or darker
        for (const F of FACES) {
          const nb = this.get(x + F.n[0], y + F.n[1], z + F.n[2]); if (!SEE(nb) || (b === nb)) continue;
          const v = pos.length / 3; tint.copy(color).multiplyScalar(F.s * k);
          for (let i = 0; i < 4; i++) { const c = F.c[i]; pos.push(x + c[0], y + c[1], z + c[2]); col.push(tint.r, tint.g, tint.b); uv.push(UV[i][0], UV[i][1]); }
          (F.n[1] === 1 && b !== B.LEAF && b !== B.LEAF2 && b !== B.BAMLEAF && b !== B.ROOF ? tidx : idx).push(v, v + 1, v + 2, v, v + 2, v + 3);
        }
      }
    }
    const G = new THREE.Group();
    const nSide = idx.length; for (const i of tidx) idx.push(i);
    if (idx.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.addGroup(0, nSide, 0); g.addGroup(nSide, tidx.length, 1); g.computeVertexNormals(); g.computeBoundingSphere();
      this.mat ||= new THREE.MeshLambertMaterial({ vertexColors: true, map: bevelTex() }); this.tmat ||= new THREE.MeshLambertMaterial({ vertexColors: true, map: studTex() });
      const m = new THREE.Mesh(g, [this.mat, this.tmat]); m.castShadow = true; m.receiveShadow = true; G.add(m); }
    if (widx.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(wpos, 3)); g.setIndex(widx); g.computeVertexNormals(); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, this.wmat ||= new THREE.MeshPhongMaterial({ color: '#3a7cc0', transparent: true, opacity: 0.78, shininess: 30, specular: '#3a5a7a', depthWrite: false })); m.renderOrder = 2; G.add(m); }
    G.scale.setScalar(VS); return G;
  }
  mesh(scene, onProgress) { // everything, chunk by chunk
    const N = Math.ceil(this.W / this.CH), M = Math.ceil(this.D / this.CH);
    for (let cz = 0; cz < M; cz++) for (let cx = 0; cx < N; cx++) { const G = this.buildChunk(cx, cz); scene.add(G); this.chunks.set(cx + ',' + cz, G); onProgress?.((cz * N + cx + 1) / (N * M)); }
    this.scene = scene;
  }
  // a brick changed (broken, or built): redraw its chunk (and its neighbour if it sits on an edge)
  touch(x, z) { const C = this.CH; for (const [dx, dz] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) { const k = Math.floor((x + dx) / C) + ',' + Math.floor((z + dz) / C); if (this.chunks.has(k)) this.dirty.add(k); } }
  flush() { for (const k of this.dirty) { const [cx, cz] = k.split(',').map(Number), old = this.chunks.get(k); this.scene.remove(old); old.traverse((o) => o.geometry?.dispose()); const G = this.buildChunk(cx, cz); this.scene.add(G); this.chunks.set(k, G); } if (this.dirty.size) this.studKey = null; this.dirty.clear(); }
  // ---------------------------------------------------------------- the studs, near the player
  studsNear(scene, px, pz, R = 40) {
    const key = Math.round(px / 6) + ',' + Math.round(pz / 6); if (key === this.studKey) return; this.studKey = key;
    if (!this.studs) { const g = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 12); g.translate(0, 0.05, 0); this.studs = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ vertexColors: false }), 32000); this.studs.castShadow = false; this.studs.receiveShadow = true; this.studs.frustumCulled = false; this.studs.scale.setScalar(VS); scene.add(this.studs); }
    const m = new THREE.Matrix4(), c = new THREE.Color(); let n = 0, cap = 32000;
    const x0 = Math.max(0, Math.floor(px - R)), x1 = Math.min(this.W - 1, Math.ceil(px + R)), z0 = Math.max(0, Math.floor(pz - R)), z1 = Math.min(this.D - 1, Math.ceil(pz + R));
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if ((x - px) ** 2 + (z - pz) ** 2 > R * R) continue;
      const y = this.top(x, z), b = this.get(x, y - 1, z); if (!SOLID(b) || b === B.LEAF || b === B.LEAF2 || b === B.BAMLEAF || b === B.ROOF) continue;
      const k = (0.92 + hash(x, y - 1, z) * 0.14) * 1.02; c.set(COLOR[b]).multiplyScalar(k);
      for (const [dx, dz] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) { if (n >= cap) break; m.makeTranslation(x + dx, y, z + dz); this.studs.setMatrixAt(n, m); this.studs.setColorAt(n, c); n++; }
    }
    this.studs.count = n; this.studs.instanceMatrix.needsUpdate = true; if (this.studs.instanceColor) this.studs.instanceColor.needsUpdate = true;
  }
}
