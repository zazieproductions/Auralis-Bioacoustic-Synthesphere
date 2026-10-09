import React, { useState } from 'react';
import { EvolutionaryStats, SpeciesRecord, Organism } from '../types/ecosystem';
import { X, Activity, Dna, Radio, Globe } from 'lucide-react';

interface EvolutionaryObservatoryProps {
  stats: EvolutionaryStats;
  speciesRegistry: Map<string, SpeciesRecord>;
  organisms: Organism[];
  onClose: () => void;
  onSelectOrganism: (org: Organism) => void;
}

export const EvolutionaryObservatory: React.FC<EvolutionaryObservatoryProps> = ({
  stats,
  speciesRegistry,
  organisms,
  onClose,
  onSelectOrganism
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'phylogeny' | 'acoustic'>('overview');

  const speciesList = Array.from(speciesRegistry.values());
  const activeSpecies = speciesList.filter((s) => s.count > 0);
  const extinctSpecies = speciesList.filter((s) => s.count === 0);

  // Frequency bands breakdown for acoustic biodiversity
  const freqBands = [
    { label: 'Sub-Bass (<80Hz)', count: organisms.filter((o) => o.genome.baseFrequency < 80).length },
    { label: 'Bass (80-250Hz)', count: organisms.filter((o) => o.genome.baseFrequency >= 80 && o.genome.baseFrequency < 250).length },
    { label: 'Mid (250-600Hz)', count: organisms.filter((o) => o.genome.baseFrequency >= 250 && o.genome.baseFrequency < 600).length },
    { label: 'High (>600Hz)', count: organisms.filter((o) => o.genome.baseFrequency >= 600).length }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col border border-emerald-500/30 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-emerald-500/20 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="font-sci-head font-bold text-base tracking-wider text-emerald-300">
                EVOLUTIONARY OBSERVATORY & SONIC ECOLOGY
              </h2>
              <p className="text-xs font-mono-sci text-slate-400">
                Scientific telemetry, phylogenetic taxonomy, and acoustic biodiversity
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

        {/* Top Metric Cards */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 border-b border-emerald-500/15 font-mono-sci">
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Organisms</span>
            <span className="text-xl font-sci-head font-bold text-sky-400">{stats.population}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Active acoustic voices</span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sonic Diversity Index</span>
            <span className="text-xl font-sci-head font-bold text-emerald-400">{stats.sonicBiodiversityIndex}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Shannon entropy H</span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Living Species</span>
            <span className="text-xl font-sci-head font-bold text-purple-400">{activeSpecies.length}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{extinctSpecies.length} extinct</span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Max Generation</span>
            <span className="text-xl font-sci-head font-bold text-amber-400">Gen {stats.generationMax}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{stats.birthsTotal} total births</span>
          </div>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 font-mono-sci text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 py-2.5 px-4 font-bold border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe size={14} /> Species Taxonomy
          </button>
          <button
            onClick={() => setActiveTab('acoustic')}
            className={`flex items-center gap-2 py-2.5 px-4 font-bold border-b-2 transition ${
              activeTab === 'acoustic'
                ? 'border-sky-400 text-sky-300 bg-sky-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio size={14} /> Acoustic Frequency Spread
          </button>
          <button
            onClick={() => setActiveTab('phylogeny')}
            className={`flex items-center gap-2 py-2.5 px-4 font-bold border-b-2 transition ${
              activeTab === 'phylogeny'
                ? 'border-purple-400 text-purple-300 bg-purple-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dna size={14} /> Living Specimens ({organisms.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 font-mono-sci text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-300 uppercase tracking-wider">Active Taxonomic Species</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeSpecies.map((spec) => (
                  <div
                    key={spec.id}
                    className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full shadow"
                        style={{ backgroundColor: spec.color }}
                      />
                      <div>
                        <h4 className="font-sci-head font-bold text-slate-200">{spec.name}</h4>
                        <span className="text-[10px] text-slate-400">
                          {spec.bodyType} &bull; {spec.oscType.toUpperCase()} @ ~{Math.round(spec.avgFreq)}Hz
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-emerald-400">{spec.count}</span>
                      <span className="text-[10px] text-slate-500 block">individuals</span>
                    </div>
                  </div>
                ))}
              </div>

              {extinctSpecies.length > 0 && (
                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-slate-400 uppercase tracking-wider mb-2 text-[11px]">
                    Extinct Lineages ({extinctSpecies.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {extinctSpecies.map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-1 bg-slate-950/80 border border-slate-800 text-slate-500 rounded text-[10px]"
                      >
                        {s.name} (Emergence Gen {s.firstGeneration})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'acoustic' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Acoustic Niche Partitioning (Frequency Octave Bins)
                </h3>
                <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  {freqBands.map((band) => {
                    const percent = stats.population > 0 ? (band.count / stats.population) * 100 : 0;
                    return (
                      <div key={band.label} className="space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span>{band.label}</span>
                          <span className="text-sky-300 font-bold">
                            {band.count} organisms ({percent.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-300 text-xs">Bioacoustic Principle</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  In natural habitats, organisms evolve to occupy distinct acoustic frequency niches to avoid signal masking.
                  High biodiversity values indicate an evenly distributed frequency spectrum across sub-bass drones, warm mid harmonics, and crisp high-frequency clicks.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'phylogeny' && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-300 uppercase tracking-wider mb-2">
                Living Population Registry (Click to Inspect)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {organisms.map((org) => (
                  <div
                    key={org.id}
                    onClick={() => {
                      onSelectOrganism(org);
                      onClose();
                    }}
                    className="p-3 bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-xl cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: `hsl(${org.genome.hue}, ${org.genome.saturation}%, 60%)` }}
                      />
                      <div>
                        <div className="font-sci-head font-bold text-slate-200">{org.name}</div>
                        <div className="text-[10px] text-slate-400">
                          Gen {org.generation} &bull; {org.speciesName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-[11px]">
                      <span className="text-sky-300 font-bold">{Math.round(org.genome.baseFrequency)} Hz</span>
                      <span className="text-[10px] text-slate-500 block capitalize">{org.genome.bodyType}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
