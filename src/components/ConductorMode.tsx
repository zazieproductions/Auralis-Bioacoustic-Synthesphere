import React, { useState, useEffect } from 'react';
import { MusicalScale } from '../types/ecosystem';
import { globalAudioEngine } from '../audio/AudioEngine';
import { X, Mic, Square, Download, Sparkles, Sliders, Music, Radio, Zap } from 'lucide-react';

interface ConductorModeProps {
  onClose: () => void;
  onTriggerCue: (cueType: 'spore_bloom' | 'radiation_flare' | 'hadal_chill' | 'resonance_surge' | 'static_discharge') => void;
  currentScale: MusicalScale;
  onChangeScale: (scale: MusicalScale) => void;
}

export const ConductorMode: React.FC<ConductorModeProps> = ({
  onClose,
  onTriggerCue,
  currentScale,
  onChangeScale
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(globalAudioEngine.getIsRecording());
  const [recDuration, setRecDuration] = useState<number>(0);
  const [recordedWav, setRecordedWav] = useState<{ blob: Blob; duration: number } | null>(null);

  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecDuration(globalAudioEngine.getRecordingDuration());
      }, 200);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleToggleRecord = () => {
    if (!isRecording) {
      const ok = globalAudioEngine.startRecording();
      if (ok) {
        setIsRecording(true);
        setRecordedWav(null);
      }
    } else {
      const result = globalAudioEngine.stopRecording();
      setIsRecording(false);
      if (result) {
        setRecordedWav(result);
      }
    }
  };

  const handleDownloadWav = () => {
    if (!recordedWav) return;
    const url = URL.createObjectURL(recordedWav.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AURALIS_Synthesphere_Session_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.wav`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] rounded-2xl flex flex-col border border-amber-500/30 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-amber-500/20 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400">
              <Music size={20} />
            </div>
            <div>
              <h2 className="font-sci-head font-bold text-base tracking-wider text-amber-300">
                CONDUCTOR CONSOLE & ECOLOGICAL COMPOSITION
              </h2>
              <p className="text-xs font-mono-sci text-slate-400">
                The ecosystem is the orchestra. Evolution is the composer. You are the conductor.
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

        {/* Master Recorder Strip */}
        <div className="p-5 bg-slate-900/80 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-4 font-mono-sci text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleRecord}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl font-bold shadow-lg transition ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/40'
              }`}
            >
              {isRecording ? <Square size={14} /> : <Mic size={14} />}
              {isRecording ? 'Stop Recording' : 'Record Master Audio'}
            </button>

            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-200">
              <span className="text-slate-400 text-[10px] block">TAPE TIME</span>
              <span className="font-bold text-sm tracking-wider text-amber-300">
                {formatTime(recDuration)}
              </span>
            </div>
          </div>

          {recordedWav && (
            <div className="flex items-center gap-3 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
              <span className="text-emerald-300 text-xs">
                Capture Ready ({formatTime(recordedWav.duration)})
              </span>
              <button
                onClick={handleDownloadWav}
                className="flex items-center gap-1.5 py-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold shadow transition"
              >
                <Download size={13} /> Export .WAV
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono-sci text-xs">
          {/* Harmonic Scale Quantization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Radio size={14} /> Musical Harmonic Scale Clamping
              </h3>
              <span className="text-slate-400">Current: {currentScale.toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  ['none', 'Raw Frequency (Free Hz)'],
                  ['microtonal', 'Microtonal Alien (Quarter Tones)'],
                  ['pentatonic', 'Pentatonic (Organic Consonance)'],
                  ['dorian', 'Dorian Mode (Celestial Modern)'],
                  ['phrygian', 'Phrygian (Dark Alien Drone)'],
                  ['harmonic_minor', 'Harmonic Minor (Exotic Tension)'],
                  ['just_intonation', 'Just Intonation (Pure Resonance)']
                ] as [MusicalScale, string][]
              ).map(([scKey, scLabel]) => (
                <button
                  key={scKey}
                  onClick={() => onChangeScale(scKey)}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    currentScale === scKey
                      ? 'bg-amber-950/90 border-amber-400 text-amber-200 shadow'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-[11px] capitalize">{scKey.replace('_', ' ')}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{scLabel}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Ecological Conductor Event Triggers */}
          <div className="space-y-3">
            <h3 className="font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} /> Environmental Event Triggers (Atmospheric Cues)
            </h3>
            <p className="text-slate-400 text-[11px]">
              Trigger sudden atmospheric changes to shift biological behavior, provoke mating swarms, or spark sonic cascades:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => onTriggerCue('spore_bloom')}
                className="p-3 bg-slate-950/80 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition group"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                  <Sparkles size={14} /> Tide of Spores (Nutrient Bloom)
                </div>
                <div className="text-slate-400 text-[11px]">
                  Floods the fluid with nutrient spores, inducing high energy foraging and rapid polyphonic reproduction.
                </div>
              </button>

              <button
                onClick={() => onTriggerCue('radiation_flare')}
                className="p-3 bg-slate-950/80 hover:bg-amber-950/50 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition group"
              >
                <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                  <Zap size={14} /> Radiation Flare (Mutation Surge)
                </div>
                <div className="text-slate-400 text-[11px]">
                  Electromagnetic surge alters genomes of nearby organisms, provoking unexpected pitch shifts and timbre changes.
                </div>
              </button>

              <button
                onClick={() => onTriggerCue('hadal_chill')}
                className="p-3 bg-slate-950/80 hover:bg-sky-950/50 border border-slate-800 hover:border-sky-500/50 rounded-xl text-left transition group"
              >
                <div className="flex items-center gap-2 text-sky-400 font-bold mb-1">
                  <Sliders size={14} /> Hadal Chill (Viscous Drone)
                </div>
                <div className="text-slate-400 text-[11px]">
                  Increases medium viscosity and reverb time, slowing organism movement into deep meditative drone clouds.
                </div>
              </button>

              <button
                onClick={() => onTriggerCue('static_discharge')}
                className="p-3 bg-slate-950/80 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-500/50 rounded-xl text-left transition group"
              >
                <div className="flex items-center gap-2 text-rose-400 font-bold mb-1">
                  <Radio size={14} /> Static Discharge (Glitch Burst)
                </div>
                <div className="text-slate-400 text-[11px]">
                  Electric shock induces immediate territorial warning calls and rapid sync pulses across all active colonies.
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-amber-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-6 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold font-mono-sci text-xs shadow-lg transition"
          >
            Close Conductor
          </button>
        </div>
      </div>
    </div>
  );
};
