/////////////////////////////////////////////////
// DISEASE
/////////////////////////////////////////////////

const DISEASE_PROGRESSION = 2;

class DiseaseType {
  constructor(
      name, initialOrgan, hpReduction, spreadTime, diseaseProgression = 2,
      additionalEffects = null) {
    this.name = name;
    this.initialOrgan = initialOrgan;
    this.hpReduction = hpReduction;
    this.spreadTime = spreadTime;
    this.additionalEffects = additionalEffects;
    this.diseaseProgression = diseaseProgression;
    this.known = false;
  }

  applyAdditionalEffects(patient, affectedOrgans) {
    if (this.additionalEffects) {
      this.additionalEffects(patient, affectedOrgans);
    }
  }
}

class Disease {
  constructor(diseaseType, patient, spreadChance = 0.05) {
    this.diseaseType = diseaseType;
    this.patient = patient;
    this.baseSpreadChance = spreadChance;
    this.spreadChance = spreadChance;
    this.spreadCounter = 0;
    this.spreadChanceReductionDuration = 0;
    this.diseaseCounter = this.diseaseType.diseaseProgression;
    this.affectedOrgans =
        this.patient.organs.filter(o => o.name === diseaseType.initialOrgan);
    this.affectedOrgans.forEach(organ => organ.diseased = true);
  }

  progress() {
    this.spreadDisease();

    this.diseaseCounter -= 1;
    if (this.diseaseCounter > 0) return;

    this.affectedOrgans.forEach(organ => {
      organ.damage(this.diseaseType.hpReduction);
    });

    this.diseaseType.applyAdditionalEffects(this.patient, this.affectedOrgans);
    this.diseaseCounter = this.diseaseType.diseaseProgression;
  }

  spreadDisease() {
    this.spreadCounter += 1;
    if (this.spreadCounter >= this.diseaseType.spreadTime) {
      this.spreadCounter = 0;
      const healthyOrgans = this.patient.organs.filter(o => !o.diseased);
      if (healthyOrgans.length > 0) {
        const newOrgan =
            healthyOrgans[Math.floor(Math.random() * healthyOrgans.length)];
        newOrgan.diseased = true;
        this.affectedOrgans.push(newOrgan);
        newOrgan.justSpreaded = true;
      }
    }
  }
}

// Effects functions
function pulmonaryDecayEffect(patient, affectedOrgans) {
  const lungs = patient.getOrgan('Lungs');
  if (!lungs.diseased) return;

  if (lungs.hp < 5) {
    patient.getOrgan('Brain').damage(1);
  }
}

function neurotoxicInfectionEffect(patient, affectedOrgans) {
  if (affectedOrgans.length > 1 &&
      affectedOrgans[affectedOrgans.length - 1].name === 'Liver') {
    patient.organs.forEach(organ => {
      if (organ.name === 'Brain') {
        organ.treat(-1);  // Reduces Brain HP by 1 if it has spread to the Liver
      }
    });
  }
}

function renalNecrosisEffect(patient, affectedOrgans) {
  if (affectedOrgans.length > 1 &&
      affectedOrgans[affectedOrgans.length - 1].name === 'Liver') {
    const heart = patient.organs.filter(o => o.name === 'Heart');
    if (heart.length > 0 && Math.random() < 0.1) {
      heart[0].treat(-1);  // 10% chance to reduce Heart HP by 1
    }
  }
}

function cardiacConstrictionEffect(patient, affectedOrgans) {
  if (affectedOrgans.length >= 1 &&
      affectedOrgans[affectedOrgans.length - 1].name === 'Lungs') {
    const kidneys = patient.organs.filter(o => o.name === 'Kidneys');
    if (kidneys.length > 0) {
      kidneys[0].hp -= 1;  // Reduces Kidneys HP by 1 if spread to the Lungs
    }
  }
}

function hepaticDeteriorationEffect(patient, affectedOrgans) {
  if (affectedOrgans.length > 1 &&
      affectedOrgans[affectedOrgans.length - 1].name === 'Kidneys') {
    patient.organs.forEach(organ => {
      organ.treat(-2);  // Reduces the effectiveness of all healing herbs by 20%
    });
  }
}

const hepaticDeterioration = new DiseaseType(
    'Hepatic Deterioration', 'Liver', 3, 20, 10, hepaticDeteriorationEffect);

function cerebralSepsisEffect(patient, affectedOrgans) {
  const heart = patient.organs.filter(o => o.name === 'Heart');
  if (heart.length > 0 && affectedOrgans.length > 1 &&
      affectedOrgans[affectedOrgans.length - 1].name === 'Heart') {
    patient.disease.spreadChance *= 1.5;  // Increases the spread chance by 50%
  }
}

function pulmonaryFibrosisEffect(patient, affectedOrgans) {
  patient.organs.forEach(organ => {
    if (organ.name === 'Lungs') {
      organ.hp -= 1;  // Reduces lung effectiveness by 1 HP
    }
  });
}

const pulmonaryFibrosis = new DiseaseType(
    'Pulmonary Fibrosis', 'Lungs', 1, 6, pulmonaryFibrosisEffect);

function cardiopulmonarySyndromeEffect(patient, affectedOrgans) {
  const liver = patient.organs.filter(o => o.name === 'Liver');
  if (liver.length > 0 && affectedOrgans.length > 2) {
    liver[0].hp -= 1;  // Reduces Liver HP by 1
  }
}

const cardiopulmonarySyndrome = new DiseaseType(
    'Cardiopulmonary Syndrome', 'Heart', 1, 5, cardiopulmonarySyndromeEffect);

function renalVenomEffect(patient, affectedOrgans) {
  const heart = patient.organs.filter(o => o.name === 'Heart');
  if (heart.length > 0) {
    heart[0].treat(-2);  // Reduces Heart HP by 2 when it spreads to the Heart
  }
}

const renalVenom =
    new DiseaseType('Renal Venom', 'Kidneys', 2, 6, renalVenomEffect);

function neurocardiacSyndromeEffect(patient, affectedOrgans) {
  if (affectedOrgans.length >= 2 &&
      affectedOrgans[affectedOrgans.length - 1].name === 'Heart') {
    const lungs = patient.organs.filter(o => o.name === 'Lungs');
    if (lungs.length > 0) {
      patient.disease.spreadChance +=
          0.15;  // Increases the spread chance by 15%
    }
  }
}

const neurocardiacSyndrome = new DiseaseType(
    'Neurocardiac Syndrome', 'Brain', 1, 4, neurocardiacSyndromeEffect);

// Possible initial organs the disease can affect
const initialOrgans = ['Lungs', 'Heart', 'Liver', 'Kidneys', 'Brain'];

// Possible rates of spread (in time steps)
const spreadTimes = [2, 3, 4, 5];

// Possible HP reduction rates per time step
const hpReductions = [1, 2];

// Possible additional effects (these can be functions or descriptions)
function slowHealingEffect(patient, affectedOrgans) {
  patient.organs.forEach(organ => {
    organ.hp -= 1;  // Example effect that slows healing for all organs
  });
}

const additionalEffects = [null, slowHealingEffect];

