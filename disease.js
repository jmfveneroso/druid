const DISEASE_PROGRESSION = 2;

class DiseaseType {
  constructor(
      name, initialOrgan, hpReduction, spreadTime, diseaseProgression = 2,
      additionalEffects = null) {
    this.name = name;
    this.initialOrgan = initialOrgan;
    this.hpReduction = hpReduction;
    this.spreadTime = spreadTime;
    this.additionalEffects = additionalEffects;
    this.diseaseProgression = diseaseProgression;
    this.known = false;
  }

  applyAdditionalEffects(patient, affectedOrgans) {
    if (this.additionalEffects) {
      this.additionalEffects(patient, affectedOrgans);
    }
  }
}

export class Disease {
  constructor(diseaseType, patient, spreadChance = 0.05) {
    this.diseaseType = diseaseType;
    this.patient = patient;
    this.baseSpreadChance = spreadChance;
    this.spreadChance = spreadChance;
    this.spreadCounter = 0;
    this.spreadChanceReductionDuration = 0;
    this.diseaseCounter = this.diseaseType.diseaseProgression;
    this.affectedOrgans =
        this.patient.organs.filter(o => o.name === diseaseType.initialOrgan);
    this.affectedOrgans.forEach(organ => organ.diseased = true);
    const otherOrgans = this.patient.organs.filter(o => o.name !== diseaseType.initialOrgan && !o.diseased);

    if (otherOrgans.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherOrgans.length);
        const randomOrgan = otherOrgans[randomIndex];
    
        randomOrgan.diseased = true;
        this.affectedOrgans.push(randomOrgan);
    }
  }

  progress() {
    this.diseaseCounter -= 1;
    if (this.diseaseCounter > 0) return;

    this.affectedOrgans.forEach(organ => {
      if (organ.damage(this.diseaseType.hpReduction)) {
        this.spreadDisease();
      }
    });

    this.diseaseType.applyAdditionalEffects(this.patient, this.affectedOrgans);
    this.diseaseCounter = this.diseaseType.diseaseProgression;

    // this.spreadDisease();
  }

  spreadDisease() {
    this.spreadCounter += 1;
    // if (this.spreadCounter >= this.diseaseType.spreadTime) {
      this.spreadCounter = 0;
      const healthyOrgans = this.patient.organs.filter(o => !o.diseased);
      if (healthyOrgans.length > 0) {
        const newOrgan =
            healthyOrgans[Math.floor(Math.random() * healthyOrgans.length)];
        newOrgan.diseased = true;
        this.affectedOrgans.push(newOrgan);
        newOrgan.justSpreaded = true;
        this.patient.logMsg(`The disease spread to the ${newOrgan.name}.`);
      }
    // }
  }
}

// Effects functions
function noEffect(patient, affectedOrgans) {
}

function pulmonaryDecayEffect(patient, affectedOrgans) {
  const lungs = patient.getOrgan('Lungs');
  if (!lungs.diseased) return;

  if (lungs.hp < 5) {
    patient.getOrgan('Brain').damage(1);
  }
}

function neurotoxicInfectionEffect(patient, affectedOrgans) {
  if (affectedOrgans.length > 1 &&
      affectedOrgans[affectedOrgans.length - 1].name === 'Liver') {
    patient.organs.forEach(organ => {
      if (organ.name === 'Brain') {
        organ.treat(-1);  // Reduces Brain HP by 1 if it has spread to the Liver
      }
    });
  }
}

function renalNecrosisEffect(patient, affectedOrgans) {
  if (affectedOrgans.length > 1 &&
      affectedOrgans[affectedOrgans.length - 1].name === 'Liver') {
    const heart = patient.organs.filter(o => o.name === 'Heart');
    if (heart.length > 0 && Math.random() < 0.1) {
      heart[0].treat(-1);  // 10% chance to reduce Heart HP by 1
    }
  }
}

function cardiacConstrictionEffect(patient, affectedOrgans) {
  if (affectedOrgans.length >= 1 &&
      affectedOrgans[affectedOrgans.length - 1].name === 'Lungs') {
    const kidneys = patient.organs.filter(o => o.name === 'Kidneys');
    if (kidneys.length > 0) {
      kidneys[0].hp -= 1;  // Reduces Kidneys HP by 1 if spread to the Lungs
    }
  }
}

function hepaticDeteriorationEffect(patient, affectedOrgans) {
  if (affectedOrgans.length > 1 &&
      affectedOrgans[affectedOrgans.length - 1].name === 'Kidneys') {
    patient.organs.forEach(organ => {
      organ.treat(-2);  // Reduces the effectiveness of all healing herbs by 20%
    });
  }
}

