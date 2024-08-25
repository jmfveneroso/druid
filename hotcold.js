import {availableHerbs, herbMap, updateHerbMap} from './herbs.js';

export class HerbGatheringGame {
  constructor(environment, gridWidth = 20, gridHeight = 10, initialStamina = 100) {
    this.environment = environment;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.stamina = initialStamina;
    this.grid = this.initializeGrid();
    this.druidPosition = this.getRandomPosition();
    this.herbs = this.placeHerbs();
    this.howClose = -1;
  }

  // Initialize the grid with empty values
  initializeGrid() {
    return Array.from({ length: this.gridHeight }, () => Array(this.gridWidth).fill(null));
  }

  // Get a random position within the grid
  getRandomPosition() {
    const x = Math.floor(Math.random() * this.gridWidth);
    const y = Math.floor(Math.random() * this.gridHeight);
    return { x, y };
  }

  // Randomly place herbs on the grid
  placeHerbs() {
    const herbs = [];
    const numHerbs = Math.floor(Math.random() * 10) + 10; // Random number of herbs

    for (let i = 0; i < numHerbs; i++) {
      const herbPosition = this.getRandomPosition();
      herbs.push(herbPosition);
      let herbName = this.environment.gatherHerbs(1)[0];
    
      this.grid[herbPosition.y][herbPosition.x] = herbName;
    }

    return herbs;
  }

  // Calculate the distance between two points
  calculateDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2); // Manhattan distance
  }

  // Whisper of Nature action
  whisperOfNature() {
    this.stamina -= 2;

    let signalStrength = 0;

    for (let herb of this.herbs) {
      const distance = this.calculateDistance(
        this.druidPosition.x,
        this.druidPosition.y,
        herb.x,
        herb.y
      );

      if (distance === 0) {
        signalStrength = 3; // Right on top of a herb
        break;
      } else if (distance <= 2) {
        signalStrength = Math.max(signalStrength, 2); // Close to a herb
      } else if (distance <= 5) {
        signalStrength = Math.max(signalStrength, 1); // Nearby herb
      }
    }

    this.howClose = signalStrength;
  }

  // Move action
  move(direction, druid) {
    this.stamina -= 2;

    switch (direction) {
      case 'up':
        if (this.druidPosition.y > 0) this.druidPosition.y -= 1;
        break;
      case 'down':
        if (this.druidPosition.y < this.gridHeight - 1) this.druidPosition.y += 1;
        break;
      case 'left':
        if (this.druidPosition.x > 0) this.druidPosition.x -= 1;
        break;
      case 'right':
        if (this.druidPosition.x < this.gridWidth - 1) this.druidPosition.x += 1;
        break;
      default:
        console.log("Invalid direction");
    }

    this.isGameOver(druid);
  }

  // Dig action
  dig(druid) {
    this.stamina -= 2;

    const { x, y } = this.druidPosition;
    if (this.grid[y][x] != null) {
      druid.clearMsgs();
      let h = this.grid[y][x];
      let desc = herbMap[h].known ? herbMap[h].effectDescription : "???";
      druid.writeMsg(`Gathered ${h} - ${desc}.`);
      this.grid[y][x] = null;
      druid.setState('MSG');
      druid.setNextState('HOT_COLD');
      let herbName = this.environment.gatherHerbs(1)[0];

      for (let i = 0; i < this.herbs.length; i++) {
        let pos = this.herbs[i];
        if (pos.x == x && pos.y == y) {
          this.herbs.splice(i);
          break;
        }
      }
      return true;
    }

    this.isGameOver(druid);
    return false;
  }

  // Check if the game is over
  isGameOver(druid) {
    if (this.stamina <= 0) {
      druid.progressGameForDays(1);
      druid.setState('MAP');
    }
  }
}
