import { EQ_BANDS } from '../constants';
import { type GainTuple } from '../eq';

export type PlaybackStatus = 'idle' | 'ready' | 'playing' | 'paused' | 'ended';

export interface EngineSnapshot {
  status: PlaybackStatus;
  sourceLabel: string | null;
  sourceKind: 'none' | 'file' | 'tone';
  currentTime: number;
  duration: number;
  processing: boolean;
}

type Listener = (snapshot: EngineSnapshot) => void;

function bandFilterType(index: number): BiquadFilterType {
  const band = EQ_BANDS[index];
  return band.type;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private filters: BiquadFilterNode[] = [];
  private master: GainNode | null = null;
  private mediaElement: HTMLAudioElement | null = null;
  private mediaNode: MediaElementAudioSourceNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private oscillatorGain: GainNode | null = null;
  private objectUrl: string | null = null;
  private sourceLabel: string | null = null;
  private sourceKind: EngineSnapshot['sourceKind'] = 'none';
  private status: PlaybackStatus = 'idle';
  private gains: GainTuple = [0, 0, 0, 0, 0];
  private listeners = new Set<Listener>();
  private raf = 0;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot(): EngineSnapshot {
    const duration = this.mediaElement?.duration;
    return {
      status: this.status,
      sourceLabel: this.sourceLabel,
      sourceKind: this.sourceKind,
      currentTime: this.mediaElement?.currentTime ?? 0,
      duration: Number.isFinite(duration) ? (duration as number) : 0,
      processing: this.sourceKind !== 'none' && this.status !== 'idle',
    };
  }

  setGains(gains: GainTuple): void {
    this.gains = gains;
    this.filters.forEach((filter, index) => {
      filter.gain.value = gains[index] ?? 0;
    });
  }

  async loadFile(file: File): Promise<void> {
    this.stopTone();
    this.ensureGraph();
    const audio = this.ensureMediaElement();
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = URL.createObjectURL(file);
    audio.src = this.objectUrl;
    this.sourceLabel = file.name;
    this.sourceKind = 'file';
    this.status = 'paused';
    this.emit();
    await audio.play().then(
      () => audio.pause(),
      () => undefined,
    );
  }

  async play(): Promise<void> {
    if (this.sourceKind === 'tone') {
      await this.startTone();
      return;
    }
    if (!this.mediaElement || this.sourceKind !== 'file') {
      throw new Error('No audio file is loaded. Import a track to process it through the studio EQ.');
    }
    await this.ensureRunning();
    await this.mediaElement.play();
    this.status = 'playing';
    this.startClock();
    this.emit();
  }

  pause(): void {
    if (this.sourceKind === 'tone') {
      this.stopTone(false);
      this.status = 'paused';
      this.emit();
      return;
    }
    this.mediaElement?.pause();
    this.status = 'paused';
    this.stopClock();
    this.emit();
  }

  async toggle(): Promise<void> {
    if (this.status === 'playing') {
      this.pause();
      return;
    }
    await this.play();
  }

  seek(seconds: number): void {
    if (!this.mediaElement || this.sourceKind !== 'file') return;
    this.mediaElement.currentTime = Math.max(0, seconds);
    this.emit();
  }

  async startTone(): Promise<void> {
    this.ensureGraph();
    await this.ensureRunning();
    if (this.mediaElement) {
      this.mediaElement.pause();
    }
    this.stopTone(false);
    if (!this.context || !this.filters[0]) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 440;
    gain.gain.value = 0.08;
    oscillator.connect(gain);
    gain.connect(this.filters[0]);
    oscillator.start();
    this.oscillator = oscillator;
    this.oscillatorGain = gain;
    this.sourceKind = 'tone';
    this.sourceLabel = '440 Hz calibration tone';
    this.status = 'playing';
    this.emit();
  }

  unload(): void {
    this.pause();
    this.stopTone();
    if (this.mediaElement) {
      this.mediaElement.removeAttribute('src');
      this.mediaElement.load();
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.sourceKind = 'none';
    this.sourceLabel = null;
    this.status = 'idle';
    this.emit();
  }

  dispose(): void {
    this.unload();
    this.stopClock();
    void this.context?.close();
    this.context = null;
    this.filters = [];
    this.master = null;
    this.mediaNode = null;
    this.listeners.clear();
  }

  private stopTone(resetKind = true): void {
    try {
      this.oscillator?.stop();
    } catch {
      /* already stopped */
    }
    this.oscillator?.disconnect();
    this.oscillatorGain?.disconnect();
    this.oscillator = null;
    this.oscillatorGain = null;
    if (resetKind && this.sourceKind === 'tone') {
      this.sourceKind = 'none';
      this.sourceLabel = null;
    }
  }

  private ensureGraph(): void {
    if (this.context) return;
    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = 1;
    master.connect(context.destination);

    const filters = EQ_BANDS.map((band, index) => {
      const filter = context.createBiquadFilter();
      filter.type = bandFilterType(index);
      filter.frequency.value = band.hz;
      filter.Q.value = band.type === 'peaking' ? 1 : Math.SQRT1_2;
      filter.gain.value = this.gains[index] ?? 0;
      return filter;
    });

    filters.reduce((previous, current) => {
      previous.connect(current);
      return current;
    });
    filters[filters.length - 1]?.connect(master);

    this.context = context;
    this.filters = filters;
    this.master = master;
  }

  private ensureMediaElement(): HTMLAudioElement {
    if (this.mediaElement) return this.mediaElement;
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.addEventListener('timeupdate', () => this.emit());
    audio.addEventListener('ended', () => {
      this.status = 'ended';
      this.stopClock();
      this.emit();
    });
    audio.addEventListener('pause', () => {
      if (this.sourceKind === 'file' && this.status === 'playing') {
        this.status = 'paused';
        this.emit();
      }
    });
    audio.addEventListener('play', () => {
      this.status = 'playing';
      this.startClock();
      this.emit();
    });
    this.mediaElement = audio;
    this.ensureGraph();
    if (this.context && this.filters[0] && !this.mediaNode) {
      this.mediaNode = this.context.createMediaElementSource(audio);
      this.mediaNode.connect(this.filters[0]);
    }
    return audio;
  }

  private async ensureRunning(): Promise<void> {
    this.ensureGraph();
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  private startClock(): void {
    if (this.raf) return;
    const tick = () => {
      this.emit();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private stopClock(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private emit(): void {
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
