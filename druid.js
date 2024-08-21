import {HerbGathering} from './environment.js';
import {herbMap, availableHerbs, updateHerbMap} from './herbs.js';
import {Patient} from './patient.js';
import {Potion} from './potion.js';
import {villages} from './village.js';

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
    this.crystals = 1;
    this.combinationMap = {};
    this.initCombinationMap();
    this.mainMenuOptions = {
      '(V)illage': 'VILLAGE',
      '(I)nventory': 'INVENTORY',
      '(G)ather': 'CHOOSE_ENVIRONMENT',
      '(T)ravel': 'TRAVELLING',
      '(W)ait': 'WAIT',
      // "druid": "DRUID",
    };

    // Druid leveling system
    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = 100;  // XP needed to level up
    this.maxDrugs = 2;
  }

  discardHerb(herbName) {
    this.herbGathering.useHerb(herbName);
  }

  discoverHerbEffect(herbName) {
    if (!herbMap[herbName].known) {  // Check if the effect was previously unknown
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
    this.writeMsg("");
    for (let h of gatheredHerbs) {
      let total = this.herbGathering.inventory[h];
      this.writeMsg(`+1 ${h} (total: ${total})`);
    }
    this.writeMsg("");
    this.writeMsg(`Total ingredients: ${totalHerbs}`);
    this.setState('MSG');
  }
  
  travel(pos) {
    const village = villages[pos];
    this.clearMsgs();
    this.selectedVillage = pos;
    this.writeMsg(`Travelled to ${village.name}.`);
    this.progressGameForDays(DAYS_TO_TRAVEL);
    this.writeMsg(`${DAYS_TO_TRAVEL} days have passed.`);
    this.progressGameForDays(DAYS_TO_TRAVEL);
    this.setState('MSG');
  }

  revealRune(herbName, i) {
    const revealedRunes = herbMap[herbName].revealRune(i);
  }

  treatPatient(patientId, herbName) {
    const patient = this.currentVillage().patients[patientId];
    patient.treatPatient(herbName, this);
  }

  progressGame() {
    villages.forEach(v => v.progress(this));

    villages.forEach(v => {
      v.patients.forEach(patient => {
        patient.progressDiseases(this.days);
        patient.applyDrugs(this, this.days);
        if (patient.isDead() && patient.dead === false) {
          patient.dead = true;
          this.mourning += MOURNING_DURATION;
          this.msg.push(`Patient ${patient.id} in ${v.name} has died.`);
          const patch = v.createMiasmaPatch();
          patch.increaseStrength();
          this.msg.push(`A new miasma patch has formed at ${patch.location}.`);
          patient.powerups.push([`Death`, () => {
            v.patients = v.patients.filter(p => p !== patient);
            v.deadCount += 1;
          }]);
          patient.logMsg(`${patient.id} died!`);
        } else if (patient.isCured() && patient.cured === false) {
          patient.cured = true;
          let druid = this;
          patient.logMsg(`${patient.id} is cured!`);
          this.msg.push(`Patient ${patient.id} in ${
              v.name} is cured. You gained a crystal.`);
          patient.powerups.push([`Crystal`, () => {
            v.curedCount += 1;
            druid.crystals += 1;
          }]);
          if (!patient.disease.diseaseType.known) {
            patient.disease.diseaseType.known = true;
            const dName = patient.disease.diseaseType.name;
            this.msg.push(`Discovered disease ${dName}`);
          }
          this.gainXp(50);  // Example amount of XP gained per cured patient
        }
      });

      v.patients.forEach(patient => {
        if (patient.cured || patient.dead && patient.powerups.length === 0) {
          v.patients = v.patients.filter(p => p !== patient);
        }
      });
    });

    this.days += 1;
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

  updateCursorP(newValue) {
    this.cursorP = Math.max(
        0, Math.min(newValue, this.currentVillage().patients.length - 1));

    if (this.cursorP >= this.windowP + this.windowPSize) {
      this.windowP += 1;
    }
    if (this.cursorP < this.windowP) {
      this.windowP -= 1;
    }
  }

  updateCursor(newValue) {
    this.cursor = Math.max(0, Math.min(newValue, 24));
  }

  updateCursorMain(newValue) {
    this.cursorMain = Math.max(
        0, Math.min(newValue, Object.keys(this.mainMenuOptions).length - 1));
  }

  updateCursorE(newValue) {
    this.cursorE = Math.max(0, Math.min(newValue, 5));
  }

  updateCursorVillage(newValue) {
    this.cursorVillage = Math.max(0, Math.min(newValue, villages.length - 1));
  }

  updateCursorMiasma(newValue) {
    this.cursorMiasma = Math.max(
        0, Math.min(newValue, this.currentVillage().miasmaPatches.length - 1));
  }

  checkWinCondition() {
    return false;
  }

  setNextState(newState) {
    this.nextState = newState;
  }

  setState(newState) {
    this.gameState = newState;
    switch (newState) {
      case 'MAIN':
        this.cursorMain = 0;
        this.cursor = -1;
        // this.cursorP = -1;
        this.cursorE = -1;
        this.cursorMiasma = -1;
        this.cursorVillage = -1;
        this.selectedHerbs = [];
        break;
      case 'CHOOSE_ENVIRONMENT':
        this.cursorE = 0;
        break;
      case 'REMOVE_MIASMA':
        this.cursorMiasma = 0;
        break;
      case 'TREATING_PATIENT':
        this.cursorP = this.windowP;
        break;
      case 'VILLAGE':
        // this.cursorP = 0;
        break;
      case 'TRAVELLING':
        this.cursorVillage = 0;
        break;
      case 'WAIT':
        this.progressGame();
        this.setState("VILLAGE");
        break;
      default:
        if (['TREATING', 'DISCOVERING', 'SELECT_POTION'].includes(newState)) {
          // this.cursor = 0;
        }
        break;
    }
  }

  currentVillage() {
    return villages[this.selectedVillage];
  }

  combinePotion() {
    this.clearMsgs();

    if (this.selectedHerbs.length >= 2) {
      const [herbName1, herbName2] = this.selectedHerbs;
      if (!this.herbGathering.useTwoHerbs(herbName1, herbName2)) {
        this.msg.push('Not enough herbs to combine.');
        return;
      }

      let revealedRunes1 = herbMap[herbName1].revealedRunes;
      let revealedRunes2 = herbMap[herbName2].revealedRunes;
      for (let i = 0; i < 3; i++) {
        const rune1 = herbMap[herbName1].runes[i];
        const rune2 = herbMap[herbName2].runes[i];
        if (rune2 === complementaryRunes[rune1]) {
          revealedRunes1[i] = herbMap[herbName1].runes[i];
          revealedRunes2[i] = herbMap[herbName2].runes[i];
        }
      }
      herbMap[herbName1].revealedRunes = revealedRunes1;
      herbMap[herbName2].revealedRunes = revealedRunes2;

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
      'Solar Blossom', 'Shadowthorn', 'Sky Fungus', 'Verdant Vine',
      'Ironleaf'
    ];

    newHerbs.forEach(newHerb => {
      const herb1 = keys.pop();
      const herb2 = keys.pop();
      this.combinationMap[newHerb] = new Set([herb1, herb2])
    });

    this.generateRunesForHerbs();
    updateHerbMap();
    // this.revealAllRunes();
    console.log(this.combinationMap);
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
}
