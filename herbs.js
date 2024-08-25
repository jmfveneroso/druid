class Herb {
  constructor(
      name, effectDescription, chance, effectFunction, finalFunction, duration,
      known = false, runes = null, revealedRunes = null) {
    this.name = name;
    this.effectDescription = effectDescription;
    this.chance = chance;
    this.effectFunction = effectFunction;
    this.finalFunction = finalFunction;
    this.duration = duration;
    this.known = known;
    this.runes = runes || ['A', 'A', 'A'];
    this.revealedRunes = revealedRunes || ['*', '*', '*'];
  }

  applyEffect(patient) {
    this.effectFunction(patient);
  }

  revealRune(index) {
    this.revealedRunes[index] = this.runes[index];
  }

  toString() {
    return `Herb(name=${this.name}, effectDescription=${
        this.effectDescription}, known=${this.known})`;
  }
}

function noEffect(patient) {
  // No effect is applied to the patient
}

function moonrootEffect(patient) {
  // Increases the health points of the Heart by 4
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Heart') {
      organ.treat(4);
    }
  });
}

function sunleafEffect(patient) {
  // Increases the health points of the Lungs by 4
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Lungs') {
      organ.treat(4);
    }
  });
}

function nightshadeBerryEffect(patient) {
  // Increases the health points of the Liver by 4
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Liver') {
      organ.treat(4);
    }
  });
}

function bloodthornEffect(patient) {
  // Increases the health points of the Kidneys by 4
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Kidneys') {
      organ.treat(4);
    }
  });
}

function lunarBlossomEffect(patient) {
  // Increases the health points of the Brain by 4
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Brain') {
      organ.treat(4);
    }
  });
}

function dragonscaleFungusEffect(patient) {
  // Boosts the effect of the next potion by multiplying its effect by 2
  patient.dragonscaleActive = true;
}

function silvervineEffect(patient) {
  // Stops disease progression for 10 time steps
  patient.silvervineActive = true;
  patient.silvervineCounter = 10;
  patient.organs.forEach(function(organ) {
    organ.treat(-2);
  });
}

function mossbellEffect(patient) {
  // Increases the health points of the Heart and Liver by 2 each
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Heart') {
      organ.treat(4, false, false);
    } else if (organ.name === 'Liver') {
      organ.treat(-2);
    }
  });
}

function ironbarkSapEffect(patient) {
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Brain') {
      organ.treat(4, false, false);
    } else if (organ.name === 'Lungs') {
      organ.treat(-2);
    }
  });
}

function whisperleafEffect(patient) {
  // Increases the health points of the Brain and Heart by 2 each
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Lungs' || organ.name === 'Heart') {
      organ.treat(2, false, false);
    }
  });
}

function crimsonCloverEffect(patient) {
  // Increases the health points of all organs by 1
  patient.organs.forEach(function(organ) {
    organ.treat(1, false, false);
  });
}

function dewrootEffect(patient) {
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Liver' || organ.name === 'Kidneys') {
      organ.treat(2, false, false);
    }
  });
}

function fireweedEffect(patient) {
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Lungs') {
      organ.treat(4, false, false);
    } else if (organ.name === 'Kidneys') {
      organ.treat(-2);
    }
  });
}

function bittermintEffect(patient) {
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Kidneys') {
      organ.treat(4, false, false);
    } else if (organ.name === 'Heart') {
      organ.treat(-2);
    }
  });
}

function wolfsbaneEffect(patient) {
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Liver') {
      organ.treat(4, false, false);
    } else if (organ.name === 'Brain') {
      organ.treat(-2);
    }
  });
}

function glimmerFernEffect(patient) {
  // Increases the health points of a random diseased organ by 4
  let diseasedOrgans = patient.organs.filter(function(organ) {
    return organ.critical || organ.diseased;
  });
  if (diseasedOrgans.length > 0) {
    let randomOrgan =
        diseasedOrgans[Math.floor(Math.random() * diseasedOrgans.length)];
    randomOrgan.treat(4, true);
  }
}

function basiliskScaleEffect(patient) {
  // Increases the health points of a random diseased organ by 6
  let diseasedOrgans = patient.organs.filter(function(organ) {
    return organ.diseased;
  });
  if (diseasedOrgans.length > 0) {
    let randomOrgan =
        diseasedOrgans[Math.floor(Math.random() * diseasedOrgans.length)];
    randomOrgan.treat(6);
  }
}

