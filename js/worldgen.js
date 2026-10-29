// 空蕩島 Empty Isle: an island of bricks, 192 × 192 across, risen out of the sea. A beach of sand all round, meadows in
// the middle (grass over dirt over stone, flowers, the odd tree), a wood of tall trees to the west, rocky hills to the
// north-east where the stone shows and copper, iron and coal lie in it, a pond with clay on its banks, and on the
// meadow where you wake the broken stones of a village that was. All of it can be broken and built on.
//   const W = buildWorld(seed)  ->  { V, start, hills, pond, wood, ruins }
import { Voxels, B } from './voxel.js';

export const W = 192, D = 192, H = 56, WL = 12;
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function noise2(seed) { // smooth value noise, a few octaves
  const R = rng(seed), N = 64, g = new Float32Array(N * N); for (let i = 0; i < g.length; i++) g[i] = R();
  const at = (x, z) => g[((z % N + N) % N) * N + ((x % N + N) % N)], sm = (t) => t * t * (3 - 2 * t);
  const one = (x, z) => { const x0 = Math.floor(x), z0 = Math.floor(z), fx = sm(x - x0), fz = sm(z - z0); return (at(x0, z0) * (1 - fx) + at(x0 + 1, z0) * fx) * (1 - fz) + (at(x0, z0 + 1) * (1 - fx) + at(x0 + 1, z0 + 1) * fx) * fz; };
  return (x, z) => one(x / 24, z / 24) * 0.55 + one(x / 11 + 17, z / 11 + 5) * 0.3 + one(x / 5 + 31, z / 5 + 13) * 0.15;
}
export function buildWorld(seed = 7) {
  const V = new Voxels(W, H, D), R = rng(seed * 31 + 1), n = noise2(seed), n2 = noise2(seed + 99);
  const start = [96, 110], hills = [138, 54], pond = [62, 128], wood = [44, 70], ruins = [104, 100];
  const Hm = new Int16Array(W * D), dist = (x, z, p) => Math.hypot(x - p[0], z - p[1]);
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const e = Math.hypot((x - W / 2) / (W / 2), (z - D / 2) / (D / 2)), island = 1 - Math.min(1, Math.max(0, (e - 0.62) / 0.3)); // the shore
    let h = WL - 6 + island * (8 + n(x, z) * 6);
    const hk = Math.max(0, 1 - dist(x, z, hills) / 42); h += hk * hk * 26 + hk * n2(x * 2, z * 2) * 8; // the hills
    const pk = Math.max(0, 1 - dist(x, z, pond) / 13); if (pk > 0) h = Math.min(h, WL + 1 - pk * 6); // the pond
    const sk = Math.max(0, 1 - dist(x, z, start) / 18); h = h * (1 - sk * 0.7) + (WL + 3) * sk * 0.7; // a flattish meadow where you wake
    Hm[z * W + x] = Math.max(2, Math.min(H - 6, Math.round(h)));
  }
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const h = Hm[z * W + x], rocky = dist(x, z, hills) < 34 && h > WL + 9, beach = h <= WL + 1, clayBank = dist(x, z, pond) < 16 && h <= WL + 2;
    for (let y = 0; y < h; y++) {
      let b = y < h - 4 ? B.STONE : y < h - 1 ? B.DIRT : B.GRASS;
      if (rocky && y >= h - 2) b = B.STONE; if (beach && y >= h - 3) b = B.SAND; if (clayBank && y >= h - 2) b = B.CLAY;
      if (b === B.STONE && y < h - 1) { const r = R(), deep = (h - y) / h; if (r < 0.012 + (rocky ? 0.02 : 0)) b = B.COAL; else if (r < 0.02 + (rocky ? 0.03 : 0)) b = B.COPPER; else if (r < 0.024 + (rocky ? 0.02 * deep + 0.006 : 0)) b = B.IRON; }
      V.a[(y * D + z) * W + x] = b;
    }
    for (let y = h; y <= WL; y++) V.a[(y * D + z) * W + x] = B.WATER;
  }
  // ore showing on the hillsides, so there is some to find without digging
  for (let k = 0; k < 260; k++) { const a = R() * Math.PI * 2, r = R() * 30, x = Math.round(hills[0] + Math.cos(a) * r), z = Math.round(hills[1] + Math.sin(a) * r), y = V.top(x, z) - 1; if (V.get(x, y, z) !== B.STONE) continue; const ore = [B.COPPER, B.COPPER, B.IRON, B.COAL, B.COAL][Math.floor(R() * 5)]; for (let i = 0; i < 3; i++) V.set(x + Math.floor(R() * 2), y - Math.floor(R() * 2), z + Math.floor(R() * 2), ore); }
  // trees: tall in the wood, few on the meadow, none on the beach or the hills' bare rock
  const tree = (x, z, tall) => { const y0 = V.top(x, z); if (V.get(x, y0 - 1, z) !== B.GRASS) return; const h = tall ? 6 + Math.floor(R() * 3) : 4 + Math.floor(R() * 2); for (let y = 0; y < h; y++) V.set(x, y0 + y, z, B.WOOD);
    for (let dy = -2; dy <= 1; dy++) { const r = dy === 1 ? 1 : 2; for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { if (Math.abs(dx) + Math.abs(dz) > r + 1 || (dx === 0 && dz === 0 && dy < 1)) continue; if (V.get(x + dx, y0 + h + dy, z + dz) === B.AIR) V.set(x + dx, y0 + h + dy, z + dz, R() < 0.5 ? B.LEAF : B.LEAF2); } } };
  for (let k = 0; k < 900; k++) { const x = Math.floor(R() * W), z = Math.floor(R() * D), dw = dist(x, z, wood), ds = dist(x, z, start); if (ds < 12) continue; if (dw < 34 ? R() < 0.7 : R() < 0.06) tree(x, z, dw < 34); }
  // flowers and tall grass to break for seeds
  for (let k = 0; k < 520; k++) { const x = Math.floor(R() * W), z = Math.floor(R() * D), y = V.top(x, z); if (V.get(x, y - 1, z) !== B.GRASS || V.get(x, y, z) !== B.AIR) continue; V.set(x, y, z, B.REED); }
  // the broken stones of the old village
  for (const [x, z, w, d] of [[ruins[0], ruins[1], 6, 5], [ruins[0] + 10, ruins[1] - 3, 4, 4], [ruins[0] - 4, ruins[1] + 9, 5, 3]]) {
    const y0 = V.top(x, z); for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) { if (i > 0 && i < w - 1 && j > 0 && j < d - 1) continue; const hh = Math.floor(R() * 3); for (let y = 0; y < hh; y++) V.set(x + i, y0 + y, z + j, R() < 0.3 ? B.MOSS : B.GREY); }
  }
  const sy = V.top(start[0], start[1]);
  return { V, start: { x: start[0] + 0.5, y: sy, z: start[1] + 0.5 }, hills, pond, wood, ruins, seed };
}
