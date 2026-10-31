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
  Grid,
  Magnet,
  ArrowRightLeft,
  Slash,
  Palette,
  Sparkles,
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
  snapToGrid?: boolean;
  onToggleSnapToGrid?: () => void;
  gridSize?: number;
  onOpenColorPicker?: (target: 'fill' | 'stroke') => void;
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
  snapToGrid = false,
  onToggleSnapToGrid,
  gridSize = 20,
  onOpenColorPicker,
}) => {
  const tools: Array<{ id: ToolType; label: string; icon: React.ReactNode; shortcut: string }> = [
    { id: 'select', label: 'Selección', icon: <MousePointer className="w-4 h-4" />, shortcut: 'V' },
    { id: 'subselect', label: 'Subselección Vectorial (Puntos/Nodos)', icon: <MousePointer2 className="w-4 h-4" />, shortcut: 'A' },
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
    { id: 'hand', label: 'Mano / Paneo (Espacio / H)', icon: <Hand className="w-4 h-4" />, shortcut: 'H' },
    { id: 'zoom', label: 'Zoom (Alt para alejar)', icon: <ZoomIn className="w-4 h-4" />, shortcut: 'Z' },
  ];

  // Swap Fill & Stroke Colors
  const handleSwapColors = () => {
    const temp = primaryColor;
    onChangePrimaryColor(strokeColor);
    onChangeStrokeColor(temp);
  };

  // Reset to default Verde Agua
  const handleResetColors = () => {
    onChangePrimaryColor('#14b8a6');
    onChangeStrokeColor('#0f766e');
  };

  const presetColors = [
    '#14b8a6', // verde agua principal (teal 500)
    '#2dd4bf', // verde agua claro (teal 400)
    '#0f766e', // verde agua oscuro (teal 700)
    '#06b6d4', // cyan
    '#10b981', // menta
    '#3b82f6', // azul
    'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)', // Degradado Verde Agua
    'radial-gradient(circle, #2dd4bf 0%, #042f2e 100%)', // Radial Verde Agua
  ];

  return (
    <div className="w-16 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-2 select-none shrink-0 text-zinc-300 overflow-y-auto">
      {/* Tools Grid */}
      <div className="flex flex-col gap-1 items-center w-full px-1">
        {tools.map((t) => {
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTool(t.id)}
              title={`${t.label} [Atajo: ${t.shortcut}]`}
              className={`w-10 h-8.5 rounded flex items-center justify-center transition relative group ${
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

      <div className="w-10 h-px bg-zinc-800 my-2" />

      {/* Snap to Grid (Cuadrícula Magnética) Tool Button */}
      {onToggleSnapToGrid && (
        <button
          onClick={onToggleSnapToGrid}
          title={`Cuadrícula Magnética (Snap-to-Grid) [G]: ${snapToGrid ? 'ACTIVADA' : 'DESACTIVADA'}`}
          className={`w-10 h-9 mb-2 rounded flex flex-col items-center justify-center transition border ${
            snapToGrid
              ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-md shadow-teal-500/20'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center gap-0.5">
            <Grid className="w-3.5 h-3.5" />
            <Magnet className="w-2.5 h-2.5 text-teal-400" />
          </div>
          <span className="text-[7px] font-mono font-bold leading-none mt-0.5">
            {snapToGrid ? `${gridSize}px` : 'SNAP'}
          </span>
        </button>
      )}

      {/* Selector de Color Flotante (Degradados & Paletas) */}
      {onOpenColorPicker && (
        <button
          onClick={() => onOpenColorPicker('fill')}
          title="Abrir Selector Flotante de Color, Degradados y Paletas"
          className="w-10 h-7 mb-2 rounded bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 flex items-center justify-center transition cursor-pointer group relative"
        >
          <Palette className="w-4 h-4 text-teal-400 group-hover:scale-110 transition" />
          <span className="absolute left-11 bg-zinc-900 border border-zinc-700 text-teal-300 text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
            Selector Flotante (Degradados & Paletas)
          </span>
        </button>
      )}

      {/* Dual Color Boxes: Una caja de relleno y una caja de color de borde */}
      <div className="w-full px-1.5 flex flex-col items-center gap-1.5 mb-2">
        {/* Fill Color Box */}
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex justify-between items-center text-[8px] text-zinc-400 px-0.5 mb-0.5">
            <span className="font-semibold text-zinc-300">RELLENO</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenColorPicker ? onOpenColorPicker('fill') : undefined}
            title="Color o Degradado de Relleno (Haz clic para selector flotante)"
            className="w-10 h-7 rounded border-2 border-zinc-700 hover:border-teal-400 shadow-inner cursor-pointer flex items-center justify-center overflow-hidden transition relative"
            style={{ background: primaryColor === 'transparent' ? '#18181b' : primaryColor }}
          >
            {primaryColor === 'transparent' ? (
              <Slash className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <div className="absolute inset-0 ring-1 ring-inset ring-black/20" />
            )}
          </button>
        </div>

        {/* Stroke / Border Color Box */}
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex justify-between items-center text-[8px] text-zinc-400 px-0.5 mb-0.5">
            <span className="font-semibold text-zinc-300">BORDE</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenColorPicker ? onOpenColorPicker('stroke') : undefined}
            title="Color de Borde / Trazo (Haz clic para selector flotante)"
            className="w-10 h-7 rounded border-2 border-zinc-700 hover:border-teal-400 shadow-inner cursor-pointer flex items-center justify-center overflow-hidden transition relative bg-zinc-900"
          >
            {strokeColor === 'transparent' ? (
              <Slash className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <div
                className="w-6 h-4 rounded-sm border-2 transition"
                style={{ borderColor: strokeColor, background: 'transparent' }}
              />
            )}
          </button>
        </div>

        {/* Quick Swapping & Reset Buttons */}
        <div className="flex items-center justify-between w-full px-1">
          <button
            onClick={handleSwapColors}
            title="Intercambiar Relleno y Borde [X]"
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-teal-300 transition"
          >
            <ArrowRightLeft className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={handleResetColors}
            title="Restablecer Colores por Defecto Verde Agua [D]"
            className="px-1 py-0.5 hover:bg-zinc-800 rounded text-[8px] font-mono font-bold text-teal-400 transition"
          >
            D
          </button>
          <button
            onClick={() => onChangePrimaryColor('transparent')}
            title="Sin Relleno (Transparente) [/]"
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-red-400 transition"
          >
            <Slash className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Preset Swatches Palette with Verde Agua options & Gradients */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        {presetColors.map((c, i) => (
          <button
            key={i}
            onClick={() => onChangePrimaryColor(c)}
            style={{ background: c }}
            className="w-3.5 h-3.5 rounded-sm border border-zinc-700 hover:scale-110 transition shadow-2xs"
            title={`Aplicar ${c}`}
          />
        ))}
      </div>

      <div className="w-10 h-px bg-zinc-800 my-1" />

      {/* Stroke Width control */}
      <div className="flex flex-col items-center mt-0.5 text-[10px] text-zinc-400">
        <span className="font-mono text-teal-400 text-[9px] font-bold">{strokeWidth}px</span>
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
