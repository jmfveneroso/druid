import {GAME_DATA, GAME_STATE, TEMP} from './data.js';
import {run} from './main.js';
import {renderer} from './renderer.js';

export function writeTemp(name, value, counter) {
  TEMP[name + '_' + counter] = value;
}

export function readTemp(name, counter) {
  return TEMP[name + '_' + counter];
}

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
  let item_data = GAME_DATA['items'][item_name];
  return item_data['weight'] || 0;
}

export function getCurrentWeight() {
  let weight = 0;
  for (let item of GAME_STATE['druid']['items']) {
    weight += getItemWeight(item['name']) * item['q'];
  }
  return weight;
}

export function acquireItem(item) {
  let addedWeight = getItemWeight(item.name) * item.q;
  if (getCurrentWeight() + addedWeight > GAME_STATE['druid']['max_weight']) {
    return false;
  }

  for (let _item of GAME_STATE['druid']['items']) {
    if (_item['name'] == item.name) {
      _item['q'] += item.q;
      return true;
    }
  }

  GAME_STATE['druid']['items'].push(item);
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

export function addHours(hours) {}

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
  data['inventory_click'] = {
    str: '[INV]',
    fn: function() {
      pushView('druid');
    }
  };
  data['leave'] = {
    str: '[LEAVE]',
    fn: function() {
      GAME_STATE['view'] = 'druid';
      popView();
    }
  };
  return data;
}

export function druid(data) {
  let weight = getCurrentWeight();
  data['weight'] = weight;
  data['leave'] =
      function() {
    GAME_STATE['view'] = 'hunt';
  }

  let items = [];
  for (let item of GAME_STATE['druid'].items) {
    item['w'] = item.q * getItemWeight(item.name);
    items.push(item);
  }
  data['inventory'] = items;
  return data;
}

renderer.models['log'] = scrollable;
renderer.models['stats'] = stats;
renderer.models['druid'] = druid;
