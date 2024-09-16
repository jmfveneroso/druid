import {GAME_DATA, GAME_STATE, TEMP} from './data.js';
import * as views from './views.js';

export class TemplateReader {
  constructor(renderer) {
    this.renderer = renderer;
    this.buffer = this.createBuffer(100, 100);
    this.max_width = 0;
    this.max_height = 0;
    this.current_char = 0;
    this.current_line = 0;
    this.counter = renderer.counter;
    this.onclick = undefined;
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
      if (x + i >= 0 && x + i < 100 && y >= 0 && y < 100) {
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
    if (var_name.includes(".")) {
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
    let [, name, ,list_name] = lines[i].split(' ');

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
    let reader = new TemplateReader(this.renderer);
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
    let [, var_name] = line.split(' ');

    var_name = var_name.trim();

    let value = data[var_name];
    if (value === undefined) {
      return;
    }

    let matrix = data[var_name];

    for (let text of matrix) {
      this.writeToScreen(text);
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

    let [, template_name] = expression.split(' ');

    for (let i = x; i < x + width; i++) {
      for (let j = y; j < y + height; j++) {
        this.writeToBuffer(i, j, '#');
      }
    }

    this.renderer.renderTemplate(
        this.buffer, x, y, template_name, data, width, height);
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
          // case '@box':
          //   this.processBox(lines, 0, i, data);
          //   break;
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
      max_height = views.SCREEN_HEIGHT) {
    for (let i = 0; i < this.max_width; i++) {
      for (let j = 0; j < this.max_height; j++) {
        if (x + i >= 0 && x + i < x + max_width && y + j >= 0 &&
            y + j < y + max_height) {
          screen[y + j][x + i] = this.buffer[j][i];
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

  async loadViews() {
    try {
      const response = await fetch(this.dir + 'views.txt');

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const text = await response.text();
      this.extractTemplatesFromFile(text);
    } catch (error) {
      console.error('Error loading YAML file:', error);
    }
  }

  renderTemplate(screen, x, y, template_name, data, max_width, max_height) {
    if (data === undefined) {
      data = {};
    }

    if (this.models[template_name]) {
      data = this.models[template_name](data, this.counter);
    }
    
    if (this.views[template_name] === undefined) {
      console.log(template_name + " does not exist.")
    }

    const lines = this.views[template_name].split('\n');
    let reader = new TemplateReader(this);
    this.counter += 1;

    reader.renderTemplate(lines, data);
    screen = reader.writeBuffer(screen, x, y, max_width, max_height);
    return reader;
  }
}


export let renderer = new Renderer();
renderer.loadViews();
