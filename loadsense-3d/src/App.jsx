import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows, Environment, RoundedBox, CubicBezierLine, Sphere } from '@react-three/drei';
import { Zap, Leaf, AlertTriangle, Power, ShieldAlert } from 'lucide-react';
import * as THREE from 'three';

// --- INDIAN HOUSEHOLD APPLIANCES ---
const APPLIANCES = {
  Fan: { name: "Ceiling Fan", power: 75, type: "6A", color: "#e0e0e0" },
  TV: { name: "LED TV", power: 100, type: "6A", color: "#111" },
  Mixer: { name: "Mixer Grinder", power: 750, type: "6A", color: "#8b5cf6" },
  Iron: { name: "Iron Box", power: 1000, type: "16A", color: "#f97316" },
  AC: { name: "1.5 Ton AC", power: 1500, type: "16A", color: "#3b82f6" },
  Geyser: { name: "Water Heater", power: 2000, type: "16A", color: "#ef4444" }
};

// --- 3D SPARKS (For Arc Fault) ---
function Sparks({ active }) {
  const group = useRef();
  
  useFrame(({ clock }) => {
    if (active && group.current) {
      group.current.children.forEach((child, i) => {
        child.position.y += Math.sin(clock.elapsedTime * 20 + i) * 0.05;
        child.position.x += Math.cos(clock.elapsedTime * 25 + i) * 0.05;
        child.material.opacity = Math.random() > 0.5 ? 1 : 0;
      });
    }
  });

  if (!active) return null;

  return (
    <group ref={group} position={[0, 0.4, 0]}>
      {[...Array(8)].map((_, i) => (
        <Sphere key={i} args={[0.03, 8, 8]} position={[(Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5, 0]}>
          <meshBasicMaterial color={i % 2 === 0 ? "#fbbf24" : "#ef4444"} transparent opacity={0.8} />
        </Sphere>
      ))}
      <pointLight color="#ef4444" intensity={5} distance={2} />
    </group>
  );
}

// --- 3D PLUG COMPONENT ---
function Plug({ type, color, isTripped, hasFault }) {
  const isHeavy = type === "16A";
  const plugSize = isHeavy ? [0.6, 0.4, 0.6] : [0.4, 0.3, 0.4];
  const wireThickness = isHeavy ? 0.08 : 0.04;
  
  return (
    <group position={[0, 0.3, 0]}>
      {/* Plug Head */}
      <RoundedBox args={plugSize} radius={0.05} smoothness={4} position={[0, 0, 0]}>
        <meshPhysicalMaterial color={isTripped ? "#333" : color} roughness={0.4} clearcoat={0.5} />
      </RoundedBox>
      
      {/* Trailing Wire */}
      <CubicBezierLine 
        start={[0, 0.2, 0]} 
        end={[0, -2, -3]} 
        midA={[0, 1, -1]} 
        midB={[0, 0, -2]} 
        color={isTripped ? "#222" : "#111"} 
        lineWidth={wireThickness * 100} 
      />
      
      {/* Arc Fault Simulation Sparks */}
      <Sparks active={hasFault} />
    </group>
  );
}

// --- 3D SOCKET COMPONENT ---
function SocketSlot({ id, position, applianceKey, onSelect, onRemove, isTripped, faultSocketId }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isEmpty = !applianceKey;
  const hasFault = faultSocketId === id && !isEmpty;

  const handleClick = (e) => {
    e.stopPropagation();
    if (isEmpty) setMenuOpen(!menuOpen);
    else onRemove();
  };

  return (
    <group position={position}>
      <mesh position={[0, 0.01, 0]} onClick={handleClick}>
        <cylinderGeometry args={[0.4, 0.4, 0.05, 32]} />
        <meshStandardMaterial color={hasFault ? "#450a0a" : "#1a1a1a"} roughness={0.8} />
      </mesh>

      {!isEmpty && (
        <Plug 
          type={APPLIANCES[applianceKey].type} 
          color={APPLIANCES[applianceKey].color} 
          isTripped={isTripped}
          hasFault={hasFault}
        />
      )}

      {menuOpen && isEmpty && (
        <Html position={[0, 1, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-700 p-3 rounded-xl shadow-2xl w-48 animate-in fade-in zoom-in duration-200">
            <h4 className="text-gray-300 text-xs font-bold mb-2 uppercase tracking-wider">Select Appliance</h4>
            <div className="space-y-1">
              {Object.entries(APPLIANCES).map(([key, data]) => (
                <button
                  key={key}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-white hover:bg-blue-600 transition flex justify-between items-center"
                  onClick={(e) => { e.stopPropagation(); onSelect(key); setMenuOpen(false); }}
                >
                  <span>{data.name}</span>
                  <span className="text-gray-400 text-xs">{data.power}W</span>
                </button>
              ))}
            </div>
          </div>
        </Html>
      )}

      {!isEmpty && !isTripped && !hasFault && (
        <Html position={[0, 1.2, 0]} center className="opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold pointer-events-none shadow-lg">
            Click to Unplug
          </div>
        </Html>
      )}
    </group>
  );
}

// --- 3D EXTENSION BOARD ---
function ExtensionBoard({ sockets, setSockets, isTripped, faultSocketId }) {
  return (
    <group position={[0, -0.5, 0]}>
      <RoundedBox args={[6.5, 0.3, 1.8]} radius={0.15} smoothness={4}>
        <meshPhysicalMaterial color="#f8fafc" roughness={0.1} metalness={0.0} clearcoat={1.0} />
      </RoundedBox>

      <group position={[-2.7, 0.15, 0]}>
        <RoundedBox args={[0.3, 0.1, 0.6]} radius={0.05}>
          <meshStandardMaterial 
            color={isTripped ? "#333" : "#ef4444"} 
            emissive={isTripped ? "#000" : "#ef4444"} 
            emissiveIntensity={isTripped ? 0 : 2} 
          />
        </RoundedBox>
      </group>

      <CubicBezierLine 
        start={[-3.25, 0, 0]} 
        end={[-8, -3, 2]} 
        midA={[-5, 0, 0]} 
        midB={[-6, -3, 0]} 
        color="#222" 
        lineWidth={15} 
      />

      {[0, 1, 2, 3].map((i) => (
        <SocketSlot 
          key={i} 
          id={i}
          position={[-1.5 + (i * 1.3), 0.15, 0]} 
          applianceKey={sockets[i]}
          isTripped={isTripped}
          faultSocketId={faultSocketId}
          onSelect={(appKey) => {
            const newSockets = [...sockets];
            newSockets[i] = appKey;
            setSockets(newSockets);
          }}
          onRemove={() => {
            const newSockets = [...sockets];
            newSockets[i] = null;
            setSockets(newSockets);
          }}
        />
      ))}
    </group>
  );
}

// --- MAIN APPLICATION ---
function App() {
  const [sockets, setSockets] = useState([null, null, null, null]);
  const [chatLog, setChatLog] = useState([{ role: "ai", text: "Namaste! I am the LoadSense Predictive Maintenance AI. Plug appliances in to monitor them." }]);
  const [inputText, setInputText] = useState("");
  const [faultActive, setFaultActive] = useState(false);
  const [faultSocketId, setFaultSocketId] = useState(null);

  const totalPower = sockets.reduce((acc, curr) => acc + (curr ? APPLIANCES[curr].power : 0), 0);
  const isTripped = totalPower > 3000 || faultActive; 
  const dailyUnits = (totalPower / 1000) * 8; 
  const dailyCost = dailyUnits * 8.0; 
  const carbon = dailyUnits * 0.82; 

  const simulateFault = () => {
    // Find a plugged-in socket to fault
    const activeSockets = sockets.map((s, i) => s ? i : -1).filter(i => i !== -1);
    if (activeSockets.length === 0) {
      alert("Please plug in at least one appliance first to simulate a fault.");
      return;
    }
    const targetId = activeSockets[Math.floor(Math.random() * activeSockets.length)];
    setFaultSocketId(targetId);
    setFaultActive(true);
    
    setChatLog(prev => [...prev, { 
      role: "ai", 
      text: `🚨 CRITICAL ALERT: Series Arc Fault detected on Socket ${targetId + 1} (${APPLIANCES[sockets[targetId]].name}). Autoencoder Reconstruction Error spiked past 400%. The mathematical V-I trajectory is severely degraded. I have virtually cut power to prevent an electrical fire!` 
    }]);
  };

  const resetGrid = () => {
    setFaultActive(false);
    setFaultSocketId(null);
    setChatLog(prev => [...prev, { role: "ai", text: "Grid reset successful. Monitoring restored." }]);
  };

  const handleChat = (e) => {
    e.preventDefault();
    if (!inputText) return;
    const userMsg = inputText;
    setInputText("");
    
    let aiResponse = "";
    if (faultActive) aiResponse = "The grid is currently locked out due to a severe Arc Fault detected by the Autoencoder. Please click 'Reset Grid' after inspecting the wiring.";
    else if (totalPower === 0) aiResponse = "Grid is healthy and offline. Zero units consumed.";
    else aiResponse = `Grid is healthy. The Autoencoder reconstruction error is at a stable 0.012 MSE. If you run this load for 8 hours, it will cost ₹${dailyCost.toFixed(2)}.`;
    
    setChatLog([...chatLog, { role: "user", text: userMsg }, { role: "ai", text: aiResponse }]);
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-white font-sans overflow-hidden">
      
      {/* LEFT: 3D CANVAS */}
      <div className="w-2/3 h-full relative">
        <div className="absolute top-6 left-6 z-10 bg-neutral-900/80 p-5 rounded-2xl backdrop-blur-lg border border-neutral-700 shadow-2xl">
           <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Zap className={faultActive ? "text-red-500 animate-pulse w-8 h-8" : "text-yellow-400 w-8 h-8"}/> 
              LoadSense AI 
           </h1>
           <p className="text-gray-400 text-sm mt-1">Predictive Maintenance Sandbox</p>
           
           <div className="mt-4 flex gap-3">
             <button 
               onClick={simulateFault}
               disabled={faultActive || totalPower === 0}
               className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition flex items-center gap-2"
             >
               <ShieldAlert size={18} /> Inject Arc Fault
             </button>
             {faultActive && (
               <button onClick={resetGrid} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition">
                 Reset Grid
               </button>
             )}
           </div>

           {isTripped && !faultActive && (
             <div className="mt-4 bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded-lg flex items-center gap-2 animate-pulse font-bold">
               <AlertTriangle /> MCB TRIPPED - OVERLOAD (>3000W)
             </div>
           )}
           
           {faultActive && (
             <div className="mt-4 bg-red-900/80 border border-red-500 text-white px-4 py-3 rounded-lg flex items-center gap-2 animate-pulse font-bold shadow-[0_0_20px_rgba(239,68,68,0.5)]">
               <AlertTriangle /> CRITICAL: ARC FAULT DETECTED!
             </div>
           )}
        </div>
        
        <Canvas camera={{ position: [0, 6, 8], fov: 40 }}>
          <ambientLight intensity={faultActive ? 0.2 : 0.6} />
          <directionalLight position={[5, 10, 5]} intensity={faultActive ? 0.5 : 1.5} castShadow />
          <Environment preset="apartment" />
          <ExtensionBoard sockets={sockets} setSockets={setSockets} isTripped={isTripped} faultSocketId={faultSocketId} />
          <ContactShadows position={[0, -0.65, 0]} opacity={0.6} scale={15} blur={2.5} far={2} />
          <OrbitControls enableZoom={false} maxPolarAngle={Math.PI/2.2} minPolarAngle={0} />
        </Canvas>
      </div>

      {/* RIGHT: DASHBOARD & CHAT */}
      <div className="w-1/3 h-full bg-neutral-900 p-6 flex flex-col border-l border-neutral-800 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-20">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-100">
          <Power className="text-blue-400"/> AI Anomaly Metrics
        </h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-xl border transition-colors duration-300 ${faultActive ? 'bg-red-900/30 border-red-500' : 'bg-neutral-800 border-neutral-700'}`}>
             <div className="text-gray-400 text-sm font-semibold">Autoencoder Error</div>
             <div className={`text-4xl font-black mt-2 tracking-tight ${faultActive ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
               {faultActive ? "412%" : "0.01"} <span className="text-lg font-normal">MSE</span>
             </div>
          </div>
          <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700">
             <div className="text-gray-400 text-sm font-semibold">Grid Status</div>
             <div className={`text-2xl font-bold mt-2 tracking-tight ${faultActive ? 'text-red-500' : 'text-blue-400'}`}>
               {faultActive ? "LOCKED OUT" : "HEALTHY"}
             </div>
          </div>
        </div>

        <div className="flex-1 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col overflow-hidden shadow-inner">
           <div className="bg-neutral-900 p-3 font-bold border-b border-neutral-800 text-gray-300 flex items-center gap-2">
              🤖 Diagnostic Agent
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
             {chatLog.map((msg, i) => (
               <div key={i} className={`p-3 rounded-xl max-w-[90%] text-sm leading-relaxed shadow-md ${
                 msg.role === 'ai' 
                  ? (msg.text.includes('CRITICAL') ? 'bg-red-900/80 border-red-500 text-white' : 'bg-neutral-800 text-gray-200 border border-neutral-700 rounded-tl-none')
                  : 'bg-blue-600 text-white ml-auto rounded-tr-none'
               }`}>
                 {msg.text}
               </div>
             ))}
           </div>
           
           <form onSubmit={handleChat} className="p-3 bg-neutral-900 border-t border-neutral-800 flex gap-2">
             <input 
               type="text" 
               className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2 outline-none focus:border-blue-500 text-white placeholder-gray-600 transition-colors" 
               placeholder="Query the AI..."
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               disabled={faultActive}
             />
             <button type="submit" disabled={faultActive} className="bg-blue-600 px-5 py-2 rounded-lg font-bold hover:bg-blue-500 disabled:opacity-50 transition shadow-lg">
                Ask
             </button>
           </form>
        </div>

      </div>
    </div>
  );
}

export default App;
