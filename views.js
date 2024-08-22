import {environments} from './environment.js';
import {herbMap} from './herbs.js';
import {villages} from './village.js';

export const SCREEN_WIDTH = 50;
export const SCREEN_HEIGHT = 50;

function zfill(x) {
  return x < 10 ? ' ' + String(x) : String(x);
}

function writeToScreen(screen, x, y, text, data = undefined) {
  for (let i = 0; i < text.length; i++) {
    if (x + i >= 0 && x + i < SCREEN_WIDTH && y >= 0 && y < SCREEN_HEIGHT) {
      screen[y][x + i] = [text[i], data];
    }
  }
}

export function displayScore(druid, screen, x = 0, y = 0) {
  const menuOptions = ['[Vil]', '[Inv]', '[Gat]', '[Tra]', '[Wai]', '[Log]'];
  let menuX = x;
  menuOptions.forEach((option, index) => {
    writeToScreen(
        screen, menuX, y, option, {type: 'MAIN_MENU_CLICK', pos: index});
    menuX += option.length;
    if (index < menuOptions.length - 1) {
      let padding = '==';
      writeToScreen(screen, menuX, y, padding);
      menuX += padding.length;
    }
  });

  writeToScreen(screen, x, y + 2, "---", {type: 'DECREASE_THEORETICAL_DAYS'});

  const scoreText = ` Days: ${druid.days} (${druid.theoreticalDays}) `;
  writeToScreen(screen, x + 3, y + 2, scoreText, {type: 'TOP_BAR_CLICK'});

  writeToScreen(screen, x + scoreText.length + 3, y + 2, "+++", {type: 'INCREASE_THEORETICAL_DAYS'});
  
  writeToScreen(screen, x + scoreText.length + 10, y + 2, `Crystals: ${druid.crystals}`, {type: 'TOP_BAR_CLICK'});
}

