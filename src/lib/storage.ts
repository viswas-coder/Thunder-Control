import { BUILTIN_PRESETS, normalizeGains, type CustomPreset, type GainTuple } from './eq';
import { STORAGE_KEY, type RouteId } from './constants';

export type ThemeId = 'obsidian' | 'steel';
export type MotionPreference = 'system' | 'full' | 'reduce';

export interface Preferences {
  theme: ThemeId;
  motion: MotionPreference;
  defaultPresetId: string;
}

export interface PersistedState {
  version: 1;
  preferences: Preferences;
  gains: GainTuple;
  activePresetId: string | null;
  customPresets: CustomPreset[];
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'obsidian',
  motion: 'system',
  defaultPresetId: 'balanced',
};

function isTheme(value: unknown): value is ThemeId {
  return value === 'obsidian' || value === 'steel';
}

function isMotion(value: unknown): value is MotionPreference {
  return value === 'system' || value === 'full' || value === 'reduce';
}

function parseCustomPresets(value: unknown): CustomPreset[] {
  if (!Array.isArray(value)) return [];
  const parsed: CustomPreset[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== 'string' || typeof record.name !== 'string') continue;
    const name = record.name.trim().slice(0, 40);
    if (!name) continue;
    parsed.push({
      id: record.id,
      name,
      gains: normalizeGains(record.gains),
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
      updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : new Date().toISOString(),
    });
  }
  return parsed;
}

export function defaultState(): PersistedState {
  const balanced = BUILTIN_PRESETS[0];
  return {
    version: 1,
    preferences: { ...DEFAULT_PREFERENCES },
    gains: [...balanced.gains],
    activePresetId: balanced.id,
    customPresets: [],
  };
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaultState();
    const record = parsed as Record<string, unknown>;
    const preferencesRaw =
      record.preferences && typeof record.preferences === 'object'
        ? (record.preferences as Record<string, unknown>)
        : {};
    const customPresets = parseCustomPresets(record.customPresets);
    const defaultPresetId =
      typeof preferencesRaw.defaultPresetId === 'string' &&
      (BUILTIN_PRESETS.some((preset) => preset.id === preferencesRaw.defaultPresetId) ||
        customPresets.some((preset) => preset.id === preferencesRaw.defaultPresetId))
        ? preferencesRaw.defaultPresetId
        : DEFAULT_PREFERENCES.defaultPresetId;

    return {
      version: 1,
      preferences: {
        theme: isTheme(preferencesRaw.theme) ? preferencesRaw.theme : DEFAULT_PREFERENCES.theme,
        motion: isMotion(preferencesRaw.motion) ? preferencesRaw.motion : DEFAULT_PREFERENCES.motion,
        defaultPresetId,
      },
      gains: normalizeGains(record.gains),
      activePresetId: typeof record.activePresetId === 'string' ? record.activePresetId : null,
      customPresets,
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state: PersistedState): void {
  const payload: PersistedState = {
    version: 1,
    preferences: state.preferences,
    gains: normalizeGains(state.gains),
    activePresetId: state.activePresetId,
    customPresets: parseCustomPresets(state.customPresets),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function parseRoute(hash: string): RouteId {
  const value = hash.replace('#', '');
  if (value === 'studio' || value === 'device' || value === 'settings' || value === 'home') {
    return value;
  }
  return 'home';
}
