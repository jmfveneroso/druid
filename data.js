export const GAME_DATA = {
  'items': {
    'Tent': {value: 100, weight: 10},
    'Waterskin': {value: 5, weight: 1},
    'Rabbit Pelt': {value: 10, weight: 2},
    'Rabbit Foot': {value: 10, weight: 1},
    'Deer Pelt': {value: 50, weight: 10},
    'Wolf Pelt': {value: 100, weight: 5},
    'Ration': {value: 10, weight: 1},
    'Arrows': {value: 1, weight: 1},
    'Health Potion': {value: 30, weight: 2},
    'Copper Sword': {value: 50, weight: 5, base_die: 4, bonus: 2, type: 'melee'},
    'Silver Sword': {value: 100, weight: 5, base_die: 4, bonus: 3, type: 'melee'},
    'Copper Bow': {value: 50, weight: 5, base_die: 6, bonus: 0, type: 'ranged'},
    'Silver Bow': {value: 100, weight: 5, base_die: 6, bonus: 1, type: 'ranged'},
    'Copper Armor': {value: 50, weight: 5, bonus: 1, type: 'armor'},
    'Silver Armor': {value: 100, weight: 5, bonus: 2, type: 'armor'},
    'Copper Boots': {value: 50, weight: 5, bonus: 1, type: 'boots'},
    'Silver Boots': {value: 100, weight: 5, bonus: 2, type: 'boots'},
  },
  'enemies': {
    'wolf': {
      'name': 'Wolf',
      'hp': 10,
      'atk': 2,
      'reload_speed': 0.3,
      'ac': 10,
      'loot': [{name: 'Wolf Pelt', q: 1, value: 100}]
    },
  },
  'encounter_prob': 0.2,
};

export let GAME_STATE = {
  'views': ['forest'],
  'current_env': {
    'population': {
      'Rabbit': 100,
      'Deer': 50,
      'Wolf': 13,
    }
  },
  'hours': '#1 8:00',
  'gold': 100,
  'stamina': 100,
  'max_stamina': 100,
  'druid': {
    'name': 'Lianna Starsong',
    'items': [
      {name: 'Tent', q: 1},
      {name: 'Waterskin', q: 1},
      {name: 'Ration', q: 3},
      {name: 'Arrows', q: 20},
      {name: 'Silver Sword', q: 1},
      {name: 'Silver Bow', q: 1},
      {name: 'Silver Armor', q: 1},
      {name: 'Silver Boots', q: 1},
    ],
    'max_weight': 100,
    'position': {'x': 3, 'y': 3},
    'ranged': {
      'name': 'Copper Bow',
      'bonus': 0,
      'base_die': 6,
    },
    'melee': {
      'name': 'Copper Sword',
      'base_die': 4,
      'bonus': 2,
    },
    'armor': {
      'name': 'Copper Armor',
      'bonus': 1,
    },
    'boots': {
      'name': 'Copper Boots',
      'bonus': 1,
    },
    'hp': 12,
    'max_hp': 12,
    'init_bonus': 2,
    'sword_skill': 1,
    'hunting_skill': 1,
    'sneaking_skill': 1,
    'bow_skill': 1,
    'skinning_skill': 1,
  },
  'market': {
    'items': [
      {name: 'Ration', q: 0, value: 5}, {name: 'Health Potion', q: 0, value: 5}
    ],
  }
};

export let TEMP = {};

export function writeTemp(name, value, counter) {
  TEMP[name + '_' + counter] = value;
}

export function readTemp(name, counter) {
  return TEMP[name + '_' + counter];
}

export class Loader {
  constructor() {
    this.dir = /saves/;
  }

  async loadState() {
    try {
      const response = await fetch(this.dir + 'save.json');

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.text();
      const json = JSON.parse(data);
      if (Object.keys(json).length !== 0) {
        GAME_STATE = json;
      }
    } catch (error) {
      console.error('Error loading YAML file:', error);
    }
  }

  async saveState() {
    console.log('saveState');
    console.log(GAME_STATE);

    fetch('/write-json', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(GAME_STATE)
    })
        .then(response => response.json())
        .then(result => {
          console.log(result);
        })
        .catch(error => {
          console.error('Error:', error);
        });
  }

  async resetState() {
    console.log('resetState');
    GAME_STATE = {};
    this.saveState();
  }
}

export let loader = new Loader();

loader.loadState();