function serpentsFangEffect(patient) {
  // Fully heals a random critical organ
  let criticalOrgans = patient.organs.filter(function(organ) {
    return organ.critical;
  });
  if (criticalOrgans.length > 0) {
    let randomOrgan =
        criticalOrgans[Math.floor(Math.random() * criticalOrgans.length)];
    randomOrgan.treat(10, true);
  }
}

function phoenixAshEffect(patient) {
  // Increases the health points of the organ with the lowest health points by 8
  // and reduces the health points of other organs by 3 each
  let minHpOrgan = patient.organs.reduce(function(lowestHpOrgan, organ) {
    return organ.hp < lowestHpOrgan.hp ? organ : lowestHpOrgan;
  });
  minHpOrgan.treat(8);
  patient.organs.forEach(function(organ) {
    if (organ !== minHpOrgan) {
      organ.treat(-3);
    }
  });
}

function giantsHeartrootEffect(patient) {
  // Fully cures a diseased organ
  let diseasedOrgans = patient.organs.filter(function(organ) {
    return organ.diseased;
  });
  if (diseasedOrgans.length > 0) {
    let randomOrgan =
        diseasedOrgans[Math.floor(Math.random() * diseasedOrgans.length)];
    randomOrgan.treat(10);
  }
}

let BASE_DURATION = 3;
let QUICK_DURATION = 0;
let SUPER_QUICK_DURATION = 0;

