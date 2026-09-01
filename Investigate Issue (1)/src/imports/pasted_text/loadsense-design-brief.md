LoadSense — Smart Grid & AI Energy Monitoring Dashboard
Figma Agent Design Brief (v2 — Enhanced)
1. CONCEPT & MOOD

Design a premium, dark-mode enterprise dashboard called "LoadSense" — an AI-powered smart grid monitoring platform. The visual identity is "Apple meets Cyberpunk meets Tony Stark's HUD": the restraint and precision of Apple's design language fused with the glowing, kinetic energy of a cyberpunk interface. It should feel alive — like the grid itself is breathing, pulsing, and thinking in real time.

Emotional target: the user should feel like they're commanding a living power network, not reading a static report.

2. DESIGN SYSTEM
Color Palette
Token	Hex	Usage
bg-void	
#0A0A0B	Base canvas background
bg-charcoal	
#121212	Card/panel surfaces
bg-charcoal-2	
#1A1A1C	Elevated card surfaces
border-glass	rgba(255,255,255,0.08)	1px hairline borders
accent-emerald	
#00FF9C	Eco / healthy / positive states
accent-emerald-dim	rgba(0,255,156,0.15)	Emerald glow fields
accent-crimson	
#FF2D55	Alerts / overload / critical states
accent-crimson-dim	rgba(255,45,85,0.15)	Crimson glow fields
accent-cyan	
#00D4FF	AI / "thinking" / intelligence states
text-primary	
#F5F5F7	Primary text
text-secondary	
#8E8E93	Secondary/meta text

Add a dynamic accent system: the entire UI's ambient glow color shifts based on grid state (emerald when healthy, amber when moderate load, crimson when overloaded) — a subtle color-temperature shift across ambient lighting, not just isolated elements.

Typography
Display/Headers: SF Pro Display (or Inter Tight) — tight tracking, 600–700 weight
Body/Data: SF Pro Text (or Inter) — 400–500 weight
Numeric/Telemetry: A monospaced or tabular-figure font (SF Mono / JetBrains Mono) for all live-updating numbers so digits don't jitter/reflow as they change
Surface Treatment
Cards: 
#121212 base, 1px border-glass, 16–20px corner radius, soft inner shadow (inset 0 1px 0 rgba(255,255,255,0.04)) plus outer ambient drop shadow matching card's semantic color at 8–12% opacity
Glassmorphism tooltips/menus: backdrop-filter: blur(24px) saturate(180%), background rgba(18,18,18,0.6), 1px border rgba(255,255,255,0.12)
3. LAYOUT — ASYMMETRICAL BENTO GRID
Global Interactive Background (NEW)

Behind everything, render a living circuit-mesh background: a low-opacity animated grid of fine lines with traveling "energy pulse" particles that flow along the lines like current through a PCB trace, subtly reacting to cursor proximity (lines brighten within ~150px of the pointer, a soft magnetic-attraction feel). This should sit at ~4–6% opacity so it never competes with content — texture, not noise. Include a slow-drifting radial gradient mesh (emerald/cyan/violet, very low saturation) that shifts position over ~30s loops.

LEFT PANEL — 3D Interactive Canvas (65% width)
Radial gradient mesh background (deep violet-to-black, emerald undertone), subtly animated/drifting
Centerpiece: an interactive 3D-rendered smart extension board (rotatable via drag, gentle auto-rotate idle state at ~2°/sec when untouched)
Live current-flow visualization: animated glowing particles travel along the board's visible circuit traces from the wall input toward each active socket, speed proportional to load — this is the signature "wow" moment
MCB Overload Banner (top of panel): pill-shaped banner, crimson glow, slow pulsing box-shadow animation (0 0 20px → 0 0 40px breathing loop, ~1.5s cycle), subtle glass background, warning icon with a soft strobe/heartbeat rhythm rather than jarring blink
Floating glassmorphism tooltips: appear near each socket showing live wattage; entrance = fade + scale from 0.92→1 with slight upward drift (~250ms cubic-bezier ease-out); idle gentle float animation (±3px vertical, 4s loop) so they feel weightless
Socket click interaction: clicking a socket triggers a heavily-blurred glass dropdown (backdrop-blur 24px) listing connected appliances, with staggered fade+slide-in for each list item (60ms stagger delay, translateY 8px→0, opacity 0→1) and a satisfying spring-based scale-in for the container itself
Ambient particle dust / bokeh-light specks drifting slowly across the canvas depth field for atmosphere
RIGHT PANEL — Analytics & AI Bento Stack (35% width)

