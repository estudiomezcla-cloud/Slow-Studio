import React, { useState } from 'react';
import { EasingType, FlashElement, Keyframe, TweenType } from '../../types/flash';
import {
  Sliders,
  Sparkles,
  Code,
  Box,
  Layers,
  ArrowRight,
  Maximize,
  RotateCw,
  FolderPlus,
  Component,
  Scissors,
  Settings,
} from 'lucide-react';

interface PropertiesPanelProps {
  selectedElement: FlashElement | null;
  activeKeyframe: Keyframe | null;
  currentFrame: number;
  fps: number;
  width: number;
  height: number;
  backgroundColor: string;
  onUpdateElement: (el: FlashElement) => void;
  onUpdateKeyframe: (kf: Partial<Keyframe>) => void;
  onConvertToSymbol: (el: FlashElement, symbolType: 'movieclip' | 'button' | 'graphic') => void;
  onGroupSelected: () => void;
  onBreakApartSelected: () => void;
  onPromptGenerateForFrame: (frame: number, prompt: string) => void;
  onOpenProjectSettings: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  activeKeyframe,
  currentFrame,
  fps,
  width,
  height,
  backgroundColor,
  onUpdateElement,
  onUpdateKeyframe,
  onConvertToSymbol,
  onGroupSelected,
  onBreakApartSelected,
  onPromptGenerateForFrame,
  onOpenProjectSettings,
}) => {
  const [framePromptText, setFramePromptText] = useState(activeKeyframe?.prompt || '');
  const [actionsText, setActionsText] = useState(activeKeyframe?.actions || '');

  return (
    <div className="w-64 bg-zinc-950 border-l border-zinc-800 flex flex-col h-full text-xs text-zinc-300 select-none overflow-y-auto shrink-0">
      {/* Panel Header */}
      <div className="h-10 px-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between font-semibold text-zinc-200">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-teal-400" />
          <span>Propiedades</span>
        </div>
        <button
          onClick={onOpenProjectSettings}
          title="Configurar Escenario y Resolución"
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-teal-300 transition"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* Selected Element Section */}
        {selectedElement ? (
          <div className="space-y-3 pb-3 border-b border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-teal-400 flex items-center gap-1">
                <Box className="w-3.5 h-3.5" />
                <span className="truncate max-w-[130px]">{selectedElement.name || 'Elemento'}</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-teal-300 border border-teal-500/30 font-mono">
                {selectedElement.type}
              </span>
            </div>

            {/* Transform Coordinates X, Y, W, H */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                <span className="text-zinc-500">X:</span>
                <input
                  type="number"
                  value={Math.round(selectedElement.x)}
                  onChange={(e) => onUpdateElement({ ...selectedElement, x: Number(e.target.value) })}
                  className="w-full bg-transparent text-right focus:outline-none text-zinc-200"
                />
              </div>
              <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                <span className="text-zinc-500">Y:</span>
                <input
                  type="number"
                  value={Math.round(selectedElement.y)}
                  onChange={(e) => onUpdateElement({ ...selectedElement, y: Number(e.target.value) })}
                  className="w-full bg-transparent text-right focus:outline-none text-zinc-200"
                />
              </div>
              <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                <span className="text-zinc-500">Ancho:</span>
                <input
                  type="number"
                  value={Math.round(selectedElement.width)}
                  onChange={(e) =>
                    onUpdateElement({ ...selectedElement, width: Math.max(5, Number(e.target.value)) })
                  }
                  className="w-full bg-transparent text-right focus:outline-none text-zinc-200"
                />
              </div>
              <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                <span className="text-zinc-500">Alto:</span>
                <input
                  type="number"
                  value={Math.round(selectedElement.height)}
                  onChange={(e) =>
                    onUpdateElement({ ...selectedElement, height: Math.max(5, Number(e.target.value)) })
                  }
                  className="w-full bg-transparent text-right focus:outline-none text-zinc-200"
                />
              </div>
            </div>

            {/* Rotation and Opacity */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                <RotateCw className="w-3 h-3 text-zinc-500" />
                <input
                  type="number"
                  value={Math.round(selectedElement.rotation || 0)}
                  onChange={(e) =>
                    onUpdateElement({ ...selectedElement, rotation: Number(e.target.value) })
                  }
                  className="w-full bg-transparent text-right focus:outline-none text-zinc-200"
                />
                <span className="text-zinc-600">°</span>
              </div>
              <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                <span className="text-zinc-500">Opac:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={selectedElement.opacity ?? 1}
                  onChange={(e) =>
                    onUpdateElement({ ...selectedElement, opacity: Math.max(0, Math.min(1, Number(e.target.value))) })
                  }
                  className="w-full bg-transparent text-right focus:outline-none text-zinc-200"
                />
              </div>
            </div>

            {/* Vector Grouping & Break Apart Buttons (Flash Group Ctrl+G and Break Apart Ctrl+B) */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={onGroupSelected}
                title="Agrupar vectores (Ctrl+G)"
                className="py-1.5 px-2 rounded bg-zinc-900 hover:bg-zinc-850 text-teal-300 border border-teal-500/30 text-[10px] font-medium flex items-center justify-center gap-1 transition"
              >
                <Component className="w-3 h-3 text-teal-400" />
                <span>Agrupar (Ctrl+G)</span>
              </button>

              <button
                onClick={onBreakApartSelected}
                title="Separar / Desarmar en vectores simples (Ctrl+B)"
                className="py-1.5 px-2 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 hover:border-teal-500/30 text-[10px] font-medium flex items-center justify-center gap-1 transition"
              >
                <Scissors className="w-3 h-3 text-zinc-400" />
                <span>Separar (Ctrl+B)</span>
              </button>
            </div>

            {/* Convert to Symbol (F8) */}
            <button
              onClick={() => onConvertToSymbol(selectedElement, 'movieclip')}
              className="w-full py-1.5 px-2 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[11px] font-medium flex items-center justify-center gap-1.5 transition"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Convertir en Símbolo (F8)</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-4 text-zinc-600 text-xs">
            Ningún elemento seleccionado en el escenario
          </div>
        )}

        {/* Keyframe & Interpolation Section */}
        {activeKeyframe ? (
          <div className="space-y-3 pb-3 border-b border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" />
                <span>Fotograma {currentFrame}</span>
              </span>
              <span className="text-[10px] font-mono text-teal-400">Keyframe</span>
            </div>

            {/* Tween Type Selector */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">Interpolación (Tween):</label>
              <select
                value={activeKeyframe.tweenType}
                onChange={(e) => onUpdateKeyframe({ tweenType: e.target.value as TweenType })}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-teal-500"
              >
                <option value="none">Ninguna (Cuadro a Cuadro)</option>
                <option value="motion">Movimiento (Motion Tween - Celeste)</option>
                <option value="shape">Forma (Shape Tween - Verde Menta)</option>
              </select>
            </div>

            {/* Easing Selector */}
            {activeKeyframe.tweenType !== 'none' && (
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">Aceleración (Easing):</label>
                <select
                  value={activeKeyframe.easing || 'linear'}
                  onChange={(e) => onUpdateKeyframe({ easing: e.target.value as EasingType })}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-teal-500"
                >
                  <option value="linear">Lineal (Constante)</option>
                  <option value="easeIn">Ease In (Acelerado)</option>
                  <option value="easeOut">Ease Out (Frenado)</option>
                  <option value="easeInOut">Ease In Out (Suave)</option>
                  <option value="bounce">Bounce (Rebote)</option>
                </select>
              </div>
            )}

            {/* Frame AI Prompt Field */}
            <div className="space-y-1.5 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-1 text-[11px] text-teal-400 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Prompt de este Fotograma</span>
              </div>
              <textarea
                rows={2}
                value={framePromptText}
                onChange={(e) => setFramePromptText(e.target.value)}
                placeholder="Ej: pelota aplastada en el suelo con squash..."
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded p-1.5 text-[11px] focus:outline-none focus:border-teal-500 resize-none"
              />
              <button
                onClick={() => {
                  onUpdateKeyframe({ prompt: framePromptText });
                  if (framePromptText) {
                    onPromptGenerateForFrame(currentFrame, framePromptText);
                  }
                }}
                className="w-full py-1 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-[11px] font-medium transition"
              >
                Aplicar Prompt al Frame
              </button>
            </div>

            {/* Frame Actions (slow script) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Code className="w-3.5 h-3.5 text-teal-400" />
                  <span>Acciones (slow script):</span>
                </span>
              </div>
              <input
                type="text"
                value={actionsText}
                onChange={(e) => setActionsText(e.target.value)}
                onBlur={() => onUpdateKeyframe({ actions: actionsText })}
                placeholder="stop(); o gotoAndPlay(1);"
                className="w-full bg-zinc-900 border border-zinc-800 text-teal-300 font-mono text-[11px] rounded px-2 py-1 focus:outline-none"
              />
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setActionsText('stop();');
                    onUpdateKeyframe({ actions: 'stop();' });
                  }}
                  className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white"
                >
                  stop();
                </button>
                <button
                  onClick={() => {
                    setActionsText('gotoAndPlay(1);');
                    onUpdateKeyframe({ actions: 'gotoAndPlay(1);' });
                  }}
                  className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white"
                >
                  loop
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Stage Global Properties */}
        <div className="space-y-2 text-zinc-400 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200 text-xs">Propiedades del Documento</span>
            <button
              onClick={onOpenProjectSettings}
              className="text-[10px] text-teal-400 hover:underline"
            >
              Modificar
            </button>
          </div>
          <div className="flex justify-between">
            <span>Resolución Base:</span>
            <span className="font-mono text-teal-300 font-semibold">
              {width} × {height} px
            </span>
          </div>
          <div className="flex justify-between">
            <span>Velocidad:</span>
            <span className="font-mono text-teal-400">{fps} fps</span>
          </div>
          <div className="flex justify-between">
            <span>Color Escenario:</span>
            <div className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-sm border border-zinc-700"
                style={{ backgroundColor }}
              />
              <span className="font-mono text-zinc-300">{backgroundColor}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
