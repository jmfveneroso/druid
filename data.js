export let GAME_STATE = {
  'msg': [],
  'items': {
    '': {value: 0, weight: 0},
    'Tent': {value: 100, weight: 10},
    'Waterskin': {value: 5, weight: 1},
    'Ration': {value: 10, weight: 1},
    'Arrows': {value: 1, weight: 1},
    'Health Potion': {value: 30, weight: 2},
    'Copper Sword':
        {value: 50, weight: 5, base_die: 8, bonus: 0, type: 'melee'},
    'Silver Sword':
        {value: 100, weight: 5, base_die: 8, bonus: 2, type: 'melee'},
    'Gold Sword':
        {value: 200, weight: 5, base_die: 10, bonus: 4, type: 'melee'},
    'Platinum Sword':
        {value: 400, weight: 5, base_die: 12, bonus: 6, type: 'melee'},
    'Copper Bow': {value: 50, weight: 5, base_die: 6, bonus: 0, type: 'ranged'},
    'Silver Bow':
        {value: 100, weight: 5, base_die: 6, bonus: 2, type: 'ranged'},
    'Gold Bow': {value: 100, weight: 5, base_die: 8, bonus: 4, type: 'ranged'},
    'Gun': {value: 400, weight: 5, base_die: 12, bonus: 6, type: 'ranged'},
    'Copper Armor': {value: 50, weight: 5, bonus: 1, type: 'armor'},
    'Silver Armor': {value: 100, weight: 5, bonus: 2, type: 'armor'},
    'Gold Armor': {value: 200, weight: 5, bonus: 4, type: 'armor'},
    'Platinum Armor': {value: 400, weight: 5, bonus: 8, type: 'armor'},
    'Copper Boots': {value: 50, weight: 5, bonus: 1, type: 'boots'},
    'Silver Boots': {value: 100, weight: 5, bonus: 2, type: 'boots'},
    'Gold Boots': {value: 200, weight: 5, bonus: 4, type: 'boots'},
    'Platinum Boots': {value: 400, weight: 5, bonus: 8, type: 'boots'},
    'Rabbit Carcass': {value: 5, weight: 10, carcass: true},
    'Rabbit* Carcass': {value: 25, weight: 10, carcass: true},
    'Deer Carcass': {value: 10, weight: 30, carcass: true},
    'Deer* Carcass': {value: 50, weight: 30, carcass: true},
    'Boar Carcass': {value: 15, weight: 20, carcass: true},
    'Boar* Carcass': {value: 75, weight: 20, carcass: true},
    'Fox Carcass': {value: 15, weight: 15, carcass: true},
    'Fox* Carcass': {value: 75, weight: 15, carcass: true},
    'Pheasant Carcass': {value: 25, weight: 20, carcass: true},
    'Pheasant* Carcass': {value: 100, weight: 20, carcass: true},
    'Lizard Carcass': {value: 50, weight: 30, carcass: true},
    'Lizard* Carcass': {value: 120, weight: 30, carcass: true},
    'Serpent Carcass': {value: 75, weight: 10, carcass: true},
    'Serpent* Carcass': {value: 150, weight: 10, carcass: true},
    'Unicorn Carcass': {value: 200, weight: 50, carcass: true},
    'Unicorn* Carcass': {value: 400, weight: 50, carcass: true},
    'Blink Dog Carcass': {value: 200, weight: 50, carcass: true},
    'Blink Dog* Carcass': {value: 400, weight: 50, carcass: true},
    'Arrows': {value: 1, weight: 0},
    'Wolf Pelt': {value: 100, weight: 5},
    'Ruby': {value: 50, weight: 5},
    'Drake Pelt': {value: 500, weight: 5},
  },
  'enemies': {
    'wolf': {
      'name': 'Wolf',
      'hp': 8,
      'ac': 12,
      'hit_bonus': 2,
      'init_bonus': 4,
      'damage': 4,
      'loot': [{name: 'Wolf Pelt', q: 1}]
    },
    'goblin': {
      'name': 'Goblin',
      'hp': 5,
      'ac': 12,
      'hit_bonus': 1,
      'init_bonus': 2,
      'damage': 6,
      'loot': [{name: 'Ruby', q: 1}]
    },
    'drake': {
      'name': 'Drake',
      'hp': 50,
      'ac': 16,
      'hit_bonus': 5,
      'init_bonus': 10,
      'damage': 8,
      'loot': [{name: 'Drake Pelt', q: 1}]
    },
  },
  'encounter_types': [
    {prob: 0.5, enemies: ['wolf']},
    {prob: 0.4, enemies: ['goblin', 'goblin']},
    {prob: 0.1, enemies: ['drake']},
  ],
  'encounter_prob': 0.2,
  'views': ['map'],
  'current_env': {
    'population': {
      'Rabbit': 100,
      'Deer': 50,
      'Wolf': 13,
    }
  },
  'hours': '#1 6:00',
  'show_leave': true,
  'gold': 100,
  'stamina': 100,
  'max_stamina': 100,
  'druid': {
    'name': 'Lianna Starsong',
    'items': [
      {name: 'Tent', q: 1},
      {name: 'Waterskin', q: 1},
      {name: 'Ration', q: 30},
      {name: 'Arrows', q: 20},
    ],
    'position': {'x': 3, 'y': 3},
    'ranged': {
      'name': 'Copper Bow',
      'base_die': 6,
      'bonus': 0,
    },
    'melee': {
      'name': 'Copper Sword',
      'base_die': 8,
      'bonus': 12,
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
    'food': 10,
    'max_food': 10,
    'level': 1,
    'init_bonus': 2,
    'camping_skill': 1,
    'sneaking_skill': 1,
    'skinning_skill': 1,
    'tracking_skill': 1,
    'sword_skill': 1,
    'bow_skill': 1,
    'skill_points': 5,
    'max_weight': 100,
  },
  'market': {
    'items': [{name: 'Ration'}, {name: 'Arrows'}],
  },
  'blacksmith_items': [
    {name: 'Silver Sword'},
    {name: 'Gold Sword'},
    {name: 'Platinum Sword'},
    {name: 'Silver Bow'},
    {name: 'Gold Bow'},
    {name: 'Gun'},
    {name: 'Silver Armor'},
    {name: 'Gold Armor'},
    {name: 'Platinum Armor'},
    {name: 'Silver Boots'},
    {name: 'Gold Boots'},
    {name: 'Platinum Boots'},
  ],
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
      'move_speed': 1,
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
      'move_speed': 1,
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
      'rest': 30,
      'speed': 7,
      'move_speed': 2,
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
      'size': 0.5,
      'rest': 5,
      'speed': 5,
      'move_speed': 1,
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
      'predictable': true,
      'size': 1,
      'rest': 0,
      'speed': 3,
      'move_speed': 3,
      'fights': false,
      'loot': [{name: 'Pheasant Carcass', q: 1}],
      'special_loot': [{name: 'Pheasant* Carcass', q: 1}],
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
      'size': 2,
      'rest': 25,
      'speed': 10,
      'move_speed': 1,
      'fights': false,
      'loot': [{name: 'Lizard Carcass', q: 1}],
      'special_loot': [{name: 'Lizard* Carcass', q: 1}],
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
      'size': 0.5,
      'rest': 0,
      'speed': 3,
      'predictable': true,
      'move_speed': 2,
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
      'size': 2,
      'rest': 5,
      'speed': 15,
      'move_speed': 2,
      'fights': false,
      'loot': [{name: 'Unicorn Carcass', q: 1, value: 100}],
      'special_loot': [{name: 'Unicorn* Carcass', q: 1, value: 100}],
      'min_tracking_skill': 7,
      'frequency': {
        'base': 1,
        'dc': 1,
      },
    },
    {
      'name': 'Blink Dog',
      'hp': 10,
      'tracking_difficulty': 14,
      'chasing_difficulty': 15,
      'sneaking_difficulty': 18,
      'blinks': true,
      'size': 1,
      'rest': 25,
      'speed': 20,
      'move_speed': 10,
      'fights': false,
      'loot': [{name: 'Blink Dog Carcass', q: 1, value: 100}],
      'special_loot': [{name: 'Blink Dog* Carcass', q: 1, value: 100}],
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
