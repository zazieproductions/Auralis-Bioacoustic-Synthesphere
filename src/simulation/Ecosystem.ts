import {
  Genome,
  Organism,
  FoodParticle,
  AcousticSignal,
  Habitat,
  EvolutionaryStats,
  SpeciesRecord,
  AcousticCallType
} from '../types/ecosystem';
import {
  createRandomGenome,
  mutateGenome,
  crossoverGenomes,
  classifySpecies,
  generateOrganismName,
  randomRange
} from './genetics';
import { globalAudioEngine } from '../audio/AudioEngine';

export class Ecosystem {
  public worldWidth: number = 2200;
  public worldHeight: number = 1800;

  public organisms: Organism[] = [];
  public foods: FoodParticle[] = [];
  public acousticSignals: AcousticSignal[] = [];
  public speciesRegistry: Map<string, SpeciesRecord> = new Map();

  public habitat: Habitat;
  public selectedOrganism: Organism | null = null;
  public simSpeed: number = 1.0;
  public isPaused: boolean = false;

  // Evolutionary statistics
  public stats: EvolutionaryStats = {
    population: 0,
    speciesCount: 0,
    generationMax: 1,
    birthsTotal: 0,
    deathsTotal: 0,
    avgLifespan: 0,
    sonicBiodiversityIndex: 0,
    dominantSpecies: 'None',
    averageEnergy: 100,
    mutationCount: 0,
    activeVoicesCount: 0
  };

  private nextId = 1;
  private nextFoodId = 1;
  private nextSignalId = 1;
  private nutrientAccumulator = 0;
  private timeElapsed = 0;
  private historySnapshotTimer = 0;

  constructor(habitat: Habitat, initialPopulationCount: number = 26) {
    this.habitat = habitat;
    this.seedInitialPopulation(initialPopulationCount);
  }

  // Populate initial ecosystem with diverse organisms
  public seedInitialPopulation(count: number = 26) {
    this.organisms = [];
    this.foods = [];
    this.acousticSignals = [];
    this.speciesRegistry.clear();
    this.selectedOrganism = null;
    this.nextId = 1;

    for (let i = 0; i < count; i++) {
      const genome = createRandomGenome();
      const org = this.createOrganismFromGenome(
        genome,
        Math.random() * (this.worldWidth - 200) + 100,
        Math.random() * (this.worldHeight - 200) + 100,
        1,
        'lineage_' + i,
        [null, null]
      );
      this.organisms.push(org);
    }

    // Seed initial food particles
    for (let i = 0; i < this.habitat.maxNutrients * 0.7; i++) {
      this.spawnFoodParticle();
    }

    this.updateStats();
  }

  // Create an organism instance from a genome
  public createOrganismFromGenome(
    genome: Genome,
    x: number,
    y: number,
    generation: number,
    lineageId: string,
    parentIds: [string | null, string | null]
  ): Organism {
    const idNum = this.nextId++;
    const id = `org_${idNum}`;
    const { speciesId, speciesName } = classifySpecies(genome);
    const name = generateOrganismName(speciesName, idNum);

    // Register species in taxonomy
    if (!this.speciesRegistry.has(speciesId)) {
      this.speciesRegistry.set(speciesId, {
        id: speciesId,
        name: speciesName,
        color: `hsl(${genome.hue}, ${genome.saturation}%, 60%)`,
        bodyType: genome.bodyType,
        oscType: genome.oscType,
        avgFreq: genome.baseFrequency,
        count: 1,
        firstGeneration: generation,
        extinct: false,
        historyCounts: [1]
      });
    } else {
      const spec = this.speciesRegistry.get(speciesId)!;
      spec.count++;
      spec.extinct = false;
    }

    const angle = Math.random() * Math.PI * 2;
    const speed = randomRange(0.2, genome.maxSpeed * 0.5);

    return {
      id,
      name,
      speciesId,
      speciesName,
      generation,
      lineageId,
      parentIds,
      genome,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      heading: angle,
      targetHeading: angle,
      age: 0,
      energy: genome.maxEnergy * 0.85,
      health: 100,
      alive: true,
      reproductiveCooldown: randomRange(8, 16),
      gestationProgress: 0,
      isEmittingVoice: false,
      voiceLevel: 0,
      lastCallTime: 0,
      lastCallType: 'sync',
      acousticPhase: Math.random() * Math.PI * 2,
      callTimer: randomRange(0.5, genome.callInterval),
      behaviorState: 'foraging',
      targetOrganismId: null,
      isSelected: false,
      isSolo: false,
      isMuted: false,
      dragged: false
    };
  }

