import {GAME_STATE} from './data.js';
import {utils} from './general.js';
import {renderer} from './renderer.js';

utils.getItemData = function(item_name) {
  let item = Object.assign({}, GAME_STATE['items']['']);
  if (GAME_STATE['items'][item_name] !== undefined) {
    item = Object.assign({}, GAME_STATE['items'][item_name]);
  }
  item.name = item_name;
  return item;
};

utils.acquireItem = function(item_name, quantity) {
  for (let _item of GAME_STATE['druid']['items']) {
    if (_item['name'] == item_name) {
      _item['q'] += quantity;
      return true;
    }
  }

  GAME_STATE['druid']['items'].push({'name': item_name, 'q': quantity});
  return true;
};

utils.consumeItem = function(item_name) {
  for (let _item of GAME_STATE['druid']['items']) {
    if (_item['name'] == item_name) {
      _item['q']--;
      if (_item['q'] === 0) {
        GAME_STATE['druid']['items'] = GAME_STATE['druid']['items'].filter(
            item => item.name !== item_name);
        return true;
      }
      return true;
    }
  }
  return false;
};

utils.getItemQuantity = function(item_name) {
  for (let _item of GAME_STATE['druid']['items']) {
    if (_item['name'] == item_name) {
      return _item['q'];
    }
  }
  return 0;
};

utils.getItemWeight = function(item_name) {
  let item_data = GAME_STATE['items'][item_name];
  return item_data['weight'] || 0;
};

utils.getItemValue = function(item_name) {
  let item_data = GAME_STATE['items'][item_name];
  return item_data['value'] || 0;
};

utils.getCurrentWeight = function() {
  let weight = 0;
  for (let item of GAME_STATE['druid']['items']) {
    weight += utils.getItemWeight(item['name']) * item['q'];
  }
  return weight;
};

utils.spendGold = function(cost) {
  if (GAME_STATE['gold'] >= cost) {
    GAME_STATE['gold'] -= cost;
    return true;
  }
  return false;
};

utils.earnGold = function(gold) {
  GAME_STATE['gold'] += gold;

  if (GAME_STATE['gold'] >= 10000) {
    utils.pushView('win');
  }
};

// =============================================================================
// TEMPLATES
// =============================================================================

export function inventory(data) {
  let weight = utils.getCurrentWeight();
  data['weight'] = weight;
  data['max_weight'] = GAME_STATE['druid']['max_weight'];

  let items = [];
  for (let item of GAME_STATE['druid'].items) {
    item['w'] = item.q * utils.getItemWeight(item.name);
    item['v'] = utils.getItemValue(item.name);
    item['fn'] = function() {
      let item_data = GAME_STATE['items'][item.name];
      switch (item_data['type']) {
        case 'melee':
          utils.equipWeapon(item.name);
          break;
        case 'ranged':
          utils.equipRangedWeapon(item.name);
          break;
        case 'armor':
          utils.equipArmor(item.name);
          break;
        case 'boots':
          utils.equipBoots(item.name);
          break;
        case 'potion':
          utils.usePotion(item.name);
          break;
      }
    };
    item['delete'] = {
      'str': '-X-',
      'fn': function() {
        utils.consumeItem(item.name);
      }
    };
    items.push(item);
  }
  data['inventory'] = items;
  return data;
}

renderer.models['inventory'] = inventory;