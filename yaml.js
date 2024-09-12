import {renderer} from './renderer.js';
import {run} from './main.js';
import {GAME_STATE, GAME_DATA, TEMP} from './data.js';

export function writeTemp(name, value, counter) {
  console.log(name + '_' + counter);
  TEMP[name + '_' + counter] = value;
}

export function readTemp(name, counter) {
  console.log('READ ' + name + '_' + counter);
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
  console.log(GAME_STATE['stamina']);
  console.log(stamina_cost);
  if (GAME_STATE['stamina'] >= stamina_cost) {
    GAME_STATE['stamina'] -= stamina_cost;
    return true;
  }
  return false;
}


export function scrollable(text, counter) {
  let lines = text.split(' ');

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

renderer.models['log'] = scrollable;
