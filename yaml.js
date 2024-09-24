import {GAME_STATE, loader, readTemp, TEMP, writeTemp} from './data.js';
import {run} from './main.js';
import * as map from './map.js';
import {renderer} from './renderer.js';

export function roll(difficulty) {
  return Math.random() < difficulty;
}

export function rollD(dSize) {
  return Math.floor(Math.random() * dSize) + 1;
}

export function skillSuccessRate(skill, base_difficulty) {
  return skill / (base_difficulty + skill);
}

export function useAbility(stamina_cost) {
  if (GAME_STATE['stamina'] >= stamina_cost) {
    GAME_STATE['stamina'] -= stamina_cost;
    return true;
  }
  return false;
}

export function getItemWeight(item_name) {
  let item_data = GAME_STATE['items'][item_name];
  return item_data['weight'] || 0;
}

export function getItemValue(item_name) {
  let item_data = GAME_STATE['items'][item_name];
  return item_data['value'] || 0;
}

export function getCurrentWeight() {
  let weight = 0;
  for (let item of GAME_STATE['druid']['items']) {
    weight += getItemWeight(item['name']) * item['q'];
  }
  return weight;
}

export function isOverweight() {
  return getCurrentWeight() > GAME_STATE['druid']['max_weight'];
}

export function acquireItem(item_name, quantity) {
  // let addedWeight = getItemWeight(item_name) * quantity;
  // if (getCurrentWeight() + addedWeight > GAME_STATE['druid']['max_weight']) {
  //   return false;
  // }

  for (let _item of GAME_STATE['druid']['items']) {
    if (_item['name'] == item_name) {
      _item['q'] += quantity;
      return true;
    }
  }

  GAME_STATE['druid']['items'].push({'name': item_name, 'q': quantity});
  return true;
}

export function consumeItem(item_name) {
  for (let _item of GAME_STATE['druid']['items']) {
    if (_item['name'] == item_name) {
      _item['q']--;
      if (_item['q'] === 0) {
        GAME_STATE['druid']['items'] = GAME_STATE['druid']['items'].filter(
            item => item.name !== item_name);
        return true;
      }
      return true;
    }
  }
  return false;
}

export function getItemQuantity(item_name) {
  for (let _item of GAME_STATE['druid']['items']) {
    if (_item['name'] == item_name) {
      return _item['q'];
    }
  }
  return 0;
}

export function pushView(view_name) {
  GAME_STATE['views'].push(view_name);
}

export function popAndPushView(view_name) {
  GAME_STATE['views'].pop();
  GAME_STATE['views'].push(view_name);
}

export function popView(view_name) {
  if (GAME_STATE['views'].length > 1) {
    GAME_STATE['views'].pop();
  }
}

export function addMessage(msg) {
  GAME_STATE['msg'] = [msg].concat(GAME_STATE['msg']);
}

export function clearMessages() {
  GAME_STATE['msg'] = [];
}

export function addTime(addTime) {
  let timeString = GAME_STATE['hours'];

  let [dayPart, timePart] = timeString.split(' ');
  let day = parseInt(dayPart.slice(1));

  let [currentHours, currentMinutes] = timePart.split(':').map(Number);

  let [addHours, addMinutes] = addTime.split(':').map(Number);

  let newMinutes = currentMinutes + addMinutes;
  let extraHours = Math.floor(newMinutes / 60);
  newMinutes = newMinutes % 60;

  let newHours = currentHours + addHours + extraHours;
  let extraDays = Math.floor(newHours / 24);
  newHours = newHours % 24;

  let newDay = day + extraDays;

  let formattedTime = `${newHours}:${newMinutes.toString().padStart(2, '0')}`;

  GAME_STATE['hours'] = `#${newDay} ${formattedTime}`;
}

