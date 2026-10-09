import React, { useState } from 'react';
import { Organism, Genome } from '../types/ecosystem';
import { crossoverGenomes, mutateGenome, classifySpecies, generateOrganismName } from '../simulation/genetics';
import { globalAudioEngine } from '../audio/AudioEngine';
import { X, Dna, Play, Sparkles, ChevronRight } from 'lucide-react';

interface BreedingChamberProps {
  organisms: Organism[];
  initialParentA?: Organism | null;
  onClose: () => void;
  onDeployChild: (genome: Genome, name: string) => void;
}

export const BreedingChamber: React.FC<BreedingChamberProps> = ({
  organisms,
  initialParentA,
  onClose,
  onDeployChild
}) => {
  const [parentAId, setParentAId] = useState<string>(
    initialParentA ? initialParentA.id : organisms[0]?.id || ''
  );
  const [parentBId, setParentBId] = useState<string>(
    organisms.find((o) => o.id !== (initialParentA ? initialParentA.id : organisms[0]?.id))?.id ||
      organisms[1]?.id ||
      ''
  );
  const [mutationIntensity, setMutationIntensity] = useState<number>(1.0);
  const [childGenome, setChildGenome] = useState<Genome | null>(null);

  const parentA = organisms.find((o) => o.id === parentAId);
  const parentB = organisms.find((o) => o.id === parentBId);

  const handlePerformCross = () => {
    if (!parentA || !parentB) return;
    const crossed = crossoverGenomes(parentA.genome, parentB.genome);
    const mutated = mutateGenome(crossed, mutationIntensity);
    setChildGenome(mutated);
    globalAudioEngine.previewGenomeSound(mutated);
  };

  const handleAuditionChild = () => {
    if (childGenome) {
      globalAudioEngine.previewGenomeSound(childGenome);
    }
  };

  const handleDeploy = () => {
    if (!childGenome) return;
    const { speciesName } = classifySpecies(childGenome);
    const name = generateOrganismName(speciesName, Math.floor(Math.random() * 800 + 100));
    onDeployChild(childGenome, name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-3xl rounded-2xl flex flex-col border border-sky-500/30 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-sky-500/20 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-950/80 border border-sky-500/40 text-sky-400">
              <Dna size={20} />
            </div>
            <div>
              <h2 className="font-sci-head font-bold text-base tracking-wider text-sky-300">
                EXPERIMENTAL BREEDING CHAMBER
              </h2>
              <p className="text-xs font-mono-sci text-slate-400">
                Hybridize genetic lineages to cultivate emergent acoustic traits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 font-mono-sci text-xs">
          {/* Parent Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parent A */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-sky-500/20 space-y-3">
              <span className="text-sky-400 font-bold block text-sm">PROGENITOR A</span>
              <select
                value={parentAId}
                onChange={(e) => setParentAId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                {organisms.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.speciesName}) - {Math.round(o.genome.baseFrequency)}Hz
                  </option>
                ))}
              </select>

              {parentA && (
                <div className="space-y-1.5 text-slate-300 pt-2 border-t border-slate-800">
                  <div className="flex justify-between">
                    <span>Morphology:</span>
                    <span className="text-sky-300 capitalize">{parentA.genome.bodyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Synth Voice:</span>
                    <span className="text-sky-300">{parentA.genome.oscType} @ {Math.round(parentA.genome.baseFrequency)}Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Filter Cutoff:</span>
                    <span>{Math.round(parentA.genome.filterCutoff)}Hz</span>
                  </div>
                  <button
                    onClick={() => globalAudioEngine.previewGenomeSound(parentA.genome)}
                    className="w-full mt-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-sky-300 flex items-center justify-center gap-1 font-bold"
                  >
                    <Play size={12} /> Audition Progenitor A
                  </button>
                </div>
              )}
            </div>

            {/* Parent B */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-sky-500/20 space-y-3">
              <span className="text-emerald-400 font-bold block text-sm">PROGENITOR B</span>
              <select
                value={parentBId}
                onChange={(e) => setParentBId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                {organisms.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.speciesName}) - {Math.round(o.genome.baseFrequency)}Hz
                  </option>
                ))}
              </select>

              {parentB && (
                <div className="space-y-1.5 text-slate-300 pt-2 border-t border-slate-800">
                  <div className="flex justify-between">
                    <span>Morphology:</span>
                    <span className="text-emerald-300 capitalize">{parentB.genome.bodyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Synth Voice:</span>
                    <span className="text-emerald-300">{parentB.genome.oscType} @ {Math.round(parentB.genome.baseFrequency)}Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Filter Cutoff:</span>
                    <span>{Math.round(parentB.genome.filterCutoff)}Hz</span>
                  </div>
                  <button
                    onClick={() => globalAudioEngine.previewGenomeSound(parentB.genome)}
                    className="w-full mt-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-emerald-300 flex items-center justify-center gap-1 font-bold"
                  >
                    <Play size={12} /> Audition Progenitor B
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mutation Rate Slider */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
            <span className="text-slate-300">Radiation Mutation Multiplier:</span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={mutationIntensity}
                onChange={(e) => setMutationIntensity(parseFloat(e.target.value))}
                className="accent-amber-400"
              />
              <span className="text-amber-300 font-bold w-12 text-right">
                {mutationIntensity.toFixed(1)}x
              </span>
            </div>
          </div>

          {/* Trigger Crossover Button */}
          <button
            onClick={handlePerformCross}
            disabled={!parentA || !parentB}
            className="w-full py-3 bg-gradient-to-r from-sky-600 via-purple-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <Sparkles size={16} /> Hybridize Chromosomes
          </button>

          {/* Offspring Preview Card */}
          {childGenome && (
            <div className="bg-purple-950/40 p-4 rounded-xl border border-purple-500/40 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-purple-300 font-bold text-sm flex items-center gap-2">
                  <Sparkles size={14} /> EMERGENT HYBRID OFFSPRING
                </span>
                <span className="text-slate-400">{classifySpecies(childGenome).speciesName}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-300 pt-2 border-t border-purple-500/20">
                <div>
                  <span className="text-slate-400">Body Type:</span>{' '}
                  <span className="text-purple-200 capitalize">{childGenome.bodyType}</span>
                </div>
                <div>
                  <span className="text-slate-400">Oscillator:</span>{' '}
                  <span className="text-purple-200 capitalize">{childGenome.oscType}</span>
                </div>
                <div>
                  <span className="text-slate-400">Pitch:</span>{' '}
                  <span className="text-purple-200 font-bold">{Math.round(childGenome.baseFrequency)} Hz</span>
                </div>
                <div>
                  <span className="text-slate-400">Reach:</span>{' '}
                  <span className="text-purple-200">{Math.round(childGenome.acousticReach)} px</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleAuditionChild}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded font-bold flex items-center gap-1.5"
                >
                  <Play size={13} /> Replay Voice
                </button>

                <button
                  onClick={handleDeploy}
                  className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg transition flex items-center gap-1.5"
                >
                  Release Into Habitat <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
