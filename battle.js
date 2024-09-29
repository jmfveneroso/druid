import {GAME_STATE} from './data.js';
import {run} from './main.js';
import {renderer} from './renderer.js';
import * as _ from './yaml.js';

Object.assign(GAME_STATE, {
  'battle_state': 'START',
  'battle_counter': 51,
  'sword_swing_cost': 5,
  'battle_enemies': [
    {
      'present': true,
      'name': 'Wolf',
      'hp': 5,
      'hit_bonus': 1,
      'damage': 1,
      'ac': 12,
      'init_bonus': 2,
      'pos': [2, 2],
      'took_hit': 0,
    },
    {
      'present': false,
      'name': 'Wolf',
      'hp': 5,
      'hit_bonus': 1,
      'damage': 1,
      'ac': 12,
      'init_bonus': 2,
      'pos': [2, 2],
      'took_hit': 0,
    },
    {
      'present': false,
      'name': 'Wolf',
      'hp': 5,
      'hit_bonus': 1,
      'damage': 1,
      'ac': 12,
      'init_bonus': 2,
      'pos': [2, 2],
      'took_hit': 0,
    },
  ]
});

function enemy(i) {
  return GAME_STATE['battle_enemies'][i];
}

function rollInitiatives() {
  let initiatives = [];
  for (let i = 0; i < 3; i++) {
    if (!enemy(i)['present']) {
      continue;
    }

    let enemyInit = _.rollD(20) + enemy(i)['init_bonus'];
    initiatives.push(['E' + i, enemyInit]);
  }
  let playerInit = _.rollD(20) + GAME_STATE['druid']['init_bonus'];
  initiatives.push(['P', playerInit]);

  // let initiatives = [['E1', enemyInit], ['P', playerInit]];
  initiatives = initiatives.sort((a, b) => b[1] - a[1]).map(item => item[0]);
  GAME_STATE['initiatives'] = GAME_STATE['initiatives'].concat(initiatives);
}

export function flickerEnemy(i) {
  let dirX = _.rollD(3) - 2;
  let dirY = _.rollD(3) - 2;

  enemy(i)['pos'][0] += dirX;
  enemy(i)['pos'][1] += dirY;
  enemy(i)['pos'][0] = Math.max(0, enemy(i)['pos'][0]);
  enemy(i)['pos'][1] = Math.max(0, enemy(i)['pos'][1]);
  enemy(i)['pos'][0] = Math.min(3, enemy(i)['pos'][0]);
  enemy(i)['pos'][1] = Math.min(6, enemy(i)['pos'][1]);
}

function updateLoop() {
  GAME_STATE['battle_counter'] += 1;

  for (let i = 0; i < 3; i++) {
    if (!enemy(i)['present']) continue;

    if (_.rollD(8) == 8 && enemy(i)['took_hit'] == 0) {
      flickerEnemy(i);
    }
  }
}

let wolf = ['--==NO=', '  L L  '];

let wolf_attack = ['*-==NO<', '  L L  '];

let goblin = [' <o> |', '--=--}', ' L L  '];

let goblin_attack = [' <o>| ', '--=-} ', ' L L  '];


let drake = ['--===}}O>', '  L L L  '];

let drake_attack = ['*-===}}O<', '  L L L  '];

let sprites =
    {
      'Wolf': [wolf, wolf_attack],
      'Goblin': [goblin, goblin_attack],
      'Drake': [drake, drake_attack],
    }

function printSprite(data, i) {
  data['enemy' + i + '_matrix'] = [];
  for (let y = 0; y < 5; y++) {
    data['enemy' + i + '_matrix'].push('');
    for (let x = 0; x < 13; x++) {
      data['enemy' + i + '_matrix'][y] += '.';
    }
  }

  if (enemy(i)['took_hit'] > 0) {
    enemy(i)['took_hit']--;
    if (enemy(i)['took_hit'] % 2 == 1) {
      return;
    }
  }

  let sprite = sprites[enemy(i)['name']][0];
  if (GAME_STATE['battle_state'] == 'E' + i &&
      GAME_STATE['battle_counter'] % 2 == 0) {
    sprite = sprites[enemy(i)['name']][1];
  }

  let [startY, startX] = enemy(i)['pos'];
  for (let y = 0; y < sprite.length; y++) {
    for (let x = 0; x < sprite[y].length; x++) {
      if (startY + y < data['enemy' + i + '_matrix'].length &&
          startX + x < data['enemy' + i + '_matrix'][0].length) {
        let row = data['enemy' + i + '_matrix'][startY + y].split('');
        row[startX + x] = sprite[y][x];
        data['enemy' + i + '_matrix'][startY + y] = row.join('');
      }
    }
  }
}

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

