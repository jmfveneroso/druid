import {printScreen} from './display.js';
import {Druid} from './druid.js';
import {environments} from './environment.js';

function handleClick(druid, data) {
  if (data !== undefined) {
    switch (data.type) {
      case "TOP_BAR_CLICK":
        druid.increaseTheoreticalDays(+100);
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
        druid.setNextState('VILLAGE');
        break;
      case "VILLAGE_LOG":
        druid.setState('VILLAGE_LOG');
        druid.setNextState('VILLAGE');
        break;
      case "TREAT_PATIENT":
        druid.treatPatient(druid.cursorP, data.herb);
        break;
      case "LOG_CLICK":
        druid.setState('VILLAGE');
        break;
      case "MOVE_LOG_UP":
        druid.moveLog(-10, data.maxLen);
        break;
      case "MOVE_LOG_DOWN":
        druid.moveLog(10, data.maxLen);
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
          druid.setNextState('POTION');
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
        break;
      case "DECREASE_THEORETICAL_DAYS":
        druid.increaseTheoreticalDays(-1);
        break;
      case "INCREASE_THEORETICAL_DAYS":
        druid.increaseTheoreticalDays(1);
        break;
      case "MOVE_DRUID":
        druid.move(data.to.x, data.to.y);
        break;
      case "MSG":
        break;
    }
    printScreen(druid, true, handleClick);
    return;
  }

  if (druid.nextState === undefined) {
    if (druid.gameState === 'MAP') {
      druid.setState('VILLAGE');
    } else {
      druid.setState('MAP');
    }
  } else {
    druid.setState(druid.nextState);
    druid.nextState = undefined;
  }
  printScreen(druid, true, handleClick);
}

if (typeof window !== 'undefined') {
  const druid = new Druid();
  printScreen(druid, true, handleClick);
}
