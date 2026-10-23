export type ConnectionState =
  | 'unsupported'
  | 'unavailable'
  | 'idle'
  | 'requesting'
  | 'connected'
  | 'error';

export interface StandardGattReading {
  batteryPercent: number | null;
  firmware: string | null;
  manufacturer: string | null;
  modelNumber: string | null;
}

export interface DeviceSnapshot {
  state: ConnectionState;
  browserSupportsWebBluetooth: boolean;
  bluetoothAvailable: boolean | null;
  deviceName: string | null;
  deviceId: string | null;
  nameMatchesKnownHeadset: boolean;
  gatt: StandardGattReading | null;
  message: string;
  detail: string;
}

export const KNOWN_PAIRING_NAMES = ['AirBass Headphone', 'Mustang Thunder'] as const;
