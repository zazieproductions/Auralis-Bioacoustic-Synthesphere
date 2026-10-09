import React from 'react';
import { Habitat, EvolutionaryStats } from '../types/ecosystem';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Compass,
  Activity,
  Sliders,
  Dna,
  Bookmark,
  Music
} from 'lucide-react';

interface TopBarProps {
  isPaused: boolean;
  onTogglePause: () => void;
  simSpeed: number;
  onChangeSimSpeed: (speed: number) => void;
  onReset: () => void;
  habitat: Habitat;
  stats: EvolutionaryStats;
  isMuted: boolean;
  onToggleMute: () => void;
  masterVolume: number;
  onChangeVolume: (vol: number) => void;
  onOpenObservatory: () => void;
  onOpenMutationLab: () => void;
  onOpenBreedingChamber: () => void;
  onOpenSpecimenVault: () => void;
  onOpenHabitatEditor: () => void;
  onOpenConductor: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isPaused,
  onTogglePause,
  simSpeed,
  onChangeSimSpeed,
  onReset,
  habitat,
  stats,
  isMuted,
  onToggleMute,
  masterVolume,
  onChangeVolume,
  onOpenObservatory,
  onOpenMutationLab,
  onOpenBreedingChamber,
  onOpenSpecimenVault,
  onOpenHabitatEditor,
  onOpenConductor
}) => {
  return (
    <header className="h-14 bg-slate-950/90 backdrop-blur-md border-b border-sky-500/20 px-3 sm:px-4 flex items-center justify-between z-40 select-none font-mono-sci text-xs">
      {/* Brand & Habitat */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
          <h1 className="font-sci-head font-black tracking-wider text-sm sm:text-base bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            AURALIS
          </h1>
        </div>

        {/* Current Habitat Pill */}
        <button
          onClick={onOpenHabitatEditor}
          className="hidden md:flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-slate-900 border border-slate-700 hover:border-sky-500/50 text-slate-300 transition"
          title="Change habitat environment"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: habitat.accentColor }}
          />
          <span className="font-bold text-[11px]">{habitat.name}</span>
        </button>
      </div>

      {/* Telemetry Stats Strip */}
      <div className="hidden lg:flex items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="text-slate-500 uppercase">Organisms:</span>
          <span className="font-bold text-sky-400">{stats.population}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="text-slate-500 uppercase">Species:</span>
          <span className="font-bold text-purple-400">{stats.speciesCount}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="text-slate-500 uppercase">Depth:</span>
          <span className="font-bold text-amber-400">Gen {stats.generationMax}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="text-slate-500 uppercase">Sonic Diversity:</span>
          <span className="font-bold text-emerald-400">{stats.sonicBiodiversityIndex} H</span>
        </div>
      </div>

      {/* Primary Actions & Controls */}
      <div className="flex items-center gap-2">
        {/* Simulation Time Controls */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={onTogglePause}
            className={`p-1.5 rounded transition ${
              isPaused ? 'bg-amber-500/20 text-amber-300' : 'text-slate-300 hover:text-white'
            }`}
            title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
          </button>

          <div className="flex border-l border-slate-800 ml-1 pl-1">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSimSpeed(spd)}
                className={`px-1.5 py-0.5 text-[10px] rounded font-bold transition ${
                  simSpeed === spd
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            onClick={onReset}
            className="p-1.5 ml-1 text-slate-400 hover:text-white transition"
            title="Reseed Ecosystem"
          >
            <RotateCcw size={12} />
          </button>
        </div>

        {/* Master Audio Gain & Mute */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
          <button
            onClick={onToggleMute}
            className={`transition ${isMuted ? 'text-rose-400' : 'text-sky-400'}`}
            title={isMuted ? 'Unmute Audio Engine' : 'Mute Audio Engine'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : masterVolume}
            onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
            className="w-16 h-1 accent-sky-400 bg-slate-800"
            title="Master Audio Volume"
          />
        </div>

        {/* Console Triggers */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenObservatory}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 flex items-center gap-1.5 font-bold transition"
            title="Evolutionary Observatory"
          >
            <Activity size={13} />
            <span className="hidden xl:inline">Observatory</span>
          </button>

          <button
            onClick={onOpenMutationLab}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-400 flex items-center gap-1.5 font-bold transition"
            title="Mutation Lab & Genome Editor"
          >
            <Sliders size={13} />
            <span className="hidden xl:inline">Lab</span>
          </button>

          <button
            onClick={onOpenBreedingChamber}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-400 flex items-center gap-1.5 font-bold transition"
            title="Experimental Breeding Chamber"
          >
            <Dna size={13} />
            <span className="hidden xl:inline">Breeder</span>
          </button>

          <button
            onClick={onOpenSpecimenVault}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 flex items-center gap-1.5 font-bold transition"
            title="Specimen Vault"
          >
            <Bookmark size={13} />
            <span className="hidden xl:inline">Vault</span>
          </button>

          <button
            onClick={onOpenHabitatEditor}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 flex items-center gap-1.5 font-bold transition"
            title="Habitat Editor"
          >
            <Compass size={13} />
            <span className="hidden xl:inline">Habitat</span>
          </button>

          <button
            onClick={onOpenConductor}
            className="py-1 px-3 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white flex items-center gap-1.5 font-bold shadow-lg shadow-amber-600/20 transition"
            title="Conductor Mode & WAV Recorder"
          >
            <Music size={13} />
            <span>Conductor</span>
          </button>
        </div>
      </div>
    </header>
  );
};
