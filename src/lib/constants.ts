export const APP_NAME = 'Thunder Control';
export const APP_VERSION = '1.0.0';

export const PRODUCT = {
  brand: 'GOBOULT',
  model: 'Mustang Thunder',
  marketingName: 'Mustang Thunder over-ear',
  pairingName: 'AirBass Headphone',
  bluetooth: '5.4',
  drivers: '40 mm bass-boosted dynamic',
  codecs: ['AAC', 'SBC'] as const,
  profiles: ['HFP', 'HSP', 'A2DP', 'AVRCP'] as const,
  frequencyRange: '20 Hz – 20 kHz',
  ipRating: 'IPX5',
  enc: 'ZEN environmental noise cancellation (calls)',
  gamingLatency: '60 ms low-latency mode (on-device)',
  playbackClaim: 'Up to 70 hours (LEDs off) / 50 hours (LEDs on) — manufacturer rating',
  charging: 'USB-C; 10 min charge rated for 100 min playback',
  hardwareEqModes: ['Bass', 'Vocal', 'Rock', 'Pop'] as const,
  hardwareLedModes: ['White light always on', 'Breathe every 3 s', 'LEDs off'] as const,
} as const;

export const STORAGE_KEY = 'thunder-control:v1';
export const EQ_MIN_DB = -12;
export const EQ_MAX_DB = 12;
export const EQ_STEP_DB = 0.5;

export const EQ_BANDS = [
  { hz: 60, label: '60 Hz', type: 'lowshelf' },
  { hz: 250, label: '250 Hz', type: 'peaking' },
  { hz: 1000, label: '1 kHz', type: 'peaking' },
  { hz: 4000, label: '4 kHz', type: 'peaking' },
  { hz: 16000, label: '16 kHz', type: 'highshelf' },
] as const;

export type EqBandIndex = 0 | 1 | 2 | 3 | 4;

export const ROUTES = [
  { id: 'home', href: '#home', label: 'Home' },
  { id: 'studio', href: '#studio', label: 'Sound Studio' },
  { id: 'device', href: '#device', label: 'Device Center' },
  { id: 'settings', href: '#settings', label: 'Settings' },
] as const;

export type RouteId = (typeof ROUTES)[number]['id'];
