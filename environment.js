import {availableHerbs, herbMap} from './herbs.js';

const NUM_GATHER = 3;

class Environment {
  constructor(name, herbs) {
    this.name = name;
    this.herbs = herbs;
    this.known = new Array(herbs.length).fill(false);
    this.weights = herbs.map(h => herbMap[h].chance);
  }

  gatherHerbs(numHerbs = 3) {
    // Simulate random.choices in Python using weighted random selection
    const totalWeight = this.weights.reduce((acc, weight) => acc + weight, 0);
    const weightedHerbs = this.herbs.map(
        (herb, index) => ({herb, weight: this.weights[index] / totalWeight}));

    const selectedHerbs = [];
    for (let i = 0; i < numHerbs; i++) {
      let rand = Math.random();
      for (const {herb, weight} of weightedHerbs) {
        if (rand < weight) {
          selectedHerbs.push(herb);

          // Flip the corresponding known flag to true
          const herbIndex = this.herbs.indexOf(herb);
          if (herbIndex !== -1) {
            this.known[herbIndex] = true;
          }

          break;
        }
        rand -= weight;
      }
    }

    return selectedHerbs;
  }

  sumHerbChances() {
    console.log(this.herbs);
    return this.herbs.reduce((totalChance, herb) => {
      console.log(herb);
      console.log(herbMap[herb]);
      return totalChance + herbMap[herb].chance;
    }, 0);
  }

  getKnownHerbs1() {
    let str = '';
    for (let i = 0; i < 3; i++) {
      let known = this.known[i];
      let herbName = known ? this.herbs[i] : '???';
      str += herbName.padEnd(15);
    }
    return str;
  }

  getKnownHerbs2() {
    let str = '';
    for (let i = 3; i < 5; i++) {
      let known = this.known[i];
      let herbName = known ? this.herbs[i] : '???';
      str += herbName.padEnd(15);
    }
    return str;
  }
}

export class HerbGathering {
  constructor() {
    this.availableHerbs = availableHerbs;
    this.inventory = Object.fromEntries(availableHerbs.map(herb => [herb, 0]));
    this.justAcquired =
        Object.fromEntries(availableHerbs.map(herb => [herb, 0]));
    this.maxInventory = 20;
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
}


const forest = new Environment(
    'Forest',
    ['Moonroot', 'Sunleaf', 'Night Berry', 'Bloodthorn', 'Lunar Blossom']);

const swamp = new Environment(
    'Swamp',
    ['Dragonscale', 'Silvervine', 'Mossbell', 'Ironbark Sap', 'Whisperleaf']);

const mountain = new Environment(
    'Mountain',
    ['Crimson Clover', 'Dewroot', 'Fireweed', 'Bittermint', 'Wolfsbane']);

const lake = new Environment('Lake', [
  'Glimmer Fern', 'Basilisk Scale', 'Serpent\'s Fang', 'Phoenix Ash',
  'Giant\'s Heart'
]);

// Utility function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Function to assign herbs to environments
function assignHerbsToEnvironments(environments, availableHerbs, herbMap) {
  // Copy and shuffle the available herbs
  let shuffledHerbs = [...availableHerbs];
  shuffledHerbs = shuffledHerbs.slice(0, 20);
  shuffleArray(shuffledHerbs);

  // Iterate over each environment to select 5 herbs
  environments.forEach((env) => {
    let selectedHerbs = [];
    let sumChance = 0;

    while (selectedHerbs.length < 5) {
      let bestHerb = null;
      let bestHerbIndex = -1;

      for (let i = 0; i < shuffledHerbs.length; i++) {
        const herb = shuffledHerbs[i];
        // const herbChance = herbMap[herb].chance;

        // // Select herb if it keeps the total chance sum <= 1 or is the last herb
        // // to be selected
        // if (sumChance + herbChance <= 1 || selectedHerbs.length === 4) {
        //   if (!bestHerb || herbChance > bestHerb.chance) {
        //     bestHerb = herb;
        //     bestHerbIndex = i;
        //   }
        // }
        bestHerb = herb;
        bestHerbIndex = i;
        break;
      }

      if (bestHerb) {
        selectedHerbs.push(bestHerb);
        sumChance += herbMap[bestHerb].chance;
        shuffledHerbs.splice(bestHerbIndex, 1);
      }
    }

    // Assign the selected herbs to the environment
    env.herbs = selectedHerbs;
    env.weights = selectedHerbs.map(herb => herbMap[herb].chance);
  });
}

export let environments = [forest, swamp, mountain, lake];

// Call the function to assign herbs to environments
assignHerbsToEnvironments(environments, availableHerbs, herbMap);