export function setTimeNextDay(newTime) {
  let timeString = GAME_STATE['hours'];

  let [dayPart, timePart] = timeString.split(' ');
  let day = parseInt(dayPart.slice(1));  // Get the day number

  let newDay = day + 1;

  GAME_STATE['hours'] = `#${newDay} ${newTime}`;
}

export function spendGold(cost) {
  if (GAME_STATE['gold'] >= cost) {
    GAME_STATE['gold'] -= cost;
    return true;
  }
  return false;
}

export function earnGold(gold) {
  GAME_STATE['gold'] += gold;
}

function splitByLength(str, maxChars) {
  let result = [];
  let start = 0;

  while (start < str.length) {
    result.push(str.slice(start, start + maxChars));
    start += maxChars;
  }

  return result;
}

export function scrollable(lines, counter) {
  if (typeof lines === 'string') {
    lines = splitByLength(lines, 40);
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    lines = ['...'];
  }

  let max_lines = 3;

  let start = readTemp('scroll_height', counter);
  if (start === undefined) {
    start = 0;
  }

  let end = start + max_lines;
  start = Math.max(0, start);
  end = Math.min(lines.length, end);

  function scrollUp() {
    start = Math.max(0, start - 1);
    writeTemp('scroll_height', start, counter);
  }

  function scrollDown() {
    start = Math.min(lines.length - max_lines, start + 1);
    writeTemp('scroll_height', start, counter);
  }

  let newLines = [];
  for (let i = start; i < end; i++) {
    let fn = (i < (start + end) / 2) ? scrollUp : scrollDown;
    newLines.push({str: lines[i], fn: fn});
  }

  let data = {'lines': newLines};
  return data;
}

export function stats(data) {
  let bar_size = 16;
  let stamina_percent = GAME_STATE['stamina'] / GAME_STATE['max_stamina'];
  let s = parseFloat(GAME_STATE['stamina']).toFixed(0);
  data['stamina_bar'] = '|' +
      '*'.repeat(stamina_percent * bar_size).padEnd(bar_size) + '| ' + s;

  s = parseFloat(GAME_STATE['druid']['hp']).toFixed(0);
  let hp_percent = GAME_STATE['druid']['hp'] / GAME_STATE['druid']['max_hp'];

  let bar = '+'.repeat(hp_percent * bar_size)
                .padEnd(bar_size)
                .split('')
                .reverse()
                .join('');
  data['hp_bar'] = s + ' |' + bar + '|';

  data['char_click'] = {
    str: '[CHA]',
    fn: function() {
      pushView('druid');
    }
  };
  data['inventory_click'] = {
    str: '[INV]',
    fn: function() {
      pushView('inventory');
    }
  };
  data['leave'] = {
    str: '[--X--]',
    fn: function() {
      popView();
    }
  };
  data['config'] = {
    str: '[+]',
    fn: function() {
      pushView('config')
    }
  };

  return data;
}

export function getDruidArmorClass() {
  return 10 + GAME_STATE['druid']['armor']['bonus'];
}

export function getSneakingSkill() {
  return GAME_STATE['druid']['sneaking_skill'] +
      GAME_STATE['druid']['boots']['bonus'] + 10;
}

export function rollMeleeDamage() {
  let dmg = rollD(GAME_STATE['druid']['melee']['base_die']) +
      GAME_STATE['druid']['melee']['bonus'];
  return dmg;
}

export function rollRangedDamage() {
  let dmg = rollD(GAME_STATE['druid']['ranged']['base_die']) +
      GAME_STATE['druid']['ranged']['bonus'];
  return dmg;
}

function increaseSkill(skill) {
  let cost = GAME_STATE['druid'][skill] + 1;
  if (GAME_STATE['druid']['skill_points'] >= cost) {
    GAME_STATE['druid']['skill_points'] -= cost;
    GAME_STATE['druid'][skill] += 1;
    return;
  }

  addMessage('You do not have enough skill points');
}