  // Set or switch active habitat
  public setHabitat(newHabitat: Habitat) {
    this.habitat = newHabitat;
    globalAudioEngine.setReverbTime(newHabitat.acousticReverbTime);
    globalAudioEngine.setAmbientDrone(
      newHabitat.ambientDroneFreq,
      newHabitat.ambientDroneGain,
      newHabitat.ambientDroneType
    );
  }

  // Add a saved specimen from the library/vault
  public spawnSavedSpecimen(genome: Genome, customName?: string): Organism {
    const org = this.createOrganismFromGenome(
      genome,
      this.worldWidth / 2 + randomRange(-150, 150),
      this.worldHeight / 2 + randomRange(-150, 150),
      this.stats.generationMax,
      'vault_' + Date.now().toString(36),
      [null, null]
    );
    if (customName) {
      org.name = customName;
    }
    this.organisms.push(org);
    this.updateStats();
    return org;
  }

  // Spawn food particle
  public spawnFoodParticle(x?: number, y?: number, typeHint?: 'organic' | 'crystalline' | 'plasma' | 'spore') {
    const type = typeHint || this.habitat.nutrientType;
    let hue = 120;
    if (type === 'crystalline') hue = 180;
    else if (type === 'plasma') hue = 50;
    else if (type === 'spore') hue = 290;

    this.foods.push({
      id: `food_${this.nextFoodId++}`,
      x: x !== undefined ? x : Math.random() * (this.worldWidth - 80) + 40,
      y: y !== undefined ? y : Math.random() * (this.worldHeight - 80) + 40,
      vx: randomRange(-0.25, 0.25),
      vy: randomRange(-0.25, 0.25),
      energyValue: randomRange(25, 55),
      type,
      size: randomRange(3.5, 6.5),
      hue: (hue + randomRange(-25, 25) + 360) % 360,
      age: 0,
      maxAge: randomRange(40, 120)
    });
  }

  // Trigger acoustic signal from an organism
  public emitOrganismVoice(org: Organism, callType: AcousticCallType) {
    if (!org.alive || org.isMuted) return;

    // Check solo mode
    const hasSolo = this.organisms.some((o) => o.isSolo);
    if (hasSolo && !org.isSolo) return;

    // Stereo pan based on world position
    const panX = ((org.x / this.worldWidth) * 2 - 1) * 0.85;

    // Trigger procedural Web Audio API voice
    globalAudioEngine.triggerVoice(
      org.genome,
      panX,
      callType,
      org.isSolo,
      org === this.selectedOrganism
    );

    org.isEmittingVoice = true;
    org.voiceLevel = 1.0;
    org.lastCallTime = this.timeElapsed;
    org.lastCallType = callType;

    // Spawn propagating acoustic wave in medium
    this.acousticSignals.push({
      id: `sig_${this.nextSignalId++}`,
      originOrganismId: org.id,
      speciesId: org.speciesId,
      x: org.x,
      y: org.y,
      radius: org.genome.size * 0.8,
      maxRadius: org.genome.acousticReach,
      speed: 2.5 + (this.habitat.pressure * 0.5),
      signalType: callType,
      frequency: org.genome.baseFrequency,
      hue: org.genome.hue,
      strength: 1.0
    });
  }

  // Main simulation tick
  public update(dt: number) {
    if (this.isPaused) return;

    const scaledDt = dt * this.simSpeed;
    this.timeElapsed += scaledDt;

    // 1. Habitat nutrient generation
    this.nutrientAccumulator += this.habitat.nutrientSpawnRate * scaledDt;
    if (this.nutrientAccumulator >= 1.0 && this.foods.length < this.habitat.maxNutrients) {
      this.spawnFoodParticle();
      this.nutrientAccumulator -= 1.0;
    }

    // Auto-rescue population if dropping critically low (< 12)
    if (this.organisms.length < 12) {
      const g = createRandomGenome();
      this.organisms.push(
        this.createOrganismFromGenome(
          g,
          Math.random() * (this.worldWidth - 100) + 50,
          Math.random() * (this.worldHeight - 100) + 50,
          this.stats.generationMax,
          'rescue_' + Date.now().toString(36),
          [null, null]
        )
      );
    }

    // 2. Update Foods
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const f = this.foods[i];
      f.x += f.vx;
      f.y += f.vy;
      f.age += scaledDt;

      // Soft bounce on walls
      if (f.x < 10 || f.x > this.worldWidth - 10) f.vx *= -1;
      if (f.y < 10 || f.y > this.worldHeight - 10) f.vy *= -1;

      if (f.age > f.maxAge) {
        this.foods.splice(i, 1);
      }
    }

