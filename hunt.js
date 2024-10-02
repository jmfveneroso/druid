import {GAME_STATE, TEMP} from './data.js';
import {run} from './main.js';
import {renderer} from './renderer.js';
import * as _ from './yaml.js';

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

  let env = getCurrentEnv();

  function outcome(animal) {
    if (!_.canAct(5)) {
      return;
    }

    _.setLoading(1000, 'Tracking...', '2:00', function() {
      let success = _.dcCheck(skill, animal['chasing_difficulty']);
      if (!success) {
        _.addMessage(`You failed to track the ${animal.name}.`);
        return;
      }

      _.popAndPushView('sneak');

      let frequency = env['animals'][animal['name']];
      let is_special = frequency['has_special'];
      if (is_special) {
        is_special = _.rollD(5) == 5;
        // is_special = true;
      }

      _.addMessage(`You tracked the ${animal.name}.`);
      GAME_STATE['animal'] = Object.assign({}, animal);
      GAME_STATE['animal_stats'] = {
        'hp': animal.base_hp,
        'distance': 100,
        'is_special': is_special,
      };

      GAME_STATE['animal_pos'] = Math.floor(2 + Math.random() * 22);
      GAME_STATE['shoot_cursor_pos'] = 0;
      GAME_STATE['shoot_cursor_direction'] = 1;
      GAME_STATE['has_shot'] = false;
      GAME_STATE['has_shot_2nd'] = false;
      GAME_STATE['arrow_pos'] = undefined;
      GAME_STATE['arrow2_pos'] = undefined;
      GAME_STATE['arrow2_pos_delay'] = 0;
      GAME_STATE['animal_goal'] = 10;
      GAME_STATE['animal_rest'] = 0;
    });
  }

  let animals = [];
  for (let animal of GAME_STATE['animals']) {
    if (animal['min_tracking_skill'] > skill) {
      continue;
    }

    let frequency = env['animals'][animal['name']];
    let has_special = frequency['has_special'];
    frequency = frequency['frequency'];

    let frequencyBonus = getFrequencyBonus(frequency);

    let success =
        _.dcCheck(skill + frequencyBonus, animal['tracking_difficulty']);
    if (success) {
      let prob = _.probDcCheck(skill, animal['chasing_difficulty']);

      animals.push({
        'name': animal['name'],
        'prob': prob,
        'has_special': (has_special == 1) ? '(*)' : '   ',
        'fn': function() {
          outcome(animal);
        },
      });
      if (animal['name'] == 'Boar') {
        console.log(animals);
      }
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
  let arrow2_pos = GAME_STATE['arrow2_pos'];
  let length = 29;
  let animal_goal = GAME_STATE['animal_goal'];
  let is_special = GAME_STATE['animal_stats']['is_special'];

  let max_y = Math.floor((distance / 100) * 15);

  function updateLoop() {
    if (animal_pos === animal_goal) {
      if (animal.predictable) {
        if (GAME_STATE['animal_goal'] === Math.floor(animal.size)) {
          GAME_STATE['animal_goal'] = 28 - Math.ceil(animal.size);
        } else {
          GAME_STATE['animal_goal'] = Math.floor(animal.size);
        }
      } else {
        for (let i = 0; i < 5; i++) {
          GAME_STATE['animal_goal'] = Math.floor(animal.size) + _.rollD(26 - Math.ceil(animal.size));
          if (Math.abs(animal_pos - GAME_STATE['animal_goal']) >=
              animal.speed) {
            break;
          }
        }
      }

      GAME_STATE['animal_rest'] = animal.rest;
      if (!animal.predictable) {
        GAME_STATE['animal_rest'] += _.rollD(5);
      }
    }

    let animal_dir = (GAME_STATE['animal_goal'] - animal_pos > 0) ? 1 : -1;
    if (Math.abs(GAME_STATE['animal_goal'] - animal_pos) < animal.move_speed) {
      // animal_dir *= Math.abs(GAME_STATE['animal_goal'] - animal_pos);
      animal_dir = 0;
      animal_pos = animal_goal;
    } else {
      animal_dir *= animal['move_speed'];
    }

    if (GAME_STATE['animal_rest'] > 0) {
      GAME_STATE['animal_rest']--;
    } else {
      animal_pos += animal_dir;
    }

    cursor_pos += GAME_STATE['shoot_cursor_direction'];

    let animal_lft = Math.floor(animal.size);
    let animal_rgt = +Math.ceil(animal.size);
    animal_pos =
        Math.max(animal_lft, Math.min(animal_pos, length - 1 - animal_rgt));
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
    }

    if (GAME_STATE['arrow2_pos_delay'] > 0) {
      if (--GAME_STATE['arrow2_pos_delay'] == 0) {
        GAME_STATE['arrow2_pos'] = [cursor_pos, max_y];
      }
    }

    let both_out = true;
    for (let i = 0; i < 2; i++) {
      let pos = i == 0 ? arrow_pos : arrow2_pos;
      if (pos === undefined) {
        continue;
      }

      pos[1] -= _.getArrowSpeed();
      pos[1] = Math.max(0, pos[1]);
      if (pos[1] == 0) {
        GAME_STATE['has_shot'] = false;
        if (i == 0) {
          GAME_STATE['arrow_pos'] = undefined;
        } else {
          GAME_STATE['arrow2_pos'] = undefined;
        }

        if (pos[0] >= animal_pos + animal_lft &&
            pos[0] <= animal_pos + animal_rgt) {
          GAME_STATE['arrow_pos'] = undefined;
          GAME_STATE['arrow2_pos'] = undefined;

          let dmg = damageAnimal(false);
          if (animal['hp'] <= 0) {
            _.addMessage(`You did ${dmg} dmg and killed the ${animal.name}.`);
            if (is_special) {
              getCurrentEnv()['animals'][animal.name]['has_special'] = 0;
            }
            GAME_STATE['current_loot'] =
                Array.from((is_special) ? animal.special_loot : animal.loot);
            _.popAndPushView('loot');
          } else if (animal.fights) {
            _.addMessage(`You did ${dmg}, the ${animal.name} fights back.`);
            _.popAndPushView('battle');
            GAME_STATE['enemy1']['hp'] = animal['hp'];
          } else {
            _.setLoading(1000, 'Chasing...', '1:00', function() {
              GAME_STATE['animal_stats'] = {
                'hp': animal.hp,
                'distance': 70,
                'is_special': is_special,
              };
              _.addMessage(`You tracked the ${animal.name}.`);
            });

            // _.addMessage(`You did ${dmg}, the ${animal.name} is running.`);
            // _.popAndPushView('chase');
            // _.popAndPushView('sneak');
            // _.addTime('1:00');
          }
          both_out = false;
        }
      } else {
        both_out = false;
      }
    }

    if ((arrow_pos || arrow2_pos) && both_out) {
      if (animal.fights) {
        _.addMessage(`The ${animal.name} is aggressive.`);
        _.popAndPushView('battle');
      } else {
        _.addMessage(`You missed the ${animal.name}.`);
        _.popView();
      }
    }
  }

  updateLoop();

  let sneakProb =
      _.probDcCheck(_.getSneakingSkill(), animal['sneaking_difficulty']);

  if (distance < 100) {
    sneakProb = 'X';
  } else {
    template_data['sneak_prob'] = function() {
      return sneakingOutcome(animal);
    };
  }

  template_data['prob'] = {str: sneakProb, fn: template_data['sneak_prob']};
  template_data['distance'] = distance.toString();

  let animal_lft = -Math.floor(animal.size);
  let animal_rgt = +Math.ceil(animal.size);

  template_data['animal_matrix'] = [''];
  for (let x = 0; x < 30; x++) {
    if (arrow_pos !== undefined && arrow_pos[0] == x && arrow_pos[1] == 0) {
      template_data['animal_matrix'][0] += '|';
    } else if (
        arrow2_pos !== undefined && arrow2_pos[0] == x && arrow2_pos[1] == 0) {
      template_data['animal_matrix'][0] += '|';
    } else if (x >= animal_pos + animal_lft && x <= animal_pos + animal_rgt) {
      // } else if (Math.abs(x - animal_pos) <= animal.size) {
      if (is_special) {
        template_data['animal_matrix'][0] += '*';
      } else {
        template_data['animal_matrix'][0] += 'H';
      }
    } else {
      template_data['animal_matrix'][0] += ' ';
    }
  }

  for (let y = 1; y < max_y; y++) {
    template_data['animal_matrix'].push('');
    for (let x = 0; x < 30; x++) {
      let arrow_pos = GAME_STATE['arrow_pos'];
      let arrow2_pos = GAME_STATE['arrow2_pos'];
      if (arrow_pos !== undefined) {
        let arrow_x = arrow_pos[0];
        let arrow_y = arrow_pos[1];
        if (x === arrow_x && y === arrow_y) {
          template_data['animal_matrix'][y] += '|';
          continue;
        }
      }
      if (arrow2_pos !== undefined) {
        let arrow_x = arrow2_pos[0];
        let arrow_y = arrow2_pos[1];
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

    if (!_.consumeItem('Arrows')) {
      _.addMessage(`You are out of arrows.`);
      return;
    }

    GAME_STATE['has_shot'] = true;
    GAME_STATE['has_shot_2nd'] = false;
    GAME_STATE['arrow_pos'] = [cursor_pos, max_y];

    if (_.hasDoubleArrows()) {
      GAME_STATE['arrow2_pos_delay'] = 2;
    }
  }

  clearTimeout(GAME_STATE['refresh']);
  GAME_STATE['refresh'] = setTimeout(function() {
    run();
  }, 100);

  template_data['arrows'] = _.getItemQuantity('Arrows');

  return template_data;
}

export function loot() {
  let template_data = {};
  template_data['leave'] = function() {
    _.popView();
  };

  let items = [];

  for (let item of GAME_STATE['current_loot']) {
    item['value'] = _.getItemData(item.name)['value'];
    item['fn'] = function() {
      if (_.acquireItem(item.name, item.q)) {
        GAME_STATE['current_loot'] =
            GAME_STATE['current_loot'].filter(_item => _item !== item);
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
  let env = getCurrentEnv();
  template_data['env'] = env;

  template_data['hunt'] = function() {
    if (_.useAbility(getTrackingCost())) {
      _.addMessage('You spent some time finding tracks.');
      _.setLoading(1000, 'Exploring...', '1:00', function() {
        
      if (_.roll(0.2)) {
        _.pushView('battle');
        return;
      }

        _.pushView('hunt');
      });
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
    let has_special = frequency['has_special'];
    frequency = frequency['frequency'];
    let frequencyBonus = getFrequencyBonus(frequency);

    let prob =
        _.probDcCheck(skill + frequencyBonus, animal['tracking_difficulty']);

    template_data['animals'].push({
      'name': key,
      'population': frequency,
      'has_special': has_special ? '(*)' : '   ',
      'prob': prob,
    });
  }
  console.log(template_data['animals']);
  return template_data;
}

export function camp() {
  let template_data = {};
  template_data['on_start'] = function() {
    GAME_STATE['sleeping_spot'] = 'poor';
    GAME_STATE['camp_setup'] = false;
    GAME_STATE['bonfire_lit'] = false;
    GAME_STATE['random_encounter'] = 0.2;
  };

  template_data['random_encounter'] = _.getRandomEncounterChance();
  template_data['find_spot'] = function() {
    if (!_.canAct(5)) {
      return;
    }

    _.setLoading(1000, 'Finding spot...', '1:00', function() {
      let skill = GAME_STATE['druid']['camping_skill'];
      let result = _.rollD(20) + skill;
      if (result <= 8) {
        GAME_STATE['sleeping_spot'] = 'poor';
      } else if (result <= 15) {
        GAME_STATE['sleeping_spot'] = 'normal';
      } else {
        GAME_STATE['sleeping_spot'] = 'nice';
      }
      GAME_STATE['camp_setup'] = false;
      GAME_STATE['bonfire_lit'] = false;
      GAME_STATE['random_encounter'] = 0.2;
    });
  };

  template_data['setup_camp'] = function() {
    if (!_.canAct(2)) {
      return;
    }

    GAME_STATE['camp_setup'] = true;
  };

  template_data['light_bonfire'] = function() {
    if (!_.canAct(2)) {
      return;
    }

    GAME_STATE['bonfire_lit'] = true;
  };

  template_data['eat'] = function() {
    if (!_.consumeItem('Ration')) {
      addMessage('You do not have enough rations.');
      return;
    }

    GAME_STATE['druid']['food'] += 2;
    GAME_STATE['druid']['food'] =
        Math.min(GAME_STATE['druid']['max_food'], GAME_STATE['druid']['food']);
  };

  template_data['skin'] = function() {
    _.pushView('skin');
  };

  let rate = _.getStaminaRecoveryRate();
  template_data['rate'] = rate;

  template_data['rest'] = function() {
    _.rest();
  };

  template_data['rations'] = _.getItemQuantity('Ration');
  return template_data;
}

export function skin() {
  let template_data = {};

  let carcasses = [];
  for (let item of GAME_STATE['druid']['items']) {
    if (!_.getItemData(item.name)['carcass']) continue;
    carcasses.push(item);
  }

  let items = [];
  for (let item of carcasses) {
    item['value'] = _.getItemData(item.name)['value'];
    item['fn'] = function() {
      // GAME_STATE['current_loot'] =
      //     GAME_STATE['current_loot'].filter(_item => _item !== item);
    };
    items.push(item);
  }
  template_data['items'] = items;
  return template_data;
}

renderer.models['hunt'] = track;
renderer.models['sneak'] = sneak;
renderer.models['loot'] = loot;
renderer.models['forest'] = forest;
renderer.models['camp'] = camp;
renderer.models['skin'] = skin;
