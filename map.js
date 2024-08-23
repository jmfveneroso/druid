import {villages} from './village.js';
import {environments} from './environment.js';

export class Map {
  constructor() {
    this.gridSize = 4;
    this.grid = this.initializeGrid(environments);
    this.villages = this.placeVillages(villages);
    this.druidLocation = { x: 0, y: 0 }; // Druid starts at the top-left corner
  }

  initializeGrid(environments) {
    let grid = [];
    for (let i = 0; i < this.gridSize; i++) {
      grid[i] = [];
      for (let j = 0; j < this.gridSize; j++) {
        // Randomly assign an environment to each grid square
        grid[i][j] = [environments[Math.floor(Math.random() * environments.length)], undefined];
      }
    }
    return grid;
  }

  placeVillages(villages) {
    for (let village of villages) {
      let x, y;
      do {
        x = Math.floor(Math.random() * this.gridSize);
        y = Math.floor(Math.random() * this.gridSize);
      } while (this.grid[x][y][1]);

      this.grid[x][y][1] = village;

      village.location = { x: x, y: y };

      const xVillage = Math.floor(Math.random() * 6);
      const yVillage = Math.floor(Math.random() * 3);
      village.displayLoc = { x: xVillage, y: yVillage };
    }
  }

  moveDruid(newX, newY) {
    const { x, y } = this.druidLocation;
    if (Math.abs(newX - x) + Math.abs(newY - y) > 1) return false;

    this.druidLocation.x = newX;
    this.druidLocation.y = newY;
    return true;
  }

  getDruidLocation() {
    return this.grid[this.druidLocation.x][this.druidLocation.y];
  }

  isEnvironment() {
    return this.getDruidLocation()[1] === undefined;
  }

  getCurrentEnvironment() {
    return this.getDruidLocation()[0];
  }

  getCurrentVillage() {
    return this.getDruidLocation()[1];
  }
}