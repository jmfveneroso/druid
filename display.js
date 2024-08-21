import {environments} from './environment.js';
import {herbMap} from './herbs.js';
import {villages} from './village.js';

const SCREEN_WIDTH = 50;
const SCREEN_HEIGHT = 50;

function zfill(x) {
  return x < 10 ? ' ' + String(x) : String(x);
}

function createScreen(width, height) {
  return Array.from({length: height}, () => Array(width).fill(' '));
}

function writeToScreen(screen, x, y, text, data = undefined) {
  for (let i = 0; i < text.length; i++) {
    if (x + i >= 0 && x + i < SCREEN_WIDTH && y >= 0 && y < SCREEN_HEIGHT) {
      screen[y][x + i] = [text[i], data];
    }
  }
}

function displayScore(druid, screen, x = 0, y = 0) {
  const village = druid.currentVillage();

  let old_x = x;
  writeToScreen(screen, x, y, "[Vil]", {type: 'MAIN_MENU_CLICK', pos: 0});
  x += 5;
  writeToScreen(screen, x, y, "===",);
  x += 3;
  writeToScreen(screen, x, y, "[Inv]", {type: 'MAIN_MENU_CLICK', pos: 1});
  x += 5;
  writeToScreen(screen, x, y, "===",);
  x += 3;
  writeToScreen(screen, x, y, "[Gat]", {type: 'MAIN_MENU_CLICK', pos: 2});
  x += 5;
  writeToScreen(screen, x, y, "===",);
  x += 3;
  writeToScreen(screen, x, y, "[Tra]", {type: 'MAIN_MENU_CLICK', pos: 3});
  x += 5;
  writeToScreen(screen, x, y, "===",);
  x += 3;
  writeToScreen(screen, x, y, "[Wai]", {type: 'MAIN_MENU_CLICK', pos: 4});

  y += 2
  x = old_x;
  const scoreText = `Days: ${druid.days}    Crystals: ${druid.crystals}`;
  writeToScreen(screen, x, y, scoreText, {type: 'TOP_BAR_CLICK'});
}

function displayMainMenu(druid, screen, x = 0, y = 0) {
  Object.keys(druid.mainMenuOptions).forEach((optionName, i) => {
    const cursor_e = druid.cursorMain === i ? '>' : ' ';
    const optionLine = `${cursor_e} ${optionName}`;
    writeToScreen(
        screen, x, y + i * 2, optionLine, {type: 'MAIN_MENU_CLICK', pos: i});
  });
}

function displayVillageInfo(druid, village, screen, x = 0, y = 0) {
  writeToScreen(screen, x, y, `${village.name}`, {type: 'VILLAGE_LOG'});
  y += 1;

  let villagers = 'H'.repeat(village.villagers.length);
  villagers += 'S'.repeat(village.getSick());
  villagers += 'D'.repeat(village.getDead());

  let firstLine = villagers.slice(0, 15).split('').join(' ');
  let secondLine = villagers.slice(15).split('').join(' ');

  writeToScreen(screen, x, y, `${firstLine}`);
  y += 1;
  writeToScreen(screen, x, y, `${secondLine}`);
  y += 1;
  writeToScreen(
      screen, x, y,
      `(M)iasma: ${village.calculateMiasmaStrength()} (${
          (village.calculateSpreadChance() * 100).toFixed(2)}% spread)`,
      {type: 'MIASMA_CLICK'});
  y += 2;

  return y;
}

function displayOrgan(druid, organ, screen, x = 0, y = 0) {
  let strName = organ.name + (organ.critical ? ' (*)' : '');
  strName += ' '.repeat(12 - strName.length);
  let diseased = organ.diseased ? '[D]' : '   ';
  diseased = organ.justSpreaded ? '[S]' : diseased;
  const hp_s = zfill(organ.hp);
  const decrease_s = organ.decrease !== 0 ? organ.decrease : ' ';
  const status = `${strName} ${diseased} ${hp_s} / 10 ${decrease_s}`;
  organ.decrease = 0;
  return status;
}

