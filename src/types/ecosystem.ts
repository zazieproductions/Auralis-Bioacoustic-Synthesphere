export type MorphologyType = 'jellyfish' | 'dendrite' | 'colony' | 'parasite' | 'spore' | 'crystalline';
export type SynthOscType = 'sine' | 'triangle' | 'sawtooth' | 'square' | 'fm' | 'noise' | 'pulse';
export type AcousticCallType = 'territorial' | 'mating' | 'bonding' | 'resource' | 'distress' | 'sync';
export type MusicalScale = 'none' | 'microtonal' | 'pentatonic' | 'dorian' | 'phrygian' | 'harmonic_minor' | 'just_intonation';

export interface Genome {
  // Morphology Genes
  bodyType: MorphologyType;
  size: number;              // 8 - 45
  symmetry: number;          // 2 - 10
  segmentation: number;      // 1 - 8
  branchingDepth: number;    // 1 - 4
  tentacleCount: number;     // 0 - 12
  tentacleLength: number;    // 8 - 80
  bioluminescence: number;   // 0.2 - 1.0
  pulseRate: number;         // 0.5 - 4.0 Hz
  hue: number;               // 0 - 360
  saturation: number;        // 40 - 100
  opacity: number;           // 0.35 - 0.95

  // Audio Synthesis Genes
  oscType: SynthOscType;
  baseFrequency: number;     // 35 - 1100 Hz
  harmonicity: number;       // 0.5 - 6.0
  fmIndex: number;           // 0 - 8.0
  fmMul: number;             // 0.5 - 5.0
  filterType: 'lowpass' | 'bandpass' | 'highpass';
  filterCutoff: number;      // 120 - 7500 Hz
  filterResonance: number;   // 0.5 - 16.0
  attack: number;            // 0.01 - 0.6s
  decay: number;             // 0.04 - 1.2s
  sustain: number;           // 0.0 - 0.7
  release: number;           // 0.08 - 2.0s
  callInterval: number;      // 1.5 - 12.0s
  acousticReach: number;     // 80 - 380 px

  // Behavioral Genes
  maxSpeed: number;          // 0.6 - 3.2
  turnRate: number;          // 0.03 - 0.18
  sensoryRadius: number;     // 60 - 320
  flockingAffinity: number;   // -1.0 to 1.0
  acousticCuriosity: number;  // 0.0 to 1.0
  aggression: number;        // 0.0 to 1.0
  acousticSyncTendency: number; // 0.0 to 1.0

  // Metabolism & Life Genes
  metabolicRate: number;     // 0.02 - 0.08
  maxEnergy: number;         // 70 - 200
  reproductionThreshold: number; // 60 - 160
  lifespan: number;          // 45 - 240 s
  mutationRate: number;      // 0.03 - 0.25
}

export interface Organism {
  id: string;
  name: string;
  speciesId: string;
  speciesName: string;
  generation: number;
  lineageId: string;
  parentIds: [string | null, string | null];

  // Genome (genotype)
  genome: Genome;

  // Phenotype & spatial physics
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  targetHeading: number;

  // Life metrics
  age: number;               // seconds
  energy: number;            // 0 - maxEnergy
  health: number;            // 0 - 100
  alive: boolean;
  reproductiveCooldown: number;
  gestationProgress: number; // 0 - 1

  // Acoustic state
  isEmittingVoice: boolean;
  voiceLevel: number;        // 0..1 current visual envelope
  lastCallTime: number;
  lastCallType: AcousticCallType;
  acousticPhase: number;     // Kuramoto phase (0..2π)
  callTimer: number;

  // Behavior state
  behaviorState: 'foraging' | 'calling' | 'mating' | 'fleeing' | 'grazing' | 'socializing';
  targetOrganismId: string | null;

  // Interactive state
  isSelected: boolean;
  isSolo: boolean;
  isMuted: boolean;
  dragged: boolean;

  // Render caches
  tentacleJoints?: { x: number; y: number }[][];
}

export interface FoodParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  energyValue: number;
  type: 'organic' | 'crystalline' | 'plasma' | 'spore';
  size: number;
  hue: number;
  age: number;
  maxAge: number;
}

export interface AcousticSignal {
  id: string;
  originOrganismId: string;
  speciesId: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  signalType: AcousticCallType;
  frequency: number;
  hue: number;
  strength: number; // 1.0 fading to 0
}

export interface Habitat {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  accentColor: string;
  bgColor: string;
  viscosity: number;              // 0.90 - 0.99 (drag)
  nutrientSpawnRate: number;      // 0.2 - 3.0 items/sec
  maxNutrients: number;           // 30 - 150
  radiationMutationRate: number;  // 0.02 - 0.35
  acousticReverbTime: number;     // 0.2 - 6.0 seconds
  acousticFilterCutoff: number;   // 1000 - 16000 Hz
  ambientDroneFreq: number;       // base drone Hz
  ambientDroneGain: number;       // 0 - 0.25
  ambientDroneType: 'sub' | 'shimmer' | 'static' | 'warm' | 'void';
  pressure: number;               // 0.1 - 2.0
  temperature: number;            // 0 - 100
  nutrientType: 'organic' | 'crystalline' | 'plasma' | 'spore';
}

export interface EvolutionaryStats {
  population: number;
  speciesCount: number;
  generationMax: number;
  birthsTotal: number;
  deathsTotal: number;
  avgLifespan: number;
  sonicBiodiversityIndex: number; // Shannon index of frequency bins
  dominantSpecies: string;
  averageEnergy: number;
  mutationCount: number;
  activeVoicesCount: number;
}

export interface SpeciesRecord {
  id: string;
  name: string;
  color: string;
  bodyType: MorphologyType;
  oscType: SynthOscType;
  avgFreq: number;
  count: number;
  firstGeneration: number;
  extinct: boolean;
  historyCounts: number[];
}

export interface ConductorCue {
  id: string;
  timeSeconds: number;
  title: string;
  action: 'nutrient_bloom' | 'radiation_burst' | 'abyssal_chill' | 'harmonic_resonance' | 'static_discharge';
  executed: boolean;
}

export interface SavedSpecimen {
  id: string;
  name: string;
  speciesName: string;
  savedAt: number;
  genome: Genome;
  generation: number;
  description?: string;
}