export function displayVillageInfo(druid, village, screen, x = 0, y = 0) {
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

export function displayOrgan(druid, organ, screen, x = 0, y = 0) {
  let strName = organ.name + (organ.critical ? ' (*)' : '');
  strName += ' '.repeat(12 - strName.length);
  let diseased = organ.diseased ? '[D]' : '   ';
  diseased = organ.justSpreaded ? '[S]' : diseased;
  const hp_s = zfill(organ.hp);
  const decrease_s = organ.decrease !== 0 ? organ.decrease : ' ';
  const status = `${strName} ${diseased} ${hp_s} / 10 ${decrease_s}`;
  return status;
}

export function displayPatients(druid, screen, x = 0, y = 0) {
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

  if (village.patients.length <= 0) {
    return;
  }

  let patient = village.patients[druid.windowP];

  let [organs, drugsTaken] = patient.getOrgans(druid.theoreticalDays);

  for (let i = 0; i < organs.length; i++) {
    const organStr = displayOrgan(druid, organs[i], screen, x, y);
    lineStr = '  ' + organStr + ' '.repeat(colSize - organStr.length);
    writeToScreen(screen, x, y, lineStr);
    y += 1;
  }

  for (let i = 0; i < druid.maxDrugs; i++) {
    let drugStr = '';
    if (drugsTaken.length > i) {
      const drug = drugsTaken[i];
      const effectDescription = herbMap[drug.name].known ?
          herbMap[drug.name].effectDescription :
          '???';
      drugStr = `+ (${drug.daysRemaining}) ${drug.name} - ` +
          `${effectDescription}`;
    }
    writeToScreen(screen, x, y, '  ' + drugStr);
    y += 1;
  }

  for (let i = 0; i < 2; i++) {
    if (i < patient.powerups.length) {
      let str = `+ ${patient.powerups[i][0]}`;
      let powerupFn = patient.powerups[i][1];
      writeToScreen(
          screen, x, y, str,
          {type: 'POWERUP', patient: patient, pos: i, fn: powerupFn});
    }
    y += 1;
  }

  y += 1;
  displayInventory(druid, screen, 1, y, false);

  patient.clearOrganInfo();
  return y;
}

export function displayMiasmaPatches(druid, screen, x = 0, y = 0) {
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
    writeToScreen(
        screen, x, y, `${locationStr.padEnd(10)} ${strengthStr}`,
        {type: 'REMOVE_MIASMA', pos: i});
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
  return ' ';
}

export function displayInventory(
    druid, screen, x = 0, y = 0, all = true, potion = false,
    environment = undefined, environmentPos = 0) {
  if (all) {
    if (potion) {
      writeToScreen(screen, x, y, '[POTION MODE]', {type: 'BACK_TO_INVENTORY'});
    } else {
      writeToScreen(
          screen, x, y, '[INVENTORY MODE]', {type: 'COMBINE_POTIONS'});
    }
  }

  if (environment === undefined) {
    y += 2;
  }

  let i = 0;
  const total = zfill(
      Object.values(druid.herbGathering.inventory).reduce((a, b) => a + b, 0));

  for (const [herb, quantity] of Object.entries(
           druid.herbGathering.inventory)) {
    if (environment !== undefined) {
      if (!environment.hasHerb(herb)) {
        continue;
      }
    } else if (quantity == 0 && !all) {
      continue;
    }

    const herbName = herb + ' '.repeat(14 - herb.length);
    const qty = zfill(quantity);
    const runes = herbMap[herb].revealedRunes.join('');
    const effectDescription =
        herbMap[herb].known ? herbMap[herb].effectDescription : '???';

    // const env = (all) ? getEnv(herb) : '';
    const env = druid.herbGathering.isCloseToDeterioration(herb) ? '~' : ' ';

    let selected = ' ';
    if (druid.selectedHerbs.includes(herb)) {
      selected = '>';
    }

    let inventoryLine =
        `${env}${selected}${qty} ${herbName} ${runes} ${effectDescription}`;

    let effect = {type: 'TREAT_PATIENT', herb: herb};
    if (potion) {
      effect = { type: 'SELECT_INGREDIENT', herb: herb }
    } else if (all) {
      effect = { type: 'DISCARD_INGREDIENT', herb: herb }
    } else if (environment !== undefined) {
      effect = { type: 'GATHER', pos: environmentPos }
    }

    writeToScreen(screen, x, y, inventoryLine, effect);
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

export function displayEnvironment(druid, screen, x = 0, y = 0) {
  environments.forEach((environment, i) => {
    const environmentLine =
        `${environment.name} ${environment.sumHerbChances().toFixed(2)}`;
    writeToScreen(
        screen, x, y + i * 7, environmentLine, {type: 'GATHER', pos: i});

    displayInventory(
        druid, screen, x, y + i * 7 + 1, false, false, environment, i);
    // let herbs = `${environment.getKnownHerbs1()}`;
    // writeToScreen(screen, x, y + i * 4 + 1, herbs, {type: 'GATHER', pos: i});
    // herbs = `${environment.getKnownHerbs2()}`;
    // writeToScreen(screen, x, y + i * 4 + 2, herbs, {type: 'GATHER', pos: i});
  });
}

export function displayVillages(druid, screen, x = 0, y = 0) {
  villages.forEach((village, i) => {
    const villageLine = `${village.name}`;
    writeToScreen(screen, x, y + i * 2, villageLine, {type: 'TRAVEL', pos: i});
  });
}

export function displayDruid(druid, screen, x = 0, y = 0) {
  const levelInfo = `Druid Level: ${druid.level}`;
  const xpInfo = `XP: ${druid.xp} / ${druid.xpToNextLevel}`;
  writeToScreen(screen, x, y, levelInfo);
  writeToScreen(screen, x, y + 1, xpInfo);
  writeToScreen(screen, x, y + 2, `Crystals: ${druid.crystals}`);
}

function displayLog(druid, screen, x, y, log, clickHandlerType = null) {
  log = druid.processLogs(log, 40);

  const maxLines = 30;
  let start = druid.logStartAt;
  let end = druid.logStartAt + maxLines;
  if (druid.logStartAt > 0) {
    writeToScreen(
        screen, x, y, '.....',
        {type: 'MOVE_LOG_UP', maxLen: log.length - maxLines / 2});
    y += 1;
  }

  for (let i = start; i < end; i++) {
    if (i < 0 || i >= log.length) continue;

    let isTopHalf = (i - start) < maxLines / 2;
    clickHandlerType = isTopHalf ? 'MOVE_LOG_UP' : 'MOVE_LOG_DOWN';
    writeToScreen(
        screen, x, y, log[i],
        {type: clickHandlerType, maxLen: log.length - maxLines / 2});
    y += 1;
  }

  if (druid.logStartAt + maxLines < log.length) {
    writeToScreen(
        screen, x, y, '.....',
        {type: 'MOVE_LOG_DOWN', maxLen: log.length - maxLines / 2});
  }
}

export function displayPatientLog(druid, screen, x = 0, y = 0) {
  const patient = druid.currentVillage().patients[druid.cursorP];
  displayLog(druid, screen, x, y, patient.log, 'LOG_CLICK');
}

export function displayVillageLog(druid, screen, x = 0, y = 0) {
  const village = druid.currentVillage();
  displayLog(druid, screen, x, y, village.log, 'LOG_CLICK');
}

export function displayMessages(druid, screen, x = 0, y = 0) {
  displayLog(druid, screen, x, y, druid.msg);
}
