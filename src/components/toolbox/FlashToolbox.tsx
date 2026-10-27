import React from 'react';
import { ToolType } from '../../types/flash';
import {
  MousePointer,
  Crop,
  Square,
  Circle,
  Star,
  PenTool,
  Paintbrush,
  Type,
  PaintBucket,
  Eraser,
  Box,
  Minus,
  Plus,
  MousePointer2,
  Hand,
  ZoomIn,
} from 'lucide-react';

interface FlashToolboxProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  primaryColor: string;
  onChangePrimaryColor: (color: string) => void;
  strokeColor: string;
  onChangeStrokeColor: (color: string) => void;
  strokeWidth: number;
  onChangeStrokeWidth: (width: number) => void;
}

export const FlashToolbox: React.FC<FlashToolboxProps> = ({
  activeTool,
  onSelectTool,
  primaryColor,
  onChangePrimaryColor,
  strokeColor,
  onChangeStrokeColor,
  strokeWidth,
  onChangeStrokeWidth,
}) => {
  const tools: Array<{ id: ToolType; label: string; icon: React.ReactNode; shortcut: string }> = [
    { id: 'select', label: 'Selección', icon: <MousePointer className="w-4 h-4" />, shortcut: 'V' },
    { id: 'subselect', label: 'Subselección Vectorial (Puntos)', icon: <MousePointer2 className="w-4 h-4" />, shortcut: 'A' },
    { id: 'freetransform', label: 'Transformación Libre', icon: <Crop className="w-4 h-4" />, shortcut: 'Q' },
    { id: 'rect', label: 'Rectángulo', icon: <Square className="w-4 h-4" />, shortcut: 'R' },
    { id: 'circle', label: 'Óvalo / Círculo', icon: <Circle className="w-4 h-4" />, shortcut: 'O' },
    { id: 'star', label: 'Estrella / Polígono', icon: <Star className="w-4 h-4" />, shortcut: 'S' },
    { id: 'brush', label: 'Pincel Fluido', icon: <Paintbrush className="w-4 h-4" />, shortcut: 'B' },
    { id: 'pencil', label: 'Lápiz Vectorial', icon: <PenTool className="w-4 h-4" />, shortcut: 'Y' },
    { id: 'text', label: 'Texto Vectorial', icon: <Type className="w-4 h-4" />, shortcut: 'T' },
    { id: 'paintbucket', label: 'Cubo de Pintura', icon: <PaintBucket className="w-4 h-4" />, shortcut: 'K' },
    { id: 'eraser', label: 'Borrador', icon: <Eraser className="w-4 h-4" />, shortcut: 'E' },
    { id: 'three', label: 'Objeto 3D (Three.js)', icon: <Box className="w-4 h-4 text-teal-400" />, shortcut: '3' },
    { id: 'hand', label: 'Mano (Espacio / H)', icon: <Hand className="w-4 h-4" />, shortcut: 'H' },
    { id: 'zoom', label: 'Zoom (Alt para alejar)', icon: <ZoomIn className="w-4 h-4" />, shortcut: 'Z' },
  ];

  const presetColors = [
    '#14b8a6', // verde agua principal (teal 500)
    '#2dd4bf', // verde agua claro (teal 400)
    '#0f766e', // verde agua oscuro (teal 700)
    '#06b6d4', // cyan
    '#10b981', // menta
    '#3b82f6', // azul
    '#ffffff', // blanco
    '#09090b', // oscuro
  ];

  return (
    <div className="w-14 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-2 select-none shrink-0 text-zinc-300 overflow-y-auto">
      {/* Tools Grid */}
      <div className="flex flex-col gap-1 items-center w-full px-1">
        {tools.map((t) => {
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTool(t.id)}
              title={`${t.label} [Atajo: ${t.shortcut}]`}
              className={`w-9 h-8.5 rounded flex items-center justify-center transition relative group ${
                isActive
                  ? 'bg-teal-500 text-zinc-950 font-bold shadow-md shadow-teal-500/25'
                  : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {t.icon}
              <span
                className={`absolute bottom-0 right-0.5 text-[8px] font-mono leading-none ${
                  isActive ? 'text-zinc-950 font-bold' : 'text-zinc-500 group-hover:text-teal-400'
                }`}
              >
                {t.shortcut}
              </span>
            </button>
          );
        })}
      </div>

      <div className="w-8 h-px bg-zinc-800 my-2" />

      {/* Fill and Stroke Overlapping Swatches */}
      <div className="relative w-9 h-9 mb-2">
        <label
          title="Color de Relleno"
          className="absolute top-0 left-0 w-6 h-6 rounded border border-zinc-700 shadow-sm cursor-pointer z-10 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: primaryColor }}
        >
          <input
            type="color"
            value={primaryColor.startsWith('#') ? primaryColor : '#14b8a6'}
            onChange={(e) => onChangePrimaryColor(e.target.value)}
            className="opacity-0 w-full h-full cursor-pointer"
          />
        </label>

        <label
          title="Color de Trazo"
          className="absolute bottom-0 right-0 w-6 h-6 rounded border border-zinc-600 shadow-sm cursor-pointer flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: strokeColor }}
        >
          <input
            type="color"
            value={strokeColor.startsWith('#') ? strokeColor : '#0f766e'}
            onChange={(e) => onChangeStrokeColor(e.target.value)}
            className="opacity-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>

      {/* Preset Swatches Palette with Verde Agua options */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        {presetColors.slice(0, 6).map((c) => (
          <button
            key={c}
            onClick={() => onChangePrimaryColor(c)}
            style={{ backgroundColor: c }}
            className="w-3.5 h-3.5 rounded-sm border border-zinc-700 hover:scale-110 transition"
          />
        ))}
      </div>

      <div className="w-8 h-px bg-zinc-800 my-1" />

      {/* Stroke Width control */}
      <div className="flex flex-col items-center mt-0.5 text-[10px] text-zinc-400">
        <span className="font-mono text-teal-400 text-[10px]">{strokeWidth}px</span>
        <div className="flex gap-1 mt-0.5">
          <button
            onClick={() => onChangeStrokeWidth(Math.max(1, strokeWidth - 1))}
            className="p-1 hover:text-white rounded bg-zinc-900 border border-zinc-800"
            title="Reducir grosor de trazo"
          >
            <Minus className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={() => onChangeStrokeWidth(Math.min(30, strokeWidth + 1))}
            className="p-1 hover:text-white rounded bg-zinc-900 border border-zinc-800"
            title="Aumentar grosor de trazo"
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