function generateRandomDisease() {
  const name = `${randomChoice([
    'Pulmonary', 'Cardio', 'Neuro', 'Hepato', 'Nephro'
  ])} ${randomChoice(['Decay', 'Rot', 'Infection', 'Blight', 'Plague'])}`;
  const initialOrgan = randomChoice(initialOrgans);
  const hpReduction = randomChoice(hpReductions);
  const spreadTime = randomChoice(spreadTimes);
  const additionalEffect = randomChoice(additionalEffects);

  return new DiseaseType(
      name, initialOrgan, hpReduction, spreadTime, additionalEffect);
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const randomDisease1 = generateRandomDisease();

const VIRULENCE = 3;

const pulmonaryDecay = new DiseaseType(
    'Pulmonary Decay', 'Lungs', 5, VIRULENCE * 2, VIRULENCE * 4,
    pulmonaryDecayEffect);

const neurotoxicInfection = new DiseaseType(
    'Neurotoxic Infection', 'Brain', 4, VIRULENCE * 4, VIRULENCE * 2,
    neurotoxicInfectionEffect);

const renalNecrosis = new DiseaseType(
    'Renal Necrosis', 'Kidneys', 3, VIRULENCE, VIRULENCE, renalNecrosisEffect);

const cardiacConstriction = new DiseaseType(
    'Cardiac Constriction', 'Heart', 2, VIRULENCE * 4, VIRULENCE,
    cardiacConstrictionEffect);

const cerebralSepsis = new DiseaseType(
    'Cerebral Sepsis', 'Brain', 1, VIRULENCE * 10, VIRULENCE,
    cerebralSepsisEffect);

const diseaseRegistry = [
  pulmonaryDecay, neurotoxicInfection, renalNecrosis, cardiacConstriction,
  hepaticDeterioration,
  // cerebralSepsis,
  // pulmonaryFibrosis,
  // cardiopulmonarySyndrome,
  // renalVenom,
  // neurocardiacSyndrome,
  // randomDisease1,
];

/////////////////////////////////////////////////
// HERBS
/////////////////////////////////////////////////

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
}

function mossbellEffect(patient) {
  // Increases the health points of the Heart and Liver by 2 each
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Heart' || organ.name === 'Liver') {
      organ.treat(2);
    }
  });
}

function ironbarkSapEffect(patient) {
  // Increases the health points of the Lungs and Kidneys by 2 each
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Lungs' || organ.name === 'Kidneys') {
      organ.treat(2);
    }
  });
}

function whisperleafEffect(patient) {
  // Increases the health points of the Brain and Heart by 2 each
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Brain' || organ.name === 'Heart') {
      organ.treat(2);
    }
  });
}

function crimsonCloverEffect(patient) {
  // Increases the health points of all organs by 1
  patient.organs.forEach(function(organ) {
    organ.treat(1);
  });
}

function dewrootEffect(patient) {
  // Increases the health points of the Heart by 6 and reduces the health points
  // of the Lungs by 2
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Heart') {
      organ.treat(6);
    } else if (organ.name === 'Lungs') {
      organ.treat(-2);
    }
  });
}

function fireweedEffect(patient) {
  // Increases the health points of the Lungs by 6 and reduces the health points
  // of the Liver by 2
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Lungs') {
      organ.treat(6);
    } else if (organ.name === 'Liver') {
      organ.treat(-2);
    }
  });
}

function bittermintEffect(patient) {
  // Increases the health points of the Liver by 6 and reduces the health points
  // of the Kidneys by 2
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Liver') {
      organ.treat(6);
    } else if (organ.name === 'Kidneys') {
      organ.treat(-2);
    }
  });
}

function wolfsbaneEffect(patient) {
  // Increases the health points of the Kidneys by 6 and reduces the health
  // points of the Brain by 2
  patient.organs.forEach(function(organ) {
    if (organ.name === 'Kidneys') {
      organ.treat(6);
    } else if (organ.name === 'Brain') {
      organ.treat(-2);
    }
  });
}

