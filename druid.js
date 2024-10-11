import {GAME_STATE} from './data.js';
import {utils} from './general.js';
import {renderer} from './renderer.js';

export class Druid {
  constructor(renderer, x, y, onclick_fn) {
    this.renderer = renderer;
    this.buffer = this.createBuffer(MAX_WIDTH, MAX_HEIGHT);
    this.max_width = 0;
    this.max_height = 0;
    this.current_char = 0;
    this.current_line = 0;
    this.counter = renderer.counter;
    this.onclick = onclick_fn;
    this.parent_x = x;
    this.parent_y = y;
  }
}

utils.useAbility = function(stamina_cost) {
  if (GAME_STATE['stamina'] >= stamina_cost) {
    GAME_STATE['stamina'] -= stamina_cost;
    return true;
  }
  return false;
};

utils.canAct = function(cost) {
  if (GAME_STATE['debug']) return true;

  if (utils.isOverweight()) {
    utils.addMessage(`You are overweight.`);
    return false;
  }

  if (!utils.useAbility(cost)) {
    utils.addMessage(`You do not have enough stamina.`);
    utils.popView();
    return false;
  }

  return true;
};

utils.getDruidArmorClass = function() {
  return 10 + GAME_STATE['druid']['armor']['bonus'];
};

utils.setStatus = function(new_status) {
  GAME_STATE['druid']['status'][new_status] = true;
};

utils.removeStatus = function(new_status) {
  GAME_STATE['druid']['status'][new_status] = false;
};

utils.hasStatus = function(status) {
  return GAME_STATE['druid']['status'][status];
};

function getPenaltyAfterStatus(status, critical_status) {
  if (utils.hasStatus(status)) {
    return 2;
  } else if (utils.hasStatus(critical_status)) {
    return 4;
  }
  return 0;
}

function getMultiplierAfterStatus(status, critical_status) {
  let multiplier = 1.0;
  if (utils.hasStatus(status)) {
    multiplier = 0.75;
  } else if (utils.hasStatus(critical_status)) {
    multiplier = 0.5;
  }
  return multiplier;
}

function getSkillAfterStatus(skill_name, status, critical_status) {
  let skill = GAME_STATE['druid'][skill_name + '_skill'];
  let penalty = getPenaltyAfterStatus(status, critical_status);
  return skill + penalty;
}

utils.getSwordSkill = function() {
  return getSkillAfterStatus('sword', 'bleeding', 'hemorrhaging');
};

utils.getBowSkill = function() {
  return getSkillAfterStatus('bow', 'confused', 'hallucinating');
};

utils.getSneakingSkill = function() {
  let skill = getSkillAfterStatus('sneaking', 'debilitated', 'poisoned');
  return skill + GAME_STATE['druid']['boots']['bonus'];
};

utils.getTrackingSkill = function() {
  return getSkillAfterStatus('tracking', 'fatigued', 'exhausted');
};

utils.getCampingSkill = function() {
  return getSkillAfterStatus('camping', 'nauseous', 'retching');
};

utils.getOrganState = function(organ) {
  if (GAME_STATE['druid'][organ + '_hp'] <= 0) {
    return 'critical';
  } else if (GAME_STATE['druid'][organ + '_hp'] <= 5) {
    return 'impaired';
  }
  return 'healthy';
};

utils.getMaxHp = function() {
  let max_hp = GAME_STATE['druid']['max_hp'];

  let multiplier = getMultiplierAfterStatus('bleeding', 'hemorrhaging');
  return max_hp * multiplier;
};


utils.getMaxStamina = function() {
  let max_stamina = GAME_STATE['druid']['max_stamina'];

  let multiplier = getMultiplierAfterStatus('fatigued', 'exhausted');
  return max_stamina * multiplier;
};

utils.rollMeleeDamage = function() {
  let dmg = utils.rollD(GAME_STATE['druid']['melee']['base_die']) +
      GAME_STATE['druid']['melee']['bonus'];

  dmg -= getPenaltyAfterStatus('debilitated', 'poisoned');
  return Math.max(1, dmg);
};

