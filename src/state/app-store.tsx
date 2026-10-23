import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AudioEngine, type EngineSnapshot } from '../lib/audio/AudioEngine';
import { parseRoute, type RouteId } from '../lib/constants';
import { WebBluetoothAdapter, initialDeviceSnapshot } from '../lib/device/WebBluetoothAdapter';
import type { DeviceSnapshot } from '../lib/device/types';
import {
  BUILTIN_PRESETS,
  DEFAULT_GAINS,
  findMatchingPreset,
  gainsEqual,
  normalizeGains,
  type CustomPreset,
  type GainTuple,
} from '../lib/eq';
import {
  DEFAULT_PREFERENCES,
  defaultState,
  loadState,
  saveState,
  type MotionPreference,
  type Preferences,
  type ThemeId,
} from '../lib/storage';

interface ToastItem {
  id: string;
  title: string;
  body?: string;
  tone: 'info' | 'success' | 'warn' | 'error';
}

interface AppStoreValue {
  route: RouteId;
  navigate: (route: RouteId) => void;
  preferences: Preferences;
  setTheme: (theme: ThemeId) => void;
  setMotion: (motion: MotionPreference) => void;
  setDefaultPreset: (id: string) => void;
  reduceMotion: boolean;
  gains: GainTuple;
  activePresetId: string | null;
  customPresets: CustomPreset[];
  dirty: boolean;
  selectedPresetName: string;
  setBand: (index: number, value: number) => void;
  applyPreset: (id: string) => void;
  saveCustomPreset: (name: string) => void;
  renameCustomPreset: (id: string, name: string) => void;
  deleteCustomPreset: (id: string) => void;
  resetEq: () => void;
  resetAll: () => void;
  audio: EngineSnapshot;
  loadAudioFile: (file: File) => Promise<void>;
  playAudio: () => Promise<void>;
  pauseAudio: () => void;
  toggleAudio: () => Promise<void>;
  seekAudio: (seconds: number) => void;
  startTone: () => Promise<void>;
  unloadAudio: () => void;
  device: DeviceSnapshot;
  scanBluetooth: () => Promise<void>;
  disconnectBluetooth: () => void;
  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

function applyDocumentChrome(theme: ThemeId, reduceMotion: boolean): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.motion = reduceMotion ? 'reduce' : 'full';
  const color = theme === 'steel' ? '#12151C' : '#090B0F';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}