function displayPatients(druid, screen, x = 0, y = 0) {
  const village = druid.currentVillage();
  y = displayVillageInfo(druid, village, screen, x, y)

  const colSize = 30;
  writeToScreen(screen, x, y, '='.repeat(colSize));
  y += 1;

  const lft = druid.windowP > 0 ? '<' : ' ';
  const rgt =
      village.patients.length > druid.windowP + druid.windowPSize ? '>' : ' ';
  let header = `${druid.cursorP + 1} of ${village.patients.length}`;
  let paddingLft = ' '.repeat((colSize - header.length - 2) / 2);
  let paddingRgt = ' '.repeat(colSize - header.length - paddingLft.length - 2);
  writeToScreen(screen, x, y, `${lft}` + paddingLft, {type: 'PATIENT_LFT'});
  writeToScreen(screen, x + paddingLft.length + 1, y, header);
  writeToScreen(
      screen, x + paddingLft.length + header.length + 1, y,
      paddingRgt + `${rgt}`, {type: 'PATIENT_RGT'});

  // header = `${lft}` + paddingLft + header + paddingRgt + `${rgt}`;
  // writeToScreen(screen, x, y, header);
  y += 1;

  writeToScreen(screen, x, y, '='.repeat(30));
  y += 1;

  if (village.patients.length <= druid.windowP) {
    druid.windowP =
        Math.max(0, village.patients.length - druid.windowPSize - 1);
  }
  const end =
      Math.min(druid.windowP + druid.windowPSize, village.patients.length);

  let lineStr = '';
  for (let i = druid.windowP; i < end; i++) {
    // const cursor_s = druid.cursorP === i ? '>' : ' ';
    const cursor_s = ' ';
    let s = `${cursor_s} (T) ${village.patients[i].id} `;
    s += village.patients[i].dragonscaleActive ? '[D]' : '';
    s += village.patients[i].silvervineActive ? '[S]' : '';
    lineStr += s + ' '.repeat(colSize - s.length);
  }
  writeToScreen(screen, x, y, lineStr, {type: 'PATIENT_LOG'});

  y += 1;

  lineStr = '';
  for (let i = druid.windowP; i < end; i++) {
    const disease = village.patients[i].disease;
    const d_name = disease.diseaseType.name;
    let s = `  Dis: ${d_name} `;
    s = s.slice(0, Math.min(s.length, colSize));
    lineStr += s + ' '.repeat(colSize - s.length);
  }
  writeToScreen(screen, x, y, lineStr, {type: 'PATIENT_LOG'});
  y += 1;

  if (village.patients.length > 0) {
    const numOrgans = village.patients[0].organs.length;
    for (let i = 0; i < numOrgans; i++) {
      lineStr = '  ';
      for (let j = druid.windowP; j < end; j++) {
        const organStr =
            displayOrgan(druid, village.patients[j].organs[i], screen, x, y);
        lineStr += organStr + ' '.repeat(colSize - organStr.length);
      }
      writeToScreen(screen, x, y, lineStr);
      y += 1;
    }

    for (let i = 0; i < druid.maxDrugs; i++) {
      lineStr = '  ';
      for (let j = druid.windowP; j < end; j++) {
        let drugStr = '';
        if (village.patients[j].drugsTaken.length > i) {
          const drug = village.patients[j].drugsTaken[i];
          const effectDescription = herbMap[drug.name].known ?
              herbMap[drug.name].effectDescription :
              '???';
          drugStr = `+ ${drug.name} (${drug.daysRemaining}) ` + `${effectDescription}`;
        }
        lineStr += drugStr;
      }
      writeToScreen(screen, x, y, lineStr);
      y += 1;
    }

    let patient = village.patients[druid.windowP];
    for (let i = 0; i < 2; i++) {
      if (i < patient.powerups.length) {
        let str = `+ ${patient.powerups[i][0]}`;
        let powerupFn = patient.powerups[i][1];
        writeToScreen(screen, x, y, str, {type: "POWERUP", patient: patient, pos: i, fn: powerupFn });
      }
      y += 1;
    }
  }

  y += 1;
  displayInventory(druid, screen, 1, y, false);
  return y;
}

function displayPatientLog(druid, screen, x = 0, y = 0) {
  const patient = druid.currentVillage().patients[druid.cursorP];
  for (let i = 0; i < patient.log.length; i++) {
    let msg = patient.log[i];
    writeToScreen(screen, x, y, msg, 'LOG_CLICK');
    y += 1;
  }
}

function displayVillageLog(druid, screen, x = 0, y = 0) {
  const village = druid.currentVillage();
  for (let i = 0; i < village.log.length; i++) {
    let msg = village.log[i];
    writeToScreen(screen, x, y, msg, 'LOG_CLICK');
    y += 1;
  }
}

