import { useState, useRef, useEffect } from 'react';
import type { GridState } from '../App';

interface Props {
  gridState: GridState;
  totalWatts: number;
}

interface Message {
  id: number;
  role: 'user' | 'ai';
  text: string;
  ts: string;
}

const now = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const SEED: Message[] = [
  {
    id: 1, role: 'ai',
    text: "Grid status: Warning. Socket 2 drawing 650W (Toaster). Total load at 1,650W — 72% of your 2,300W safe limit. Optimise?",
    ts: '09:41',
  },
  {
    id: 2, role: 'user',
    text: "Yes, 3 quick wins",
    ts: '09:42',
  },
  {
    id: 3, role: 'ai',
    text: "1. Shift washing machine off-peak → saves ~40% cost\n2. Never run toaster + kettle simultaneously\n3. Socket 5 air purifier → eco mode saves 120W",
    ts: '09:42',
  },
];

const REPLIES = [
  "Peak draw typically occurs 7–9 PM. Shifting the microwave and toaster before 6 PM improves grid stability significantly.",
  "Carbon intensity now 423 g CO₂/kWh — grid is 58% coal-backed. Best to schedule high-draw tasks after 02:00 when wind coverage reaches 60%.",
  "Anomaly on Socket 1: 23% above its baseline. Your laptop may have a degraded battery or a runaway background process consuming extra draw.",
  "Smart tip: Disconnecting the desk fan (50W) and dimming the TV 30% saves approx. ₹3.80 today with minimal lifestyle impact.",
  "Energy score today: B+. Primary drag is Socket 2. Switching to induction from resistance coil improves cooking efficiency by ~40%.",
];

let replyIdx = 0;

