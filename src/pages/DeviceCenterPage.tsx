import AnimatedContent from '../components/react-bits/AnimatedContent/AnimatedContent';
import { HeadphoneHero } from '../components/device/HeadphoneHero';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PRODUCT } from '../lib/constants';
import { useAppStore } from '../state/app-store';

export function DeviceCenterPage() {
  const { device, scanBluetooth, disconnectBluetooth, reduceMotion } = useAppStore();
  const battery = device.gatt?.batteryPercent;
  const canScan = device.browserSupportsWebBluetooth && device.state !== 'unavailable' && device.state !== 'requesting';

  return (
    <AnimatedContent className="page" trigger="mount" distance={reduceMotion ? 0 : 16} duration={0.5}>
      <header className="page-header">
        <p className="meta">Hardware boundary</p>
        <h1>Device Center</h1>
        <p className="lede">
          {PRODUCT.model} is a Bluetooth classic headset ({PRODUCT.profiles.join(', ')}). This web app will not invent
          vendor UUIDs or report a successful hardware EQ write.
        </p>
      </header>

      <div className="home-grid">
        <section className="stack">
          <HeadphoneHero active={device.state === 'connected'} />
          <div className="panel stack">
            <h2 className="panel-title">Connection</h2>
            <div className="row">
              <Badge
                tone={
                  device.state === 'connected' ? 'live' : device.state === 'error' ? 'err' : 'off'
                }
              >
                {device.state}
              </Badge>
              {device.nameMatchesKnownHeadset ? <Badge tone="live">Name match</Badge> : <Badge>Unverified model</Badge>}
            </div>
            <p>{device.message}</p>
            <p className="lede" style={{ marginTop: 0 }}>
              {device.detail}
            </p>
            <div className="row">
              <Button variant="primary" disabled={!canScan} onClick={() => void scanBluetooth()}>
                {device.state === 'requesting' ? 'Waiting for picker…' : 'Scan BLE devices'}
              </Button>
              <Button disabled={device.state !== 'connected'} onClick={disconnectBluetooth}>
                Disconnect BLE
              </Button>
            </div>
            {!device.browserSupportsWebBluetooth ? (
              <div className="notice" data-tone="warn">
                Web Bluetooth is missing. Use Chromium on HTTPS or localhost. iOS Safari does not implement this API.
              </div>
            ) : null}
            {device.state === 'unavailable' ? (
              <div className="notice" data-tone="warn">
                Enable Bluetooth on the computer and allow the site permission when the picker appears.
              </div>
            ) : null}
          </div>
        </section>

        <section className="stack">
          <div className="panel">
            <h2 className="panel-title">Live readings</h2>
            {device.state === 'connected' && battery !== null && battery !== undefined ? (
              <p>
                Battery from standard GATT 0x2A19: <strong>{battery}%</strong>
              </p>
            ) : (
              <p className="lede" style={{ marginTop: 0 }}>
                Battery is hidden until a real GATT Battery Service reading exists. Manufacturer playtime ratings are not
                live telemetry.
              </p>
            )}
            {device.gatt?.manufacturer || device.gatt?.modelNumber || device.gatt?.firmware ? (
              <ul>
                {device.gatt.manufacturer ? <li>Manufacturer: {device.gatt.manufacturer}</li> : null}
                {device.gatt.modelNumber ? <li>Model: {device.gatt.modelNumber}</li> : null}
                {device.gatt.firmware ? <li>Firmware: {device.gatt.firmware}</li> : null}
              </ul>
            ) : (
              <p className="meta">Device Information service unread or absent.</p>
            )}
            {device.deviceName ? <p className="meta">Advertised name: {device.deviceName}</p> : null}
          </div>

          <div className="panel">
            <h2 className="panel-title">Published product data</h2>
            <table className="spec-table">
              <tbody>
                <tr>
                  <th>Model</th>
                  <td>
                    {PRODUCT.brand} {PRODUCT.model}
                  </td>
                </tr>
                <tr>
                  <th>Bluetooth name</th>
                  <td>{PRODUCT.pairingName}</td>
                </tr>
                <tr>
                  <th>Drivers / codecs</th>
                  <td>
                    {PRODUCT.drivers}; {PRODUCT.codecs.join(', ')}
                  </td>
                </tr>
                <tr>
                  <th>On-device EQ</th>
                  <td>{PRODUCT.hardwareEqModes.join(', ')} — double-press LED/EQ</td>
                </tr>
                <tr>
                  <th>LED modes</th>
                  <td>{PRODUCT.hardwareLedModes.join(', ')}</td>
                </tr>
                <tr>
                  <th>Playtime (rated)</th>
                  <td>{PRODUCT.playbackClaim}</td>
                </tr>
                <tr>
                  <th>Other</th>
                  <td>
                    {PRODUCT.enc}. {PRODUCT.gamingLatency}. {PRODUCT.ipRating}.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="notice">
            Official companion for supported GOBOULT TWS models is GOBOULT Amp. Mustang Thunder is not listed in the Amp
            store description; some reviews mention app pairing, but no public SDK or BLE command set is documented. The
            adapter in this project is ready for a future native plugin if GOBOULT publishes one.
          </div>
        </section>
      </div>
    </AnimatedContent>
  );
}