function glimmerFernEffect(patient) {
  // Increases the health points of a random diseased organ by 4
  let diseasedOrgans = patient.organs.filter(function(organ) {
    return organ.diseased;
  });
  if (diseasedOrgans.length > 0) {
    let randomOrgan =
        diseasedOrgans[Math.floor(Math.random() * diseasedOrgans.length)];
    randomOrgan.treat(4);
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

let BASE_DURATION = 2;

// Define possible effects as an array of objects in JavaScript
let possibleEffects = [
  {
    description: '+4 HP to Heart.',
    chance: 0.5,
    effectFunction: moonrootEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: 'Stops disease progression for 10 time steps.',
    chance: 0.15,
    effectFunction: silvervineEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+6 HP to Lungs -2 HP to Liver.',
    chance: 0.15,
    effectFunction: fireweedEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+8 HP to lowest -3 HP to other organs.',
    chance: 0.05,
    effectFunction: phoenixAshEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+1 HP to all organs.',
    chance: 0.15,
    effectFunction: crimsonCloverEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+4 HP to Lungs.',
    chance: 0.5,
    effectFunction: sunleafEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+2 HP to Heart and +2 HP to Liver.',
    chance: 0.25,
    effectFunction: mossbellEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: 'Fully heals a random critical organ.',
    chance: 0.05,
    effectFunction: serpentsFangEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+6 HP to Kidneys -2 HP to Brain.',
    chance: 0.1,
    effectFunction: wolfsbaneEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+6 HP to Liver -2 HP to Kidneys.',
    chance: 0.1,
    effectFunction: bittermintEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+4 HP to Liver.',
    chance: 0.3,
    effectFunction: nightshadeBerryEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+4 HP to Kidneys.',
    chance: 0.3,
    effectFunction: bloodthornEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+2 HP to Lungs and +2 HP to Kidneys.',
    chance: 0.15,
    effectFunction: ironbarkSapEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+4 HP to a random diseased organ.',
    chance: 0.1,
    effectFunction: glimmerFernEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+2 HP to Brain and +2 HP to Heart.',
    chance: 0.15,
    effectFunction: whisperleafEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+4 HP to Brain.',
    chance: 0.5,
    effectFunction: lunarBlossomEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+6 HP to a random diseased organ.',
    chance: 0.1,
    effectFunction: basiliskScaleEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: '+6 HP to Heart -2 HP to Lungs.',
    chance: 0.2,
    effectFunction: dewrootEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: 'Boosts the effect of the next potion by x2.',
    chance: 0.15,
    effectFunction: dragonscaleFungusEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
  {
    description: 'Cures a diseased organ fully.',
    chance: 0.05,
    effectFunction: giantsHeartrootEffect,
    finalFunction: noEffect,
    duration: BASE_DURATION
  },
];

// Define the available herbs as an array in JavaScript
let availableHerbs = [
  'Moonroot',         'Sunleaf',
  'Nightshade Berry', 'Bloodthorn',
  'Lunar Blossom',    'Dragonscale Fungus',
  'Silvervine',       'Mossbell',
  'Ironbark Sap',     'Whisperleaf',
  'Crimson Clover',   'Dewroot',
  'Fireweed',         'Bittermint',
  'Wolfsbane',        'Glimmer Fern',
  'Basilisk Scale',   'Serpent\'s Fang',
  'Phoenix Ash',      'Giant\'s Heartroot',
  'Solar Blossom',    'Shadowthorn',
  'Celestial Fungus', 'Verdant Vine',
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
    x = possibleEffects[i % possibleEffects.length]
    herbMap[herb] = new Herb(
        herb, x.description, x.chance, x.finalFunction, x.effectFunction,
        x.duration, true, ['A', 'A', 'A'], ['*', '*', '*']);
  });

  return herbMap;
}

let herbMap = initializeHerbMap(availableHerbs, possibleEffects);

// Define the effects functions
function solarBlossomEffect(patient) {
  patient.organs.forEach(organ => {
    organ.treat(2, true);
  });
}

function shadowthornEffect(patient) {
  patient.organs.forEach(organ => {
    if (organ.diseased) {
      organ.treat(5);
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
    organ.treat(2);
  });
  serpentsFangEffect(
      patient);  // Assuming serpentsFangEffect is defined elsewhere
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

function updateHerbMap() {
  herbMap['Solar Blossom'] = new Herb({
    name: 'Solar Blossom',
    effectDescription: '+2 HP to all organs including critical.',
    chance: 0.0,
    effectFunction: noEffect,
    finalFunction: solarBlossomEffect,
    duration: 1,
    known: true,
    runes: ['*', '*', '*'],
    revealedRunes: ['*', '*', '*']
  });

  herbMap['Shadowthorn'] = new Herb({
    name: 'Shadowthorn',
    effectDescription: '+5 HP to all organs.',
    chance: 0.0,
    effectFunction: noEffect,
    finalFunction: shadowthornEffect,
    duration: 1,
    known: true,
    runes: ['*', '*', '*'],
    revealedRunes: ['*', '*', '*']
  });

  herbMap['Celestial Fungus'] = new Herb({
    name: 'Celestial Fungus',
    effectDescription:
        'Heals critical organs and prevents organs from getting critical for 10 turns.',
    chance: 0.0,
    effectFunction: noEffect,
    finalFunction: celestialFungusEffect,
    duration: 1,
    known: true,
    runes: ['*', '*', '*'],
    revealedRunes: ['*', '*', '*']
  });

  herbMap['Verdant Vine'] = new Herb({
    name: 'Verdant Vine',
    effectDescription: 'Heals all organs +2 HP and heals a critical organ.',
    chance: 0.0,
    effectFunction: noEffect,
    finalFunction: verdantVineEffect,
    duration: 1,
    known: true,
    runes: ['*', '*', '*'],
    revealedRunes: ['*', '*', '*']
  });

  herbMap['Ironleaf'] = new Herb({
    name: 'Ironleaf',
    effectDescription: 'Heals 2 critical organs and restores 5 HP.',
    chance: 0.0,
    effectFunction: noEffect,
    finalFunction: ironleafEffect,
    duration: 1,
    known: true,
    runes: ['*', '*', '*'],
    revealedRunes: ['*', '*', '*']
  });
}

/////////////////////////////////////////////////
// ENVIRONMENT
/////////////////////////////////////////////////

class Environment {
  constructor(name, herbs) {
    this.name = name;
    this.herbs =
        herbs;  // List of herbs that can be gathered in this environment
    this.weights = herbs.map(h => herbMap[h].chance);
  }

  gatherHerbs(numHerbs = 3) {
    // Simulate random.choices in Python using weighted random selection
    const totalWeight = this.weights.reduce((acc, weight) => acc + weight, 0);
    const weightedHerbs = this.herbs.map(
        (herb, index) => ({herb, weight: this.weights[index] / totalWeight}));

    const selectedHerbs = [];
    for (let i = 0; i < numHerbs; i++) {
      let rand = Math.random();
      for (const {herb, weight} of weightedHerbs) {
        if (rand < weight) {
          selectedHerbs.push(herb);
          break;
        }
        rand -= weight;
      }
    }
    return selectedHerbs;
  }
}

const forest = new Environment(
    'Forest',
    ['Moonroot', 'Sunleaf', 'Nightshade Berry', 'Bloodthorn', 'Lunar Blossom']);

const swamp = new Environment('Swamp', [
  'Dragonscale Fungus', 'Silvervine', 'Mossbell', 'Ironbark Sap', 'Whisperleaf'
]);

const mountain = new Environment(
    'Mountain',
    ['Crimson Clover', 'Dewroot', 'Fireweed', 'Bittermint', 'Wolfsbane']);

const lake = new Environment('Lake', [
  'Glimmer Fern', 'Basilisk Scale', 'Serpent\'s Fang', 'Phoenix Ash',
  'Giant\'s Heartroot'
]);

const environments = [forest, swamp, mountain, lake];

/////////////////////////////////////////////////
// GATHER
/////////////////////////////////////////////////

const NUM_GATHER = 3;

class HerbGathering {
  constructor() {
    this.availableHerbs = availableHerbs;
    this.inventory = Object.fromEntries(availableHerbs.map(herb => [herb, 0]));
    this.justAcquired =
        Object.fromEntries(availableHerbs.map(herb => [herb, 0]));
    this.maxInventory = 20;
  }

  gather(environment, numHerbs = NUM_GATHER) {
    const gatheredHerbs = environment.gatherHerbs(numHerbs);
    for (let herb of gatheredHerbs) {
      let totalHerbs =
          Object.values(this.inventory).reduce((acc, value) => acc + value, 0)
      if (totalHerbs >= this.maxInventory) {
        break;
      }
      this.inventory[herb] += 1;
      this.justAcquired[herb] += 1;
    }
  }

  useHerb(herbName) {
    if ((this.inventory[herbName] || 0) > 0) {
      this.inventory[herbName] -= 1;
      return true;
    } else {
      return false;
    }
  }

  useTwoHerbs(herbName1, herbName2) {
    if ((this.inventory[herbName1] || 0) > 0 &&
        (this.inventory[herbName2] || 0) > 0) {
      this.inventory[herbName1] -= 1;
      this.inventory[herbName2] -= 1;
      return true;
    } else {
      return false;
    }
  }
}

/////////////////////////////////////////////////
// DRUID
/////////////////////////////////////////////////

const MOURNING_DURATION = 4;
const RUNE_DISCOVERY_CHANCE = 0.5;

const complementaryRunes = {
  'A': 'B',
  'B': 'A',
  'C': 'D',
  'D': 'C'
};

class Druid {
  constructor() {
    this.herbGathering = new HerbGathering();

    this.mourning = 0;
    this.days = 1;
    this.gameState = 'MAIN';
    this.setState('MAIN');
    this.msg = ['Welcome to The Druid Game!'];
    this.cursor = 0;
    this.cursorP = 0;
    this.cursorMiasma = 0;
    this.windowP = 0;
    this.windowPSize = 1;
    this.cursorMain = 0;
    this.cursorE = 0;
    this.cursorVillage = 0;
    this.selectedVillage = 0;
    this.selectedHerbs = [];  // Herbs selected for combination
    this.usedPotions = [];
    this.crystals = 1;
    this.combinationMap = {};
    this.initCombinationMap();
    this.mainMenuOptions = {
      "village": "VILLAGE",
      "inventory": "INVENTORY",
      "gather": "CHOOSE_ENVIRONMENT",
      "travel": "TRAVELLING",
      "wait": "WAIT",
      // "druid": "DRUID",
    };

    // Druid leveling system
    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = 100;  // XP needed to level up
  }

  discardHerb(herbName) {
    this.herbGathering.useHerb(herbName);
  }

  discoverHerbEffect(herbName) {
    if (!herbMap[herbName]
             .known) {  // Check if the effect was previously unknown
      herbMap[herbName].known = true;
      this.msg.push(`You have discovered the effect of ${herbName}: ${
          herbMap[herbName].effectDescription}`);
    }

    if (Math.random() < RUNE_DISCOVERY_CHANCE) {
      const i = Math.floor(Math.random() * 3);
      this.revealRune(herbName, i);
    }
  }

  gatherIngredients(environment) {
    this.herbGathering.gather(environment);
  }

  revealRune(herbName, i) {
    const revealedRunes = herbMap[herbName].revealRune(i);
  }

  treatPatient(patientId, herbName) {
    if (this.herbGathering.useHerb(herbName)) {
      const patient = this.currentVillage().patients[patientId];

      const isDragonscale = !patient.dragonscaleActive;

      patient.drugsTaken.push({
        'name': herbName,
        'finalEffect': herbMap[herbName].finalFunction,
        'dailyEffect': () => {},
        'daysRemaining': herbMap[herbName].duration,
      });

      if (!isDragonscale && patient.dragonscaleActive) {
        patient.dragonscaleActive = false;
      }

      this.msg.push(`Treated Patient ${patientId} with ${herbName}.`);
    }
  }

  progressGame() {
    villages.forEach(v => v.progress());

    villages.forEach(v => {
      v.patients.forEach(patient => {
        patient.progressDiseases();
        patient.applyDrugs(this);
        if (patient.isDead()) {
          this.mourning += MOURNING_DURATION;
          this.msg.push(`Patient ${patient.id} in ${v.name} has died.`);
          v.deadCount += 1;
          v.patients = v.patients.filter(p => p !== patient);
          const patch = v.createMiasmaPatch();
          patch.increaseStrength();
          this.msg.push(`A new miasma patch has formed at ${patch.location}.`);
        } else if (patient.isCured()) {
          this.msg.push(`Patient ${patient.id} in ${
              v.name} is cured. You gained a crystal.`);
          this.crystals += 1;
          v.curedCount += 1;
          if (!patient.disease.diseaseType.known) {
            patient.disease.diseaseType.known = true;
            const dName = patient.disease.diseaseType.name;
            this.msg.push(`Discovered disease ${dName}`);
          }
          this.gainXp(50);  // Example amount of XP gained per cured patient
          v.patients = v.patients.filter(p => p !== patient);
        }
      });
    });

    this.days += 1;
    return true;
  }

  progressGameForDays(days) {
    for (let i = 0; i < days; i++) {
      if (!this.progressGame()) {
        return false;
      }
    }
    return true;
  }

  updateCursorP(newValue) {
    this.cursorP = Math.max(
        0, Math.min(newValue, this.currentVillage().patients.length - 1));

    if (this.cursorP >= this.windowP + this.windowPSize) {
      this.windowP += 1;
    }
    if (this.cursorP < this.windowP) {
      this.windowP -= 1;
    }
  }

  updateCursor(newValue) {
    this.cursor = Math.max(0, Math.min(newValue, 24));
  }

  updateCursorMain(newValue) {
    this.cursorMain = Math.max(0, Math.min(newValue, Object.keys(this.mainMenuOptions).length-1));
  }

  updateCursorE(newValue) {
    this.cursorE = Math.max(0, Math.min(newValue, 5));
  }

  updateCursorVillage(newValue) {
    this.cursorVillage = Math.max(0, Math.min(newValue, villages.length - 1));
  }

  updateCursorMiasma(newValue) {
    this.cursorMiasma = Math.max(
        0, Math.min(newValue, this.currentVillage().miasmaPatches.length - 1));
  }

  checkWinCondition() {
    return false;
  }

  setState(newState) {
    this.gameState = newState;
    switch (newState) {
      case 'MAIN':
        this.cursorMain = 0;
        this.cursor = -1;
        // this.cursorP = -1;
        this.cursorE = -1;
        this.cursorMiasma = -1;
        this.cursorVillage = -1;
        this.selectedHerbs = [];
        break;
      case 'CHOOSE_ENVIRONMENT':
        this.cursorE = 0;
        break;
      case 'REMOVE_MIASMA':
        this.cursorMiasma = 0;
        break;
      case 'TREATING_PATIENT':
        this.cursorP = this.windowP;
        break;
      case 'VILLAGE':
        // this.cursorP = 0;
        break;
      case 'TRAVELLING':
        this.cursorVillage = 0;
        break;
      default:
        if ([
              'TREATING', 'DISCOVERING', 'SELECT_POTION'
            ].includes(newState)) {
          // this.cursor = 0;
        }
        break;
    }
  }

  currentVillage() {
    return villages[this.selectedVillage];
  }

  combinePotion() {
    if (this.selectedHerbs.length >= 2) {
      const [herbName1, herbName2] = this.selectedHerbs;
      if (!this.herbGathering.useTwoHerbs(herbName1, herbName2)) {
        this.msg.push('Not enough herbs to combine.');
        return;
      }

      let revealedRunes1 = herbMap[herbName1].revealedRunes;
      let revealedRunes2 = herbMap[herbName2].revealedRunes;
      for (let i = 0; i < 3; i++) {
        const rune1 = herbMap[herbName1].runes[i];
        const rune2 = herbMap[herbName2].runes[i];
        if (rune2 === complementaryRunes[rune1]) {
          revealedRunes1[i] = herbMap[herbName1].runes[i];
          revealedRunes2[i] = herbMap[herbName2].runes[i];
        }
      }
      herbMap[herbName1].revealedRunes = revealedRunes1;
      herbMap[herbName2].revealedRunes = revealedRunes2;

      const potion = new Potion(this.selectedHerbs, this.combinationMap);
      if (potion.isSuccessful()) {
        const newHerb = potion.getNewHerb();
        this.herbGathering.inventory[newHerb] += 1;
        this.msg.push(`Potion successful! Created: ${newHerb}`);
      } else {
        this.msg.push('Potion combination failed!');
      }
    } else {
      this.msg.push('Select at least two herbs to combine.');
    }

    this.selectedHerbs = [];
  }

  selectHerbForCombination(herb) {
    if (this.selectedHerbs.includes(herb)) {
      this.selectedHerbs = this.selectedHerbs.filter(h => h !== herb);
    } else {
      this.selectedHerbs.push(herb);
    }
  }

  gainXp(amount) {
    this.xp += amount;
    if (this.xp >= this.xpToNextLevel) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level += 1;
    this.xp -= this.xpToNextLevel;
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
    this.msg.push(`Congratulations! You have reached Level ${this.level}.`);
  }

  removeMiasma() {
    if (this.crystals <= 0) {
      return;
    }
    this.crystals -= 1;

    const patch = this.currentVillage().miasmaPatches[this.cursorMiasma];
    patch.decreaseStrength();
    if (patch.strength === 0) {
      this.currentVillage().miasmaPatches =
          this.currentVillage().miasmaPatches.filter(p => p !== patch);
    }
    this.writeMsg(`Performed ritual in the miasma patch in ${patch.location}.`);
  }

  initCombinationMap() {
    const keys = Object.keys(herbMap).slice(0, 20);
    keys.sort(() => Math.random() - 0.5);

    const newHerbs = [
      'Solar Blossom', 'Shadowthorn', 'Celestial Fungus', 'Verdant Vine',
      'Ironleaf'
    ];

    newHerbs.forEach(newHerb => {
      const herb1 = keys.pop();
      const herb2 = keys.pop();
      this.combinationMap[newHerb] = new Set([herb1, herb2])
    });

    this.generateRunesForHerbs();
    updateHerbMap();
  }

  generateRunesForHerbs() {
    for (let herb in herbMap) {
      const runes =
          Array.from({length: 3}, () => 'ABCD'[Math.floor(Math.random() * 4)]);
      herbMap[herb].runes = runes;
    }

    Object.keys(this.combinationMap).forEach((new_herb) => {
      let [herb1, herb2] = this.combinationMap[new_herb];
      const runes = ['*', '*', '*'];
      for (let i = 0; i < 3; i++) {
        runes[i] = complementaryRunes[herbMap[herb1].runes[i]];
      }
      herbMap[herb2].runes = runes;
    });
  }

  writeMsg(msg) {
    this.msg.push(msg);
  }
}

/////////////////////////////////////////////////
// PATIENT
/////////////////////////////////////////////////

class Organ {
  constructor(name, system, patient) {
    this.name = name;
    this.system = system;
    this.hp = 10;
    this.critical = false;
    this.diseased = false;
    this.patient = patient;
    this.decrease = 0;
    this.justSpreaded = false;
  }

  damage(damage) {
    if (this.patient.silvervineActive) {
      return;
    }

    damage = Math.min(this.hp, damage);
    this.hp -= damage;
    this.decrease -= damage;
    if (this.hp <= 0) {
      this.critical = true;
    }
  }

  treat(healing, canHealCritical = false) {
    healing *= this.patient.getMultiplier();

    if (!this.critical) {
      this.hp += healing;
      if (this.hp >= 10) {
        this.hp = 10;
        this.diseased = false;
      }
    } else if (canHealCritical) {
      this.hp += healing;
      this.critical = false;
      if (this.hp >= 10) {
        this.hp = 10;
        this.diseased = false;
      }
    }
  }
}

class Patient {
  constructor(id) {
    this.id = id;
    this.organs = [
      new Organ('Heart', 'Cardiovascular', this),
      new Organ('Lungs', 'Respiratory', this),
      new Organ('Liver', 'Digestive', this),
      new Organ('Kidneys', 'Urinary', this),
      new Organ('Brain', 'Nervous', this),
    ];
    this.dead = false;
    this.dragonscaleActive = false;  // Flag for Dragonscale Fungus effect
    this.silvervineActive = false;   // Flag for Silvervine effect
    this.silvervineCounter = 0;
    this.drugsTaken = [];

    // Choose a random disease from the disease registry
    const randomDiseaseType =
        diseaseRegistry[Math.floor(Math.random() * diseaseRegistry.length)];

    // Initialize the disease with the chosen disease type
    this.disease = new Disease(randomDiseaseType, this);
  }

  getMultiplier() {
    return this.dragonscaleActive ? 2 : 1;
  }

  progressDiseases() {
    this.organs.forEach(organ => {
      if (organ.critical) {
        this.dead = true;
      }
    });
    this.disease.progress();

    this.organs.forEach(organ => {
      organ.hp = Math.max(0, organ.hp);
    });

    // Reset the Silvervine effect after one turn
    this.silvervineCounter -= 1;
    if (this.silvervineCounter < 0) {
      this.silvervineActive = false;
    }
  }

  applyDrugs(druid) {
    this.drugsTaken.forEach(drug => {
      drug.dailyEffect(this);   // Apply the drug's effect
      drug.daysRemaining -= 1;  // Decrease duration
      if (drug.daysRemaining <= 0) {
        // prompt(JSON.stringify(drug))
        // prompt(drug['finalEffect'])
        drug['finalEffect'](this);  // Apply the final effect
        this.drugsTaken = this.drugsTaken.filter(
            d => d !== drug);  // Remove the drug if time is up
        druid.discoverHerbEffect(drug.name);
      }
    });

    this.organs.forEach(organ => {
      organ.hp = Math.max(0, organ.hp);
    });
  }

  isDead() {
    return this.organs.filter(organ => organ.critical).length >= 2;
  }

  isCured() {
    return this.organs.filter(organ => organ.diseased).length === 0;
  }

  getOrgan(organName) {
    return this.organs.find(organ => organ.name === organName) || null;
  }
}

/////////////////////////////////////////////////
// POTION
/////////////////////////////////////////////////

class Potion {
  constructor(herbs, combinationMap) {
    this.herbs = herbs;
    this.combinationMap = combinationMap;
    this.newHerb = this.combineHerbs();
  }

  combineHerbs() {
    // Create a Set of the provided herbs for lookup
    const herbSet = new Set(this.herbs);

    Object.keys(this.combinationMap).forEach((new_herb) => {
      let [herb1, herb2] = this.combinationMap[new_herb];
      let [herbS1, herbS2] = herbSet;
      if (herb1 == herbS1 && herb2 == herbS2) {
        return new_herb;
      }
    });

    return null;
    // Check if the combination exists in the combination map
    // return this.combinationMap.get(herbSet) || null;
  }

  isSuccessful() {
    // Check if the combination produced a new herb
    return this.newHerb !== null;
  }

  getNewHerb() {
    // Return the name of the newly created herb
    if (this.isSuccessful()) {
      return this.newHerb;
    } else {
      return null;
    }
  }
}

/////////////////////////////////////////////////
// VILLAGE
/////////////////////////////////////////////////

const firstNames = [
  'Aeliana', 'Bran',    'Caius', 'Dara',  'Elara', 'Faelan', 'Gwyn',
  'Hale',    'Iona',    'Jarek', 'Kiera', 'Lucan', 'Mira',   'Nolan',
  'Orin',    'Phaedra', 'Quinn', 'Ronan', 'Sera',  'Talia'
];

const lastNames = [
  'Ashdown',    'Briar',     'Caskwell',  'Dunwood',    'Eldridge',
  'Fenwick',    'Grimsbane', 'Hawke',     'Ironwood',   'Jasper',
  'Ketteridge', 'Larkspur',  'Mosswood',  'Northgate',  'Oakhart',
  'Pinehurst',  'Quintrell', 'Ravenwood', 'Stormrider', 'Thorne'
];

const prefixes = [
  'Stone',  'Oak',   'River', 'Wolf',   'Raven',  'Iron',   'Bright',
  'Shadow', 'Frost', 'Wind',  'Moon',   'Sun',    'Dark',   'Whisper',
  'Eagle',  'Moss',  'Pine',  'Silver', 'Golden', 'Thunder'
];

const suffixes = [
  'haven',  'wood',  'field', 'brook', 'hill',   'stead', 'vale',
  'shire',  'crest', 'ford',  'glen',  'hollow', 'cliff', 'gate',
  'meadow', 'ridge', 'grove', 'stone', 'fall',   'reach'
];

const BASE_SPREAD_CHANCE = 0.05;

class MiasmaPatch {
  constructor(location, strength = 1) {
    this.location = location;
    this.strength = strength;  // Strength ranges from 1 (weak) to 5 (strong)
    this.counter = 30;
  }

  increaseStrength() {
    if (this.strength < 5) {
      this.strength += 1;
    }
    this.counter = 30;
  }

  decreaseStrength() {
    if (this.strength > 0) {
      this.strength -= 1;
    }
  }
}

class Village {
  constructor(initialPatientCount = 3) {
    this.name = this.generateRandomVillageName();
    this.patients = [];
    this.villagers = [];
    this.patientCounter = 0;
    this.deadCount = 0;
    this.curedCount = 0;
    this.baseSpreadChance = 0.01;
    this.miasmaPatches = [];  // List of active miasma patches

    for (let i = 0; i < initialPatientCount; i++) {
      this.addPatient();
    }

    for (let i = 0; i < 20; i++) {
      const name = this.generateRandomName();
      this.villagers.push(new Patient(name));
      this.patientCounter += 1;
    }

    this.initializeMiasmaPatches();
  }

  addPatient() {
    const name = this.generateRandomName();
    this.patients.push(new Patient(name));
    this.patientCounter += 1;
  }

  generateRandomName() {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  }

  generateRandomVillageName() {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix}${suffix}`;
  }

  initializeMiasmaPatches() {
    const numPatches = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < numPatches; i++) {
      const location =
          ['North Field', 'South Lake', 'East Woods',
           'West Hill'][Math.floor(Math.random() * 4)];
      const strength = Math.floor(Math.random() * 2) + 1;
      this.miasmaPatches.push(new MiasmaPatch(location, strength));
    }
  }

  calculateMiasmaStrength() {
    return this.miasmaPatches.reduce(
        (total, patch) => total + patch.strength, 0);
  }

  calculateSpreadChance() {
    const spreadChance = this.baseSpreadChance * this.calculateMiasmaStrength();
    return spreadChance + BASE_SPREAD_CHANCE;
  }

  createMiasmaPatch() {
    if (this.miasmaPatches.length >= 3) {
      return this
          .miasmaPatches[Math.floor(Math.random() * this.miasmaPatches.length)];
    }

    const location =
        ['North Field', 'South Lake', 'East Woods',
         'West Hill'][Math.floor(Math.random() * 4)];
    const newPatch = new MiasmaPatch(location, 0);
    this.miasmaPatches.push(newPatch);
    return newPatch;
  }

  progress() {
    if (this.villagers.length === 0) {
      return;
    }

    const spreadChance = this.calculateSpreadChance();
    const shouldSpread = Math.random() < spreadChance;
    if (shouldSpread) {
      const newPatient =
          this.villagers[Math.floor(Math.random() * this.villagers.length)];
      this.patients.push(newPatient);
      this.villagers =
          this.villagers.filter(villager => villager !== newPatient);
    }

    for (let patch of this.miasmaPatches) {
      patch.counter -= 1;
      if (patch.counter <= 0) {
        patch.increaseStrength();
      }
    }
  }
}

const village1 = new Village(3);
const village2 = new Village(2);
const village3 = new Village(2);

const villages = [village1, village2, village3];

/////////////////////////////////////////////////
// DISPLAY
/////////////////////////////////////////////////

const SCREEN_WIDTH = 80;
const SCREEN_HEIGHT = 50;

function zfill(x) {
  return x < 10 ? ' ' + String(x) : String(x);
}

function createScreen(width, height) {
  return Array.from({length: height}, () => Array(width).fill(' '));
}

function writeToScreen(screen, x, y, text) {
  for (let i = 0; i < text.length; i++) {
    if (x + i >= 0 && x + i < SCREEN_WIDTH && y >= 0 && y < SCREEN_HEIGHT) {
      screen[y][x + i] = text[i];
    }
  }
}

function displayScore(druid, screen, x = 0, y = 0) {
  const village = druid.currentVillage();
  const scoreText = `Days: ${druid.days}    Crystals: ${druid.crystals}     ${druid.gameState}`;
  writeToScreen(screen, x, y, scoreText);
}

function displayOrgan(druid, organ, screen, x = 0, y = 0) {
  let strName = organ.name + (organ.critical ? ' (*)' : '');
  strName += ' '.repeat(12 - strName.length);
  let diseased = organ.diseased ? '[D]' : '   ';
  diseased = organ.justSpreaded ? '[S]' : diseased;
  const hp_s = zfill(organ.hp);
  const decrease_s = organ.decrease !== 0 ? organ.decrease : ' ';
  const status = `${strName} ${diseased} ${hp_s} / 10 ${decrease_s}`;
  organ.decrease = 0;
  return status;
}

function displayMiasmaPatches(druid, screen, x = 0, y = 0) {
  const village = druid.currentVillage();
  if (village.miasmaPatches.length === 0) {
    writeToScreen(screen, x, y, 'No miasma patches detected in the village.');
    return y + 1;
  }

  y += 1;

  for (let i = 0; i < village.miasmaPatches.length; i++) {
    const patch = village.miasmaPatches[i];
    const cursor_s = druid.cursorMiasma === i ? '>' : ' ';
    const locationStr = `${cursor_s} ${patch.location}`;
    const strengthIndicator = '*'.repeat(patch.strength);
    const strengthStr = `${strengthIndicator}`;
    writeToScreen(screen, x, y, `${locationStr.padEnd(10)} ${strengthStr}`);
    y += 1;
  }
  return y;
}

function displayVillageInfo(druid, village, screen, x = 0, y = 0) {
  writeToScreen(screen, x, y, `Village: ${village.name}`);
  y += 1;
  writeToScreen(screen, x, y, `Population: ${village.villagers.length}`);
  y += 1;
  writeToScreen(screen, x, y, `Graveyard: ${village.deadCount}`);
  y += 1;
  writeToScreen(
      screen, x, y, `(m) Miasma Strength: ${village.calculateMiasmaStrength()}`);
  y += 1;
  writeToScreen(
      screen, x, y,
      `Spread Chance: ${(village.calculateSpreadChance() * 100).toFixed(2)}%`);
  y += 1;
  writeToScreen(
      screen, x, y,
      `Sick: ${village.patients.length}`);
  y += 2;

  // y = displayMiasmaPatches(druid, village, screen, x, y);

  // y += 1;

  return y;
}

function displayPatients(druid, screen, x = 0, y = 0) {
  const village = druid.currentVillage();
  y = displayVillageInfo(druid, village, screen, x, y)

  writeToScreen(screen, x, y, '='.repeat(30));
  y += 1;

  const colSize = 30;

  const lft = druid.windowP > 0 ? '<' : ' ';
  const rgt =
      village.patients.length > druid.windowP + druid.windowPSize ? '>' : ' ';
  let header = `${druid.cursorP+1} of ${village.patients.length}`;
  let paddingLft = ' '.repeat((colSize - header.length - 2)/2)
  let paddingRgt = ' '.repeat(colSize - header.length - paddingLft.length - 2);
  header = `${lft}` + paddingLft + header + paddingRgt + `${rgt}`;
  writeToScreen(screen, x, y, header);
  y += 1;

  writeToScreen(screen, x, y, '='.repeat(30));
  y += 1;

  if (village.patients.length <= druid.windowP) {
    druid.windowP =
        Math.max(0, village.patients.length - druid.windowPSize - 1);
  }
  const end =
      Math.min(druid.windowP + druid.windowPSize, village.patients.length);

  let lineStr = '';
  for (let i = druid.windowP; i < end; i++) {
    // const cursor_s = druid.cursorP === i ? '>' : ' ';
    const cursor_s = ' ';
    let s = `${cursor_s} (t) ${village.patients[i].id} `;
    s += village.patients[i].dragonscaleActive ? '[D]' : '';
    s += village.patients[i].silvervineActive ? '[S]' : '';
    lineStr += s + ' '.repeat(colSize - s.length);
  }
  writeToScreen(screen, x, y, lineStr);
  y += 1;

  lineStr = '';
  for (let i = druid.windowP; i < end; i++) {
    const disease = village.patients[i].disease;
    const d_name = disease.diseaseType.name;
    let s = `  Dis: ${d_name} `;
    s = s.slice(0, Math.min(s.length, colSize));
    lineStr += s + ' '.repeat(colSize - s.length);
  }
  writeToScreen(screen, x, y, lineStr);
  y += 1;

  if (village.patients.length > 0) {
    const numOrgans = village.patients[0].organs.length;
    for (let i = 0; i < numOrgans; i++) {
      lineStr = '  ';
      for (let j = druid.windowP; j < end; j++) {
        const organStr =
            displayOrgan(druid, village.patients[j].organs[i], screen, x, y);
        lineStr += organStr + ' '.repeat(colSize - organStr.length);
      }
      writeToScreen(screen, x, y, lineStr);
      y += 1;
    }

    for (let i = 0; i < 5; i++) {
      lineStr = '  ';
      for (let j = druid.windowP; j < end; j++) {
        let drugStr = '';
        if (village.patients[j].drugsTaken.length > i) {
          const drug = village.patients[j].drugsTaken[i];
          drugStr = `${drug.name} (${drug.daysRemaining})`;
        }
        lineStr += drugStr + ' '.repeat(colSize - drugStr.length);
      }
      writeToScreen(screen, x, y, lineStr);
      y += 1;
    }
  }
  return y;
}

function displayInventory(druid, screen, x = 0, y = 0) {
  writeToScreen(screen, x, y, 'Ingredients stash:');
  y += 2;

  let i = 0;
  const total = zfill(
      Object.values(druid.herbGathering.inventory).reduce((a, b) => a + b, 0));

  for (const [herb, quantity] of Object.entries(
           druid.herbGathering.inventory)) {
    const herbName = herb + ' '.repeat(18 - herb.length);
    const qty = zfill(quantity);
    // const cursor_s = druid.cursor === i ? '>' : ' ';
    const cursor_s = '';
    const justAcquired = druid.herbGathering.justAcquired[herb] > 0 ?
        '+' + druid.herbGathering.justAcquired[herb] :
        '  ';
    const runes = herbMap[herb].revealedRunes.join('');
    const effectDescription = herbMap[herb].known ?
        herbMap[herb].effectDescription :
        'Unknown effect.';

    let inventoryLine = `${qty} ${herbName} ${runes} ${effectDescription}`;

    if (druid.selectedHerbs.includes(herb)) {
      inventoryLine += ' (Selected)';
    }

    writeToScreen(screen, x, y, inventoryLine);
    y += 1;
    i += 1;
  }

  writeToScreen(
      screen, x, y, `${total} / ${druid.herbGathering.maxInventory}`);
  y += 1;

  druid.herbGathering.justAcquired = Object.fromEntries(
      Object.keys(druid.herbGathering.availableHerbs).map(k => [k, 0]));
}

function displayMessages(druid, screen, x = 0, y = 0) {
  druid.msg.slice(-10).reverse().forEach(msg => {
    writeToScreen(screen, x, y, msg);
    y += 1;
  });
}

function displayEnvironment(druid, screen, x = 0, y = 0) {
  if (druid.gameState === 'CHOOSE_ENVIRONMENT') {
    environments.forEach((environment, i) => {
      const cursor_e = druid.cursorE === i ? '>' : ' ';
      const environmentLine = `${cursor_e} ${environment.name}`;
      writeToScreen(screen, x, y + i, environmentLine);
    });
  }
}

function displayVillages(druid, screen, x = 0, y = 0) {
  if (druid.gameState === 'TRAVELLING') {
    villages.forEach((village, i) => {
      const cursor_e = druid.cursorVillage === i ? '>' : ' ';
      const villageLine = `${cursor_e} ${village.name}`;
      writeToScreen(screen, x, y + i, villageLine);
    });
  }
}

function displayControls(screen, x = 0, y = 0) {
  const s =
      '(t) Treat Patient, (l) Look Patients, (g) Gather Ingredients (d) Discard Herb (T) Travel (p) Create Potion (m) Remove Miasma';
  writeToScreen(screen, x, y, s);
}

function displayDruid(druid, screen, x = 0, y = 0) {
  const levelInfo = `Druid Level: ${druid.level}`;
  const xpInfo = `XP: ${druid.xp} / ${druid.xpToNextLevel}`;
  writeToScreen(screen, x, y, levelInfo);
  writeToScreen(screen, x, y + 1, xpInfo);
  writeToScreen(screen, x, y + 2, `Crystals: ${druid.crystals}`);
}

function displayMainMenu(druid, screen, x = 0, y = 0) {
  Object.keys(druid.mainMenuOptions).forEach((optionName, i) => {
    const cursor_e = druid.cursorMain === i ? '>' : ' ';
    const optionLine = `${cursor_e} ${optionName}`;
    writeToScreen(screen, x, y + i, optionLine);
  });
}

function handleClick(druid, rowIndex, colIndex) {
  if (rowIndex == 1) {
    druid.setState("MAIN");
    runLoop("$", isBrowser = true);
    return;
  }
  // alert(`Row: ${rowIndex}, Column: ${colIndex}`);
  let cursor = rowIndex;
  let maxValue = 1000;
  switch (druid.gameState) {
    case 'MAIN':
      cursor -= 3;
      maxValue = 5;
      break;
    case 'VILLAGE':
      if (rowIndex == 13) {
        druid.setState("TREATING_PATIENT");
        runLoop("$", isBrowser = true);
        return;
      } else if (rowIndex == 6) {
        druid.setState("REMOVE_MIASMA");
        runLoop("$", isBrowser = true);
        return;
      } else if (rowIndex == 11 && colIndex == 1) {
        druid.updateCursorP(druid.cursorP - 1);
        runLoop("$", isBrowser = true);
        return;
      } else if (rowIndex == 11 && colIndex == 30) {
        druid.updateCursorP(druid.cursorP + 1);
        runLoop("$", isBrowser = true);
        return;
      }
      break;
    case 'REMOVE_MIASMA':
      cursor -= 4;
      maxValue = druid.currentVillage().miasmaPatches.length;
      break;
    case 'TREATING_PATIENT':
      cursor -= 5;
      maxValue = 25;
      break;
    case 'CHOOSE_ENVIRONMENT':
      cursor -= 3;
      maxValue = 4;
      break;
    case 'TRAVELLING':
      cursor -= 3;
      maxValue = 3;
      break;
    case 'INVENTORY':
      cursor -= 5;
      maxValue = 25;
      break;
    default:
      druid.setState("MAIN")
      runLoop("$", isBrowser = true);
      return;
  }

  if (cursor < 0 || cursor >= maxValue) {
    druid.setState("MAIN")
    runLoop("$", isBrowser = true);
    return;
  }

  switch (druid.gameState) {
    case 'MAIN':
      druid.cursorMain = cursor;
      if (druid.cursorMain == 4) {
        runLoop(" ", isBrowser = true);
        return;
      }
      break;
    case 'TRAVELLING':
      druid.cursorVillage = cursor;
      break;
    case 'CHOOSE_ENVIRONMENT':
      druid.cursorE = cursor;
      break;
    case 'TREATING_PATIENT':
      druid.cursor = cursor;
      break;
    case 'INVENTORY':
      druid.cursor = cursor;
      druid.setState("DISCOVERING");
      runLoop("ENTER", isBrowser = true);
      runLoop("$", isBrowser = true);
      return;
    case 'REMOVE_MIASMA':
      druid.cursorMiasma = cursor;
      break;
  }

  runLoop("ENTER", isBrowser = true);
}

function renderScreen(druid, screen, isBrowser) {
  const frameChar = '░';
  const width = screen[0].length;
  const topBottomBorder = frameChar.repeat(width + 2); // Top and bottom borders

  if (isBrowser) {
    const gameConsole = document.getElementById('game-console');
    gameConsole.innerHTML = '';  // Clear previous screen

    // Render the top border
    const topBorderElement = document.createElement('div');
    topBorderElement.className = 'row';
    for (let col = 0; col < width + 2; col++) {
      const charElement = document.createElement('div');
      charElement.className = 'col';
      charElement.textContent = frameChar;
      topBorderElement.appendChild(charElement);
    }
    gameConsole.appendChild(topBorderElement);

    // Render the screen with side borders
    screen.forEach((row, rowIndex) => {
      const rowElement = document.createElement('div');
      rowElement.className = 'row';

      // Left border
      const leftBorderElement = document.createElement('div');
      leftBorderElement.className = 'col';
      leftBorderElement.textContent = frameChar;
      rowElement.appendChild(leftBorderElement);

      // Screen content
      row.forEach((char, colIndex) => {
        const charElement = document.createElement('div');
        charElement.className = 'col';
        charElement.textContent = char;

        // Set custom attributes for row and column
        charElement.setAttribute('data-row', rowIndex);
        charElement.setAttribute('data-col', colIndex);

        // Add click event to detect row and column
        charElement.addEventListener('click', function() {
          handleClick(druid, rowIndex, colIndex);
        });

        rowElement.appendChild(charElement);
      });

      // Right border
      const rightBorderElement = document.createElement('div');
      rightBorderElement.className = 'col';
      rightBorderElement.textContent = frameChar;
      rowElement.appendChild(rightBorderElement);

      gameConsole.appendChild(rowElement);
    });

    // Render the bottom border
    const bottomBorderElement = document.createElement('div');
    bottomBorderElement.className = 'row';
    for (let col = 0; col < width + 2; col++) {
      const charElement = document.createElement('div');
      charElement.className = 'col';
      charElement.textContent = frameChar;
      bottomBorderElement.appendChild(charElement);
    }
    gameConsole.appendChild(bottomBorderElement);

    // const gameConsole = document.getElementById('game-console');
    // gameConsole.innerHTML = '';  // Clear previous screen

    // // Render the top border
    // gameConsole.innerHTML += topBottomBorder + '\n';

    // // Render the screen with side borders
    // for (let row of screen) {
    //   gameConsole.innerHTML += frameChar + row.join('') + '\n';
    // }

    // // Render the bottom border
    // gameConsole.innerHTML += topBottomBorder + '\n';

    // // Scroll to the bottom of the console
    // gameConsole.scrollTop = gameConsole.scrollHeight;
  } else {
    // Render the top border
    console.log(topBottomBorder);

    // Render the screen with side borders
    for (let row of screen) {
      console.log(frameChar + row.join('') + frameChar);
    }

    // Render the bottom border
    console.log(topBottomBorder);
  }
}

function printScreen(druid, isBrowser) {
  const screen = createScreen(SCREEN_WIDTH, SCREEN_HEIGHT);

  displayScore(druid, screen, 1, 1);

  switch (druid.gameState) {
    case 'MAIN':
      displayMainMenu(druid, screen, 1, 3);
      break;
    case 'CHOOSE_ENVIRONMENT':
      displayEnvironment(druid, screen, 1, 3);
      break;
    case 'TRAVELLING':
      displayVillages(druid, screen, 1, 3);
      break;
    case 'VILLAGE':
      displayPatients(druid, screen, 1, 3);
      break;
    case 'TREATING_PATIENT':
      // let y = displayPatients(druid, screen, 1, 3);
      displayInventory(druid, screen, 1, 3);
      break;
    case 'REMOVE_MIASMA':
      displayMiasmaPatches(druid, screen, 1, 3);
      break;
    case 'INVENTORY':
      displayInventory(druid, screen, 1, 3);
      break;
    default:
      displayControls(screen, 0, 53);
      displayDruid(druid, screen, 90, 2);
      break;
  }

  displayMessages(druid, screen, 1, 34);
  renderScreen(druid, screen, isBrowser);
}

/////////////////////////////////////////////////
// MAIN
/////////////////////////////////////////////////

const DAYS_TO_GATHER = 1;
const DAYS_TO_TREAT = 0;
const DAYS_TO_TRAVEL = 2;
const DAYS_TO_REMOVE_MIASMA = 3;

function getKeypress() {
  return prompt('Press any key or type something:');
}

async function handleEnter(druid) {
  switch (druid.gameState) {
    case 'MAIN':
      let key = Object.keys(druid.mainMenuOptions)[druid.cursorMain];
      druid.setState(druid.mainMenuOptions[key]);
      break;
    case 'TREATING':
      const herbName = availableHerbs[druid.cursor];
      if (druid.herbGathering.inventory[herbName] <= 0) {
        druid.setState('MAIN');
      } else {
        druid.setState('TREATING_PATIENT');
      }
      break;
    case 'TREATING_PATIENT':
      const potionName = availableHerbs[druid.cursor];
      druid.treatPatient(druid.cursorP, potionName);
      druid.setState('VILLAGE');
      if (!await druid.progressGameForDays(DAYS_TO_TREAT)) {
        return false;
      }
      break;
    case 'DISCOVERING':
      const discardName = availableHerbs[druid.cursor];
      druid.discardHerb(discardName);
      druid.setState('INVENTORY');
      break;
    case 'LOOKING':
      druid.setState('MAIN');
      break;
    case 'TRAVELLING':
      druid.selectedVillage = druid.cursorVillage;
      if (!await druid.progressGameForDays(DAYS_TO_TRAVEL)) {
        return false;
      }
      druid.setState('MAIN');
      break;
    case 'SELECT_POTION':
      const selectHerbName = availableHerbs[druid.cursor];
      druid.selectHerbForCombination(selectHerbName);
      break;
    case 'CHOOSE_ENVIRONMENT':
      const env = environments[druid.cursorE];
      druid.gatherIngredients(env);
      druid.setState('INVENTORY');
      if (!await druid.progressGameForDays(DAYS_TO_GATHER)) {
        return false;
      }
      druid.writeMsg(`Gathered ingredients in the ${env.name} for ${
          DAYS_TO_GATHER} days.`);
      break;
    case 'REMOVE_MIASMA':
      druid.removeMiasma();
      if (!await druid.progressGameForDays(DAYS_TO_REMOVE_MIASMA)) {
        return false;
      }
      druid.setState('MAIN');
      break;
  }
  return true;
}

function handleCursor(druid, key) {
  const increment = key === 'k' ? -1 : 1;
  switch (druid.gameState) {
    case 'MAIN':
      druid.updateCursorMain(druid.cursorMain + increment);
      break;
    case 'TREATING':
    case 'DISCOVERING':
    case 'SELECT_POTION':
      druid.updateCursor(druid.cursor + increment);
      break;
    case 'TREATING_PATIENT':
    case 'LOOKING':
      druid.updateCursorP(druid.cursorP + increment);
      break;
    case 'CHOOSE_ENVIRONMENT':
      druid.updateCursorE(druid.cursorE + increment);
      break;
    case 'TRAVELLING':
      druid.updateCursorVillage(druid.cursorVillage + increment);
      break;
    case 'REMOVE_MIASMA':
      druid.updateCursorMiasma(druid.cursorMiasma + increment);
      break;
  }
}

async function mainLoop(druid, key, isBrowser) {
  try {
    // if (druid.checkWinCondition()) {
    //   return false;
    // }

    switch (key) {
      case 'j':
      case 'k':
        handleCursor(druid, key);
        break;
      case 't':
        druid.setState('TREATING');
        break;
      case 'g':
        druid.setState('CHOOSE_ENVIRONMENT');
        break;
      case 'd':
        druid.setState('DISCOVERING');
        break;
      case 'l':
        druid.setState('LOOKING');
        break;
      case 'T':
        druid.setState('TRAVELLING');
        break;
      case 'p':
        druid.setState('SELECT_POTION');
        break;
      case 'c':
        if (druid.gameState === 'SELECT_POTION') {
          druid.combinePotion();
          druid.setState('MAIN');
        }
        break;
      case 'L':
        druid.gainXp(50);
        break;
      case 'm':
        druid.setState('REMOVE_MIASMA');
        break;
      case 'ENTER':
        if (!await handleEnter(druid)) {
          return true;
        }
        break;
      case ' ':
        if (!await druid.progressGameForDays(1)) {
          return true;
        }
        break;
      case '$':
        break;
      case 'ESC':
        return false;
      default:
        return false;
    }

    // if (druid.mourning > 0) {
    //   if (!await druid.progressGameForDays(druid.mourning)) {
    //     return true;
    //   }
    //   druid.mourning = 0;
    // }

    printScreen(druid, isBrowser);
    return true;
  } catch (err) {
    console.log(err);
    if (isBrowser) {
      prompt(err);
    }
    return false;
  }
  return true;
}

const druid = new Druid();
function runLoop(key, isBrowser = true) {
  return mainLoop(druid, key, isBrowser);
}

if (typeof window !== 'undefined') { 
  // Browser.
  runLoop('k', true);
} else if (typeof global !== 'undefined') {
  // Node.
  const readline = require('readline');
  const { stdin: input, stdout: output } = require('process');
  
  readline.emitKeypressEvents(input);
  input.setRawMode(true);
  
  const { execSync } = require('child_process');
  
  // Function to clear the terminal
  function clearTerminal() {
    execSync('clear', { stdio: 'inherit' });
  }

  clearTerminal();
  runLoop('k', false);
  
  input.on('keypress', (str, key) => {
    clearTerminal();
    if (str === '\r' || str === '\n') {
      str = "ENTER"
    } else if (key === '\x1b') {
      str = "ESC"
    }
  
    if (!runLoop(str, false)) {
      console.log('Exiting...');
      process.exit();
    }
  
    // If the user pressed "q", exit the process
    if (key.name === 'q') {
        console.log('Exiting...');
        process.exit();
    }
  });
}