    // 3. Update Acoustic Signals (Propagating waves)
    for (let i = this.acousticSignals.length - 1; i >= 0; i--) {
      const sig = this.acousticSignals[i];
      sig.radius += sig.speed * (scaledDt * 60);
      sig.strength = 1.0 - sig.radius / sig.maxRadius;

      if (sig.radius >= sig.maxRadius || sig.strength <= 0) {
        this.acousticSignals.splice(i, 1);
      }
    }

    // 4. Update Organisms (Life cycle, movement, feeding, communication, reproduction)
    const newOffspring: Organism[] = [];

    for (let i = this.organisms.length - 1; i >= 0; i--) {
      const org = this.organisms[i];
      const g = org.genome;

      // Decay voice visual envelope
      if (org.voiceLevel > 0) {
        org.voiceLevel = Math.max(0, org.voiceLevel - scaledDt * 3.5);
        if (org.voiceLevel === 0) {
          org.isEmittingVoice = false;
        }
      }

      // Age and metabolism
      org.age += scaledDt;
      const energyCost = g.metabolicRate * (1 + (g.size / 30) * 0.5) * scaledDt * 25;
      org.energy -= energyCost;
      if (org.reproductiveCooldown > 0) {
        org.reproductiveCooldown -= scaledDt;
      }

      // Kuramoto phase advancement (internal acoustic pacemaker)
      org.acousticPhase = (org.acousticPhase + scaledDt * (g.pulseRate * 2 * Math.PI)) % (Math.PI * 2);

      // Acoustic call timer
      org.callTimer -= scaledDt;
      if (org.callTimer <= 0) {
        // Decide call type based on organism state
        let cType: AcousticCallType = 'bonding';
        if (org.energy < g.maxEnergy * 0.25) {
          cType = 'distress';
        } else if (org.energy > g.reproductionThreshold && org.reproductiveCooldown <= 0) {
          cType = 'mating';
        } else if (g.aggression > 0.6) {
          cType = 'territorial';
        } else if (g.acousticSyncTendency > 0.6) {
          cType = 'sync';
        }

        this.emitOrganismVoice(org, cType);
        org.callTimer = randomRange(g.callInterval * 0.75, g.callInterval * 1.25);
      }

      // Acoustic Perception: React to nearby acoustic shockwaves!
      for (const sig of this.acousticSignals) {
        if (sig.originOrganismId === org.id) continue;
        const dx = sig.x - org.x;
        const dy = sig.y - org.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Within signal wavefront and within organism sensory range
        if (Math.abs(dist - sig.radius) < 35 && dist < g.sensoryRadius) {
          // Acoustic curiosity attraction / territorial avoidance
          if (sig.signalType === 'mating' && org.speciesId === sig.speciesId) {
            // Attract toward mating caller
            org.targetHeading = Math.atan2(sig.y - org.y, sig.x - org.x);
            org.behaviorState = 'mating';
          } else if (sig.signalType === 'territorial' && g.aggression < 0.5) {
            // Flee away from aggressive caller
            org.targetHeading = Math.atan2(org.y - sig.y, org.x - sig.x);
            org.behaviorState = 'fleeing';
          } else if (sig.signalType === 'resource' && g.acousticCuriosity > 0.4) {
            // Follow resource signal
            org.targetHeading = Math.atan2(sig.y - org.y, sig.x - org.x);
          }

          // Kuramoto Phase Locking: acoustic synchronization!
          if (g.acousticSyncTendency > 0.3) {
            const phaseDiff = Math.sin(0 - org.acousticPhase);
            org.acousticPhase += phaseDiff * g.acousticSyncTendency * 0.25;
            // Align call timer
            if (org.callTimer > 0.4) {
              org.callTimer = Math.max(0.2, org.callTimer - 0.15 * g.acousticSyncTendency);
            }
          }
        }
      }

      // Chemotaxis / Food Seeking
      let nearestFood: FoodParticle | null = null;
      let minFoodDist = g.sensoryRadius;

      for (const f of this.foods) {
        const dx = f.x - org.x;
        const dy = f.y - org.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minFoodDist) {
          minFoodDist = d;
          nearestFood = f;
        }
      }

      if (nearestFood && org.energy < g.maxEnergy * 0.9) {
        org.targetHeading = Math.atan2(nearestFood.y - org.y, nearestFood.x - org.x);
        org.behaviorState = 'foraging';

        // Eat food if reached
        if (minFoodDist < g.size + nearestFood.size + 4) {
          org.energy = Math.min(g.maxEnergy, org.energy + nearestFood.energyValue);
          org.health = Math.min(100, org.health + 10);

          // Emit resource call
          if (Math.random() < 0.4) {
            this.emitOrganismVoice(org, 'resource');
          }

          // Remove eaten food
          const fIdx = this.foods.indexOf(nearestFood);
          if (fIdx !== -1) this.foods.splice(fIdx, 1);
        }
      }

