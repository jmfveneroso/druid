import * as views from './views.js';
import {GAME_STATE} from './data.js';
import {renderer} from './renderer.js';
import * as hunt from './hunt.js';

function createScreen(width, height) {
  return Array.from({length: height}, () => Array(width).fill(' '));
}

function renderScreen(druid, screen, isBrowser, handleClick) {
  if (isBrowser) {
    const gameConsole = document.getElementById('game-console');
    gameConsole.innerHTML = '';  // Clear previous screen

    screen.forEach((row, rowIndex) => {
      const rowElement = document.createElement('div');
      rowElement.className = 'row';

      row.forEach((char_and_fn, colIndex) => {
        let char = char_and_fn[0];
        let fn = char_and_fn[1];

        const charElement = document.createElement('div');
        charElement.className = 'col';
        charElement.textContent = char;

        charElement.setAttribute('data-row', rowIndex);
        charElement.setAttribute('data-col', colIndex);

        charElement.addEventListener('click', function() {
          handleClick(druid, fn);
        });

        charElement.addEventListener('mouseover', function() {
          // handleClick(druid, fn);
        });

        rowElement.appendChild(charElement);
      });

      gameConsole.appendChild(rowElement);
    });
  } else {
    const {execSync} = require('child_process');
    execSync('clear', {stdio: 'inherit'});

    for (let row of screen) {
      console.log(row.join(''));
    }
  }
}

export function printScreen(druid, isBrowser, handleClick) {
  const screen = createScreen(views.SCREEN_WIDTH, views.SCREEN_HEIGHT);

  // views.displayScore(druid, screen, 1, 1);
  console.log(druid.gameState);

  let lft = 1;
  let top = 1;
  switch (druid.gameState) {
    case 'CHOOSE_ENVIRONMENT':
      views.displayEnvironments(druid, screen, lft, top);
      break;
    case 'TRAVELLING':
      views.displayVillages(druid, screen, lft, top);
      break;
    case 'VILLAGE':
      views.displayPatients(druid, screen, lft, top);
      break;
    case 'TREATING_PATIENT':
      views.displayInventory(druid, screen, lft, top);
      break;
    case 'POTION':
      views.displayInventory(druid, screen, lft, top, true, true);
      break;
    case 'REMOVE_MIASMA':
      views.displayMiasmaPatches(druid, screen, lft, top);
      break;
    case 'INVENTORY':
      views.displayInventory(druid, screen, lft, top);
      break;
    case 'PATIENT_LOG':
      views.displayPatientLog(druid, screen, lft, top);
      break;
    case 'VILLAGE_LOG':
      views.displayVillageLog(druid, screen, lft, top);
      break;
    case 'MSG':
      views.displayMessages(druid, screen, lft, top);
      break;
    case 'MAP':
      views.displayMap(druid, screen, lft, top);
      break;
    case 'VILLAGE_MAP':
      views.displayVillageMap(druid, screen, lft, top);
      break;
    case 'HOT_COLD':
      views.displayHotCold(druid, screen, lft, top);
      break;
    case 'HUNT':
      renderer.counter = 0;
      renderer.renderTemplate(screen, lft, top, GAME_STATE["view"]);
      break;
    default:
      break;
  }

  renderScreen(druid, screen, isBrowser, handleClick);
}