Card 1 — Total Load (Radial Gauge)

Large circular gauge, animated needle/arc sweep on load, gradient stroke transitioning emerald → amber → crimson around the arc based on value
Gauge fill animates with an elastic ease (slight overshoot then settle) whenever wattage updates — never a hard jump cut
Center numeric readout in tabular-figure font with subtle glow matching current zone color
Faint rotating tick-mark ring behind the gauge (very slow, ~60s rotation) for depth

Card 2 — Daily Cost

Bold ₹ figure, minimal chrome
Glowing emerald upward arrow with a subtle continuous "shimmer" sweep across it every few seconds
Sparkline mini-chart beneath the number that animates its line drawing in on load (stroke-dashoffset draw animation)

Card 3 — Carbon Footprint

3D-rendered leaf icon with soft ambient occlusion, gentle idle sway/rotation (±4°, 5s loop) as if stirred by air
"kg CO2" metric + animated horizontal progress bar for grid health, with a soft glow that travels along the bar's leading edge as it fills
Micro-interaction: hovering the leaf triggers a light bloom + slight scale-up (1.05x)

Card 4 — LoadSense Agent (AI Chat)

iMessage-style rounded bubbles, dark theme: user bubbles solid charcoal-2, AI bubbles with a subtle animated conic-gradient border in cyan that slowly rotates (~3s loop) while the AI is "thinking," settling to a static soft cyan outline once the message is complete
New messages animate in with fade + slight upward slide (200ms ease-out)
Typing indicator: three dots with staggered pulse/scale animation
Input bar: frosted glass background (backdrop-filter: blur(20px)), rounded pill shape, glowing cyan "Ask" button that pulses gently when the input has text, scales 1.05x with a soft glow bloom on hover
Subtle scroll-fade mask at top/bottom of chat history for polish
4. MOTION & MICRO-INTERACTION SYSTEM

Apply this consistently across every interactive element:

Interaction	Behavior
Button hover	Scale 1.0 → 1.05, 200ms cubic-bezier(0.4, 0, 0.2, 1), soft glow bloom appears
Button press	Scale to 0.97 briefly (tactile "click" feedback)
Card hover	Border brightens from 8%→16% opacity, ambient shadow intensifies slightly
Data update	Numbers use a quick roll/count-up animation rather than snapping instantly
Alert state entering	Crimson glow fades/breathes in over 400ms, not an abrupt appearance
Panel/modal open	Blur-in + scale from 0.95, spring easing (slight overshoot)
List items appearing	Staggered fade+slide, 40–60ms delay per item
Page/section load	Elements fade+rise in sequence (hero canvas first, then bento cards cascading top-to-bottom, ~80ms stagger)

Principle: nothing should ever appear or disappear instantly. Every state change is eased, and every "living data" element (gauge, particles, glows) should have a continuous idle animation so the dashboard never looks static, even when no user data has changed.

5. DELIVERABLE NOTES FOR THE FIGMA AGENT
Build as a responsive desktop-first layout (assume 1440px+ canvas), with the 65/35 split as auto-layout frames using percentage-based sizing
Use Figma variables for the full color/spacing token system above so states (healthy/warning/critical) can be swapped via variable modes
Where possible, use Smart Animate-compatible layer structuring so gauge sweeps, glow pulses, and staggered list reveals can be prototyped directly in Figma
Name layers semantically (e.g. card-total-load/gauge-arc, banner-mcb-overload/glow-pulse) so animation handoff to engineering is unambiguous
Include at least 3 states per key component: default, hover, and active/alert