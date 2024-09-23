import {GAME_DATA, GAME_STATE, TEMP} from './data.js';
import {run} from './main.js';
import {renderer} from './renderer.js';
import * as _ from './yaml.js';

Object.assign(GAME_STATE, {
  'battle_state': 'START',
  'battle_counter': 51,
  'sword_swing_cost': 5,
});
GAME_STATE['enemy1'] = {
  'hp': 5,
  'hit_bonus': 1,
  'damage': 1,
  'ac': 12,
  'init_bonus': 2,
  'pos': [2, 2],
  'took_hit': 0,
};

function rollInitiatives() {
  let enemyInit = _.rollD(20) + GAME_STATE['enemy1']['init_bonus'];
  let playerInit = _.rollD(20) + GAME_STATE['druid']['init_bonus'];

  let initiatives = [['E1', enemyInit], ['P', playerInit]];
  initiatives = initiatives.sort((a, b) => b[1] - a[1]).map(item => item[0]);
  GAME_STATE['initiatives'] = GAME_STATE['initiatives'].concat(initiatives);
}

export function flickerEnemy() {
  let dirX = _.rollD(3) - 2;
  let dirY = _.rollD(3) - 2;

  GAME_STATE['enemy1']['pos'][0] += dirX;
  GAME_STATE['enemy1']['pos'][1] += dirY;
  GAME_STATE['enemy1']['pos'][0] = Math.max(0, GAME_STATE['enemy1']['pos'][0]);
  GAME_STATE['enemy1']['pos'][1] = Math.max(0, GAME_STATE['enemy1']['pos'][1]);
  GAME_STATE['enemy1']['pos'][0] = Math.min(3, GAME_STATE['enemy1']['pos'][0]);
  GAME_STATE['enemy1']['pos'][1] = Math.min(6, GAME_STATE['enemy1']['pos'][1]);
}

function updateLoop() {
  GAME_STATE['battle_counter'] += 1;

  if (_.rollD(8) == 8 && GAME_STATE['enemy1']['took_hit'] == 0) {
    flickerEnemy();
  }
}

function printSprite(data) {
  data['enemy1_matrix'] = [];
  for (let y = 0; y < 5; y++) {
    data['enemy1_matrix'].push('');
    for (let x = 0; x < 13; x++) {
      data['enemy1_matrix'][y] += '.';
    }
  }

  if (GAME_STATE['enemy1']['took_hit'] > 0) {
    GAME_STATE['enemy1']['took_hit']--;
    if (GAME_STATE['enemy1']['took_hit'] % 2 == 1) {
      return;
    }
  }

  let sprite = wolf;
  if (GAME_STATE['battle_state'] == 'E1' &&
      GAME_STATE['battle_counter'] % 2 == 0) {
    sprite = wolf_attack;
  }

  let [startY, startX] = GAME_STATE['enemy1']['pos'];
  for (let y = 0; y < sprite.length; y++) {
    for (let x = 0; x < sprite[y].length; x++) {
      if (startY + y < data['enemy1_matrix'].length &&
          startX + x < data['enemy1_matrix'][0].length) {
        let row = data['enemy1_matrix'][startY + y].split('');
        row[startX + x] = sprite[y][x];
        data['enemy1_matrix'][startY + y] = row.join('');
      }
    }
  }
}

let wolf = ['--==NO=', '  L L  '];

let wolf_attack = ['*-==NO<', '  L L  '];

export function processInitiative() {
  GAME_STATE['battle_state'] = GAME_STATE['initiatives'].shift();

  if (GAME_STATE['initiatives'].length < 3) {
    rollInitiatives();
  }
  GAME_STATE['battle_counter'] = 0;
}

export function addMessage(msg) {
  GAME_STATE['battle_msg'] = [msg].concat(GAME_STATE['battle_msg']);
}

export function runEnemyTurn() {
  let roll = GAME_STATE['enemy1']['hit_bonus'] + _.rollD(20);
  if (roll >= _.getDruidArmorClass()) {
    let dmg = GAME_STATE['enemy1']['damage'];
    GAME_STATE['druid']['hp'] -= Math.min(dmg, GAME_STATE['druid']['hp']);
    addMessage(`(${roll}) The wolf inflicted ${dmg} damage.`);
    if (GAME_STATE['druid']['hp'] == 0) {
      GAME_STATE['view'] = 'game_over';
    }
  } else {
    addMessage(`(${roll}) The wolf missed.`);
  }
  processInitiative();
}

export function attack() {
  if (GAME_STATE['battle_state'] !== 'P') {
    return;
  }

  if (!_.useAbility(GAME_STATE['sword_swing_cost'])) {
    addMessage(`You don't have enough stamina.`);
    return;
  }

  let roll = GAME_STATE['sword_skill'] + _.rollD(20);
  if (roll >= GAME_STATE['enemy1']['ac']) {
    let dmg = _.rollMeleeDamage();
    GAME_STATE['enemy1']['hp'] -= Math.min(dmg, GAME_STATE['enemy1']['hp']);
    GAME_STATE['enemy1']['took_hit'] = 10;
    addMessage(`(${roll}) You hit the wolf for ${dmg} HP.`);

    console.log();
    if (GAME_STATE['enemy1']['hp'] == 0) {
      _.popAndPushView('loot');
    }
  } else {
    addMessage(`(${roll}) You missed the wolf.`);
  }
  processInitiative();
}

export function rest() {
  let stamina = _.rollD(10);
  GAME_STATE['stamina'] += stamina
  addMessage(`You gained ${stamina} stamina.`);
  processInitiative();
}

export function battle() {
  let data = {};

  updateLoop();

  if (GAME_STATE['battle_counter'] > 30) {
    GAME_STATE['battle_counter'] = 0;

    switch (GAME_STATE['battle_state']) {
      case 'START':
        GAME_STATE['initiatives'] = [];
        rollInitiatives();
        processInitiative();
        break;
      case 'E1':
        runEnemyTurn();
        break;
      case 'P':
        break;
    }
  }

  printSprite(data);

  data['atk'] = attack;
  data['rest'] = rest;

  clearTimeout(GAME_STATE['refresh']);
  GAME_STATE['refresh'] = setTimeout(function() {
    run();
  }, 100);

  data['turns'] = GAME_STATE['initiatives'].join('==');
  return data;
}

renderer.models['battle'] = battle;
