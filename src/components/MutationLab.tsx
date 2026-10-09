import React, { useState } from 'react';
import { Genome, MorphologyType, SynthOscType } from '../types/ecosystem';
import { globalAudioEngine } from '../audio/AudioEngine';
import { AudioVisualizer } from './AudioVisualizer';
import { X, PlusCircle, BookmarkPlus, Sliders, Music, Eye, Play } from 'lucide-react';

interface MutationLabProps {
  initialGenome: Genome;
  onClose: () => void;
  onDeploy: (genome: Genome, name: string) => void;
  onSaveToVault: (genome: Genome, name: string) => void;
}

export const MutationLab: React.FC<MutationLabProps> = ({
  initialGenome,
  onClose,
  onDeploy,
  onSaveToVault
}) => {
  const [genome, setGenome] = useState<Genome>({ ...initialGenome });
  const [name, setName] = useState<string>('Synthetic Specimen');
  const [activeTab, setActiveTab] = useState<'voice' | 'morphology' | 'behavior'>('voice');

  const updateGene = <K extends keyof Genome>(key: K, value: Genome[K]) => {
    setGenome((prev) => ({ ...prev, [key]: value }));
  };

  const handleAudition = () => {
    globalAudioEngine.previewGenomeSound(genome);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col border border-purple-500/30 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-purple-500/20 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-400">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="font-sci-head font-bold text-base tracking-wider text-purple-300">
                MUTATION LABORATORY & GENOME SYNTHESIZER
              </h2>
              <p className="text-xs font-mono-sci text-slate-400">
                Direct genotype-phenotype editing with real-time acoustic auditioning
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

        {/* Specimen Profile & Audition Strip */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-purple-500/15 flex flex-wrap items-center justify-between gap-4 font-mono-sci text-xs">
          <div className="flex items-center gap-2">
            <label className="text-slate-400">Designation:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-950 px-2.5 py-1 rounded border border-purple-500/30 text-purple-300 font-bold focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <AudioVisualizer
              mode="oscilloscope"
              accentColor={`hsl(${genome.hue}, 90%, 65%)`}
              width={160}
              height={36}
              isSpecimen={true}
            />
            <button
              onClick={handleAudition}
              className="flex items-center gap-1.5 py-1.5 px-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shadow-lg transition"
            >
              <Play size={14} /> Audition Voice
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 font-mono-sci text-xs">
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-2 py-2.5 px-4 font-bold border-b-2 transition ${
              activeTab === 'voice'
                ? 'border-purple-400 text-purple-300 bg-purple-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music size={14} /> Voice Synthesis ({genome.oscType.toUpperCase()})
          </button>
          <button
            onClick={() => setActiveTab('morphology')}
            className={`flex items-center gap-2 py-2.5 px-4 font-bold border-b-2 transition ${
              activeTab === 'morphology'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye size={14} /> Visual Morphology ({genome.bodyType})
          </button>
          <button
            onClick={() => setActiveTab('behavior')}
            className={`flex items-center gap-2 py-2.5 px-4 font-bold border-b-2 transition ${
              activeTab === 'behavior'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders size={14} /> Behavior & Metabolism
          </button>
        </div>

        {/* Scrollable Gene Sliders */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono-sci text-xs">
          {activeTab === 'voice' && (
            <div className="space-y-5">
              {/* Oscillator Selection */}
              <div>
                <label className="text-slate-300 block mb-2 font-bold text-sky-400">
                  PRIMARY OSCILLATOR ENGINE:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {(['sine', 'triangle', 'sawtooth', 'square', 'fm', 'noise', 'pulse'] as SynthOscType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => updateGene('oscType', type)}
                      className={`py-2 px-1 text-center rounded border font-bold capitalize transition ${
                        genome.oscType === type
                          ? 'bg-purple-900 border-purple-400 text-white shadow'
                          : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pitch & Harmonics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Base Frequency:</span>
                    <span className="text-purple-300 font-bold">{Math.round(genome.baseFrequency)} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="1100"
                    step="1"
                    value={genome.baseFrequency}
                    onChange={(e) => updateGene('baseFrequency', parseFloat(e.target.value))}
                    className="w-full accent-purple-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Harmonic Multiplier:</span>
                    <span className="text-purple-300 font-bold">{genome.harmonicity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="6.0"
                    step="0.1"
                    value={genome.harmonicity}
                    onChange={(e) => updateGene('harmonicity', parseFloat(e.target.value))}
                    className="w-full accent-purple-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>FM Modulation Index:</span>
                    <span className="text-purple-300 font-bold">{genome.fmIndex.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8.0"
                    step="0.1"
                    value={genome.fmIndex}
                    onChange={(e) => updateGene('fmIndex', parseFloat(e.target.value))}
                    className="w-full accent-purple-400"
                  />
                </div>
              </div>

              {/* Filter Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="text-slate-300 block mb-1">Filter Type:</label>
                  <div className="flex gap-2">
                    {(['lowpass', 'bandpass', 'highpass'] as const).map((ft) => (
                      <button
                        key={ft}
                        onClick={() => updateGene('filterType', ft)}
                        className={`flex-1 py-1 rounded text-center border font-bold capitalize ${
                          genome.filterType === ft
                            ? 'bg-sky-900 border-sky-400 text-sky-200'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        {ft.slice(0, 4)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Filter Cutoff:</span>
                    <span className="text-sky-300 font-bold">{Math.round(genome.filterCutoff)} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="120"
                    max="7500"
                    step="10"
                    value={genome.filterCutoff}
                    onChange={(e) => updateGene('filterCutoff', parseFloat(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Resonance (Q):</span>
                    <span className="text-sky-300 font-bold">{genome.filterResonance.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="16"
                    step="0.1"
                    value={genome.filterResonance}
                    onChange={(e) => updateGene('filterResonance', parseFloat(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                </div>
              </div>

              {/* ADSR Envelope & Rhythm */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Attack:</span>
                    <span className="text-emerald-300 font-bold">{genome.attack.toFixed(2)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.6"
                    step="0.01"
                    value={genome.attack}
                    onChange={(e) => updateGene('attack', parseFloat(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Decay:</span>
                    <span className="text-emerald-300 font-bold">{genome.decay.toFixed(2)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.04"
                    max="1.2"
                    step="0.01"
                    value={genome.decay}
                    onChange={(e) => updateGene('decay', parseFloat(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Call Interval:</span>
                    <span className="text-amber-300 font-bold">{genome.callInterval.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="12.0"
                    step="0.1"
                    value={genome.callInterval}
                    onChange={(e) => updateGene('callInterval', parseFloat(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Acoustic Reach:</span>
                    <span className="text-amber-300 font-bold">{Math.round(genome.acousticReach)}px</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="380"
                    step="5"
                    value={genome.acousticReach}
                    onChange={(e) => updateGene('acousticReach', parseFloat(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'morphology' && (
            <div className="space-y-5">
              {/* Body Type Selection */}
              <div>
                <label className="text-slate-300 block mb-2 font-bold text-cyan-400">
                  MORPHOLOGICAL BODY PLAN:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(['jellyfish', 'dendrite', 'colony', 'parasite', 'spore', 'crystalline'] as MorphologyType[]).map((bt) => (
                    <button
                      key={bt}
                      onClick={() => updateGene('bodyType', bt)}
                      className={`py-2 px-1 text-center rounded border font-bold capitalize transition ${
                        genome.bodyType === bt
                          ? 'bg-cyan-900 border-cyan-400 text-white shadow'
                          : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {bt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anatomy Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Body Radius (Scale):</span>
                    <span className="text-cyan-300 font-bold">{Math.round(genome.size)} μm</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="45"
                    step="1"
                    value={genome.size}
                    onChange={(e) => updateGene('size', parseFloat(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Radial Symmetry:</span>
                    <span className="text-cyan-300 font-bold">{genome.symmetry}-fold</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="1"
                    value={genome.symmetry}
                    onChange={(e) => updateGene('symmetry', parseInt(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Segmentation:</span>
                    <span className="text-cyan-300 font-bold">{genome.segmentation}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="1"
                    value={genome.segmentation}
                    onChange={(e) => updateGene('segmentation', parseInt(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>

              {/* Appendages & Pigment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Tentacle Count:</span>
                    <span className="text-cyan-300 font-bold">{genome.tentacleCount}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="1"
                    value={genome.tentacleCount}
                    onChange={(e) => updateGene('tentacleCount', parseInt(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Bioluminescence:</span>
                    <span className="text-cyan-300 font-bold">{(genome.bioluminescence * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={genome.bioluminescence}
                    onChange={(e) => updateGene('bioluminescence', parseFloat(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Pigment Hue:</span>
                    <span
                      className="font-bold px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: `hsl(${genome.hue}, 80%, 50%)` }}
                    >
                      {Math.round(genome.hue)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={genome.hue}
                    onChange={(e) => updateGene('hue', parseFloat(e.target.value))}
                    className="w-full accent-rose-400"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'behavior' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Max Speed:</span>
                    <span className="text-emerald-300 font-bold">{genome.maxSpeed.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="3.2"
                    step="0.1"
                    value={genome.maxSpeed}
                    onChange={(e) => updateGene('maxSpeed', parseFloat(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Sensory Radius:</span>
                    <span className="text-emerald-300 font-bold">{Math.round(genome.sensoryRadius)}px</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="320"
                    step="5"
                    value={genome.sensoryRadius}
                    onChange={(e) => updateGene('sensoryRadius', parseFloat(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Acoustic Sync Tendency:</span>
                    <span className="text-emerald-300 font-bold">{(genome.acousticSyncTendency * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={genome.acousticSyncTendency}
                    onChange={(e) => updateGene('acousticSyncTendency', parseFloat(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Reproduction Threshold:</span>
                    <span className="text-amber-300 font-bold">{Math.round(genome.reproductionThreshold)} NRG</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="160"
                    step="5"
                    value={genome.reproductionThreshold}
                    onChange={(e) => updateGene('reproductionThreshold', parseFloat(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Lifespan:</span>
                    <span className="text-amber-300 font-bold">{Math.round(genome.lifespan)}s</span>
                  </div>
                  <input
                    type="range"
                    min="45"
                    max="240"
                    step="5"
                    value={genome.lifespan}
                    onChange={(e) => updateGene('lifespan', parseFloat(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Mutation Rate:</span>
                    <span className="text-amber-300 font-bold">{(genome.mutationRate * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.03"
                    max="0.25"
                    step="0.01"
                    value={genome.mutationRate}
                    onChange={(e) => updateGene('mutationRate', parseFloat(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-purple-500/20 flex items-center justify-between font-mono-sci text-xs">
          <button
            onClick={() => onSaveToVault(genome, name)}
            className="flex items-center gap-1.5 py-2 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 transition"
          >
            <BookmarkPlus size={14} /> Save to Vault
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-lg text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onDeploy(genome, name)}
              className="flex items-center gap-1.5 py-2 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-purple-600/30 transition"
            >
              <PlusCircle size={16} /> Deploy Into Habitat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
