import type { GridState } from '../App';

interface Props {
  gridState: GridState;
}

function DashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function GridMapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5 L14.5 5.25 V10.75 L8 14.5 L1.5 10.75 V5.25 Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 5 V11 M4.5 7.25 L11.5 8.75" stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.6" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="9.5" width="3" height="5" rx="0.9" stroke="currentColor" strokeWidth="1.2" />
      <rect x="6.5" y="5.5" width="3" height="9" rx="0.9" stroke="currentColor" strokeWidth="1.2" />
      <rect x="11" y="2" width="3" height="12.5" rx="0.9" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function AutomationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M9.5 1.5 L6 8.5 H10 L6.5 14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="2.2" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M7.5 1 V2.5 M7.5 12.5 V14 M1 7.5 H2.5 M12.5 7.5 H14 M3.1 3.1 L4.15 4.15 M10.85 10.85 L11.9 11.9 M11.9 3.1 L10.85 4.15 M4.15 10.85 L3.1 11.9"
        stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"
      />
    </svg>
  );
}

const NAV = [
  { Icon: DashIcon, label: 'Dashboard' },
  { Icon: GridMapIcon, label: 'Grid Map' },
  { Icon: AnalyticsIcon, label: 'Analytics' },
  { Icon: AutomationIcon, label: 'Automation' },
];

export default function Sidebar({ gridState, currentTab, setCurrentTab }: Props & { currentTab: string, setCurrentTab: (t: string) => void }) {
  const accent =
    gridState === 'critical' ? '#FF2D55' :
    gridState === 'warning' ? '#FF9500' : '#00D4FF';

  return (
    <div
      style={{
        width: '54px',
        height: '100%',
        background: '#06060A',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        flexShrink: 0,
        position: 'relative',
        zIndex: 20,
      }}
    >
      {/* Logo mark */}
      <div
        title="LOADSENSE"
        style={{
          width: '32px',
          height: '32px',
          background: `${accent}10`,
          border: `1px solid ${accent}30`,
          borderRadius: '9px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: `0 0 18px ${accent}18`,
          transition: 'border-color 1.5s ease, box-shadow 1.5s ease, background 1.5s ease',
          cursor: 'default',
          flexShrink: 0,
        }}
      >
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
          <path d="M8.5 1.2 L15.5 5.1 V11.9 L8.5 15.8 L1.5 11.9 V5.1 Z"
            stroke={accent} strokeWidth="1.1" fill={`${accent}12`} style={{ transition: 'stroke 1.5s ease' }} />
          <circle cx="8.5" cy="8.5" r="2.2" fill={accent} opacity="0.9" style={{ transition: 'fill 1.5s ease' }} />
        </svg>
      </div>

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', alignItems: 'center' }}>
        {NAV.map(({ Icon, label }) => {
          const active = currentTab === label;
          return (
          <div
            key={label}
            title={label}
            onClick={() => setCurrentTab(label)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: active ? `${accent}12` : 'transparent',
              border: active ? `1px solid ${accent}22` : '1px solid transparent',
              color: active ? accent : 'rgba(255,255,255,0.26)',
              position: 'relative',
              transition: 'all 0.2s ease',
            }}
          >
            {active && (
              <div
                style={{
                  position: 'absolute',
                  left: '-8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '20px',
                  background: accent,
                  borderRadius: '0 3px 3px 0',
                  boxShadow: `0 0 10px ${accent}`,
                  transition: 'background 1.5s ease, box-shadow 1.5s ease',
                }}
              />
            )}
            <Icon />
          </div>
        )})}
      </div>

      <div style={{ flex: 1 }} />

      {/* Settings */}
      <div
        title="Settings"
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.2)',
          marginBottom: '10px',
        }}
      >
        <SettingsIcon />
      </div>

      {/* User avatar */}
      <div
        title="Admin User — Pro Plan"
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0,212,255,0.18), rgba(124,58,237,0.18))',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '9px',
          fontFamily: "'Inter Tight', sans-serif",
          fontWeight: 700,
          color: '#6E6E76',
          letterSpacing: '0.05em',
          cursor: 'pointer',
        }}
      >
        AU
      </div>
    </div>
  );
}
