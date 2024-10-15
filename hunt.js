import {GAME_STATE, TEMP} from './data.js';
import {utils} from './general.js';
import {getCurrentSquare} from './region_map.js';
import {renderer, run} from './renderer.js';

function getAnimal(animal_name) {
  for (let animal of GAME_STATE['animals']) {
    if (animal['name'] == animal_name) {
      return animal;
    }
  }
  return {};
}

export function getTrackingCost() {
  return GAME_STATE['tracking_cost'];
}

export function damageAnimal(isCritical) {
  let dmg = utils.rollRangedDamage();

  dmg *= isCritical ? 2.0 : 1.0;

  let animal = GAME_STATE['animal'];
  animal['hp'] -= Math.min(dmg, animal['hp']);
  return dmg;
}

function getTrackableAnimalsForTemplate() {
  let skill = utils.getTrackingSkill();

  let env = utils.getCurrentEnv();

  function outcome(animal) {
    if (!utils.canAct(5)) {
      return;
    }

    GAME_STATE['chasing_goal'] = {
      'x': utils.rollD(32) - 1,
      'y': utils.rollD(18) - 1,
    };

    utils.setChasing(1000, 'Tracking...', '2:00', function() {
      getCurrentSquare().tracks = [];
      let success = utils.dcCheck(skill, animal['chasing_difficulty']);
      success = success || GAME_STATE['debug'];
      if (!success) {
        utils.addMessage(`You failed to track the ${animal.name}.`);
        return;
      }

      utils.popAndPushView('sneak');

      let frequency = env['animals'][animal['name']];
      let is_special = frequency['has_special'];
      if (is_special) {
        is_special = utils.rollD(5) == 5;
      }

      utils.addMessage(`You tracked the ${animal.name}.`);
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
  let trackable_animals = getCurrentSquare().tracks;
  for (let animal of GAME_STATE['animals']) {
    if (!trackable_animals.includes(animal['name'])) {
      continue;
    }

    let prob = utils.probDcCheck(skill, animal['chasing_difficulty']);

    let frequency = env['animals'][animal['name']];
    let has_special = frequency['has_special'];

    animals.push({
      'name': animal['name'],
      'prob': prob,
      'has_special': (has_special == 1) ? '(*)' : '   ',
      'fn': function() {
        outcome(animal);
      },
    });
  }

  return animals;
}

export function track() {
  let env = GAME_STATE['current_env'];

  let template_data = {};
  template_data['animals'] = getTrackableAnimalsForTemplate();

  if (template_data['animals'].length === 0) {
    utils.addMessage('You found no tracks.');
  }

  return template_data;
}

export function sneak() {
  function sneakingOutcome(animal) {
    let success =
        utils.dcCheck(utils.getSneakingSkill(), animal['sneaking_difficulty']);

    if (!success) {
      utils.addMessage(`The ${animal.name} escaped.`);
      utils.popView();
      return;
    }

    utils.addMessage(`You snuck close to the ${animal.name}.`);
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
          GAME_STATE['animal_goal'] = Math.floor(animal.size) +
              utils.rollD(26 - Math.ceil(animal.size));
          if (Math.abs(animal_pos - GAME_STATE['animal_goal']) >=
              animal.speed) {
            break;
          }
        }
      }

      GAME_STATE['animal_rest'] = animal.rest;
      if (!animal.predictable) {
        GAME_STATE['animal_rest'] += utils.rollD(5);
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
    let animal_rgt = Math.ceil(animal.size);
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
      if (!utils.useAbility(GAME_STATE['drawing_cost'])) {
        utils.addMessage(`The ${animal.name} ran away.`);
        utils.popView();
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

      pos[1] -= utils.getArrowSpeed();
      pos[1] = Math.max(0, pos[1]);
      if (pos[1] == 0) {
        GAME_STATE['has_shot'] = false;
        if (i == 0) {
          GAME_STATE['arrow_pos'] = undefined;
        } else {
          GAME_STATE['arrow2_pos'] = undefined;
        }

        if (pos[0] >= animal_pos - animal_lft &&
            pos[0] <= animal_pos + animal_rgt) {
          GAME_STATE['arrow_pos'] = undefined;
          GAME_STATE['arrow2_pos'] = undefined;

          let dmg = damageAnimal(false);
          if (animal['hp'] <= 0) {
            utils.addMessage(
                `You did ${dmg} dmg and killed the ${animal.name}.`);
            if (is_special) {
              utils.getCurrentEnv()['animals'][animal.name]['has_special'] = 0;
            }
            GAME_STATE['current_loot'] =
                Array.from((is_special) ? animal.special_loot : animal.loot);
            utils.popAndPushView('loot');
          } else if (animal.fights) {
            utils.addMessage(`You did ${dmg}, the ${animal.name} fights back.`);
            utils.popAndPushView('battle');
            GAME_STATE['enemy1']['hp'] = animal['hp'];
          } else {
            utils.setLoading(1000, 'Chasing...', '1:00', function() {
              GAME_STATE['animal_stats'] = {
                'hp': animal.hp,
                'distance': 70,
                'is_special': is_special,
              };
              utils.addMessage(`You tracked the ${animal.name}.`);
            });
          }
          both_out = false;
        }
      } else {
        both_out = false;
      }
    }

    if ((arrow_pos || arrow2_pos) && both_out) {
      if (animal.fights) {
        utils.addMessage(`The ${animal.name} is aggressive.`);
        utils.popAndPushView('battle');
      } else {
        utils.addMessage(`You missed the ${animal.name}.`);
        utils.popView();
      }
    }
  }

  updateLoop();

  let sneakProb = utils.probDcCheck(
      utils.getSneakingSkill(), animal['sneaking_difficulty']);

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

  let bow_skill = utils.getBowSkill();

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

      if ((max_y - y) < bow_skill && x == cursor_pos &&
          !GAME_STATE['has_shot']) {
        template_data['animal_matrix'][y] += '.';
      } else {
        template_data['animal_matrix'][y] += ' ';
      }
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

    if (!utils.consumeItem('Arrows')) {
      utils.addMessage(`You are out of arrows.`);
      return;
    }

    GAME_STATE['has_shot'] = true;
    GAME_STATE['has_shot_2nd'] = false;
    GAME_STATE['arrow_pos'] = [cursor_pos, max_y];

    if (utils.hasDoubleArrows()) {
      GAME_STATE['arrow2_pos_delay'] = 2;
    }
  }

  clearTimeout(GAME_STATE['refresh']);
  GAME_STATE['refresh'] = setTimeout(function() {
    run();
  }, 100);

  template_data['arrows'] = utils.getItemQuantity('Arrows');

  return template_data;
}

export function loot() {
  let template_data = {};
  template_data['leave'] = function() {
    utils.popView();
  };

  let items = [];

  for (let i = 0; i < GAME_STATE['current_loot'].length; i++) {
    let item = GAME_STATE['current_loot'][i];
    item['value'] = utils.getItemData(item.name)['value'];
    item['fn'] = function() {
      if (utils.acquireItem(item.name, item.q)) {
        GAME_STATE['current_loot'].splice(i, 1);
      } else {
        utils.addMessage(`The inventory is full.`);
      }
    };
    items.push(item);
  }
  template_data['items'] = items;
  return template_data;
}

export function forest() {
  let template_data = {};
  let env = utils.getCurrentEnv();
  template_data['env'] = env;

  template_data['hunt'] = function() {
    if (utils.useAbility(getTrackingCost())) {
      utils.addMessage('You spent some time finding tracks.');
      utils.pushView('hunt');
      // utils.setLoading(1000, 'Exploring...', '1:00', function() {
      //   // if (utils.roll(0.2)) {
      //   //   utils.pushView('battle');
      //   //   return;
      //   // }
      //   utils.pushView('hunt');
      // });
    } else {
      utils.addMessage('You do not have enough stamina.');
    }
  };

  let animals = template_data['env']['animals'];
  template_data['animals'] = [];
  for (let i = 0; i < Object.keys(animals).length; i++) {
    let key = Object.keys(animals)[i];
    let frequency = animals[key];
    let animal = getAnimal(key);

    let skill = utils.getTrackingSkill();
    let has_special = frequency['has_special'];
    frequency = frequency['frequency'];
    let frequencyBonus = utils.getFrequencyBonus(frequency);

    let prob = utils.probDcCheck(
        skill + frequencyBonus, animal['tracking_difficulty']);

    template_data['animals'].push({
      'name': key,
      'population': frequency,
      'has_special': has_special ? '(*)' : '   ',
      'prob': prob,
    });
  }
  return template_data;
}

renderer.models['hunt'] = track;
renderer.models['sneak'] = sneak;
renderer.models['loot'] = loot;
renderer.models['forest'] = forest;
