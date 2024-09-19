import {GAME_DATA, GAME_STATE, TEMP} from './data.js';
import {environments} from './environment.js';
import {run} from './main.js';
import {Patient} from './patient.js';
import {renderer} from './renderer.js';
import * as _ from './yaml.js';

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
    return this.placeStructureBounded(':', 8, 4, 10, 5, 30, 15);
  }

  placeSquareBuilding(char, width, height, x, y, direction, fn) {
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
    this.placeStructureBounded(
        char, width, height, x, y, x + maxX, y + maxY, fn);
  }

  placeTemple(x, y, direction, fn) {
    this.placeSquareBuilding('T', 4, 3, x, y, direction, fn);
  }

  placeBlacksmith(fn) {
    this.placeStructureStrict('B', 5, 3, fn);
  }

  placeMarket(x, y, direction, fn) {
    this.placeSquareBuilding('M', 4, 2, x, y, direction, fn);
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
          x, y, 3, 2, 'H', {type: 'SELECT_VILLAGER', villager: villager});
    }
  }

  clearMiasmaPatches() {
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        if (this.grid[i][j] == '$' || this.grid[i][j] == 's') {
          this.grid[i][j] = ' ';
          this.gridFn[i][j] = undefined;
        }
      }
    }
  }

  placeMiasmaPatches(miasmaPatches) {
    this.village.miasmaPatches.forEach(patch => {
      let str = Math.ceil(patch.strength / 2) + 1;
      let [x, y] = this.getStructurePlacement(str, str);

      for (let j = y; j < y + str; j++) {
        for (let i = x; i < x + str; i++) {
          let print = (i == x + 1 || j == y + 1) || Math.random() < 0.3;
          if (print) {
            let symbol = '$';
            if (Math.random() < 0.3) {
              symbol = 's';
            }
            this.grid[j][i] = symbol;
            this.gridFn[j][i] = {type: 'MIASMA_CLICK'};
          }
        }
      }
    });
  }

  placeStructureBounded(symbol, width, height, x, y, maxX, maxY, fn) {
    let newX, newY;
    for (let i = 0; i < 100; i++) {
      newX = Math.floor(Math.random() * (maxX - x - width));
      newY = Math.floor(Math.random() * (maxY - y - height));
      if (this.canPlaceStructure(x + newX, y + newY, width, height)) {
        this.drawRect(x + newX, y + newY, width, height, symbol, fn);
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

  placeStructureStrict(symbol, width, height, fn) {
    let x, y;
    do {
      x = Math.floor(Math.random() * (this.width - width));
      y = Math.floor(Math.random() * (this.height - height));
    } while (!this.canPlaceStructureStrict(x, y, width, height));
    this.drawRect(x, y, width, height, symbol, fn);
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

  generateMap(miasmaPatches) {
    let [x, y] = this.placeCentralSquare();

    let arr = [0, 1, 2, 3];
    arr = shuffleArray(arr);

    this.placeTemple(x, y, arr[0], function() {
      _.pushView('temple');
    });
    this.placeMarket(x, y, arr[1], function() {
      _.pushView('market_buy');
    });
    this.placeBlacksmith(function() {
      _.pushView('blacksmith');
    });
    this.placeFields();
    this.placeHouses();
    this.placeMiasmaPatches(miasmaPatches);
    this.updateMap();
  }

  updateMap() {
    for (let i = 0; i < this.village.villagers.length; i++) {
      let villager = this.village.villagers[i];
      let [x, y] = villager.houseLoc;

      for (let j = 0; j < 3; j++) {
        if (villager.isDead()) {
          this.grid[y][x + j] = '±';
        } else if (villager.isCured()) {
          this.grid[y][x + j] = 'h';
        } else if (villager.isCritical()) {
          this.grid[y][x + j] = '*';
        } else if (villager.isSick()) {
          this.grid[y][x + j] = '≠';
        } else {
          this.grid[y][x + j] = 'H';
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
    let healthyVillagers = this.villagers.filter(p => !p.isSick());

    const newPatient =
        healthyVillagers[Math.floor(Math.random() * healthyVillagers.length)];

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

function getVillageMap(village, matrix) {
  function writeToMatrix(matrix, x, y, text, fn) {
    for (let i = 0; i < text.length; i++) {
      if (fn === undefined) {
        matrix[y][x + i] = text[i];
      } else {
        matrix[y][x + i] = [text[i], fn];
      }
    }
  }

  let envSymbol = '.';

  const grid = village.villageMap.grid;
  const gridFn = village.villageMap.gridFn;

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      let symbol = grid[i][j];
      if (symbol === ' ') {
        if (Math.random() < 0.05) {
          symbol = envSymbol;
        }
      }
      let fn = gridFn[i][j];
      writeToMatrix(matrix, j, i, symbol, fn);
    }
  }
}

function renderVillage() {
  let data = {};
  let village = GAME_STATE['village'];

  let matrix = [];
  for (let i = 0; i < 20; i++) {
    matrix.push(['$'.repeat(42)]);
  }

  getVillageMap(village, matrix);
  data['village_matrix'] = matrix;

  return data;
}

function marketBuy() {
  let data = {};
  data['sell'] = function() {
    _.popAndPushView('market_sell');
  };

  data['market_items'] = GAME_STATE['market']['items'];
  for (let item of data['market_items']) {
    item['q'] = _.getItemQuantity(item['name']);
    item['buy'] = function() {
      if (_.spendGold(item['value'])) {
        _.acquireItem(item, 1);
      } else {
        _.addMessage('You do not have enough gold.');
      }
    }
  }
  return data;
}

function marketSell() {
  let data = {};
  data['buy'] = function() {
    _.popAndPushView('market_buy');
  };

  data['druid_items'] = GAME_STATE['druid']['items'];
  for (let item of data['druid_items']) {
    item['sell'] = function() {
      _.earnGold(item['value']);
      _.consumeItem(item['name']);
    }
  }
  return data;
}

renderer.models['village'] = renderVillage;

renderer.models['market_buy'] = marketBuy;
renderer.models['market_sell'] = marketSell;
