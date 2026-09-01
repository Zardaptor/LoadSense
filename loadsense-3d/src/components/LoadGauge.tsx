import { useMemo } from 'react';
import type { GridState } from '../App';

interface Props {
  totalWatts: number;
  gridState: GridState;
}

const CX = 100;
const CY = 100;
const R = 75;
const SW = 13;
const START_DEG = 225;
const SWEEP = 270;
const MAX_WATTS = 3600;

function polar(deg: number, r = R): { x: number; y: number } {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function arc(startDeg: number, endDeg: number, r = R): string {
  const delta = endDeg - startDeg;
  if (delta < 0.5) return '';
  const s = polar(startDeg, r);
  const e = polar(endDeg, r);
  const large = delta > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

export default function LoadGauge({ totalWatts, gridState }: Props) {
  const pct = Math.min(1, totalWatts / MAX_WATTS);
  const currentDeg = START_DEG + pct * SWEEP;
  const endDeg = START_DEG + SWEEP;

  const gaugeColor =
    gridState === 'critical' ? '#FF2D55' : gridState === 'warning' ? '#FF9500' : '#00FF9C';

  const fullPath = useMemo(() => arc(START_DEG, endDeg), [endDeg]);
  const coverPath = useMemo(
    () => (pct < 0.998 ? arc(currentDeg, endDeg) : ''),
    [pct, currentDeg, endDeg]
  );

  const ticks = useMemo(() => {
    const t: { d: string; major: boolean }[] = [];
    for (let i = 0; i <= 36; i++) {
      const deg = START_DEG + (i / 36) * SWEEP;
      const major = i % 6 === 0;
      const inner = polar(deg, R + (major ? 9 : 7));
      const outer = polar(deg, R + 16);
      t.push({ d: `M ${inner.x.toFixed(2)} ${inner.y.toFixed(2)} L ${outer.x.toFixed(2)} ${outer.y.toFixed(2)}`, major });
    }
    return t;
  }, []);

  const tipPt = polar(currentDeg);
  const startPt = polar(START_DEG);
  const endPt = polar(endDeg);

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: '#121212',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontFamily: "'Inter Tight',sans-serif",
          fontSize: '11px',
          fontWeight: 700,
          color: '#8E8E93',
          letterSpacing: '0.09em',
          marginBottom: '12px',
        }}
      >
        TOTAL LOAD
      </div>

      {/* Limit progress bar */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: "'Inter', sans-serif" }}>
            Limit: 3,600W
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: gaugeColor,
              transition: 'color 1.5s ease',
            }}
          >
            {(pct * 100).toFixed(0)}%
          </span>
        </div>
        <div
          style={{
            height: '4px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct * 100}%`,
              height: '100%',
              background: `linear-gradient(to right, #00FF9C, ${gaugeColor})`,
              borderRadius: '2px',
              boxShadow: `0 0 8px ${gaugeColor}55`,
              transition: 'width 1.4s ease, background 1.5s ease, box-shadow 1.5s ease',
            }}
          />
        </div>
      </div>

      <div className="flex justify-center">
        <svg viewBox="0 0 200 190" style={{ width: '100%', maxWidth: '210px', overflow: 'visible' }}>
          <defs>
            <linearGradient id="arcG" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#00FF9C" />
              <stop offset="44%" stopColor="#FF9500" />
              <stop offset="100%" stopColor="#FF2D55" />
            </linearGradient>
            <filter id="gglow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Slowly rotating tick ring — use SVG animateTransform for correct origin */}
          <g>
            {ticks.map((t, i) => (
              <path
                key={i}
                d={t.d}
                stroke={t.major ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}
                strokeWidth={t.major ? 1.5 : 0.8}
                fill="none"
              />
            ))}
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${CX} ${CY}`}
              to={`360 ${CX} ${CY}`}
              dur="60s"
              repeatCount="indefinite"
            />
          </g>

          {/* Background arc */}
          <path d={fullPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={SW} strokeLinecap="round" />

          {/* Gradient arc (full) */}
          <path d={fullPath} fill="none" stroke="url(#arcG)" strokeWidth={SW} strokeLinecap="round" opacity="0.9" />

          {/* Dark cover arc — hides the unused portion */}
          {coverPath && (
            <path d={coverPath} fill="none" stroke="#121212" strokeWidth={SW + 3} strokeLinecap="butt" />
          )}

          {/* Glowing tip dot */}
          {pct > 0.02 && (
            <circle cx={tipPt.x} cy={tipPt.y} r={SW / 2 - 1} fill={gaugeColor} filter="url(#gglow)" opacity="0.85" />
          )}

          {/* Center watt readout */}
          <text
            x={CX} y={CY - 6}
            textAnchor="middle"
            fill={gaugeColor}
            fontSize="26"
            fontFamily="'JetBrains Mono',monospace"
            fontWeight="500"
            style={{ filter: `drop-shadow(0 0 10px ${gaugeColor}80)`, transition: 'fill 1.5s ease' }}
          >
            {totalWatts.toFixed(0)}
          </text>
          <text x={CX} y={CY + 12} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="'Inter',sans-serif">
            WATTS
          </text>

          {/* Grid state label */}
          <text
            x={CX} y={CY + 52}
            textAnchor="middle"
            fill={gaugeColor}
            fontSize="9"
            fontFamily="'Inter Tight',sans-serif"
            fontWeight="700"
            letterSpacing="0.12em"
            style={{ transition: 'fill 1.5s ease' }}
          >
            {gridState.toUpperCase()}
          </text>

          {/* Range labels */}
          <text x={startPt.x - 10} y={startPt.y + 5} textAnchor="middle" fill="rgba(255,255,255,0.22)" fontSize="8" fontFamily="'JetBrains Mono'">0</text>
          <text x={endPt.x + 12} y={endPt.y + 5} textAnchor="middle" fill="rgba(255,255,255,0.22)" fontSize="8" fontFamily="'JetBrains Mono'">3.6k</text>
        </svg>
      </div>
    </div>
  );
}
