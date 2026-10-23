interface HeadphoneHeroProps {
  active: boolean;
}

export function HeadphoneHero({ active }: HeadphoneHeroProps) {
  return (
    <div className="hero-visual panel" aria-hidden="true">
      <svg viewBox="0 0 320 280" fill="none">
        <circle className="ring" cx="160" cy="140" r="118" />
        <circle className={`ring ${active ? 'ring-active' : ''}`} cx="160" cy="140" r="96" strokeDasharray="6 10" />
        <path d="M86 92c8-38 128-38 148 0" stroke="#8A95A6" strokeWidth="10" strokeLinecap="round" />
        <path d="M78 108c4-18 18-28 34-28h96c16 0 30 10 34 28" stroke="#E7ECF4" strokeWidth="8" strokeLinecap="round" />
        <rect x="42" y="108" width="52" height="92" rx="18" fill="#1C222D" stroke="#303846" />
        <rect x="226" y="108" width="52" height="92" rx="18" fill="#1C222D" stroke="#303846" />
        <rect x="50" y="120" width="36" height="68" rx="12" fill="#090B0F" stroke="#48A9FF" strokeOpacity="0.55" />
        <rect x="234" y="120" width="36" height="68" rx="12" fill="#090B0F" stroke="#48A9FF" strokeOpacity="0.55" />
        <path d="M94 154h132" stroke="#303846" />
        <text x="160" y="248" textAnchor="middle" fill="#8A95A6" fontFamily="JetBrains Mono, monospace" fontSize="10">
          40 MM · BT 5.4 · IPX5
        </text>
      </svg>
    </div>
  );
}
