import {GAME_STATE, loader} from './data.js';
import {environments} from './environment.js';
import {renderer} from './renderer.js';
import * as _villages from './village.js';
import * as _ from './yaml.js';

const envTypes = ['Lake', 'Forest', 'Swamp', 'Mountain'];

function createEnvironment(envType) {
  let frequencies = [ 'none', 'sparse', 'moderate', 'plentiful' ];
  
  let env = {
    'type': envType,
    'animals': {},
  };

  for (let animal of GAME_STATE['animals']) {
    let dc = animal['frequency']['dc'];

    let roll = _.rollD(20);

    // Apply bonus;
    let frequency = animal['frequency']['base'];
    if (roll - dc >= 5) {
      frequency++;
    } else if (roll - dc <= -5) {
      frequency--;
    }

    env['animals'][animal['name']] = {
      'frequency': frequencies[frequency],
      'has_special': 1,
    };
  }
  
  return env;
}

function createMap(gridSize = 4) {
  function initializeGrid(environments) {
    let grid = [];
    for (let i = 0; i < gridSize; i++) {
      grid[i] = [];
      for (let j = 0; j < gridSize; j++) {
        let envType = Math.max(3 - i, 3 - j);
        grid[i][j] = {'environment': createEnvironment(envTypes[envType])};
      }
    }
    return grid;
  }

  function placeVillages(villages, grid) {
    let corners = [
      {x: 0, y: gridSize - 1},
      {x: gridSize - 1, y: 0},
      {x: gridSize - 1, y: gridSize - 1},
    ];

    for (let i = 0; i < villages.length; i++) {
      let village = villages[i];
      let corner = corners[i];
      let x = corner.x;
      let y = corner.y;

      grid[x][y]['village'] = i;

      village.location = {x: x, y: y};

      const xVillage = Math.floor(Math.random() * 5);
      const yVillage = Math.floor(Math.random() * 2);
      village.displayLoc = {x: xVillage, y: yVillage};
    }
    return grid;
  }

  let grid = initializeGrid(environments);
  grid = placeVillages(GAME_STATE['villages'], grid);
  return grid;
}

GAME_STATE['map_grid'] = createMap();

function getTravelCost() {
  return 10;
}

function enterVillage(village, x, y) {
  const druidX = GAME_STATE['druid']['position']['x'];
  const druidY = GAME_STATE['druid']['position']['y'];
  if (x != druidX || y != druidY) {
    return;
  }

  GAME_STATE['village'] = village;
  _.pushView('village');
}

function getMapMatrix() {
  function writeToMatrix(matrix, x, y, text, fn) {
    for (let i = 0; i < text.length; i++) {
      if (fn === undefined) {
        matrix[y][x + i] = text[i];
      } else {
        matrix[y][x + i] = [text[i], fn];
      }
    }
  }

  const environmentSymbols = {
    'Forest': '!',    // Trees for Forest
    'Swamp': '~',     // Water for Swamp
    'Mountain': '^',  // Mountain for Mountain
    'Lake': '-',      // Water for Lake
  };

  const grid = GAME_STATE['map_grid'];
  const druidX = GAME_STATE['druid']['position']['x'];
  const druidY = GAME_STATE['druid']['position']['y'];

  function moveDruid(x, y) {
    if ((x == druidX && y == druidY) ||
        (Math.abs(x - druidX) + Math.abs(y - druidY) > 1)) {
      return;
    }

    if (_.isOverweight()) {
      _.addMessage(`You are overweight.`);
      return;
    }

    if (!_.useAbility(getTravelCost())) {
      _.addMessage(`You do not have enough stamina to travel.`);
      return;
    }

    GAME_STATE['druid']['position']['x'] = x;
    GAME_STATE['druid']['position']['y'] = y;
    _.addTime('6:00');
  }

  let matrix = [];
  for (let i = 0; i < 17; i++) {
    matrix.push(['$'.repeat(29)]);
  }

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const env = grid[i][j]['environment'];

      const env_name = env['type'];
      let envSymbol = environmentSymbols[env_name];

      const village_index = grid[i][j]['village'];
      const village = GAME_STATE['villages'][village_index];

      const druidHere = (i === druidX && j === druidY);

      writeToMatrix(matrix, j * 7, i * 4, `+------+`);

      for (let k = 0; k < 3; k++) {
        let content = `${envSymbol}`.repeat(6);
        let row = `|${content}|`;

        writeToMatrix(matrix, j * 7, i * 4 + k + 1, row, function() {
          moveDruid(i, j);
        });
      }

      let xVillage = 0;
      let yVillage = 0;
      if (village !== undefined) {
        xVillage = village.displayLoc.x;
        yVillage = village.displayLoc.y;
        for (let m = 0; m < 2; m++) {
          for (let n = 0; n < 2; n++) {
            writeToMatrix(
                matrix, j * 7 + village.displayLoc.x + 1 + m,
                i * 4 + 1 + village.displayLoc.y + n, 'V', function() {
                  enterVillage(village, i, j);
                });
          }
        }
      }

      if (druidHere) {
        let xDruid = Math.floor(Math.random() * 6);
        let yDruid = Math.floor(Math.random() * 3);
        do {
          xDruid = Math.floor(Math.random() * 6);
          yDruid = Math.floor(Math.random() * 3);
        } while (xDruid === xVillage && yDruid === yVillage);
        writeToMatrix(matrix, j * 7 + xDruid + 1, i * 4 + 1 + yDruid, '@');
      }

      writeToMatrix(matrix, j * 7, i * 4 + 4, `+------+`);
    }
  }
  return matrix;
}

export function map() {
  let data = {};

  data['map_matrix'] = getMapMatrix();

  data['rest'] = function() {
    _.pushView('camp');
  };

  data['enter'] = function() {
    const grid = GAME_STATE['map_grid'];
    const i = GAME_STATE['druid']['position']['x'];
    const j = GAME_STATE['druid']['position']['y'];

    const village_index = grid[i][j]['village'];
    if (village_index !== undefined) {
      const village = GAME_STATE['villages'][village_index];
      enterVillage(village, i, j);
    } else {
      _.pushView('forest');
    }
  };

  return data;
}

renderer.models['map'] = map;