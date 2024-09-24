import {GAME_STATE, readTemp, TEMP, writeTemp} from './data.js';
import * as views from './views.js';

const MAX_WIDTH = 1000;
const MAX_HEIGHT = 1000;

export class TemplateReader {
  constructor(renderer, x, y, onclick_fn) {
    this.renderer = renderer;
    this.buffer = this.createBuffer(MAX_WIDTH, MAX_HEIGHT);
    this.max_width = 0;
    this.max_height = 0;
    this.current_char = 0;
    this.current_line = 0;
    this.counter = renderer.counter;
    this.onclick = onclick_fn;
    this.parent_x = x;
    this.parent_y = y;
  }

  increaseLine(increase) {
    this.current_line += increase;
    this.current_char = 0;
  }

  createBuffer(width, height) {
    return Array.from({length: height}, () => Array(width).fill(' '));
  }

  writeToBuffer(x, y, data) {
    this.buffer[y][x] = data;
    this.max_width = Math.max(x + 1, this.max_width);
    this.max_height = Math.max(y + 1, this.max_height);
  }

  writeToScreen(text, fn = undefined) {
    let x = this.current_char;
    let y = this.current_line;
    for (let i = 0; i < text.length; i++) {
      if (x + i >= 0 && x + i < MAX_WIDTH && y >= 0 && y < MAX_HEIGHT) {
        if (fn === undefined && this.onclick) {
          fn = this.onclick;
        }
        this.writeToBuffer(x + i, y, [text[i], {type: 'FN', fn: fn}]);
      }
    }
    this.current_char += text.length;
  }

  getValue(value) {
    if (Number.isInteger(value)) {
      return value.toString();
    } else if (!isNaN(value)) {
      return parseFloat(value).toFixed(2);
    }
    return value;
  }

  getVar(var_name, data) {
    let value = undefined;
    if (var_name.includes('.')) {
      let keys = var_name.split('.');
      value = data[keys[0]];
      if (value === undefined) {
        value = GAME_STATE[keys[0]];
      }
      keys = keys.slice(1);
      value = keys.reduce((acc, key) => acc[key], value);
    } else {
      value = data[var_name];
      if (value === undefined) {
        value = GAME_STATE[var_name];
      }
    }
    return value;
  }

  replaceVar(line, j, data) {
    let pad = true;
    let var_name = '';
    let k = j + 1;
    for (; k < line.length; k++) {
      let char = line[k];
      if (char === '-') {
        pad = false;
        continue;
      }
      if (char === '@') {
        break;
      }
      var_name += char;
    }

    let max_length = var_name.length + 2;

    var_name = var_name.trim();


    let value = this.getVar(var_name, data);

    if (value === undefined) {
      return k;
    }

    let fn = undefined;
    if (typeof value === 'object') {
      fn = value.fn;
      value = value.str;
    }
    value = this.getValue(value);
    if (value === undefined) {
      value = '';
    }

    if (pad) {
      let text = value.slice(0, max_length).padEnd(max_length);
      this.writeToScreen(text, fn);
      return k;
    }

    let text = value.slice(0, max_length);
    this.writeToScreen(text, fn);
    return k;
  }

  processTextLine(line, data) {
    for (let j = 0; j < line.length; j++) {
      let char = line[j];
      if (char === '@') {
        j = this.replaceVar(line, j, data);
        continue;
      }
      this.writeToScreen(char);
    }
  }

  processForV(lines, i, data) {
    let [, name, , list_name] = lines[i].split(' ');

    let subLines = [];
    let opening_fors = 0;
    for (; i < lines.length; i++) {
      let line = lines[i];
      if (line.length === 0) {
        subLines.push(line);
        continue;
      }

      if (line[0] === '@') {
        let control_word = line.split(' ')[0].trim();
        switch (control_word) {
          case '@forv':
            opening_fors++;
            break;
          case '@endforv':
            opening_fors--;
            break;
          default:
            subLines.push(line);
            break;
        }
      } else {
        subLines.push(line);
      }
      if (opening_fors === 0) {
        break;
      }
    }

    let value = this.getVar(list_name, data);

    for (let j = 0; j < value.length; j++) {
      let iterator = value[j];
      data[name] = iterator;
      this.processTemplateInternal(subLines, data);
      delete data[name];
    }

    return i;
  }

