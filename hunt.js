import {GAME_STATE, TEMP} from './data.js';
import {run} from './main.js';
import {renderer} from './renderer.js';
import * as _ from './yaml.js';

Object.assign(GAME_STATE, {
  'animals': [
    {
      'name': 'Rabbit',
      'hp': 2,
      'tracking_difficulty': 12,
      'chasing_difficulty': 8,
      'sneaking_difficulty': 10,
      'size': 0,
      'rest': 15,
      'speed': 1,
      'fights': false,
      'loot': [
        {name: 'Rabbit Carcass', q: 1}, {name: 'Rabbit Pelt', q: 1},
        {name: 'Rabbit Foot', q: 1}
      ],
      'min_tracking_skill': 0,
    },
    {
      'name': 'Deer',
      'hp': 6,
      'tracking_difficulty': 15,
      'chasing_difficulty': 10,
      'sneaking_difficulty': 14,
      'size': 2,
      'rest': 5,
      'speed': 3,
      'fights': false,
      'loot': [{name: 'Deer Pelt', q: 1, value: 50}],
      'min_tracking_skill': 0,
    },
    {
      'name': 'Boar',
      'hp': 10,
      'tracking_difficulty': 15,
      'chasing_difficulty': 12,
      'sneaking_difficulty': 14,
      'size': 1,
      'rest': 15,
      'speed': 3,
      'fights': false,
      'loot': [{name: 'Wolf Pelt', q: 1, value: 100}],
      'min_tracking_skill': 0,
    },
    {
      'name': 'Fox',
      'hp': 10,
      'tracking_difficulty': 16,
      'chasing_difficulty': 14,
      'sneaking_difficulty': 16,
      'size': 1,
      'rest': 15,
      'speed': 3,
      'fights': false,
      'loot': [{name: 'Wolf Pelt', q: 1, value: 100}],
      'min_tracking_skill': 1,
    },
    {
      'name': 'Wolf',
      'hp': 10,
      'tracking_difficulty': 14,
      'chasing_difficulty': 15,
      'sneaking_difficulty': 18,
      'size': 1,
      'rest': 15,
      'speed': 3,
      'fights': true,
      'loot': [{name: 'Wolf Pelt', q: 1, value: 100}]
    },
  ],
  'tracking_cost': 10,
  'drawing_cost': .1,
  'track_msg': 'The forest is teeming with wild life.',
});

Object.assign(GAME_STATE, {
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
  'scroll_height': 0,
});

function getAnimal(animal_name) {
  for (let animal of GAME_STATE['animals']) {
    if (animal['name'] == animal_name) {
      return animal;
    }
  }
  return {};
}

function getCurrentEnv() {
  const grid = GAME_STATE['map_grid'];
  const druidX = GAME_STATE['druid']['position']['x'];
  const druidY = GAME_STATE['druid']['position']['y'];
  const square = grid[druidX][druidY];
  return square['environment'];
}

export function getTrackingCost() {
  return GAME_STATE['tracking_cost'];
}

export function damageAnimal(isCritical) {
  let dmg = _.rollRangedDamage();

  dmg *= isCritical ? 2.0 : 1.0;

  let animal = GAME_STATE['animal'];
  animal['hp'] -= Math.min(dmg, animal['hp']);
  return dmg;
}

function getFrequencyBonus(frequency) {
  return {
    'none': -1000,
    'sparse': -4,
    'moderate': 0,
    'plentiful': +4
  }[frequency];
}

function getTrackableAnimals() {
  let skill = GAME_STATE['druid']['tracking_skill'];

  function outcome(animal) {
    if (_.isOverweight()) {
      _.addMessage(`You are overweight.`);
      return;
    }

    if (!_.useAbility(getTrackingCost())) {
      _.addMessage(`You do not have enough stamina.`);
      _.popView();
      return;
    }

    _.addTime('2:00');

    let success = _.dcCheck(skill, animal['chasing_difficulty']);
    if (!success) {
      _.addMessage(`You failed tracking the ${animal.name}.`);
      _.popView();
      return;
    }

    _.addMessage(`You tracked the ${animal.name}.`);
    GAME_STATE['animal'] = Object.assign({}, animal);
    GAME_STATE['animal_stats'] = {
      'hp': animal.base_hp,
      'distance': 100,
    };
    _.popView();
    _.setLoading(2000, 'Tracking...', 'sneak', true);
    GAME_STATE['animal_pos'] = 10;
    GAME_STATE['shoot_cursor_pos'] = 0;
    GAME_STATE['shoot_cursor_direction'] = 1;
    GAME_STATE['has_shot'] = false;
    GAME_STATE['arrow_pos'] = undefined;
    GAME_STATE['animal_goal'] = 10;
    GAME_STATE['animal_rest'] = 0;
  }

  let env = getCurrentEnv();

  let animals = [];
  for (let animal of GAME_STATE['animals']) {
    if (animal['min_tracking_skill'] > skill) {
      continue;
    }

    let frequency = env['animals'][animal['name']];

    let frequencyBonus = getFrequencyBonus(frequency);

    let success =
        _.dcCheck(skill + frequencyBonus, animal['tracking_difficulty']);
    if (success) {
      let prob = _.probDcCheck(skill, animal['chasing_difficulty']);
      animals.push({
        'name': animal['name'],
        'prob': prob,
        'fn': function() {
          outcome(animal);
        },
      });
    }
  }

  return animals;
}

