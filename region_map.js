import {GAME_STATE, readTemp, timeToFloat, writeTemp} from './data.js';
import {utils} from './general.js';
import {renderer, run} from './renderer.js';
import * as _villages from './village.js';

const square_size = 1;

const locations = {
  'regular': 50,
  'animal_den': 15,
  'npc': 12,
  'animal_drinking_spot': 11,
  'cave': 10,
  'fruit_grove': 9,
  'abandoned_campsite': 8,
  'herb_patch': 7,
  'trap': 6,
  'ruins': 5,
  'wolf_den': 5,
  'watchtower': 4,
  'hot_springs': 3,
  'goblin_camp': 3,
  'fey_crossing': 2,
  'lizard_grotto': 2
};

function getRandomLocation() {
  let totalOdds = 0;
  for (const location in locations) {
    totalOdds += locations[location];
  }
  const randomNumber = Math.floor(Math.random() * totalOdds) + 1;
  let cumulativeOdds = 0;
  for (const location in locations) {
    cumulativeOdds += locations[location];
    if (randomNumber <= cumulativeOdds) {
      return location;
    }
  }
  return null;
}

function getCampingQuality() {
  return utils.rollD(100);
}

function getDiseaseLevel() {
  return utils.rollD(100);
}

function hasHerbs() {
  return utils.rollD(5) == 5;
}

function hasTracks() {
  return utils.rollD(5) == 5;
}

export function createRegionMap() {
  function initializeGrid() {
    let grid = [];
    for (let i = 0; i < 32; i++) {
      grid[i] = [];
      for (let j = 0; j < 18; j++) {
        grid[i][j] = {
          'type': getRandomLocation(),
          'quality': getCampingQuality(),
          'disease': getDiseaseLevel(),
          'has_herbs': hasHerbs(),
          'tracks': [],
          'tracks_expire': 0,
          'has_tracks': hasTracks(),
          'monster': undefined,
          'explored': false,
        };
      }
    }
    return grid;
  }

  return initializeGrid();
}

function getCurrentRegionMap() {
  const map_grid = GAME_STATE['map_grid'];
  const druidMacroX = GAME_STATE['druid']['position']['x'];
  const druidMacroY = GAME_STATE['druid']['position']['y'];

  return map_grid[druidMacroX][druidMacroY]['region_map'];
}

function getSelectedSquare() {
  const grid = getCurrentRegionMap();
  return grid[GAME_STATE['selected_square']['x']][GAME_STATE['selected_square']
                                                            ['y']];
}

export function getCurrentSquare() {
  const grid = getCurrentRegionMap();

  const druidX = GAME_STATE['druid']['region_position']['x'];
  const druidY = GAME_STATE['druid']['region_position']['y'];
  return grid[druidX][druidY];
}

function updateSquare() {
  let square = getCurrentSquare();

  square.explored = true;

  if (square.tracks.length == 0 && square.has_tracks &&
        square.tracks_expire < timeToFloat(GAME_STATE['hours'])) {
    square.tracks = utils.getTrackableAnimals();
    square.tracks_expire = timeToFloat(GAME_STATE['hours']) + 24;
  }
}

function selectSquare(x, y) {
  GAME_STATE['selected_square'] = {
    'x': x,
    'y': y,
  };
}

function moveDruid(x, y) {
  if (x < 0 || y < 0 || x >= 32 || y >= 18) {
    return;
  }
  console.log(x, y);

  GAME_STATE['druid']['region_position']['x'] = x;
  GAME_STATE['druid']['region_position']['y'] = y;

  updateSquare(x, y);
  GAME_STATE['selected_square'] = undefined;

  if (utils.isOverweight()) {
    utils.addMessage(`You are overweight.`);
    return;
  }

  if (!utils.useAbility(1)) {
    utils.addMessage(`You do not have enough stamina to travel.`);
    return;
  }

  if (utils.roll(0.02)) {
    utils.pushView('battle');
    return;
  }

  utils.addTime('0:10');
}

