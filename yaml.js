import {renderer} from './renderer.js';
import {run} from './main.js';

export let GAME_DATA = {
  'animals': [
    {
      'name': 'Rabbit',
      'base_hp': 2,
      'base_difficulty': 4,
      'size': 0,
    },
    {
      'name': 'Deer',
      'base_hp': 6,
      'base_difficulty': 6,
      'size': 2,
    },
    {
      'name': 'Wolf',
      'base_hp': 10,
      'base_difficulty': 8,
      'size': 1,
    },
  ]
}

export let GAME_STATE = {
  'track_msg': 'The forest is teeming with wild life',
  'view': 'hunt',
  'animal': undefined,
  'animal_stats': {
    'hp': 0,
    'distance': 100,
  },
  'current_env': {
    'population': {
      'Rabbit': 100,
      'Deer': 50,
      'Wolf': 13,
    }
  },
  'hunting_skill': 1,
  'scroll_height': 0,
};

let TEMP = {};

function writeTemp(name, value, counter) {
  console.log(name + '_' + counter);
  TEMP[name + '_' + counter] = value;
}

function readTemp(name, counter) {
  console.log('READ ' + name + '_' + counter);
  return TEMP[name + '_' + counter];
}

function roll(difficulty) {
  return Math.random() < difficulty;
}

function rollD(dSize) {
 return Math.floor(Math.random() * dSize) + 1;
}

function skillSuccessRate(skill, base_difficulty) {
  return skill / (base_difficulty + skill);
}

export function track() {
  function trackingOutcome(animal, prob) {
    let success = roll(prob);
    if (!success) {
      GAME_STATE['track_msg'] = `You failed tracking the ${animal.name}.`;
      GAME_STATE['view'] = 'hunt';
      return;
    }

    GAME_STATE['sneak_msg'] = `You tracked the ${animal.name}.`;
    GAME_STATE['animal'] = animal;
    GAME_STATE['animal_stats'] = {
      'hp': animal.base_hp,
      'distance': 100,
    };
    GAME_STATE['view'] = 'sneak';
    GAME_STATE['animal_pos'] = 10;
    GAME_STATE['shoot_cursor_pos'] = 0;
    GAME_STATE['shoot_cursor_direction'] = 1;
    GAME_STATE['has_shot'] = false;
    GAME_STATE['arrow_pos'] = undefined;
  }

  let env = GAME_STATE['current_env'];

  let template_data = {};
  template_data['msg'] = GAME_STATE['track_msg'];
  template_data['animals'] = [];
  for (let i = 0; i < GAME_DATA['animals'].length; i++) {
    let animal = GAME_DATA['animals'][i];

    let skill = GAME_STATE['hunting_skill'];
    let population = env.population[animal['name']];
    let prob = skillSuccessRate(skill * population, animal['base_difficulty']);

    function outcome() {
      return trackingOutcome(animal, prob);
    }

    template_data['animals'].push({
      name: {str: animal.name, fn: outcome},
      prob: {str: prob, fn: outcome},
    });
  }

  return template_data;
}

