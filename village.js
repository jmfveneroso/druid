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
