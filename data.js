export let GAME_DATA = {
  'items': {
    'Tent': {q: 1, value: 100, weight: 10},
    'Waterskin': {q: 1, value: 5, weight: 1},
    'Rabbit Pelt': {q: 1, value: 10, weight: 2},
    'Rabbit Foot': {q: 1, value: 10, weight: 1},
    'Deer Pelt': {q: 1, value: 50, weight: 10},
    'Wolf Pelt': {q: 1, value: 100, weight: 5},
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
};

export let GAME_STATE = {
  'view': 'hunt',
  'current_env': {
    'population': {
      'Rabbit': 100,
      'Deer': 50,
      'Wolf': 13,
    }
  },
  'sword_skill': 1,
  'hunting_skill': 1,
  'sneaking_skill': 1,
  'bow_skill': 1,
  'skinning_skill': 1,
  'bow': {
    'damage': 1,
  },
  'sword': {
    'damage': 2,
  },
  'hours': '8:00',
  'gold': 100,
  'stamina': 100,
  'druid': {
    'name': 'Lianna Starsong',
    'items':
        [{name: 'Tent', q: 1, value: 100}, {name: 'Waterskin', q: 1, value: 5}],
    'max_weight': 100,
    'atk_bar': 0,
    'load_speed': 0.3,
  },
  'enemy1': {
    'hp': 10,
    'atk_bar': 0,
    'ac': 12,
  }
};

export let TEMP = {};