export default function AIChat({ gridState, totalWatts }: Props) {
  const [messages, setMessages] = useState<Message[]>(SEED);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const send = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    
    const newMsg = { id: Date.now(), role: 'user', text, ts: now() };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);
    
    try {
      const apiKey = import.meta.env.VITE_AI_API_KEY;
      if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
        setMessages(prev => [...prev, { id: Date.now()+1, role: 'ai', text: "⚠️ Please enter your Groq API Key in the .env file.", ts: now() }]);
        setIsTyping(false);
        return;
      }
      
      const isGroq = apiKey.startsWith("gsk_");
      
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
        baseURL: isGroq ? "https://api.groq.com/openai/v1" : "https://api.openai.com/v1"
      });
      
      const systemPrompt = `You are LoadSense AI, an advanced Agentic Smart Grid Manager.
      GRID STATUS: Load ${totalWatts}W. TRIPPED: ${gridState === 'critical' ? 'YES' : 'NO'}.
      CRITICAL AGENTIC CAPABILITIES: Keep responses extremely concise (1-2 sentences). You can control the grid.`;
      
      const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: text }],
        model: isGroq ? "openai/gpt-oss-20b" : "gpt-4o-mini", 
      });

      let responseText = completion.choices[0].message.content;
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: responseText, ts: now() }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: `⚠️ API Error: ${error.message}`, ts: now() }]);
    }
    
    setIsTyping(false);
  };

  const hasText = input.trim().length > 0;

  const stateColor =
    gridState === 'critical' ? '#FF2D55' : gridState === 'warning' ? '#FF9500' : '#00FF9C';
  const stateBg =
    gridState === 'critical' ? 'rgba(255,45,85,0.14)' : gridState === 'warning' ? 'rgba(255,149,0,0.14)' : 'rgba(0,255,156,0.11)';

  return (
    <div
      className="rounded-2xl flex flex-col"
      style={{
        background: '#121212',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        minHeight: '290px',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Icon + pulse dot */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1.5" y="4.5" width="11" height="8" rx="1.8" stroke="#00D4FF" strokeWidth="1" />
              <path d="M4.5 4.5 V3 C4.5 2.17 5.17 1.5 6 1.5 H8 C8.83 1.5 9.5 2.17 9.5 3 V4.5"
                stroke="#00D4FF" strokeWidth="1" />
              <circle cx="7" cy="8.5" r="1.1" fill="#00D4FF" />
            </svg>
          </div>
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: isTyping ? '#FF9500' : '#00FF9C',
              boxShadow: `0 0 7px ${isTyping ? '#FF9500' : '#00FF9C'}`,
              border: '1px solid #121212',
              transition: 'background 0.4s ease, box-shadow 0.4s ease',
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: '10.5px',
              fontWeight: 700,
              color: '#8E8E93',
              letterSpacing: '0.09em',
              lineHeight: 1,
              marginBottom: '3px',
            }}
          >
            AGENTIC AI OVERRIDE
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: isTyping ? '#FF9500' : '#00D4FF',
              transition: 'color 0.35s ease',
            }}
          >
            {isTyping ? 'processing...' : 'Terminal Session'}
          </div>
        </div>

        <div
          style={{
            background: stateBg,
            border: `1px solid ${stateColor}28`,
            borderRadius: '5px',
            padding: '2px 8px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: stateColor,
            letterSpacing: '0.07em',
            flexShrink: 0,
            transition: 'all 1.5s ease',
          }}
        >
          {gridState.toUpperCase()}
        </div>
      </div>

      {/* Messages with scroll fade masks */}
      <div className="relative flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <div
          className="absolute top-0 left-0 right-0 h-5 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to bottom, #121212, transparent)' }}
        />
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-3 py-3 flex flex-col gap-2"
          style={{ maxHeight: '200px' }}
        >
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animation: `fade-rise 0.22s ease-out ${Math.min(idx, 3) * 70}ms both` }}
            >
              <div
                className="max-w-xs rounded-2xl px-3 py-2.5"
                style={
                  msg.role === 'user'
                    ? {
                        background: '#1A1A1C',
                        color: '#F0F0F5',
                        borderBottomRightRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }
                    : {
                        background: 'rgba(0,212,255,0.06)',
                        border: `1px solid ${isTyping && idx === messages.length - 1 ? 'rgba(0,212,255,0.0)' : 'rgba(0,212,255,0.18)'}`,
                        color: '#E0E0E8',
                        borderBottomLeftRadius: '6px',
                      }
                }
              >
                <p style={{ fontSize: '12px', lineHeight: '1.55', whiteSpace: 'pre-line', fontFamily: "'Inter',sans-serif" }}>
                  {msg.text}
                </p>
                <p style={{ fontSize: '9px', color: '#8E8E93', marginTop: '4px', fontFamily: "'JetBrains Mono',monospace" }}>
                  {msg.ts}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start" style={{ animation: 'fade-rise 0.2s ease-out both' }}>
              <div
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl"
                style={{
                  background: 'rgba(0,212,255,0.06)',
                  borderBottomLeftRadius: '6px',
                  animation: 'thinking-pulse 1.4s ease-in-out infinite',
                  border: '1px solid rgba(0,212,255,0.35)',
                }}
              >
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: '6px',
                      height: '6px',
                      background: '#00D4FF',
                      animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-5 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, #121212, transparent)' }}
        />
      </div>

      {/* Input bar */}
      <div className="px-3 pb-3 pt-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div
          className="flex items-center gap-2 rounded-full px-4 py-2"
          style={{
            backdropFilter: 'blur(20px)',
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Command the grid agent..."
            className="flex-1 bg-transparent outline-none"
            style={{
              color: '#F5F5F7',
              fontFamily: "'Inter',sans-serif",
              fontSize: '12px',
            }}
          />
          <button
            onClick={send}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            disabled={!hasText || isTyping}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: hasText && !isTyping ? '#00D4FF' : 'rgba(255,255,255,0.06)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transform: btnHover && hasText && !isTyping ? 'scale(1.1)' : 'scale(1)',
              boxShadow: btnHover && hasText && !isTyping ? '0 0 16px rgba(0,212,255,0.45)' : 'none',
              transition: 'all 0.2s ease',
              cursor: hasText && !isTyping ? 'pointer' : 'default',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1.5 7 L12.5 7 M8.5 3 L12.5 7 L8.5 11"
                stroke={hasText && !isTyping ? '#06060A' : '#444'}
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
