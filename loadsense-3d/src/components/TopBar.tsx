import type { GridState } from '../App';

interface Props {
  gridState: GridState;
  totalWatts: number;
}

export default function TopBar({ gridState, totalWatts }: Props) {
  const statusColor =
    gridState === 'critical' ? '#FF2D55' :
    gridState === 'warning' ? '#FF9500' : '#00FF9C';
  const statusLabel =
    gridState === 'critical' ? 'GRID ALERT' :
    gridState === 'warning' ? 'GRID NOMINAL' : 'SYSTEM ONLINE';
  const statusBg =
    gridState === 'critical' ? 'rgba(255,45,85,0.1)' :
    gridState === 'warning' ? 'rgba(255,149,0,0.1)' : 'rgba(0,255,156,0.08)';

  return (
    <div
      style={{
        height: '44px',
        background: 'rgba(6,6,10,0.92)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '18px',
        paddingRight: '18px',
        gap: '14px',
        flexShrink: 0,
        zIndex: 10,
        position: 'relative',
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontFamily: "'Inter Tight', sans-serif",
            fontSize: '12px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.32)',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          Overview
        </span>
        <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '13px', lineHeight: 1 }}>›</span>
        <span
          style={{
            fontFamily: "'Inter Tight', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.72)',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          Live Grid
        </span>

        {/* Live dot */}
        <div
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: '#00FF9C',
            boxShadow: '0 0 5px #00FF9C',
            marginLeft: '6px',
            animation: 'progress-pulse 2.8s ease-in-out infinite',
          }}
        />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: 'rgba(0,255,156,0.6)',
            letterSpacing: '0.06em',
          }}
        >
          LIVE
        </span>
      </div>

      {/* Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          padding: '0 14px',
          height: '28px',
          width: '192px',
          flexShrink: 0,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <circle cx="4.5" cy="4.5" r="3.2" stroke="rgba(255,255,255,0.25)" strokeWidth="1.1" />
          <path d="M6.8 6.8 L9.5 9.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
        <span
          style={{
            fontSize: '11px',
            fontFamily: "'Inter', sans-serif",
            color: 'rgba(255,255,255,0.2)',
          }}
        >
          Search telemetry...
        </span>
      </div>

      {/* Watt readout */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.18)' }}>LOAD </span>
        <span style={{ color: statusColor, transition: 'color 1.5s ease' }}>
          {totalWatts.toFixed(0)}W
        </span>
      </div>

      {/* Notification bell */}
      <div style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
          <path
            d="M8.5 1.8 C6.4 1.8 4.7 3.5 4.7 5.6 C4.7 8.9 3 10.3 3 10.3 H14 C14 10.3 12.3 8.9 12.3 5.6 C12.3 3.5 10.6 1.8 8.5 1.8 Z"
            stroke="rgba(255,255,255,0.32)" strokeWidth="1.1"
          />
          <path d="M6.8 10.3 C6.8 11.3 7.6 12.1 8.5 12.1 C9.4 12.1 10.2 11.3 10.2 10.3"
            stroke="rgba(255,255,255,0.32)" strokeWidth="1.1" />
        </svg>
        {gridState !== 'healthy' && (
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 6px ${statusColor}`,
              border: '1px solid #06060A',
              transition: 'background 1.5s ease',
            }}
          />
        )}
      </div>

      {/* Status badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: statusBg,
          border: `1px solid ${statusColor}28`,
          borderRadius: '20px',
          padding: '4px 12px',
          flexShrink: 0,
          transition: 'all 1.5s ease',
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: statusColor,
            boxShadow: `0 0 7px ${statusColor}`,
            flexShrink: 0,
            animation: gridState === 'critical' ? 'warn-strobe 1.8s ease-in-out infinite' : 'progress-pulse 2.5s ease-in-out infinite',
            transition: 'background 1.5s ease',
          }}
        />
        <span
          style={{
            fontFamily: "'Inter Tight', sans-serif",
            fontSize: '10.5px',
            fontWeight: 700,
            color: statusColor,
            letterSpacing: '0.08em',
            transition: 'color 1.5s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