function displayMiasmaPatches(druid, screen, x = 0, y = 0) {
  const village = druid.currentVillage();
  if (village.miasmaPatches.length === 0) {
    writeToScreen(screen, x, y, 'No miasma patches detected in the village.');
    return y + 1;
  }

  y += 1;

  for (let i = 0; i < village.miasmaPatches.length; i++) {
    const patch = village.miasmaPatches[i];
    const cursor_s = druid.cursorMiasma === i ? '>' : ' ';
    const locationStr = `${cursor_s} ${patch.location}`;
    const strengthIndicator = '*'.repeat(patch.strength);
    const strengthStr = `${strengthIndicator}`;
    writeToScreen(screen, x, y, `${locationStr.padEnd(10)} ${strengthStr}`, {type: "REMOVE_MIASMA", pos: i});
    y += 1;
  }
  return y;
}

function getEnv(herbName) {
  for (let i = 0; i < environments.length; i++) {
    let environment = environments[i];
    for (let j = 0; j < environment.herbs.length; j++) {
      if (environment.herbs[j] == herbName && environment.known[j]) {
        return environment.name[0];
      }
    }
  }
  return " ";
}

function displayInventory(druid, screen, x = 0, y = 0, all = true, potion = false) {
  if (all) {
    if (potion) {
      writeToScreen(
          screen, x, y, "[POTION MODE]", {type: 'BACK_TO_INVENTORY'});
    } else {
      writeToScreen(
          screen, x, y, "[INVENTORY MODE]", {type: 'COMBINE_POTIONS'});
    }
  }

  y += 2;

  let i = 0;
  const total = zfill(
      Object.values(druid.herbGathering.inventory).reduce((a, b) => a + b, 0));

  for (const [herb, quantity] of Object.entries(
           druid.herbGathering.inventory)) {
    if (quantity == 0 && !all) {
      continue;
    }

    const herbName = herb + ' '.repeat(14 - herb.length);
    const qty = zfill(quantity);
    const runes = herbMap[herb].revealedRunes.join('');
    const effectDescription = herbMap[herb].known ?
        herbMap[herb].effectDescription :
        '???';

    const env = (all) ? getEnv(herb) : "";

    let selected = " ";
    if (druid.selectedHerbs.includes(herb)) {
      selected = ">";
    }
             
    let inventoryLine = `${env}${selected}${qty} ${herbName} ${runes} ${effectDescription}`;

    let effect = {type: 'TREAT_PATIENT', herb: herb};
    if (potion) {
      effect = {type: 'SELECT_INGREDIENT', herb: herb}
    } else if (all) {
      effect = {type: 'DISCARD_INGREDIENT', herb: herb}
    }

    writeToScreen(
        screen, x, y, inventoryLine, effect);
    y += 1;
    i += 1;
  }

  if (all) {
    writeToScreen(
        screen, x, y, `${total} / ${druid.herbGathering.maxInventory}`);
    y += 1;
  }

  druid.herbGathering.justAcquired = Object.fromEntries(
      Object.keys(druid.herbGathering.availableHerbs).map(k => [k, 0]));
}

function displayMessages(druid, screen, x = 0, y = 0) {
  druid.msg.forEach(msg => {
    writeToScreen(screen, x, y, msg);
    y += 1;
  });
}

function displayEnvironment(druid, screen, x = 0, y = 0) {
  environments.forEach((environment, i) => {
    const environmentLine = `${environment.name} ${environment.sumHerbChances().toFixed(2)}`;
    writeToScreen(screen, x, y + i*4, environmentLine, {type: "GATHER", pos: i});
    let herbs = `${environment.getKnownHerbs1()}`;
    writeToScreen(screen, x, y + i*4 + 1, herbs, {type: "GATHER", pos: i});
    herbs = `${environment.getKnownHerbs2()}`;
    writeToScreen(screen, x, y + i*4 + 2, herbs, {type: "GATHER", pos: i});
  });
}

function displayVillages(druid, screen, x = 0, y = 0) {
  villages.forEach((village, i) => {
    const villageLine = `${village.name}`;
    writeToScreen(screen, x, y + i*2, villageLine, {type: "TRAVEL", pos: i});
  });
}

function displayControls(screen, x = 0, y = 0) {
  const s =
      '(t) Treat Patient, (l) Look Patients, (g) Gather Ingredients (d) Discard Herb (T) Travel (p) Create Potion (m) Remove Miasma';
  writeToScreen(screen, x, y, s);
}

function displayDruid(druid, screen, x = 0, y = 0) {
  const levelInfo = `Druid Level: ${druid.level}`;
  const xpInfo = `XP: ${druid.xp} / ${druid.xpToNextLevel}`;
  writeToScreen(screen, x, y, levelInfo);
  writeToScreen(screen, x, y + 1, xpInfo);
  writeToScreen(screen, x, y + 2, `Crystals: ${druid.crystals}`);
}

