import {printScreen} from './display.js';
import {Druid} from './druid.js';
import {environments} from './environment.js';

function handleClick(druid, data, row, col) {
  if (data !== undefined) {
    switch (data.type) {
      case "TOP_BAR_CLICK":
        druid.increaseTheoreticalDays(+100);
        break;
      case "MAIN_MENU_CLICK":
        let key = Object.keys(druid.mainMenuOptions)[data.pos];
        if (data.pos == 2) {
          console.log(druid.gameState);
          druid.setNextState(druid.gameState);
        }
        druid.setState(druid.mainMenuOptions[key]);
        break;
      case "MIASMA_CLICK":
        druid.setState('REMOVE_MIASMA');
        druid.setNextState('VILLAGE_MAP');
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
        // const env = environments[data.pos];
        // druid.gatherIngredients(env);
        const env = environments[data.pos];
        druid.startHotCold(env);
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
      case "ENTER_VILLAGE":
        druid.enterVillage(data.village);
        break;
      case "SELECT_VILLAGER":
        druid.selectVillager(data.villager);
        break;
      case "MOVE_UP_HOT_COLD":
        druid.game.move("up", druid);
        break;
      case "MOVE_LEFT_HOT_COLD":
        druid.game.move("left", druid);
        break;
      case "MOVE_RIGHT_HOT_COLD":
        druid.game.move("right", druid);
        break;
      case "MOVE_DOWN_HOT_COLD":
        druid.game.move("down", druid);
        break;
      case "DIG_HOT_COLD":
        druid.game.dig(druid);
        break;
      case "WHISPER_HOT_COLD":
        druid.game.whisperOfNature();
        break;
      case "FINISH_HOT_COLD":
        druid.game.stamina = 0;
        druid.state = "MAP";
        break;
      case "HUNT_TRACK":
        druid.hunt.track(data.animal);
        break;
      case "HUNT_SNEAK":
        druid.hunt.sneak();
        break;
      case "HUNT_SHOOT":
        druid.hunt.shoot();
        break;
      case "MSG":
        break;
      case "FN":
        data.fn(row, col);
        break;
    }
    printScreen(druid, true, handleClick);
    return;
  }

  druid.setState('HUNT');
  printScreen(druid, true, handleClick);
}

const druid = new Druid();
if (typeof window !== 'undefined') {
  printScreen(druid, true, handleClick);
}

export function run() {
  printScreen(druid, true, handleClick);
}