utils.rollRangedDamage = function() {
  let dmg = utils.rollD(GAME_STATE['druid']['ranged']['base_die']) +
      GAME_STATE['druid']['ranged']['bonus'] + utils.getBowSkill();

  dmg -= getPenaltyAfterStatus('confused', 'hallucinating');
  return dmg;
};

utils.increaseSkill = function(skill) {
  let cost = GAME_STATE['druid'][skill] + 1;
  if (GAME_STATE['druid']['skill_points'] >= cost) {
    GAME_STATE['druid']['skill_points'] -= cost;
    GAME_STATE['druid'][skill] += 1;
    return;
  }

  utils.addMessage('You do not have enough skill points');
};

utils.getRangedWeapon = function() {
  return GAME_STATE['druid']['ranged']['name'];
};

utils.equipWeapon = function(item_name) {
  if (item_name === 'Silver Sword' && getSwordSkill() < 4) {
    utils.addMessage('You need sword > 4 to equip a silver sword.');
    return;
  }

  if (item_name === 'Gold Sword' && getSwordSkill() < 7) {
    utils.addMessage('You need sword > 7 to equip a gold sword.');
    return;
  }

  if (item_name === 'Platinum Sword' && getSwordSkill() < 10) {
    utils.addMessage('You need sword > 10 to equip a Platinum Sword.');
    return;
  }

  let item_data = GAME_STATE['items'][item_name];

  utils.consumeItem(item_name);
  utils.acquireItem(GAME_STATE['druid']['melee']['name'], 1);

  GAME_STATE['druid']['melee']['name'] = item_name;
  GAME_STATE['druid']['melee']['base_die'] = item_data['base_die'];
  GAME_STATE['druid']['melee']['bonus'] = item_data['bonus'];
};

utils.equipRangedWeapon = function(item_name) {
  if (item_name === 'Silver Bow' && utils.getBowSkill() < 4) {
    utils.addMessage('You need bow > 4 to equip a silver bow.');
    return;
  }

  if (item_name === 'Gold Bow' && utils.getBowSkill() < 7) {
    utils.addMessage('You need bow > 7 to equip a gold bow.');
    return;
  }

  if (item_name === 'Gun' && utils.getBowSkill() < 10) {
    utils.addMessage('You need bow > 10 to equip a gun.');
    return;
  }

  let item_data = GAME_STATE['items'][item_name];

  utils.consumeItem(item_name);
  utils.acquireItem(GAME_STATE['druid']['ranged']['name'], 1);

  GAME_STATE['druid']['ranged']['name'] = item_name;
  GAME_STATE['druid']['ranged']['base_die'] = item_data['base_die'];
  GAME_STATE['druid']['ranged']['bonus'] = item_data['bonus'];
};

utils.equipArmor = function(item_name) {
  let item_data = GAME_STATE['items'][item_name];

  utils.consumeItem(item_name);
  utils.acquireItem(GAME_STATE['druid']['armor']['name'], 1);

  GAME_STATE['druid']['armor']['name'] = item_name;
  GAME_STATE['druid']['armor']['bonus'] = item_data['bonus'];
};

utils.equipBoots = function(item_name) {
  let item_data = GAME_STATE['items'][item_name];

  utils.consumeItem(item_name);
  utils.acquireItem(GAME_STATE['druid']['boots']['name'], 1);

  GAME_STATE['druid']['boots']['name'] = item_name;
  GAME_STATE['druid']['boots']['bonus'] = item_data['bonus'];
};

