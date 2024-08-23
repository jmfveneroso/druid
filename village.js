import {Patient} from './patient.js';

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

export class VillageMap {
  constructor(width = 42, height = 20, numVillagers = 10) {
    this.width = width;
    this.height = height;
    this.grid = Array.from({ length: height }, () => Array(width).fill(' '));
    this.numVillagers = Math.min(numVillagers, 10);
  }

  placeCentralSquare() {
    const x = Math.floor(this.width / 2) - 2;
    const y = Math.floor(this.height / 2) - 2;
    this.drawRect(x, y, 4, 4, 'S');
  }

  placeTemple() {
    this.placeStructure('T', 4, 3);
  }

  placeGraveyard() {
    this.placeStructure('G', 5, 3);
  }

  placeAlchemyShop() {
    this.placeStructure('A', 4, 2);
  }

  placeFields() {
    const numFields = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numFields; i++) {
      this.placeStructure('F', 6, 4);
    }
  }

  placeHouses() {
    for (let i = 0; i < this.numVillagers; i++) {
      const isSick = Math.random() < 0.3;  // 30% chance of being sick
      this.placeStructure(isSick ? 'H' : 'h', 2, 2);
    }
  }

  placeMiasmaPatches(miasmaPatches) {
    miasmaPatches.forEach(patch => {
      this.placeStructure('M', patch.strength + 1, patch.strength + 1);
    });
  }

  placeStructure(symbol, width, height) {
    let x, y;
    do {
      x = Math.floor(Math.random() * (this.width - width));
      y = Math.floor(Math.random() * (this.height - height));
    } while (!this.canPlaceStructure(x, y, width, height));
    this.drawRect(x, y, width, height, symbol);
  }

  canPlaceStructure(x, y, width, height) {
    for (let i = y; i < y + height; i++) {
      for (let j = x; j < x + width; j++) {
        if (this.grid[i][j] !== ' ') return false;
      }
    }
    return true;
  }

  drawRect(x, y, width, height, symbol) {
    for (let i = y; i < y + height; i++) {
      for (let j = x; j < x + width; j++) {
        this.grid[i][j] = symbol;
      }
    }
  }

  generateMap(miasmaPatches) {
    this.placeCentralSquare();
    this.placeTemple();
    this.placeGraveyard();
    this.placeAlchemyShop();
    this.placeFields();
    this.placeHouses();
    this.placeMiasmaPatches(miasmaPatches);
  }
}

const BASE_SPREAD_CHANCE = 0.05;

class MiasmaPatch {
  constructor(village, location, strength = 1) {
    this.location = location;
    this.strength = strength;  // Strength ranges from 1 (weak) to 5 (strong)
    this.counter = 30;
    this.village = village;
  }

  increaseStrength() {
    if (this.strength < 5) {
      this.strength += 1;
      this.village.logMsg(`The miasma in ${this.location} increased to ${this.strength}.`);
    }
    this.counter = 30;
  }

  decreaseStrength() {
    if (this.strength > 0) {
      this.strength -= 1;
      this.village.logMsg(`The miasma in ${this.location} decreased to ${this.strength}.`);
    }

    if (this.strength === 0) {
      this.village.miasmaPatches =
          this.village.miasmaPatches.filter(p => p !== this);
      this.village.logMsg(`The miasma in ${this.location} was destroyed.`);
    }
  }
}

export class Village {
  constructor(initialPatientCount = 3) {
    this.name = this.generateRandomVillageName();
    this.patients = [];
    this.villagers = [];
    this.patientCounter = 0;
    this.deadCount = 0;
    this.curedCount = 0;
    this.baseSpreadChance = 0.01;
    this.miasmaPatches = [];  // List of active miasma patches
    this.log = [];
    this.days = 0;

    for (let i = 0; i < initialPatientCount; i++) {
      this.addPatient();
    }

    for (let i = 0; i < 10 - initialPatientCount; i++) {
      const name = this.generateRandomName();
      this.villagers.push(new Patient(name));
      this.patientCounter += 1;
    }

    this.initializeMiasmaPatches();
    this.logMsg(`${this.name} has ${this.patients.length} sick villagers.`);

    this.villageMap = new VillageMap();
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
    const numPatches = Math.floor(Math.random()) + 2;
    for (let i = 0; i < numPatches; i++) {
      const location =
          ['North Field', 'South Lake', 'East Woods',
           'West Hill'][Math.floor(Math.random() * 4)];
      const strength = Math.floor(Math.random() * 2) + 1;
      this.miasmaPatches.push(new MiasmaPatch(this, location, strength));
    }
  }

  calculateMiasmaStrength() {
    return this.miasmaPatches.reduce(
        (total, patch) => total + patch.strength, 0);
  }

  calculateSpreadChance() {
    const spreadChance = this.baseSpreadChance * this.calculateMiasmaStrength();
    if (spreadChance < 0.0001) {
      return 0;
    }
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
    const newPatch = new MiasmaPatch(this, location, 0);
    this.miasmaPatches.push(newPatch);
    return newPatch;
  }

  progress(druid) {
    this.days = druid.days;
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
      let numSick = this.patients.length;
      this.logMsg(`${newPatient.id} got sick. Num sick: ${numSick}.`);
    }

    for (let patch of this.miasmaPatches) {
      patch.counter -= 1;
      if (patch.counter <= 0) {
        patch.increaseStrength();
      }
    }
  }

  logMsg(msg) {
    this.log.push(`${this.days}: ${msg}`);
  }

  getSick() {
    return this.patients.filter(p => !p.dead).length;
  }

  getDead() {
    return this.patients.filter(p => p.dead).length + this.deadCount;
  }
}

const village1 = new Village(3);
const village2 = new Village(2);
const village3 = new Village(2);

export const villages = [village1, village2, village3];
