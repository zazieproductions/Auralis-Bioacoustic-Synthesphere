import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Ecosystem } from '../simulation/Ecosystem';
import { EcologyRenderer, ViewportCamera } from '../rendering/EcologyRenderer';
import { Organism } from '../types/ecosystem';
import { AudioVisualizer } from './AudioVisualizer';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  Sparkles,
  Volume2,
  Eye,
  EyeOff
} from 'lucide-react';

interface EcologyCanvasProps {
  ecosystem: Ecosystem;
  selectedOrganism: Organism | null;
  onSelectOrganism: (org: Organism | null) => void;
  audioStarted: boolean;
  onStartAudio: () => void;
}

export const EcologyCanvas: React.FC<EcologyCanvasProps> = ({
  ecosystem,
  selectedOrganism,
  onSelectOrganism,
  audioStarted,
  onStartAudio
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<EcologyRenderer | null>(null);

  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [showSensoryRings, setShowSensoryRings] = useState<boolean>(true);

  // Camera state
  const cameraRef = useRef<ViewportCamera>({
    x: ecosystem.worldWidth / 2,
    y: ecosystem.worldHeight / 2,
    zoom: 0.9,
    targetX: ecosystem.worldWidth / 2,
    targetY: ecosystem.worldHeight / 2,
    targetZoom: 0.9,
    followingId: null
  });

  // Dragging state
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggedOrganismRef = useRef<Organism | null>(null);

  // Initialize renderer and canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    rendererRef.current = new EcologyRenderer(canvas);

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main animation frame loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;

      // Update simulation physics
      ecosystem.update(dt);

      // Handle follow camera
      const camera = cameraRef.current;
      if (isFollowing && selectedOrganism && selectedOrganism.alive) {
        camera.targetX = selectedOrganism.x;
        camera.targetY = selectedOrganism.y;
      }

      // Render frame
      if (rendererRef.current) {
        rendererRef.current.render(
          ecosystem.organisms,
          ecosystem.foods,
          ecosystem.acousticSignals,
          ecosystem.habitat,
          camera,
          ecosystem.worldWidth,
          ecosystem.worldHeight,
          selectedOrganism,
          showSensoryRings
        );
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [ecosystem, selectedOrganism, isFollowing, showSensoryRings]);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const clientX = (screenX - rect.left) * dpr;
    const clientY = (screenY - rect.top) * dpr;

    const camera = cameraRef.current;
    const worldX = (clientX - canvas.width / 2) / camera.zoom + camera.x;
    const worldY = (clientY - canvas.height / 2) / camera.zoom + camera.y;
    return { x: worldX, y: worldY };
  }, []);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioStarted) {
      onStartAudio();
    }

    const { x, y } = screenToWorld(e.clientX, e.clientY);
    const clickedOrg = ecosystem.getOrganismAt(x, y);

    if (clickedOrg) {
      onSelectOrganism(clickedOrg);
      draggedOrganismRef.current = clickedOrg;
      clickedOrg.dragged = true;
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const camera = cameraRef.current;

    if (draggedOrganismRef.current) {
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      draggedOrganismRef.current.x = Math.max(20, Math.min(ecosystem.worldWidth - 20, x));
      draggedOrganismRef.current.y = Math.max(20, Math.min(ecosystem.worldHeight - 20, y));
      draggedOrganismRef.current.vx = 0;
      draggedOrganismRef.current.vy = 0;
    } else if (isDraggingRef.current) {
      const dx = (e.clientX - dragStartRef.current.x) * (window.devicePixelRatio || 1);
      const dy = (e.clientY - dragStartRef.current.y) * (window.devicePixelRatio || 1);
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      camera.targetX -= dx / camera.zoom;
      camera.targetY -= dy / camera.zoom;
      camera.x = camera.targetX;
      camera.y = camera.targetY;
      setIsFollowing(false);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedOrganismRef.current) {
      draggedOrganismRef.current.dragged = false;
      draggedOrganismRef.current = null;
    } else if (isDraggingRef.current) {
      isDraggingRef.current = false;
    } else {
      // Check if it was a quick click on empty fluid space -> spawn food particle
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      const clickedOrg = ecosystem.getOrganismAt(x, y);
      if (!clickedOrg) {
        ecosystem.spawnFoodParticle(x, y);
      }
    }
  };

  // Zoom Handler
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const camera = cameraRef.current;
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    camera.targetZoom = Math.max(0.35, Math.min(2.5, camera.targetZoom * factor));
  };

  const handleZoomIn = () => {
    const camera = cameraRef.current;
    camera.targetZoom = Math.min(2.5, camera.targetZoom * 1.3);
  };

  const handleZoomOut = () => {
    const camera = cameraRef.current;
    camera.targetZoom = Math.max(0.35, camera.targetZoom * 0.77);
  };

  const handleCenter = () => {
    const camera = cameraRef.current;
    camera.targetX = ecosystem.worldWidth / 2;
    camera.targetY = ecosystem.worldHeight / 2;
    camera.targetZoom = 0.9;
    setIsFollowing(false);
  };

  const handleSpawnFoodBloom = () => {
    const camera = cameraRef.current;
    for (let i = 0; i < 12; i++) {
      ecosystem.spawnFoodParticle(
        camera.x + (Math.random() * 200 - 100),
        camera.y + (Math.random() * 200 - 100)
      );
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-950">
      {/* 2D Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Audio Autoplay Unlock Banner (if not yet started) */}
      {!audioStarted && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
          <button
            onClick={onStartAudio}
            className="flex flex-col items-center gap-3 p-6 glass-panel rounded-2xl border border-sky-500/40 text-slate-100 hover:border-sky-400 shadow-2xl transition transform hover:scale-105 group"
          >
            <div className="w-16 h-16 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-300 group-hover:bg-sky-500/30 transition shadow-[0_0_20px_#38bdf8]">
              <Volume2 size={32} className="animate-pulse" />
            </div>
            <div className="text-center font-mono-sci">
              <span className="font-sci-head font-bold text-lg text-sky-300 block">
                INITIALIZE ACOUSTIC SYNTHESIS
              </span>
              <span className="text-xs text-slate-400 mt-1 block">
                Click anywhere to activate browser Web Audio engine & begin simulation
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Bottom Left: Master Audio Visualizer & Environmental HUD */}
      <div className="absolute left-4 bottom-4 z-20 flex flex-col gap-2 font-mono-sci text-xs">
        <div className="glass-panel p-2 rounded-xl flex items-center gap-3 shadow-lg">
          <AudioVisualizer
            mode="spectrum"
            accentColor={ecosystem.habitat.accentColor}
            width={140}
            height={32}
          />
          <div className="text-[10px] text-slate-400 flex flex-col">
            <span className="text-slate-200 font-bold">SYNTHESIS SPECTRUM</span>
            <span>{ecosystem.organisms.length} Living Voices</span>
          </div>
        </div>
      </div>

      {/* Bottom Right: Viewport Camera Controls */}
      <div className="absolute right-4 bottom-4 z-20 flex items-center gap-1.5 glass-panel p-1.5 rounded-xl shadow-lg font-mono-sci text-xs">
        <button
          onClick={() => setShowSensoryRings(!showSensoryRings)}
          className={`p-2 rounded-lg transition ${
            showSensoryRings ? 'text-sky-400 bg-slate-900' : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle Sensory & Acoustic Indicators"
        >
          {showSensoryRings ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>

        <button
          onClick={() => setIsFollowing(!isFollowing)}
          disabled={!selectedOrganism}
          className={`p-2 rounded-lg transition ${
            isFollowing && selectedOrganism
              ? 'text-amber-300 bg-amber-950/80 border border-amber-500/50'
              : 'text-slate-400 hover:text-white disabled:opacity-30'
          }`}
          title="Track Selected Specimen"
        >
          <Crosshair size={15} />
        </button>

        <button
          onClick={handleSpawnFoodBloom}
          className="p-2 text-emerald-400 hover:bg-slate-900 rounded-lg transition"
          title="Seed Spore Bloom (Nutrient Cluster)"
        >
          <Sparkles size={15} />
        </button>

        <div className="w-[1px] h-5 bg-slate-800 mx-1" />

        <button
          onClick={handleZoomIn}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition"
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>

        <button
          onClick={handleZoomOut}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition"
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>

        <button
          onClick={handleCenter}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition"
          title="Recenter Petri View"
        >
          <Maximize2 size={15} />
        </button>
      </div>
    </div>
  );
};
