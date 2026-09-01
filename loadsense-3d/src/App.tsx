import { useState, useEffect, useCallback } from 'react';
import CircuitBackground from './components/CircuitBackground';
import PowerBoard from './components/PowerBoard';
import LoadGauge from './components/LoadGauge';
import CostCard from './components/CostCard';
import CarbonCard from './components/CarbonCard';
import AIChat from './components/AIChat';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import AnomalyPanel from './components/AnomalyPanel';
import DisaggregationStrip from './components/DisaggregationStrip';

export type GridState = 'healthy' | 'warning' | 'critical';

export interface Appliance {
  name: string;
  watts: number;
}

export interface SocketData {
  id: number;
  watts: number;
  baseWatts: number;
  active: boolean;
  appliances: Appliance[];
}

const INITIAL: SocketData[] = [
  {
    id: 1, watts: 450, baseWatts: 450, active: true,
    appliances: [{ name: 'LED TV', watts: 200 }, { name: 'Laptop', watts: 250 }],
  },
  {
    id: 2, watts: 650, baseWatts: 650, active: true,
    appliances: [{ name: 'Toaster', watts: 650 }],
  },
  {
    id: 3, watts: 0, baseWatts: 0, active: false,
    appliances: [],
  },
  {
    id: 4, watts: 80, baseWatts: 80, active: true,
    appliances: [{ name: 'Phone Charger', watts: 20 }, { name: 'LED Lamp', watts: 60 }],
  },
  {
    id: 5, watts: 350, baseWatts: 350, active: true,
    appliances: [{ name: 'Air Purifier', watts: 350 }],
  },
  {
    id: 6, watts: 120, baseWatts: 120, active: true,
    appliances: [{ name: 'Desk Fan', watts: 50 }, { name: 'USB Hub', watts: 70 }],
  },
];

export default function App() {
  const [sockets, setSockets] = useState<SocketData[]>(INITIAL);
  const [selectedSocket, setSelectedSocket] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState('Dashboard');

  const totalWatts = sockets.reduce((sum, s) => s.active ? sum + s.watts : sum, 0);
  const gridState: GridState =
    totalWatts > 2500 ? 'critical' : totalWatts > 1400 ? 'warning' : 'healthy';

  // Live fluctuation every ~2s
  useEffect(() => {
    const id = setInterval(() => {
      setSockets(prev =>
        prev.map(s =>
          s.active && s.baseWatts > 0
            ? { ...s, watts: Math.round(s.baseWatts + (Math.random() - 0.5) * s.baseWatts * 0.05) }
            : s
        )
      );
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Overload spike every 45s to demonstrate critical state
  useEffect(() => {
    const spike = () => {
      setSockets(prev =>
        prev.map(s =>
          s.id === 2
            ? {
                ...s, watts: 2100, baseWatts: 2100,
                appliances: [{ name: 'Microwave', watts: 1200 }, { name: 'Electric Kettle', watts: 900 }],
              }
            : s
        )
      );
      setTimeout(() => {
        setSockets(prev =>
          prev.map(s =>
            s.id === 2
              ? { ...s, watts: 650, baseWatts: 650, appliances: [{ name: 'Toaster', watts: 650 }] }
              : s
          )
        );
      }, 10000);
    };
    const id = setInterval(spike, 45000);
    return () => clearInterval(id);
  }, []);

  const ambientColor =
    gridState === 'critical' ? '#FF2D55' : gridState === 'warning' ? '#FF9500' : '#00FF9C';

  const handleSocketClick = useCallback((id: number) => {
    setSelectedSocket(prev => (prev === id ? null : id));
  }, []);

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex"
      style={{ background: '#0A0A0B', fontFamily: "'Inter', sans-serif" }}
      onClick={() => setSelectedSocket(null)}
    >
      {/* Full-viewport canvas background */}
      <CircuitBackground gridState={gridState} />

      {/* Ambient state glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 65% 55% at 38% 55%, ${ambientColor}09 0%, transparent 70%)`,
          transition: 'background 3s ease',
          zIndex: 1,
        }}
      />

      {/* Sidebar */}
      <Sidebar gridState={gridState} currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main column */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ position: 'relative', zIndex: 10 }}>
        {/* Top header bar */}
        <TopBar gridState={gridState} totalWatts={totalWatts} />

        {/* Content area */}
        <div className="flex flex-1 gap-3 p-3 overflow-hidden">

          {/* LEFT PANEL — hero board + disaggregation */}
          <div className="flex flex-col gap-3" style={{ width: '62%' }}>
            {/* MCB critical banner */}
            {gridState === 'critical' && (
              <div
                className="shrink-0 flex items-center gap-3 rounded-full px-5 py-2.5"
                style={{
                  background: 'rgba(255,45,85,0.12)',
                  border: '1px solid rgba(255,45,85,0.35)',
                  color: '#FF2D55',
                  fontFamily: "'Inter Tight', sans-serif",
                  fontWeight: 600,
                  fontSize: '13px',
                  letterSpacing: '0.03em',
                  animation: 'pulse-crimson 1.5s ease-in-out infinite',
                }}
              >
                <span style={{ animation: 'warn-strobe 1.8s ease-in-out infinite', fontSize: '15px' }}>
                  ⚡
                </span>
                <span>MCB OVERLOAD — {totalWatts.toFixed(0)}W exceeds 2,500W safe limit</span>
                <span
                  className="ml-auto"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', opacity: 0.6 }}
                >
                  TRIP RISK
                </span>
              </div>
            )}

            {/* 3D Power Board */}
            <PowerBoard
              sockets={sockets}
              selectedSocket={selectedSocket}
              onSocketClick={handleSocketClick}
              gridState={gridState}
            />

            {/* Real-time disaggregation bars */}
            <DisaggregationStrip sockets={sockets} gridState={gridState} />
          </div>

          {/* RIGHT PANEL — metrics + AI */}
          <div className="overflow-y-auto" style={{ width: '38%' }}>
            <div className="flex flex-col gap-3">
              <LoadGauge totalWatts={totalWatts} gridState={gridState} />
              <AnomalyPanel gridState={gridState} sockets={sockets} totalWatts={totalWatts} />
              <CostCard totalWatts={totalWatts} />
              <CarbonCard totalWatts={totalWatts} />
              <AIChat gridState={gridState} totalWatts={totalWatts} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
