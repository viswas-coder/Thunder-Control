import { PRODUCT } from '../constants';
import { KNOWN_PAIRING_NAMES, type DeviceSnapshot, type StandardGattReading } from './types';

const BATTERY_SERVICE = 0x180f;
const BATTERY_LEVEL = 0x2a19;
const DEVICE_INFO_SERVICE = 0x180a;
const MANUFACTURER = 0x2a29;
const MODEL_NUMBER = 0x2a24;
const FIRMWARE = 0x2a26;

function decode(view: DataView): string {
  return new TextDecoder().decode(view).replace(/\0/g, '').trim();
}

function matchesKnownName(name: string | null): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return KNOWN_PAIRING_NAMES.some((known) => lower.includes(known.toLowerCase()));
}

export function initialDeviceSnapshot(): DeviceSnapshot {
  const browserSupportsWebBluetooth = typeof navigator !== 'undefined' && Boolean(navigator.bluetooth);
  return {
    state: browserSupportsWebBluetooth ? 'idle' : 'unsupported',
    browserSupportsWebBluetooth,
    bluetoothAvailable: null,
    deviceName: null,
    deviceId: null,
    nameMatchesKnownHeadset: false,
    gatt: null,
    message: browserSupportsWebBluetooth
      ? 'No BLE session. Classic Bluetooth audio pairing is handled by the operating system, not this page.'
      : 'This browser does not expose Web Bluetooth.',
    detail: `${PRODUCT.model} pairs over Bluetooth classic as “${PRODUCT.pairingName}”. Web Bluetooth can only talk to BLE GATT services the headset actually exposes — GOBOULT has not published vendor EQ/LED UUIDs.`,
  };
}

async function readOptionalString(
  server: BluetoothRemoteGATTServer,
  serviceUuid: number,
  characteristicUuid: number,
): Promise<string | null> {
  try {
    const service = await server.getPrimaryService(serviceUuid);
    const characteristic = await service.getCharacteristic(characteristicUuid);
    const value = await characteristic.readValue();
    const text = decode(value);
    return text || null;
  } catch {
    return null;
  }
}

async function readBattery(server: BluetoothRemoteGATTServer): Promise<number | null> {
  try {
    const service = await server.getPrimaryService(BATTERY_SERVICE);
    const characteristic = await service.getCharacteristic(BATTERY_LEVEL);
    const value = await characteristic.readValue();
    const level = value.getUint8(0);
    return Number.isFinite(level) ? Math.min(100, Math.max(0, level)) : null;
  } catch {
    return null;
  }
}

export class WebBluetoothAdapter {
  private device: BluetoothDevice | null = null;
  private onDisconnected: (() => void) | null = null;

  async probeAvailability(): Promise<boolean | null> {
    if (!navigator.bluetooth?.getAvailability) return null;
    try {
      return await navigator.bluetooth.getAvailability();
    } catch {
      return null;
    }
  }

  async requestConnection(): Promise<DeviceSnapshot> {
    if (!navigator.bluetooth) {
      return initialDeviceSnapshot();
    }

    let device: BluetoothDevice;
    try {
      device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [BATTERY_SERVICE, DEVICE_INFO_SERVICE],
      });
    } catch (error) {
      const cancelled = error instanceof DOMException && error.name === 'NotFoundError';
      return {
        ...initialDeviceSnapshot(),
        state: cancelled ? 'idle' : 'error',
        message: cancelled ? 'Device picker closed without a selection.' : 'Web Bluetooth request failed.',
        detail: error instanceof Error ? error.message : 'Unknown Bluetooth error.',
      };
    }

    this.detach();
    this.device = device;

    if (!device.gatt) {
      return {
        ...initialDeviceSnapshot(),
        state: 'error',
        deviceName: device.name ?? null,
        deviceId: device.id,
        nameMatchesKnownHeadset: matchesKnownName(device.name ?? null),
        message: 'The selected device has no GATT server.',
        detail:
          'Most over-ear headphones stream audio over Bluetooth classic (A2DP). That path is not programmable from a website.',
      };
    }

    try {
      const server = await device.gatt.connect();
      const gatt: StandardGattReading = {
        batteryPercent: await readBattery(server),
        firmware: await readOptionalString(server, DEVICE_INFO_SERVICE, FIRMWARE),
        manufacturer: await readOptionalString(server, DEVICE_INFO_SERVICE, MANUFACTURER),
        modelNumber: await readOptionalString(server, DEVICE_INFO_SERVICE, MODEL_NUMBER),
      };

      const name = device.name ?? null;
      const known = matchesKnownName(name);
      const hasAnyGatt = gatt.batteryPercent !== null || Boolean(gatt.firmware || gatt.manufacturer || gatt.modelNumber);

      return {
        state: 'connected',
        browserSupportsWebBluetooth: true,
        bluetoothAvailable: true,
        deviceName: name,
        deviceId: device.id,
        nameMatchesKnownHeadset: known,
        gatt: hasAnyGatt ? gatt : { batteryPercent: null, firmware: null, manufacturer: null, modelNumber: null },
        message: known
          ? `BLE session opened with “${name}”. This is not confirmation that hardware EQ or LEDs were controlled.`
          : `BLE session opened with “${name ?? 'unnamed device'}”. Name does not match the published pairing name “${PRODUCT.pairingName}”.`,
        detail: hasAnyGatt
          ? 'Standard Bluetooth SIG characteristics were readable. Vendor EQ/LED commands are unpublished and were not sent.'
          : 'Connected at the GATT layer, but Battery Service (0x180F) and Device Information (0x180A) were not readable. The headset likely uses classic Bluetooth for audio only.',
      };
    } catch (error) {
      return {
        ...initialDeviceSnapshot(),
        state: 'error',
        deviceName: device.name ?? null,
        deviceId: device.id,
        nameMatchesKnownHeadset: matchesKnownName(device.name ?? null),
        message: 'Could not open a GATT connection.',
        detail: error instanceof Error ? error.message : 'GATT connect failed.',
      };
    }
  }

  disconnect(): DeviceSnapshot {
    this.detach();
    return {
      ...initialDeviceSnapshot(),
      state: 'idle',
      message: 'BLE session closed. System audio pairing is unchanged.',
    };
  }

  watchDisconnect(handler: () => void): void {
    this.onDisconnected = handler;
    this.device?.addEventListener('gattserverdisconnected', handler);
  }

  private detach(): void {
    if (this.device && this.onDisconnected) {
      this.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
    }
    try {
      this.device?.gatt?.disconnect();
    } catch {
      /* already disconnected */
    }
    this.device = null;
    this.onDisconnected = null;
  }
}