function resolveReduceMotion(motion: MotionPreference): boolean {
  if (motion === 'reduce') return true;
  if (motion === 'full') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const initial = useRef(loadState());
  const [route, setRoute] = useState<RouteId>(() => parseRoute(window.location.hash));
  const [preferences, setPreferences] = useState<Preferences>(initial.current.preferences);
  const [gains, setGains] = useState<GainTuple>(initial.current.gains);
  const [activePresetId, setActivePresetId] = useState<string | null>(initial.current.activePresetId);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(initial.current.customPresets);
  const [reduceMotion, setReduceMotion] = useState(() => resolveReduceMotion(initial.current.preferences.motion));
  const [audio, setAudio] = useState<EngineSnapshot>({
    status: 'idle',
    sourceLabel: null,
    sourceKind: 'none',
    currentTime: 0,
    duration: 0,
    processing: false,
  });
  const [device, setDevice] = useState<DeviceSnapshot>(initialDeviceSnapshot);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const engineRef = useRef<AudioEngine | null>(null);
  const adapterRef = useRef(new WebBluetoothAdapter());
  const skipSave = useRef(true);

  const dirty = useMemo(() => {
    const match = findMatchingPreset(gains, customPresets);
    if (!match) return true;
    return match.id !== activePresetId;
  }, [gains, customPresets, activePresetId]);

  const selectedPresetName = useMemo(() => {
    const builtin = BUILTIN_PRESETS.find((preset) => preset.id === activePresetId);
    if (builtin && gainsEqual(builtin.gains, gains)) return builtin.name;
    const custom = customPresets.find((preset) => preset.id === activePresetId);
    if (custom && gainsEqual(custom.gains, gains)) return custom.name;
    const match = findMatchingPreset(gains, customPresets);
    return match?.name ?? 'Unsaved custom';
  }, [activePresetId, gains, customPresets]);

  const pushToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current.slice(-3), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    const engine = new AudioEngine();
    engineRef.current = engine;
    engine.setGains(initial.current.gains);
    const unsubscribe = engine.subscribe(setAudio);
    return () => {
      unsubscribe();
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setGains(gains);
  }, [gains]);

  useEffect(() => {
    applyDocumentChrome(preferences.theme, reduceMotion);
  }, [preferences.theme, reduceMotion]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(resolveReduceMotion(preferences.motion));
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [preferences.motion]);

  useEffect(() => {
    const onHash = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onHash);
    if (!window.location.hash) window.location.hash = '#home';
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    saveState({
      version: 1,
      preferences,
      gains,
      activePresetId,
      customPresets,
    });
  }, [preferences, gains, activePresetId, customPresets]);

  useEffect(() => {
    void adapterRef.current.probeAvailability().then((available) => {
      setDevice((current) => ({
        ...current,
        bluetoothAvailable: available,
        state: current.browserSupportsWebBluetooth
          ? available === false
            ? 'unavailable'
            : current.state
          : 'unsupported',
        message:
          available === false
            ? 'The browser reports no Bluetooth adapter available.'
            : current.message,
      }));
    });
  }, []);

  const persistMediaSession = useCallback((snapshot: EngineSnapshot) => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = snapshot.sourceLabel
      ? new MediaMetadata({
          title: snapshot.sourceLabel,
          artist: 'Thunder Control studio player',
          album: 'Processed in-app only',
        })
      : null;
    navigator.mediaSession.playbackState =
      snapshot.status === 'playing' ? 'playing' : snapshot.status === 'paused' ? 'paused' : 'none';
  }, []);

  useEffect(() => {
    persistMediaSession(audio);
  }, [audio, persistMediaSession]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const engine = () => engineRef.current;
    try {
      navigator.mediaSession.setActionHandler('play', () => void engine()?.play());
      navigator.mediaSession.setActionHandler('pause', () => engine()?.pause());
      navigator.mediaSession.setActionHandler('stop', () => engine()?.unload());
    } catch {
      /* unsupported action */
    }
    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('stop', null);
      } catch {
        /* ignore */
      }
    };
  }, []);

  const navigate = useCallback((next: RouteId) => {
    window.location.hash = next;
    setRoute(next);
  }, []);

  const setBand = useCallback((index: number, value: number) => {
    setGains((current) => {
      const next = normalizeGains(current.map((gain, gainIndex) => (gainIndex === index ? value : gain)));
      const match = findMatchingPreset(next, customPresets);
      setActivePresetId(match?.id ?? null);
      return next;
    });
  }, [customPresets]);

  const applyPreset = useCallback(
    (id: string) => {
      const builtin = BUILTIN_PRESETS.find((preset) => preset.id === id);
      const custom = customPresets.find((preset) => preset.id === id);
      const preset = builtin ?? custom;
      if (!preset) return;
      setGains([...preset.gains]);
      setActivePresetId(preset.id);
    },
    [customPresets],
  );

  const saveCustomPreset = useCallback(
    (name: string) => {
      const trimmed = name.trim().slice(0, 40);
      if (!trimmed) {
        pushToast({ tone: 'warn', title: 'Name required', body: 'Give the custom preset a name before saving.' });
        return;
      }
      const now = new Date().toISOString();
      const preset: CustomPreset = {
        id: crypto.randomUUID(),
        name: trimmed,
        gains: [...gains],
        createdAt: now,
        updatedAt: now,
      };
      setCustomPresets((current) => [...current, preset]);
      setActivePresetId(preset.id);
      pushToast({ tone: 'success', title: 'Preset saved', body: `“${trimmed}” is stored on this device.` });
    },
    [gains, pushToast],
  );

  const renameCustomPreset = useCallback((id: string, name: string) => {
    const trimmed = name.trim().slice(0, 40);
    if (!trimmed) return;
    setCustomPresets((current) =>
      current.map((preset) =>
        preset.id === id ? { ...preset, name: trimmed, updatedAt: new Date().toISOString() } : preset,
      ),
    );
  }, []);

  const deleteCustomPreset = useCallback(
    (id: string) => {
      setCustomPresets((current) => current.filter((preset) => preset.id !== id));
      if (activePresetId === id) {
        setActivePresetId('balanced');
        setGains([...DEFAULT_GAINS]);
      }
      setPreferences((current) =>
        current.defaultPresetId === id ? { ...current, defaultPresetId: 'balanced' } : current,
      );
      pushToast({ tone: 'info', title: 'Preset deleted' });
    },
    [activePresetId, pushToast],
  );

  const resetEq = useCallback(() => {
    const fallback =
      BUILTIN_PRESETS.find((preset) => preset.id === preferences.defaultPresetId) ?? BUILTIN_PRESETS[0];
    setGains([...fallback.gains]);
    setActivePresetId(fallback.id);
    pushToast({ tone: 'info', title: 'EQ reset', body: `Restored ${fallback.name}.` });
  }, [preferences.defaultPresetId, pushToast]);

  const resetAll = useCallback(() => {
    const fresh = defaultState();
    setPreferences(fresh.preferences);
    setGains(fresh.gains);
    setActivePresetId(fresh.activePresetId);
    setCustomPresets(fresh.customPresets);
    engineRef.current?.unload();
    adapterRef.current.disconnect();
    setDevice(initialDeviceSnapshot());
    pushToast({ tone: 'success', title: 'Preferences cleared' });
  }, [pushToast]);

  const loadAudioFile = useCallback(async (file: File) => {
    await engineRef.current?.loadFile(file);
    pushToast({
      tone: 'info',
      title: 'File loaded',
      body: 'EQ applies only to this in-app player — not to Spotify, YouTube, or system audio.',
    });
  }, [pushToast]);

  const playAudio = useCallback(async () => {
    try {
      await engineRef.current?.play();
    } catch (error) {
      pushToast({
        tone: 'warn',
        title: 'Nothing to play',
        body: error instanceof Error ? error.message : 'Load a file first.',
      });
    }
  }, [pushToast]);

  const pauseAudio = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const toggleAudio = useCallback(async () => {
    try {
      await engineRef.current?.toggle();
    } catch (error) {
      pushToast({
        tone: 'warn',
        title: 'Playback unavailable',
        body: error instanceof Error ? error.message : 'Load a local file or start the calibration tone.',
      });
    }
  }, [pushToast]);

  const seekAudio = useCallback((seconds: number) => {
    engineRef.current?.seek(seconds);
  }, []);

  const startTone = useCallback(async () => {
    await engineRef.current?.startTone();
  }, []);

  const unloadAudio = useCallback(() => {
    engineRef.current?.unload();
  }, []);

  const scanBluetooth = useCallback(async () => {
    setDevice((current) => ({ ...current, state: 'requesting', message: 'Waiting for the browser device picker…' }));
    const snapshot = await adapterRef.current.requestConnection();
    setDevice(snapshot);
    adapterRef.current.watchDisconnect(() => {
      setDevice((current) => ({
        ...initialDeviceSnapshot(),
        bluetoothAvailable: current.bluetoothAvailable,
        message: 'The BLE device disconnected.',
      }));
    });
  }, []);

  const disconnectBluetooth = useCallback(() => {
    setDevice(adapterRef.current.disconnect());
  }, []);

  const value = useMemo<AppStoreValue>(
    () => ({
      route,
      navigate,
      preferences,
      setTheme: (theme) => setPreferences((current) => ({ ...current, theme })),
      setMotion: (motion) => setPreferences((current) => ({ ...current, motion })),
      setDefaultPreset: (id) => setPreferences((current) => ({ ...current, defaultPresetId: id })),
      reduceMotion,
      gains,
      activePresetId,
      customPresets,
      dirty,
      selectedPresetName,
      setBand,
      applyPreset,
      saveCustomPreset,
      renameCustomPreset,
      deleteCustomPreset,
      resetEq,
      resetAll,
      audio,
      loadAudioFile,
      playAudio,
      pauseAudio,
      toggleAudio,
      seekAudio,
      startTone,
      unloadAudio,
      device,
      scanBluetooth,
      disconnectBluetooth,
      toasts,
      pushToast,
      dismissToast,
    }),
    [
      route,
      navigate,
      preferences,
      reduceMotion,
      gains,
      activePresetId,
      customPresets,
      dirty,
      selectedPresetName,
      setBand,
      applyPreset,
      saveCustomPreset,
      renameCustomPreset,
      deleteCustomPreset,
      resetEq,
      resetAll,
      audio,
      loadAudioFile,
      playAudio,
      pauseAudio,
      toggleAudio,
      seekAudio,
      startTone,
      unloadAudio,
      device,
      scanBluetooth,
      disconnectBluetooth,
      toasts,
      pushToast,
      dismissToast,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const value = useContext(AppStoreContext);
  if (!value) throw new Error('useAppStore must be used within AppStoreProvider');
  return value;
}

export { DEFAULT_PREFERENCES };
