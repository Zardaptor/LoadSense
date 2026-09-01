import type { GridState, SocketData } from '../App';

interface Props {
  sockets: SocketData[];
  gridState: GridState;
}

const SOCK_COLORS = ['#00D4FF', '#00FF9C', '#FF9500', '#BD00FF', '#FF2D55', '#FFD60A'];

export default function DisaggregationStrip({ sockets, gridState }: Props) {
  const active = sockets.filter(s => s.active && s.watts > 0);
  const maxW = Math.max(...active.map(s => s.watts), 1);

  const accentColor =
    gridState === 'critical' ? '#FF2D55' :
    gridState === 'warning' ? '#FF9500' : '#00D4FF';

  return (
    <div
      className="rounded-2xl shrink-0"
      style={{
        background: '#121212',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        padding: '13px 16px 14px',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '11px',
        }}
      >
        <span
          style={{
            fontFamily: "'Inter Tight', sans-serif",
            fontSize: '11px',
            fontWeight: 700,
            color: '#8E8E93',
            letterSpacing: '0.09em',
          }}
        >
          REAL-TIME DISAGGREGATION
        </span>
        <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
          <path d="M1 8 L4 4.5 L6.5 6.5 L9.5 2.5 L12 1"
            stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'stroke 1.5s ease' }}
          />
        </svg>
      </div>

      {/* Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {active.map(s => {
          const color = SOCK_COLORS[(s.id - 1) % SOCK_COLORS.length];
          const pct = (s.watts / maxW) * 100;
          const primaryLabel = s.appliances.length > 0 ? s.appliances[0].name : `Socket ${s.id}`;

          return (
            <div
              key={s.id}
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)',
                  width: '82px',
                  flexShrink: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {primaryLabel}
              </span>

              {/* Track */}
              <div
                style={{
                  flex: 1,
                  height: '5px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: color,
                    borderRadius: '3px',
                    boxShadow: `0 0 6px ${color}55`,
                    transition: 'width 1.4s ease',
                  }}
                />
              </div>

              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  color: color,
                  width: '44px',
                  textAlign: 'right',
                  flexShrink: 0,
                  transition: 'color 1.5s ease',
                }}
              >
                {s.watts.toFixed(0)}W
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
