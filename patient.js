import {Disease, diseaseRegistry} from './disease.js';
import {herbMap} from './herbs.js';

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
  }

  damage(damage) {
    if (this.patient.silvervineActive) {
      return;
    }

    damage = Math.min(this.hp, damage);
    this.hp -= damage;
    this.patient.logMsg(`${this.name} ${damage} HP (now ${this.hp})`);
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
      this.patient.logMsg(`${this.name} ${healing} HP (now ${this.hp})`);
      if (this.hp >= 10) {
        this.hp = 10;
        this.diseased = false;
        this.patient.logMsg(`${this.name} is no longer diseased`);
      }
    } else if (canHealCritical) {
      this.hp += healing;
      this.patient.logMsg(`${this.name} ${healing} HP (now ${this.hp})`);
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
    this.organStates = [];
    this.lastCheckup = 0;
    this.shouldClearOrganInfo = false;

    // Choose a random disease from the disease registry
    const randomDiseaseType =
        diseaseRegistry[Math.floor(Math.random() * diseaseRegistry.length)];

    // Initialize the disease with the chosen disease type
    this.disease = new Disease(randomDiseaseType, this);
    this.logMsg(`${this.id} History`);
    this.logMsg(`Contracted ${this.disease.diseaseType.name}`);
  }

  getMultiplier() {
    return this.dragonscaleActive ? 2 : 1;
  }

  progressDiseases(days) {
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
      drug.dailyEffect(this);
      drug.daysRemaining -= 1;
      if (drug.daysRemaining <= 0) {
        this.logMsg(`${drug.name} applied its effect`);
        drug['finalEffect'](this);
        this.drugsTaken = this.drugsTaken.filter(d => d !== drug);

        if (!druid.knowsHerbEffect(drug.name)) {
          this.powerups.push([
            `${drug.name} effect`,
            () => {
              druid.clearMsgs();
              druid.discoverHerbEffect(drug.name);
              druid.setState('MSG');
            }
          ]);
        }
      }
    });

    this.organs.forEach(organ => {
      organ.hp = Math.max(0, organ.hp);
    });
  }

  progress(druid, days) {
    this.days = days;
    this.pushOrganState();
    
    if (this.shouldClearOrganInfo) {
      for (let i = 0; i < this.organs.length; i++) {
        this.organs[i].decrease = 0;
        this.organs[i].justSpreaded = false;
      }
      this.shouldClearOrganInfo = false;
    }

    this.progressDiseases(days);
    this.applyDrugs(druid, days);
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

      this.logMsg(`Treated with ${herbName}.`);
    }

    this.pushOrganState();
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

  pushOrganState() {
    let newOrgans = [
      new Organ('Heart', 'Cardiovascular', this),
      new Organ('Lungs', 'Respiratory', this),
      new Organ('Liver', 'Digestive', this),
      new Organ('Kidneys', 'Urinary', this),
      new Organ('Brain', 'Nervous', this),
    ];

    for (let i = 0; i < this.organs.length; i++) {
      newOrgans[i].hp = this.organs[i].hp;
      newOrgans[i].critical = this.organs[i].critical;
      newOrgans[i].diseased = this.organs[i].diseased;
      newOrgans[i].decrease = this.organs[i].decrease;
      newOrgans[i].justSpreaded = this.organs[i].justSpreaded;
    }

    let newDrugsTaken = [];
    for (let i = 0; i < this.drugsTaken.length; i++) {
      newDrugsTaken.push({
        'name': this.drugsTaken[i].name,
        'finalEffect': this.drugsTaken[i].finalEffect,
        'dailyEffect': this.drugsTaken[i].dailyEffect,
        'daysRemaining': this.drugsTaken[i].daysRemaining,
      });
    }
    
    this.organStates[this.days] = [newOrgans, newDrugsTaken];
  }

  logMsg(msg) {
    this.log.push(`${this.days}: ${msg}`);
  }
  
  getOrgans(theoreticalDays) {
    if (this.organStates[theoreticalDays] !== undefined) {
      return this.organStates[theoreticalDays];
    }

    return [this.organs, this.drugsTaken];
  }

  clearOrganInfo() {
    this.shouldClearOrganInfo = true;
  }
}
