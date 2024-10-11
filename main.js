import {renderer, run} from './renderer.js';

// Game.
import * as battle from './battle.js';
import * as druid from './druid.js';
import * as hunt from './hunt.js';
import * as inventory from './inventory.js';
import * as map from './map.js';
import * as rest from './rest.js';

// Check why this is necessary.
renderer.loadViews();

renderer.loadViews().then(() => {
  setTimeout(function() {
    run();
  }, 100);
});
