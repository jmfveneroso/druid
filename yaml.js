import {renderer} from './renderer.js';
import {run} from './main.js';
import {GAME_STATE, GAME_DATA, TEMP} from './data.js';

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
  console.log(lines);
  console.log(counter);

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
  data['go_to_inventory'] = function () {
    GAME_STATE['view'] = 'druid';
  }
  return data;
}

export function druid(data) {
  let weight = getCurrentWeight();
  data['weight'] = weight;
  data['leave'] = function () {
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