utils.cureOrgan =
    function(organ, amount, can_cure_critical) {
  if (GAME_STATE['druid'][organ + '_hp'] == 0 && !can_cure_critical) {
    return false;
  }

  GAME_STATE['druid'][organ + '_hp'] += amount;
  if (GAME_STATE['druid'][organ + '_hp'] >=
      GAME_STATE['druid'][organ + '_max_hp']) {
    GAME_STATE['druid'][organ + '_hp'] = GAME_STATE['druid'][organ + '_max_hp'];
    GAME_STATE['druid'][organ + '_diseases'] = [];
  }
}

    utils.usePotion = function(item_name) {
  let item_data = GAME_STATE['items'][item_name];

  utils.consumeItem(item_name);
  if (item_name === 'Elixir') {
    GAME_STATE['druid']['hp'] = utils.getMaxHp();
    GAME_STATE['druid']['food'] = GAME_STATE['druid']['max_food'];
    GAME_STATE['druid']['stamina'] = GAME_STATE['druid']['max_stamina'];
  }

  const words = item_name.split(' ');
  let firstWord = words[0].toLowerCase();

  if (Object.keys(organ_stats).includes(firstWord)) {
    utils.cureOrgan(firstWord, 10, false);
  }

  firstWord = firstWord.slice(0, -1);
  if (Object.keys(organ_stats).includes(firstWord)) {
    utils.cureOrgan(firstWord, 10, true);
  }
};

utils.hitDruid = function(dmg) {
  GAME_STATE['druid']['hp'] -= Math.min(dmg, GAME_STATE['druid']['hp']);
  if (GAME_STATE['druid']['hp'] <= 0) {
    utils.pushView('game_over');
    return true;
  }
  return false;
};

utils.damageOrgan = function(organ, dmg) {
  GAME_STATE['druid'][organ + '_hp'] -=
      Math.min(dmg, GAME_STATE['druid'][organ + '_hp']);
};

utils.isInVillage = function() {
  const grid = GAME_STATE['map_grid'];
  const i = GAME_STATE['druid']['position']['x'];
  const j = GAME_STATE['druid']['position']['y'];

  const village_index = grid[i][j]['village'];
  return (village_index !== undefined);
};

utils.isOverweight = function() {
  return utils.getCurrentWeight() > GAME_STATE['druid']['max_weight'];
};

utils.getArrowSpeed = function() {
  if (utils.getRangedWeapon() === 'Gun') {
    return 5;
  }

  if (utils.getRangedWeapon() === 'Gold Bow') {
    return true;
  }

  return 1;
};

utils.hasDoubleArrows = function() {
  if (utils.getRangedWeapon() === 'Gun') {
    return false;
  }

  if (utils.getRangedWeapon() === 'Silver Bow') {
    return true;
  }

  if (utils.getRangedWeapon() === 'Gold Bow') {
    return true;
  }

  return false;
};

utils.takeAction = function(skill, dc) {
  if (!utils.canAct(5)) {
    return false;
  }

  let missChance = 0.0;
  if (utils.hasStatus('confused')) {
    missChance = 0.1;
  } else if (utils.hasStatus('hallucinating')) {
    missChance = 0.2;
  }
};

function getRandomDisease() {
  let diseaseTypes = GAME_STATE['disease_types'];

  // Calculate the cumulative probability distribution
  let cumulativeProbability = 0;
  const probabilityRanges = [];
  for (const disease in diseaseTypes) {
    cumulativeProbability += diseaseTypes[disease].chance;
    probabilityRanges.push({
      disease,
      range: [
        cumulativeProbability - diseaseTypes[disease].chance,
        cumulativeProbability
      ]
    });
  }

  // Generate a random number between 0 and 1
  const randomNumber = Math.random();

  // Find the disease within the corresponding probability range
  for (const {disease, range} of probabilityRanges) {
    if (randomNumber >= range[0] && randomNumber < range[1]) {
      return disease;
    }
  }

  // Should not reach here if probabilities add up to 1
  return null;
};

utils.contractDisease = function() {
  let disease_name = getRandomDisease();
  utils.addMessage('You contracted ' + disease_name);

  GAME_STATE['disease_types'][disease_name]['organs'].forEach(function(organ) {
    GAME_STATE['druid'][organ + '_diseases'].push(disease_name);
  });
};