// Define possible effects as an array of objects in JavaScript
let possibleEffects = [
  // Palliative.
  {
    description: '-2 All, stops disease 10x.',
    chance: 0.4,
    effectFunction: silvervineEffect,
    finalFunction: noEffect,
    duration: QUICK_DURATION
  },
  {
    description: '+4 Heart -2 Liver (NC).',
    chance: 0.4,
    effectFunction: mossbellEffect,
    finalFunction: noEffect,
    duration: QUICK_DURATION
  },
  {
    description: '+4 Lungs -2 Kidneys (NC).',
    chance: 0.4,
    effectFunction: fireweedEffect,
    finalFunction: noEffect,
    duration: QUICK_DURATION
  },
  {
    description: '+4 Liver -2 Brain (NC).',
    chance: 0.4,
    effectFunction: wolfsbaneEffect,
    finalFunction: noEffect,
    duration: QUICK_DURATION
  },
  {
    description: '+4 Kidney -2 Heart (NC).',
    chance: 0.4,
    effectFunction: bittermintEffect,
    finalFunction: noEffect,
    duration: QUICK_DURATION
  },
  {
    description: '+4 Brain -2 Lungs (NC).',
    chance: 0.4,
    effectFunction: ironbarkSapEffect,
    finalFunction: noEffect,
    duration: QUICK_DURATION
  },
  {
    description: '+1 All (NC).',
    chance: 0.4,
    effectFunction: crimsonCloverEffect,
    finalFunction: noEffect,
    duration: SUPER_QUICK_DURATION
  },
  {
    description: '+2 Heart +2 Lungs (NC).',
    chance: 0.4,
    effectFunction: whisperleafEffect,
    finalFunction: noEffect,
    duration: QUICK_DURATION
  },
  {
    description: '+2 Liver +2 Kidneys (NC).',
    chance: 0.4,
    effectFunction: dewrootEffect,
    finalFunction: noEffect,
    duration: QUICK_DURATION
  },
  {
    description: 'Next potion x2.',
    chance: 0.4,
    effectFunction: dragonscaleFungusEffect,
    finalFunction: noEffect,
    duration: SUPER_QUICK_DURATION
  },

  // Base.
  {
    description: '+4 Heart.',
    chance: 0.3,
    effectFunction: moonrootEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+4 Lungs.',
    chance: 0.3,
    effectFunction: sunleafEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+4 Liver.',
    chance: 0.3,
    effectFunction: nightshadeBerryEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+4 Kidneys.',
    chance: 0.3,
    effectFunction: bloodthornEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+4 Brain.',
    chance: 0.3,
    effectFunction: lunarBlossomEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },

  // Power.
  {
    description: '+8 lowest else -3.',
    chance: 0.1,
    effectFunction: phoenixAshEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+4 R (*) or (D) organ.',
    chance: 0.1,
    effectFunction: glimmerFernEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+6 R (D) organ.',
    chance: 0.1,
    effectFunction: basiliskScaleEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: 'Full heal R (*) organ.',
    chance: 0.05,
    effectFunction: serpentsFangEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: 'Full heal R (D) organ.',
    chance: 0.05,
    effectFunction: giantsHeartrootEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
];

// Define the available herbs as an array in JavaScript
export let availableHerbs = [
  'Moonroot',       'Sunleaf',         'Night Berry',    'Bloodthorn',
  'Lunar Blossom',  'Dragonscale',     'Silvervine',     'Mossbell',
  'Ironbark Sap',   'Whisperleaf',     'Crimson Clover', 'Dewroot',
  'Fireweed',       'Bittermint',      'Wolfsbane',      'Glimmer Fern',
  'Basilisk Scale', 'Serpent\'s Fang', 'Phoenix Ash',    'Giant\'s Heart',
  'Solar Blossom',  'Shadowthorn',     'Sky Fungus',     'Verdant Vine',
  'Ironleaf',
];

function initializeHerbMap(availableHerbs, possibleEffects) {
  let newPossibleEffects = [];

  // Rearrange possible effects
  for (let i = 0; i < 4; i++) {
    let arr = possibleEffects.slice(i * 5, i * 5 + 5);
    arr.sort(() => Math.random() - 0.5);  // Shuffle the array
    newPossibleEffects = newPossibleEffects.concat(arr);
  }
  possibleEffects = newPossibleEffects;

  let herbMap = {};

  availableHerbs.forEach((herb, i) => {
    let x = possibleEffects[i % possibleEffects.length];
    herbMap[herb] = new Herb(
        herb, x.description, x.chance, x.finalFunction, x.effectFunction,
        x.duration, false, ['A', 'A', 'A'], ['*', '*', '*']);
  });

  return herbMap;
}

export let herbMap = initializeHerbMap(availableHerbs, possibleEffects);

// Define the effects functions
function solarBlossomEffect(patient) {
  patient.organs.forEach(organ => {
    organ.treat(3, true);
  });
}

function shadowthornEffect(patient) {
  patient.organs.forEach(organ => {
    if (organ.diseased) {
      organ.treat(10);
    }
  });
}

function celestialFungusEffect(patient) {
  patient.silvervineActive = true;
  patient.silvervineCounter = 10;
  patient.organs.forEach(organ => {
    if (organ.critical) {
      organ.treat(1, true);
    }
  });
}

function verdantVineEffect(patient) {
  patient.organs.forEach(organ => {
    organ.treat(6);
  });
  serpentsFangEffect(patient);
}

function ironleafEffect(patient) {
  let organsCured = 0;
  patient.organs.forEach(organ => {
    if (organ.critical) {
      organ.treat(5, true);
      organsCured++;
      if (organsCured >= 2) {
        return;
      }
    }
  });
}

export function updateHerbMap() {
  herbMap['Solar Blossom'] = new Herb(
      'Solar Blossom', '+3 all even (*).', 0.0, noEffect, solarBlossomEffect, 1,
      true, ['*', '*', '*'], ['*', '*', '*']);

  herbMap['Shadowthorn'] = new Herb(
      'Shadowthorn', '+10 all.', 0.0, noEffect, shadowthornEffect, 1, true,
      ['*', '*', '*'], ['*', '*', '*']);

  herbMap['Sky Fungus'] = new Herb(
      'Sky Fungus', '+1 all (*) prev (*).', 0.0, noEffect,
      celestialFungusEffect, 1, true, ['*', '*', '*'], ['*', '*', '*']);

  herbMap['Verdant Vine'] = new Herb(
      'Verdant Vine', '+6 all +2 R (*).', 0.0, noEffect, verdantVineEffect, 1,
      true, ['*', '*', '*'], ['*', '*', '*']);

  herbMap['Ironleaf'] = new Herb(
      'Ironleaf', '+5 to 2 (*) organs.', 0.0, noEffect, ironleafEffect, 1, true,
      ['*', '*', '*'], ['*', '*', '*']);
}