  processTemplateInternal(lines, data) {
    let x = this.parent_x;
    let y = this.parent_y + this.current_line;
    let reader = new TemplateReader(this.renderer, x, y);
    reader.renderTemplate(lines, data);

    this.buffer = reader.writeBuffer(this.buffer, 0, this.current_line);
    this.increaseLine(reader.max_height);

    this.max_width = Math.max(reader.max_width + 1, this.max_width);
    this.max_height = Math.max(this.current_line, this.max_height + 1);
  }

  processTemplate(line, data) {
    let [, template_name, data_name] = line.split(' ');

    let data_point = data;
    if (data_name !== undefined) {
      data_point = this.getVar(data_name, data);
    }

    let reader = this.renderer.renderTemplate(
        this.buffer, 0, this.current_line, template_name, data_point);
    this.increaseLine(reader.max_height);

    this.max_width = Math.max(reader.max_width + 1, this.max_width);
    this.max_height = Math.max(this.current_line, this.max_height);
  }

  processMatrix(line, data) {
    let [, var_name, fn_name] = line.split(' ');

    var_name = var_name.trim();

    let value = data[var_name];
    if (value === undefined) {
      return;
    }

    let matrix_fn = undefined;
    if (fn_name !== undefined) {
      let fn = data[fn_name];
      let x = this.parent_x;
      let y = this.parent_y + this.current_line;
      matrix_fn = function(row, col) {
        fn(row - x, col - y);
      };
    }

    let matrix = data[var_name];

    for (let text of matrix) {
      for (let c of text) {
        if (typeof c === 'string') {
          this.writeToScreen(c, matrix_fn);
        } else {
          this.writeToScreen(c[0], c[1]);
        }
      }
      this.increaseLine(+1);
    }
  }

  processOnClick(line, data) {
    let [, var_name] = line.split(' ');
    this.onclick = this.getVar(var_name, data);
  }

  processEndOnClick(line, data) {
    this.onclick = undefined;
  }

  processBox(x, y, data) {
    let expression = '';
    let k = x + 1;
    for (; k < this.max_width; k++) {
      let char = this.buffer[y][k][0];
      if (char === '%') {
        break;
      }
      expression += char;
    }

    let width = k - x + 1;
    let height = 0;
    for (let i = y + 1; i < this.max_height; i++) {
      let char = this.buffer[i][x + width - 1][0];
      if (char === ';') {
        height = i - y + 1;
        break;
      }
    }

    let [command, template_name] = expression.split(' ');

    for (let i = x; i < x + width; i++) {
      for (let j = y; j < y + height; j++) {
        this.writeToBuffer(i, j, '#');
      }
    }

    if (command === 'scroll') {
      let counter = this.counter;
      let scroll_x = readTemp('scroll_x', counter) || 0;
      let scroll_y = readTemp('scroll_y', counter) || 0;
      
      let fn = function () {
        console.log('Shit happens');
      };

      let reader = this.renderer.renderTemplate(
          this.buffer, x + 2, y + 2, template_name, data, width - 4, height - 4,
          scroll_x, scroll_y, fn);
      let max_width = reader.max_width;
      let max_height = reader.max_height;
      
      for (let i = 0; i < 2; i++) {
        let x_ = x + width - 1;
        for (let y_ = y + 1; y_ < y + height - 1; y_++) {
          let can_scroll = scroll_x + width - 2 < max_width;
          let symbol = can_scroll ? '.' : '#';
          this.writeToBuffer(x_ - i, y_, [symbol, {type: 'FN', fn: function () {
            if (can_scroll) {
              writeTemp('scroll_x', scroll_x + 1, counter);
            }
          }}]);
        }
      
        for (let y_ = y + 1; y_ < y + height - 1; y_++) {
          let can_scroll = scroll_x > 0;
          let symbol = can_scroll ? '.' : '#';
          this.writeToBuffer(x + i, y_, [symbol, {type: 'FN', fn: function () {
            if (can_scroll) {
              writeTemp('scroll_x', scroll_x - 1, counter);
            }
          }}]);
        }
      
        let y_ = y + height - 1;
        for (let x_ = x + 1; x_ < x + width - 1; x_++) {
          let can_scroll = scroll_y + height - 2 < max_height;
          let symbol = can_scroll ? '.' : '#';
          this.writeToBuffer(x_, y_ - i, [symbol, {type: 'FN', fn: function () {
            if (can_scroll) {
              writeTemp('scroll_y', scroll_y + 1, counter);
            }
          }}]);
        }
      
        for (let x_ = x + 1; x_ < x + width - 1; x_++) {
          let can_scroll = scroll_y > 0;
          let symbol = can_scroll ? '.' : '#';
          this.writeToBuffer(x_, y + i, [symbol, {type: 'FN', fn: function () {
            if (can_scroll) {
              writeTemp('scroll_y', scroll_y - 1, counter);
            }
          }}]);
        }
      }
      
    } else {
      this.renderer.renderTemplate(
          this.buffer, x, y, template_name, data, width, height);
    }
  }

