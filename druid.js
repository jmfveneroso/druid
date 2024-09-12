import {HerbGathering} from './gather.js';
import {availableHerbs, herbMap, updateHerbMap} from './herbs.js';
import {Map} from './map.js';
import {Patient} from './patient.js';
import {Potion} from './potion.js';
import {villages} from './village.js';
import {HerbGatheringGame} from './hotcold.js';

const MOURNING_DURATION = 4;
const RUNE_DISCOVERY_CHANCE = 0.5;
const DAYS_TO_GATHER = 1;
const DAYS_TO_TRAVEL = 2;
const DAYS_TO_REMOVE_MIASMA = 3;

const complementaryRunes = {
  'A': 'B',
  'B': 'A',
  'C': 'D',
  'D': 'C'
};

export class Druid {
  constructor() {
    this.herbGathering = new HerbGathering();

    this.mourning = 0;
    this.days = 1;
    this.theoreticalDays = 1;
    this.gameState = 'MAIN';
    this.setState('MAIN');
    this.msg = ['Welcome to The Druid Game!'];
    this.cursor = 0;
    this.cursorP = 0;
    this.cursorMiasma = 0;
    this.windowP = 0;
    this.windowPSize = 1;
    this.cursorMain = 0;
    this.cursorE = 0;
    this.cursorVillage = 0;
    this.selectedVillage = 0;
    this.selectedHerbs = [];  // Herbs selected for combination
    this.usedPotions = [];
    this.crystals = 0;
    this.combinationMap = {};
    this.initCombinationMap();
    this.mainMenuOptions = {
      '(I)nventory': 'POTION',
      '(G)ather': 'CHOOSE_ENVIRONMENT',
      '(W)ait': 'WAIT',
      // "druid": "DRUID",
    };
    this.logStartAt = 0;
    this.map = new Map();
    this.lastEnvironment = undefined;

    
    // Druid leveling system
    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = 100;  // XP needed to level up
    this.maxDrugs = 2;
    this.gold = 100;
    this.stamina = 100;
  }

  discardHerb(herbName) {
    this.herbGathering.useHerb(herbName);
  }

  knowsHerbEffect(herbName) {
    return herbMap[herbName].known;
  }

  discoverHerbEffect(herbName) {
    if (!this.knowsHerbEffect(herbName)) {
      herbMap[herbName].known = true;
      this.msg.push(`You unveiled ${herbName}.`);
      this.msg.push(`${herbMap[herbName].effectDescription}`);
    } else {
      this.msg.push(`The effect was already known.`);
    }

    if (Math.random() < RUNE_DISCOVERY_CHANCE) {
      const i = Math.floor(Math.random() * 3);
      this.revealRune(herbName, i);
    }
  }

  gatherIngredients(env) {
    this.clearMsgs();

    let gatheredHerbs = this.herbGathering.gather(env);
    let totalHerbs = this.herbGathering.getTotal();
    this.writeMsg(`Gathered herbs in the ${env.name}.`);
    this.progressGameForDays(DAYS_TO_GATHER);
    this.writeMsg(`${DAYS_TO_GATHER} days have passed.`);
    this.writeMsg('');
    for (let h of gatheredHerbs) {
      let total = this.herbGathering.inventory[h];
      let desc = herbMap[h].known ? herbMap[h].effectDescription : "???";
      this.writeMsg(`+1 ${h} (total: ${total})`);
      this.writeMsg(`  -> ${desc}`);
    }
    this.writeMsg('');
    this.writeMsg(`Total ingredients: ${totalHerbs}`);
    this.setState('MSG');
    this.setNextState('MAP');
  }

  travel(pos) {
    const village = villages[pos];
    this.clearMsgs();
    this.selectedVillage = pos;
    this.writeMsg(`Travelled to ${village.name}.`);
    this.progressGameForDays(DAYS_TO_TRAVEL);
    this.writeMsg(`${DAYS_TO_TRAVEL} days have passed.`);
    this.setState('MSG');
  }

  revealRune(herbName) {
    for (let i = 0; i < 3; i++) {
      if (herbMap[herbName].revealedRunes[i] == '*') {
        herbMap[herbName].revealedRunes[i] = herbMap[herbName].runes[i];
        break;
      }
    }
  }

  treatPatient(patientId, herbName) {
    const patient = this.currentVillage().getPatients()[patientId];
    patient.treatPatient(herbName, this);
    this.revealRune(herbName);
  }