export function track() {
  let env = GAME_STATE['current_env'];

  let template_data = {};
  template_data['animals'] = getTrackableAnimals();

  if (template_data['animals'].length === 0) {
    _.addMessage('You found no tracks.');
  }

  return template_data;
}

export function sneak() {
  function sneakingOutcome(animal) {
    let success =
        _.dcCheck(_.getSneakingSkill(), animal['sneaking_difficulty']);

    if (!success) {
      _.addMessage(`The ${animal.name} escaped.`);
      _.popView();
      return;
    }

    _.addMessage(`You snuck close to the ${animal.name}.`);
    GAME_STATE['animal_stats']['distance'] = 70;
  }

  let template_data = {};

  let animal = GAME_STATE['animal'];
  let distance = GAME_STATE['animal_stats']['distance'];
  let animal_pos = GAME_STATE['animal_pos'];
  let cursor_pos = GAME_STATE['shoot_cursor_pos'];
  let arrow_pos = GAME_STATE['arrow_pos'];
  let length = 29;
  let animal_goal = GAME_STATE['animal_goal'];

  function updateLoop() {
    if (animal_pos === animal_goal) {
      for (let i = 0; i < 5; i++) {
        GAME_STATE['animal_goal'] = 3 + _.rollD(12);
        if (Math.abs(animal_pos - GAME_STATE['animal_goal']) >= animal.speed) {
          break;
        }
      }
      GAME_STATE['animal_rest'] = animal.rest + _.rollD(5);
    }

    let animal_dir = (animal_goal - animal_pos > 0) ? 1 : -1;
    if (GAME_STATE['animal_rest'] > 0) {
      GAME_STATE['animal_rest']--;
    } else {
      animal_pos += animal_dir;
    }

    cursor_pos += GAME_STATE['shoot_cursor_direction'];

    animal_pos =
        Math.max(animal.size, Math.min(animal_pos, length - 1 - animal.size));
    cursor_pos = Math.max(0, Math.min(cursor_pos, length - 1));

    if (cursor_pos == length - 1) {
      GAME_STATE['shoot_cursor_direction'] = -1;
    } else if (cursor_pos == 0) {
      GAME_STATE['shoot_cursor_direction'] = 1;
    }

    GAME_STATE['animal_pos'] = animal_pos;
    GAME_STATE['shoot_cursor_pos'] = cursor_pos;

    if (arrow_pos === undefined) {
      if (!_.useAbility(GAME_STATE['drawing_cost'])) {
        _.addMessage(`The ${animal.name} ran away.`);
        _.popView();
      }
    } else {
      arrow_pos[1] -= 1;
      arrow_pos[1] = Math.max(0, arrow_pos[1]);
      if (arrow_pos[1] == 0) {
        GAME_STATE['has_shot'] = false;
        GAME_STATE['arrow_pos'] = undefined;
        if (Math.abs(arrow_pos[0] - animal_pos) <= animal.size) {
          let dmg = damageAnimal(false);
          if (animal['hp'] <= 0) {
            _.addMessage(`You did ${dmg} dmg and killed the ${animal.name}.`);
            getCurrentEnv()['animals'][animal.name] -= 1;
            _.popAndPushView('loot');
          } else if (animal.fights) {
            _.addMessage(`You did ${dmg}, the ${animal.name} fights back.`);
            _.popAndPushView('battle');
            GAME_STATE['enemy1']['hp'] = animal['hp'];
          } else {
            _.addMessage(`You did ${dmg}, the ${animal.name} is running.`);
            _.popAndPushView('chase');
            _.addTime('1:00');
          }
        } else {
          if (animal.fights) {
            _.addMessage(`The ${animal.name} is aggressive.`);
            _.popAndPushView('battle');
          } else {
            _.addMessage(`You missed the ${animal.name}.`);
            _.popView();
          }
        }
      }
    }
  }

  updateLoop();

  let sneakProb =
      _.probDcCheck(_.getSneakingSkill(), animal['sneaking_difficulty']);

  if (distance < 100) {
    sneakProb = "X";
  } else {
    template_data['sneak_prob'] = function() {
      return sneakingOutcome(animal);
    };
  }

  template_data['prob'] = {str: sneakProb, fn: template_data['sneak_prob']};
  template_data['distance'] = distance.toString();

  template_data['animal_matrix'] = [''];
  for (let x = 0; x < 30; x++) {
    if (arrow_pos !== undefined && arrow_pos[0] == x && arrow_pos[1] == 0) {
      template_data['animal_matrix'][0] += '|';
    } else if (Math.abs(x - animal_pos) <= animal.size) {
      template_data['animal_matrix'][0] += 'H';
    } else {
      template_data['animal_matrix'][0] += ' ';
    }
  }

  let max_y = Math.floor((distance / 100) * 15);

  for (let y = 1; y < max_y; y++) {
    template_data['animal_matrix'].push('');
    for (let x = 0; x < 30; x++) {
      let arrow_pos = GAME_STATE['arrow_pos'];
      if (arrow_pos !== undefined) {
        let arrow_x = arrow_pos[0];
        let arrow_y = arrow_pos[1];
        if (x === arrow_x && y === arrow_y) {
          template_data['animal_matrix'][y] += '|';
          continue;
        }
      }
      template_data['animal_matrix'][y] += ' ';
    }
  }


  template_data['animal_matrix'][max_y] = '';
  for (let x = 0; x < 30; x++) {
    if (x == cursor_pos) {
      template_data['animal_matrix'][max_y] += '^';
    } else {
      template_data['animal_matrix'][max_y] += ' ';
    }
  }

  template_data['shoot_fn'] =
      function() {
    if (GAME_STATE['has_shot']) {
      return;
    }
    GAME_STATE['has_shot'] = true;
    GAME_STATE['arrow_pos'] = [cursor_pos, max_y];
  }

  clearTimeout(GAME_STATE['refresh']);
  GAME_STATE['refresh'] = setTimeout(function() {
    run();
  }, 100);

  return template_data;
}