function cerebralSepsisEffect(patient, affectedOrgans) {
  const heart = patient.organs.filter(o => o.name === 'Heart');
  if (heart.length > 0 && affectedOrgans.length > 1 &&
      affectedOrgans[affectedOrgans.length - 1].name === 'Heart') {
    patient.disease.spreadChance *= 1.5;  // Increases the spread chance by 50%
  }
}

function pulmonaryFibrosisEffect(patient, affectedOrgans) {
  patient.organs.forEach(organ => {
    if (organ.name === 'Lungs') {
      organ.hp -= 1;  // Reduces lung effectiveness by 1 HP
    }
  });
}

const pulmonaryFibrosis = new DiseaseType(
    'Pulmonary Fibrosis', 'Lungs', 1, 6, pulmonaryFibrosisEffect);

function cardiopulmonarySyndromeEffect(patient, affectedOrgans) {
  const liver = patient.organs.filter(o => o.name === 'Liver');
  if (liver.length > 0 && affectedOrgans.length > 2) {
    liver[0].hp -= 1;  // Reduces Liver HP by 1
  }
}

const cardiopulmonarySyndrome = new DiseaseType(
    'Cardiopulmonary Syndrome', 'Heart', 1, 5, cardiopulmonarySyndromeEffect);

function renalVenomEffect(patient, affectedOrgans) {
  const heart = patient.organs.filter(o => o.name === 'Heart');
  if (heart.length > 0) {
    heart[0].treat(-2);  // Reduces Heart HP by 2 when it spreads to the Heart
  }
}

const renalVenom =
    new DiseaseType('Renal Venom', 'Kidneys', 2, 6, renalVenomEffect);

function neurocardiacSyndromeEffect(patient, affectedOrgans) {
  if (affectedOrgans.length >= 2 &&
      affectedOrgans[affectedOrgans.length - 1].name === 'Heart') {
    const lungs = patient.organs.filter(o => o.name === 'Lungs');
    if (lungs.length > 0) {
      patient.disease.spreadChance +=
          0.15;  // Increases the spread chance by 15%
    }
  }
}

const neurocardiacSyndrome = new DiseaseType(
    'Neurocardiac Syndrome', 'Brain', 1, 4, neurocardiacSyndromeEffect);

// Possible initial organs the disease can affect
const initialOrgans = ['Lungs', 'Heart', 'Liver', 'Kidneys', 'Brain'];

// Possible rates of spread (in time steps)
const spreadTimes = [2, 3, 4, 5];

// Possible HP reduction rates per time step
const hpReductions = [1, 2];

// Possible additional effects (these can be functions or descriptions)
function slowHealingEffect(patient, affectedOrgans) {
  patient.organs.forEach(organ => {
    organ.hp -= 1;  // Example effect that slows healing for all organs
  });
}

const additionalEffects = [null, slowHealingEffect];

function generateRandomDisease() {
  const name = `${randomChoice([
    'Pulmonary', 'Cardio', 'Neuro', 'Hepato', 'Nephro'
  ])} ${randomChoice(['Decay', 'Rot', 'Infection', 'Blight', 'Plague'])}`;
  const initialOrgan = randomChoice(initialOrgans);
  const hpReduction = randomChoice(hpReductions);
  const spreadTime = randomChoice(spreadTimes);
  const additionalEffect = randomChoice(additionalEffects);

  return new DiseaseType(
      name, initialOrgan, hpReduction, spreadTime, additionalEffect);
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const randomDisease1 = generateRandomDisease();

const VIRULENCE = 10;

const pulmonaryDecay = new DiseaseType(
    'Pulmonary Decay', 'Lungs', 1, VIRULENCE, 2, noEffect);

const neurotoxicInfection = new DiseaseType(
    'Neurotoxic Infection', 'Brain', 1, VIRULENCE, 2, noEffect);

const renalNecrosis = new DiseaseType(
    'Renal Necrosis', 'Kidneys', 1, VIRULENCE, 2, noEffect);

const cardiacConstriction = new DiseaseType(
    'Cardiac Constriction', 'Heart', 1, VIRULENCE, 2, noEffect);

const hepaticDeterioration = new DiseaseType(
    'Hepatic Deterioration', 'Liver', 1, VIRULENCE, 2, noEffect);

const cerebralSepsis = new DiseaseType(
    'Cerebral Sepsis', 'Brain', 1, VIRULENCE, 2, noEffect);

export const diseaseRegistry = [
  pulmonaryDecay, neurotoxicInfection, renalNecrosis, cardiacConstriction,
  hepaticDeterioration,
  // cerebralSepsis,
  // pulmonaryFibrosis,
  // cardiopulmonarySyndrome,
  // renalVenom,
  // neurocardiacSyndrome,
  // randomDisease1,
];