// =============================================================================
// UPDATERS
// =============================================================================

function processStatuses() {
  for (let status in GAME_STATE['druid']['status']) {
    switch (status) {
      // Reduce MAX HP.
      case 'bleeding':
        break;
      case 'hemorrhaging':
        break;
      // Reduce MAX Stamina.
      case 'fatigued':
        break;
      case 'exhausted':
        break;
      // Reduce Attack Damage.
      case 'debilitated':
        break;
      case 'poisoned':
        break;
      // Item chance to miss.
      case 'nauseous':
        break;
      case 'retching':
        break;
      // Can miss including tracking, etc.
      case 'confused':
        break;
      case 'hallucinating':
        break;
    }
  }
}

let organ_stats = {
  'heart': ['bleeding', 'hemorrhaging'],
  'lungs': ['fatigued', 'exhausted'],
  'liver': ['debilitated', 'poisoned'],
  'stomach': ['nauseous', 'retching'],
  'brain': ['confused', 'hallucinating'],
};

let skill_stats = {
  'sword': ['bleeding', 'hemorrhaging'],
  'tracking': ['fatigued', 'exhausted'],
  'sneaking': ['debilitated', 'poisoned'],
  'camping': ['nauseous', 'retching'],
  'bow': ['confused', 'hallucinating'],
};

renderer.updaters['druid_daily'] = {
  period: 24,
  fn: function() {
    let number_critical = 0;
    for (let organ in organ_stats) {
      if (GAME_STATE['druid'][organ + '_hp'] == 0) {
        number_critical++;
      }
    }

    if (number_critical >= 2 || GAME_STATE['druid']['hp'] <= 0) {
      utils.hitDruid(1);
    }

    let env = utils.getCurrentEnv();
    if (utils.roll(env['disease_chance'])) {
      utils.contractDisease();
    }

    for (let organ in organ_stats) {
      for (let disease of GAME_STATE['druid'][organ + '_diseases']) {
        utils.damageOrgan(organ, 1);
      }
    }
  }
};

renderer.updaters['nauseous'] = {
  period: 6,
  fn: function() {
    if (utils.hasStatus('nauseous')) {
      GAME_STATE['druid']['food'] -= Math.min(GAME_STATE['druid']['food'], 1);
    }
  }
};

renderer.updaters['retching'] = {
  period: 1,
  fn: function() {
    if (utils.hasStatus('retching')) {
      GAME_STATE['druid']['food'] -= Math.min(GAME_STATE['druid']['food'], 1);
    }
  }
};

renderer.updaters['druid'] = {
  period: 0,
  fn: function() {
    console.log('regular update');

    for (let organ in organ_stats) {
      if (GAME_STATE['druid'][organ + '_hp'] == 0) {
        utils.setStatus(organ_stats[organ][1]);
        utils.removeStatus(organ_stats[organ][0]);
      } else if (GAME_STATE['druid'][organ + '_hp'] <= 5) {
        utils.setStatus(organ_stats[organ][0]);
        utils.removeStatus(organ_stats[organ][1]);
      }
    }

    if (GAME_STATE['druid']['hp'] > utils.getMaxHp()) {
      GAME_STATE['druid']['hp'] = utils.getMaxHp();
    }

    if (GAME_STATE['druid']['stamina'] > utils.getMaxStamina()) {
      GAME_STATE['druid']['stamina'] = utils.getMaxStamina();
    }

    processStatuses();

    if (GAME_STATE['druid']['hp'] <= 0) {
      utils.pushView('game_over');
    }
  }
};

// =============================================================================
// TEMPLATES
// =============================================================================

function getAffectsOrgansBar() {
  let bar = '';
  for (let organ in organ_stats) {
    if (GAME_STATE['druid'][organ + '_hp'] == 0) {
      bar += organ[0].upperCase() + ' ';
    } else if (GAME_STATE['druid'][organ + '_hp'] <= 5) {
      bar += organ[0] + ' ';
    } else {
      bar += '  ';
    }
  }
  return bar;
}

