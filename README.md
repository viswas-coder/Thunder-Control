# Thunder Control

Companion web app for **GOBOULT Mustang Thunder** over-ear Bluetooth headphones. Local-only: equalizer, presets, and preferences persist in the browser. Hardware EQ, LEDs, and battery are not faked.

## Run

```bash
npm install
npm run dev
```

Then open the printed local URL (Vite, typically `http://localhost:5173`).

```bash
npm run build    # typecheck + production bundle
npm run preview  # serve the build
npm run lint     # oxlint
```

Requires Node.js 20+ and a modern browser. No API keys, accounts, or paid services.

## What actually processes audio

Sound Studio uses the **Web Audio API**. Five biquad filters (60 Hz, 250 Hz, 1 kHz, 4 kHz, 16 kHz) sit on a graph that only hears:

- a local audio file you import, or
- the 440 Hz calibration tone.

It does **not** equalize Spotify, YouTube, or other system audio. Headset DSP (Bass / Vocal / Rock / Pop) is still the on-cup LED/EQ button, as in the product manual.

## Bluetooth

The pairing name in the user manual is **AirBass Headphone**. Profiles listed there: HFP / HSP / A2DP / AVRCP.

This is a web app. **Web Bluetooth** can only open BLE GATT. The adapter may:

- open the browser device picker
- connect if the OS exposes a GATT server
- read **standard** Battery Service (`0x180F`) and Device Information (`0x180A`) when present

It will not send vendor EQ or LED commands. GOBOULT has not published those UUIDs. **GOBOULT Amp** is the official native app for listed TWS models; Mustang Thunder is not in Amp’s public supported-device list.

## Stack

React 19, TypeScript, Vite. React Bits: `Aurora`, `PillNav`, `AnimatedContent` (source under `src/components/react-bits`). Icons: Lucide.