function renderScreen(druid, screen, isBrowser, handleClick) {
  const frameChar = '░';
  const width = screen[0].length;
  if (isBrowser) {
    const gameConsole = document.getElementById('game-console');
    gameConsole.innerHTML = '';  // Clear previous screen

    // Render the top border
    // const topBorderElement = document.createElement('div');
    // topBorderElement.className = 'row';
    // for (let col = 0; col < width + 2; col++) {
    //   const charElement = document.createElement('div');
    //   charElement.className = 'col';
    //   charElement.textContent = frameChar;
    //   topBorderElement.appendChild(charElement);
    // }
    // gameConsole.appendChild(topBorderElement);

    // Render the screen with side borders
    screen.forEach((row, rowIndex) => {
      const rowElement = document.createElement('div');
      rowElement.className = 'row';

      // Left border
      // const leftBorderElement = document.createElement('div');
      // leftBorderElement.className = 'col';
      // leftBorderElement.textContent = frameChar;
      // rowElement.appendChild(leftBorderElement);

      // Screen content
      row.forEach((char_and_fn, colIndex) => {
        let char = char_and_fn[0];
        let fn = char_and_fn[1];

        const charElement = document.createElement('div');
        charElement.className = 'col';
        charElement.textContent = char;

        // Set custom attributes for row and column
        charElement.setAttribute('data-row', rowIndex);
        charElement.setAttribute('data-col', colIndex);

        // Add click event to detect row and column
        charElement.addEventListener('click', function() {
          handleClick(druid, rowIndex, colIndex, fn);
        });

        rowElement.appendChild(charElement);
      });

      // Right border
      // const rightBorderElement = document.createElement('div');
      // rightBorderElement.className = 'col';
      // rightBorderElement.textContent = frameChar;
      // rowElement.appendChild(rightBorderElement);

      gameConsole.appendChild(rowElement);
    });

    // Render the bottom border
    // const bottomBorderElement = document.createElement('div');
    // bottomBorderElement.className = 'row';
    // for (let col = 0; col < width + 2; col++) {
    //   const charElement = document.createElement('div');
    //   charElement.className = 'col';
    //   charElement.textContent = frameChar;
    //   bottomBorderElement.appendChild(charElement);
    // }
    // gameConsole.appendChild(bottomBorderElement);
  } else {
    const {execSync} = require('child_process');

    // Function to clear the terminal
    function clearTerminal() {
      execSync('clear', {stdio: 'inherit'});
    }

    clearTerminal();

    const topBottomBorder =
        frameChar.repeat(width + 2);  // Top and bottom borders

    // Render the top border
    console.log(topBottomBorder);

    // Render the screen with side borders
    for (let row of screen) {
      console.log(frameChar + row.join('') + frameChar);
    }

    // Render the bottom border
    console.log(topBottomBorder);
  }
}

export function printScreen(druid, isBrowser, handleClick) {
  const screen = createScreen(SCREEN_WIDTH, SCREEN_HEIGHT);

  displayScore(druid, screen, 1, 1);

  let lft = 1;
  let top = 5;
  switch (druid.gameState) {
    case 'MAIN':
      displayMainMenu(druid, screen, lft, top);
      break;
    case 'CHOOSE_ENVIRONMENT':
      displayEnvironment(druid, screen, lft, top);
      break;
    case 'TRAVELLING':
      displayVillages(druid, screen, lft, top);
      break;
    case 'VILLAGE':
      displayPatients(druid, screen, lft, top);
      break;
    case 'TREATING_PATIENT':
      displayInventory(druid, screen, lft, top);
      break;
    case 'POTION':
      displayInventory(druid, screen, lft, top, true, true);
      break;
    case 'REMOVE_MIASMA':
      displayMiasmaPatches(druid, screen, lft, top);
      break;
    case 'INVENTORY':
      displayInventory(druid, screen, lft, top);
      break;
    case 'PATIENT_LOG':
      displayPatientLog(druid, screen, lft, top);
      break;
    case 'VILLAGE_LOG':
      displayVillageLog(druid, screen, lft, top);
      break;
    case 'MSG':
      displayMessages(druid, screen, lft, top);
    default:
      displayControls(screen, 0, 53);
      displayDruid(druid, screen, 90, 2);
      break;
  }

  renderScreen(druid, screen, isBrowser, handleClick);
}
