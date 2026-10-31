import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Minus,
  Maximize2,
  Pipette,
  Plus,
  Trash2,
  ArrowRightLeft,
  RotateCw,
  FolderPlus,
  BookmarkPlus,
  Copy,
  Check,
  Palette,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronRight,
  GripHorizontal,
} from 'lucide-react';
import {
  GradientData,
  GradientStop,
  StudioPalette,
  BUILTIN_PALETTES,
  loadUserPalettes,
  saveUserPalettes,
  parseColorOrGradient,
  buildGradientString,
  hexToRgb,
  rgbToHex,
  rgbToHsv,
  hsvToRgb,
  isGradient,
} from '../../utils/colorUtils';
import { playButtonClick } from '../../utils/audio';

export type ColorTarget = 'fill' | 'stroke' | 'background';

interface FloatingColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string; // solid or gradient string
  onChangeColor: (newColor: string, target: ColorTarget) => void;
  target?: ColorTarget;
  onChangeTarget?: (target: ColorTarget) => void;
  hasSelectedElement?: boolean;
}

export const FloatingColorPicker: React.FC<FloatingColorPickerProps> = ({
  isOpen,
  onClose,
  currentColor,
  onChangeColor,
  target = 'fill',
  onChangeTarget,
  hasSelectedElement = false,
}) => {
  // Floating Window Position and Drag
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 80, y: 120 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Active Mode: 'solid' | 'linear' | 'radial' | 'palette'
  const [mode, setMode] = useState<'solid' | 'linear' | 'radial' | 'palette'>('solid');

  // Gradient Data State
  const [gradientData, setGradientData] = useState<GradientData>(() =>
    parseColorOrGradient(currentColor)
  );
  const [selectedStopId, setSelectedStopId] = useState<string>('stop_1');

  // Solid Color HSV State
  const [hsv, setHsv] = useState<{ h: number; s: number; v: number }>({ h: 172, s: 89, v: 72 });
  const [alpha, setAlpha] = useState<number>(1);
  const [hexInput, setHexInput] = useState<string>('#14b8a6');
  const [copiedHex, setCopiedHex] = useState<boolean>(false);

  // Palettes State
  const [userPalettes, setUserPalettes] = useState<StudioPalette[]>(() => loadUserPalettes());
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>('verde_agua_studio');
  const [newPaletteName, setNewPaletteName] = useState<string>('');
  const [isCreatingPalette, setIsCreatingPalette] = useState<boolean>(false);

  const satValRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);
  const alphaSliderRef = useRef<HTMLDivElement>(null);
  const gradientTrackRef = useRef<HTMLDivElement>(null);

  // Keep internal state synced when currentColor changes from outside
  useEffect(() => {
    if (!currentColor) return;
    const parsed = parseColorOrGradient(currentColor);
    setGradientData(parsed);

    if (parsed.type === 'linear') {
      setMode('linear');
      if (parsed.stops[0]) setSelectedStopId(parsed.stops[0].id);
    } else if (parsed.type === 'radial') {
      setMode('radial');
      if (parsed.stops[0]) setSelectedStopId(parsed.stops[0].id);
    } else {
      setMode('solid');
      const rgb = hexToRgb(parsed.solidColor);
      setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
      setAlpha(rgb.a ?? 1);
      setHexInput(parsed.solidColor);
    }
  }, [currentColor]);

  // Window drag handlers
  const handleWindowMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 300, e.clientX - dragOffsetRef.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 200, e.clientY - dragOffsetRef.current.y));
      setPosition({ x: newX, y: newY });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Emit color update
  const emitColorChange = useCallback(
    (colorStr: string) => {
      onChangeColor(colorStr, target);
    },
    [onChangeColor, target]
  );

  // Update Solid Color from HSV
  const updateFromHsv = useCallback(
    (newHsv: { h: number; s: number; v: number }, newAlpha = alpha) => {
      setHsv(newHsv);
      setAlpha(newAlpha);
      const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b, newAlpha);
      setHexInput(hex);

      if (mode === 'solid') {
        setGradientData((prev) => ({ ...prev, type: 'solid', solidColor: hex }));
        emitColorChange(hex);
      } else {
        // Update selected gradient stop color!
        setGradientData((prev) => {
          const updatedStops = prev.stops.map((s) => (s.id === selectedStopId ? { ...s, color: hex } : s));
          const updated = { ...prev, stops: updatedStops };
          emitColorChange(buildGradientString(updated));
          return updated;
        });
      }
    },
    [alpha, mode, selectedStopId, emitColorChange]
  );

  // Saturation / Value 2D Box Drag
  const handleSatValMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = satValRef.current?.getBoundingClientRect();
    if (!box) return;

    const updateSV = (evt: MouseEvent | React.MouseEvent) => {
      const x = Math.max(0, Math.min(box.width, evt.clientX - box.left));
      const y = Math.max(0, Math.min(box.height, evt.clientY - box.top));
      const s = Math.round((x / box.width) * 100);
      const v = Math.round((1 - y / box.height) * 100);
      updateFromHsv({ ...hsv, s, v });
    };

    updateSV(e);

    const onMove = (evt: MouseEvent) => updateSV(evt);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Hue Bar Drag
  const handleHueMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = hueSliderRef.current?.getBoundingClientRect();
    if (!bar) return;

    const updateH = (evt: MouseEvent | React.MouseEvent) => {
      const x = Math.max(0, Math.min(bar.width, evt.clientX - bar.left));
      const h = Math.round((x / bar.width) * 360) % 360;
      updateFromHsv({ ...hsv, h });
    };

    updateH(e);

    const onMove = (evt: MouseEvent) => updateH(evt);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Alpha Slider Drag
  const handleAlphaMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = alphaSliderRef.current?.getBoundingClientRect();
    if (!bar) return;

    const updateA = (evt: MouseEvent | React.MouseEvent) => {
      const x = Math.max(0, Math.min(bar.width, evt.clientX - bar.left));
      const a = Math.round((x / bar.width) * 100) / 100;
      updateFromHsv(hsv, a);
    };

    updateA(e);

    const onMove = (evt: MouseEvent) => updateA(evt);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Hex Input Change
  const handleHexChange = (val: string) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(val)) {
      const rgb = hexToRgb(val);
      const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHsv(newHsv);
      setAlpha(rgb.a ?? 1);

      if (mode === 'solid') {
        setGradientData((prev) => ({ ...prev, type: 'solid', solidColor: val }));
        emitColorChange(val);
      } else {
        setGradientData((prev) => {
          const updatedStops = prev.stops.map((s) => (s.id === selectedStopId ? { ...s, color: val } : s));
          const updated = { ...prev, stops: updatedStops };
          emitColorChange(buildGradientString(updated));
          return updated;
        });
      }
    }
  };

  // Eyedropper API
  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        // @ts-expect-error EyeDropper is a native experimental browser API
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          handleHexChange(result.sRGBHex);
          playButtonClick();
        }
      } catch (err) {
        console.log('EyeDropper cancelled or unsupported', err);
      }
    } else {
      alert('Tu navegador no soporta la API EyeDropper nativa. Puedes seleccionar colores de la paleta.');
    }
  };

  // Switch Mode (Solid, Linear, Radial, Palette)
  const handleSwitchMode = (newMode: 'solid' | 'linear' | 'radial' | 'palette') => {
    setMode(newMode);
    playButtonClick();

    if (newMode === 'solid') {
      const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b, alpha);
      const updated: GradientData = { ...gradientData, type: 'solid', solidColor: hex };
      setGradientData(updated);
      emitColorChange(hex);
    } else if (newMode === 'linear') {
      const updated: GradientData = {
        ...gradientData,
        type: 'linear',
        angle: gradientData.angle ?? 90,
        stops:
          gradientData.stops.length >= 2
            ? gradientData.stops
            : [
                { id: `stop_1_${Date.now()}`, color: '#14b8a6', offset: 0 },
                { id: `stop_2_${Date.now()}`, color: '#06b6d4', offset: 1 },
              ],
      };
      setGradientData(updated);
      emitColorChange(buildGradientString(updated));
    } else if (newMode === 'radial') {
      const updated: GradientData = {
        ...gradientData,
        type: 'radial',
        stops:
          gradientData.stops.length >= 2
            ? gradientData.stops
            : [
                { id: `stop_1_${Date.now()}`, color: '#2dd4bf', offset: 0 },
                { id: `stop_2_${Date.now()}`, color: '#042f2e', offset: 1 },
              ],
      };
      setGradientData(updated);
      emitColorChange(buildGradientString(updated));
    }
  };

  // Gradient Track Click -> Add new stop
  const handleGradientTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const track = gradientTrackRef.current?.getBoundingClientRect();
    if (!track) return;
    const offset = Math.max(0, Math.min(1, Math.round(((e.clientX - track.left) / track.width) * 100) / 100));

    // Interpolate or pick current color
    const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
    const newColor = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b, alpha);

    const newStop: GradientStop = {
      id: `stop_${Date.now()}`,
      color: newColor,
      offset,
    };

    const newStops = [...gradientData.stops, newStop].sort((a, b) => a.offset - b.offset);
    const updated: GradientData = { ...gradientData, stops: newStops };
    setGradientData(updated);
    setSelectedStopId(newStop.id);
    emitColorChange(buildGradientString(updated));
    playButtonClick();
  };

  // Drag Gradient Stop Pin
  const handleStopPinMouseDown = (e: React.MouseEvent, stopId: string) => {
    e.stopPropagation();
    setSelectedStopId(stopId);

    const selectedStop = gradientData.stops.find((s) => s.id === stopId);
    if (selectedStop) {
      const rgb = hexToRgb(selectedStop.color);
      setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
      setAlpha(rgb.a ?? 1);
      setHexInput(selectedStop.color);
    }

    const track = gradientTrackRef.current?.getBoundingClientRect();
    if (!track) return;

    const onMove = (evt: MouseEvent) => {
      const newOffset = Math.max(0, Math.min(1, Math.round(((evt.clientX - track.left) / track.width) * 100) / 100));
      setGradientData((prev) => {
        const nextStops = prev.stops.map((s) => (s.id === stopId ? { ...s, offset: newOffset } : s));
        const updated = { ...prev, stops: nextStops };
        emitColorChange(buildGradientString(updated));
        return updated;
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Remove selected stop
  const handleRemoveStop = () => {
    if (gradientData.stops.length <= 2) return;
    const remaining = gradientData.stops.filter((s) => s.id !== selectedStopId);
    const updated = { ...gradientData, stops: remaining };
    setGradientData(updated);
    setSelectedStopId(remaining[0].id);
    emitColorChange(buildGradientString(updated));
    playButtonClick();
  };

  // Reverse Gradient Stops
  const handleReverseGradient = () => {
    const reversed = gradientData.stops.map((s) => ({
      ...s,
      offset: Math.round((1 - s.offset) * 100) / 100,
    })).sort((a, b) => a.offset - b.offset);

    const updated = { ...gradientData, stops: reversed };
    setGradientData(updated);
    emitColorChange(buildGradientString(updated));
    playButtonClick();
  };

  // Save current color/gradient into user palette
  const handleSaveToPalette = () => {
    const colorToSave =
      mode === 'solid'
        ? hexInput
        : buildGradientString(gradientData);

    const targetPalette = userPalettes.find((p) => p.id === selectedPaletteId) || userPalettes[0];
    if (!targetPalette) return;

    if (targetPalette.colors.includes(colorToSave)) {
      alert('Este color o degradado ya está en la paleta seleccionada.');
      return;
    }

    const updatedPalettes = userPalettes.map((p) =>
      p.id === targetPalette.id ? { ...p, colors: [...p.colors, colorToSave] } : p
    );

    setUserPalettes(updatedPalettes);
    saveUserPalettes(updatedPalettes);
    playButtonClick();
  };

  // Create new user palette
  const handleCreateNewPalette = () => {
    if (!newPaletteName.trim()) return;
    const newPal: StudioPalette = {
      id: `custom_pal_${Date.now()}`,
      name: newPaletteName.trim(),
      colors: [hexInput || '#14b8a6'],
    };
    const updated = [...userPalettes, newPal];
    setUserPalettes(updated);
    saveUserPalettes(updated);
    setSelectedPaletteId(newPal.id);
    setNewPaletteName('');
    setIsCreatingPalette(false);
    playButtonClick();
  };

  // Delete user palette
  const handleDeletePalette = (palId: string) => {
    if (userPalettes.length <= 1) {
      alert('Debes mantener al menos una paleta personalizada.');
      return;
    }
    const updated = userPalettes.filter((p) => p.id !== palId);
    setUserPalettes(updated);
    saveUserPalettes(updated);
    setSelectedPaletteId(updated[0].id);
    playButtonClick();
  };

  // Remove color from palette
  const handleRemoveColorFromPalette = (palId: string, colorIdx: number) => {
    const updated = userPalettes.map((p) => {
      if (p.id === palId) {
        const nextColors = [...p.colors];
        nextColors.splice(colorIdx, 1);
        return { ...p, colors: nextColors };
      }
      return p;
    });
    setUserPalettes(updated);
    saveUserPalettes(updated);
    playButtonClick();
  };

  // Apply a color or gradient from palette
  const handleApplyPaletteColor = (colorStr: string) => {
    emitColorChange(colorStr);
    const parsed = parseColorOrGradient(colorStr);
    setGradientData(parsed);
    if (parsed.type === 'linear') setMode('linear');
    else if (parsed.type === 'radial') setMode('radial');
    else {
      setMode('solid');
      const rgb = hexToRgb(parsed.solidColor);
      setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
      setAlpha(rgb.a ?? 1);
      setHexInput(parsed.solidColor);
    }
    playButtonClick();
  };

  if (!isOpen) return null;

  const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const pureHueRgb = hsvToRgb(hsv.h, 100, 100);
  const activeGradientString = buildGradientString(gradientData);
  const previewBg = mode === 'solid' ? hexInput : activeGradientString;

  const allPalettes = [...BUILTIN_PALETTES, ...userPalettes];
  const activePalette = allPalettes.find((p) => p.id === selectedPaletteId) || BUILTIN_PALETTES[0];

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className="fixed z-50 w-80 bg-zinc-950/95 backdrop-blur-md border border-zinc-700/80 rounded-xl shadow-2xl flex flex-col text-xs text-zinc-200 select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleWindowMouseDown}
        className="h-9 px-3 bg-zinc-900 border-b border-zinc-800 rounded-t-xl flex items-center justify-between cursor-move text-zinc-300 font-semibold"
      >
        <div className="flex items-center gap-1.5 text-teal-400">
          <GripHorizontal className="w-3.5 h-3.5 text-zinc-500" />
          <Palette className="w-3.5 h-3.5" />
          <span className="text-zinc-200 text-xs">Selector de Color & Degradados</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-400">
          <button
            onClick={() => setIsMinimized((m) => !m)}
            className="p-1 hover:text-white rounded hover:bg-zinc-800 transition"
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:text-white rounded hover:bg-red-500/80 transition"
            title="Cerrar selector"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3 space-y-3">
          {/* Target Selector: Relleno vs Borde vs Fondo */}
          <div className="flex items-center justify-between bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-[11px]">
            <span className="text-zinc-400 font-medium px-1.5">Destino:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChangeTarget && onChangeTarget('fill')}
                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                  target === 'fill'
                    ? 'bg-teal-500 text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Relleno
              </button>
              <button
                type="button"
                onClick={() => onChangeTarget && onChangeTarget('stroke')}
                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                  target === 'stroke'
                    ? 'bg-teal-500 text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Borde
              </button>
              <button
                type="button"
                onClick={() => onChangeTarget && onChangeTarget('background')}
                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                  target === 'background'
                    ? 'bg-teal-500 text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Fondo
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-4 gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-[11px]">
            <button
              onClick={() => handleSwitchMode('solid')}
              className={`py-1 text-center rounded transition font-medium cursor-pointer ${
                mode === 'solid'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sólido
            </button>
            <button
              onClick={() => handleSwitchMode('linear')}
              className={`py-1 text-center rounded transition font-medium cursor-pointer ${
                mode === 'linear'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Lineal
            </button>
            <button
              onClick={() => handleSwitchMode('radial')}
              className={`py-1 text-center rounded transition font-medium cursor-pointer ${
                mode === 'radial'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Radial
            </button>
            <button
              onClick={() => handleSwitchMode('palette')}
              className={`py-1 text-center rounded transition font-medium cursor-pointer ${
                mode === 'palette'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Paletas
            </button>
          </div>

          {/* MODE: GRADIENTS (Linear & Radial Track & Stops System) */}
          {(mode === 'linear' || mode === 'radial') && (
            <div className="space-y-2.5 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-teal-300">
                  {mode === 'linear' ? 'Degradado Lineal' : 'Degradado Radial'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleReverseGradient}
                    title="Invertir dirección del degradado"
                    className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                  </button>
                  {gradientData.stops.length > 2 && (
                    <button
                      onClick={handleRemoveStop}
                      title="Eliminar parada de color seleccionada"
                      className="p-1 rounded bg-zinc-800 hover:bg-red-500 text-zinc-300 hover:text-white transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Angle Dial & Slider for Linear Gradient */}
              {mode === 'linear' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                    <span className="flex items-center gap-1">
                      <RotateCw className="w-3 h-3 text-teal-400" />
                      <span>Ángulo de inclinación:</span>
                    </span>
                    <span className="font-mono text-teal-300 font-bold">{Math.round(gradientData.angle)}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="1"
                      value={Math.round(gradientData.angle)}
                      onChange={(e) => {
                        const newAngle = Number(e.target.value);
                        setGradientData((prev) => {
                          const updated = { ...prev, angle: newAngle };
                          emitColorChange(buildGradientString(updated));
                          return updated;
                        });
                      }}
                      className="w-full accent-teal-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Quick Angle Chips */}
                  <div className="flex items-center justify-between gap-1 text-[9px] font-mono">
                    {[0, 45, 90, 135, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        onClick={() => {
                          setGradientData((prev) => {
                            const updated = { ...prev, angle: deg };
                            emitColorChange(buildGradientString(updated));
                            return updated;
                          });
                          playButtonClick();
                        }}
                        className={`flex-1 py-0.5 rounded transition ${
                          Math.round(gradientData.angle) === deg
                            ? 'bg-teal-500 text-zinc-950 font-bold'
                            : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Gradient Bar Track with Pins */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>Puntos de color (Haz clic para añadir):</span>
                  <span className="text-teal-400/80">{gradientData.stops.length} paradas</span>
                </div>

                <div
                  ref={gradientTrackRef}
                  onClick={handleGradientTrackClick}
                  className="h-6 w-full rounded-md border border-zinc-700 relative cursor-crosshair shadow-inner"
                  style={{
                    background: buildGradientString({
                      ...gradientData,
                      type: 'linear',
                      angle: 90,
                    }),
                  }}
                />

                {/* Draggable Stop Marker Pins */}
                <div className="relative h-5 w-full">
                  {gradientData.stops.map((stop) => {
                    const isSelected = stop.id === selectedStopId;
                    return (
                      <div
                        key={stop.id}
                        onMouseDown={(e) => handleStopPinMouseDown(e, stop.id)}
                        style={{ left: `calc(${stop.offset * 100}% - 7px)` }}
                        className={`absolute top-0 w-3.5 h-4.5 rounded-sm border-2 cursor-pointer shadow-md transition-transform flex flex-col items-center justify-end ${
                          isSelected
                            ? 'border-white scale-110 z-10 ring-2 ring-teal-400'
                            : 'border-zinc-800 z-0 opacity-90'
                        }`}
                        title={`Parada: ${Math.round(stop.offset * 100)}% (${stop.color})`}
                      >
                        <div
                          className="w-full h-full rounded-xs"
                          style={{ backgroundColor: stop.color }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SOLID / SELECTED STOP COLOR PICKER (Interactive HSV Square + Sliders) */}
          {mode !== 'palette' && (
            <div className="space-y-2.5">
              {/* 2D Saturation / Value Box */}
              <div
                ref={satValRef}
                onMouseDown={handleSatValMouseDown}
                style={{
                  backgroundColor: `rgb(${pureHueRgb.r}, ${pureHueRgb.g}, ${pureHueRgb.b})`,
                }}
                className="relative w-full h-32 rounded-lg cursor-crosshair overflow-hidden border border-zinc-800 shadow-inner"
              >
                {/* Horizontal white gradient (Saturation) */}
                <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
                {/* Vertical black gradient (Value) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

                {/* Cursor Indicator */}
                <div
                  style={{
                    left: `${hsv.s}%`,
                    top: `${100 - hsv.v}%`,
                  }}
                  className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_4px_rgba(0,0,0,0.8)] pointer-events-none"
                />
              </div>

              {/* 1D Hue Rainbow Slider */}
              <div className="space-y-1">
                <div
                  ref={hueSliderRef}
                  onMouseDown={handleHueMouseDown}
                  className="relative h-3.5 w-full rounded-full cursor-pointer shadow-inner border border-zinc-800"
                  style={{
                    background:
                      'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                  }}
                >
                  <div
                    style={{ left: `calc(${(hsv.h / 360) * 100}% - 6px)` }}
                    className="absolute top-0 w-3 h-3.5 bg-white border-2 border-zinc-950 rounded-full shadow-md pointer-events-none"
                  />
                </div>
              </div>

              {/* 1D Alpha Slider */}
              <div className="space-y-1">
                <div
                  ref={alphaSliderRef}
                  onMouseDown={handleAlphaMouseDown}
                  className="relative h-3.5 w-full rounded-full cursor-pointer shadow-inner border border-zinc-800 bg-[linear-gradient(45deg,#27272a_25%,transparent_25%),linear-gradient(-45deg,#27272a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#27272a_75%),linear-gradient(-45deg,transparent_75%,#27272a_75%)] bg-[size:8px_8px] bg-[position:0_0,0_4px,4px_-4px,-4px_0]"
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `linear-gradient(to right, transparent, rgb(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}))`,
                    }}
                  />
                  <div
                    style={{ left: `calc(${alpha * 100}% - 6px)` }}
                    className="absolute top-0 w-3 h-3.5 bg-white border-2 border-zinc-950 rounded-full shadow-md pointer-events-none"
                  />
                </div>
              </div>

              {/* Hex / RGB Input & Quick Swatch Preview */}
              <div className="flex items-center gap-2 pt-1">
                {/* Live Swatch Preview Box */}
                <div
                  className="w-9 h-9 rounded-lg border-2 border-zinc-700 shadow-inner shrink-0 relative overflow-hidden"
                  style={{
                    background: previewBg,
                  }}
                />

                {/* Hex text input */}
                <div className="flex-1 flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 font-mono text-[11px]">
                  <input
                    type="text"
                    value={hexInput}
                    onChange={(e) => handleHexChange(e.target.value)}
                    className="w-full bg-transparent focus:outline-none text-teal-300 font-bold uppercase"
                    placeholder="#14B8A6"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(hexInput);
                      setCopiedHex(true);
                      setTimeout(() => setCopiedHex(false), 1500);
                    }}
                    title="Copiar código de color"
                    className="text-zinc-500 hover:text-teal-300 p-0.5 ml-1 transition"
                  >
                    {copiedHex ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                {/* Native Eyedropper Button */}
                <button
                  onClick={handleEyeDropper}
                  title="Cuentagotas (Selector de pantalla)"
                  className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-teal-400 hover:text-teal-300 transition"
                >
                  <Pipette className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* MODE: PALETTE MANAGER */}
          {mode === 'palette' && (
            <div className="space-y-3 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
              {/* Palette Selector Header */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-teal-300">Colecciones de Estudio:</span>
                <button
                  onClick={() => setIsCreatingPalette((p) => !p)}
                  className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
                >
                  <FolderPlus className="w-3 h-3" />
                  <span>+ Nueva</span>
                </button>
              </div>

              {/* Create new palette inline form */}
              {isCreatingPalette && (
                <div className="flex items-center gap-1.5 p-1.5 bg-zinc-900 rounded border border-teal-500/40">
                  <input
                    type="text"
                    placeholder="Nombre de la paleta..."
                    value={newPaletteName}
                    onChange={(e) => setNewPaletteName(e.target.value)}
                    className="flex-1 bg-zinc-950 px-2 py-1 rounded text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                  />
                  <button
                    onClick={handleCreateNewPalette}
                    className="px-2 py-1 bg-teal-500 text-zinc-950 font-bold rounded text-[10px]"
                  >
                    Guardar
                  </button>
                </div>
              )}

              {/* Palette Dropdown Selector */}
              <select
                value={selectedPaletteId}
                onChange={(e) => setSelectedPaletteId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-teal-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer font-medium"
              >
                <optgroup label="Paletas Predeterminadas">
                  {BUILTIN_PALETTES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Mis Paletas Personalizadas">
                  {userPalettes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.colors.length})
                    </option>
                  ))}
                </optgroup>
              </select>

              {/* Swatches Grid */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>Muestras ({activePalette.colors.length}):</span>
                  {!activePalette.isBuiltIn && (
                    <button
                      onClick={() => handleDeletePalette(activePalette.id)}
                      className="text-red-400 hover:text-red-300 text-[10px] flex items-center gap-0.5"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>Eliminar paleta</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-6 gap-1.5 p-2 bg-zinc-950 rounded-lg border border-zinc-800 max-h-36 overflow-y-auto">
                  {activePalette.colors.map((c, idx) => (
                    <div key={`${c}_${idx}`} className="group relative">
                      <button
                        type="button"
                        onClick={() => handleApplyPaletteColor(c)}
                        title={c}
                        style={{ background: c }}
                        className="w-full h-7 rounded border border-zinc-700 hover:scale-105 hover:border-teal-400 transition cursor-pointer shadow-xs"
                      />
                      {!activePalette.isBuiltIn && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveColorFromPalette(activePalette.id, idx);
                          }}
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[9px]"
                          title="Eliminar de paleta"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Action Footer: Save Current Color to Palette & Transparent */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[11px]">
            <button
              onClick={() => emitColorChange('transparent')}
              className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 transition flex items-center gap-1 cursor-pointer"
              title="Establecer como transparente / sin color"
            >
              <span>Transparente</span>
            </button>

            <button
              onClick={handleSaveToPalette}
              className="px-2.5 py-1 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Guardar color o degradado actual en la paleta activa"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-teal-400" />
              <span>Guardar en Paleta</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
