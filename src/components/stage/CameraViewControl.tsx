import React from 'react';
import { CameraViewport } from '../../types/flash';
import {
  Camera,
  Maximize,
  Move,
  Focus,
  RotateCcw,
  Check,
  Sliders,
  X,
  Target,
  Sparkles,
} from 'lucide-react';

interface CameraViewControlProps {
  viewport: CameraViewport;
  stageWidth: number;
  stageHeight: number;
  onUpdateViewport: (viewport: CameraViewport) => void;
  onApplyCameraFraming: () => void;
  onResetCameraFraming: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const CameraViewControl: React.FC<CameraViewControlProps> = ({
  viewport,
  stageWidth,
  stageHeight,
  onUpdateViewport,
  onApplyCameraFraming,
  onResetCameraFraming,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  // Preset framing ratios
  const applyPreset = (scale: number, offsetX: number = 0.5, offsetY: number = 0.5) => {
    const w = Math.round(stageWidth * scale);
    const h = Math.round(stageHeight * scale);
    const x = Math.round((stageWidth - w) * offsetX);
    const y = Math.round((stageHeight - h) * offsetY);

    onUpdateViewport({
      ...viewport,
      x,
      y,
      width: w,
      height: h,
    });
  };

  return (
    <div className="absolute top-12 right-4 z-40 w-80 bg-zinc-950/95 border border-zinc-800 hover:border-teal-500/40 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col text-zinc-200 text-xs">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-teal-400" />
          <span className="font-semibold text-zinc-100">Vista de Cámara / Viewport</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:text-white text-zinc-400 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3.5 space-y-3.5">
        {/* Active Toggle & Auto-Encuadre */}
        <div className="flex items-center justify-between bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
          <div>
            <div className="font-semibold text-zinc-200">Encuadre de Cámara</div>
            <div className="text-[10px] text-zinc-400">
              {viewport.active ? 'Cámara activa (auto-zoom)' : 'Vista completa del escenario'}
            </div>
          </div>
          <button
            onClick={() => {
              if (viewport.active) {
                onResetCameraFraming();
              } else {
                onApplyCameraFraming();
              }
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition ${
              viewport.active
                ? 'bg-teal-500 text-zinc-950 shadow-md shadow-teal-500/20'
                : 'bg-zinc-800 hover:bg-zinc-700 text-teal-300 border border-teal-500/30'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{viewport.active ? 'Activada' : 'Activar'}</span>
          </button>
        </div>

        {/* Visual Edit Handles Toggle on Canvas */}
        <div className="flex items-center justify-between text-[11px] bg-zinc-900/50 px-2.5 py-1.5 rounded border border-zinc-800/80">
          <span className="text-zinc-300">Mostrar guías y marco en canvas:</span>
          <button
            onClick={() =>
              onUpdateViewport({ ...viewport, isEditing: !viewport.isEditing })
            }
            className={`px-2 py-0.5 rounded font-mono text-[10px] transition ${
              viewport.isEditing
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {viewport.isEditing ? 'EDITANDO' : 'OCULTO'}
          </button>
        </div>

        {/* Presets */}
        <div>
          <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1.5 tracking-wider">
            Planos de Cámara (Presets)
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              onClick={() => {
                applyPreset(1.0);
                if (viewport.active) setTimeout(onApplyCameraFraming, 50);
              }}
              className="px-2 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left hover:border-teal-500/40 transition"
            >
              <div className="font-medium text-zinc-200">Plano General</div>
              <div className="text-[10px] text-zinc-500">100% Escenario</div>
            </button>
            <button
              onClick={() => {
                applyPreset(0.75);
                if (viewport.active) setTimeout(onApplyCameraFraming, 50);
              }}
              className="px-2 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left hover:border-teal-500/40 transition"
            >
              <div className="font-medium text-zinc-200">Plano Tres Cuartos</div>
              <div className="text-[10px] text-zinc-500">75% Cobertura</div>
            </button>
            <button
              onClick={() => {
                applyPreset(0.5);
                if (viewport.active) setTimeout(onApplyCameraFraming, 50);
              }}
              className="px-2 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left hover:border-teal-500/40 transition"
            >
              <div className="font-medium text-zinc-200">Primer Plano</div>
              <div className="text-[10px] text-zinc-500">50% Close-up</div>
            </button>
            <button
              onClick={() => {
                applyPreset(0.3);
                if (viewport.active) setTimeout(onApplyCameraFraming, 50);
              }}
              className="px-2 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left hover:border-teal-500/40 transition"
            >
              <div className="font-medium text-zinc-200">Plano Detalle</div>
              <div className="text-[10px] text-zinc-500">30% Enfoque íntimo</div>
            </button>
          </div>
        </div>

        {/* Manual Dimensions */}
        <div className="space-y-1.5 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            <span>Área de Encuadre (px)</span>
            <span className="font-mono text-teal-400">
              {viewport.width} × {viewport.height}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">X:</label>
              <input
                type="number"
                value={viewport.x}
                onChange={(e) =>
                  onUpdateViewport({ ...viewport, x: Number(e.target.value) })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:border-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">Y:</label>
              <input
                type="number"
                value={viewport.y}
                onChange={(e) =>
                  onUpdateViewport({ ...viewport, y: Number(e.target.value) })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:border-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">Ancho:</label>
              <input
                type="number"
                value={viewport.width}
                onChange={(e) =>
                  onUpdateViewport({
                    ...viewport,
                    width: Math.max(50, Number(e.target.value)),
                  })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:border-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">Alto:</label>
              <input
                type="number"
                value={viewport.height}
                onChange={(e) =>
                  onUpdateViewport({
                    ...viewport,
                    height: Math.max(50, Number(e.target.value)),
                  })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:border-teal-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={onApplyCameraFraming}
          className="w-full py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm shadow-teal-500/20"
        >
          <Focus className="w-4 h-4" />
          <span>Centrar y Encuadrar Cámara</span>
        </button>
      </div>
    </div>
  );
};
