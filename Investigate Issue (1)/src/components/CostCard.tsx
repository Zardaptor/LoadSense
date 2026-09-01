interface Props {
  totalWatts: number;
}

const RATE = 6.5;
const HOURS = 8;
// Simulated prior 6 days of cost in ₹
const PRIOR = [38.2, 41.7, 36.4, 49.1, 44.8, 53.2];

export default function CostCard({ totalWatts }: Props) {
  const today = parseFloat(((totalWatts / 1000) * HOURS * RATE).toFixed(2));
  const data = [...PRIOR, today];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const W = 200;
  const H = 44;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * H * 0.78 - H * 0.11,
  }));

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;

  const yesterday = data[data.length - 2];
  const delta = today - yesterday;
  const isUp = delta >= 0;

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
        DAILY COST
      </div>

      <div className="flex items-end gap-3 mb-4">
        <span
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: '34px',
            fontWeight: 500,
            color: '#F5F5F7',
            lineHeight: 1,
          }}
        >
          ₹{today.toFixed(2)}
        </span>

        {/* Trend arrow with shimmer */}
        <div className="relative flex items-center gap-1.5 mb-0.5 overflow-hidden rounded-sm px-1">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <polyline
              points={isUp ? "3,14 9,4 15,14" : "3,4 9,14 15,4"}
              fill="none"
              stroke="#00FF9C"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0,255,156,0.45), transparent)',
              animation: 'shimmer-sweep 3.2s ease-in-out infinite',
            }}
          />
        </div>

        <span style={{ fontSize: '11px', color: '#8E8E93', marginBottom: '3px', whiteSpace: 'nowrap' }}>
          {isUp ? '+' : ''}₹{Math.abs(delta).toFixed(2)} vs yesterday
        </span>
      </div>

      {/* Sparkline */}
      <svg width="100%" viewBox={`0 0 ${W} ${H + 4}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="saG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FF9C" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00FF9C" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#saG)" />
        <path
          d={line}
          fill="none"
          stroke="#00FF9C"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="600"
          style={{ animation: 'draw-sparkline 1.6s ease-out forwards' }}
        />
        {pts.length > 0 && (
          <circle
            cx={pts[pts.length - 1].x}
            cy={pts[pts.length - 1].y}
            r="3"
            fill="#00FF9C"
            style={{ filter: 'drop-shadow(0 0 5px #00FF9C)' }}
          />
        )}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '10px', color: '#8E8E93' }}>7 days ago</span>
        <span style={{ fontSize: '10px', color: '#8E8E93' }}>Today</span>
      </div>
    </div>
  );
}