export function stats(data) {
  let bar_size = 16;
  let stamina_percent = GAME_STATE['stamina'] / GAME_STATE['max_stamina'];
  let s = parseFloat(GAME_STATE['stamina']).toFixed(0);
  data['stamina_bar'] = '|' +
      '*'.repeat(stamina_percent * bar_size).padEnd(bar_size) + '| ' + s;

  s = parseFloat(GAME_STATE['druid']['hp']).toFixed(0);
  let hp_percent = GAME_STATE['druid']['hp'] / utils.getMaxHp();

  let bar = '+'.repeat(hp_percent * bar_size)
                .padEnd(bar_size)
                .split('')
                .reverse()
                .join('');
  data['hp_bar'] = s + ' |' + bar + '|';

  s = parseFloat(GAME_STATE['druid']['food']).toFixed(0);
  let hunger_percent =
      GAME_STATE['druid']['food'] / GAME_STATE['druid']['max_food'];

  data['food_bar'] = '|' +
      '`'.repeat(hunger_percent * 10).padEnd(10) + '| ' + s;
  
  data['affected_organs'] = getAffectsOrgansBar();

  data['char_click'] = {
    str: '[CHA]',
    fn: function() {
      utils.pushView('druid');
    }
  };
  data['inventory_click'] = {
    str: '[INV]',
    fn: function() {
      utils.pushView('inventory');
    }
  };

  if (GAME_STATE['show_leave']) {
    data['leave'] = {
      str: '[--X--]',
      fn: function() {
        utils.popView();
      }
    };
  } else {
    data['leave'] = '_______';
  }

  data['config'] = {
    str: '[+]',
    fn: function() {
      utils.pushView('config')
    }
  };

  return data;
}

function getSkillStr(skill) {
  let conditions = skill_stats[skill];
  let penalty = getPenaltyAfterStatus(conditions[0], conditions[1]);

  let str = GAME_STATE['druid'][skill + '_skill'];
  if (penalty > 0) {
    str += ' (-' + penalty.toString() + ')';
  }
  return str;
}

function getOrganStr(organ) {
  if (GAME_STATE['druid'][organ + '_diseases'].length > 0) {
    return '*';
  }
  return ' ';
}

export function druid(data) {
  data['ac'] = utils.getDruidArmorClass();
  data['sword_skill'] = {
    'str': getSkillStr('sword'),
    'fn': function() {
      utils.increaseSkill('sword_skill');
    }
  };
  data['bow_skill'] = {
    'str': getSkillStr('bow'),
    'fn': function() {
      utils.increaseSkill('bow_skill');
    }
  };
  data['sneaking_skill'] = {
    'str': getSkillStr('sneaking'),
    'fn': function() {
      utils.increaseSkill('sneaking_skill');
    }
  };
  data['camping_skill'] = {
    'str': getSkillStr('camping'),
    'fn': function() {
      utils.increaseSkill('camping_skill');
    }
  };
  data['tracking_skill'] = {
    'str': getSkillStr('tracking'),
    'fn': function() {
      utils.increaseSkill('tracking_skill');
    }
  };
  data['skinning_skill'] = {
    'str': GAME_STATE['druid']['skinning_skill'],
    'fn': function() {
      utils.increaseSkill('skinning_skill');
    }
  };
  data['ranged_bonus'] =
      GAME_STATE['druid']['ranged']['bonus'] + utils.getBowSkill();

  data['heart'] = getOrganStr('heart');
  data['lungs'] = getOrganStr('lungs');
  data['liver'] = getOrganStr('liver');
  data['stomach'] = getOrganStr('stomach');
  data['brain'] = getOrganStr('brain');
  return data;
}

renderer.models['stats'] = stats;
renderer.models['druid'] = druid;
