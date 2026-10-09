import { Genome, MusicalScale, AcousticCallType } from '../types/ecosystem';

// Scale quantization frequencies (base A = 440)
const SCALE_INTERVALS: Record<MusicalScale, number[]> = {
  none: [],
  microtonal: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5],
  pentatonic: [0, 2, 4, 7, 9], // Minor pentatonic or major
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  just_intonation: [0, 2.04, 3.86, 4.98, 7.02, 8.84, 10.88]
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayGain: GainNode | null = null;
  private delayFilter: BiquadFilterNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private specimenAnalyser: AnalyserNode | null = null;

  // Ambient Drone
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  // Voice pooling
  private activeVoicesCount = 0;
  private maxConcurrentVoices = 20;

  // Settings
  private isMuted = false;
  private masterVolume = 0.75;
  private scale: MusicalScale = 'none';

  // WAV Recording
  private isRecording = false;
  private recordStartTime = 0;
  private recBuffersLeft: Float32Array[] = [];
  private recBuffersRight: Float32Array[] = [];
  private recLength = 0;
  private recordNode: ScriptProcessorNode | null = null;

  // Pre-generated noise buffer
  private whiteNoiseBuffer: AudioBuffer | null = null;

  constructor() {
    // AudioContext will be initialized on user interaction
  }

  public init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    // Master Compressor / Limiter
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);

    // Master Filter
    this.masterFilter = this.ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.setValueAtTime(8000, this.ctx.currentTime);

    // Analysers
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 512;
    this.masterAnalyser.smoothingTimeConstant = 0.85;

    this.specimenAnalyser = this.ctx.createAnalyser();
    this.specimenAnalyser.fftSize = 256;
    this.specimenAnalyser.smoothingTimeConstant = 0.8;

    // Convolver Reverb
    this.reverbNode = this.ctx.createConvolver();
    this.setReverbTime(2.5);

    // Stereo Delay with feedback
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(0.35, this.ctx.currentTime);

    this.delayGain = this.ctx.createGain();
    this.delayGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    this.delayFilter = this.ctx.createBiquadFilter();
    this.delayFilter.type = 'lowpass';
    this.delayFilter.frequency.setValueAtTime(2500, this.ctx.currentTime);

    // Delay loop: delay -> filter -> delayGain -> delay
    this.delayNode.connect(this.delayFilter);
    this.delayFilter.connect(this.delayGain);
    this.delayGain.connect(this.delayNode);

    // Connect effects bus to compressor -> masterGain -> analyser -> destination
    const effectsBus = this.ctx.createGain();
    effectsBus.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.reverbNode.connect(effectsBus);
    this.delayGain.connect(effectsBus);

    // Main connections
    this.masterFilter.connect(this.compressor);
    effectsBus.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);

    // Generate noise buffer
    this.createNoiseBuffer();

    // Start ambient background sound
    this.initAmbientDrone();
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    this.whiteNoiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.whiteNoiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  // Habitat Reverb setup
  public setReverbTime(seconds: number) {
    if (!this.ctx || !this.reverbNode) return;
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * Math.max(0.2, Math.min(6.0, seconds)));
    const decay = 2.5;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const env = Math.pow(1 - n, decay);
      left[i] = (Math.random() * 2 - 1) * env;
      right[i] = (Math.random() * 2 - 1) * env;
    }

    this.reverbNode.buffer = impulse;
  }

  // Ambient Drone Engine
  public setAmbientDrone(freq: number, gain: number, type: 'sub' | 'shimmer' | 'static' | 'warm' | 'void') {
    if (!this.ctx || !this.ambientGain || !this.ambientOsc1 || !this.ambientOsc2) return;
    const now = this.ctx.currentTime;
    const targetGain = this.isMuted ? 0 : gain * 0.5;

    this.ambientGain.gain.linearRampToValueAtTime(targetGain, now + 1.5);
    this.ambientOsc1.frequency.linearRampToValueAtTime(freq, now + 2.0);

    if (type === 'shimmer') {
      this.ambientOsc1.type = 'triangle';
      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.linearRampToValueAtTime(freq * 1.5, now + 2.0);
    } else if (type === 'warm') {
      this.ambientOsc1.type = 'sine';
      this.ambientOsc2.type = 'triangle';
      this.ambientOsc2.frequency.linearRampToValueAtTime(freq * 1.333, now + 2.0);
    } else if (type === 'void') {
      this.ambientOsc1.type = 'sine';
      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.linearRampToValueAtTime(freq * 0.5, now + 2.0);
    } else {
      this.ambientOsc1.type = 'sine';
      this.ambientOsc2.type = 'sawtooth';
      this.ambientOsc2.frequency.linearRampToValueAtTime(freq * 2.0, now + 2.0);
    }
  }

  private initAmbientDrone() {
    if (!this.ctx) return;
    this.ambientOsc1 = this.ctx.createOscillator();
    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientGain = this.ctx.createGain();

    this.ambientOsc1.type = 'sine';
    this.ambientOsc1.frequency.setValueAtTime(43.65, this.ctx.currentTime);
    this.ambientOsc2.type = 'sine';
    this.ambientOsc2.frequency.setValueAtTime(87.3, this.ctx.currentTime);

    const ambientFilter = this.ctx.createBiquadFilter();
    ambientFilter.type = 'lowpass';
    ambientFilter.frequency.setValueAtTime(600, this.ctx.currentTime);

    this.ambientGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    this.ambientOsc1.connect(ambientFilter);
    this.ambientOsc2.connect(ambientFilter);
    ambientFilter.connect(this.ambientGain);

    if (this.masterFilter) {
      this.ambientGain.connect(this.masterFilter);
    }

    this.ambientOsc1.start();
    this.ambientOsc2.start();
  }

  // Quantize frequency to musical scale if desired
  public quantizePitch(freq: number): number {
    if (this.scale === 'none') return freq;
    const intervals = SCALE_INTERVALS[this.scale];
    if (!intervals || intervals.length === 0) return freq;

    // Convert freq to MIDI note
    const midi = 69 + 12 * Math.log2(freq / 440);
    const midiRound = Math.round(midi);
    const octave = Math.floor(midiRound / 12);
    const semitone = ((midiRound % 12) + 12) % 12;

    // Find nearest interval
    let bestInterval = intervals[0];
    let minDiff = 999;
    for (const int of intervals) {
      const diff = Math.abs(semitone - int);
      if (diff < minDiff) {
        minDiff = diff;
        bestInterval = int;
      }
    }

    const targetMidi = octave * 12 + bestInterval;
    return 440 * Math.pow(2, (targetMidi - 69) / 12);
  }

  // Synthesize and play an organism acoustic voice call
  public triggerVoice(
    genome: Genome,
    panX: number, // -1.0 to 1.0 (stereo spatial position)
    callType: AcousticCallType,
    isSolo: boolean = false,
    isSelected: boolean = false
  ): { duration: number } {
    if (!this.ctx || this.isMuted) return { duration: 0.1 };
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.activeVoicesCount >= this.maxConcurrentVoices && !isSelected && !isSolo) {
      return { duration: 0.1 };
    }

    this.activeVoicesCount++;
    const now = this.ctx.currentTime;

    // Pitch modification based on call type
    let baseFreq = this.quantizePitch(genome.baseFrequency);
    let pitchMod = 1.0;
    let attackTime = genome.attack;
    let decayTime = genome.decay;
    let releaseTime = genome.release;
    let callGain = 0.28;

    if (callType === 'mating') {
      pitchMod = 1.25; // sweet major third upward
      callGain *= 1.2;
    } else if (callType === 'distress') {
      pitchMod = 0.75; // downward droop
      attackTime = 0.01;
      callGain *= 1.1;
    } else if (callType === 'territorial') {
      pitchMod = 1.5; // aggressive high interval
      callGain *= 1.3;
    } else if (callType === 'sync') {
      pitchMod = 1.0; // pure pitch
    }

    const freq = Math.max(30, Math.min(4500, baseFreq * pitchMod));
    const totalDuration = attackTime + decayTime + releaseTime;

    // Spatial Panner Node
    let panner: StereoPannerNode | null = null;
    try {
      if (this.ctx.createStereoPanner) {
        panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panX)), now);
      }
    } catch {
      panner = null;
    }

    // Voice Gain Envelope
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.linearRampToValueAtTime(callGain, now + attackTime);
    const sustainLevel = Math.max(0.0001, callGain * genome.sustain);
    voiceGain.gain.exponentialRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + totalDuration);

    // Voice Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = genome.filterType;
    filter.frequency.setValueAtTime(Math.max(80, Math.min(12000, genome.filterCutoff)), now);
    filter.Q.setValueAtTime(genome.filterResonance, now);

    // Dynamic filter sweep
    if (callType === 'territorial') {
      filter.frequency.exponentialRampToValueAtTime(Math.min(14000, genome.filterCutoff * 2.2), now + attackTime);
      filter.frequency.exponentialRampToValueAtTime(Math.max(100, genome.filterCutoff * 0.5), now + totalDuration);
    } else if (callType === 'mating') {
      filter.frequency.linearRampToValueAtTime(Math.min(10000, genome.filterCutoff * 1.5), now + totalDuration * 0.5);
    }

    // Oscillator synthesis based on genome
    const oscType = genome.oscType;
    let primarySource: AudioNode | null = null;

    if (oscType === 'fm') {
      // FM Synthesis: Carrier + Modulator
      const carrier = this.ctx.createOscillator();
      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(freq, now);

      const mod = this.ctx.createOscillator();
      mod.type = 'triangle';
      mod.frequency.setValueAtTime(freq * Math.max(0.2, genome.fmMul), now);

      const modGain = this.ctx.createGain();
      const modDepth = freq * genome.fmIndex;
      modGain.gain.setValueAtTime(modDepth, now);
      modGain.gain.exponentialRampToValueAtTime(Math.max(1, modDepth * 0.1), now + totalDuration);

      mod.connect(modGain);
      modGain.connect(carrier.frequency);

      mod.start(now);
      mod.stop(now + totalDuration + 0.1);
      carrier.start(now);
      carrier.stop(now + totalDuration + 0.1);

      primarySource = carrier;
    } else if (oscType === 'noise' && this.whiteNoiseBuffer) {
      // Noise burst synthesis (glitch / crackle)
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = this.whiteNoiseBuffer;
      noiseSource.loop = true;
      noiseSource.playbackRate.setValueAtTime(Math.max(0.3, freq / 440), now);
      noiseSource.start(now);
      noiseSource.stop(now + totalDuration + 0.1);
      primarySource = noiseSource;
    } else if (oscType === 'pulse') {
      // Pulse click / sharp chirp
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * 1.5, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(25, freq * 0.3), now + totalDuration);
      osc.start(now);
      osc.stop(now + totalDuration + 0.1);
      primarySource = osc;
    } else {
      // Standard Subtractive (sine, triangle, saw, square)
      const osc = this.ctx.createOscillator();
      osc.type = (oscType === 'sawtooth' || oscType === 'square' || oscType === 'triangle') ? oscType : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Slight natural vibrato
      if (genome.pulseRate > 1.0) {
        const vibrato = this.ctx.createOscillator();
        const vibGain = this.ctx.createGain();
        vibrato.frequency.setValueAtTime(genome.pulseRate * 2.5, now);
        vibGain.gain.setValueAtTime(freq * 0.02, now);
        vibrato.connect(vibGain);
        vibGain.connect(osc.frequency);
        vibrato.start(now);
        vibrato.stop(now + totalDuration + 0.1);
      }

      osc.start(now);
      osc.stop(now + totalDuration + 0.1);
      primarySource = osc;
    }

    if (primarySource) {
      primarySource.connect(filter);
      filter.connect(voiceGain);

      let finalNode: AudioNode = voiceGain;
      if (panner) {
        voiceGain.connect(panner);
        finalNode = panner;
      }

      // Route to master filter & effects
      if (this.masterFilter) {
        finalNode.connect(this.masterFilter);
      }
      if (this.reverbNode) {
        finalNode.connect(this.reverbNode);
      }
      if (this.delayNode) {
        finalNode.connect(this.delayNode);
      }

      // If selected organism, route to specimen analyser for waveform visualizer!
      if (isSelected && this.specimenAnalyser) {
        finalNode.connect(this.specimenAnalyser);
      }
    }

    // Decrement voice counter when finished
    setTimeout(() => {
      this.activeVoicesCount = Math.max(0, this.activeVoicesCount - 1);
    }, (totalDuration + 0.1) * 1000);

    return { duration: totalDuration };
  }

  // Play a specimen preview sound for mutation lab / specimen library
  public previewGenomeSound(genome: Genome) {
    this.triggerVoice(genome, 0, 'sync', true, true);
  }

  // Musical Scale quantization setting
  public setScale(scale: MusicalScale) {
    this.scale = scale;
  }

  public getScale(): MusicalScale {
    return this.scale;
  }

  // Master volume and mute
  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Visualizer data getters
  public getMasterFrequencyData(array: Uint8Array<any>) {
    if (this.masterAnalyser) {
      (this.masterAnalyser as any).getByteFrequencyData(array);
    }
  }

  public getMasterTimeDomainData(array: Uint8Array<any>) {
    if (this.masterAnalyser) {
      (this.masterAnalyser as any).getByteTimeDomainData(array);
    }
  }

  public getSpecimenTimeDomainData(array: Uint8Array<any>) {
    if (this.specimenAnalyser) {
      (this.specimenAnalyser as any).getByteTimeDomainData(array);
    }
  }

  // Audio Recording (WAV Export)
  public startRecording(): boolean {
    if (!this.ctx || !this.masterGain) return false;
    if (this.isRecording) return true;

    this.recBuffersLeft = [];
    this.recBuffersRight = [];
    this.recLength = 0;
    this.recordStartTime = Date.now();

    // Create ScriptProcessor node for capturing raw PCM samples
    const bufferSize = 4096;
    this.recordNode = this.ctx.createScriptProcessor(bufferSize, 2, 2);
    this.recordNode.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const left = e.inputBuffer.getChannelData(0);
      const right = e.inputBuffer.getChannelData(1);
      this.recBuffersLeft.push(new Float32Array(left));
      this.recBuffersRight.push(new Float32Array(right));
      this.recLength += bufferSize;
    };

    this.masterGain.connect(this.recordNode);
    this.recordNode.connect(this.ctx.destination);
    this.isRecording = true;
    return true;
  }

  public stopRecording(): { blob: Blob; duration: number } | null {
    if (!this.isRecording || !this.ctx) return null;
    this.isRecording = false;

    if (this.recordNode && this.masterGain) {
      this.masterGain.disconnect(this.recordNode);
      this.recordNode.disconnect();
      this.recordNode = null;
    }

    const duration = (Date.now() - this.recordStartTime) / 1000;

    // Merge buffers
    const bufferL = this.mergeBuffers(this.recBuffersLeft, this.recLength);
    const bufferR = this.mergeBuffers(this.recBuffersRight, this.recLength);
    const wavBlob = this.encodeWAV(bufferL, bufferR, this.ctx.sampleRate);

    this.recBuffersLeft = [];
    this.recBuffersRight = [];
    this.recLength = 0;

    return { blob: wavBlob, duration };
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public getRecordingDuration(): number {
    if (!this.isRecording) return 0;
    return (Date.now() - this.recordStartTime) / 1000;
  }

  private mergeBuffers(buffers: Float32Array[], length: number): Float32Array {
    const result = new Float32Array(length);
    let offset = 0;
    for (const b of buffers) {
      result.set(b, offset);
      offset += b.length;
    }
    return result;
  }

  private encodeWAV(samplesL: Float32Array, samplesR: Float32Array, sampleRate: number): Blob {
    const numChannels = 2;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samplesL.length * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // RIFF chunk descriptor
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');

    // fmt sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write interleaved 16-bit PCM samples
    let offset = 44;
    for (let i = 0; i < samplesL.length; i++) {
      const sL = Math.max(-1, Math.min(1, samplesL[i]));
      const sR = Math.max(-1, Math.min(1, samplesR[i]));
      view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7fff, true);
      offset += 2;
      view.setInt16(offset, sR < 0 ? sR * 0x8000 : sR * 0x7fff, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }
}

export const globalAudioEngine = new AudioEngine();