export function sneak() {
  function sneakingOutcome(animal, prob) {
    let success = roll(prob);
    if (!success) {
      GAME_STATE['track_msg'] = `The ${animal.name} escaped.`;
      GAME_STATE['view'] = 'hunt';
      return;
    }

    GAME_STATE['sneak_msg'] = `You snuck close to the ${animal.name}.`;
    GAME_STATE['animal_stats']['distance'] /= 2;
    GAME_STATE['view'] = 'sneak';
  }

  let template_data = {};
  template_data['msg'] = GAME_STATE['sneak_msg'];

  let animal = GAME_STATE['animal'];
  let skill = GAME_STATE['hunting_skill'];
  let distance = GAME_STATE['animal_stats']['distance'];
  let animal_pos = GAME_STATE['animal_pos'];
  let cursor_pos = GAME_STATE['shoot_cursor_pos'];
  let arrow_pos = GAME_STATE['arrow_pos'];
  let length = 29;

  function updateLoop() {
    let isRight = animal_pos > length / 2;
    let number = rollD(10);
    if (number < 5) {
    } else if (number < 8) {
      animal_pos += (isRight) ? -1 : 1;
    } else {
      animal_pos += (isRight) ? 1 : -1;
    }
    cursor_pos += GAME_STATE['shoot_cursor_direction'];
  
    animal_pos = Math.max(animal.size, Math.min(animal_pos, length - 1 - animal.size));
    cursor_pos = Math.max(0, Math.min(cursor_pos, length - 1));

    if (cursor_pos == length - 1) {
      GAME_STATE['shoot_cursor_direction'] = -1;
    } else if (cursor_pos == 0) {
      GAME_STATE['shoot_cursor_direction'] = 1;
    }

    GAME_STATE['animal_pos'] = animal_pos;
    GAME_STATE['shoot_cursor_pos'] = cursor_pos;

    if (arrow_pos !== undefined) {
      arrow_pos[1] -= 1;
      arrow_pos[1] = Math.max(0, arrow_pos[1]);
      if (arrow_pos[1] == 0) {
        GAME_STATE['has_shot'] = false;
        GAME_STATE['arrow_pos'] = undefined;
        if (Math.abs(arrow_pos[0] - animal_pos) <= animal.size) {
          GAME_STATE['sneak_msg'] = `You hit the ${animal.name}.`;
        } else {
          GAME_STATE['sneak_msg'] = `You missed the ${animal.name}.`;
        }
      }
    }
  }
  
  updateLoop();
  
  let sneakProb =
      skillSuccessRate(skill * (1 + distance / 10), animal['base_difficulty']);

  let shootProb =
      skillSuccessRate(skill * (1 + 100 / distance), animal['base_difficulty']);

  function outcome() {
    return sneakingOutcome(animal, sneakProb);
  }
  
  template_data['sneak_prob'] = {str: sneakProb, fn: outcome};
  template_data['shoot_prob'] = {str: shootProb, fn: outcome};
  template_data['distance'] = distance.toString();

  template_data['animal_matrix'] = [""];
  for (let x = 0; x < 30; x++) {
    if (Math.abs(x - animal_pos) <= animal.size) {
      template_data['animal_matrix'][0] += "H";
    } else {
      template_data['animal_matrix'][0] += " ";
    }
  }
  
  let max_y = Math.floor((distance / 100) * 15);

  for (let y = 1; y < max_y; y++) {
    template_data['animal_matrix'].push("");
    for (let x = 0; x < 30; x++) {
      let arrow_pos = GAME_STATE['arrow_pos'];
      if (arrow_pos !== undefined) {
        let arrow_x = arrow_pos[0];
        let arrow_y = arrow_pos[1];
        if (x === arrow_x && y === arrow_y) {
          template_data['animal_matrix'][y] += "|";
          continue;
        }
      }
      template_data['animal_matrix'][y] += " ";
    }
  }

  template_data['animal_matrix'][max_y] = "";
  for (let x = 0; x < 30; x++) {
    if (x == cursor_pos) {
      template_data['animal_matrix'][max_y] += "^";
    } else {
      template_data['animal_matrix'][max_y] += " ";
    }
  }

  template_data['shoot_fn'] = function() {
    if (GAME_STATE['has_shot']) {
      return;
    }
    GAME_STATE['has_shot'] = true;
    GAME_STATE['arrow_pos'] = [cursor_pos, max_y];
    console.log('shot');
  }

  clearTimeout(GAME_STATE['refresh']);
  GAME_STATE['refresh'] = setTimeout(function() {
    run();
  }, 100);

  return template_data;
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

renderer.models['hunt'] = track;
renderer.models['sneak'] = sneak;
renderer.models['log'] = scrollable;
