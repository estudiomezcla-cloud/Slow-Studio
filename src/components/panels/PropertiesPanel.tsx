import React, { useState } from 'react';
import { EasingType, FlashElement, Keyframe, TweenType, ElementFilters } from '../../types/flash';
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
  Sun,
  Contrast,
  Droplet,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Palette,
  Spline,
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
  isPlaying?: boolean;
  onOpenColorPicker?: (target: 'fill' | 'stroke') => void;
  onOpenMotionPathPanel?: () => void;
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
  isPlaying = false,
  onOpenColorPicker,
  onOpenMotionPathPanel,
}) => {
  const [framePromptText, setFramePromptText] = useState(activeKeyframe?.prompt || '');
  const [actionsText, setActionsText] = useState(activeKeyframe?.actions || '');
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  // Real-time element filters state & helpers
  const currentFilters = selectedElement?.filters;
  const currentBlur = currentFilters?.blur ?? 0;
  const currentBrightness = currentFilters?.brightness ?? 100;
  const currentContrast = currentFilters?.contrast ?? 100;
  const dropShadow = currentFilters?.dropShadow || {
    enabled: false,
    color: '#000000',
    blur: 8,
    offsetX: 4,
    offsetY: 4,
  };

  const updateFilters = (changes: Partial<ElementFilters>) => {
    if (!selectedElement) return;
    const updated: ElementFilters = {
      blur: currentBlur,
      brightness: currentBrightness,
      contrast: currentContrast,
      dropShadow: { ...dropShadow },
      ...changes,
    };
    onUpdateElement({
      ...selectedElement,
      filters: updated,
    });
  };

  const updateDropShadow = (changes: Partial<NonNullable<ElementFilters['dropShadow']>>) => {
    if (!selectedElement) return;
    const updatedShadow = {
      ...dropShadow,
      ...changes,
    };
    updateFilters({ dropShadow: updatedShadow });
  };

  const resetAllFilters = () => {
    if (!selectedElement) return;
    onUpdateElement({
      ...selectedElement,
      filters: undefined,
    });
  };

  const applyPreset = (preset: 'softShadow' | 'neonGlow' | 'dreamBlur' | 'highContrast') => {
    if (!selectedElement) return;
    if (preset === 'softShadow') {
      updateFilters({
        blur: 0,
        brightness: 100,
        contrast: 100,
        dropShadow: { enabled: true, color: '#000000', blur: 12, offsetX: 5, offsetY: 6 },
      });
    } else if (preset === 'neonGlow') {
      updateFilters({
        blur: 0,
        brightness: 120,
        contrast: 110,
        dropShadow: { enabled: true, color: '#2dd4bf', blur: 18, offsetX: 0, offsetY: 0 },
      });
    } else if (preset === 'dreamBlur') {
      updateFilters({
        blur: 6,
        brightness: 110,
        contrast: 105,
        dropShadow: { enabled: false, color: '#000000', blur: 8, offsetX: 4, offsetY: 4 },
      });
    } else if (preset === 'highContrast') {
      updateFilters({
        blur: 0,
        brightness: 115,
        contrast: 160,
        dropShadow: { enabled: true, color: '#000000', blur: 6, offsetX: 4, offsetY: 4 },
      });
    }
  };

  const hasActiveFilters = Boolean(
    selectedElement?.filters && (
      (selectedElement.filters.blur !== undefined && selectedElement.filters.blur > 0) ||
      (selectedElement.filters.brightness !== undefined && selectedElement.filters.brightness !== 100) ||
      (selectedElement.filters.contrast !== undefined && selectedElement.filters.contrast !== 100) ||
      selectedElement.filters.dropShadow?.enabled
    )
  );

  return (
    <div
      className={`w-64 bg-zinc-950 border-l border-zinc-800 flex flex-col h-full text-xs text-zinc-300 select-none overflow-y-auto shrink-0 transition-all ${
        isPlaying ? 'animate-play-glow border-teal-500/50' : ''
      }`}
    >
      {/* Panel Header with Play Vibration Feedback */}
      <div
        className={`h-10 px-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between font-semibold text-zinc-200 transition-all ${
          isPlaying ? 'bg-teal-950/40 border-teal-500/40 text-teal-300 animate-play-vibrate' : ''
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Sliders className={`w-3.5 h-3.5 ${isPlaying ? 'text-teal-300 animate-spin' : 'text-teal-400'}`} />
          <span>Propiedades</span>
          {isPlaying && (
            <span className="ml-1 text-[9px] px-1.5 py-0.2 rounded-full bg-teal-500 text-zinc-950 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-zinc-950" />
              PLAY
            </span>
          )}
        </div>
        <button
          onClick={onOpenProjectSettings}
          title="Configurar Escenario y Resolución"
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-teal-300 transition"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Vibration banner when playing */}
      {isPlaying && (
        <div className="px-3 py-1.5 bg-gradient-to-r from-teal-950/80 via-teal-900/60 to-zinc-900 border-b border-teal-500/30 flex items-center justify-between text-[10px] text-teal-300 animate-play-vibrate">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="inline-block w-1.5 h-3 bg-teal-400 rounded-xs animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="inline-block w-1.5 h-4 bg-teal-300 rounded-xs animate-bounce" style={{ animationDelay: '100ms' }} />
            <span className="inline-block w-1.5 h-2.5 bg-teal-500 rounded-xs animate-bounce" style={{ animationDelay: '200ms' }} />
            <span className="font-semibold tracking-wide">VIBRACIÓN ACTIVA</span>
          </div>
          <span className="font-mono text-zinc-400">{fps} FPS LIVE</span>
        </div>
      )}

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

            {/* Relleno & Borde (Soporte de Color Sólido, Degradados Lineales y Radiales) */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-teal-300">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-teal-400" />
                  <span>Color & Trazo</span>
                </span>
                {onOpenColorPicker && (
                  <button
                    type="button"
                    onClick={() => onOpenColorPicker('fill')}
                    className="text-[10px] text-teal-400 hover:text-teal-300 underline font-mono flex items-center gap-0.5"
                    title="Abrir selector flotante de degradados y paletas"
                  >
                    Editor Flotante
                  </button>
                )}
              </div>

              {/* Relleno Control */}
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-zinc-400 font-medium">Relleno:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenColorPicker?.('fill')}
                    title="Hacer clic para editar relleno con degradado o paleta"
                    className="w-6 h-6 rounded border border-zinc-700 shadow-sm overflow-hidden flex-shrink-0 cursor-pointer hover:border-teal-400 transition relative"
                    style={{ background: selectedElement.fill || 'transparent' }}
                  >
                    {(!selectedElement.fill || selectedElement.fill === 'transparent') && (
                      <div className="w-full h-full bg-[radial-gradient(#555_1px,transparent_1px)] [background-size:4px_4px]" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenColorPicker?.('fill')}
                    className="text-left font-mono text-[10px] text-zinc-300 hover:text-teal-300 truncate max-w-[110px] bg-zinc-800/80 px-1.5 py-1 rounded border border-zinc-750"
                  >
                    {selectedElement.fill?.includes('gradient')
                      ? selectedElement.fill.includes('radial') ? 'Degradado Radial' : 'Degradado Lineal'
                      : (selectedElement.fill || 'Sin relleno')}
                  </button>
                </div>
              </div>

              {/* Borde / Trazo Control */}
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-zinc-400 font-medium">Trazo:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenColorPicker?.('stroke')}
                    title="Hacer clic para editar trazo"
                    className="w-6 h-6 rounded border border-zinc-700 shadow-sm overflow-hidden flex-shrink-0 cursor-pointer hover:border-teal-400 transition"
                    style={{ background: selectedElement.stroke || 'transparent' }}
                  />
                  <div className="flex items-center gap-1 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-750 text-[10px] font-mono">
                    <span className="text-zinc-500">Grosor:</span>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={selectedElement.strokeWidth ?? 1}
                      onChange={(e) =>
                        onUpdateElement({
                          ...selectedElement,
                          strokeWidth: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-8 bg-transparent text-right focus:outline-none text-zinc-200"
                    />
                    <span className="text-zinc-600">px</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros de Efectos en Tiempo Real (Desenfoque / Blur, Brillo, Contraste, Sombra Paralela) */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 font-semibold text-teal-300 hover:text-teal-200 transition text-left"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Filtros</span>
                  {hasActiveFilters && (
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  )}
                  {isFiltersOpen ? (
                    <ChevronDown className="w-3 h-3 text-zinc-500" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-zinc-500" />
                  )}
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    title="Restablecer filtros a predeterminado"
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-red-400 transition"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {isFiltersOpen && (
                <div className="space-y-3 pt-1 border-t border-zinc-800/60">
                  {/* Preset Quick Chips */}
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => applyPreset('softShadow')}
                      className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 transition"
                    >
                      Sombra 3D
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('neonGlow')}
                      className="px-1.5 py-0.5 rounded bg-teal-950/60 hover:bg-teal-900/80 text-[10px] text-teal-300 border border-teal-500/30 transition"
                    >
                      Glow Neón
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('dreamBlur')}
                      className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 transition"
                    >
                      Desenfoque
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('highContrast')}
                      className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 transition"
                    >
                      Contraste +
                    </button>
                  </div>

                  {/* 1. Desenfoque (Blur) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Droplet className="w-3 h-3 text-teal-400" />
                        <span>Desenfoque (Blur):</span>
                      </span>
                      <span className="font-mono text-teal-300 text-[10px]">{currentBlur}px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={currentBlur}
                        onChange={(e) => updateFilters({ blur: Number(e.target.value) })}
                        className="w-full accent-teal-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                      />
                      {currentBlur > 0 && (
                        <button
                          type="button"
                          onClick={() => updateFilters({ blur: 0 })}
                          className="text-[9px] text-zinc-500 hover:text-zinc-300"
                        >
                          0
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Brillo (Brightness) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Sun className="w-3 h-3 text-amber-400" />
                        <span>Brillo:</span>
                      </span>
                      <span className="font-mono text-teal-300 text-[10px]">{currentBrightness}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="20"
                        max="200"
                        step="5"
                        value={currentBrightness}
                        onChange={(e) => updateFilters({ brightness: Number(e.target.value) })}
                        className="w-full accent-teal-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                      />
                      {currentBrightness !== 100 && (
                        <button
                          type="button"
                          onClick={() => updateFilters({ brightness: 100 })}
                          className="text-[9px] text-zinc-500 hover:text-zinc-300"
                        >
                          100%
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3. Contraste (Contrast) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Contrast className="w-3 h-3 text-cyan-400" />
                        <span>Contraste:</span>
                      </span>
                      <span className="font-mono text-teal-300 text-[10px]">{currentContrast}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="20"
                        max="200"
                        step="5"
                        value={currentContrast}
                        onChange={(e) => updateFilters({ contrast: Number(e.target.value) })}
                        className="w-full accent-teal-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                      />
                      {currentContrast !== 100 && (
                        <button
                          type="button"
                          onClick={() => updateFilters({ contrast: 100 })}
                          className="text-[9px] text-zinc-500 hover:text-zinc-300"
                        >
                          100%
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 4. Sombra Paralela (Drop Shadow) */}
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-[11px] text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dropShadow.enabled}
                          onChange={(e) => updateDropShadow({ enabled: e.target.checked })}
                          className="rounded bg-zinc-800 border-zinc-700 text-teal-500 focus:ring-teal-500 focus:ring-offset-zinc-900"
                        />
                        <span className="font-medium text-teal-300">Sombra Paralela</span>
                      </label>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                          dropShadow.enabled
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            : 'text-zinc-600'
                        }`}
                      >
                        {dropShadow.enabled ? 'ON' : 'OFF'}
                      </span>
                    </div>

                    {dropShadow.enabled && (
                      <div className="space-y-2.5 pl-2 border-l border-teal-500/30 text-[10px]">
                        {/* Shadow Color */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-zinc-400">
                            <span>Color de Sombra:</span>
                            <span className="font-mono text-zinc-300">{dropShadow.color}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={dropShadow.color.startsWith('#') ? dropShadow.color : '#000000'}
                              onChange={(e) => updateDropShadow({ color: e.target.value })}
                              className="w-6 h-6 rounded cursor-pointer bg-transparent border border-zinc-700"
                            />
                            {/* Color chips */}
                            <div className="flex items-center gap-1">
                              {['#000000', '#14b8a6', '#2dd4bf', '#ffffff', '#8b5cf6'].map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => updateDropShadow({ color: c })}
                                  style={{ backgroundColor: c }}
                                  className={`w-4 h-4 rounded-full border ${
                                    dropShadow.color === c ? 'border-teal-400 ring-1 ring-teal-400' : 'border-zinc-700'
                                  }`}
                                  title={c}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Shadow Blur */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-zinc-400">
                            <span>Desenfoque Sombra:</span>
                            <span className="font-mono text-teal-300">{dropShadow.blur}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="40"
                            step="1"
                            value={dropShadow.blur}
                            onChange={(e) => updateDropShadow({ blur: Number(e.target.value) })}
                            className="w-full accent-teal-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Offset X & Offset Y */}
                        <div className="grid grid-cols-2 gap-2 font-mono">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-zinc-400">
                              <span>Offset X:</span>
                              <span className="text-teal-300">{dropShadow.offsetX}px</span>
                            </div>
                            <input
                              type="range"
                              min="-30"
                              max="30"
                              step="1"
                              value={dropShadow.offsetX}
                              onChange={(e) => updateDropShadow({ offsetX: Number(e.target.value) })}
                              className="w-full accent-teal-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-zinc-400">
                              <span>Offset Y:</span>
                              <span className="text-teal-300">{dropShadow.offsetY}px</span>
                            </div>
                            <input
                              type="range"
                              min="-30"
                              max="30"
                              step="1"
                              value={dropShadow.offsetY}
                              onChange={(e) => updateDropShadow({ offsetY: Number(e.target.value) })}
                              className="w-full accent-teal-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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

            {/* Motion Path Bézier Curves Control Launcher */}
            {activeKeyframe.tweenType === 'motion' && onOpenMotionPathPanel && (
              <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-teal-300 flex items-center gap-1">
                    <Spline className="w-3.5 h-3.5 text-teal-400" />
                    <span>Trayectoria (Motion Path):</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      activeKeyframe.motionPath?.enabled
                        ? 'bg-teal-950 text-teal-300 border border-teal-500/30 font-semibold'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {activeKeyframe.motionPath?.enabled ? 'Bézier Activa' : 'Línea Recta'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenMotionPathPanel}
                  className="w-full py-1.5 px-2 rounded bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="Abrir editor de trayectoria para editar curvas de Bézier interactivas (M)"
                >
                  <Spline className="w-3.5 h-3.5 text-teal-400" />
                  <span>Editar Curvas Bézier en Canvas (M)</span>
                </button>
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
