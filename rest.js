import {utils} from './general.js';
import {renderer} from './renderer.js';
import {GAME_STATE, timeToFloat} from './data.js';

export function getStaminaRecoveryRate() {
  let spot_bonus = {
    'poor': -20,
    'normal': 0,
    'nice': 20,
  }[GAME_STATE['sleeping_spot']];

  let skill = GAME_STATE['druid']['camping_skill'];
  let bonus_multiplier = 1;
  if (skill >= 4) {
  } else if (skill >= 7) {
    bonus_multiplier = 2;
  } else if (skill >= 10) {
    bonus_multiplier = 3;
  }

  let camp_bonus = GAME_STATE['camp_setup'] ? 20 * bonus_multiplier : 0;
  let fire_bonus = GAME_STATE['bonfire_lit'] ? 20 * bonus_multiplier : 0;
  return 40 + spot_bonus + camp_bonus + fire_bonus + skill * 2;
}

export function getRandomEncounterChance() {
  if (utils.isInVillage()) {
    return 0;
  }

  let fire_bonus = GAME_STATE['bonfire_lit'] ? 0.1 : 0.0;

  let skill = GAME_STATE['druid']['camping_skill'];
  if (skill >= 7) {
    fire_bonus = 0;
  }

  return 0.1 + fire_bonus;
}

export function addTime(addTime) {
  setTime(addTime2(GAME_STATE['hours'], addTime));
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

export function setTime(time) {
  if (!GAME_STATE['resting']) {
    let base = Math.floor(timeToFloat(GAME_STATE['hours']) / 24);
    let test = Math.floor(timeToFloat(time) / 24);
    if (base != test) {
      rest(/*forced=*/ true);
      return false;
    }
  }

  GAME_STATE['hours'] = time;
  return true;
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

export function rest(forced, staminaRate) {
  let rate = 20;
  if (!forced) {
    if (staminaRate) {
      rate = staminaRate;
      GAME_STATE['encounter_prob'] = 0;
    } else {
      rate = getStaminaRecoveryRate();
      GAME_STATE['encounter_prob'] = getRandomEncounterChance();
    }
  } else {
    GAME_STATE['encounter_prob'] = 0.1;
  }

  if (GAME_STATE['force_encounter']) {
    GAME_STATE['encounter_prob'] = 1.0;
  }

  let current_time = timeToFloat(GAME_STATE['hours']);
  let new_time = timeToFloat(getTimeNextDay('6:00'));
  let time_diff = floatToTime(new_time - current_time);

  let success = utils.roll(GAME_STATE['encounter_prob']);
  if (success) {
    if (forced) {
      utils.pushView('battle');
    } else {
      utils.popAndPushView('battle');
    }
    return;
  }

  GAME_STATE['resting'] = true;
  utils.setLoading(3000, 'Resting...', time_diff, function() {
    GAME_STATE['resting'] = false;
    GAME_STATE['stamina'] = rate;

    // Resting at tavern.
    if (staminaRate) {
      GAME_STATE['druid']['food'] = GAME_STATE['druid']['max_food'];
    } else {
      if (GAME_STATE['druid']['food'] < 2) {
        if (hitDruid(2)) return;
      }
      GAME_STATE['druid']['food'] -= Math.min(GAME_STATE['druid']['food'], 2);
    }

    utils.addMessage('You rested until the next morning.');
    utils.popView();
  });
}

(async () => {
  const currentModule = await import(import.meta.url); 
  Object.assign(utils, currentModule);
})();

// =============================================================================
// TEMPLATES
// =============================================================================

export function camp() {
  let template_data = {};
  template_data['on_start'] = function() {
    let skill = GAME_STATE['druid']['camping_skill'];
    if (skill >= 10) {
      GAME_STATE['sleeping_spot'] = 'nice';
    } else {
      GAME_STATE['sleeping_spot'] = 'poor';
    }
    GAME_STATE['camp_setup'] = false;
    GAME_STATE['bonfire_lit'] = false;
    GAME_STATE['random_encounter'] = 0.2;
  };

  template_data['random_encounter'] = utils.getRandomEncounterChance();
  template_data['find_spot'] = function() {
    if (!utils.canAct(5)) {
      return;
    }

    utils.setLoading(1000, 'Finding spot...', '1:00', function() {
      let skill = GAME_STATE['druid']['camping_skill'];
      let result = utils.rollD(20) + skill;
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
    let skill = GAME_STATE['druid']['camping_skill'];
    let cost = (skill < 5) ? 5 : 0;
    if (!utils.canAct(cost)) {
      return;
    }

    GAME_STATE['camp_setup'] = true;
  };

  template_data['light_bonfire'] = function() {
    // if (!utils.canAct(2)) {
    //   return;
    // }

    GAME_STATE['bonfire_lit'] = true;
  };

  template_data['eat'] = function() {
    if (!utils.consumeItem('Ration')) {
      utils.addMessage('You do not have enough rations.');
      return;
    }

    GAME_STATE['druid']['food'] += 2;
    GAME_STATE['druid']['food'] =
        Math.min(GAME_STATE['druid']['max_food'], GAME_STATE['druid']['food']);
  };

  template_data['skin'] = function() {
    utils.pushView('skin');
  };

  let rate = utils.getStaminaRecoveryRate();
  template_data['rate'] = rate;

  template_data['rest'] = function() {
    utils.rest();
  };

  template_data['rations'] = utils.getItemQuantity('Ration');
  return template_data;
}

export function skin() {
  let template_data = {};

  let carcasses = [];
  for (let item of GAME_STATE['druid']['items']) {
    if (!utils.getItemData(item.name)['carcass']) continue;
    carcasses.push(item);
  }

  let items = [];
  for (let item of carcasses) {
    item['value'] = utils.getItemData(item.name)['value'];
    item['fn'] = function() {
      // GAME_STATE['current_loot'] =
      //     GAME_STATE['current_loot'].filter(_item => _item !== item);
    };
    items.push(item);
  }
  template_data['items'] = items;
  return template_data;
}

renderer.models['camp'] = camp;
renderer.models['skin'] = skin;
