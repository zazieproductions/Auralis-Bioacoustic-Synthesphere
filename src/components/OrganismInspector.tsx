import React from 'react';
import { Organism, Genome } from '../types/ecosystem';
import { AudioVisualizer } from './AudioVisualizer';
import { globalAudioEngine } from '../audio/AudioEngine';
import {
  Volume2,
  VolumeX,
  Radio,
  Zap,
  Dna,
  Heart,
  Activity,
  Crosshair,
  BookmarkPlus,
  Trash2,
  X,
  Sliders,
  Sparkles
} from 'lucide-react';

interface OrganismInspectorProps {
  organism: Organism | null;
  onClose: () => void;
  onMutate: (org: Organism) => void;
  onForceReproduce: (org: Organism) => void;
  onToggleSolo: (org: Organism) => void;
  onToggleMute: (org: Organism) => void;
  onSaveSpecimen: (org: Organism) => void;
  onCull: (org: Organism) => void;
  onSendToLab: (genome: Genome) => void;
  onSendToBreeder: (org: Organism) => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
}

export const OrganismInspector: React.FC<OrganismInspectorProps> = ({
  organism,
  onClose,
  onMutate,
  onForceReproduce,
  onToggleSolo,
  onToggleMute,
  onSaveSpecimen,
  onCull,
  onSendToLab,
  onSendToBreeder,
  isFollowing,
  onToggleFollow
}) => {
  if (!organism) return null;

  const g = organism.genome;
  const energyPercent = Math.min(100, Math.round((organism.energy / g.maxEnergy) * 100));
  const agePercent = Math.min(100, Math.round((organism.age / g.lifespan) * 100));

  const handleAudition = () => {
    globalAudioEngine.triggerVoice(g, 0, 'sync', true, true);
  };

  return (
    <div className="absolute right-4 top-16 bottom-4 w-88 max-w-[92vw] glass-panel rounded-xl shadow-2xl p-4 flex flex-col z-30 border border-sky-500/25 text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-sky-500/20">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full shadow-lg"
            style={{
              backgroundColor: `hsl(${g.hue}, ${g.saturation}%, 60%)`,
              boxShadow: `0 0 10px hsl(${g.hue}, ${g.saturation}%, 60%)`
            }}
          />
          <div>
            <h3 className="font-sci-head font-bold text-sm tracking-wider text-sky-400">
              {organism.name}
            </h3>
            <span className="text-xs font-mono-sci text-slate-400 italic">
              {organism.speciesName} &bull; Gen {organism.generation}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          title="Close Inspector"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4 text-xs font-mono-sci">
        {/* Live Voice Oscilloscope */}
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-sky-500/15">
          <div className="flex items-center justify-between mb-1.5 text-slate-300">
            <span className="flex items-center gap-1.5 text-sky-400 font-bold">
              <Radio size={13} className="animate-pulse" /> VOICE OSCILLOSCOPE
            </span>
            <span className="text-[10px] text-slate-400">
              {g.oscType.toUpperCase()} &bull; {Math.round(g.baseFrequency)} Hz
            </span>
          </div>
          <AudioVisualizer
            mode="oscilloscope"
            accentColor={`hsl(${g.hue}, 90%, 65%)`}
            width={300}
            height={50}
            isSpecimen={true}
          />
          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800 text-[10px]">
            <span>Filter: {g.filterType} @ {Math.round(g.filterCutoff)}Hz</span>
            <span>Reach: {Math.round(g.acousticReach)}px</span>
          </div>
        </div>

        {/* Status Vital Gauges */}
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-sky-500/15 space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Activity size={13} /> ENERGY STORAGE
            </span>
            <span>{Math.round(organism.energy)} / {Math.round(g.maxEnergy)}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                energyPercent > 40 ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              style={{ width: `${energyPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-slate-300 pt-1">
            <span className="flex items-center gap-1.5 text-rose-400">
              <Heart size={13} /> HEALTH / LIFESPAN
            </span>
            <span>{Math.round(organism.age)}s / {Math.round(g.lifespan)}s</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-rose-400 transition-all duration-300"
              style={{ width: `${100 - agePercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
            <span>State: <span className="text-sky-300 capitalize">{organism.behaviorState}</span></span>
            <span>Repro Cooldown: {Math.max(0, Math.round(organism.reproductiveCooldown))}s</span>
          </div>
        </div>

        {/* Genome Chromosome Breakdown */}
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-sky-500/15 space-y-2">
          <div className="flex items-center justify-between text-slate-300 border-b border-slate-800/80 pb-1">
            <span className="flex items-center gap-1.5 text-purple-400 font-bold">
              <Dna size={13} /> GENOTYPE CHROMOSOME
            </span>
            <span className="text-[10px] text-slate-400">Lineage: {organism.lineageId.slice(0, 8)}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
            <div>
              <span className="text-slate-400">Morphology:</span>{' '}
              <span className="text-slate-200 capitalize">{g.bodyType}</span>
            </div>
            <div>
              <span className="text-slate-400">Body Size:</span>{' '}
              <span className="text-slate-200">{Math.round(g.size)}μm</span>
            </div>
            <div>
              <span className="text-slate-400">Symmetry:</span>{' '}
              <span className="text-slate-200">{g.symmetry}-fold</span>
            </div>
            <div>
              <span className="text-slate-400">Segmentation:</span>{' '}
              <span className="text-slate-200">{g.segmentation}</span>
            </div>
            <div>
              <span className="text-slate-400">Tentacles:</span>{' '}
              <span className="text-slate-200">{g.tentacleCount}</span>
            </div>
            <div>
              <span className="text-slate-400">Pulse Rate:</span>{' '}
              <span className="text-slate-200">{g.pulseRate.toFixed(1)}Hz</span>
            </div>
            <div>
              <span className="text-slate-400">Max Speed:</span>{' '}
              <span className="text-slate-200">{g.maxSpeed.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-slate-400">Sensory Rad:</span>{' '}
              <span className="text-slate-200">{Math.round(g.sensoryRadius)}px</span>
            </div>
            <div>
              <span className="text-slate-400">Call Period:</span>{' '}
              <span className="text-slate-200">{g.callInterval.toFixed(1)}s</span>
            </div>
            <div>
              <span className="text-slate-400">Sync Tendency:</span>{' '}
              <span className="text-slate-200">{(g.acousticSyncTendency * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-slate-400">Envelope:</span>{' '}
              <span className="text-slate-200">
                {g.attack.toFixed(2)}s / {g.decay.toFixed(2)}s
              </span>
            </div>
            <div>
              <span className="text-slate-400">Harmonicity:</span>{' '}
              <span className="text-slate-200">{g.harmonicity.toFixed(1)}x</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-1.5 pt-1">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={handleAudition}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-sky-950/80 hover:bg-sky-900 border border-sky-500/30 rounded-lg text-sky-300 font-bold transition shadow"
            >
              <Volume2 size={13} /> Audition Voice
            </button>
            <button
              onClick={onToggleFollow}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-lg font-bold transition shadow ${
                isFollowing
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <Crosshair size={13} /> {isFollowing ? 'Tracking' : 'Follow Camera'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onToggleSolo(organism)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 border rounded-lg font-bold transition ${
                organism.isSolo
                  ? 'bg-purple-900/80 border-purple-400 text-purple-200'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <Radio size={12} /> {organism.isSolo ? 'Unsolo Voice' : 'Solo Voice'}
            </button>
            <button
              onClick={() => onToggleMute(organism)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 border rounded-lg font-bold transition ${
                organism.isMuted
                  ? 'bg-rose-950 border-rose-500 text-rose-300'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {organism.isMuted ? <Volume2 size={12} /> : <VolumeX size={12} />}
              {organism.isMuted ? 'Unmute' : 'Mute Voice'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onMutate(organism)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900 hover:bg-amber-950/60 border border-amber-500/30 rounded-lg text-amber-300 transition"
              title="Trigger instant point mutation in this organism"
            >
              <Zap size={12} /> Point Mutate
            </button>
            <button
              onClick={() => onForceReproduce(organism)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900 hover:bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-emerald-300 transition"
              title="Force asexual budding reproduction"
            >
              <Sparkles size={12} /> Force Bud
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onSendToLab(g)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900 hover:bg-purple-950/60 border border-purple-500/30 rounded-lg text-purple-300 transition"
            >
              <Sliders size={12} /> Send to Lab
            </button>
            <button
              onClick={() => onSendToBreeder(organism)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900 hover:bg-sky-950/60 border border-sky-500/30 rounded-lg text-sky-300 transition"
            >
              <Dna size={12} /> Pair in Breeder
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => onSaveSpecimen(organism)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 transition"
            >
              <BookmarkPlus size={12} /> Save to Vault
            </button>
            <button
              onClick={() => onCull(organism)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-rose-950/40 hover:bg-rose-950 border border-rose-800/40 rounded-lg text-rose-300 transition"
            >
              <Trash2 size={12} /> Recycle / Cull
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
