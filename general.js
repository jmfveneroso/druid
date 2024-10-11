import {GAME_STATE, loader, readTemp, TEMP, writeTemp, timeToFloat} from './data.js';
import {renderer, run} from './renderer.js';

export let utils = {};

utils.roll = function(difficulty) {
  return Math.random() < difficulty;
};

utils.rollD = function(dSize) {
  let result = Math.floor(Math.random() * dSize) + 1;
  return result;
};

utils.dcCheck = function(skill, dc) {
  return utils.rollD(20) + skill >= dc;
};

utils.probDcCheck = function(skill, dc) {
  let result = (21 - (dc - skill)) / 20;
  if (result < 0) return 0.0;
  if (result > 1) return 1.0;
  return result;
};

utils.skillSuccessRate = function(skill, base_difficulty) {
  return skill / (base_difficulty + skill);
};

utils.pushView = function(view_name) {
  GAME_STATE['views'].push(view_name);

  try {
    if (renderer.models[view_name]) {
      let data = {};
      data = renderer.models[view_name](data, 0);
      if (data['on_start']) {
        data['on_start']();
      }
    }
  } catch (e) {
    console.log(e);
  }
};

utils.popAndPushView = function(view_name) {
  GAME_STATE['views'].pop();
  utils.pushView(view_name);
};

utils.popView = function(view_name) {
  if (GAME_STATE['views'].length > 1) {
    GAME_STATE['views'].pop();
  }
};

utils.addMessage = function(msg) {
  if (msg === undefined) {
    return;
  }

  GAME_STATE['msg'] = [msg].concat(GAME_STATE['msg']);
};

utils.clearMessages = function() {
  GAME_STATE['msg'] = [];
};

utils.splitByLength = function(str, maxChars) {
  let result = [];
  let start = 0;

  while (start < str.length) {
    result.push(str.slice(start, start + maxChars));
    start += maxChars;
  }

  return result;
};

utils.setLoading = function(duration, message, hours, fn) {
  GAME_STATE['loading_bar'] = '';
  GAME_STATE['loading_bar_message'] = message;
  GAME_STATE['loading_fn'] = fn;
  GAME_STATE['loading_bar_duration'] = duration;
  GAME_STATE['loading_bar_hours'] = hours;
  GAME_STATE['loading_bar_initial_hour'] = GAME_STATE['hours'];
  GAME_STATE['show_leave'] = false;

  utils.pushView('loading_bar');
};

utils.getCurrentEnv = function () {
  const grid = GAME_STATE['map_grid'];
  const druidX = GAME_STATE['druid']['position']['x'];
  const druidY = GAME_STATE['druid']['position']['y'];
  const square = grid[druidX][druidY];
  return square['environment'];
}

// =============================================================================
// TEMPLATES
// =============================================================================

export function scrollable(lines, counter) {
  if (typeof lines === 'string') {
    lines = utils.splitByLength(lines, 40);
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

export function config(data) {
  data['save'] = function() {
    loader.saveState();
    utils.addMessage('Save complete.');
  };
  data['load'] = function() {
    loader.loadState();
    utils.addMessage('Loading complete.');
  };
  data['reset'] = function() {
    loader.resetState();
    utils.addMessage('Reset complete.');
  };
  return data;
}

export function loading_bar() {
  const total_size = 44;
  GAME_STATE['loading_bar'] += '=';
  let progress = GAME_STATE['loading_bar'].length / total_size;

  let current_hour = timeToFloat(GAME_STATE['loading_bar_initial_hour']);
  let hour_increment = timeToFloat(GAME_STATE['loading_bar_hours']);
  let new_hour = utils.floatToTime(current_hour + hour_increment * progress);

  GAME_STATE['hours'] = new_hour;
  if (progress >= 0.99) {
    utils.popView();
    GAME_STATE['show_leave'] = true;
    new_hour = utils.addTime2(
        GAME_STATE['loading_bar_initial_hour'],
        GAME_STATE['loading_bar_hours']);
    if (!utils.setTime(new_hour)) {
      return {};
    }
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
renderer.models['config'] = config;