  renderTemplate(lines, data) {
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.length == 0) {
        this.increaseLine(+1);
        this.max_height = Math.max(this.current_line + 1, this.max_height);
        continue;
      }

      if (line[0] === '#') {
        continue;
      }

      if (line[0] === '@') {
        let control_word = line.split(' ')[0];
        switch (control_word) {
          case '@forv':
            i = this.processForV(lines, i, data);
            break;
          case '@template':
            this.processTemplate(line, data);
            break;
          case '@matrix':
            this.processMatrix(line, data);
            break;
          case '@def':
          case '@enddef':
          case '@onclick':
            this.processOnClick(line, data);
            break;
          case '@endonclick':
            this.processEndOnClick(line, data);
            break;
          default:
            this.processTextLine(line, data);
            this.increaseLine(+1);
            break;
        }
        continue;
      }

      this.processTextLine(line, data);
      this.increaseLine(+1);
    }
    this.renderBoxes(data);
  }

  renderBoxes(data) {
    for (let j = 0; j < this.max_height; j++) {
      for (let i = 0; i < this.max_width; i++) {
        let char = this.buffer[j][i][0];
        if (char === '%') {
          this.processBox(i, j, data);
        }
      }
    }
  }

  writeBuffer(
      screen, x, y, max_width = views.SCREEN_WIDTH,
      max_height = views.SCREEN_HEIGHT, start_x = 0, start_y = 0) {
    for (let i = 0; i < this.max_width; i++) {
      for (let j = 0; j < this.max_height; j++) {
        if (x + i >= 0 && x + i < x + max_width && y + j >= 0 &&
            y + j < y + max_height) {
          screen[y + j][x + i] = this.buffer[j + start_y][i + start_x];
        }
      }
    }
    return screen;
  }
}

export class Renderer {
  constructor() {
    this.dir = /views/;
    this.views = {};
    this.models = {};
    this.counter = 0;
  }

  extractTemplatesFromFile(content) {
    const templateRegex = /<<<\s*(\w+)\s*\n([\s\S]*?)\n>>>\s*\1/g;

    let match;
    while ((match = templateRegex.exec(content)) !== null) {
      const name = match[1];
      const templateContent = match[2].trim();
      this.views[name] = templateContent;
    }
  }

  async loadViewsFromFile(filename) {
    try {
      const response = await fetch(this.dir + filename);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const text = await response.text();
      this.extractTemplatesFromFile(text);
    } catch (error) {
      console.error('Error loading YAML file:', error);
    }
  }

  async loadViews() {
    console.log('views');
    try {
      // Fetch the list of files from the directory
      const response = await fetch('/list-views');

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const files = await response.json(); // List of files
      for (const file of files) {
        console.log(file);
        this.loadViewsFromFile(file);
      }
    } catch (error) {
      console.error('Error loading views:', error);
    }
  }

  renderTemplate(
      screen, x, y, template_name, data, max_width, max_height, start_x,
      start_y, onclick) {
    if (data === undefined) {
      data = {};
    }

    if (this.models[template_name]) {
      data = this.models[template_name](data, this.counter);
    }

    if (this.views[template_name] === undefined) {
      console.log(template_name + ' does not exist.')
    }

    const lines = this.views[template_name].split('\n');
    let reader = new TemplateReader(this, x, y, onclick);
    this.counter += 1;

    reader.renderTemplate(lines, data);
    screen = reader.writeBuffer(screen, x, y, max_width, max_height, start_x, start_y);
    return reader;
  }
}


export let renderer = new Renderer();
renderer.loadViews();
