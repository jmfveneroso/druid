export let GAME_DATA = {
  'items': {
    'Tent': {q: 1, value: 100, weight: 10},
    'Waterskin': {q: 1, value: 5, weight: 1},
    'Rabbit Pelt': {q: 1, value: 10, weight: 2},
    'Rabbit Foot': {q: 1, value: 10, weight: 1},
    'Deer Pelt': {q: 1, value: 50, weight: 10},
    'Wolf Pelt': {q: 1, value: 100, weight: 5},
    'Ration': {q: 1, value: 10, weight: 1},
    'Arrows': {q: 1, value: 1, weight: 1},
    'Health Potion': {q: 1, value: 30, weight: 2},
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
  'hours': '#1 8:00',
  'gold': 100,
  'stamina': 100,
  'max_stamina': 100,
  'druid': {
    'name': 'Lianna Starsong',
    'items': [
      {name: 'Tent', q: 1, value: 100}, {name: 'Waterskin', q: 1, value: 5},
      {name: 'Ration', q: 3, value: 5}, {name: 'Arrows', q: 20, value: 1}, 
    ],
    'max_weight': 100,
    'position': { 'x': 1, 'y': 1 },
  },
  'market': {
    'items': [
      {name: 'Ration', q: 0, value: 5},
      {name: 'Health Potion', q: 0, value: 5}
    ],
  }
};

export let TEMP = {};
