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

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];  // Swap elements
  }
  return array;
}

export class VillageMap {
  constructor(village, width = 42, height = 20) {
    this.village = village;
    this.width = width;
    this.height = height;
    this.grid = Array.from({length: height}, () => Array(width).fill(' '));
    this.gridFn =
        Array.from({length: height}, () => Array(width).fill(undefined));
    this.generateMap();
  }

  placeCentralSquare() {
    return this.placeStructureBounded('░', 8, 4, 10, 5, 30, 15);
  }

  placeSquareBuilding(char, width, height, x, y, direction) {
    let [offsetX, offsetY, maxX, maxY] = [0, 0, 0, 0];
    if (direction === 0) {
      [offsetX, offsetY, maxX, maxY] = [0, -height, 8, height];
    } else if (direction === 1) {
      [offsetX, offsetY, maxX, maxY] = [-width, 0, width, 4];
    } else if (direction === 2) {
      [offsetX, offsetY, maxX, maxY] = [0, 4, 8, height];
    } else if (direction === 3) {
      [offsetX, offsetY, maxX, maxY] = [8, 0, width, 4];
    }
    x += offsetX;
    y += offsetY;
    this.placeStructureBounded(char, width, height, x, y, x + maxX, y + maxY);
  }

  placeTemple(x, y, direction) {
    this.placeSquareBuilding('ฐ', 4, 3, x, y, direction);
  }

  placeGraveyard(x, y, direction) {
    this.placeStructureStrict('±', 5, 3);
  }

  placeAlchemyShop(x, y, direction) {
    this.placeSquareBuilding('╫', 4, 2, x, y, direction);
  }

