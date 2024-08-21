import {printScreen} from './display.js';
import {Druid} from './druid.js';
import {environments} from './environment.js';
import {villages} from './village.js';
import {availableHerbs} from './herbs.js';

const DAYS_TO_TREAT = 0;

function getKeypress() {
  return prompt('Press any key or type something:');
}

function handleClick(druid, rowIndex, colIndex, data) {
  if (data !== undefined) {
    switch (data.type) {
      case "TOP_BAR_CLICK":
        switch (druid.gameState) {
          case "TREATING_PATIENT":
          case "PATIENT_LOG":
          case "REMOVE_MIASMA":
            druid.setState('VILLAGE');
            break;
        }
        break;
      case "MAIN_MENU_CLICK":
        let key = Object.keys(druid.mainMenuOptions)[data.pos];
        druid.setState(druid.mainMenuOptions[key]);
        break;
      case "MIASMA_CLICK":
        druid.setState('REMOVE_MIASMA');
        break;
      case "PATIENT_LFT":
        druid.updateCursorP(druid.cursorP - 1);
        break;
      case "PATIENT_RGT":
        druid.updateCursorP(druid.cursorP + 1);
        break;
      case "PATIENT_LOG":
        druid.setState('PATIENT_LOG');
        break;
      case "VILLAGE_LOG":
        druid.setState('VILLAGE_LOG');
        break;
      case "TREAT_PATIENT":
        druid.treatPatient(druid.cursorP, data.herb);
        break;
      case "LOG_CLICK":
        druid.setState('VILLAGE');
        break;
      case "GATHER":
        const env = environments[data.pos];
        druid.gatherIngredients(env);
        break;
      case "TRAVEL":
        druid.travel(data.pos);
        break;
      case "REMOVE_MIASMA":
        druid.removeMiasma();
        druid.setState('VILLAGE');
        break;
      case "COMBINE_POTIONS":
        druid.setState('POTION');
        break;
      case "SELECT_INGREDIENT":
        druid.selectHerbForCombination(data.herb);
        if (druid.selectedHerbs.length === 2) {
          druid.combinePotion();
          druid.setState('MSG');
          druid.setNextState('INVENTORY');
        }
        break;
      case "DISCARD_INGREDIENT":
        druid.discardHerb(data.herb);
        break;
      case "BACK_TO_INVENTORY":
        druid.setState('INVENTORY');
        break;
      case "POWERUP":
        data.fn();
        data.patient.powerups.splice(data.pos, 1); // Remove powerup.
        druid.setState('MSG');
        // writeToScreen(screen, x, y, str, {type: "POWERUP", patient: patient, pos: i, fn: powerupFn; });
        break;
      case "MSG":
        break;
    }
    printScreen(druid, true, handleClick);
    return;
  }

  if (druid.nextState === undefined) {
    druid.setState('VILLAGE');
  } else {
    druid.setState(druid.nextState);
    druid.nextState = undefined;
  }
  printScreen(druid, true, handleClick);
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

    printScreen(druid, isBrowser, handleClick);
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
  const {stdin: input, stdout: output} = require('process');

  readline.emitKeypressEvents(input);
  input.setRawMode(true);

  runLoop('$', false);

  input.on('keypress', (str, key) => {
    clearTerminal();
    if (str === '\r' || str === '\n') {
      str = 'ENTER';
    } else if (key === '\x1b') {
      str = 'ESC';
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
