import { Home, SlidersHorizontal, Headphones, Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import Aurora from '../react-bits/Aurora/Aurora';
import PillNav from '../react-bits/PillNav/PillNav';
import { APP_NAME, PRODUCT, ROUTES, type RouteId } from '../../lib/constants';
import { useAppStore } from '../../state/app-store';

const ICONS = {
  home: Home,
  studio: SlidersHorizontal,
  device: Headphones,
  settings: Settings,
} as const;

function Mark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M9 2 5.5 9H9l-1.5 7L13 8H9V2Z" fill="currentColor" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { route, navigate, reduceMotion } = useAppStore();

  return (
    <div className="app-root">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="app-aurora">
        <Aurora
          colorStops={['#151922', '#48A9FF', '#090B0F']}
          amplitude={0.45}
          blend={0.7}
          speed={0.35}
          height={0.42}
          brightness={0.32}
          opacity={0.7}
          glow={0.25}
          paused={reduceMotion}
          mouseInteraction={!reduceMotion}
        />
      </div>
      <div className="app-grid" />
      <div className="app-shell">
        <header className="app-header">
          <a className="brand" href="#home" onClick={() => navigate('home')}>
            <span className="brand-mark">
              <Mark />
            </span>
            <span className="brand-copy">
              <p className="brand-kicker">{PRODUCT.brand}</p>
              <p className="brand-title">{APP_NAME}</p>
            </span>
          </a>
          <div className="header-nav">
            <PillNav
              logo={<Mark />}
              logoHref="#home"
              items={ROUTES.map((item) => ({ label: item.label, href: item.href }))}
              activeHref={`#${route}`}
              layout="joined"
              size="md"
              theme="dark"
              highlightColor="#48A9FF"
              highlightTextColor="#071018"
              barColor="rgba(21, 25, 34, 0.88)"
              textColor="#E7ECF4"
              collapse="never"
              onItemClick={(item, index, event) => {
                void index;
                event.preventDefault();
                const href = item.href?.replace('#', '') as RouteId | undefined;
                if (href) navigate(href);
              }}
              ariaLabel="Primary"
            />
          </div>
        </header>
        <main id="main" className="app-main">
          {children}
        </main>
        <nav className="bottom-nav" aria-label="Primary mobile">
          {ROUTES.map((item) => {
            const Icon = ICONS[item.id];
            return (
              <button
                key={item.id}
                type="button"
                aria-current={route === item.id ? 'page' : undefined}
                onClick={() => navigate(item.id)}
              >
                <Icon size={18} />
                <span>{item.label === 'Sound Studio' ? 'Studio' : item.label === 'Device Center' ? 'Device' : item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
