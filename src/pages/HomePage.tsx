import { Pause, Play, SkipBack, SkipForward, ChevronRight } from 'lucide-react';
import AnimatedContent from '../components/react-bits/AnimatedContent/AnimatedContent';
import { HeadphoneHero } from '../components/device/HeadphoneHero';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PRODUCT } from '../lib/constants';
import { useAppStore } from '../state/app-store';

export function HomePage() {
  const { device, audio, selectedPresetName, navigate, toggleAudio, playAudio, pauseAudio, reduceMotion } =
    useAppStore();

  const connectionTone =
    device.state === 'connected' ? 'live' : device.state === 'error' ? 'err' : device.state === 'unsupported' ? 'off' : 'off';
  const canControl = audio.sourceKind !== 'none';

  return (
    <AnimatedContent className="page" trigger="mount" distance={reduceMotion ? 0 : 18} duration={0.55}>
      <header className="page-header">
        <p className="meta">{PRODUCT.marketingName}</p>
        <h1>Command the room without pretending the hardware is on this page.</h1>
        <p className="lede">
          Studio processing runs in the browser audio graph. Headset EQ, LEDs, and battery live on the physical unit or in
          GOBOULT Amp — this companion keeps those boundaries honest.
        </p>
      </header>

      <div className="home-grid">
        <section className="stack">
          <HeadphoneHero active={audio.status === 'playing' || device.state === 'connected'} />
          <div className="row">
            <Badge tone={connectionTone}>
              {device.state === 'connected' ? 'BLE session' : device.state === 'unsupported' ? 'BLE unavailable' : 'Disconnected'}
            </Badge>
            <Badge tone={audio.processing ? 'live' : 'off'}>
              {audio.processing ? 'In-app DSP' : 'EQ saved only'}
            </Badge>
            <Badge tone="sim">No fabricated battery</Badge>
          </div>
        </section>

        <section className="panel stack">
          <h2 className="panel-title">Now routing</h2>
          <p className="lede" style={{ marginTop: 0 }}>
            {audio.sourceLabel
              ? `Source: ${audio.sourceLabel}`
              : 'No in-app source. Import a file in Sound Studio or start the calibration tone.'}
          </p>
          <div className="row">
            <Button icon disabled aria-label="Previous track unavailable" title="No playlist is loaded.">
              <SkipBack size={18} />
            </Button>
            <Button
              variant="primary"
              icon
              aria-label={canControl ? (audio.status === 'playing' ? 'Pause' : 'Play') : 'Playback unavailable'}
              disabled={!canControl}
              onClick={() => void toggleAudio()}
            >
              {audio.status === 'playing' ? <Pause size={18} /> : <Play size={18} />}
            </Button>
            <Button icon disabled aria-label="Next track unavailable" title="No playlist is loaded.">
              <SkipForward size={18} />
            </Button>
            {audio.status === 'playing' ? (
              <Button variant="ghost" onClick={pauseAudio}>
                Pause
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => void playAudio()} disabled={!canControl}>
                Play
              </Button>
            )}
          </div>
          <p className="meta">Media keys bind only while this tab is playing the studio source.</p>

          <div className="callouts">
            <div className="callout">
              <span>Active profile</span>
              <b>{selectedPresetName}</b>
            </div>
            <div className="callout">
              <span>Pairing name</span>
              <b>{PRODUCT.pairingName}</b>
            </div>
            <div className="callout">
              <span>Bluetooth</span>
              <b>{PRODUCT.bluetooth}</b>
            </div>
          </div>

          <div className="quick-links">
            <button type="button" className="quick-link" onClick={() => navigate('studio')}>
              Open Sound Studio
              <ChevronRight size={16} />
            </button>
            <button type="button" className="quick-link" onClick={() => navigate('device')}>
              Open Device Center
              <ChevronRight size={16} />
            </button>
          </div>
        </section>
      </div>
    </AnimatedContent>
  );
}
