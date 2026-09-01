import { useRef, useEffect } from 'react';
import type { GridState } from '../App';

interface Props {
  gridState: GridState;
}

interface Particle {
  isH: boolean;
  linePos: number;
  progress: number;
  speed: number;
}

const CELL = 60;
const BASE_OPACITY = 0.032;
const HOVER_BOOST = 0.072;
const PROXIMITY = 160;

export default function CircuitBackground({ gridState }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const stateRef = useRef(gridState);

  useEffect(() => {
    stateRef.current = gridState;
  }, [gridState]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouse);

    const particles: Particle[] = [];

    const initParticles = () => {
      particles.length = 0;
      const W = canvas.width;
      const H = canvas.height;
      for (let y = 0; y <= H; y += CELL) {
        const n = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < n; i++) {
          particles.push({
            isH: true,
            linePos: y,
            progress: Math.random(),
            speed: (0.00025 + Math.random() * 0.0004) * (Math.random() > 0.5 ? 1 : -1),
          });
        }
      }
      for (let x = 0; x <= W; x += CELL) {
        const n = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < n; i++) {
          particles.push({
            isH: false,
            linePos: x,
            progress: Math.random(),
            speed: (0.00025 + Math.random() * 0.0004) * (Math.random() > 0.5 ? 1 : -1),
          });
        }
      }
    };
    initParticles();

    let meshAngle = 0;
    let animId: number;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const { x: mx, y: my } = mouseRef.current;
      const gs = stateRef.current;

      ctx.clearRect(0, 0, W, H);

      // Grid lines
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += CELL) {
        const d = Math.abs(mx - x);
        const prox = Math.max(0, 1 - d / PROXIMITY);
        ctx.strokeStyle = `rgba(255,255,255,${BASE_OPACITY + prox * HOVER_BOOST})`;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += CELL) {
        const d = Math.abs(my - y);
        const prox = Math.max(0, 1 - d / PROXIMITY);
        ctx.strokeStyle = `rgba(255,255,255,${BASE_OPACITY + prox * HOVER_BOOST})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Particles
      const pRgb =
        gs === 'critical' ? '255,45,85' : gs === 'warning' ? '255,149,0' : '0,212,255';
      for (const p of particles) {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        if (p.progress < 0) p.progress = 1;

        const px = p.isH ? p.progress * W : p.linePos;
        const py = p.isH ? p.linePos : p.progress * H;

        const g = ctx.createRadialGradient(px, py, 0, px, py, 5);
        g.addColorStop(0, `rgba(${pRgb},0.65)`);
        g.addColorStop(1, `rgba(${pRgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Drifting radial gradient mesh (emerald + cyan, very low opacity)
      meshAngle += 0.0015;
      const g1 = ctx.createRadialGradient(
        W / 2 + Math.cos(meshAngle) * W * 0.28,
        H / 2 + Math.sin(meshAngle) * H * 0.22,
        0,
        W / 2 + Math.cos(meshAngle) * W * 0.28,
        H / 2 + Math.sin(meshAngle) * H * 0.22,
        W * 0.42
      );
      g1.addColorStop(0, 'rgba(0,255,156,0.012)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      const g2 = ctx.createRadialGradient(
        W / 2 + Math.cos(meshAngle + 2.1) * W * 0.32,
        H / 2 + Math.sin(meshAngle + 2.1) * H * 0.26,
        0,
        W / 2 + Math.cos(meshAngle + 2.1) * W * 0.32,
        H / 2 + Math.sin(meshAngle + 2.1) * H * 0.26,
        W * 0.38
      );
      g2.addColorStop(0, 'rgba(80,40,255,0.010)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}
