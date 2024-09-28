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

export function dcCheck(skill, dc) {
  return rollD(20) + skill >= dc;
}

export function probDcCheck(skill, dc) {
  let result = (21 - (dc - skill)) / 20;
  if (result < 0) return 0.0;
  if (result > 1) return 1.0;
  return result;
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

export function getArrowSpeed() {
  if (getRangedWeapon() === 'Gun') {
    return 5;
  }

  if (getBowSkill() >= 7) {
    return 2;
  }
  return 1;
}

export function hasDoubleArrows() {
  if (getRangedWeapon() === 'Gun') {
    return false;
  }

  if (getBowSkill() >= 4) {
    return true;
  }
  return false;
}

export function getItemData(item_name) {
  let item = Object.assign({}, GAME_STATE['items']['']);
  if (GAME_STATE['items'][item_name] !== undefined) {
    item = Object.assign({}, GAME_STATE['items'][item_name]);
  }
  item.name = item_name;
  return item;
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
  if (msg === undefined) {
    return;
  }

  GAME_STATE['msg'] = [msg].concat(GAME_STATE['msg']);
}

export function clearMessages() {
  GAME_STATE['msg'] = [];
}

export function timeToFloat(timeWithDay) {
  let dayNumber = 0;  // Default day is 0 if no day part is given
  let timePart;

  // Check if the string contains a day part (starts with #)
  if (timeWithDay.startsWith('#')) {
    const [dayPart, time] = timeWithDay.split(' ');
    dayNumber = parseInt(dayPart.slice(1)) - 1;  // Convert day to 0-based index
    timePart = time;
  } else {
    timePart = timeWithDay;
  }

  const [hours, minutes] = timePart.split(':').map(Number);

  return dayNumber * 24 + hours +
      (minutes / 60);  // Calculate total hours including previous days
}

export function floatToTime(floatValue) {
  const day = Math.floor(floatValue / 24) + 1;  // Get day number
  const remainingHours = floatValue % 24;
  const hours = Math.floor(remainingHours);
  const minutes = Math.round((remainingHours - hours) * 60);
  const timePart = `${hours}:${minutes.toString().padStart(2, '0')}`;

  return `#${day} ${timePart}`;
}

export function addTime2(timeString, addTime) {
  if (addTime.startsWith('#')) {
    const [, time] = addTime.split(' ');
    addTime = time;
  }

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
  return `#${newDay} ${formattedTime}`;
}

export function addTime(addTime) {
  GAME_STATE['hours'] = addTime2(GAME_STATE['hours'], addTime);
}

export function getTimeNextDay(newTime) {
  let timeString = GAME_STATE['hours'];

  let [dayPart, timePart] = timeString.split(' ');
  let day = parseInt(dayPart.slice(1));  // Get the day number

  let newDay = day + 1;

  return `#${newDay} ${newTime}`;
}

export function setTimeNextDay(newTime) {
  GAME_STATE['hours'] = getTimeNextDay(newTime);
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

  if (GAME_STATE['show_leave']) {
    data['leave'] = {
      str: '[--X--]',
      fn: function() {
        popView();
      }
    };
  } else {
    data['leave'] = '_______';
  }

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

export function getBowSkill() {
  return GAME_STATE['druid']['bow_skill'];
}

export function getSneakingSkill() {
  return GAME_STATE['druid']['sneaking_skill'] +
      GAME_STATE['druid']['boots']['bonus'];
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
  data['tracking_skill'] = {
    'str': GAME_STATE['druid']['tracking_skill'],
    'fn': function() {
      increaseSkill('tracking_skill');
    }
  };
  return data;
}

export function getRangedWeapon() {
  return GAME_STATE['druid']['ranged']['name'];
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
  if (item_name === 'Gun' && getBowSkill() < 10) {
    addMessage('You need bow > 10 to wield a gun.');
    return;
  }


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
    item['v'] = getItemValue(item.name);
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

export function setLoading(duration, message, hours, fn) {
  GAME_STATE['loading_bar'] = '';
  GAME_STATE['loading_bar_message'] = message;
  GAME_STATE['loading_fn'] = fn;
  GAME_STATE['loading_bar_duration'] = duration;
  GAME_STATE['loading_bar_hours'] = hours;
  GAME_STATE['loading_bar_initial_hour'] = GAME_STATE['hours'];
  GAME_STATE['show_leave'] = false;

  pushView('loading_bar');
}

export function loading_bar() {
  const total_size = 44;
  GAME_STATE['loading_bar'] += '=';
  let progress = GAME_STATE['loading_bar'].length / total_size;

  let current_hour = timeToFloat(GAME_STATE['loading_bar_initial_hour']);
  let hour_increment = timeToFloat(GAME_STATE['loading_bar_hours']);
  let new_hour = floatToTime(current_hour + hour_increment * progress);

  GAME_STATE['hours'] = new_hour;
  if (progress >= 1) {
    GAME_STATE['show_leave'] = true;
    new_hour = addTime2(
        GAME_STATE['loading_bar_initial_hour'],
        GAME_STATE['loading_bar_hours']);
    GAME_STATE['hours'] = addTime2(
        GAME_STATE['loading_bar_initial_hour'],
        GAME_STATE['loading_bar_hours']);
    popView();
    GAME_STATE['loading_fn']();
    return {};
  }

  clearTimeout(GAME_STATE['refresh']);
  GAME_STATE['refresh'] = setTimeout(function() {
    run();
  }, GAME_STATE['loading_bar_duration'] / total_size);

  return {};
}

renderer.models['loading_bar'] = loading_bar;
renderer.models['log'] = scrollable;
renderer.models['stats'] = stats;
renderer.models['druid'] = druid;
renderer.models['inventory'] = inventory;
renderer.models['config'] = config;
