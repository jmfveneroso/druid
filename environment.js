import {availableHerbs, herbMap} from './herbs.js';

class Environment {
  constructor(name, herbs) {
    this.name = name;
    this.herbs = herbs;
    this.known = new Array(herbs.length).fill(false);
    this.weights = herbs.map(h => herbMap[h].chance);
    this.boostedWeights = herbs.map(h => herbMap[h].chance);
  }

  weightedRandomSelect(weights) {
    const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);

    let randomNum = Math.random() * totalWeight;

    for (let i = 0; i < weights.length; i++) {
      randomNum -= weights[i];
      if (randomNum < 0) {
        return i;
      }
    }
  }

  gatherHerbs(numHerbs = 3) {
    const selectedHerbs = [];
    for (let i = 0; i < numHerbs; i++) {
      let index = this.weightedRandomSelect(this.boostedWeights);
      selectedHerbs.push(this.herbs[index]);
      this.known[index] = true;
    }
    return selectedHerbs;
  }

  sumHerbChances() {
    return this.herbs.reduce((totalChance, herb) => {
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

  hasHerb(herb) {
    const herbIndex = this.herbs.indexOf(herb);
    return herbIndex !== -1 && this.known[herbIndex];
  }

  resetWeights() {
    this.boostedWeights = [...this.weights];
  }

  boostWeights(levelingFactor = 0.2) {
    const totalWeight = this.boostedWeights.reduce((acc, weight) => acc + weight, 0);

    this.boostedWeights = this.boostedWeights.map(weight => {
      const equalizedWeight = totalWeight / this.weights.length;
      return weight + levelingFactor * (equalizedWeight - weight);
    })
  }

  getWeightsAsProbabilityMap() {
    console.log(this.herbs);
    console.log(this.weights);
    console.log(this.boostedWeights);
    const totalWeight = this.boostedWeights.reduce((acc, weight) => acc + weight, 0);
    const probabilityMap = {};

    this.herbs.forEach((herb, index) => {
      probabilityMap[herb] = this.boostedWeights[index] / totalWeight;
    });

    return probabilityMap;
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
    env.boostedWeights = selectedHerbs.map(herb => herbMap[herb].chance);
  });
}

export let environments = [forest, swamp, mountain, lake];

// Call the function to assign herbs to environments
assignHerbsToEnvironments(environments, availableHerbs, herbMap);
