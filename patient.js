import {Disease, diseaseRegistry} from './disease.js';
import {availableHerbs, herbMap, updateHerbMap} from './herbs.js';

class Organ {
  constructor(name, system, patient) {
    this.name = name;
    this.system = system;
    this.hp = 10;
    this.critical = false;
    this.diseased = false;
    this.patient = patient;
    this.decrease = 0;
    this.justSpreaded = false;
    this.alreadyCountedDeath = false;
  }

  damage(damage) {
    if (this.patient.silvervineActive) {
      return;
    }

    damage = Math.min(this.hp, damage);
    this.hp -= damage;
    this.patient.logMsg(`${this.name} -${damage} HP (now ${this.hp})`);
    this.decrease -= damage;
    if (this.hp <= 0) {
      this.critical = true;
      this.patient.logMsg(`${this.name} is now critical`);
    }
  }

  treat(healing, canHealCritical = false) {
    healing *= this.patient.getMultiplier();

    if (!this.critical) {
      this.hp += healing;
      this.patient.logMsg(`${this.name} +${healing} HP (now ${this.hp})`);
      if (this.hp >= 10) {
        this.hp = 10;
        this.diseased = false;
        this.patient.logMsg(`${this.name} is no longer diseased`);
      }
    } else if (canHealCritical) {
      this.hp += healing;
      this.patient.logMsg(`${this.name} +${healing} HP (now ${this.hp})`);
      this.patient.logMsg(`${this.name} is no longer critical`);
      this.critical = false;
      if (this.hp >= 10) {
        this.hp = 10;
        this.diseased = false;
        this.patient.logMsg(`${this.name} is no longer diseased`);
      }
    }
  }
}

export class Patient {
  constructor(id) {
    this.id = id;
    this.organs = [
      new Organ('Heart', 'Cardiovascular', this),
      new Organ('Lungs', 'Respiratory', this),
      new Organ('Liver', 'Digestive', this),
      new Organ('Kidneys', 'Urinary', this),
      new Organ('Brain', 'Nervous', this),
    ];
    this.dead = false;
    this.cured = false;
    this.dragonscaleActive = false;  // Flag for Dragonscale Fungus effect
    this.silvervineActive = false;   // Flag for Silvervine effect
    this.silvervineCounter = 0;
    this.drugsTaken = [];
    this.days = 0;
    this.log = [];
    this.powerups = [];

    // Choose a random disease from the disease registry
    const randomDiseaseType =
        diseaseRegistry[Math.floor(Math.random() * diseaseRegistry.length)];

    // Initialize the disease with the chosen disease type
    this.disease = new Disease(randomDiseaseType, this);
    this.logMsg(`${this.id} contracted ${this.disease.diseaseType.name}`);
  }

  getMultiplier() {
    return this.dragonscaleActive ? 2 : 1;
  }

  progressDiseases(days) {
    this.days = days;
    // this.organs.forEach(organ => {
    //   if (organ.critical) {
    //     this.dead = true;
    //   }
    // });
    this.disease.progress(this);

    this.organs.forEach(organ => {
      organ.hp = Math.max(0, organ.hp);
    });

    // Reset the Silvervine effect after one turn
    this.silvervineCounter -= 1;
    if (this.silvervineCounter < 0) {
      this.silvervineActive = false;
    }
  }

  applyDrugs(druid, days) {
    this.drugsTaken.forEach(drug => {
      // this.logMsg(1, `${drug.name} applied its daily effect`);
      drug.dailyEffect(this);   // Apply the drug's effect
      drug.daysRemaining -= 1;  // Decrease duration
      if (drug.daysRemaining <= 0) {
        this.logMsg(`${drug.name} applied its effect`);
        drug['finalEffect'](this);  // Apply the final effect
        this.drugsTaken = this.drugsTaken.filter(
            d => d !== drug);  // Remove the drug if time is up
        this.powerups.push([`${drug.name} effect`, () => {
          druid.clearMsgs();
          druid.discoverHerbEffect(drug.name);
        }]);
      }
    });

    this.organs.forEach(organ => {
      organ.hp = Math.max(0, organ.hp);
    });
  }

  treatPatient(herbName, druid) {
    this.days = druid.days;
    if (this.drugsTaken.length >= this.maxDrugs) {
      return;
    }

    if (druid.herbGathering.useHerb(herbName)) {
      const isDragonscale = !this.dragonscaleActive;

      this.drugsTaken.push({
        'name': herbName,
        'finalEffect': herbMap[herbName].finalFunction,
        'dailyEffect': () => {},
        'daysRemaining': herbMap[herbName].duration,
      });

      if (!isDragonscale && this.dragonscaleActive) {
        this.dragonscaleActive = false;
      }

      this.logMsg(`Treated Patient ${this.id} with ${herbName}.`);
    }
  }

  isDead() {
    return this.organs.filter(organ => organ.critical).length >= 2;
  }

  isCured() {
    return this.organs.filter(organ => organ.diseased).length === 0;
  }

  getOrgan(organName) {
    return this.organs.find(organ => organ.name === organName) || null;
  }

  logMsg(msg) {
    this.log.push(`${this.days}: ${msg}`);
  }
}
