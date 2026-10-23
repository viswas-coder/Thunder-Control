import { AppShell } from './components/layout/AppShell';
import { Toasts } from './components/ui/Toasts';
import { DeviceCenterPage } from './pages/DeviceCenterPage';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { SoundStudioPage } from './pages/SoundStudioPage';
import { AppStoreProvider, useAppStore } from './state/app-store';

function Screen() {
  const { route } = useAppStore();
  if (route === 'studio') return <SoundStudioPage />;
  if (route === 'device') return <DeviceCenterPage />;
  if (route === 'settings') return <SettingsPage />;
  return <HomePage />;
}

export default function App() {
  return (
    <AppStoreProvider>
      <AppShell>
        <Screen />
      </AppShell>
      <Toasts />
    </AppStoreProvider>
  );
}
