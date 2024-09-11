class Animal {
  constructor(hunt, name, difficulty, reward, hp, sneakDifficulty, shootDifficulty, aggressive = false) {
    this.hunt = hunt;
    this.name = name;
    this.difficulty = difficulty;
    this.reward = reward;
    this.hp = hp;
    this.sneakDifficulty = sneakDifficulty;
    this.shootDifficulty = shootDifficulty;
    this.aggressive = aggressive;
  }

  attemptHunt(huntingSkill) {
    const successChance = huntingSkill / (this.difficulty * 10);
    const success = Math.random() < successChance;
    return {success, reward: success ? this.reward : null};
  }

  getDifficulty(value, skill) {
    let successRate = 10 - value;
    successRate += skill;
    successRate = Math.max(0, Math.min(successRate, 10))
    return (successRate / 10).toFixed(2);
  }

  getDifficultyTracking() {
    let huntingSkill = this.hunt.druid.huntingSkill;
    return this.getDifficulty(this.difficulty, huntingSkill);
  }

  getDifficultyShooting() {
    let huntingSkill = this.hunt.druid.huntingSkill;
    return this.getDifficulty(this.shootDifficulty + (this.hunt.distance - 50) / 10, huntingSkill);
  }

  getDifficultySneaking() {
    let huntingSkill = this.hunt.druid.huntingSkill;
    return this.getDifficulty(this.sneakDifficulty - this.hunt.distance / 10, huntingSkill);
  }
}

export class Hunt {
  constructor(druid) {
    this.druid = druid;
    this.animals = [
      new Animal(this, 'Rabbit', 2, 'Rabbit Pelt', 1, 8, 8),
      new Animal(this, 'Deer', 4, 'Deer Meat', 5, 6, 5),
      new Animal(this, 'Wolf', 6, 'Wolf Pelt', 10, 4, 6, true)
    ];
    this.currentAnimal = undefined;
    this.distance = 100;
  }

  async track(animal) {
    if (Math.random() > animal.getDifficultyTracking()) {
      this.druid.clearMsgs();
      this.druid.writeMsg('You lost the track.');
      this.druid.setState('MSG');
      this.druid.setNextState('HUNT');
      return;
    } 
    this.currentAnimal = animal;
    this.distance = 100;
    this.druid.clearMsgs();
    this.druid.writeMsg(`You found a ${animal.name}.`);
    this.druid.setState('MSG');
    this.druid.setNextState('HUNT_ANIMAL');
  }

  sneak() {
    let animal = this.currentAnimal;
    if (Math.random() > animal.getDifficultySneaking()) {
      this.druid.clearMsgs();
      this.druid.writeMsg(`The ${animal.name} noticed you and got away.`);
      this.druid.setState('MSG');
      this.druid.setNextState('HUNT');
      return;
    }
    
    this.distance /= 2;
  }

  shoot() {
    let animal = this.currentAnimal;
    if (Math.random() > animal.getDifficultyShooting()) {
      this.druid.clearMsgs();
      this.druid.writeMsg(`You missed the shot and the ${animal.name} got away.`);
      this.druid.setState('MSG');
      this.druid.setNextState('HUNT');
      return;
    } 
    
    let dmg = this.druid.getRangedDamage();
    if (animal.hp <= dmg) {
      this.druid.clearMsgs();
      this.druid.writeMsg(`You did ${dmg} damage to the ${animal.name} and killed it.`);
      this.druid.writeMsg(`You acquire a ${animal.reward}.`);
      this.druid.herbGathering.inventory[animal.reward] += 1;
      this.druid.setState('MSG');
    }
  }

  rest() {
    this.stamina += 1;  // Regain 1 stamina point
    console.log(`${this.name} rests and regains stamina.`);
  }

  findAnimal() {
    const randomIndex = Math.floor(Math.random() * this.animals.length);
    return this.animals[randomIndex];
  }
  
  async test() {
    try {
      // Fetch the YAML file from the server
      const response = await fetch('/views/hunt.yaml');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Read the response as text
      const yamlText = await response.text();
      
      // Parse the YAML content using js-yaml
      const data = jsyaml.load(yamlText);
      
      // Log the parsed data to the console
      console.log(data);
      
    } catch (error) {
      console.error('Error loading YAML file:', error);
    }
  }
}
