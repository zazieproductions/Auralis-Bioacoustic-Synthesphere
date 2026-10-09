import React, { useState, useEffect } from 'react';
import { SavedSpecimen } from '../types/ecosystem';
import { SPECIMEN_ARCHETYPES } from '../simulation/genetics';
import { globalAudioEngine } from '../audio/AudioEngine';
import { X, Bookmark, Play, PlusCircle, Trash2, Download, Upload } from 'lucide-react';

interface SpecimenVaultProps {
  onClose: () => void;
  onSpawnSpecimen: (specimen: SavedSpecimen) => void;
}

const STORAGE_KEY = 'sonogenesis_saved_specimens';

export const SpecimenVault: React.FC<SpecimenVaultProps> = ({ onClose, onSpawnSpecimen }) => {
  const [specimens, setSpecimens] = useState<SavedSpecimen[]>([]);
  const [filter, setFilter] = useState<'all' | 'archetypes' | 'custom'>('all');

  useEffect(() => {
    // Load custom saved specimens from localStorage and combine with archetypes
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed: SavedSpecimen[] = saved ? JSON.parse(saved) : [];
      setSpecimens([...SPECIMEN_ARCHETYPES, ...parsed]);
    } catch {
      setSpecimens(SPECIMEN_ARCHETYPES);
    }
  }, []);

  const handleAudition = (specimen: SavedSpecimen) => {
    globalAudioEngine.previewGenomeSound(specimen.genome);
  };

  const handleDelete = (id: string) => {
    const updated = specimens.filter((s) => s.id !== id);
    setSpecimens(updated);
    try {
      const customOnly = updated.filter((s) => !SPECIMEN_ARCHETYPES.some((a) => a.id === s.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
    } catch {
      // storage error fallback
    }
  };

  const handleExportJSON = (specimen: SavedSpecimen) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(specimen, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${specimen.name.replace(/\s+/g, '_')}_genome.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported: SavedSpecimen = JSON.parse(event.target?.result as string);
        if (imported.genome && imported.name) {
          const newSpec: SavedSpecimen = {
            ...imported,
            id: 'imported_' + Date.now().toString(36),
            savedAt: Date.now()
          };
          const updated = [...specimens, newSpec];
          setSpecimens(updated);
          const customOnly = updated.filter((s) => !SPECIMEN_ARCHETYPES.some((a) => a.id === s.id));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
        }
      } catch {
        alert('Invalid genome JSON file');
      }
    };
    reader.readAsText(file);
  };

  const filteredSpecimens = specimens.filter((s) => {
    const isArchetype = SPECIMEN_ARCHETYPES.some((a) => a.id === s.id);
    if (filter === 'archetypes') return isArchetype;
    if (filter === 'custom') return !isArchetype;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col border border-sky-500/30 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-sky-500/20 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-950/80 border border-sky-500/40 text-sky-400">
              <Bookmark size={20} />
            </div>
            <div>
              <h2 className="font-sci-head font-bold text-base tracking-wider text-sky-300">
                SPECIMEN VAULT & GENOMIC CRYOBANK
              </h2>
              <p className="text-xs font-mono-sci text-slate-400">
                Curated archetypes and preserved evolutionary lineages
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

        {/* Filter bar & Import */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-sky-500/15 flex flex-wrap items-center justify-between gap-3 font-mono-sci text-xs">
          <div className="flex gap-2">
            {(['all', 'archetypes', 'custom'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`py-1 px-3 rounded-lg capitalize border font-bold transition ${
                  filter === f
                    ? 'bg-sky-900/80 border-sky-400 text-sky-200'
                    : 'bg-slate-950/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f} ({
                  specimens.filter((s) => {
                    const isA = SPECIMEN_ARCHETYPES.some((a) => a.id === s.id);
                    if (f === 'archetypes') return isA;
                    if (f === 'custom') return !isA;
                    return true;
                  }).length
                })
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 py-1 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 cursor-pointer transition">
            <Upload size={13} /> Import Genome JSON
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>

        {/* Specimen Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono-sci text-xs">
          {filteredSpecimens.map((spec) => {
            const isArchetype = SPECIMEN_ARCHETYPES.some((a) => a.id === spec.id);
            const g = spec.genome;

            return (
              <div
                key={spec.id}
                className="bg-slate-950/70 p-4 rounded-xl border border-sky-500/15 hover:border-sky-500/40 flex flex-col justify-between space-y-3 transition group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow"
                        style={{ backgroundColor: `hsl(${g.hue}, ${g.saturation}%, 60%)` }}
                      />
                      <div>
                        <h4 className="font-sci-head font-bold text-sky-300 text-sm">
                          {spec.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 italic">
                          {spec.speciesName} &bull; {g.bodyType}
                        </span>
                      </div>
                    </div>
                    {isArchetype ? (
                      <span className="text-[10px] bg-sky-950 border border-sky-500/40 text-sky-400 px-2 py-0.5 rounded-full">
                        Archetype
                      </span>
                    ) : (
                      <span className="text-[10px] bg-purple-950 border border-purple-500/40 text-purple-400 px-2 py-0.5 rounded-full">
                        Preserved
                      </span>
                    )}
                  </div>

                  {spec.description && (
                    <p className="mt-2 text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                      {spec.description}
                    </p>
                  )}

                  <div className="mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                    <div>
                      <span>Oscillator:</span>{' '}
                      <span className="text-slate-200 uppercase">{g.oscType}</span>
                    </div>
                    <div>
                      <span>Pitch:</span>{' '}
                      <span className="text-slate-200">{Math.round(g.baseFrequency)} Hz</span>
                    </div>
                    <div>
                      <span>Symmetry:</span>{' '}
                      <span className="text-slate-200">{g.symmetry}-fold</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAudition(spec)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-sky-300 transition"
                      title="Audition Voice"
                    >
                      <Play size={13} />
                    </button>
                    <button
                      onClick={() => handleExportJSON(spec)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 transition"
                      title="Export JSON"
                    >
                      <Download size={13} />
                    </button>
                    {!isArchetype && (
                      <button
                        onClick={() => handleDelete(spec.id)}
                        className="p-1.5 bg-slate-900 hover:bg-rose-950/60 border border-rose-800/40 rounded text-rose-300 transition"
                        title="Delete Specimen"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onSpawnSpecimen(spec);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 py-1 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold shadow transition"
                  >
                    <PlusCircle size={13} /> Spawn Specimen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
