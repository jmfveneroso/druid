import {GAME_STATE} from './data.js';
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

function createVillageMap(village, this_width = 42, this_height = 20) {
  let grid =
      Array.from({length: this_height}, () => Array(this_width).fill({value: ' '}));

  function drawRect(x, y, width, height, symbol, fn = undefined) {
    for (let i = y; i < y + height; i++) {
      for (let j = x; j < x + width; j++) {
        grid[i][j] = {'value': symbol};
        if (fn !== undefined) {
          grid[i][j]['fn'] = fn;
        }
      }
    }
  }

  function canPlaceStructure(x, y, width, height) {
    if (x < 0 || y < 0 || x + width > this_width || y + height > this_height) {
      return false;
    }

    for (let i = y; i < y + height; i++) {
      for (let j = x; j < x + width; j++) {
        if (grid[i][j].value !== ' ') return false;
      }
    }
    return true;
  }

  function canPlaceStructureStrict(x, y, width, height) {
    if (x < 1 || y < 1 || x + width >= this_width || y + height >= this_height) {
      return false;
    }

    for (let i = y; i < y + height; i++) {
      for (let j = x; j < x + width; j++) {
        for (let i2 = -1; i2 < 2; i2++) {
          for (let j2 = -1; j2 < 2; j2++) {
            if (grid[i + i2][j + j2].value !== ' ') return false;
          }
        }
      }
    }
    return true;
  }

  function getStructurePlacement(width, height) {
    let x, y;
    do {
      x = Math.floor(Math.random() * (this_width - width));
      y = Math.floor(Math.random() * (this_height - height));
    } while (!canPlaceStructureStrict(x, y, width, height));
    return [x, y];
  }

  function placeStructure(symbol, width, height) {
    let x, y;
    do {
      x = Math.floor(Math.random() * (this_width - width));
      y = Math.floor(Math.random() * (this_height - height));
    } while (!canPlaceStructure(x, y, width, height));
    drawRect(x, y, width, height, symbol);
  }

  function placeStructureStrict(symbol, width, height, fn) {
    let x, y;
    for (let i = 0; i < 100; i++) {
      x = Math.floor(Math.random() * (this_width - width));
      y = Math.floor(Math.random() * (this_height - height));
      if (canPlaceStructureStrict(x, y, width, height)) {
        drawRect(x, y, width, height, symbol, fn);
        break;
      }
    }
  }

  function placeStructureBounded(symbol, width, height, x, y, maxX, maxY, fn) {
    let newX, newY;
    for (let i = 0; i < 100; i++) {
      newX = Math.floor(Math.random() * (maxX - x - width));
      newY = Math.floor(Math.random() * (maxY - y - height));
      if (canPlaceStructure(x + newX, y + newY, width, height)) {
        drawRect(x + newX, y + newY, width, height, symbol, fn);
        break;
      }
    }
    return [x + newX, y + newY];
  }

  function placeCentralSquare() {
    return placeStructureBounded(':', 8, 4, 10, 5, 30, 15);
  }

  function placeSquareBuilding(char, width, height, x, y, direction, fn) {
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
    placeStructureBounded(char, width, height, x, y, x + maxX, y + maxY, fn);
  }

  function placeTemple(x, y, direction, fn) {
    placeSquareBuilding('T', 4, 3, x, y, direction, fn);
  }

  function placeBlacksmith(fn) {
    placeStructureStrict('B', 5, 3, fn);
  }

  function placeMarket(x, y, direction, fn) {
    placeSquareBuilding('M', 4, 2, x, y, direction, fn);
  }

  function placeFields() {
    const numFields = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numFields; i++) {
      const w = Math.floor(Math.random() * 4) + 5;
      const h = Math.floor(Math.random() * 3) + 4;
      placeStructureStrict('"', w, h, true);
    }
  }

  function placeHouses() {
    for (let i = 0; i < village.villagers.length; i++) {
      let [x, y] = getStructurePlacement(3, 2);
      drawRect(x, y, 3, 2, 'H', 'house_' + i);
    }
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];  // Swap elements
    }
    return array;
  }

  let [x, y] = placeCentralSquare();

  let arr = [0, 1, 2, 3];
  arr = shuffleArray(arr);

  placeTemple(x, y, arr[0], 'temple');
  placeMarket(x, y, arr[1], 'market_sell');
  placeBlacksmith('blacksmith');
  placeFields();
  placeHouses();
  return grid;
}

