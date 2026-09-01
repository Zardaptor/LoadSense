import { useRef, useEffect, useState } from 'react';
import type { SocketData, GridState } from '../App';

interface Props {
  sockets: SocketData[];
  selectedSocket: number | null;
  onSocketClick: (id: number) => void;
  gridState: GridState;
}

// SVG viewBox 0 0 740 300
// Board: x=28, y=65, w=684, h=170, rx=20
// Bus trace at y=218, socket centers at y=150

const SOCK_CX = [120, 220, 320, 420, 520, 620];
const SOCK_CY = 150;
const SOCK_HALF = 28; // socket is 56×56
const BUS_Y = 218;
const INPUT_X = 5;

function tracePath(cx: number): string {
  return `M ${INPUT_X} ${BUS_Y} H ${cx} V ${SOCK_CY + SOCK_HALF}`;
}

export default function PowerBoard({ sockets, selectedSocket, onSocketClick, gridState }: Props) {
  const [rotX, setRotX] = useState(22);
  const [rotY, setRotY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredSocket, setHoveredSocket] = useState<number | null>(null);
  const dragRef = useRef({ sx: 0, sy: 0, rx: 0, ry: 0 });
  const animRef = useRef(0);
  const tRef = useRef(0);

  // Auto-rotate idle when not dragging
  useEffect(() => {
    if (isDragging) return;
    const animate = () => {
      tRef.current += 0.005;
      setRotY(Math.sin(tRef.current) * 18);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragRef.current = { sx: e.clientX, sy: e.clientY, rx: rotX, ry: rotY };
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragRef.current.sx;
      const dy = e.clientY - dragRef.current.sy;
      setRotY(Math.max(-50, Math.min(50, dragRef.current.ry + dx * 0.25)));
      setRotX(Math.max(-18, Math.min(38, dragRef.current.rx - dy * 0.2)));
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);

  const glowColor =
    gridState === 'critical' ? '#FF2D55' : gridState === 'warning' ? '#FF9500' : '#00FF9C';
  const glowRgb =
    gridState === 'critical' ? '255,45,85' : gridState === 'warning' ? '255,149,0' : '0,255,156';

  const selectedSocketData = selectedSocket !== null ? sockets.find(s => s.id === selectedSocket) : null;
  const hoveredSocketData = hoveredSocket !== null ? sockets.find(s => s.id === hoveredSocket) : null;

  return (
    <div
      className="flex-1 rounded-2xl relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 45%, #161619 0%, #0d0d10 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 60px rgba(${glowRgb},0.05)`,
        transition: 'box-shadow 1.5s ease',
      }}
    >
      {/* Header */}
      <div className="absolute top-4 left-5 z-20 flex items-center gap-2.5">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: glowColor,
            boxShadow: `0 0 6px ${glowColor}, 0 0 14px ${glowColor}60`,
            transition: 'background 1.5s ease, box-shadow 1.5s ease',
          }}
        />
        <span
          style={{
            fontFamily: "'Inter Tight', sans-serif",
            fontSize: '12px',
            fontWeight: 700,
            color: '#F5F5F7',
            letterSpacing: '0.08em',
          }}
        >
          SMART EXTENSION — UNIT A1
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#8E8E93' }}>
          LIVE
        </span>
      </div>

      {!isDragging && (
        <div
          className="absolute top-4 right-5 z-20 text-xs"
          style={{ color: '#8E8E93', fontFamily: "'Inter', sans-serif", opacity: 0.4 }}
        >
          drag to rotate
        </div>
      )}

      {/* 3D Canvas — lower perspective = more dramatic foreshortening */}
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          perspective: '460px',
          paddingTop: '52px',
          paddingBottom: '16px',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Rotation wrapper — position:relative so CSS 3D face panels can be placed as siblings to the SVG */}
        <div
          style={{
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            transition: isDragging ? 'none' : 'transform 0.05s linear',
            transformStyle: 'preserve-3d',
            position: 'relative',
            width: '88%',
            maxWidth: '640px',
          }}
        >
          {/* Bottom face — board body bottom edge (y=235/300 = 78.3%), visible when tilted forward */}
          <div
            style={{
              position: 'absolute',
              top: '78.3%',
              left: '3.78%',
              right: '3.78%',
              height: '22px',
              background: `linear-gradient(to bottom, #1c1c24 0%, #0a0a0f 100%)`,
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              borderBottom: `1px solid rgba(${glowRgb},0.12)`,
              transform: 'rotateX(-90deg)',
              transformOrigin: 'top center',
              boxShadow: `0 4px 24px rgba(${glowRgb},0.15)`,
            }}
          />
          {/* Right face — board body right edge (x=712/740 = 96.2%), visible when rotated right */}
          <div
            style={{
              position: 'absolute',
              top: '21.67%',
              right: '3.51%',
              height: '56.67%',
              width: '22px',
              background: `linear-gradient(to right, #18181f 0%, #08080c 100%)`,
              borderTop: '1px solid rgba(255,255,255,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              borderRight: `1px solid rgba(${glowRgb},0.10)`,
              transform: 'rotateY(90deg)',
              transformOrigin: 'left center',
            }}
          />
          {/* Left face — visible when rotated left */}
          <div
            style={{
              position: 'absolute',
              top: '21.67%',
              left: '1.2%',
              height: '56.67%',
              width: '22px',
              background: `linear-gradient(to left, #18181f 0%, #08080c 100%)`,
              borderTop: '1px solid rgba(255,255,255,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              borderLeft: `1px solid rgba(${glowRgb},0.10)`,
              transform: 'rotateY(-90deg)',
              transformOrigin: 'right center',
            }}
          />
          <svg viewBox="0 0 740 300" style={{ width: '100%', display: 'block', overflow: 'visible' }}>
            <defs>
              <filter id="pglow" x="-250%" y="-250%" width="600%" height="600%">
                <feGaussianBlur stdDeviation="2.5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="sglow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="bboard" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#202025" />
                <stop offset="100%" stopColor="#141418" />
              </linearGradient>
              <linearGradient id="bedge" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={glowColor} stopOpacity="0.05" />
                <stop offset="50%" stopColor={glowColor} stopOpacity="0.10" />
                <stop offset="100%" stopColor={glowColor} stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Board drop shadow */}
            <ellipse cx="370" cy="265" rx="310" ry="18" fill="rgba(0,0,0,0.55)" filter="url(#sglow)" />

            {/* Board body */}
            <rect x="28" y="65" width="684" height="170" rx="20" fill="url(#bboard)" />
            <rect x="28" y="65" width="684" height="170" rx="20" fill="url(#bedge)" />
            <rect x="28" y="65" width="684" height="170" rx="20" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
            {/* Bevel highlight */}
            <rect x="29" y="66" width="682" height="5" rx="19" fill="rgba(255,255,255,0.055)" />

            {/* Power cord input */}
            <rect x="0" y="122" width="34" height="56" rx="8" fill="#0b0b0e" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <rect x="11" y="131" width="12" height="7" rx="2" fill="rgba(255,255,255,0.22)" />
            <circle cx="9" cy="155" r="5.5" fill="rgba(255,255,255,0.15)" />
            <circle cx="25" cy="155" r="5.5" fill="rgba(255,255,255,0.15)" />

            {/* MCB switch */}
            <rect x="40" y="85" width="28" height="58" rx="6" fill="#0a0a0d" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <rect x="46" y="92" width="16" height="24" rx="4" fill={glowColor} fillOpacity="0.72" />
            <rect x="46" y="118" width="16" height="16" rx="3" fill="#1a1a1e" />
            <text x="54" y="130" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="5" fontFamily="'JetBrains Mono',monospace">MCB</text>

            {/* Main bus trace */}
            <line
              x1={INPUT_X} y1={BUS_Y}
              x2="640" y2={BUS_Y}
              stroke={`rgba(${glowRgb},0.16)`}
              strokeWidth="2"
              strokeDasharray="5 4"
            />

            {/* Sockets */}
            {SOCK_CX.map((cx, i) => {
              const sock = sockets[i];
              const isActive = sock.active;
              const isSel = selectedSocket === sock.id;
              const isHov = hoveredSocket === sock.id;
              const sc = isActive ? glowColor : '#2a2a2e';
              const sx = cx - SOCK_HALF;
              const sy = SOCK_CY - SOCK_HALF;

              return (
                <g key={sock.id}>
                  {/* Vertical stub to bus */}
                  <line
                    x1={cx} y1={SOCK_CY + SOCK_HALF}
                    x2={cx} y2={BUS_Y}
                    stroke={`rgba(${glowRgb},${isActive ? 0.22 : 0.07})`}
                    strokeWidth="1.5"
                  />

                  {/* Socket group */}
                  <g
                    transform={`translate(${sx},${sy})`}
                    style={{ cursor: 'pointer' }}
                    onClick={e => { e.stopPropagation(); onSocketClick(sock.id); }}
                    onMouseEnter={() => setHoveredSocket(sock.id)}
                    onMouseLeave={() => setHoveredSocket(null)}
                  >
                    {/* Glow halo */}
                    {isActive && (
                      <rect
                        x="-5" y="-5"
                        width={SOCK_HALF * 2 + 10} height={SOCK_HALF * 2 + 10}
                        rx="13"
                        fill={glowColor}
                        fillOpacity={isSel || isHov ? 0.07 : 0.025}
                        filter="url(#sglow)"
                      />
                    )}

                    {/* Housing */}
                    <rect
                      x="0" y="0" width={SOCK_HALF * 2} height={SOCK_HALF * 2} rx="8"
                      fill="#0e0e12"
                      stroke={isSel || isHov ? sc : 'rgba(255,255,255,0.10)'}
                      strokeWidth={isSel ? 1.5 : 1}
                    />

                    {/* Earth slot */}
                    <rect x="17" y="6" width="22" height="9" rx="3" fill={isActive ? '#222228' : '#181818'} />

                    {/* Live pin */}
                    <circle cx="14" cy="39" r="7" fill={isActive ? '#222228' : '#181818'} />
                    {isActive && <circle cx="14" cy="39" r="4" fill={sc} fillOpacity="0.45" />}

                    {/* Neutral pin */}
                    <circle cx="42" cy="39" r="7" fill={isActive ? '#222228' : '#181818'} />
                    {isActive && <circle cx="42" cy="39" r="4" fill={sc} fillOpacity="0.45" />}

                    {/* LED indicator */}
                    <circle
                      cx="50" cy="8" r="3.5"
                      fill={isActive ? sc : '#1c1c22'}
                      style={isActive ? { filter: `drop-shadow(0 0 4px ${sc})` } : undefined}
                    />

                    {/* Watt label */}
                    {isActive && (
                      <text
                        x="28" y="55"
                        textAnchor="middle"
                        fill={sc} fillOpacity="0.6"
                        fontSize="7"
                        fontFamily="'JetBrains Mono',monospace"
                      >
                        {sock.watts.toFixed(0)}W
                      </text>
                    )}

                    {/* Socket number */}
                    <text
                      x="28" y="-5"
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.22)"
                      fontSize="7"
                      fontFamily="'Inter Tight',sans-serif"
                    >
                      {i + 1}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Animated particles for active sockets */}
            {sockets.map((sock, i) => {
              if (!sock.active || sock.watts === 0) return null;
              const cx = SOCK_CX[i];
              const speed = Math.max(0.7, 2.8 - sock.watts / 850);
              const path = tracePath(cx);
              return [0, 1, 2].map(j => (
                <circle key={`p${sock.id}-${j}`} r="2.5" fill={glowColor} filter="url(#pglow)" opacity="0.88">
                  <animateMotion
                    dur={`${(speed + j * 0.38).toFixed(2)}s`}
                    repeatCount="indefinite"
                    begin={`${(j * speed / 3).toFixed(2)}s`}
                    path={path}
                  />
                </circle>
              ));
            })}

            {/* Ambient bokeh */}
            {[100, 180, 260, 340, 460, 540, 640, 700].map((bx, i) => (
              <circle
                key={`b${i}`}
                cx={bx}
                cy={54 + (i % 3) * 8}
                r={1.2 + (i % 3) * 0.5}
                fill={glowColor}
                fillOpacity={0.055 + (i % 3) * 0.03}
              >
                <animate
                  attributeName="opacity"
                  values={`${0.035 + (i % 3) * 0.02};${0.09 + (i % 3) * 0.03};${0.035 + (i % 3) * 0.02}`}
                  dur={`${3.2 + i * 0.55}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cy"
                  values={`${54 + (i % 3) * 8};${49 + (i % 3) * 8};${54 + (i % 3) * 8}`}
                  dur={`${4.1 + i * 0.4}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </svg>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredSocket !== null && selectedSocket === null && hoveredSocketData?.active && (
        <div
          className="absolute pointer-events-none z-30"
          style={{
            bottom: '20px',
            right: '20px',
            backdropFilter: 'blur(18px) saturate(180%)',
            background: 'rgba(14,14,18,0.78)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '14px',
            padding: '10px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            animation: 'float-tooltip 4s ease-in-out infinite',
          }}
        >
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '18px', fontWeight: 500, color: glowColor, lineHeight: 1 }}>
            {hoveredSocketData.watts.toFixed(0)}W
          </div>
          <div style={{ fontSize: '11px', color: '#8E8E93', marginTop: '3px' }}>
            Socket {hoveredSocket} · {hoveredSocketData.appliances.length} device{hoveredSocketData.appliances.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Click dropdown */}
      {selectedSocketData && (
        <div
          className="absolute z-30"
          style={{
            bottom: '20px',
            left: '50%',
            minWidth: '230px',
            backdropFilter: 'blur(24px) saturate(180%)',
            background: 'rgba(12,12,16,0.9)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '18px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.75)',
            animation: 'spring-in 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 600, fontSize: '13px', color: '#F5F5F7' }}>
              Socket {selectedSocketData.id}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: glowColor, marginTop: '2px' }}>
              {selectedSocketData.watts.toFixed(0)}W · {selectedSocketData.appliances.length} device{selectedSocketData.appliances.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="px-2 py-2">
            {selectedSocketData.appliances.length > 0 ? (
              selectedSocketData.appliances.map((app, idx) => (
                <div
                  key={app.name}
                  className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ animation: `slide-in 0.2s ease-out ${idx * 55}ms both` }}
                >
                  <span style={{ fontSize: '13px', color: '#C0C0C6' }}>{app.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: glowColor }}>
                    {app.watts}W
                  </span>
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-center" style={{ color: '#8E8E93', fontSize: '13px' }}>
                No devices connected
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
