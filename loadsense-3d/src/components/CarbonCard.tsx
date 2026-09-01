interface Props {
  totalWatts: number;
}

const INTENSITY = 0.423; // kg CO₂ / kWh
const HOURS = 8;
const RENEW_PCT = 0.42;

export default function CarbonCard({ totalWatts }: Props) {
  const daily = (totalWatts / 1000) * HOURS * INTENSITY;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: '#121212',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div
        style={{
          fontFamily: "'Inter Tight',sans-serif",
          fontSize: '11px',
          fontWeight: 700,
          color: '#8E8E93',
          letterSpacing: '0.09em',
          marginBottom: '14px',
        }}
      >
        CARBON FOOTPRINT
      </div>

      <div className="flex items-center gap-4 mb-5">
        {/* 3D Leaf SVG */}
        <div
          style={{
            animation: 'leaf-sway 5s ease-in-out infinite',
            transformOrigin: 'center bottom',
            flexShrink: 0,
          }}
        >
          <svg width="50" height="52" viewBox="0 0 50 52">
            <defs>
              <radialGradient id="leafG" cx="38%" cy="28%" r="72%">
                <stop offset="0%" stopColor="#5AFFAA" />
                <stop offset="55%" stopColor="#00CC7A" />
                <stop offset="100%" stopColor="#006640" />
              </radialGradient>
              <filter id="leafS">
                <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#003828" floodOpacity="0.6" />
              </filter>
              {/* Ambient occlusion on the bottom */}
              <radialGradient id="leafAO" cx="50%" cy="100%" r="50%">
                <stop offset="0%" stopColor="#002a18" stopOpacity="0.4" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            {/* Main leaf */}
            <path
              d="M 25 48 C 25 48 7 35 7 18 C 7 9 15 4 25 4 C 35 4 43 9 43 18 C 43 35 25 48 25 48 Z"
              fill="url(#leafG)"
              filter="url(#leafS)"
            />
            {/* AO overlay */}
            <path
              d="M 25 48 C 25 48 7 35 7 18 C 7 9 15 4 25 4 C 35 4 43 9 43 18 C 43 35 25 48 25 48 Z"
              fill="url(#leafAO)"
            />
            {/* Midrib */}
            <line x1="25" y1="48" x2="25" y2="9" stroke="rgba(0,64,32,0.45)" strokeWidth="1" />
            {/* Lateral veins */}
            <path d="M 25 22 Q 18 20 14 16" fill="none" stroke="rgba(0,64,32,0.3)" strokeWidth="0.9" />
            <path d="M 25 29 Q 32 27 36 23" fill="none" stroke="rgba(0,64,32,0.3)" strokeWidth="0.9" />
            <path d="M 25 17 Q 20 15 17 12" fill="none" stroke="rgba(0,64,32,0.25)" strokeWidth="0.7" />
            {/* Highlight */}
            <path
              d="M 22 9 Q 16 13 14 20"
              fill="none"
              stroke="rgba(180,255,200,0.25)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: '30px',
              fontWeight: 500,
              color: '#F5F5F7',
              lineHeight: 1,
            }}
          >
            {daily.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '3px' }}>
            kg CO₂ / day
          </div>
        </div>
      </div>

      {/* Grid health bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: '#8E8E93' }}>Renewable grid mix</span>
          <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", color: '#00FF9C' }}>
            {(RENEW_PCT * 100).toFixed(0)}%
          </span>
        </div>
        <div
          className="relative h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            style={{
              width: `${RENEW_PCT * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00A85A, #00FF9C)',
              borderRadius: '9999px',
              boxShadow: '0 0 10px rgba(0,255,156,0.65)',
              animation: 'progress-pulse 2.4s ease-in-out infinite',
            }}
          />
        </div>
        <div style={{ fontSize: '10px', color: '#8E8E93', marginTop: '7px' }}>
          {(INTENSITY * 1000).toFixed(0)} g/kWh · Best draw window 02:00–06:00
        </div>
      </div>
    </div>
  );
}
