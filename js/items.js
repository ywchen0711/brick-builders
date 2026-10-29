// What there is to have, to make, and to build. Every item: a name, an icon, and what it is —
//   block: the brick it lays;  furn: a piece of furniture it sets down;  food: health it gives;  tool: hammer power;
//   seed: it is sown on farmland.  Blocks broken give what DROP says.
import { B } from './voxel.js';

export const ITEMS = {
  // what the land gives
  dirt: { zh: '土塊', en: 'Earth', icon: '🟫', block: B.DIRT }, wood: { zh: '木材', en: 'Wood', icon: '🪵', block: B.WOOD }, branch: { zh: '樹枝', en: 'Branch', icon: '🌿' },
  stone: { zh: '石頭', en: 'Stone', icon: '🪨', block: B.STONE }, sand: { zh: '沙', en: 'Sand', icon: '🏖️', block: B.SAND }, clay: { zh: '黏土', en: 'Clay', icon: '🧱', block: B.CLAY },
  copper: { zh: '銅礦', en: 'Copper ore', icon: '🟠' }, iron: { zh: '鐵礦', en: 'Iron ore', icon: '⚪' }, coal: { zh: '煤', en: 'Coal', icon: '⚫' },
  seed: { zh: '種子', en: 'Seeds', icon: '🌱', seed: true }, slime: { zh: '黏液', en: 'Slime goo', icon: '💧' }, cabbage: { zh: '高麗菜', en: 'Cabbage', icon: '🥬', food: 3 },
  // what you make
  plank: { zh: '木板', en: 'Planks', icon: '🟧', block: B.PLANK }, brick: { zh: '石磚', en: 'Stone brick', icon: '⬜', block: B.GREY }, plaster: { zh: '白牆', en: 'Plaster', icon: '🤍', block: B.WALL },
  straw: { zh: '茅草', en: 'Thatch', icon: '🟨', block: B.STRAW }, redbrick: { zh: '紅磚', en: 'Red brick', icon: '🟥', block: B.BRICK }, tile: { zh: '屋瓦', en: 'Roof tile', icon: '⬛', block: B.ROOF },
  farmland: { zh: '田地', en: 'Farmland', icon: '🟤', block: B.FARM }, path: { zh: '石板路', en: 'Paving', icon: '🔲', block: B.PATH },
  workbench: { zh: '工作台', en: 'Workbench', icon: '🛠️', furn: 'workbench' }, bed: { zh: '稻草床', en: 'Straw bed', icon: '🛏️', furn: 'bed' }, door: { zh: '木門', en: 'Wooden door', icon: '🚪', furn: 'door' },
  table: { zh: '木桌', en: 'Table', icon: '🪑', furn: 'table' }, chair: { zh: '木椅', en: 'Chair', icon: '💺', furn: 'chair' }, torch: { zh: '火把', en: 'Torch', icon: '🔥', furn: 'torch' },
  pot: { zh: '大鍋', en: 'Cooking pot', icon: '🍲', furn: 'pot' }, chest: { zh: '木箱', en: 'Chest', icon: '🧰', furn: 'chest' }, plant: { zh: '盆栽', en: 'Potted plant', icon: '🪴', furn: 'plant' },
  lantern: { zh: '燈籠', en: 'Lantern', icon: '🏮', furn: 'lantern' }, rug: { zh: '地毯', en: 'Rug', icon: '🟪', furn: 'rug' }, shelf: { zh: '書架', en: 'Bookshelf', icon: '📚', furn: 'shelf' },
  copperHammer: { zh: '銅鎚', en: 'Copper hammer', icon: '🔨', tool: 2 }, ironHammer: { zh: '鐵鎚', en: 'Iron hammer', icon: '⚒️', tool: 3 },
  soup: { zh: '蔬菜湯', en: 'Vegetable soup', icon: '🥣', food: 7 }, bread: { zh: '烤餅', en: 'Flatbread', icon: '🫓', food: 4 },
};
// what breaking a brick gives: an item (and sometimes another); how many blows it takes with a bare hammer
export const DROP = {
  [B.GRASS]: ['dirt', 1, ['seed', 0.12]], [B.DIRT]: ['dirt', 1], [B.FARM]: ['dirt', 1], [B.STONE]: ['stone', 2], [B.SAND]: ['sand', 1], [B.CLAY]: ['clay', 1],
  [B.WOOD]: ['wood', 2], [B.LEAF]: ['branch', 1, ['seed', 0.08]], [B.LEAF2]: ['branch', 1, ['seed', 0.08]], [B.REED]: [null, 0.5, ['seed', 0.4]],
  [B.COPPER]: ['copper', 3], [B.IRON]: ['iron', 4], [B.COAL]: ['coal', 3], [B.PLANK]: ['plank', 1], [B.GREY]: ['brick', 2], [B.WALL]: ['plaster', 2],
  [B.STRAW]: ['straw', 1], [B.BRICK]: ['redbrick', 2], [B.ROOF]: ['tile', 2], [B.PATH]: ['path', 2], [B.MOSS]: ['stone', 2], [B.BLOSSOM]: [null, 0.5, ['seed', 0.5]], [B.MAPLE]: [null, 0.5, ['seed', 0.5]], [B.GOLD]: [null, 0.5, ['seed', 0.5]],
};
// recipes: [what, how many, { needs }, base level]; the workbench is the one you can make with your own hands
export const RECIPES = [
  ['workbench', 1, { wood: 3 }, 1, true],
  ['plank', 4, { wood: 1 }, 1], ['door', 1, { plank: 3 }, 1], ['bed', 1, { branch: 3, wood: 2 }, 1], ['torch', 2, { branch: 1, wood: 1 }, 1], ['table', 1, { plank: 3 }, 1], ['chair', 1, { plank: 2 }, 1],
  ['brick', 4, { stone: 2 }, 1], ['farmland', 2, { dirt: 2 }, 1], ['straw', 4, { branch: 2 }, 1],
  ['chest', 1, { plank: 4 }, 2], ['pot', 1, { stone: 4, copper: 1 }, 2], ['copperHammer', 1, { copper: 3, wood: 1 }, 2], ['plaster', 4, { sand: 2, stone: 1 }, 2], ['plant', 1, { clay: 2, seed: 1 }, 2], ['path', 4, { stone: 3 }, 2],
  ['ironHammer', 1, { iron: 3, coal: 1, wood: 1 }, 3], ['lantern', 1, { iron: 1, coal: 1 }, 3], ['tile', 4, { clay: 2, coal: 1 }, 3], ['redbrick', 4, { clay: 3 }, 3], ['rug', 1, { slime: 2, branch: 2 }, 3],
  ['shelf', 1, { plank: 4, branch: 2 }, 4], ['bread', 1, { seed: 3, coal: 1 }, 2],
  ['soup', 1, { cabbage: 2 }, 3, false, 'pot'], // made at the pot
];
// rooms: walls two bricks high all round and a door; what is inside makes it what it is (the first that fits)
export const ROOMS = [
  { id: 'cosy', zh: '溫馨臥室', en: 'Cosy bedroom', need: { bed: 1, lantern: 1, plant: 1 }, hearts: 30 },
  { id: 'kitchen', zh: '廚房', en: 'Kitchen', need: { pot: 1, table: 1 }, hearts: 25 },
  { id: 'dining', zh: '餐廳', en: 'Dining room', need: { table: 1, chair: 2 }, hearts: 20 },
  { id: 'library', zh: '書房', en: 'Study', need: { shelf: 1, table: 1, chair: 1 }, hearts: 25 },
  { id: 'bedroom', zh: '臥室', en: 'Bedroom', need: { bed: 1 }, hearts: 12 },
  { id: 'workshop', zh: '工作室', en: 'Workshop', need: { workbench: 1 }, hearts: 12 },
  { id: 'store', zh: '儲藏室', en: 'Storeroom', need: { chest: 1 }, hearts: 10 },
  { id: 'room', zh: '空房間', en: 'Empty room', need: {}, hearts: 4 },
];
// the base grows with the hearts you gather; each level brings someone new and new recipes
export const LEVELS = [0, 30, 90, 180, 320];
export const VILLAGERS = [
  { id: 'hua', zh: '阿花', en: 'Hua', role: { zh: '農夫', en: 'Farmer' }, at: 1, spec: { age: 'adult', lashes: true, cheeks: true, colors: { top: '#6aa84a', bottom: '#5a3a24', shoes: '#4a3020' }, outfit: { top: 'coat', bottom: 'skirt', apron: '#f2e6c8' }, hair: { style: 'bun', color: '#4a2a14' } },
    quest: { id: 'farm', zh: '幫我種出 5 顆高麗菜，好嗎？', en: 'Could you grow me five cabbages?', goal: { cabbage: 5 }, reward: 25, done: { zh: '好新鮮的高麗菜！謝謝你！', en: 'Such fresh cabbages! Thank you!' } },
    chat: [{ zh: '田地上撒了種子，過一陣子就會長出高麗菜喔。', en: 'Sow seeds on farmland and in a while cabbages will come up.' }, { zh: '敲碎草叢有時候會掉出種子。', en: 'Breaking tall grass sometimes gives you seeds.' }] },
  { id: 'mu', zh: '老木', en: 'Old Mu', role: { zh: '木匠', en: 'Carpenter' }, at: 2, spec: { age: 'adult', beard: '#6a5a4a', colors: { top: '#a8743a', bottom: '#3a3020', shoes: '#2a2018' }, outfit: { top: 'coat', bottom: 'pants' }, hair: { style: 'short', color: '#6a5a4a' }, hat: { type: 'cap', color: '#3a5a8a' } },
    quest: { id: 'dining', zh: '蓋一間有一張桌子、兩張椅子的餐廳吧。', en: 'Build a dining room: one table, two chairs.', goal: { room: 'dining' }, reward: 35, done: { zh: '好房間！手藝不錯！', en: 'Fine room! Good work!' } },
    chat: [{ zh: '牆要兩格高，再裝上門，才算是一間房間。', en: 'Walls two bricks high and a door — then it’s a room.' }, { zh: '屋頂？有沒有都算房間，不過下雨可就麻煩了。', en: 'A roof? It’s a room either way, but you’ll want one when it rains.' }] },
  { id: 'pang', zh: '胖廚', en: 'Chef Pang', role: { zh: '廚師', en: 'Cook' }, at: 3, spec: { age: 'adult', mustache: '#2a1a10', cheeks: true, colors: { top: '#f4f4f0', bottom: '#2a2a3a', shoes: '#1a1a1a' }, outfit: { top: 'coat', bottom: 'pants', apron: '#ffffff' }, hair: { style: 'short', color: '#2a1a10' } },
    quest: { id: 'kitchen', zh: '我需要一間廚房：一口大鍋，一張桌子。', en: 'I need a kitchen: a cooking pot and a table.', goal: { room: 'kitchen' }, reward: 40, done: { zh: '這下可以煮蔬菜湯了！在大鍋那裡做。', en: 'Now we can make vegetable soup! At the pot.' } },
    chat: [{ zh: '高麗菜兩顆，就能在大鍋煮一碗蔬菜湯。', en: 'Two cabbages make a bowl of soup at the pot.' }] },
  { id: 'shi', zh: '小石', en: 'Little Shi', role: { zh: '小孩', en: 'Kid' }, at: 4, spec: { age: 'kid', cheeks: true, colors: { top: '#3a7ad8', bottom: '#2a3a5a', shoes: '#f2eee4' }, outfit: { top: 'tee', bottom: 'pants' }, hair: { style: 'spiky', color: '#1a1210' } },
    quest: { id: 'slimes', zh: '晚上那些史萊姆好可怕！你可以打倒 10 隻嗎？', en: 'The slimes at night are scary! Can you beat ten?', goal: { slimes: 10 }, reward: 50, done: { zh: '哇！你是英雄！', en: 'Wow! You’re a hero!' } },
    chat: [{ zh: '史萊姆晚上才會出來，房間裡面牠們進不來。', en: 'Slimes only come out at night — they can’t get into rooms.' }] },
];
// the first things to do, one after another
export const STEPS = [
  { id: 'dirt', zh: '敲碎方塊，收集 10 個土塊', en: 'Break blocks: gather 10 earth', goal: { dirt: 10 } },
  { id: 'wood', zh: '敲樹幹，收集 5 個木材', en: 'Hit tree trunks: gather 5 wood', goal: { wood: 5 } },
  { id: 'bench', zh: '按 C 做一個工作台，放在地上', en: 'Press C to make a workbench, and set it down', goal: { placed: 'workbench' } },
  { id: 'room', zh: '用方塊圍出兩格高的牆，裝上木門：蓋一間房間', en: 'Wall in a space two bricks high and fit a door: a room', goal: { anyRoom: true } },
  { id: 'bed', zh: '在房間裡放一張稻草床：臥室', en: 'Put a straw bed in a room: a bedroom', goal: { room: 'bedroom' } },
  { id: 'farm', zh: '做田地，撒下種子', en: 'Make farmland and sow seeds', goal: { sown: 1 } },
  { id: 'lv2', zh: '收集愛心，讓基地升到 Lv2', en: 'Gather hearts: raise the base to level 2', goal: { level: 2 } },
  { id: 'lv3', zh: '繼續建造，讓基地升到 Lv3', en: 'Keep building: base level 3', goal: { level: 3 } },
  { id: 'lv5', zh: '把空蕩島變成熱鬧的村莊（基地 Lv5）', en: 'Turn Empty Isle into a lively village (base level 5)', goal: { level: 5 } },
];
