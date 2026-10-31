import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraViewport, FlashSymbol, Layer } from '../../types/flash';
import { getLayerElementsAtFrame } from '../../utils/interpolation';
import { resolveCanvasFill } from '../../utils/colorUtils';
import {
  Play,
  Pause,
  RotateCcw,
  Minimize2,
  Maximize2,
  Tv,
  Camera,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MiniStageProps {
  layers: Layer[];
  symbols: FlashSymbol[];
  currentFrame: number;
  totalFrames: number;
  fps: number;
  width: number;
  height: number;
  backgroundColor: string;
  cameraViewport?: CameraViewport;
  onSelectFrame?: (frame: number) => void;
  mainIsPlaying: boolean;
}

export const MiniStage: React.FC<MiniStageProps> = ({
  layers,
  symbols,
  currentFrame,
  totalFrames,
  fps,
  width,
  height,
  backgroundColor,
  cameraViewport,
  onSelectFrame,
  mainIsPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [playbackMode, setPlaybackMode] = useState<'loop' | 'sync'>('loop');
  const [miniPlaying, setMiniPlaying] = useState<boolean>(true);
  const [miniFrame, setMiniFrame] = useState<number>(1);

  // When synced to main frame, follow currentFrame
  useEffect(() => {
    if (playbackMode === 'sync') {
      setMiniFrame(currentFrame);
    }
  }, [currentFrame, playbackMode]);

  // Independent loop playback timer
  useEffect(() => {
    if (playbackMode !== 'loop' || !miniPlaying) return;

    const intervalMs = 1000 / Math.max(1, fps);
    const timer = setInterval(() => {
      setMiniFrame((prev) => (prev >= totalFrames ? 1 : prev + 1));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [playbackMode, miniPlaying, fps, totalFrames]);

  // Canvas dimensions in mini stage
  const miniW = isExpanded ? 340 : 220;
  const miniH = Math.round((miniW / width) * height);

  // Render frame to mini canvas
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameToDraw = playbackMode === 'sync' ? currentFrame : miniFrame;

    // Background
    ctx.fillStyle = backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, miniW, miniH);

    const scale = miniW / width;
    ctx.save();
    ctx.scale(scale, scale);

    // Draw layers
    layers.forEach((layer) => {
      if (!layer.visible) return;
      const els = getLayerElementsAtFrame(layer, frameToDraw);
      els.forEach((el) => {
        if (el.opacity <= 0) return;
        ctx.save();
        ctx.globalAlpha = el.opacity ?? 1;

        if (el.filters) {
          const filterParts: string[] = [];
          if (el.filters.blur !== undefined && el.filters.blur > 0) {
            filterParts.push(`blur(${el.filters.blur}px)`);
          }
          if (el.filters.brightness !== undefined && el.filters.brightness !== 100) {
            filterParts.push(`brightness(${el.filters.brightness}%)`);
          }
          if (el.filters.contrast !== undefined && el.filters.contrast !== 100) {
            filterParts.push(`contrast(${el.filters.contrast}%)`);
          }
          if (filterParts.length > 0) {
            ctx.filter = filterParts.join(' ');
          }

          if (el.filters.dropShadow?.enabled) {
            ctx.shadowColor = el.filters.dropShadow.color || 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = el.filters.dropShadow.blur ?? 8;
            ctx.shadowOffsetX = el.filters.dropShadow.offsetX ?? 4;
            ctx.shadowOffsetY = el.filters.dropShadow.offsetY ?? 4;
          }
        }

        const cx = el.shapeType === 'circle' ? el.x : el.x + el.width / 2;
        const cy = el.shapeType === 'circle' ? el.y : el.y + el.height / 2;
        ctx.translate(cx, cy);
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.scale(el.scaleX ?? 1, el.scaleY ?? 1);
        ctx.translate(-cx, -cy);

        ctx.fillStyle = resolveCanvasFill(ctx, el.fill || '#14b8a6', el);
        ctx.strokeStyle = resolveCanvasFill(ctx, el.stroke || '#0d9488', el);
        ctx.lineWidth = el.strokeWidth || 1;

        if (el.shapeType === 'rect') {
          ctx.fillRect(el.x, el.y, el.width, el.height);
          if (el.strokeWidth > 0 && el.stroke !== 'transparent') {
            ctx.strokeRect(el.x, el.y, el.width, el.height);
          }
        } else if (el.shapeType === 'circle') {
          ctx.beginPath();
          ctx.ellipse(
            el.x,
            el.y,
            Math.abs(el.width / 2),
            Math.abs(el.height / 2),
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
          if (el.strokeWidth > 0 && el.stroke !== 'transparent') ctx.stroke();
        } else if (el.type === 'text') {
          ctx.font = `${el.fontSize || 32}px sans-serif`;
          ctx.fillText(el.text || '', el.x, el.y + (el.fontSize || 32));
        } else if (el.points && el.points.length > 0) {
          ctx.beginPath();
          el.points.forEach((pt, i) => {
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          if (el.fill && el.fill !== 'transparent') ctx.fill();
          if (el.strokeWidth > 0 && el.stroke !== 'transparent') ctx.stroke();
        }

        ctx.restore();
      });
    });

    // If Camera Viewport is active, draw the camera viewport box in the mini stage
    if (cameraViewport && cameraViewport.active) {
      ctx.save();
      ctx.strokeStyle = '#2dd4bf'; // Verde agua bright
      ctx.lineWidth = 3 / scale;
      ctx.setLineDash([6 / scale, 4 / scale]);
      ctx.strokeRect(
        cameraViewport.x,
        cameraViewport.y,
        cameraViewport.width,
        cameraViewport.height
      );

      // Shaded outside letterbox
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, width, cameraViewport.y);
      ctx.fillRect(
        0,
        cameraViewport.y + cameraViewport.height,
        width,
        height - (cameraViewport.y + cameraViewport.height)
      );
      ctx.fillRect(
        0,
        cameraViewport.y,
        cameraViewport.x,
        cameraViewport.height
      );
      ctx.fillRect(
        cameraViewport.x + cameraViewport.width,
        cameraViewport.y,
        width - (cameraViewport.x + cameraViewport.width),
        cameraViewport.height
      );

      // Camera label
      ctx.setLineDash([]);
      ctx.fillStyle = '#2dd4bf';
      ctx.font = `bold ${Math.round(18 / scale)}px monospace`;
      ctx.fillText(
        'CAM',
        cameraViewport.x + 6 / scale,
        cameraViewport.y + 20 / scale
      );
      ctx.restore();
    }

    ctx.restore();
  }, [
    backgroundColor,
    cameraViewport,
    currentFrame,
    height,
    layers,
    miniFrame,
    miniH,
    miniW,
    playbackMode,
    width,
  ]);

  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  const activeDisplayFrame = playbackMode === 'sync' ? currentFrame : miniFrame;

  if (isMinimized) {
    return (
      <div className="absolute bottom-4 right-4 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-teal-400 border border-teal-500/40 shadow-xl backdrop-blur-md text-xs font-semibold transition"
          title="Abrir Vista Previa MiniStage"
        >
          <Tv className="w-3.5 h-3.5" />
          <span>MiniStage</span>
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse ml-0.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="absolute bottom-4 right-4 z-40 bg-zinc-950/90 border border-zinc-800 hover:border-teal-500/40 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col text-zinc-200 transition-all duration-150"
      style={{ width: `${miniW + 16}px` }}
    >
      {/* Header */}
      <div className="px-2.5 py-1.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-1.5">
          <Tv className="w-3.5 h-3.5 text-teal-400" />
          <span className="font-semibold text-[11px] text-zinc-100">MiniStage</span>
          <span className="text-[10px] font-mono text-zinc-500">
            F:{activeDisplayFrame}/{totalFrames}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded((e) => !e)}
            className="p-1 hover:text-teal-300 text-zinc-400 transition"
            title={isExpanded ? 'Reducir tamaño' : 'Ampliar tamaño'}
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:text-zinc-100 text-zinc-400 transition"
            title="Minimizar panel"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="p-2 bg-zinc-950 flex flex-col items-center justify-center">
        <div
          className="relative border border-zinc-800 rounded overflow-hidden shadow-inner cursor-pointer"
          style={{ width: `${miniW}px`, height: `${miniH}px` }}
          onClick={() => {
            if (onSelectFrame) onSelectFrame(activeDisplayFrame);
          }}
          title="Clic para sincronizar marco principal"
        >
          <canvas
            ref={canvasRef}
            width={miniW}
            height={miniH}
            className="block w-full h-full"
          />

          {cameraViewport?.active && (
            <div className="absolute top-1 right-1 px-1 py-0.5 rounded bg-teal-500/80 text-[8px] font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-0.5 pointer-events-none">
              <Camera className="w-2.5 h-2.5" />
              <span>CAM</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="px-2.5 py-1.5 bg-zinc-900/60 border-t border-zinc-800/80 flex items-center justify-between text-[10px] select-none">
        {/* Playback Mode Toggle */}
        <div className="flex items-center bg-zinc-950 p-0.5 rounded border border-zinc-800 text-[10px]">
          <button
            onClick={() => setPlaybackMode('loop')}
            className={`px-1.5 py-0.5 rounded transition ${
              playbackMode === 'loop'
                ? 'bg-teal-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Reproducción continua independiente de la animación completa"
          >
            Loop
          </button>
          <button
            onClick={() => setPlaybackMode('sync')}
            className={`px-1.5 py-0.5 rounded transition ${
              playbackMode === 'sync'
                ? 'bg-teal-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Sincronizado con el fotograma actual que estás editando"
          >
            Sync
          </button>
        </div>

        {/* Media Controls for Loop Mode */}
        {playbackMode === 'loop' ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMiniFrame(1)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              title="Reiniciar al fotograma 1"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              onClick={() => setMiniPlaying((p) => !p)}
              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-teal-300"
              title={miniPlaying ? 'Pausar loop' : 'Reanudar loop'}
            >
              {miniPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          </div>
        ) : (
          <span className="text-[10px] font-mono text-zinc-400">
            {width}×{height} • {fps} FPS
          </span>
        )}
      </div>
    </div>
  );
};
