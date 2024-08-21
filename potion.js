export class Potion {
  constructor(herbs, combinationMap) {
    this.herbs = herbs;
    this.combinationMap = combinationMap;
    this.newHerb = this.combineHerbs();
  }

  combineHerbs() {
    for (let i = 0; i < Object.keys(this.combinationMap).length; i++) {
      let key = Object.keys(this.combinationMap)[i];
      let [herb1, herb2] = this.combinationMap[key];
      let [herbS1, herbS2] = this.herbs;
      if ((herb1 == herbS1 || herb1 == herbS2) &&
          (herb2 == herbS2 || herb2 == herbS1)) {
        return key;
      }
    }
    return null;
  }

  isSuccessful() {
    // Check if the combination produced a new herb
    return this.newHerb !== null;
  }

  getNewHerb() {
    // Return the name of the newly created herb
    if (this.isSuccessful()) {
      return this.newHerb;
    } else {
      return null;
    }
  }
}
