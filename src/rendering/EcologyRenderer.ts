import { Organism, FoodParticle, AcousticSignal, Habitat } from '../types/ecosystem';

export interface ViewportCamera {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
  followingId: string | null;
}

export class EcologyRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private time = 0;

  // Background floating plankton particles
  private dustParticles: { x: number; y: number; size: number; speed: number; phase: number }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;

    // Initialize dust particles
    for (let i = 0; i < 90; i++) {
      this.dustParticles.push({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        size: Math.random() * 1.8 + 0.5,
        speed: Math.random() * 0.4 + 0.1,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  public render(
    organisms: Organism[],
    foods: FoodParticle[],
    acousticSignals: AcousticSignal[],
    habitat: Habitat,
    camera: ViewportCamera,
    worldWidth: number,
    worldHeight: number,
    selectedOrganism: Organism | null,
    showSensoryRings: boolean = true
  ) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    this.time += 0.02;

    // Smooth camera interpolation
    camera.x += (camera.targetX - camera.x) * 0.1;
    camera.y += (camera.targetY - camera.y) * 0.1;
    camera.zoom += (camera.targetZoom - camera.zoom) * 0.1;

    // Clear background with habitat color
    ctx.fillStyle = habitat.bgColor;
    ctx.fillRect(0, 0, width, height);

    // Save camera transform
    ctx.save();

    // Center view
    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Draw ambient fluid currents & background caustics
    this.drawBackgroundAtmosphere(ctx, habitat, worldWidth, worldHeight);

    // Draw world boundaries with glowing grid
    this.drawWorldBoundaries(ctx, worldWidth, worldHeight, habitat.accentColor);

    // Draw Food / Nutrient particles
    this.drawFoods(ctx, foods);

    // Draw Acoustic Shockwave Ripples in the fluid
    this.drawAcousticSignals(ctx, acousticSignals);

    // Draw Organisms (Back to front: dead first, then smaller, then larger, then selected)
    const sortedOrganisms = [...organisms].sort((a, b) => {
      if (a === selectedOrganism) return 1;
      if (b === selectedOrganism) return -1;
      return a.genome.size - b.genome.size;
    });

    for (const org of sortedOrganisms) {
      this.drawOrganism(ctx, org, org === selectedOrganism, showSensoryRings);
    }

    // Restore camera transform
    ctx.restore();

    // Post-processing: Microscope lens vignette & scale HUD
    this.drawMicroscopeVignette(ctx, width, height);
  }

  private drawBackgroundAtmosphere(ctx: CanvasRenderingContext2D, habitat: Habitat, worldWidth: number, worldHeight: number) {
    // Ambient caustic radial glow
    const cx = worldWidth / 2 + Math.sin(this.time * 0.3) * 100;
    const cy = worldHeight / 2 + Math.cos(this.time * 0.25) * 100;
    const grad = ctx.createRadialGradient(cx, cy, 100, cx, cy, worldWidth * 0.8);
    grad.addColorStop(0, `${habitat.accentColor}18`);
    grad.addColorStop(0.5, `${habitat.accentColor}08`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, worldWidth, worldHeight);

    // Floating micro-dust plankton particles
    ctx.fillStyle = `${habitat.accentColor}44`;
    for (const p of this.dustParticles) {
      const px = (p.x + Math.sin(this.time * p.speed + p.phase) * 30 + worldWidth) % worldWidth;
      const py = (p.y + this.time * 15 * p.speed + worldHeight) % worldHeight;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawWorldBoundaries(ctx: CanvasRenderingContext2D, w: number, h: number, accentColor: string) {
    // Petri dish border
    ctx.strokeStyle = `${accentColor}33`;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w, h);

    // Subtle measurement grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const step = 150;
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  private drawFoods(ctx: CanvasRenderingContext2D, foods: FoodParticle[]) {
    for (const f of foods) {
      const pulse = 1 + Math.sin(this.time * 3 + f.hue) * 0.2;
      const r = f.size * pulse;

      ctx.save();
      ctx.translate(f.x, f.y);

      // Glow halo
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsla(${f.hue}, 90%, 65%, 0.7)`;

      if (f.type === 'crystalline') {
        // Diamond crystal
        ctx.fillStyle = `hsla(${f.hue}, 85%, 70%, 0.85)`;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.3);
        ctx.lineTo(r * 0.9, 0);
        ctx.lineTo(0, r * 1.3);
        ctx.lineTo(-r * 0.9, 0);
        ctx.closePath();
        ctx.fill();
      } else if (f.type === 'plasma') {
        // Multi-point spark
        ctx.fillStyle = `hsla(${f.hue}, 95%, 75%, 0.9)`;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const len = i % 2 === 0 ? r * 1.4 : r * 0.6;
          const px = Math.cos(a) * len;
          const py = Math.sin(a) * len;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // Organic / Spore soft orb
        ctx.fillStyle = `hsla(${f.hue}, 80%, 60%, 0.8)`;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Nucleus
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private drawAcousticSignals(ctx: CanvasRenderingContext2D, signals: AcousticSignal[]) {
    for (const sig of signals) {
      const alpha = Math.max(0, sig.strength * 0.65);
      if (alpha <= 0.01) continue;

      ctx.save();
      ctx.beginPath();
      ctx.arc(sig.x, sig.y, Math.max(1, sig.radius), 0, Math.PI * 2);

      // Sound ring color by signal frequency & type
      ctx.strokeStyle = `hsla(${sig.hue}, 95%, 65%, ${alpha})`;
      ctx.lineWidth = Math.max(1, 3.5 * sig.strength);
      ctx.shadowBlur = 12;
      ctx.shadowColor = `hsla(${sig.hue}, 100%, 60%, ${alpha})`;
      ctx.stroke();

      // Inner resonant harmonic ripple
      if (sig.radius > 20) {
        ctx.beginPath();
        ctx.arc(sig.x, sig.y, Math.max(1, sig.radius * 0.65), 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${sig.hue}, 85%, 75%, ${alpha * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // Draw an individual organism with procedural morphology
  private drawOrganism(
    ctx: CanvasRenderingContext2D,
    org: Organism,
    isSelected: boolean,
    showSensoryRings: boolean
  ) {
    const g = org.genome;
    const bodyScale = g.size;
    const voiceMod = org.voiceLevel; // 0..1 pulse when vocalizing!
    const pulseFactor = 1 + Math.sin(this.time * g.pulseRate * 4) * 0.08 + voiceMod * 0.28;
    const effectiveRadius = bodyScale * pulseFactor;

    ctx.save();
    ctx.translate(org.x, org.y);

    // Sensory perception and acoustic reach indicators (for selected organism)
    if (isSelected && showSensoryRings) {
      // Acoustic reach boundary
      ctx.beginPath();
      ctx.arc(0, 0, g.acousticReach, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${g.hue}, 80%, 65%, 0.2)`;
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Sensory perception radius
      ctx.beginPath();
      ctx.arc(0, 0, g.sensoryRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Velocity direction indicator
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(org.vx * 35, org.vy * 35);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Glow aura around organism body (intense when vocalizing)
    const glowIntensity = (g.bioluminescence + voiceMod * 0.8) * 18;
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = `hsla(${g.hue}, ${g.saturation}%, 60%, ${g.opacity})`;

    // Rotate to organism heading
    ctx.rotate(org.heading);

    // Draw morphological body based on genetic bodyType
    switch (g.bodyType) {
      case 'jellyfish':
        this.drawJellyfishMorphology(ctx, org, effectiveRadius);
        break;
      case 'dendrite':
        this.drawDendriteMorphology(ctx, org, effectiveRadius);
        break;
      case 'colony':
        this.drawColonyMorphology(ctx, org, effectiveRadius);
        break;
      case 'parasite':
        this.drawParasiteMorphology(ctx, org, effectiveRadius);
        break;
      case 'spore':
        this.drawSporeMorphology(ctx, org, effectiveRadius);
        break;
      case 'crystalline':
      default:
        this.drawCrystallineMorphology(ctx, org, effectiveRadius);
        break;
    }

    // Draw selection reticle
    if (isSelected) {
      ctx.rotate(-org.heading); // Un-rotate for clean HUD ring
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#38bdf8';

      const reticleR = effectiveRadius * 1.5 + 10;
      ctx.beginPath();
      ctx.arc(0, 0, reticleR, 0, Math.PI * 2);
      ctx.stroke();

      // Corner brackets
      const bSize = 6;
      ctx.beginPath();
      ctx.moveTo(-reticleR - bSize, 0);
      ctx.lineTo(-reticleR, 0);
      ctx.moveTo(reticleR, 0);
      ctx.lineTo(reticleR + bSize, 0);
      ctx.moveTo(0, -reticleR - bSize);
      ctx.lineTo(0, -reticleR);
      ctx.moveTo(0, reticleR);
      ctx.lineTo(0, reticleR + bSize);
      ctx.stroke();

      // Organism HUD tag
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${org.name} [${Math.round(org.genome.baseFrequency)}Hz]`, 0, -reticleR - 10);
    }

    ctx.restore();
  }

  // 1. Jellyfish Morphology
  private drawJellyfishMorphology(ctx: CanvasRenderingContext2D, org: Organism, r: number) {
    const g = org.genome;
    const bellHeight = r * 1.2;
    const bellWidth = r * 1.1;

    // Translucent bell
    ctx.fillStyle = `hsla(${g.hue}, ${g.saturation}%, 55%, ${g.opacity * 0.45})`;
    ctx.strokeStyle = `hsla(${g.hue}, ${g.saturation}%, 75%, ${g.opacity})`;
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(0, -bellHeight * 0.7);
    ctx.bezierCurveTo(bellWidth, -bellHeight * 0.7, bellWidth * 0.9, bellHeight * 0.3, bellWidth * 0.5, bellHeight * 0.5);
    // Undulating margin
    ctx.quadraticCurveTo(0, bellHeight * 0.7, -bellWidth * 0.5, bellHeight * 0.5);
    ctx.bezierCurveTo(-bellWidth * 0.9, bellHeight * 0.3, -bellWidth, -bellHeight * 0.7, 0, -bellHeight * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bioluminescent margin cilia dots
    ctx.fillStyle = '#ffffff';
    const ciliaCount = Math.max(4, g.symmetry * 2);
    for (let i = 0; i < ciliaCount; i++) {
      const t = i / (ciliaCount - 1);
      const cx = (t - 0.5) * bellWidth * 0.9;
      const cy = bellHeight * 0.5 + Math.sin(t * Math.PI) * 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Trailing undulating tentacles
    const tCount = Math.max(2, g.tentacleCount);
    const tLen = g.tentacleLength;
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = `hsla(${g.hue}, ${g.saturation}%, 70%, ${g.opacity * 0.8})`;

    for (let i = 0; i < tCount; i++) {
      const offsetX = ((i / (tCount - 1 || 1)) - 0.5) * bellWidth * 0.7;
      const phase = this.time * 4 + i * 1.2;
      ctx.beginPath();
      ctx.moveTo(offsetX, bellHeight * 0.5);

      const wave1 = Math.sin(phase) * 6;
      const wave2 = Math.sin(phase + 1) * 9;
      ctx.bezierCurveTo(
        offsetX + wave1,
        bellHeight * 0.5 + tLen * 0.4,
        offsetX + wave2,
        bellHeight * 0.5 + tLen * 0.75,
        offsetX + wave1 * 0.5,
        bellHeight * 0.5 + tLen
      );
      ctx.stroke();
    }

    // Inner glowing nucleus
    ctx.fillStyle = `hsla(${g.hue}, 100%, 85%, ${0.6 + org.voiceLevel * 0.4})`;
    ctx.beginPath();
    ctx.arc(0, -bellHeight * 0.1, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Dendrite Morphology (Branching Neural Network)
  private drawDendriteMorphology(ctx: CanvasRenderingContext2D, org: Organism, r: number) {
    const g = org.genome;
    const branches = Math.max(3, g.symmetry);
    const depth = g.branchingDepth;

    ctx.strokeStyle = `hsla(${g.hue}, ${g.saturation}%, 70%, ${g.opacity})`;
    ctx.lineWidth = 2;

    const drawBranch = (len: number, d: number, angle: number) => {
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -len);
      ctx.stroke();

      // Node at junction
      ctx.fillStyle = `hsla(${g.hue}, 100%, 80%, ${0.7 + org.voiceLevel * 0.3})`;
      ctx.beginPath();
      ctx.arc(0, -len, Math.max(1.5, 3.5 - d), 0, Math.PI * 2);
      ctx.fill();

      if (d < depth) {
        ctx.translate(0, -len);
        const subAngle = 0.45 + Math.sin(this.time * 2 + d) * 0.08;
        drawBranch(len * 0.65, d + 1, -subAngle);
        drawBranch(len * 0.65, d + 1, subAngle);
      }
      ctx.restore();
    };

    // Central soma core
    ctx.fillStyle = `hsla(${g.hue}, ${g.saturation}%, 55%, ${g.opacity * 0.8})`;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Radiating arms
    for (let i = 0; i < branches; i++) {
      const a = (i * Math.PI * 2) / branches;
      drawBranch(r * 0.85, 1, a);
    }
  }

  // 3. Colony Morphology (Agglomerated Cellular Cluster)
  private drawColonyMorphology(ctx: CanvasRenderingContext2D, org: Organism, r: number) {
    const g = org.genome;
    const count = Math.max(3, g.segmentation + 2);

    // Center cell
    ctx.fillStyle = `hsla(${g.hue}, ${g.saturation}%, 60%, ${g.opacity * 0.5})`;
    ctx.strokeStyle = `hsla(${g.hue}, ${g.saturation}%, 80%, ${g.opacity})`;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Satellite daughter cells
    for (let i = 0; i < count; i++) {
      const a = (i * Math.PI * 2) / count + this.time * 0.5;
      const dist = r * 0.68;
      const cx = Math.cos(a) * dist;
      const cy = Math.sin(a) * dist;
      const subR = r * 0.38;

      ctx.fillStyle = `hsla(${(g.hue + i * 15) % 360}, ${g.saturation}%, 65%, ${g.opacity * 0.6})`;
      ctx.beginPath();
      ctx.arc(cx, cy, subR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Organelle nucleus
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, subR * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Parasite Morphology (Sharp Geometric Exoskeleton)
  private drawParasiteMorphology(ctx: CanvasRenderingContext2D, org: Organism, r: number) {
    const g = org.genome;
    const segs = Math.max(3, g.segmentation);

    ctx.fillStyle = `hsla(${g.hue}, ${g.saturation}%, 50%, ${g.opacity * 0.7})`;
    ctx.strokeStyle = `hsla(${g.hue}, 95%, 75%, ${g.opacity})`;
    ctx.lineWidth = 2;

    // Segmented carapace chain
    for (let i = 0; i < segs; i++) {
      const t = i / segs;
      const cy = -r * 0.8 + (i * r * 1.6) / segs;
      const segWidth = (1 - Math.abs(t - 0.5) * 1.2) * r * 0.9;
      const segHeight = (r * 1.6) / segs * 0.85;

      ctx.beginPath();
      ctx.moveTo(-segWidth, cy);
      ctx.lineTo(0, cy - segHeight * 0.4);
      ctx.lineTo(segWidth, cy);
      ctx.lineTo(segWidth * 0.7, cy + segHeight * 0.8);
      ctx.lineTo(0, cy + segHeight * 0.6);
      ctx.lineTo(-segWidth * 0.7, cy + segHeight * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Spikes / Claws
      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(-segWidth, cy);
        ctx.lineTo(-segWidth - r * 0.45, cy + r * 0.2);
        ctx.moveTo(segWidth, cy);
        ctx.lineTo(segWidth + r * 0.45, cy + r * 0.2);
        ctx.stroke();
      }
    }

    // Glowing stinger / eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -r * 0.8, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Spore Morphology (Concentric Luminous Halos)
  private drawSporeMorphology(ctx: CanvasRenderingContext2D, org: Organism, r: number) {
    const g = org.genome;

    // Concentric nebulous halos
    for (let i = 3; i >= 1; i--) {
      const haloR = (r * i) / 3;
      const alpha = (g.opacity / i) * (0.4 + org.voiceLevel * 0.5);
      ctx.fillStyle = `hsla(${g.hue}, ${g.saturation}%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, haloR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Orbiting micro-spores
    const orbitCount = 4;
    for (let i = 0; i < orbitCount; i++) {
      const angle = this.time * 2 + (i * Math.PI * 2) / orbitCount;
      const orbitDist = r * 1.15;
      const ox = Math.cos(angle) * orbitDist;
      const oy = Math.sin(angle) * orbitDist;

      ctx.fillStyle = `hsla(${g.hue}, 100%, 85%, 0.85)`;
      ctx.beginPath();
      ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bright core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Crystalline Morphology (Prismatic Faceted Star)
  private drawCrystallineMorphology(ctx: CanvasRenderingContext2D, org: Organism, r: number) {
    const g = org.genome;
    const points = Math.max(4, g.symmetry);

    ctx.fillStyle = `hsla(${g.hue}, ${g.saturation}%, 60%, ${g.opacity * 0.55})`;
    ctx.strokeStyle = `hsla(${g.hue}, 95%, 85%, ${g.opacity})`;
    ctx.lineWidth = 1.8;

    // Outer crystal polygon
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const a = (i * Math.PI * 2) / points;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Internal facet triangulation
    ctx.strokeStyle = `hsla(${g.hue}, 80%, 90%, ${g.opacity * 0.4})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < points; i++) {
      const a = (i * Math.PI * 2) / points;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(px, py);
      ctx.stroke();
    }

    // Shimmering center crystal
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22 * (1 + org.voiceLevel * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }

  // Microscope lens vignette overlay
  private drawMicroscopeVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const r = Math.max(w, h) * 0.75;
    const grad = ctx.createRadialGradient(w / 2, h / 2, r * 0.5, w / 2, h / 2, r);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.85, 'rgba(3, 7, 18, 0.4)');
    grad.addColorStop(1, 'rgba(1, 4, 10, 0.88)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}
