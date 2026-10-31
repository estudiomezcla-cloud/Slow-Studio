import React, { useState, useEffect, useRef } from 'react';
import { FlashElement, Keyframe, Layer, MotionPathData, MotionPathPoint } from '../../types/flash';
import {
  ActiveTweenSegment,
  applyMotionPathPreset,
  createDefaultMotionPath,
  findActiveMotionTweenSegment,
} from '../../utils/motionPathUtils';
import { playButtonClick } from '../../utils/audio';
import {
  X,
  Minus,
  Maximize2,
  Spline,
  GitCommit,
  RotateCw,
  ArrowRightLeft,
  Sliders,
  Check,
  Compass,
  Eye,
  Sparkles,
  GripHorizontal,
  Play,
  RotateCcw,
} from 'lucide-react';

interface MotionPathPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLayer: Layer | null;
  currentFrame: number;
  selectedElementId: string | null;
  onUpdateKeyframe: (kfUpdates: Partial<Keyframe>, kfFrame?: number) => void;
  onCreateMotionTween?: () => void;
  stageWidth: number;
  stageHeight: number;
}

export const MotionPathPanel: React.FC<MotionPathPanelProps> = ({
  isOpen,
  onClose,
  selectedLayer,
  currentFrame,
  selectedElementId,
  onUpdateKeyframe,
  onCreateMotionTween,
  stageWidth,
  stageHeight,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 70, y: 110 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 70,
    initY: 110,
  });

  // Window drag handlers
  const handleMouseDownHeader = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: position.x,
      initY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 340, dragStartRef.current.initX + dx));
      const newY = Math.max(40, Math.min(window.innerHeight - 100, dragStartRef.current.initY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Find active tween segment on selected layer
  const activeSegment: ActiveTweenSegment | null = findActiveMotionTweenSegment(
    selectedLayer,
    currentFrame,
    selectedElementId
  );

  const kfPrev = activeSegment?.kfPrev;
  const kfNext = activeSegment?.kfNext;
  const elPrev = activeSegment?.elPrev;
  const elNext = activeSegment?.elNext;
  const currentMotionPath = activeSegment?.motionPath;

  // Save changes to the active keyframe's motionPath
  const saveMotionPath = (updated: MotionPathData) => {
    if (!kfPrev || !elPrev) return;

    const existingPaths = kfPrev.motionPaths || {};
    const newPaths = {
      ...existingPaths,
      [elPrev.id]: updated,
    };

    onUpdateKeyframe(
      {
        motionPath: updated,
        motionPaths: newPaths,
      },
      kfPrev.frame
    );
  };

  const handleToggleEnabled = () => {
    if (!elPrev || !elNext) return;

    if (!currentMotionPath) {
      // Create initial arc
      const initial = createDefaultMotionPath(
        { x: elPrev.x, y: elPrev.y },
        { x: elNext.x, y: elNext.y },
        'quadratic',
        'arc'
      );
      saveMotionPath(initial);
    } else {
      saveMotionPath({
        ...currentMotionPath,
        enabled: !currentMotionPath.enabled,
      });
    }
    playButtonClick();
  };

  const handleSetType = (type: 'quadratic' | 'cubic') => {
    if (!elPrev || !elNext) return;
    const base = currentMotionPath || createDefaultMotionPath(
      { x: elPrev.x, y: elPrev.y },
      { x: elNext.x, y: elNext.y },
      type,
      'arc'
    );

    let cp2 = base.cp2;
    if (type === 'cubic' && !cp2) {
      cp2 = {
        x: Math.round(elPrev.x + (elNext.x - elPrev.x) * 0.67),
        y: Math.round(elPrev.y + (elNext.y - elPrev.y) * 0.67 - 60),
      };
    }

    saveMotionPath({
      ...base,
      type,
      cp2,
    });
    playButtonClick();
  };

  const handleApplyPreset = (preset: 'arc' | 's-curve' | 'loop' | 'wave' | 'bounce' | 'linear' | 'invert') => {
    if (!elPrev || !elNext) return;
    const p0 = { x: elPrev.x, y: elPrev.y };
    const pEnd = { x: elNext.x, y: elNext.y };

    const updated = applyMotionPathPreset(p0, pEnd, preset, currentMotionPath || undefined);
    saveMotionPath(updated);
    playButtonClick();
  };

  const handleUpdateCP1 = (axis: 'x' | 'y', val: number) => {
    if (!currentMotionPath) return;
    saveMotionPath({
      ...currentMotionPath,
      cp1: {
        ...currentMotionPath.cp1,
        [axis]: val,
      },
    });
  };

  const handleUpdateCP2 = (axis: 'x' | 'y', val: number) => {
    if (!currentMotionPath || !currentMotionPath.cp2) return;
    saveMotionPath({
      ...currentMotionPath,
      cp2: {
        ...currentMotionPath.cp2,
        [axis]: val,
      },
    });
  };

  const handleToggleAutoOrient = () => {
    if (!currentMotionPath) return;
    saveMotionPath({
      ...currentMotionPath,
      autoOrient: !currentMotionPath.autoOrient,
    });
    playButtonClick();
  };

  const handleToggleShowFrameTicks = () => {
    if (!currentMotionPath) return;
    saveMotionPath({
      ...currentMotionPath,
      showFrameTicks: !currentMotionPath.showFrameTicks,
    });
    playButtonClick();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-40 w-80 bg-zinc-950/95 backdrop-blur-md border border-teal-500/50 rounded-xl shadow-2xl text-xs text-zinc-200 select-none flex flex-col overflow-hidden animate-in fade-in duration-150"
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleMouseDownHeader}
        className="h-10 px-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between cursor-move text-zinc-200 font-semibold"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-3.5 h-3.5 text-zinc-500" />
          <Spline className="w-4 h-4 text-teal-400" />
          <span className="font-bold tracking-tight text-white">Motion Path</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/30">
            Bézier
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized((m) => !m)}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            title={isMinimized ? 'Restaurar panel' : 'Minimizar panel'}
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            title="Cerrar panel (M)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3 space-y-3 max-h-[75vh] overflow-y-auto">
          {/* Active Context Banner */}
          {activeSegment ? (
            <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Tramo de Interpolación:</span>
                <span className="font-mono text-teal-300 font-bold">
                  Frames {kfPrev?.frame} → {kfNext?.frame}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span className="truncate max-w-[150px]">
                  Elemento: {elPrev?.name || 'Forma'}
                </span>
                <span>{activeSegment.span} fotogramas</span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-zinc-900/60 border border-amber-500/30 text-amber-300 space-y-2">
              <p className="text-[11px] leading-relaxed">
                El fotograma actual ({currentFrame}) no forma parte de una Interpolación de Movimiento (Motion Tween).
              </p>
              {onCreateMotionTween && (
                <button
                  onClick={onCreateMotionTween}
                  className="w-full py-1.5 px-2 rounded bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-teal-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Crear Interpolación de Movimiento</span>
                </button>
              )}
            </div>
          )}

          {activeSegment && (
            <>
              {/* Enable / Disable Motion Path Switch */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/90 border border-zinc-800">
                <div>
                  <span className="font-bold text-zinc-200 block">Curva de Trayectoria</span>
                  <span className="text-[10px] text-zinc-500">
                    Modifica el trayecto recto en curva Bézier
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleEnabled}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    currentMotionPath?.enabled ? 'bg-teal-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      currentMotionPath?.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {currentMotionPath?.enabled && (
                <>
                  {/* Curve Type Selector (Quadratic vs Cubic) */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-zinc-400">
                      Tipo de Curvatura Bézier:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleSetType('quadratic')}
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition flex items-center justify-center gap-1.5 ${
                          currentMotionPath.type === 'quadratic'
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/60 font-bold'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        <GitCommit className="w-3.5 h-3.5" />
                        <span>Cuadrática (1 CP)</span>
                      </button>

                      <button
                        onClick={() => handleSetType('cubic')}
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition flex items-center justify-center gap-1.5 ${
                          currentMotionPath.type === 'cubic'
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/60 font-bold'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        <Spline className="w-3.5 h-3.5" />
                        <span>Cúbica (2 CP)</span>
                      </button>
                    </div>
                  </div>

                  {/* Curvature Preset Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-zinc-400">
                      Presets de Trayectoria:
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => handleApplyPreset('arc')}
                        className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-teal-500/40 text-[10px] text-zinc-300 transition text-center"
                        title="Arco curvado hacia arriba"
                      >
                        Arco Suave
                      </button>
                      <button
                        onClick={() => handleApplyPreset('s-curve')}
                        className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-teal-500/40 text-[10px] text-zinc-300 transition text-center"
                        title="Curva doble en forma de S"
                      >
                        Curva en S
                      </button>
                      <button
                        onClick={() => handleApplyPreset('loop')}
                        className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-teal-500/40 text-[10px] text-zinc-300 transition text-center"
                        title="Bucle circular en el aire"
                      >
                        Bucle (Loop)
                      </button>
                      <button
                        onClick={() => handleApplyPreset('bounce')}
                        className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-teal-500/40 text-[10px] text-zinc-300 transition text-center"
                        title="Rebote con caída parabólica"
                      >
                        Rebote
                      </button>
                      <button
                        onClick={() => handleApplyPreset('invert')}
                        className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-teal-500/40 text-[10px] text-zinc-300 transition text-center"
                        title="Invertir la orientación de los puntos de control"
                      >
                        Invertir Curva
                      </button>
                      <button
                        onClick={() => handleApplyPreset('linear')}
                        className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-teal-500/40 text-[10px] text-zinc-300 transition text-center"
                        title="Restablecer a trayectoria recta"
                      >
                        Línea Recta
                      </button>
                    </div>
                  </div>

                  {/* Manual Coordinates Control */}
                  <div className="space-y-2 bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5">
                    <span className="text-[11px] font-semibold text-teal-300 block">
                      Tiradores Bézier en Canvas (Arrastrables):
                    </span>

                    {/* CP1 Inputs */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1 font-mono text-teal-400 font-bold">
                          <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
                          <span>Punto de Control 1 (CP1)</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                        <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                          <span className="text-zinc-500">X:</span>
                          <input
                            type="number"
                            value={Math.round(currentMotionPath.cp1.x)}
                            onChange={(e) => handleUpdateCP1('x', Number(e.target.value))}
                            className="w-full bg-transparent text-right focus:outline-none text-zinc-200"
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                          <span className="text-zinc-500">Y:</span>
                          <input
                            type="number"
                            value={Math.round(currentMotionPath.cp1.y)}
                            onChange={(e) => handleUpdateCP1('y', Number(e.target.value))}
                            className="w-full bg-transparent text-right focus:outline-none text-zinc-200"
                          />
                        </div>
                      </div>
                    </div>

                    {/* CP2 Inputs if cubic */}
                    {currentMotionPath.type === 'cubic' && currentMotionPath.cp2 && (
                      <div className="space-y-1 pt-1 border-t border-zinc-800/60">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span className="flex items-center gap-1 font-mono text-cyan-400 font-bold">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                            <span>Punto de Control 2 (CP2)</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                          <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                            <span className="text-zinc-500">X:</span>
                            <input
                              type="number"
                              value={Math.round(currentMotionPath.cp2.x)}
                              onChange={(e) => handleUpdateCP2('x', Number(e.target.value))}
                              className="w-full bg-transparent text-right focus:outline-none text-zinc-200"
                            />
                          </div>
                          <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                            <span className="text-zinc-500">Y:</span>
                            <input
                              type="number"
                              value={Math.round(currentMotionPath.cp2.y)}
                              onChange={(e) => handleUpdateCP2('y', Number(e.target.value))}
                              className="w-full bg-transparent text-right focus:outline-none text-zinc-200"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Options: Auto-orient and Show Frame Ticks */}
                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Compass className="w-3.5 h-3.5 text-teal-400" />
                        <div>
                          <span className="font-semibold text-zinc-200 text-[11px] block">
                            Orientar según Trayectoria
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            Rota la figura automáticamente hacia la dirección tangente
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={currentMotionPath.autoOrient ?? false}
                        onChange={handleToggleAutoOrient}
                        className="rounded border-zinc-700 text-teal-500 focus:ring-teal-400/40 bg-zinc-950"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <div>
                          <span className="font-semibold text-zinc-200 text-[11px] block">
                            Puntos de Fotogramas (Ticks)
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            Muestra la aceleración/frenado a lo largo de la curva
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={currentMotionPath.showFrameTicks ?? true}
                        onChange={handleToggleShowFrameTicks}
                        className="rounded border-zinc-700 text-teal-500 focus:ring-teal-400/40 bg-zinc-950"
                      />
                    </label>
                  </div>

                  {/* Helpful Interaction Tip */}
                  <div className="p-2 rounded bg-teal-950/40 border border-teal-500/20 text-[10px] text-teal-200/90 leading-relaxed">
                    💡 <strong>Edición directa en Canvas:</strong> Haz clic y arrastra directamente los tiradores circulares <span className="text-teal-300 font-mono font-bold">CP1</span> y <span className="text-cyan-300 font-mono font-bold">CP2</span> en el escenario para curvar la animación en tiempo real.
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