  progressGame() {
    villages.forEach(v => v.progress(this));

    villages.forEach(v => {
      v.villagers.forEach(patient => {
        if (patient.isSick() && !patient.dead && !patient.cured) {
          patient.progress(this, this.days);
        }

        if (patient.isDead() && patient.dead === false) {
          patient.dead = true;
          this.mourning += MOURNING_DURATION;
          this.msg.push(`Patient ${patient.id} in ${v.name} has died.`);
          const patch = v.createMiasmaPatch();
          patch.increaseStrength();
          patient.powerups.push([
            `Death`,
            () => {
              // v.villagers = v.villagers.filter(p => p !== patient);
              v.deadCount += 1;
            }
          ]);
          patient.logMsg(`${patient.id} has died!`);
          v.logMsg(`${patient.id} has died!`);
          v.logMsg(`A new miasma patch has formed at ${patch.location}.`);
        } else if (patient.isCured() && patient.cured === false) {
          patient.cured = true;
          let druid = this;
          patient.logMsg(`${patient.id} is cured!`);
          v.logMsg(`Patient ${patient.id} in ${
              v.name} is cured. You gained a crystal.`);
          patient.powerups.push([
            `Crystal`,
            () => {
              v.curedCount += 1;
              druid.crystals += 1;
            }
          ]);
          if (!patient.disease.diseaseType.known) {
            patient.disease.diseaseType.known = true;
            const dName = patient.disease.diseaseType.name;
            this.msg.push(`Discovered disease ${dName}`);
          }
          this.gainXp(50);  // Example amount of XP gained per cured patient
        }
      });
    
      villages.forEach(v => {
        v.villageMap.updateMap();
      });
    });

    this.herbGathering.progress();
    this.days += 1;
    this.theoreticalDays = this.days;
    return true;
  }

  progressGameForDays(days) {
    for (let i = 0; i < days; i++) {
      if (!this.progressGame()) {
        return false;
      }
    }
    return true;
  }

  setNextState(newState) {
    this.nextState = newState;
  }

  setState(newState) {
    this.gameState = newState;
    switch (newState) {
      case 'MAIN':
        this.selectedHerbs = [];
        break;
      case 'CHOOSE_ENVIRONMENT':
        break;
      case 'REMOVE_MIASMA':
        break;
      case 'TREATING_PATIENT':
        break;
      case 'VILLAGE':
        break;
      case 'TRAVELLING':
        break;
      case 'MSG':
        this.logStartAt = 0;
        break;
      case 'WAIT':
        this.progressGame();
        this.setState(this.nextState);
        break;
      default:
        if (['TREATING', 'DISCOVERING', 'SELECT_POTION'].includes(newState)) {
          // this.cursor = 0;
        }
        break;
    }
  }

  currentVillage() {
    return this.map.getCurrentVillage();
  }

  combinePotion() {
    this.clearMsgs();

    if (this.selectedHerbs.length >= 2) {
      const [herbName1, herbName2] = this.selectedHerbs;
      if (!this.herbGathering.useTwoHerbs(herbName1, herbName2)) {
        this.msg.push('Not enough herbs to combine.');
        return;
      }

      this.revealRune(herbName1);
      this.revealRune(herbName2);

      const potion = new Potion(this.selectedHerbs, this.combinationMap);
      if (potion.isSuccessful()) {
        const newHerb = potion.getNewHerb();
        this.herbGathering.inventory[newHerb] += 1;
        this.msg.push(`Potion successful! Created: ${newHerb}`);
        this.discoverHerbEffect(newHerb);
      } else {
        this.msg.push('Potion combination failed!');
      }
    } else {
      this.msg.push('Select at least two herbs to combine.');
    }

    this.selectedHerbs = [];
  }

  selectHerbForCombination(herb) {
    if (this.selectedHerbs.includes(herb)) {
      this.selectedHerbs = this.selectedHerbs.filter(h => h !== herb);
    } else {
      this.selectedHerbs.push(herb);
    }
  }

  gainXp(amount) {
    this.xp += amount;
    if (this.xp >= this.xpToNextLevel) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level += 1;
    this.xp -= this.xpToNextLevel;
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
    this.msg.push(`Congratulations! You have reached Level ${this.level}.`);
  }

