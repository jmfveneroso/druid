import {GAME_DATA, GAME_STATE, TEMP} from './data.js';
import {environments} from './environment.js';
import {run} from './main.js';
import {renderer} from './renderer.js';
import {villages} from './village.js';
import * as _ from './yaml.js';

export class Map {
  constructor() {
    this.gridSize = 4;
    this.grid = this.initializeGrid(environments);
    this.villages = this.placeVillages(villages);
    this.druidLocation = {x: 0, y: 0};  // Druid starts at the top-left corner
  }

  initializeGrid(environments) {
    let grid = [];
    for (let i = 0; i < this.gridSize; i++) {
      grid[i] = [];
      for (let j = 0; j < this.gridSize; j++) {
        // Randomly assign an environment to each grid square
        grid[i][j] = [
          environments[Math.floor(Math.random() * environments.length)],
          undefined
        ];
      }
    }
    return grid;
  }

  placeVillages(villages) {
    let corners = [
      {x: 0, y: 0},
      {x: 0, y: this.gridSize - 1},
      {x: this.gridSize - 1, y: 0},
      {x: this.gridSize - 1, y: this.gridSize - 1},
    ];

    for (let i = 0; i < villages.length; i++) {
      let village = villages[i];

      let corner = corners[i];
      let x = corner.x;
      let y = corner.y;

      this.grid[x][y][1] = village;

      village.location = {x: x, y: y};

      const xVillage = Math.floor(Math.random() * 5);
      const yVillage = Math.floor(Math.random() * 2);
      village.displayLoc = {x: xVillage, y: yVillage};
    }
  }

  moveDruid(newX, newY) {
    const {x, y} = this.druidLocation;
    if (Math.abs(newX - x) + Math.abs(newY - y) > 1) return false;

    this.druidLocation.x = newX;
    this.druidLocation.y = newY;
    return true;
  }

  getDruidLocation() {
    return this.grid[this.druidLocation.x][this.druidLocation.y];
  }

  isEnvironment() {
    return this.getDruidLocation()[1] === undefined;
  }

  getCurrentEnvironment() {
    return this.getDruidLocation()[0];
  }

  getCurrentVillage() {
    return this.getDruidLocation()[1];
  }
}

let the_map = new Map();

Object.assign(GAME_STATE, {
  'map_grid': the_map.grid,
});

function getTravelCost() {
  return 50;
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
    
    if (!_.useAbility(getTravelCost())) {
      _.addMessage(`You do not have enough stamina to travel.`);
      return;
    }

    GAME_STATE['druid']['position']['x'] = x;
    GAME_STATE['druid']['position']['y'] = y;
    _.addTime('6:00');
  }

  function enterVillage(village, x, y) {
    if (x != druidX || y != druidY) {
      return;
    }

    GAME_STATE['village'] = village;
    _.pushView('village');
  }

  let matrix = [];
  for (let i = 0; i < 17; i++) {
    matrix.push(['$'.repeat(29)]);
  }

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const env = grid[i][j][0];
      let envSymbol = environmentSymbols[env.name];
      const village = grid[i][j][1];

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

  data['map_fn'] = function(x, y) {
    console.log(x, y);
  };

  data['rest'] = function() {
    _.pushView('camp');
  };

  data['enter'] = function() {
    _.pushView('forest');
  };

  return data;
}

renderer.models['map'] = map;