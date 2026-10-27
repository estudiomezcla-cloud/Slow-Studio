import React, { useRef, useEffect } from 'react';
import { Layer, TweenType, EasingType } from '../../types/flash';
import { playKeyframeAdd, playTweenCreate } from '../../utils/audio';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Sparkles,
  ArrowRight,
  Code,
  Square,
} from 'lucide-react';

interface FlashTimelineProps {
  layers: Layer[];
  currentFrame: number;
  totalFrames: number;
  fps: number;
  isPlaying: boolean;
  isLooping: boolean;
  selectedLayerId: string;
  onSelectLayer: (id: string) => void;
  onSelectFrame: (frame: number) => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onStop: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onToggleLayerVisibility: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  onInsertKeyframe: (layerId: string, frame: number) => void;
  onInsertBlankKeyframe: (layerId: string, frame: number) => void;
  onClearKeyframe: (layerId: string, frame: number) => void;
  onSetTween: (layerId: string, frame: number, tween: TweenType, easing?: EasingType) => void;
  onOpenFramePrompt: (layerId: string, frame: number) => void;
  onOpenFrameActions: (layerId: string, frame: number) => void;
  onChangeFps: (fps: number) => void;
}

export const FlashTimeline: React.FC<FlashTimelineProps> = ({
  layers,
  currentFrame,
  totalFrames,
  fps,
  isPlaying,
  isLooping,
  selectedLayerId,
  onSelectLayer,
  onSelectFrame,
  onTogglePlay,
  onToggleLoop,
  onStop,
  onStepBack,
  onStepForward,
  onAddLayer,
  onDeleteLayer,
  onToggleLayerVisibility,
  onToggleLayerLock,
  onInsertKeyframe,
  onInsertBlankKeyframe,
  onClearKeyframe,
  onSetTween,
  onOpenFramePrompt,
  onOpenFrameActions,
  onChangeFps,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const frameWidth = 12;

  const currentTimeSec = ((currentFrame - 1) / fps).toFixed(2);

  useEffect(() => {
    if (rulerRef.current) {
      const scrollLeft = (currentFrame - 1) * frameWidth - 150;
      if (scrollLeft > 0 && Math.abs(rulerRef.current.scrollLeft - scrollLeft) > 100) {
        rulerRef.current.scrollLeft = scrollLeft;
      }
    }
  }, [currentFrame]);

  const handleFrameClick = (layerId: string, frame: number) => {
    onSelectLayer(layerId);
    onSelectFrame(frame);
  };

  return (
    <div className="h-56 bg-zinc-950 border-t border-zinc-800 flex flex-col select-none text-zinc-300">
      {/* Top Controls Toolbar */}
      <div className="h-9 px-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectFrame(1)}
            title="Ir al inicio (Enter)"
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onStepBack}
            title="Paso atrás (, o <)"
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onTogglePlay}
            title="Reproducir / Pausa (Espacio)"
            className={`px-3 py-1 rounded flex items-center gap-1.5 font-medium transition ${
              isPlaying
                ? 'bg-teal-500 text-zinc-950 shadow-md shadow-teal-500/20'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
          </button>
          <button
            onClick={onStop}
            title="Detener"
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
          <button
            onClick={onStepForward}
            title="Paso adelante (. o >)"
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleLoop}
            title="Bucle continuo"
            className={`p-1.5 rounded transition ${
              isLooping ? 'bg-zinc-800 text-teal-400 border border-teal-500/40' : 'hover:bg-zinc-800 text-zinc-500'
            }`}
          >
            <span className="font-mono text-[11px] font-bold">LOOP</span>
          </button>

          <div className="h-4 w-px bg-zinc-800 mx-1.5" />

          {/* Current Frame Counter */}
          <div className="flex items-center gap-1 font-mono bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 text-[11px]">
            <span className="text-teal-400 font-bold">{currentFrame}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">{totalFrames}</span>
            <span className="text-zinc-600 ml-1">({currentTimeSec}s)</span>
          </div>

          <div className="h-4 w-px bg-zinc-800 mx-1.5" />

          {/* FPS selector */}
          <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
            <span>FPS:</span>
            <select
              value={fps}
              onChange={(e) => onChangeFps(Number(e.target.value))}
              aria-label="Velocidad de fotogramas por segundo"
              className="bg-zinc-950 border border-zinc-800 text-teal-400 rounded px-1.5 py-0.5 text-[11px] focus:outline-none"
            >
              <option value={12}>12 fps</option>
              <option value={24}>24 fps (slow studio)</option>
              <option value={30}>30 fps</option>
              <option value={60}>60 fps</option>
              <option value={120}>120 fps</option>
            </select>
          </div>
        </div>

        {/* Right: Keyframe & Tween Buttons in Verde Agua */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onInsertKeyframe(selectedLayerId, currentFrame);
              playKeyframeAdd();
            }}
            title="Insertar Fotograma Clave (F6)"
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] flex items-center gap-1 text-zinc-200 transition"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
            <span>F6 Clave</span>
          </button>
          <button
            onClick={() => {
              onInsertBlankKeyframe(selectedLayerId, currentFrame);
              playKeyframeAdd();
            }}
            title="Insertar Fotograma Clave en Blanco (F7)"
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] flex items-center gap-1 text-zinc-200 transition"
          >
            <span className="w-2 h-2 rounded-full border border-teal-400 inline-block" />
            <span>F7 Vacío</span>
          </button>
          <button
            onClick={() => {
              onSetTween(selectedLayerId, currentFrame, 'motion');
              playTweenCreate();
            }}
            title="Crear Interpolación de Movimiento (Motion Tween - Flecha Celeste)"
            className="px-2 py-1 rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-800/60 text-[11px] flex items-center gap-1 text-sky-300 transition"
          >
            <ArrowRight className="w-3 h-3 text-sky-400" />
            <span>Tween Movimiento</span>
          </button>
          <button
            onClick={() => {
              onSetTween(selectedLayerId, currentFrame, 'shape');
              playTweenCreate();
            }}
            title="Crear Interpolación de Forma (Shape Tween - Flecha Verde Menta)"
            className="px-2 py-1 rounded bg-teal-950/80 hover:bg-teal-900 border border-teal-800/60 text-[11px] flex items-center gap-1 text-teal-300 transition"
          >
            <ArrowRight className="w-3 h-3 text-teal-400" />
            <span>Tween Forma</span>
          </button>
          <button
            onClick={() => onOpenFramePrompt(selectedLayerId, currentFrame)}
            title="Editar Prompt de IA en este Fotograma"
            className="px-2 py-1 rounded bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-[11px] flex items-center gap-1 text-teal-300 transition"
          >
            <Sparkles className="w-3 h-3 text-teal-400" />
            <span>Prompt Frame</span>
          </button>
          <button
            onClick={() => onOpenFrameActions(selectedLayerId, currentFrame)}
            title="Acciones de slow script de este frame (stop();, etc)"
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            <Code className="w-3.5 h-3.5 text-teal-400" />
          </button>
        </div>
      </div>

      {/* Main Timeline Workspace: Layers (Left) and Frame Matrix (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Layers Panel */}
        <div className="w-56 bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0">
          <div className="h-6 px-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
            <span>Capas (Layers)</span>
            <div className="flex items-center gap-1">
              <button
                onClick={onAddLayer}
                title="Añadir nueva capa"
                className="p-0.5 hover:text-teal-400 transition"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {layers.map((layer) => {
              const isSelected = layer.id === selectedLayerId;
              return (
                <div
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  className={`h-7 px-2.5 flex items-center justify-between border-b border-zinc-900 cursor-pointer text-xs transition ${
                    isSelected
                      ? 'bg-zinc-800/90 text-white font-medium border-l-2 border-l-teal-400'
                      : 'hover:bg-zinc-900/60 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: layer.color || '#14b8a6' }}
                    />
                    <span className="truncate">{layer.name}</span>
                  </div>

                  <div className="flex items-center gap-1 text-zinc-500">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLayerVisibility(layer.id);
                      }}
                      className="hover:text-zinc-200 p-0.5"
                    >
                      {layer.visible ? (
                        <Eye className="w-3 h-3 text-zinc-400" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-zinc-600" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLayerLock(layer.id);
                      }}
                      className="hover:text-zinc-200 p-0.5"
                    >
                      {layer.locked ? (
                        <Lock className="w-3 h-3 text-teal-400" />
                      ) : (
                        <Unlock className="w-3 h-3 text-zinc-600" />
                      )}
                    </button>
                    {layers.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLayer(layer.id);
                        }}
                        className="hover:text-red-400 p-0.5"
                        title="Eliminar capa"
                      >
                        <Trash2 className="w-3 h-3 text-zinc-600" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Frames Grid & Playhead Ruler */}
        <div ref={rulerRef} className="flex-1 overflow-x-auto overflow-y-hidden relative bg-zinc-950">
          {/* Playhead VERDE AGUA / TEAL Cursor Line (instead of red!) */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-30 transition-all duration-75 shadow-sm shadow-teal-500/50"
            style={{
              left: `${(currentFrame - 1) * frameWidth + frameWidth / 2}px`,
              width: '2px',
              backgroundColor: '#14b8a6', // VERDE AGUA
            }}
          >
            {/* Top Verde Agua playhead marker */}
            <div
              className="absolute -top-0 -translate-x-1/2 w-3.5 h-5 bg-teal-500 rounded-b shadow text-[9px] font-bold text-zinc-950 flex items-center justify-center font-mono pointer-events-auto cursor-ew-resize border border-teal-300/40"
              title={`Frame actual: ${currentFrame}`}
            >
              ▼
            </div>
          </div>

          {/* Frame Number Ruler */}
          <div
            className="h-6 bg-zinc-900 border-b border-zinc-800 flex items-end cursor-pointer"
            style={{ width: `${totalFrames * frameWidth}px` }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const frame = Math.max(1, Math.min(totalFrames, Math.floor(clickX / frameWidth) + 1));
              onSelectFrame(frame);
            }}
          >
            {Array.from({ length: totalFrames }).map((_, i) => {
              const frameNum = i + 1;
              const isMajor = frameNum === 1 || frameNum % 5 === 0;
              return (
                <div
                  key={frameNum}
                  className="h-full border-r border-zinc-800/50 flex flex-col justify-end items-center pb-0.5 text-[9px] font-mono text-zinc-500"
                  style={{ width: `${frameWidth}px` }}
                >
                  {isMajor && <span>{frameNum}</span>}
                </div>
              );
            })}
          </div>

          {/* Layer Tracks Matrix */}
          <div style={{ width: `${totalFrames * frameWidth}px` }}>
            {layers.map((layer) => {
              const isSelected = layer.id === selectedLayerId;
              return (
                <div
                  key={layer.id}
                  className={`h-7 border-b border-zinc-900 flex relative ${
                    isSelected ? 'bg-zinc-900/30' : ''
                  }`}
                >
                  {renderLayerFramesTrack(
                    layer,
                    totalFrames,
                    frameWidth,
                    currentFrame,
                    (f) => handleFrameClick(layer.id, f),
                    () => onInsertKeyframe(layer.id, currentFrame),
                    () => onClearKeyframe(layer.id, currentFrame)
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

function renderLayerFramesTrack(
  layer: Layer,
  totalFrames: number,
  frameWidth: number,
  currentFrame: number,
  onSelectFrame: (f: number) => void,
  onAddKeyframe: () => void,
  onClearKeyframe: () => void
) {
  const keyframesMap = new Map(layer.keyframes.map((kf) => [kf.frame, kf]));
  const sortedKeyframes = [...layer.keyframes].sort((a, b) => a.frame - b.frame);

  const getTweenSpanInfo = (frame: number) => {
    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
      const kf1 = sortedKeyframes[i];
      const kf2 = sortedKeyframes[i + 1];
      if (frame >= kf1.frame && frame <= kf2.frame && kf1.tweenType !== 'none') {
        return {
          tweenType: kf1.tweenType,
          isStart: frame === kf1.frame,
          isEnd: frame === kf2.frame,
          isMiddle: frame > kf1.frame && frame < kf2.frame,
        };
      }
    }
    return null;
  };

  return Array.from({ length: totalFrames }).map((_, i) => {
    const frameNum = i + 1;
    const kf = keyframesMap.get(frameNum);
    const tweenInfo = getTweenSpanInfo(frameNum);
    const isCurrent = frameNum === currentFrame;

    let cellBg = 'bg-transparent';

    if (tweenInfo) {
      if (tweenInfo.tweenType === 'motion') {
        cellBg = 'bg-sky-950/70 border-y border-sky-800/40 text-sky-300';
      } else if (tweenInfo.tweenType === 'shape') {
        cellBg = 'bg-teal-950/70 border-y border-teal-800/40 text-teal-300';
      }
    } else if (kf) {
      cellBg = 'bg-zinc-800/80';
    }

    return (
      <div
        key={frameNum}
        onClick={() => onSelectFrame(frameNum)}
        className={`h-full border-r border-zinc-800/40 flex items-center justify-center relative cursor-pointer group ${cellBg} ${
          isCurrent ? 'ring-1 ring-inset ring-teal-400/80' : ''
        }`}
        style={{ width: `${frameWidth}px` }}
        title={`Frame ${frameNum}${kf ? (kf.prompt ? ` • ${kf.prompt}` : ' • Keyframe') : ''}`}
      >
        {kf ? (
          <div className="relative flex items-center justify-center">
            {kf.elements.length > 0 ? (
              <span className="w-2 h-2 rounded-full bg-teal-300 shadow-sm" />
            ) : (
              <span className="w-2 h-2 rounded-full border border-teal-400 bg-zinc-900" />
            )}

            {kf.actions && (
              <span className="absolute -top-3 text-[8px] font-bold text-teal-300 font-mono">
                a
              </span>
            )}

            {kf.prompt && (
              <span className="absolute -bottom-3 text-[7px] text-teal-300">
                ✨
              </span>
            )}
          </div>
        ) : tweenInfo?.isMiddle ? (
          <div
            className={`w-full h-0.5 ${
              tweenInfo.tweenType === 'motion' ? 'bg-sky-400/80' : 'bg-teal-400/80'
            }`}
          />
        ) : tweenInfo?.isEnd ? (
          <div
            className={`w-0 h-0 border-t-2 border-t-transparent border-b-2 border-b-transparent border-l-4 ${
              tweenInfo.tweenType === 'motion' ? 'border-l-sky-300' : 'border-l-teal-300'
            }`}
          />
        ) : null}
      </div>
    );
  });
}