      // Flocking & Social Interaction with neighbors
      let flockDx = 0;
      let flockDy = 0;
      let neighborsCount = 0;

      for (let j = 0; j < this.organisms.length; j++) {
        if (i === j) continue;
        const other = this.organisms[j];
        const dx = other.x - org.x;
        const dy = other.y - org.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Collision separation
        const minDist = (g.size + other.genome.size) * 0.8;
        if (dist < minDist && dist > 0) {
          const push = (minDist - dist) / minDist;
          org.vx -= (dx / dist) * push * 0.5;
          org.vy -= (dy / dist) * push * 0.5;
        }

        // Mating conjugation: Two organisms with high energy encounter each other!
        if (
          dist < (g.size + other.genome.size) * 1.1 &&
          org.energy > g.reproductionThreshold &&
          other.energy > other.genome.reproductionThreshold &&
          org.reproductiveCooldown <= 0 &&
          other.reproductiveCooldown <= 0 &&
          this.organisms.length < 85
        ) {
          // Reproduce!
          const childGenome = mutateGenome(
            crossoverGenomes(g, other.genome),
            this.habitat.radiationMutationRate
          );
          const childGen = Math.max(org.generation, other.generation) + 1;
          const child = this.createOrganismFromGenome(
            childGenome,
            (org.x + other.x) / 2 + randomRange(-15, 15),
            (org.y + other.y) / 2 + randomRange(-15, 15),
            childGen,
            org.lineageId,
            [org.id, other.id]
          );

          newOffspring.push(child);
          this.stats.birthsTotal++;
          this.stats.mutationCount++;

          // Energy cost of reproduction
          org.energy -= g.reproductionThreshold * 0.45;
          other.energy -= other.genome.reproductionThreshold * 0.45;
          org.reproductiveCooldown = randomRange(12, 22);
          other.reproductiveCooldown = randomRange(12, 22);

          // Vocal celebration of birth
          this.emitOrganismVoice(org, 'mating');
        }

        // Flocking cohesion / alignment
        if (dist < g.sensoryRadius && org.speciesId === other.speciesId) {
          flockDx += other.vx;
          flockDy += other.vy;
          neighborsCount++;
        }
      }

      if (neighborsCount > 0 && g.flockingAffinity > 0) {
        org.vx += (flockDx / neighborsCount) * g.flockingAffinity * 0.05;
        org.vy += (flockDy / neighborsCount) * g.flockingAffinity * 0.05;
      }

      // Asexual budding if energy is overflowing and alone
      if (
        org.energy > g.maxEnergy * 0.95 &&
        org.reproductiveCooldown <= 0 &&
        this.organisms.length < 80
      ) {
        const childGenome = mutateGenome(g, this.habitat.radiationMutationRate);
        const child = this.createOrganismFromGenome(
          childGenome,
          org.x + randomRange(-20, 20),
          org.y + randomRange(-20, 20),
          org.generation + 1,
          org.lineageId,
          [org.id, null]
        );
        newOffspring.push(child);
        this.stats.birthsTotal++;
        org.energy -= g.reproductionThreshold * 0.5;
        org.reproductiveCooldown = randomRange(15, 25);
      }

      // Smooth steering heading interpolation
      if (!org.dragged) {
        // Natural wandering turn
        org.targetHeading += randomRange(-g.turnRate, g.turnRate);

        // Turn towards target heading
        let diff = org.targetHeading - org.heading;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        org.heading += diff * g.turnRate;

        // Thrust forward
        const speed = g.maxSpeed;
        org.vx += Math.cos(org.heading) * speed * 0.15;
        org.vy += Math.sin(org.heading) * speed * 0.15;

        // Habitat viscosity drag
        org.vx *= this.habitat.viscosity;
        org.vy *= this.habitat.viscosity;

        // Apply movement
        org.x += org.vx * (scaledDt * 60);
        org.y += org.vy * (scaledDt * 60);

        // Boundaries bounce
        const margin = g.size + 10;
        if (org.x < margin) {
          org.x = margin;
          org.vx = Math.abs(org.vx);
          org.targetHeading = 0;
        } else if (org.x > this.worldWidth - margin) {
          org.x = this.worldWidth - margin;
          org.vx = -Math.abs(org.vx);
          org.targetHeading = Math.PI;
        }

        if (org.y < margin) {
          org.y = margin;
          org.vy = Math.abs(org.vy);
          org.targetHeading = Math.PI / 2;
        } else if (org.y > this.worldHeight - margin) {
          org.y = this.worldHeight - margin;
          org.vy = -Math.abs(org.vy);
          org.targetHeading = -Math.PI / 2;
        }
      }

