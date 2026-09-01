import type { GridState, SocketData } from '../App';

interface Props {
  gridState: GridState;
  sockets: SocketData[];
  totalWatts: number;
}

interface Anomaly {
  title: string;
  desc: string;
  severity: 'high' | 'medium' | 'low';
}

const SEVERITY_COLOR: Record<string, string> = {
  high: '#FF2D55',
  medium: '#FF9500',
  low: '#FFD60A',
};

function getAnomalies(gridState: GridState, sockets: SocketData[], totalWatts: number): Anomaly[] {
  if (gridState === 'critical') {
    const overloaded = sockets.find(s => s.watts > 1500);
    return [
      {
        title: 'Arc Fault Risk',
        desc: overloaded
          ? `Socket ${overloaded.id} — ${overloaded.watts.toFixed(0)}W draw (Critical)`
          : 'Extreme current draw detected on bus',
        severity: 'high',
      },
      {
        title: 'Thermal Overload',
        desc: 'Bus temperature above threshold — MCB trip imminent',
        severity: 'high',
      },
      {
        title: 'Phase Imbalance',
        desc: 'Load distribution exceeds ±15% variance',
        severity: 'medium',
      },
    ];
  }
  if (gridState === 'warning') {
    return [
      {
        title: 'Elevated Draw',
        desc: `${totalWatts.toFixed(0)}W — ${((totalWatts / 3600) * 100).toFixed(0)}% of capacity ceiling`,
        severity: 'medium',
      },
      {
        title: 'Efficiency Drift',
        desc: 'Socket 2 drawing 8% above calibrated baseline',
        severity: 'low',
      },
    ];
  }
  return [];
}

function TriangleIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
      <path d="M6.5 1.8 L12 11.5 H1 Z" stroke={color} strokeWidth="1.1" fill={`${color}18`} strokeLinejoin="round" />
      <line x1="6.5" y1="5" x2="6.5" y2="7.8" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="6.5" cy="9.5" r="0.65" fill={color} />
    </svg>
  );
}

export default function AnomalyPanel({ gridState, sockets, totalWatts }: Props) {
  const anomalies = getAnomalies(gridState, sockets, totalWatts);
  const count = anomalies.length;
  const isCritical = count >= 3;
  const borderColor = isCritical ? 'rgba(255,45,85,0.22)' : count > 0 ? 'rgba(255,149,0,0.16)' : 'rgba(255,255,255,0.08)';
  const badgeBg = isCritical ? 'rgba(255,45,85,0.18)' : 'rgba(255,149,0,0.18)';
  const badgeBorder = isCritical ? 'rgba(255,45,85,0.4)' : 'rgba(255,149,0,0.4)';
  const badgeColor = isCritical ? '#FF2D55' : '#FF9500';

  return (
    <div
      className="rounded-2xl"
      style={{
        background: '#121212',
        border: `1px solid ${borderColor}`,
        boxShadow: isCritical ? '0 0 24px rgba(255,45,85,0.07)' : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        overflow: 'hidden',
        transition: 'border-color 1.5s ease, box-shadow 1.5s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '11px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <TriangleIcon color={count > 0 ? '#FF9500' : 'rgba(255,255,255,0.2)'} />
        <span
          style={{
            fontFamily: "'Inter Tight', sans-serif",
            fontSize: '11px',
            fontWeight: 700,
            color: '#8E8E93',
            letterSpacing: '0.09em',
            flex: 1,
          }}
        >
          NEURAL ANOMALIES
        </span>
        {count > 0 ? (
          <div
            style={{
              background: badgeBg,
              border: `1px solid ${badgeBorder}`,
              borderRadius: '5px',
              padding: '2px 8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 500,
              color: badgeColor,
              transition: 'all 1.5s ease',
            }}
          >
            {count} Alert{count !== 1 ? 's' : ''}
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(0,255,156,0.08)',
              border: '1px solid rgba(0,255,156,0.2)',
              borderRadius: '5px',
              padding: '2px 8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: '#00FF9C',
            }}
          >
            Clear
          </div>
        )}
      </div>

      {/* Body */}
      <div>
        {count === 0 ? (
          <div
            style={{
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
            }}
          >
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#00FF9C',
                boxShadow: '0 0 7px #00FF9C',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontFamily: "'Inter', sans-serif",
                color: 'rgba(255,255,255,0.38)',
              }}
            >
              All systems nominal — no anomalies detected
            </span>
          </div>
        ) : (
          anomalies.map((a, i) => (
            <div
              key={i}
              style={{
                padding: '9px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                borderBottom: i < anomalies.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                animation: 'fade-rise 0.28s ease-out both',
                animationDelay: `${i * 55}ms`,
              }}
            >
              <div
                style={{
                  marginTop: '4px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: SEVERITY_COLOR[a.severity],
                  boxShadow: `0 0 7px ${SEVERITY_COLOR[a.severity]}80`,
                  flexShrink: 0,
                  transition: 'background 1.5s ease',
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'Inter Tight', sans-serif",
                    fontSize: '12px',
                    fontWeight: 600,
                    color: SEVERITY_COLOR[a.severity],
                    marginBottom: '2px',
                    transition: 'color 1.5s ease',
                  }}
                >
                  {a.title}
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.36)',
                    lineHeight: '1.45',
                  }}
                >
                  {a.desc}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
