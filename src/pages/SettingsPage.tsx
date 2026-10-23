import { useState } from 'react';
import AnimatedContent from '../components/react-bits/AnimatedContent/AnimatedContent';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { APP_VERSION, PRODUCT } from '../lib/constants';
import { BUILTIN_PRESETS } from '../lib/eq';
import { useAppStore } from '../state/app-store';

export function SettingsPage() {
  const {
    preferences,
    setTheme,
    setMotion,
    setDefaultPreset,
    customPresets,
    resetAll,
    device,
    audio,
    reduceMotion,
  } = useAppStore();
  const [confirm, setConfirm] = useState(false);

  const presetOptions = [...BUILTIN_PRESETS, ...customPresets];

  return (
    <AnimatedContent className="page" trigger="mount" distance={reduceMotion ? 0 : 16} duration={0.5}>
      <header className="page-header">
        <p className="meta">Local preferences</p>
        <h1>Settings</h1>
        <p className="lede">Theme, motion, and the default EQ curve persist in this browser. Nothing is uploaded.</p>
      </header>

      <section className="panel stack">
        <h2 className="panel-title">Appearance</h2>
        <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="meta">Theme</legend>
          <label className="switch">
            <input
              type="radio"
              name="theme"
              checked={preferences.theme === 'obsidian'}
              onChange={() => setTheme('obsidian')}
            />
            <span>Obsidian — #090B0F canvas</span>
          </label>
          <label className="switch">
            <input
              type="radio"
              name="theme"
              checked={preferences.theme === 'steel'}
              onChange={() => setTheme('steel')}
            />
            <span>Steel — lifted graphite surfaces</span>
          </label>
        </fieldset>
        <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="meta">Motion</legend>
          <label className="switch">
            <input
              type="radio"
              name="motion"
              checked={preferences.motion === 'system'}
              onChange={() => setMotion('system')}
            />
            <span>Follow system reduced-motion</span>
          </label>
          <label className="switch">
            <input
              type="radio"
              name="motion"
              checked={preferences.motion === 'full'}
              onChange={() => setMotion('full')}
            />
            <span>Allow motion</span>
          </label>
          <label className="switch">
            <input
              type="radio"
              name="motion"
              checked={preferences.motion === 'reduce'}
              onChange={() => setMotion('reduce')}
            />
            <span>Reduce motion</span>
          </label>
        </fieldset>
      </section>

      <section className="panel stack">
        <h2 className="panel-title">Sound</h2>
        <div className="field">
          <label htmlFor="default-preset">Default sound preset</label>
          <select
            id="default-preset"
            value={preferences.defaultPresetId}
            onChange={(event) => setDefaultPreset(event.target.value)}
          >
            {presetOptions.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
        <p className="meta">Used when you reset the equalizer.</p>
      </section>

      <section className="panel stack">
        <h2 className="panel-title">Integrations</h2>
        <div className="callouts">
          <div className="callout">
            <span>Web Audio DSP</span>
            <b>{audio.processing ? 'Processing loaded source' : 'Idle — settings stored'}</b>
          </div>
          <div className="callout">
            <span>Web Bluetooth</span>
            <b>
              {device.browserSupportsWebBluetooth
                ? device.bluetoothAvailable === false
                  ? 'Adapter unavailable'
                  : 'API present'
                : 'Not supported'}
            </b>
          </div>
          <div className="callout">
            <span>Media Session</span>
            <b>{'mediaSession' in navigator ? 'Available for in-app playback' : 'Not available'}</b>
          </div>
        </div>
        <p className="lede" style={{ marginTop: 0 }}>
          Chromium may prompt for Bluetooth when you scan. File access is limited to audio you choose. No account, no
          backend, no paid API.
        </p>
      </section>

      <section className="panel stack">
        <h2 className="panel-title">About</h2>
        <p>
          {PRODUCT.brand} {PRODUCT.model} companion, version {APP_VERSION}. Independent project — not an official GOBOULT
          product.
        </p>
        <p className="lede" style={{ marginTop: 0 }}>
          Support: pair the headset in system Bluetooth as “{PRODUCT.pairingName}”, then use Sound Studio for in-app
          processing. Hardware questions belong with GOBOULT / the included user guide.
        </p>
        <Button variant="danger" onClick={() => setConfirm(true)}>
          Reset all preferences
        </Button>
      </section>

      <Dialog open={confirm} title="Clear local data?">
        <p className="lede">This removes custom presets, EQ, theme, and motion settings from localStorage.</p>
        <div className="row">
          <Button
            variant="danger"
            onClick={() => {
              resetAll();
              setConfirm(false);
            }}
          >
            Reset everything
          </Button>
          <Button onClick={() => setConfirm(false)}>Cancel</Button>
        </div>
      </Dialog>
    </AnimatedContent>
  );
}