  placeFields() {
    const numFields = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numFields; i++) {
      const w = Math.floor(Math.random() * 4) + 5;
      const h = Math.floor(Math.random() * 3) + 4;
      this.placeStructureStrict('"', w, h, true);
    }
  }

  placeHouses() {
    for (let i = 0; i < this.village.villagers.length; i++) {
      let villager = this.village.villagers[i];
      let [x, y] = this.getStructurePlacement(3, 2);

      villager.houseLoc = [x, y];
      this.drawRect(
          x, y, 3, 2, '█', {type: 'SELECT_VILLAGER', villager: villager});
    }
  }

  clearMiasmaPatches() {
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        if (this.grid[i][j] == "⊙" || this.grid[i][j] == "§") {
          this.grid[i][j] = " ";
          this.gridFn[i][j] = undefined;
        }
      }
    }
  }

  placeMiasmaPatches(miasmaPatches) {
    this.village.miasmaPatches.forEach(patch => {
      let str = Math.ceil(patch.strength/2) + 1;
      let [x, y] = this.getStructurePlacement(str, str);

      for (let j = y; j < y + str; j++) {
        for (let i = x; i < x + str; i++) {
          let print = (i == x + 1 || j == y + 1) || Math.random() < 0.3;
          if (print) {
            let symbol = '⊙';
            if (Math.random() < 0.3) {
              symbol = '§';
            }
            this.grid[j][i] = symbol;
            this.gridFn[j][i] = {type: 'MIASMA_CLICK'};
          }
        }
      }
    });
  }

  placeStructureBounded(symbol, width, height, x, y, maxX, maxY) {
    let newX, newY;
    for (let i = 0; i < 100; i++) {
      newX = Math.floor(Math.random() * (maxX - x - width));
      newY = Math.floor(Math.random() * (maxY - y - height));
      if (this.canPlaceStructure(x + newX, y + newY, width, height)) {
        this.drawRect(x + newX, y + newY, width, height, symbol);
        break;
      }
    }
    return [x + newX, y + newY];
  }

  getStructurePlacement(width, height) {
    let x, y;
    do {
      x = Math.floor(Math.random() * (this.width - width));
      y = Math.floor(Math.random() * (this.height - height));
    } while (!this.canPlaceStructureStrict(x, y, width, height));
    return [x, y];
  }

  placeStructure(symbol, width, height) {
    let x, y;
    do {
      x = Math.floor(Math.random() * (this.width - width));
      y = Math.floor(Math.random() * (this.height - height));
    } while (!this.canPlaceStructure(x, y, width, height));
    this.drawRect(x, y, width, height, symbol);
  }

  placeStructureStrict(symbol, width, height) {
    let x, y;
    do {
      x = Math.floor(Math.random() * (this.width - width));
      y = Math.floor(Math.random() * (this.height - height));
    } while (!this.canPlaceStructureStrict(x, y, width, height));
    this.drawRect(x, y, width, height, symbol);
  }

  canPlaceStructure(x, y, width, height) {
    if (x < 0 || y < 0 || x + width > this.width || y + height > this.height) {
      return false;
    }

    for (let i = y; i < y + height; i++) {
      for (let j = x; j < x + width; j++) {
        if (this.grid[i][j] !== ' ') return false;
      }
    }
    return true;
  }

  canPlaceStructureStrict(x, y, width, height) {
    if (x < 1 || y < 1 || x + width >= this.width ||
        y + height >= this.height) {
      return false;
    }

    for (let i = y; i < y + height; i++) {
      for (let j = x; j < x + width; j++) {
        for (let i2 = -1; i2 < 2; i2++) {
          for (let j2 = -1; j2 < 2; j2++) {
            if (this.grid[i + i2][j + j2] !== ' ') return false;
          }
        }
      }
    }
    return true;
  }

  drawRect(x, y, width, height, symbol, fn = undefined) {
    for (let i = y; i < y + height; i++) {
      for (let j = x; j < x + width; j++) {
        this.grid[i][j] = symbol;
        if (fn !== undefined) {
          this.gridFn[i][j] = fn;
        }
      }
    }
  }

  getOccupiedSquare() {
    let x, y;
    do {
      x = Math.floor(Math.random() * this.width);
      y = Math.floor(Math.random() * this.height);
    } while (this.grid[y][x] === ' ');
    return [x, y];
  }

  addRoads() {
    for (let k = 0; k < 15; k++) {
      let [x1, y1] = this.getOccupiedSquare();

      let [x2, y2] = [x1, y1];
      do {
        [x2, y2] = this.getOccupiedSquare();
      } while (x1 == x2 && y1 == y2);

      let i = x1
      let j = y1
      let iInc = x2 > x1 ? 1 : -1;
      let jInc = y2 > y1 ? 1 : -1;
      for (; i != x2; i += iInc) {
        if (this.grid[j][i] == ' ') {
          if (Math.random() < 0.4) {
            let symbol = '.';
            if (Math.random() < 0.2) {
              symbol = '∙';
            }
            this.grid[j][i] = symbol;
          }
        }
      }

      for (; j != y2; j += jInc) {
        if (this.grid[j][i] == ' ') {
          if (Math.random() < 0.4) {
            let symbol = '.';
            if (Math.random() < 0.2) {
              symbol = '∙';
            }
            this.grid[j][i] = symbol;
          }
        }
      }
    }
  }

  generateMap(miasmaPatches) {
    let [x, y] = this.placeCentralSquare();

    let arr = [0, 1, 2, 3];
    arr = shuffleArray(arr);

    this.placeTemple(x, y, arr[0]);
    this.placeAlchemyShop(x, y, arr[1]);

    this.placeGraveyard();
    this.placeFields();
    this.placeHouses();
    // this.addRoads();
    this.placeMiasmaPatches(miasmaPatches);
    this.updateMap();
  }

  updateMap() {
    for (let i = 0; i < this.village.villagers.length; i++) {
      let villager = this.village.villagers[i];
      let [x, y] = villager.houseLoc;

      for (let j = 0; j < 3; j++) {
        if (villager.isDead()) {
          this.grid[y][x+j] = "±";
        } else if (villager.isCritical()) {
          this.grid[y][x+j] = "*";
        } else if (villager.isSick()) {
          this.grid[y][x+j] = "≠";
        } else {
          this.grid[y][x+j] = "█";
        }
      }
    }
    this.clearMiasmaPatches();
    this.placeMiasmaPatches(this.village.miasmaPatches);
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
      this.village.logMsg(
          `The miasma in ${this.location} increased to ${this.strength}.`);
    }
    this.counter = 30;
  }

  decreaseStrength() {
    if (this.strength > 0) {
      this.strength -= 1;
      this.village.logMsg(
          `The miasma in ${this.location} decreased to ${this.strength}.`);
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
    this.villagers = [];
    this.deadCount = 0;
    this.curedCount = 0;
    this.baseSpreadChance = 0.01;
    this.miasmaPatches = [];  // List of active miasma patches
    this.log = [];
    this.days = 0;

    for (let i = 0; i < 10 - initialPatientCount; i++) {
      const name = this.generateRandomName();
      this.villagers.push(new Patient(name));
    }

    for (let i = 0; i < initialPatientCount; i++) {
      this.addPatient();
    }

    this.initializeMiasmaPatches();
    this.logMsg(`${this.name} has ${this.getSick()} sick villagers.`);

    this.villageMap = new VillageMap(this);
  }

  addPatient() {
    const newPatient =
        this.villagers[Math.floor(Math.random() * this.villagers.length)];
    newPatient.infect();
    let numSick = this.getSick();
    this.logMsg(`${newPatient.id} got sick. Num sick: ${numSick}.`);
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
      this.addPatient();
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

  getHealthy() {
    return this.villagers.filter(p => !p.isSick()).length;
  }

  getSick() {
    return this.villagers.filter(p => p.isSick()).length - this.getDead();
  }

  getDead() {
    return this.villagers.filter(p => p.dead).length;
  }

  getPatients() {
    return this.villagers.filter(p => p.isSick());
  }
}

const village1 = new Village(3);
const village2 = new Village(2);
const village3 = new Village(2);

export const villages = [village1, village2, village3];
