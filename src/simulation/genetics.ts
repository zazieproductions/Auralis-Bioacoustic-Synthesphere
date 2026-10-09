import { Genome, MorphologyType, SynthOscType, SavedSpecimen } from '../types/ecosystem';

// Fast seeded PRNG (Mulberry32)
export function createPRNG(seed: number = Date.now()) {
  let s = Math.floor(seed) >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let globalRng = Math.random;
export function setGlobalSeed(seed: number) {
  globalRng = createPRNG(seed);
}

export function randomRange(min: number, max: number, rng = globalRng): number {
  return min + rng() * (max - min);
}

export function randomChoice<T>(items: T[], rng = globalRng): T {
  return items[Math.floor(rng() * items.length)];
}

const MORPHOLOGY_TYPES: MorphologyType[] = [
  'jellyfish',
  'dendrite',
  'colony',
  'parasite',
  'spore',
  'crystalline'
];

const SYNTH_OSC_TYPES: SynthOscType[] = [
  'sine',
  'triangle',
  'sawtooth',
  'square',
  'fm',
  'noise',
  'pulse'
];

// Generate a brand-new random genome
export function createRandomGenome(typeHint?: MorphologyType, rng = globalRng): Genome {
  const bodyType = typeHint || randomChoice(MORPHOLOGY_TYPES, rng);
  const oscType = randomChoice(SYNTH_OSC_TYPES, rng);

  // Large organisms naturally have lower base pitch, smaller have higher
  const size = randomRange(10, 36, rng);
  const sizeFactor = (36 - size) / 26; // 0 (large) to 1 (small)
  const baseFrequency = randomRange(40, 150, rng) * (1 - sizeFactor) + randomRange(200, 950, rng) * sizeFactor;

  return {
    bodyType,
    size,
    symmetry: Math.floor(randomRange(2, 9, rng)),
    segmentation: Math.floor(randomRange(1, 7, rng)),
    branchingDepth: Math.floor(randomRange(1, 4, rng)),
    tentacleCount: bodyType === 'jellyfish' ? Math.floor(randomRange(3, 9, rng)) : Math.floor(randomRange(0, 5, rng)),
    tentacleLength: randomRange(15, 65, rng),
    bioluminescence: randomRange(0.4, 0.95, rng),
    pulseRate: randomRange(0.8, 3.5, rng),
    hue: Math.floor(randomRange(0, 360, rng)),
    saturation: randomRange(60, 95, rng),
    opacity: randomRange(0.5, 0.9, rng),

    oscType,
    baseFrequency: Math.round(baseFrequency),
    harmonicity: Math.round(randomRange(1, 5, rng) * 2) / 2,
    fmIndex: oscType === 'fm' ? randomRange(1.5, 6.0, rng) : randomRange(0, 3, rng),
    fmMul: randomRange(0.5, 4.0, rng),
    filterType: randomChoice(['lowpass', 'bandpass', 'highpass'], rng),
    filterCutoff: randomRange(300, 5500, rng),
    filterResonance: randomRange(1.0, 9.0, rng),
    attack: randomRange(0.02, 0.4, rng),
    decay: randomRange(0.08, 0.9, rng),
    sustain: randomRange(0.05, 0.6, rng),
    release: randomRange(0.1, 1.4, rng),
    callInterval: randomRange(2.0, 8.5, rng),
    acousticReach: randomRange(110, 320, rng),

    maxSpeed: randomRange(0.8, 2.6, rng),
    turnRate: randomRange(0.04, 0.14, rng),
    sensoryRadius: randomRange(90, 260, rng),
    flockingAffinity: randomRange(-0.6, 0.8, rng),
    acousticCuriosity: randomRange(0.2, 0.9, rng),
    aggression: randomRange(0.05, 0.7, rng),
    acousticSyncTendency: randomRange(0.1, 0.85, rng),

    metabolicRate: randomRange(0.03, 0.07, rng),
    maxEnergy: randomRange(80, 160, rng),
    reproductionThreshold: randomRange(80, 140, rng),
    lifespan: randomRange(60, 180, rng),
    mutationRate: randomRange(0.05, 0.18, rng)
  };
}

// Mutate a genome with heritable point mutations and environmental radiation
export function mutateGenome(parent: Genome, radiationMultiplier: number = 1.0, rng = globalRng): Genome {
  const mutRate = Math.min(0.6, parent.mutationRate * radiationMultiplier);
  const child = { ...parent };

  // Helper mutation mutator
  const mutateFloat = (val: number, min: number, max: number, strength = 0.15) => {
    if (rng() < mutRate) {
      const delta = (rng() * 2 - 1) * (max - min) * strength;
      return Math.max(min, Math.min(max, val + delta));
    }
    return val;
  };

  const mutateInt = (val: number, min: number, max: number) => {
    if (rng() < mutRate) {
      const step = rng() < 0.5 ? -1 : 1;
      return Math.max(min, Math.min(max, val + step));
    }
    return val;
  };

  // Morphology mutations
  if (rng() < mutRate * 0.1) {
    child.bodyType = randomChoice(MORPHOLOGY_TYPES, rng);
  }
  child.size = mutateFloat(parent.size, 8, 45);
  child.symmetry = mutateInt(parent.symmetry, 2, 10);
  child.segmentation = mutateInt(parent.segmentation, 1, 8);
  child.branchingDepth = mutateInt(parent.branchingDepth, 1, 4);
  child.tentacleCount = mutateInt(parent.tentacleCount, 0, 12);
  child.tentacleLength = mutateFloat(parent.tentacleLength, 8, 80);
  child.bioluminescence = mutateFloat(parent.bioluminescence, 0.2, 1.0);
  child.pulseRate = mutateFloat(parent.pulseRate, 0.5, 4.0);
  child.hue = (parent.hue + (rng() < mutRate ? (rng() * 2 - 1) * 35 : 0) + 360) % 360;
  child.saturation = mutateFloat(parent.saturation, 40, 100);
  child.opacity = mutateFloat(parent.opacity, 0.35, 0.95);

  // Audio synthesis mutations
  if (rng() < mutRate * 0.15) {
    child.oscType = randomChoice(SYNTH_OSC_TYPES, rng);
  }
  child.baseFrequency = Math.round(mutateFloat(parent.baseFrequency, 35, 1200, 0.18));
  child.harmonicity = mutateFloat(parent.harmonicity, 0.5, 6.0);
  child.fmIndex = mutateFloat(parent.fmIndex, 0, 8.0);
  child.fmMul = mutateFloat(parent.fmMul, 0.5, 5.0);
  if (rng() < mutRate * 0.12) {
    child.filterType = randomChoice(['lowpass', 'bandpass', 'highpass'], rng);
  }
  child.filterCutoff = mutateFloat(parent.filterCutoff, 120, 7500);
  child.filterResonance = mutateFloat(parent.filterResonance, 0.5, 16.0);
  child.attack = mutateFloat(parent.attack, 0.01, 0.6);
  child.decay = mutateFloat(parent.decay, 0.04, 1.2);
  child.sustain = mutateFloat(parent.sustain, 0.0, 0.7);
  child.release = mutateFloat(parent.release, 0.08, 2.0);
  child.callInterval = mutateFloat(parent.callInterval, 1.5, 12.0);
  child.acousticReach = mutateFloat(parent.acousticReach, 80, 380);

  // Behavioral mutations
  child.maxSpeed = mutateFloat(parent.maxSpeed, 0.6, 3.2);
  child.turnRate = mutateFloat(parent.turnRate, 0.03, 0.18);
  child.sensoryRadius = mutateFloat(parent.sensoryRadius, 60, 320);
  child.flockingAffinity = mutateFloat(parent.flockingAffinity, -1.0, 1.0);
  child.acousticCuriosity = mutateFloat(parent.acousticCuriosity, 0.0, 1.0);
  child.aggression = mutateFloat(parent.aggression, 0.0, 1.0);
  child.acousticSyncTendency = mutateFloat(parent.acousticSyncTendency, 0.0, 1.0);

  // Metabolism
  child.metabolicRate = mutateFloat(parent.metabolicRate, 0.02, 0.08);
  child.maxEnergy = mutateFloat(parent.maxEnergy, 70, 200);
  child.reproductionThreshold = mutateFloat(parent.reproductionThreshold, 60, 160);
  child.lifespan = mutateFloat(parent.lifespan, 45, 240);
  child.mutationRate = mutateFloat(parent.mutationRate, 0.03, 0.25);

  return child;
}

// Genetic crossover of two parents
export function crossoverGenomes(parentA: Genome, parentB: Genome, rng = globalRng): Genome {
  const child: any = {};
  const keys = Object.keys(parentA) as (keyof Genome)[];
  for (const k of keys) {
    if (typeof parentA[k] === 'number') {
      // 50% chance inheritance or interpolation
      const choice = rng();
      if (choice < 0.45) child[k] = parentA[k];
      else if (choice < 0.9) child[k] = parentB[k];
      else child[k] = ((parentA[k] as number) + (parentB[k] as number)) / 2;
    } else {
      child[k] = rng() < 0.5 ? parentA[k] : parentB[k];
    }
  }
  return child as Genome;
}

// Generate scientific species designation from genome traits
export function classifySpecies(genome: Genome): { speciesId: string; speciesName: string } {
  const prefixes: Record<MorphologyType, string> = {
    jellyfish: 'Aura',
    dendrite: 'Chrono',
    colony: 'Poly',
    parasite: 'Kryp',
    spore: 'Biolum',
    crystalline: 'Prism'
  };

  const suffixes: Record<SynthOscType, string> = {
    sine: 'vox',
    triangle: 'chorda',
    sawtooth: 'serrata',
    square: 'pulsar',
    fm: 'timbria',
    noise: 'fractalis',
    pulse: 'staccata'
  };

  const p = prefixes[genome.bodyType] || 'Xeno';
  const s = suffixes[genome.oscType] || 'sonus';

  // Pitch tier (Basso, Mezzo, Alto, Sopra)
  let tier = 'Med';
  if (genome.baseFrequency < 100) tier = 'Basso';
  else if (genome.baseFrequency < 280) tier = 'Grave';
  else if (genome.baseFrequency < 600) tier = 'Alto';
  else tier = 'Aero';

  // Hue band ID (1 to 12)
  const hueBand = Math.floor(genome.hue / 30);
  const speciesId = `${p.toLowerCase()}_${genome.oscType}_${tier.toLowerCase()}_h${hueBand}`;
  const speciesName = `${p} ${tier}-${s}`;

  return { speciesId, speciesName };
}

// Generate a unique specimen personal name
const GREEK_LETTERS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Theta', 'Zeta', 'Sigma', 'Omega', 'Psi', 'Epsilon', 'Nova', 'Vesper'];
export function generateOrganismName(speciesName: string, idNum: number): string {
  const greek = GREEK_LETTERS[idNum % GREEK_LETTERS.length];
  const code = (idNum % 899 + 100).toString();
  return `${speciesName.split(' ')[0]} ${greek}-${code}`;
}

// 6 Iconic Alien Archetypes for the Specimen Library
export const SPECIMEN_ARCHETYPES: SavedSpecimen[] = [
  {
    id: 'specimen-vespera-drone',
    name: 'Vespera Prime',
    speciesName: 'Aura Basso-vox',
    savedAt: Date.now() - 100000,
    generation: 1,
    description: 'Abyssal leviathan jellyfish emitting deep, resonant sub-bass drones and sweeping harmonic textures.',
    genome: {
      bodyType: 'jellyfish',
      size: 38,
      symmetry: 6,
      segmentation: 4,
      branchingDepth: 2,
      tentacleCount: 8,
      tentacleLength: 68,
      bioluminescence: 0.95,
      pulseRate: 1.1,
      hue: 205,
      saturation: 88,
      opacity: 0.85,
      oscType: 'sine',
      baseFrequency: 55,
      harmonicity: 2.0,
      fmIndex: 3.2,
      fmMul: 1.0,
      filterType: 'lowpass',
      filterCutoff: 480,
      filterResonance: 4.5,
      attack: 0.35,
      decay: 0.8,
      sustain: 0.55,
      release: 1.8,
      callInterval: 4.8,
      acousticReach: 320,
      maxSpeed: 1.1,
      turnRate: 0.05,
      sensoryRadius: 220,
      flockingAffinity: 0.4,
      acousticCuriosity: 0.8,
      aggression: 0.1,
      acousticSyncTendency: 0.75,
      metabolicRate: 0.03,
      maxEnergy: 160,
      reproductionThreshold: 110,
      lifespan: 160,
      mutationRate: 0.06
    }
  },
  {
    id: 'specimen-prismata-bell',
    name: 'Prismata Sol',
    speciesName: 'Prism Alto-chorda',
    savedAt: Date.now() - 80000,
    generation: 1,
    description: 'Crystalline multi-faceted entity that sings in pure harmonic overtone cascades and glass-chime pulses.',
    genome: {
      bodyType: 'crystalline',
      size: 22,
      symmetry: 8,
      segmentation: 5,
      branchingDepth: 1,
      tentacleCount: 0,
      tentacleLength: 12,
      bioluminescence: 0.88,
      pulseRate: 2.4,
      hue: 165,
      saturation: 90,
      opacity: 0.78,
      oscType: 'triangle',
      baseFrequency: 440,
      harmonicity: 3.0,
      fmIndex: 1.8,
      fmMul: 2.5,
      filterType: 'bandpass',
      filterCutoff: 1800,
      filterResonance: 8.0,
      attack: 0.04,
      decay: 0.4,
      sustain: 0.2,
      release: 1.2,
      callInterval: 2.8,
      acousticReach: 240,
      maxSpeed: 1.8,
      turnRate: 0.09,
      sensoryRadius: 180,
      flockingAffinity: 0.2,
      acousticCuriosity: 0.85,
      aggression: 0.15,
      acousticSyncTendency: 0.6,
      metabolicRate: 0.045,
      maxEnergy: 120,
      reproductionThreshold: 90,
      lifespan: 110,
      mutationRate: 0.08
    }
  },
  {
    id: 'specimen-glitch-crawler',
    name: 'Glitch Xenon-9',
    speciesName: 'Kryp Aero-fractalis',
    savedAt: Date.now() - 60000,
    generation: 1,
    description: 'Erratic electric parasite adapted to static marshes, crackling with bitcrush clicks and sudden frequency sweeps.',
    genome: {
      bodyType: 'parasite',
      size: 16,
      symmetry: 3,
      segmentation: 6,
      branchingDepth: 1,
      tentacleCount: 3,
      tentacleLength: 25,
      bioluminescence: 0.98,
      pulseRate: 3.8,
      hue: 48,
      saturation: 100,
      opacity: 0.9,
      oscType: 'noise',
      baseFrequency: 680,
      harmonicity: 4.5,
      fmIndex: 5.5,
      fmMul: 3.2,
      filterType: 'highpass',
      filterCutoff: 2400,
      filterResonance: 9.5,
      attack: 0.015,
      decay: 0.12,
      sustain: 0.05,
      release: 0.15,
      callInterval: 1.6,
      acousticReach: 170,
      maxSpeed: 2.8,
      turnRate: 0.16,
      sensoryRadius: 210,
      flockingAffinity: -0.4,
      acousticCuriosity: 0.95,
      aggression: 0.8,
      acousticSyncTendency: 0.2,
      metabolicRate: 0.065,
      maxEnergy: 90,
      reproductionThreshold: 75,
      lifespan: 75,
      mutationRate: 0.18
    }
  },
  {
    id: 'specimen-chrono-synapse',
    name: 'Synapsis Arc',
    speciesName: 'Chrono Grave-timbria',
    savedAt: Date.now() - 40000,
    generation: 1,
    description: 'Fractal dendritic colony acting as an organic neural network; transmits rhythmic FM modulation pulses to neighbors.',
    genome: {
      bodyType: 'dendrite',
      size: 32,
      symmetry: 5,
      segmentation: 4,
      branchingDepth: 3,
      tentacleCount: 5,
      tentacleLength: 45,
      bioluminescence: 0.8,
      pulseRate: 1.8,
      hue: 285,
      saturation: 80,
      opacity: 0.75,
      oscType: 'fm',
      baseFrequency: 164,
      harmonicity: 2.5,
      fmIndex: 4.8,
      fmMul: 1.5,
      filterType: 'lowpass',
      filterCutoff: 1200,
      filterResonance: 3.8,
      attack: 0.12,
      decay: 0.6,
      sustain: 0.35,
      release: 0.9,
      callInterval: 3.4,
      acousticReach: 280,
      maxSpeed: 1.2,
      turnRate: 0.06,
      sensoryRadius: 240,
      flockingAffinity: 0.7,
      acousticCuriosity: 0.9,
      aggression: 0.05,
      acousticSyncTendency: 0.92,
      metabolicRate: 0.04,
      maxEnergy: 140,
      reproductionThreshold: 100,
      lifespan: 140,
      mutationRate: 0.07
    }
  },
  {
    id: 'specimen-spora-nebula',
    name: 'Aurelia Spore',
    speciesName: 'Biolum Alto-pulsar',
    savedAt: Date.now() - 20000,
    generation: 1,
    description: 'Luminous spore cluster with orbiting planetary droplets; delivers soothing square-wave pulse chords and polyrhythms.',
    genome: {
      bodyType: 'spore',
      size: 26,
      symmetry: 6,
      segmentation: 3,
      branchingDepth: 1,
      tentacleCount: 0,
      tentacleLength: 15,
      bioluminescence: 0.92,
      pulseRate: 2.2,
      hue: 135,
      saturation: 85,
      opacity: 0.7,
      oscType: 'pulse',
      baseFrequency: 330,
      harmonicity: 1.5,
      fmIndex: 2.2,
      fmMul: 2.0,
      filterType: 'bandpass',
      filterCutoff: 1500,
      filterResonance: 5.0,
      attack: 0.08,
      decay: 0.35,
      sustain: 0.4,
      release: 0.7,
      callInterval: 2.4,
      acousticReach: 210,
      maxSpeed: 1.4,
      turnRate: 0.07,
      sensoryRadius: 190,
      flockingAffinity: 0.65,
      acousticCuriosity: 0.75,
      aggression: 0.05,
      acousticSyncTendency: 0.8,
      metabolicRate: 0.038,
      maxEnergy: 110,
      reproductionThreshold: 85,
      lifespan: 120,
      mutationRate: 0.09
    }
  },
  {
    id: 'specimen-poly-colony',
    name: 'Polymeris Zeta',
    speciesName: 'Poly Grave-serrata',
    savedAt: Date.now() - 10000,
    generation: 1,
    description: 'Multi-cellular cellular conglomerate pulsing in sync; generates rich sawtooth swells with warm analog filtering.',
    genome: {
      bodyType: 'colony',
      size: 30,
      symmetry: 4,
      segmentation: 5,
      branchingDepth: 2,
      tentacleCount: 2,
      tentacleLength: 20,
      bioluminescence: 0.84,
      pulseRate: 1.5,
      hue: 15,
      saturation: 90,
      opacity: 0.8,
      oscType: 'sawtooth',
      baseFrequency: 110,
      harmonicity: 2.0,
      fmIndex: 2.0,
      fmMul: 1.0,
      filterType: 'lowpass',
      filterCutoff: 800,
      filterResonance: 6.0,
      attack: 0.18,
      decay: 0.5,
      sustain: 0.45,
      release: 1.1,
      callInterval: 3.8,
      acousticReach: 260,
      maxSpeed: 1.0,
      turnRate: 0.05,
      sensoryRadius: 200,
      flockingAffinity: 0.8,
      acousticCuriosity: 0.7,
      aggression: 0.1,
      acousticSyncTendency: 0.88,
      metabolicRate: 0.035,
      maxEnergy: 130,
      reproductionThreshold: 95,
      lifespan: 150,
      mutationRate: 0.06
    }
  }
];