function getRegionMapMatrix() {
  function writeToMatrix(matrix, x, y, text, fn) {
    // console.log(x, y, text);
    for (let i = 0; i < text.length; i++) {
      if (matrix[y][x + i] === undefined) {
        console.log('undefined');
        continue;
      }

      if (fn === undefined) {
        matrix[y][x + i] = text[i];
      } else {
        matrix[y][x + i] = [text[i], fn];
      }
    }
  }

  function getSymbol(square) {
    if (!square.explored) return '#';
    if (square.tracks.length > 0) return '&';
    if (square.has_herbs) return 'o';
    return '.';
  }

  const map_grid = GAME_STATE['map_grid'];
  const druidMacroX = GAME_STATE['druid']['position']['x'];
  const druidMacroY = GAME_STATE['druid']['position']['y'];

  const grid = map_grid[druidMacroX][druidMacroY]['region_map'];

  const druidX = GAME_STATE['druid']['region_position']['x'];
  const druidY = GAME_STATE['druid']['region_position']['y'];

  let matrix = [];
  for (let i = 0; i < 18; i++) {
    matrix.push([]);
    for (let j = 0; j < 32; j++) {
      matrix[i].push(['#', function() {}]);
    }
  }

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      let symbol = getSymbol(grid[i][j]);

      // const village_index = grid[i][j]['village'];
      // const village = GAME_STATE['villages'][village_index];

      const druidHere = (i === druidX && j === druidY);
      if (druidHere) {
        symbol = '@';
      }

      // writeToMatrix(matrix, j * 7, i * 4, `+------+`);

      for (let m = 0; m < square_size; m++) {
        for (let n = 0; n < square_size; n++) {
          writeToMatrix(
              matrix, i * square_size + m, j * square_size + n, symbol,
              function() {
                selectSquare(i, j);
              });
        }
      }

      // if (druidHere) {
      //   let xDruid = Math.floor(Math.random() * 6);
      //   let yDruid = Math.floor(Math.random() * 3);
      //   do {
      //     xDruid = Math.floor(Math.random() * 6);
      //     yDruid = Math.floor(Math.random() * 3);
      //   } while (xDruid === xVillage && yDruid === yVillage);
      //   writeToMatrix(matrix, j * 7 + xDruid + 1, i * 4 + 1 + yDruid, '@');
      // }

      // writeToMatrix(matrix, j * 7, i * 4 + 4, `+------+`);
    }
  }
  return matrix;
}

utils.setChasing = function(duration, message, hours, fn) {
  GAME_STATE['loading_bar'] = '';
  GAME_STATE['loading_bar_message'] = message;
  GAME_STATE['loading_fn'] = fn;
  GAME_STATE['loading_bar_duration'] = duration;
  GAME_STATE['loading_bar_hours'] = hours;
  GAME_STATE['loading_bar_initial_hour'] = GAME_STATE['hours'];
  GAME_STATE['show_leave'] = false;
  GAME_STATE['chasing'] = true;

  utils.pushView('region_map');
};

// =============================================================================
// UPDATERS
// =============================================================================

renderer.updaters['region_hourly'] = {
  period: 1,
  fn: function() {
    const grid = getCurrentRegionMap();
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        let square = grid[i][j];
        if (square.tracks_expire < timeToFloat(GAME_STATE['hours'])) {
          square.tracks = [];
        }
      }
    }
  }
};

// =============================================================================
// TEMPLATES
// =============================================================================

export function chasing() {
  const total_size = 10;
  if (utils.rollD(2) == 2) {
    GAME_STATE['loading_bar'] += '=';
    let progress = GAME_STATE['loading_bar'].length / total_size;

    let current_hour = timeToFloat(GAME_STATE['loading_bar_initial_hour']);
    let hour_increment = timeToFloat(GAME_STATE['loading_bar_hours']);

    const druidX = GAME_STATE['druid']['region_position']['x'];
    const druidY = GAME_STATE['druid']['region_position']['y'];

    let dir_x = GAME_STATE['chasing_goal'].x - druidX;
    let dir_y = GAME_STATE['chasing_goal'].y - druidY;

    let dir = {
      'x': (dir_x > 0) ? 1 : -1,
      'y': (dir_y > 0) ? 1 : -1,
    };
    if (utils.rollD(2) == 1) {
      moveDruid(druidX, druidY + dir.y);
    } else {
      moveDruid(druidX + dir.x, druidY);
    }

    // GAME_STATE['hours'] = new_hour;
    if (progress >= 0.99) {
      utils.popView();
      GAME_STATE['show_leave'] = true;
      // new_hour = utils.addTime2(
      //     GAME_STATE['loading_bar_initial_hour'],
      //     GAME_STATE['loading_bar_hours']);
      // if (!utils.setTime(new_hour)) {
      //   return {};
      // }
      utils.popView();
      GAME_STATE['chasing'] = false;
      GAME_STATE['loading_fn']();
      run();
      return {};
    }
  }

  clearTimeout(GAME_STATE['refresh']);
  GAME_STATE['refresh'] = setTimeout(function() {
    run();
  }, GAME_STATE['loading_bar_duration'] / total_size);

  return {};
}

export function region_map() {
  let data = {};
  
  if (GAME_STATE['chasing']) {
    chasing();
  }

  data['on_start'] = function() {
    updateSquare();
  };

  data['region_map_matrix'] = getRegionMapMatrix();

  data['rest'] = function() {
    // utils.pushView('camp');
  };

  data['enter'] = function() {
    utils.pushView('forest');
  };

  if (GAME_STATE['selected_square']) {
    data['square'] = getSelectedSquare();
  } else {
    data['square'] = getCurrentSquare();
  }
  data['tracks'] = data['square']['tracks'].reverse().join(', ');

  const druidX = GAME_STATE['druid']['region_position']['x'];
  const druidY = GAME_STATE['druid']['region_position']['y'];

  data['move_up'] = function() {
    moveDruid(druidX, druidY - 1);
  };

  data['move_right'] = function() {
    moveDruid(druidX + 1, druidY);
  };

  data['move_down'] = function() {
    moveDruid(druidX, druidY + 1);
  };

  data['move_left'] = function() {
    moveDruid(druidX - 1, druidY);
  };

  return data;
}

renderer.models['region_map'] = region_map;