function createVillage() {
  function generateRandomName() {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  }

  function generateRandomVillageName() {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix}${suffix}`;
  }

  let village = {};
  village['name'] = generateRandomVillageName();
  village['villagers'] = [];

  for (let i = 0; i < 10; i++) {
    const name = generateRandomName();
    village['villagers'].push(name);
  }

  village['village_map'] = createVillageMap(village, 42, 20);
  return village;
}

const village1 = createVillage();
const village2 = createVillage();
const village3 = createVillage();

GAME_STATE['villages'] = [village1, village2, village3];

// VIEWS.

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

  const grid = village['village_map'];

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      let symbol = grid[i][j].value;
      if (symbol === ' ') {
        if (Math.random() < 0.05) {
          symbol = envSymbol;
        }
      }
      let fn = function() {
        let fn_name = grid[i][j].fn;
        if (fn_name.startsWith('house')) {
          let index = fn_name.substr(6);
          GAME_STATE['current_house'] = index;
          _.pushView('house');
          return;
        }
        _.pushView(fn_name);
      };
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

  data['market_items'] = [];
  for (let item of GAME_STATE['market']['items']) {
    item = _.getItemData(item.name);
    item['q'] = _.getItemQuantity(item.name);
    item['buy'] = function() {
      if (_.spendGold(item['value'])) {
        _.acquireItem(item.name, 1);
      } else {
        _.addMessage('You do not have enough gold.');
      }
    };
    data['market_items'].push(item);
  }
  return data;
}

function marketSell() {
  let data = {};
  data['buy'] = function() {
    _.popAndPushView('market_buy');
  };

  data['druid_items'] = [];
  for (let item of GAME_STATE['druid']['items']) {
    item = _.getItemData(item['name']);
    item['q'] = _.getItemQuantity(item.name);
    item['sell'] = function() {
      _.earnGold(item['value']);
      _.consumeItem(item['name']);
    };
    data['druid_items'].push(item);
  }
  return data;
}

function house() {
  let data = {};
  
  let village = GAME_STATE['village'];
  let index = GAME_STATE['current_house'];
  let villager = village.villagers[index];

  data['villager_name'] = villager;

  return data;
}

function blacksmith() {
  let data = {};

  data['blacksmith_items'] = [];
  for (let item of GAME_STATE['blacksmith_items']) {
    item = _.getItemData(item['name']);
    item['q'] = _.getItemQuantity(item.name);
    item['buy'] = function() {
      if (_.spendGold(item['value'])) {
        _.acquireItem(item.name, 1);
      } else {
        _.addMessage('You do not have enough gold.');
      }
    };
    data['blacksmith_items'].push(item);
  }
  return data;
}

function temple() {
  let data = {};

  data['heal'] = function () {
    if (_.spendGold(100)) {
      GAME_STATE['druid']['hp'] = GAME_STATE['druid']['max_hp'];
      GAME_STATE['druid']['food'] = GAME_STATE['druid']['max_food'];
    } else {
      _.addMessage('You do not have enough gold.');
    }
  };
  
  data['rest'] = function () {
    if (_.spendGold(25)) {
      _.rest(false, 100);
    } else {
      _.addMessage('You do not have enough gold.');
    }
  };
 
  let level_cost = GAME_STATE['druid']['level'] * 50;
  data['lvlc'] = level_cost;
  data['gain_level'] = function () {
    if (_.spendGold(level_cost)) {
      GAME_STATE['druid']['level'] += 1;
      GAME_STATE['druid']['max_hp'] += 2;
      GAME_STATE['druid']['hp'] += 2;
      GAME_STATE['druid']['skill_points'] += 5;
    } else {
      _.addMessage('You do not have enough gold.');
    }
  };

  return data;
}

renderer.models['village'] = renderVillage;
renderer.models['market_buy'] = marketBuy;
renderer.models['market_sell'] = marketSell;
renderer.models['house'] = house;
renderer.models['blacksmith'] = blacksmith;
renderer.models['temple'] = temple;