export function chase() {
  let env = GAME_STATE['current_env'];
  let skill = GAME_STATE['druid']['hunting_skill'];
  let animal = GAME_STATE['animal'];
  let population = env.population[animal['name']];
  let prob = _.skillSuccessRate(
      (skill + 5) * population, animal['tracking_difficulty']);
  let template_data = {
    'prob': {
      'str': prob,
      'fn': function() {
        let success = _.roll(prob);
        if (!success) {
          _.addMessage(`You failed to track the ${animal.name}.`);
          _.popView();
          return;
        }
        GAME_STATE['animal_stats'] = {
          'hp': animal.hp,
          'distance': 70,
        };
        _.addMessage(`You tracked the ${animal.name}.`);
        _.popAndPushView('sneak');
      }
    }
  };
  template_data['leave'] = function() {
    _.popView();
  };

  return template_data;
}

export function loot() {
  let animal = GAME_STATE['animal'];
  _.addMessage(`You killed the ${animal.name}.`);

  let template_data = {};
  template_data['leave'] = function() {
    _.popView();
  };

  let items = [];
  for (let item of animal.loot) {
    item['fn'] = function() {
      if (_.acquireItem(item.name, item.q)) {
        animal.loot = animal.loot.filter(_item => _item !== item);
      } else {
        _.addMessage(`The inventory is full.`);
      }
    };
    items.push(item);
  }
  template_data['items'] = items;
  return template_data;
}

export function forest() {
  let template_data = {};
  template_data['env'] = getCurrentEnv();

  template_data['hunt'] = function() {
    if (_.useAbility(getTrackingCost())) {
      _.addTime('1:00');
      _.addMessage('You spent some time finding tracks.');
      _.setLoading(2000, 'Exploring...', 'hunt');
    } else {
      _.addMessage('You do not have enough stamina.');
    }
  };

  let animals = template_data['env']['animals'];
  template_data['animals'] = [];
  for (let i = 0; i < Object.keys(animals).length; i++) {
    let key = Object.keys(animals)[i];
    let frequency = animals[key];
    let animal = getAnimal(key);

    let skill = GAME_STATE['druid']['tracking_skill'];
    let frequencyBonus = getFrequencyBonus(frequency);

    let prob =
        _.probDcCheck(skill + frequencyBonus, animal['tracking_difficulty']);

    template_data['animals'].push({
      'name': key,
      'population': frequency,
      'prob': prob,
    });
  }
  return template_data;
}

export function camp() {
  let template_data = {};
  template_data['rest'] = function() {
    _.setTimeNextDay('6:00');
    GAME_STATE['stamina'] = 100;

    let success = _.roll(GAME_STATE['encounter_prob']);
    if (success) {
      _.popAndPushView('battle');
      return;
    }

    if (!_.consumeItem('Ration')) {
      _.addMessage('You do not have enough rations.');
      return;
    }

    _.addMessage('You rested until the next morning.');
    _.popView();
  };

  template_data['rations'] = _.getItemQuantity('Ration');
  return template_data;
}

renderer.models['hunt'] = track;
renderer.models['sneak'] = sneak;
renderer.models['chase'] = chase;
renderer.models['loot'] = loot;
renderer.models['forest'] = forest;
renderer.models['camp'] = camp;
