import { EQ_BANDS, EQ_MAX_DB, EQ_MIN_DB } from './constants';

export type GainTuple = [number, number, number, number, number];

export interface CustomPreset {
  id: string;
  name: string;
  gains: GainTuple;
  createdAt: string;
  updatedAt: string;
}

export interface BuiltinPreset {
  id: string;
  name: string;
  description: string;
  gains: GainTuple;
  builtin: true;
}

export const BUILTIN_PRESETS: BuiltinPreset[] = [
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Neutral reference. All bands at 0 dB.',
    gains: [0, 0, 0, 0, 0],
    builtin: true,
  },
  {
    id: 'bass',
    name: 'Bass Boost',
    description: 'Low-end lift with a slightly tamed top.',
    gains: [6, 3.5, 0, -1, -1.5],
    builtin: true,
  },
  {
    id: 'vocal',
    name: 'Vocal',
    description: 'Presence around the midrange for voices.',
    gains: [-2, 1, 5, 3, 0.5],
    builtin: true,
  },
  {
    id: 'rock',
    name: 'Rock',
    description: 'Punch in the lows and air in the highs.',
    gains: [4, 2, -1, 3, 3.5],
    builtin: true,
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Slight bass and treble emphasis for effects and spatial cues.',
    gains: [3, 1, 0, 2.5, 4.5],
    builtin: true,
  },
];

export const DEFAULT_GAINS: GainTuple = [0, 0, 0, 0, 0];

export function clampGain(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const stepped = Math.round(value * 2) / 2;
  return Math.min(EQ_MAX_DB, Math.max(EQ_MIN_DB, stepped));
}

export function normalizeGains(input: unknown): GainTuple {
  if (!Array.isArray(input) || input.length !== EQ_BANDS.length) {
    return [...DEFAULT_GAINS];
  }
  return input.map((value) => clampGain(Number(value))) as GainTuple;
}

export function gainsEqual(a: GainTuple, b: GainTuple): boolean {
  return a.every((value, index) => value === b[index]);
}

export function formatHz(hz: number): string {
  if (hz >= 1000) return `${hz / 1000} kHz`;
  return `${hz} Hz`;
}

export function formatDb(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)} dB`;
}

export function findMatchingPreset(
  gains: GainTuple,
  custom: CustomPreset[],
): { id: string; name: string } | null {
  const builtin = BUILTIN_PRESETS.find((preset) => gainsEqual(preset.gains, gains));
  if (builtin) return { id: builtin.id, name: builtin.name };
  const saved = custom.find((preset) => gainsEqual(preset.gains, gains));
  if (saved) return { id: saved.id, name: saved.name };
  return null;
}
