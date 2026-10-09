import React from 'react';
import { Habitat } from '../types/ecosystem';
import { HABITATS } from '../simulation/habitats';
import { X, Sliders, Waves, Compass } from 'lucide-react';

interface HabitatEditorProps {
  currentHabitat: Habitat;
  onSelectHabitatPreset: (key: string) => void;
  onUpdateHabitat: (updated: Habitat) => void;
  onClose: () => void;
}

export const HabitatEditor: React.FC<HabitatEditorProps> = ({
  currentHabitat,
  onSelectHabitatPreset,
  onUpdateHabitat,
  onClose
}) => {
  const updateParam = <K extends keyof Habitat>(key: K, val: Habitat[K]) => {
    onUpdateHabitat({ ...currentHabitat, [key]: val });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] rounded-2xl flex flex-col border border-sky-500/30 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-sky-500/20 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-950/80 border border-sky-500/40 text-sky-400">
              <Compass size={20} />
            </div>
            <div>
              <h2 className="font-sci-head font-bold text-base tracking-wider text-sky-300">
                HABITAT PARAMETERS & ACOUSTIC CLIMATE
              </h2>
              <p className="text-xs font-mono-sci text-slate-400">
                Real-time manipulation of environmental physics and acoustic reverberation
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

        {/* Habitat Preset Quick Selector */}
        <div className="p-4 bg-slate-900/60 border-b border-sky-500/15 font-mono-sci text-xs">
          <label className="text-slate-400 block mb-2 font-bold">HABITAT PRESET BIOMES:</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.entries(HABITATS).map(([key, h]) => (
              <button
                key={key}
                onClick={() => onSelectHabitatPreset(key)}
                className={`p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                  currentHabitat.id === h.id
                    ? 'bg-sky-950/90 border-sky-400 shadow'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: h.accentColor }}
                  />
                  <span className="font-bold text-slate-200 text-[11px] truncate">{h.name}</span>
                </div>
                <span className="text-[9px] text-slate-400 truncate">{h.ambientDroneType.toUpperCase()} Drone</span>
              </button>
            ))}
          </div>
        </div>

        {/* Environmental Physics Controls */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono-sci text-xs">
          <div className="space-y-4">
            <h3 className="font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders size={14} /> Fluid Dynamics & Nutrient Inflow
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Fluid Viscosity (Drag):</span>
                  <span className="text-sky-300 font-bold">{currentHabitat.viscosity.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.90"
                  max="0.99"
                  step="0.005"
                  value={currentHabitat.viscosity}
                  onChange={(e) => updateParam('viscosity', parseFloat(e.target.value))}
                  className="w-full accent-sky-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Nutrient Inflow Rate:</span>
                  <span className="text-sky-300 font-bold">{currentHabitat.nutrientSpawnRate.toFixed(1)}/s</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="4.0"
                  step="0.1"
                  value={currentHabitat.nutrientSpawnRate}
                  onChange={(e) => updateParam('nutrientSpawnRate', parseFloat(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Max Nutrients Capacity:</span>
                  <span className="text-sky-300 font-bold">{currentHabitat.maxNutrients}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  step="5"
                  value={currentHabitat.maxNutrients}
                  onChange={(e) => updateParam('maxNutrients', parseInt(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Radiation / Mutation Pressure:</span>
                  <span className="text-amber-300 font-bold">{(currentHabitat.radiationMutationRate * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.45"
                  step="0.01"
                  value={currentHabitat.radiationMutationRate}
                  onChange={(e) => updateParam('radiationMutationRate', parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Acoustic Resonance & Ambient Acoustics */}
          <div className="space-y-4">
            <h3 className="font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Waves size={14} /> Acoustic Medium & Reverb Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Acoustic Reverb Decay:</span>
                  <span className="text-purple-300 font-bold">{currentHabitat.acousticReverbTime.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="6.0"
                  step="0.1"
                  value={currentHabitat.acousticReverbTime}
                  onChange={(e) => updateParam('acousticReverbTime', parseFloat(e.target.value))}
                  className="w-full accent-purple-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Ambient Drone Frequency:</span>
                  <span className="text-purple-300 font-bold">{currentHabitat.ambientDroneFreq.toFixed(1)} Hz</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="350"
                  step="1"
                  value={currentHabitat.ambientDroneFreq}
                  onChange={(e) => updateParam('ambientDroneFreq', parseFloat(e.target.value))}
                  className="w-full accent-purple-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Ambient Drone Volume:</span>
                  <span className="text-purple-300 font-bold">{(currentHabitat.ambientDroneGain * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.25"
                  step="0.01"
                  value={currentHabitat.ambientDroneGain}
                  onChange={(e) => updateParam('ambientDroneGain', parseFloat(e.target.value))}
                  className="w-full accent-purple-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Atmospheric Pressure:</span>
                  <span className="text-sky-300 font-bold">{currentHabitat.pressure.toFixed(2)} atm</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.5"
                  step="0.05"
                  value={currentHabitat.pressure}
                  onChange={(e) => updateParam('pressure', parseFloat(e.target.value))}
                  className="w-full accent-sky-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-sky-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-6 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold font-mono-sci text-xs shadow-lg transition"
          >
            Apply & Return
          </button>
        </div>
      </div>
    </div>
  );
};
