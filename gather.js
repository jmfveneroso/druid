import {availableHerbs, herbMap} from './herbs.js';

const DETERIORATION_RATE = 20;
const NUM_GATHER = 3;

export class HerbGathering {
  constructor() {
    this.availableHerbs = availableHerbs;
    this.inventory = Object.fromEntries(availableHerbs.map(herb => [herb, 0]));
    this.justAcquired =
        Object.fromEntries(availableHerbs.map(herb => [herb, 0]));
    this.maxInventory = 40;
    this.deterioration =
        Object.fromEntries(availableHerbs.map(herb => [herb, 0]));
  }

  getTotal() {
    return Object.values(this.inventory).reduce((acc, value) => acc + value, 0);
  }

  gather(environment, numHerbs = NUM_GATHER) {
    const gatheredHerbs = environment.gatherHerbs(numHerbs);
    for (let herb of gatheredHerbs) {
      let totalHerbs = this.getTotal();
      if (totalHerbs >= this.maxInventory) {
        break;
      }
      this.inventory[herb] += 1;
      this.justAcquired[herb] += 1;
    }
    return gatheredHerbs;
  }

  useHerb(herbName) {
    if ((this.inventory[herbName] || 0) > 0) {
      this.inventory[herbName] -= 1;
      return true;
    } else {
      return false;
    }
  }

  useTwoHerbs(herbName1, herbName2) {
    if ((this.inventory[herbName1] || 0) > 0 &&
        (this.inventory[herbName2] || 0) > 0) {
      this.inventory[herbName1] -= 1;
      this.inventory[herbName2] -= 1;
      return true;
    } else {
      return false;
    }
  }

  progress() {
    for (let herb of this.availableHerbs) {
      if (this.inventory[herb] > 0) {
        this.deterioration[herb] += 1;

        if (this.deterioration[herb] >= DETERIORATION_RATE) {
          this.inventory[herb] -= 1;
          this.deterioration[herb] = 0;
          
          if (this.inventory[herb] < 0) {
            this.inventory[herb] = 0;
          }
        }
      } else {
        this.deterioration[herb] = 0;
      }
    }
  }

  isCloseToDeterioration(herbName) {
    const closeThreshold = 2;
    const currentDeterioration = this.deterioration[herbName];
    return (DETERIORATION_RATE - currentDeterioration) <= closeThreshold;
  }
}
