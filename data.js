export let GAME_STATE = {
  'msg': [],
  'items': {
    '': {value: 0, weight: 0},
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
    'Gun': {value: 100, weight: 5, base_die: 6, bonus: 1, type: 'ranged'},
    'Copper Armor': {value: 50, weight: 5, bonus: 1, type: 'armor'},
    'Silver Armor': {value: 100, weight: 5, bonus: 2, type: 'armor'},
    'Copper Boots': {value: 50, weight: 5, bonus: 1, type: 'boots'},
    'Silver Boots': {value: 100, weight: 5, bonus: 2, type: 'boots'},
    'Rabbit Carcass': {value: 5, weight: 10},
    'Rabbit* Carcass': {value: 25, weight: 10},
    'Deer Carcass': {value: 10, weight: 50},
    'Deer* Carcass': {value: 50, weight: 50},
    'Boar Carcass': {value: 15, weight: 30},
    'Boar* Carcass': {value: 75, weight: 30},
    'Arrows': {value: 1, weight: 0},
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
  'views': ['map'],
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
      {name: 'Ration', q: 30},
      {name: 'Arrows', q: 2},
      {name: 'Gun', q: 1},
    ],
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
    'skinning_skill': 1,
    'tracking_skill': 1,
    'bow_skill': 7,
    'skill_points': 10,
    'max_weight': 100,
  },
  'market': {
    'items': [
      {name: 'Ration'}, 
      {name: 'Arrows'}
    ],
  }
};

Object.assign(GAME_STATE, {
  'animals': [
    {
      'name': 'Rabbit',
      'hp': 2,
      'tracking_difficulty': 12,
      'chasing_difficulty': 8,
      'sneaking_difficulty': 10,
      'size': 0,
      'rest': 15,
      'speed': 1,
      'fights': false,
      'loot': [
        {name: 'Rabbit Carcass', q: 1},
      ],
      'special_loot': [
        {name: 'Rabbit* Carcass', q: 1},
      ],
      'min_tracking_skill': 0,
      'frequency': {
        'base': 2,
        'dc': 10,
      },
    },
    {
      'name': 'Deer',
      'hp': 6,
      'tracking_difficulty': 15,
      'chasing_difficulty': 10,
      'sneaking_difficulty': 14,
      'size': 2,
      'rest': 5,
      'speed': 3,
      'fights': false,
      'loot': [{name: 'Deer Carcass', q: 1}],
      'special_loot': [{name: 'Deer* Carcass', q: 1}],
      'min_tracking_skill': 0,
      'frequency': {
        'base': 2,
        'dc': 10,
      },
    },
    {
      'name': 'Boar',
      'hp': 10,
      'tracking_difficulty': 2,
      'chasing_difficulty': 12,
      'sneaking_difficulty': 14,
      'size': 0.5,
      'rest': 20,
      'speed': 1,
      'fights': false,
      'loot': [{name: 'Boar Carcass', q: 1}],
      'special_loot': [{name: 'Boar* Carcass', q: 1}],
      'min_tracking_skill': 0,
      'frequency': {
        'base': 2,
        'dc': 10,
      },
    },
    {
      'name': 'Fox',
      'hp': 10,
      'tracking_difficulty': 16,
      'chasing_difficulty': 14,
      'sneaking_difficulty': 16,
      'size': 1,
      'rest': 15,
      'speed': 3,
      'fights': false,
      'loot': [{name: 'Fox Carcass', q: 1}],
      'special_loot': [{name: 'Fox* Carcass', q: 1}],
      'min_tracking_skill': 4,
      'frequency': {
        'base': 2,
        'dc': 15,
      },
    },
    {
      'name': 'Pheasant',
      'hp': 10,
      'tracking_difficulty': 14,
      'chasing_difficulty': 15,
      'sneaking_difficulty': 18,
      'size': 1,
      'rest': 15,
      'speed': 3,
      'fights': false,
      'loot': [{name: 'Wolf Pelt', q: 1, value: 100}],
      'min_tracking_skill': 4,
      'frequency': {
        'base': 2,
        'dc': 15,
      },
    },
    {
      'name': 'Lizard',
      'hp': 10,
      'tracking_difficulty': 14,
      'chasing_difficulty': 15,
      'sneaking_difficulty': 18,
      'size': 1,
      'rest': 15,
      'speed': 3,
      'fights': false,
      'loot': [{name: 'Wolf Pelt', q: 1, value: 100}],
      'min_tracking_skill': 4,
      'frequency': {
        'base': 2,
        'dc': 15,
      },
    },
    {
      'name': 'Serpent',
      'hp': 10,
      'tracking_difficulty': 14,
      'chasing_difficulty': 15,
      'sneaking_difficulty': 18,
      'size': 1,
      'rest': 15,
      'speed': 3,
      'fights': false,
      'loot': [{name: 'Wolf Pelt', q: 1, value: 100}],
      'min_tracking_skill': 4,
      'frequency': {
        'base': 2,
        'dc': 15,
      },
    },
    {
      'name': 'Unicorn',
      'hp': 10,
      'tracking_difficulty': 14,
      'chasing_difficulty': 15,
      'sneaking_difficulty': 18,
      'size': 1,
      'rest': 15,
      'speed': 3,
      'fights': false,
      'loot': [{name: 'Wolf Pelt', q: 1, value: 100}],
      'min_tracking_skill': 7,
      'frequency': {
        'base': 1,
        'dc': 18,
      },
    },
    {
      'name': 'Blink Dog',
      'hp': 10,
      'tracking_difficulty': 14,
      'chasing_difficulty': 15,
      'sneaking_difficulty': 18,
      'size': 1,
      'rest': 15,
      'speed': 3,
      'fights': false,
      'loot': [{name: 'Wolf Pelt', q: 1, value: 100}],
      'min_tracking_skill': 7,
      'frequency': {
        'base': 1,
        'dc': 18,
      },
    },
    {
      'name': 'Wolf',
      'hp': 10,
      'tracking_difficulty': 14,
      'chasing_difficulty': 15,
      'sneaking_difficulty': 18,
      'size': 1,
      'rest': 15,
      'speed': 3,
      'fights': true,
      'loot': [{name: 'Wolf Pelt', q: 1, value: 100}],
      'min_tracking_skill': 7,
      'frequency': {
        'base': 1,
        'dc': 18,
      },
    },
  ],
  'tracking_cost': 10,
  'drawing_cost': .1,
  'track_msg': 'The forest is teeming with wild life.',
});

Object.assign(GAME_STATE, {
  'animal': undefined,
  'animal_stats': {
    'hp': 0,
    'distance': 100,
  },
  'current_env': {
    'population': {
      'Rabbit': 100,
      'Deer': 50,
      'Wolf': 13,
    }
  },
  'scroll_height': 0,
});

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
