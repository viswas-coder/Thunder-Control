import { useMemo, useState } from 'react';
import AnimatedContent from '../components/react-bits/AnimatedContent/AnimatedContent';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { EQ_BANDS, EQ_MAX_DB, EQ_MIN_DB, EQ_STEP_DB } from '../lib/constants';
import { BUILTIN_PRESETS, formatDb, formatHz } from '../lib/eq';
import { useAppStore } from '../state/app-store';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SoundStudioPage() {
  const {
    gains,
    setBand,
    activePresetId,
    customPresets,
    applyPreset,
    saveCustomPreset,
    renameCustomPreset,
    deleteCustomPreset,
    resetEq,
    dirty,
    selectedPresetName,
    audio,
    loadAudioFile,
    toggleAudio,
    seekAudio,
    startTone,
    unloadAudio,
    reduceMotion,
  } = useAppStore();

  const [name, setName] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<string | null>(null);

  const deleteTarget = customPresets.find((preset) => preset.id === deleteId);

  const processingCopy = useMemo(() => {
    if (audio.processing) {
      return `Live processing: ${audio.sourceLabel}. This graph does not alter Spotify, YouTube, or other system apps.`;
    }
    return 'No eligible source is playing. Slider changes are stored locally until you load a file or start the calibration tone.';
  }, [audio.processing, audio.sourceLabel]);

  const requestPreset = (id: string) => {
    if (dirty && id !== activePresetId) {
      setPendingPreset(id);
      return;
    }
    applyPreset(id);
  };

  return (
    <AnimatedContent className="page" trigger="mount" distance={reduceMotion ? 0 : 16} duration={0.5}>
      <header className="page-header">
        <p className="meta">Five-band parametric shelf / peak</p>
        <h1>Sound Studio</h1>
        <p className="lede">{processingCopy}</p>
      </header>

      <section className="panel">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 className="panel-title" style={{ margin: 0 }}>
            Equalizer
          </h2>
          <span className="badge" data-tone={dirty ? 'sim' : 'live'}>
            {selectedPresetName}
          </span>
        </div>
        <div className="eq-board">
          {EQ_BANDS.map((band, index) => (
            <label key={band.hz} className="eq-band">
              <output htmlFor={`band-${band.hz}`}>{formatDb(gains[index] ?? 0)}</output>
              <input
                id={`band-${band.hz}`}
                className="eq-slider"
                type="range"
                min={EQ_MIN_DB}
                max={EQ_MAX_DB}
                step={EQ_STEP_DB}
                value={gains[index]}
                aria-valuetext={formatDb(gains[index] ?? 0)}
                aria-label={`${formatHz(band.hz)} gain`}
                onChange={(event) => setBand(index, Number(event.target.value))}
              />
              <span className="eq-zero" />
              <span className="meta">{band.label}</span>
            </label>
          ))}
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <Button onClick={() => setConfirmReset(true)}>Reset to default</Button>
        </div>
      </section>

      <section className="split split-2" style={{ gridTemplateColumns: '1.1fr 0.9fr' }}>
        <div className="panel stack">
          <h2 className="panel-title">Presets</h2>
          <div className="preset-grid">
            {BUILTIN_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="preset"
                data-active={activePresetId === preset.id && !dirty}
                onClick={() => requestPreset(preset.id)}
              >
                <strong>{preset.name}</strong>
                <span>{preset.description}</span>
              </button>
            ))}
            {customPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="preset"
                data-active={activePresetId === preset.id && !dirty}
                onClick={() => requestPreset(preset.id)}
              >
                <strong>{preset.name}</strong>
                <span>Custom · stored locally</span>
              </button>
            ))}
          </div>
          <div className="field">
            <label htmlFor="preset-name">Save current curve</label>
            <input
              id="preset-name"
              value={name}
              maxLength={40}
              placeholder="Night mix"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="row">
            <Button variant="primary" onClick={() => saveCustomPreset(name)}>
              Save custom preset
            </Button>
          </div>
          {customPresets.length > 0 ? (
            <div className="stack">
              {customPresets.map((preset) => (
                <div key={preset.id} className="row">
                  <span>{preset.name}</span>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setRenameId(preset.id);
                      setRenameValue(preset.name);
                    }}
                  >
                    Rename
                  </Button>
                  <Button variant="ghost" onClick={() => setDeleteId(preset.id)}>
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="panel stack">
          <h2 className="panel-title">Studio player</h2>
          <p className="lede" style={{ marginTop: 0 }}>
            Hardware EQ on the headset (Bass / Vocal / Rock / Pop) is cycled with a double-press of the LED/EQ button. This
            page does not send those commands.
          </p>
          <div className="field">
            <label htmlFor="audio-file">Local audio file</label>
            <input
              id="audio-file"
              type="file"
              accept="audio/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void loadAudioFile(file);
              }}
            />
          </div>
          <div className="media-bar">
            <input
              className="seek"
              type="range"
              min={0}
              max={audio.duration || 0}
              step={0.1}
              value={audio.currentTime}
              disabled={audio.sourceKind !== 'file'}
              aria-label="Seek"
              onChange={(event) => seekAudio(Number(event.target.value))}
            />
            <p className="meta">
              {formatTime(audio.currentTime)} / {formatTime(audio.duration)}
            </p>
          </div>
          <div className="row">
            <Button variant="primary" onClick={() => void toggleAudio()} disabled={audio.sourceKind === 'none'}>
              {audio.status === 'playing' ? 'Pause' : 'Play'}
            </Button>
            <Button onClick={() => void startTone()}>Calibration tone</Button>
            <Button variant="ghost" onClick={unloadAudio} disabled={audio.sourceKind === 'none'}>
              Unload
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={confirmReset} title="Reset equalizer?">
        <p className="lede">This restores your default sound preset and discards unsaved slider changes.</p>
        <div className="row">
          <Button
            variant="primary"
            onClick={() => {
              resetEq();
              setConfirmReset(false);
            }}
          >
            Reset
          </Button>
          <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
        </div>
      </Dialog>

      <Dialog open={Boolean(pendingPreset)} title="Replace unsaved curve?">
        <p className="lede">The current sliders do not match a saved preset. Applying another preset will overwrite them.</p>
        <div className="row">
          <Button
            variant="primary"
            onClick={() => {
              if (pendingPreset) applyPreset(pendingPreset);
              setPendingPreset(null);
            }}
          >
            Apply preset
          </Button>
          <Button onClick={() => setPendingPreset(null)}>Keep editing</Button>
        </div>
      </Dialog>

      <Dialog open={Boolean(renameId)} title="Rename preset">
        <div className="field">
          <label htmlFor="rename-preset">Name</label>
          <input id="rename-preset" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <Button
            variant="primary"
            onClick={() => {
              if (renameId) renameCustomPreset(renameId, renameValue);
              setRenameId(null);
            }}
          >
            Save name
          </Button>
          <Button onClick={() => setRenameId(null)}>Cancel</Button>
        </div>
      </Dialog>

      <Dialog open={Boolean(deleteId)} title="Delete custom preset?">
        <p className="lede">“{deleteTarget?.name}” will be removed from this browser.</p>
        <div className="row">
          <Button
            variant="danger"
            onClick={() => {
              if (deleteId) deleteCustomPreset(deleteId);
              setDeleteId(null);
            }}
          >
            Delete
          </Button>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
        </div>
      </Dialog>
    </AnimatedContent>
  );
}