  removeMiasma() {
    if (this.crystals <= 0) {
      return;
    }
    this.crystals -= 1;

    const patch = this.currentVillage().miasmaPatches[this.cursorMiasma];
    patch.decreaseStrength();

    this.writeMsg(`Performed ritual in the miasma patch in ${patch.location}.`);
    this.progressGameForDays(DAYS_TO_REMOVE_MIASMA);
    this.writeMsg(`${DAYS_TO_REMOVE_MIASMA} days have passed.`);
  }

  initCombinationMap() {
    const keys = Object.keys(herbMap).slice(0, 20);
    keys.sort(() => Math.random() - 0.5);

    const newHerbs = [
      'Solar Blossom', 'Shadowthorn', 'Sky Fungus', 'Verdant Vine', 'Ironleaf'
    ];

    newHerbs.forEach(newHerb => {
      const herb1 = keys.pop();
      const herb2 = keys.pop();
      this.combinationMap[newHerb] = new Set([herb1, herb2])
    });

    this.generateRunesForHerbs();
    updateHerbMap();
    // this.revealAllRunes();
  }

  generateRunesForHerbs() {
    for (let herb in herbMap) {
      const runes =
          Array.from({length: 3}, () => 'ABCD'[Math.floor(Math.random() * 4)]);
      herbMap[herb].runes = runes;
    }

    Object.keys(this.combinationMap).forEach((new_herb) => {
      let [herb1, herb2] = this.combinationMap[new_herb];
      const runes = ['*', '*', '*'];
      for (let i = 0; i < 3; i++) {
        runes[i] = complementaryRunes[herbMap[herb1].runes[i]];
      }
      herbMap[herb2].runes = runes;
    });
  }

  revealAllRunes() {
    Object.keys(herbMap).forEach((herb) => {
      herbMap[herb].revealedRunes = herbMap[herb].runes;
    });
  }

  writeMsg(msg) {
    this.msg.push(msg);
  }

  clearMsgs() {
    this.msg = [];
  }

  moveLog(offset, maxLen) {
    this.logStartAt += offset;
    this.logStartAt = Math.max(0, Math.min(this.logStartAt, maxLen));
  }

  processLogs(logs, maxLen) {
    const processedLogs = [];

    logs.forEach(log => {
      if (log.length <= maxLen) {
        processedLogs.push(log);
      } else {
        let startIndex = 0;
        while (startIndex < log.length) {
          let chunk = log.substring(startIndex, startIndex + maxLen);
          if (startIndex !== 0) {
            processedLogs[processedLogs.length - 1] += '...';
            chunk = chunk;
          }
          processedLogs.push(chunk);
          startIndex += maxLen;
        }
      }
    });
    return processedLogs;
  }

  increaseTheoreticalDays(increase) {
    this.theoreticalDays += increase;
    this.theoreticalDays = Math.max(1, this.theoreticalDays);
    this.theoreticalDays = Math.min(this.theoreticalDays, this.days);
  }

  move(x, y) {
    if (!this.map.moveDruid(x, y)) {
      return;
    }

    let env = this.map.getCurrentEnvironment();
    
    if (env.name == "Forest") {
      this.setState('HUNT');
      return;
    }

    if (false) {
      if (this.map.getCurrentVillage()) {
        this.enterVillage();
      } else {
        this.startHotCold(env);
        this.setNextState('HOT_COLD');
      }
      return;
    }

    if (this.lastEnvironment !== env) {
      env.resetWeights();
    } else {
      env.boostWeights();
    }

    this.gatherIngredients(env);
    this.setNextState('MAP');
  }

  startHotCold(environment) {
    this.game = new HerbGatheringGame(environment);
    this.setState('HOT_COLD');
  }

  enterVillage(village) {
    this.setState('VILLAGE_MAP');
  }

  selectVillager(villager) {
    for (let i = 0; i < this.currentVillage().getPatients().length; i++) {
      let p = this.currentVillage().getPatients()[i];
      if (p.id == villager.id) {
        this.cursorP = i;
        this.setState('VILLAGE');
        return;
      }
    }
    this.setState('VILLAGE_MAP');
  }

  updateCursorP(newValue) {
    this.cursorP = Math.max(
        0, Math.min(newValue, this.currentVillage().getPatients().length - 1));

    if (this.cursorP >= this.windowP + this.windowPSize) {
      this.windowP += 1;
    }
    if (this.cursorP < this.windowP) {
      this.windowP -= 1;
    }
  }
}