export function druid(data) {
  data['ac'] = getDruidArmorClass();
  data['sword_skill'] = {
    'str': GAME_STATE['druid']['sword_skill'],
    'fn': function() {
      increaseSkill('sword_skill');
    }
  };
  data['bow_skill'] = {
    'str': GAME_STATE['druid']['bow_skill'],
    'fn': function() {
      increaseSkill('bow_skill');
    }
  };
  data['sneaking_skill'] = {
    'str': getSneakingSkill(),
    'fn': function() {
      increaseSkill('sneaking_skill');
    }
  };
  data['hunting_skill'] = {
    'str': GAME_STATE['druid']['hunting_skill'],
    'fn': function() {
      increaseSkill('hunting_skill');
    }
  };
  data['skinning_skill'] = {
    'str': GAME_STATE['druid']['skinning_skill'],
    'fn': function() {
      increaseSkill('skinning_skill');
    }
  };
  return data;
}

export function equipWeapon(item_name) {
  let item_data = GAME_STATE['items'][item_name];

  consumeItem(item_name);
  acquireItem(GAME_STATE['druid']['melee']['name'], 1);

  GAME_STATE['druid']['melee']['name'] = item_name;
  GAME_STATE['druid']['melee']['base_die'] = item_data['base_die'];
  GAME_STATE['druid']['melee']['bonus'] = item_data['bonus'];
}

export function equipRangedWeapon(item_name) {
  let item_data = GAME_STATE['items'][item_name];

  consumeItem(item_name);
  acquireItem(GAME_STATE['druid']['ranged']['name'], 1);

  GAME_STATE['druid']['ranged']['name'] = item_name;
  GAME_STATE['druid']['ranged']['base_die'] = item_data['base_die'];
  GAME_STATE['druid']['ranged']['bonus'] = item_data['bonus'];
}

export function equipArmor(item_name) {
  let item_data = GAME_STATE['items'][item_name];

  consumeItem(item_name);
  acquireItem(GAME_STATE['druid']['armor']['name'], 1);

  GAME_STATE['druid']['armor']['name'] = item_name;
  GAME_STATE['druid']['armor']['bonus'] = item_data['bonus'];
}

export function equipBoots(item_name) {
  let item_data = GAME_STATE['items'][item_name];

  consumeItem(item_name);
  acquireItem(GAME_STATE['druid']['boots']['name'], 1);

  GAME_STATE['druid']['boots']['name'] = item_name;
  GAME_STATE['druid']['boots']['bonus'] = item_data['bonus'];
}

export function inventory(data) {
  let weight = getCurrentWeight();
  data['weight'] = weight;
  data['max_weight'] = GAME_STATE['druid']['max_weight'];

  let items = [];
  for (let item of GAME_STATE['druid'].items) {
    item['w'] = item.q * getItemWeight(item.name);
    item['value'] = getItemValue(item.name);
    item['fn'] = function() {
      let item_data = GAME_STATE['items'][item.name];
      switch (item_data['type']) {
        case 'melee':
          equipWeapon(item.name);
          break;
        case 'ranged':
          equipRangedWeapon(item.name);
          break;
        case 'armor':
          equipArmor(item.name);
          break;
        case 'boots':
          equipBoots(item.name);
          break;
      }
    };
    item['delete'] = {
      'str': '-X-',
      'fn': function() {
        consumeItem(item.name);
      }
    };
    items.push(item);
  }
  data['inventory'] = items;
  return data;
}

export function config(data) {
  data['save'] = function() {
    loader.saveState();
    addMessage('Save complete.');
  };
  data['load'] = function() {
    loader.loadState();
    addMessage('Loading complete.');
  };
  data['reset'] = function() {
    loader.resetState();
    addMessage('Reset complete.');
  };
  return data;
}

renderer.models['log'] = scrollable;
renderer.models['stats'] = stats;
renderer.models['druid'] = druid;
renderer.models['inventory'] = inventory;
renderer.models['config'] = config;
