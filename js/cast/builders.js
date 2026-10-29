// The builder and her friend. 小建 Jian, the builder: a red bandana, a blue work shirt under a leather apron, a hammer
// that grows better (wood, copper, iron). 黑牙 Heiya, who fights: spiky white hair, a scowl, a dark purple coat, a red
// scarf; he hits things, mostly slimes.
import * as THREE from '../../lib/three.module.min.js';
import { makeFig, plastic, rbox } from '../brick/minifig.js';

const mk = (g, m, p) => { const o = new THREE.Mesh(g, m); o.castShadow = true; p.add(o); return o; };
export const BUILDER = {
  id: 'builder', name: { zh: '小建', en: 'Jian' },
  spec: { age: 'kid', cheeks: true, lashes: true, colors: { top: '#3a6ab8', bottom: '#4a3a2a', shoes: '#5a3a20' }, outfit: { top: 'coat', bottom: 'pants', apron: '#8a5a32' }, hair: { style: 'ponytail', color: '#4a2a14', clip: '#c8282a' } },
  build(scene) {
    const F = makeFig(BUILDER.spec), band = mk(new THREE.CylinderGeometry(6.0, 6.0, 1.6, 26, 1, true), plastic('#c8282a'), F.headP); band.position.y = 6.6; band.material.side = THREE.DoubleSide;
    const grip = new THREE.Group(); grip.rotation.x = Math.PI / 2 - 1.05; F.hands[0].add(grip);
    const handle = mk(new THREE.CylinderGeometry(0.7, 0.7, 13, 8), plastic('#8a5a32'), grip); handle.position.y = 4;
    const head = mk(rbox(7.5, 3.6, 3.6, 0.6), plastic('#a8743a'), grip); head.position.y = 10.5;
    const setTool = (p) => { head.material = plastic(p >= 3 ? '#c8ccd4' : p === 2 ? '#d8803a' : '#a8743a', { metalness: p >= 2 ? 0.7 : 0, roughness: p >= 2 ? 0.3 : 0.5 }); };
    scene?.add(F.root); return { F, grip, setTool, remove() { F.root.parent?.remove(F.root); } };
  },
};
export const HEIYA = {
  id: 'heiya', name: { zh: '黑牙', en: 'Heiya' },
  spec: { age: 'kid', swordBrows: true, colors: { top: '#3a2448', bottom: '#1a1420', shoes: '#141014' }, outfit: { top: 'coat', bottom: 'pants' }, hair: { style: 'spiky', color: '#e8e8f2' } },
  build(scene) {
    const F = makeFig(HEIYA.spec), scarf = mk(new THREE.TorusGeometry(4.6, 1.2, 8, 20), plastic('#c8282a'), F.body); scarf.position.y = 25.2; scarf.rotation.x = Math.PI / 2;
    const tail = mk(rbox(2.4, 7, 0.8, 0.3), plastic('#c8282a'), F.body); tail.position.set(-3, 21, -4.2); tail.rotation.z = 0.3;
    scene?.add(F.root); return { F, tail, remove() { F.root.parent?.remove(F.root); } };
  },
};