      // Check death from starvation or old age
      if (org.energy <= 0 || org.age > g.lifespan) {
        org.health -= scaledDt * 30;
        if (org.health <= 0) {
          org.alive = false;

          // Decompose into nutrient particles for the next generation
          this.spawnFoodParticle(org.x, org.y, this.habitat.nutrientType);
          if (g.size > 25) {
            this.spawnFoodParticle(org.x + randomRange(-15, 15), org.y + randomRange(-15, 15), this.habitat.nutrientType);
          }

          // Unregister species count
          const spec = this.speciesRegistry.get(org.speciesId);
          if (spec) {
            spec.count = Math.max(0, spec.count - 1);
            if (spec.count === 0) spec.extinct = true;
          }

          if (this.selectedOrganism === org) {
            this.selectedOrganism = null;
          }

          this.stats.deathsTotal++;
          this.organisms.splice(i, 1);
        }
      }
    }

    // Add newborn organisms
    if (newOffspring.length > 0) {
      this.organisms.push(...newOffspring);
    }

    // Snapshot history and metrics every 2 seconds
    this.historySnapshotTimer += scaledDt;
    if (this.historySnapshotTimer >= 2.0) {
      this.historySnapshotTimer = 0;
      this.updateStats();
    }
  }

  // Update evolutionary telemetry & Shannon sonic biodiversity index
  private updateStats() {
    this.stats.population = this.organisms.length;

    // Count alive species
    let activeSpecies = 0;
    let maxGen = 1;
    let totalEnergy = 0;
    const freqBins = new Map<number, number>();

    for (const org of this.organisms) {
      if (org.generation > maxGen) maxGen = org.generation;
      totalEnergy += org.energy;

      // Group frequencies into octave bands
      const band = Math.floor(Math.log2(Math.max(1, org.genome.baseFrequency / 30)));
      freqBins.set(band, (freqBins.get(band) || 0) + 1);
    }

    // Shannon Diversity Index: H = -sum(p_i * ln(p_i))
    let shannonIndex = 0;
    const totalVoices = this.organisms.length;
    if (totalVoices > 0) {
      for (const count of freqBins.values()) {
        const p = count / totalVoices;
        if (p > 0) shannonIndex -= p * Math.log2(p);
      }
    }
    this.stats.sonicBiodiversityIndex = Math.round(shannonIndex * 100) / 100;

    let dominantSpecies = 'None';
    let dominantCount = 0;
    for (const spec of this.speciesRegistry.values()) {
      if (spec.count > 0) {
        activeSpecies++;
        if (spec.count > dominantCount) {
          dominantCount = spec.count;
          dominantSpecies = spec.name;
        }
      }
      spec.historyCounts.push(spec.count);
      if (spec.historyCounts.length > 20) spec.historyCounts.shift();
    }

    this.stats.speciesCount = activeSpecies;
    this.stats.generationMax = maxGen;
    this.stats.dominantSpecies = dominantSpecies;
    this.stats.averageEnergy = totalVoices > 0 ? Math.round(totalEnergy / totalVoices) : 0;
  }

  // Find organism at canvas world coordinates (for mouse interaction)
  public getOrganismAt(worldX: number, worldY: number): Organism | null {
    for (let i = this.organisms.length - 1; i >= 0; i--) {
      const org = this.organisms[i];
      const dx = org.x - worldX;
      const dy = org.y - worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= org.genome.size * 1.5 + 8) {
        return org;
      }
    }
    return null;
  }

  // Mutate an organism directly on demand
  public mutateOrganism(org: Organism) {
    org.genome = mutateGenome(org.genome, 2.5);
    const { speciesId, speciesName } = classifySpecies(org.genome);
    org.speciesId = speciesId;
    org.speciesName = speciesName;
    this.emitOrganismVoice(org, 'sync');
    this.updateStats();
  }

  // Force reproduction on demand
  public forceReproduce(org: Organism): Organism {
    const childGenome = mutateGenome(org.genome, 1.2);
    const child = this.createOrganismFromGenome(
      childGenome,
      org.x + randomRange(-30, 30),
      org.y + randomRange(-30, 30),
      org.generation + 1,
      org.lineageId,
      [org.id, null]
    );
    this.organisms.push(child);
    this.stats.birthsTotal++;
    this.emitOrganismVoice(org, 'mating');
    this.updateStats();
    return child;
  }
}