export function runEnemyTurn(i) {
  let roll = enemy(i)['hit_bonus'] + _.rollD(20);
  if (roll >= _.getDruidArmorClass()) {
    let dmg = _.rollD(enemy(i)['damage']);
    _.hitDruid(dmg);
    addMessage(`(${roll}) The enemy hit with ${dmg} dmg.`);
  } else {
    addMessage(`(${roll}) The enemy missed.`);
  }
  processInitiative();
}

function allEnemiesDead() {
  for (let i = 0; i < 3; i++) {
    if (!enemy(i)['present']) continue;
    if (enemy(i)['hp'] > 0) return false;
  }
  return true;
}

export function attack(i) {
  if (GAME_STATE['battle_state'] !== 'P') {
    return;
  }

  let penalty = 0;
  if (!_.useAbility(GAME_STATE['sword_swing_cost'])) {
    addMessage(`You don't have enough stamina.`);
    penalty = 5;
  }

  let roll = GAME_STATE['druid']['sword_skill'] + _.rollD(20) - penalty;
  if (roll >= enemy(i)['ac']) {
    let dmg = _.rollMeleeDamage();
    GAME_STATE['battle_enemies'][i]['hp'] -= Math.min(dmg, enemy(i)['hp']);
    GAME_STATE['battle_enemies'][i]['took_hit'] = 10;
    addMessage(`(${roll}) You hit the enemy for ${dmg} HP.`);

    if (enemy(i)['hp'] == 0) {
      enemy(i)['present'] = false;
    }

    if (allEnemiesDead()) {
      GAME_STATE['current_loot'] = [];
      for (let i = 0; i < 3; i++) {
        if (!enemy(i)['loot']) continue;
        GAME_STATE['current_loot'] = GAME_STATE['current_loot'].concat(enemy(i)['loot']);
      }
      console.log(GAME_STATE['current_loot']);
      _.popAndPushView('loot');
      GAME_STATE['show_leave'] = true;
    }
  } else {
    addMessage(`(${roll}) You missed the enemy.`);
  }
  processInitiative();
}

export function escape() {
  if (!_.useAbility(20)) {
    addMessage(`You don't have enough stamina.`);
    return;
  }

  if (_.probDcCheck(_.getSneakingSkill(), 15)) {
    addMessage(`You escaped.`);
    _.popView();
    return;
  }

  addMessage(`You failed to escape.`);
}

export function rollEncounter() {
  const totalProbability =
      GAME_STATE['encounter_types'].reduce((sum, item) => sum + item.prob, 0);

  const random = Math.random() * totalProbability;
  let cumulativeProbability = 0;
  for (let encounter of GAME_STATE['encounter_types']) {
    cumulativeProbability += encounter.prob;
    if (random <= cumulativeProbability) {
      return encounter.enemies;
    }
  }
  return [];
};

export function battle() {
  let data = {};
  data['on_start'] = function() {
    GAME_STATE['show_leave'] = false;
    let enemies = rollEncounter();

    for (let i = 0; i < 3; i++) {
      GAME_STATE['battle_enemies'][i]['present'] = false;
    }

    for (let i = 0; i < enemies.length; i++) {
      let enemy = GAME_STATE['enemies'][enemies[i]];
      GAME_STATE['battle_enemies'][i] = {
        'present': true,
        'name': enemy['name'],
        'hp': enemy['hp'],
        'hit_bonus': enemy['hit_bonus'],
        'damage': enemy['damage'],
        'ac': enemy['ac'],
        'init_bonus': enemy['init_bonus'],
        'pos': [2, 2],
        'took_hit': 0,
        'loot': Array.from(enemy['loot'])
      };
    }
  };

  updateLoop();

  if (GAME_STATE['battle_counter'] > 30) {
    GAME_STATE['battle_counter'] = 0;

    switch (GAME_STATE['battle_state']) {
      case 'START':
        GAME_STATE['initiatives'] = [];
        rollInitiatives();
        processInitiative();
        break;
      case 'E0':
        runEnemyTurn(0);
        break;
      case 'E1':
        runEnemyTurn(1);
        break;
      case 'E2':
        runEnemyTurn(2);
        break;
      case 'P':
        break;
    }
  }

  for (let i = 0; i < 3; i++) {
    if (!enemy(i)['present']) continue;
    printSprite(data, i);
  }

  data['atk'] = attack;
  data['escape'] = escape;

  clearTimeout(GAME_STATE['refresh']);
  GAME_STATE['refresh'] = setTimeout(function() {
    run();
  }, 100);

  data['turns'] = GAME_STATE['initiatives'].join('==');

  data['attack0'] = function () { attack(0); }
  data['attack1'] = function () { attack(1); }
  data['attack2'] = function () { attack(2); }

  return data;
}

renderer.models['battle'] = battle;
