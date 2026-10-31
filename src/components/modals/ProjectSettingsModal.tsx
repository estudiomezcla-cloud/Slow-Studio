import React, { useState } from 'react';
import {
  Settings,
  X,
  Check,
  Monitor,
  Smartphone,
  Square,
  Sparkles,
  Film,
  PlusCircle,
  FilePlus,
  PlayCircle,
  Activity,
  Layers,
  Compass,
  Grid,
} from 'lucide-react';

export interface ProjectSettings {
  title: string;
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  backgroundColor: string;
  template?: 'blank' | 'example';
}

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: ProjectSettings;
  onApplySettings: (settings: ProjectSettings, isNewProject?: boolean) => void;
  isNewProjectMode?: boolean;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onApplySettings,
  isNewProjectMode = false,
}) => {
  const [title, setTitle] = useState(currentSettings.title || 'animacion_slow_studio');
  const [width, setWidth] = useState(currentSettings.width || 1920);
  const [height, setHeight] = useState(currentSettings.height || 1080);
  const [fps, setFps] = useState(currentSettings.fps || 24);
  const [totalFrames, setTotalFrames] = useState(currentSettings.totalFrames || 48);
  const [backgroundColor, setBackgroundColor] = useState(currentSettings.backgroundColor || '#ffffff');
  const [template, setTemplate] = useState<'blank' | 'example'>('example');

  if (!isOpen) return null;

  const presets = [
    {
      label: 'Full HD 1080p (16:9)',
      desc: '1920 × 1080 px • Recomendado',
      w: 1920,
      h: 1080,
      icon: <Monitor className="w-4 h-4 text-teal-400" />,
      tag: 'Estándar',
    },
    {
      label: '4K Ultra HD (16:9)',
      desc: '3840 × 2160 px • Máxima calidad',
      w: 3840,
      h: 2160,
      icon: <Monitor className="w-4 h-4 text-emerald-400" />,
      tag: 'Ultra HD',
    },
    {
      label: 'HD 720p (16:9)',
      desc: '1280 × 720 px • Rápido',
      w: 1280,
      h: 720,
      icon: <Monitor className="w-4 h-4 text-cyan-400" />,
      tag: 'Web',
    },
    {
      label: 'Vertical 9:16 (TikTok/Reels)',
      desc: '1080 × 1920 px • Formato móvil',
      w: 1080,
      h: 1920,
      icon: <Smartphone className="w-4 h-4 text-teal-400" />,
      tag: 'Social',
    },
    {
      label: 'Cuadrado 1:1 (Post Social)',
      desc: '1080 × 1080 px • Instagram/Feed',
      w: 1080,
      h: 1080,
      icon: <Square className="w-4 h-4 text-teal-400" />,
      tag: 'Social',
    },
    {
      label: 'Clásico 4:3 (800×600)',
      desc: '800 × 600 px • Retro vector',
      w: 800,
      h: 600,
      icon: <Monitor className="w-4 h-4 text-zinc-400" />,
      tag: '4:3',
    },
  ];

  const handleApply = () => {
    onApplySettings(
      {
        title: title.trim() || 'animacion_slow_studio',
        width: Math.max(100, Math.min(7680, width)),
        height: Math.max(100, Math.min(4320, height)),
        fps: Math.max(1, Math.min(120, fps)),
        totalFrames: Math.max(1, Math.min(5000, totalFrames)),
        backgroundColor,
        template,
      },
      isNewProjectMode
    );
    onClose();
  };

  // Graphical calculations for right-side technical blueprint
  const durationSec = (totalFrames / fps).toFixed(2);
  const megapixels = ((width * height) / 1000000).toFixed(2);
  const frameTimeMs = (1000 / fps).toFixed(1);
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const aspectW = width / divisor;
  const aspectH = height / divisor;
  const aspectLabel =
    aspectW === 16 && aspectH === 9
      ? '16:9 Panorámico'
      : aspectW === 9 && aspectH === 16
      ? '9:16 Vertical Móvil'
      : aspectW === 1 && aspectH === 1
      ? '1:1 Cuadrado'
      : aspectW === 4 && aspectH === 3
      ? '4:3 Clásico'
      : `${aspectW}:${aspectH} Proporcional`;

  // Scale stage preview within right-side container (max 280x200)
  const maxBoxW = 280;
  const maxBoxH = 190;
  const previewScale = Math.min(maxBoxW / width, maxBoxH / height);
  const previewW = Math.round(width * previewScale);
  const previewH = Math.round(height * previewScale);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center font-bold">
              {isNewProjectMode ? <PlusCircle className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {isNewProjectMode ? 'Crear Nuevo Documento' : 'Configuración del Documento'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isNewProjectMode
                  ? 'Configura la mesa de trabajo vectorial en Full HD 1920×1080 o resolución personalizada'
                  : 'Modifica la resolución del lienzo, velocidad en FPS y duración'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Body: Form Settings on the Left, Technical Graphic Blueprint on the Right */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col lg:flex-row gap-6">
          {/* LEFT COLUMN: Controls & Presets */}
          <div className="flex-1 space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-zinc-300 font-semibold text-xs">Nombre del Proyecto:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="animacion_slow_studio"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Presets Grid */}
            <div className="space-y-1.5">
              <label className="text-zinc-300 font-semibold text-xs">Resolución del Escenario:</label>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((p) => {
                  const isSelected = width === p.w && height === p.h;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setWidth(p.w);
                        setHeight(p.h);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-teal-500/15 border-teal-500 text-teal-300 shadow-sm shadow-teal-500/10'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {p.icon}
                        <div>
                          <div className="font-semibold text-xs text-zinc-200">{p.label}</div>
                          <div className="text-[10px] text-zinc-500">{p.desc}</div>
                        </div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                        {p.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Width & Height Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-zinc-400 text-[11px]">Ancho personalizado (px):</label>
                <input
                  type="number"
                  min={100}
                  max={7680}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 font-mono text-zinc-100 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-400 text-[11px]">Altura personalizada (px):</label>
                <input
                  type="number"
                  min={100}
                  max={4320}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 font-mono text-zinc-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Speed (FPS) & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-semibold text-xs">Velocidad (FPS):</label>
                <div className="flex gap-1">
                  {[12, 24, 30, 60].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setFps(rate)}
                      className={`flex-1 py-1 rounded-lg text-center font-mono text-xs border transition ${
                        fps === rate
                          ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {rate}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-semibold text-xs">Duración (Frames):</label>
                <input
                  type="number"
                  min={1}
                  max={2000}
                  value={totalFrames}
                  onChange={(e) => setTotalFrames(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 font-mono text-zinc-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Template Choice if New Project */}
            {isNewProjectMode && (
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-semibold text-xs">Plantilla Inicial:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplate('example')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      template === 'example'
                        ? 'bg-teal-500/15 border-teal-500 text-teal-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <PlayCircle className="w-4 h-4 text-teal-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs text-zinc-100">Pelota Verde Agua</div>
                      <div className="text-[10px] text-zinc-500">Squash &amp; Stretch</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplate('blank')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      template === 'blank'
                        ? 'bg-teal-500/15 border-teal-500 text-teal-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <FilePlus className="w-4 h-4 text-teal-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs text-zinc-100">Mesa en Blanco</div>
                      <div className="text-[10px] text-zinc-500">Lienzo vacío para IA</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Stage Background color */}
            <div className="space-y-1">
              <label className="text-zinc-300 font-semibold text-xs">Color del Lienzo:</label>
              <div className="flex items-center gap-2">
                <label
                  className="w-7 h-7 rounded-lg border border-zinc-700 shadow cursor-pointer overflow-hidden relative"
                  style={{ backgroundColor }}
                >
                  <input
                    type="color"
                    value={backgroundColor.startsWith('#') ? backgroundColor : '#ffffff'}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="opacity-0 w-full h-full cursor-pointer"
                  />
                </label>
                <div className="flex gap-1.5">
                  {[
                    { name: 'Blanco', col: '#ffffff' },
                    { name: 'Oscuro', col: '#09090b' },
                    { name: 'Verde Agua', col: '#0f766e' },
                  ].map((bg) => (
                    <button
                      key={bg.name}
                      type="button"
                      onClick={() => setBackgroundColor(bg.col)}
                      className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[10px] text-zinc-300"
                    >
                      {bg.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Technical Vector Graphic & Blueprint Visualizer */}
          <div className="flex-1 bg-zinc-900/60 border border-zinc-800/90 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              {/* Header of the Graphic */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Gráfica del Documento
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                  {aspectLabel}
                </span>
              </div>

              {/* Graphic Blueprint Visualization Box */}
              <div className="mt-4 flex flex-col items-center justify-center p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 relative min-h-[220px]">
                {/* Rulers / Dimension tags */}
                <div className="w-full flex justify-between items-center text-[9px] font-mono text-zinc-500 mb-1 px-2">
                  <span>(0, 0)</span>
                  <span className="text-teal-400 font-bold">&larr; {width} px &rarr;</span>
                  <span>({width}, 0)</span>
                </div>

                {/* Scaled Proportional Stage Box */}
                <div
                  className="relative rounded-lg shadow-xl border-2 border-teal-400/80 transition-all flex items-center justify-center overflow-hidden"
                  style={{
                    width: `${previewW}px`,
                    height: `${previewH}px`,
                    backgroundColor,
                  }}
                >
                  {/* Subtle vector grid in preview */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle, #0d9488 1px, transparent 1px)',
                      backgroundSize: '16px 16px',
                    }}
                  />

                  {/* Center Crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-px bg-teal-500/30" />
                    <div className="h-full w-px bg-teal-500/30 absolute" />
                    <div className="w-2.5 h-2.5 rounded-full border border-teal-400/60 bg-teal-500/20 absolute" />
                  </div>

                  {/* Template graphic preview */}
                  {template === 'example' ? (
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 border border-teal-300 shadow-md animate-bounce" />
                      <div className="w-9 h-1.5 bg-zinc-800/40 rounded-full blur-[1px] mt-1" />
                    </div>
                  ) : (
                    <div className="relative z-10 text-[9px] font-mono text-zinc-400/70 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-700/50">
                      Lienzo Vacío
                    </div>
                  )}

                  {/* Resolution watermark */}
                  <span className="absolute bottom-1 right-1.5 text-[8px] font-mono text-zinc-400/80 bg-zinc-950/70 px-1 rounded">
                    {width}×{height}
                  </span>
                </div>

                <div className="w-full flex justify-between items-center text-[9px] font-mono text-zinc-500 mt-1 px-2">
                  <span className="text-teal-400 font-bold">&uarr; {height} px &darr;</span>
                  <span>Centro: ({Math.round(width / 2)}, {Math.round(height / 2)})</span>
                </div>
              </div>

              {/* Dynamic Animated Waveform & FPS Timeline Graph */}
              <div className="mt-3 bg-zinc-950/60 rounded-xl p-3 border border-zinc-800/80">
                <div className="flex justify-between items-center text-[11px] mb-2 font-mono">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Film className="w-3 h-3 text-teal-400" />
                    <span>Línea Temporal:</span>
                  </span>
                  <span className="text-teal-300 font-bold">{durationSec} s ({totalFrames} frames)</span>
                </div>

                {/* Simulated frame distribution bars */}
                <div className="h-6 flex items-end gap-0.5 w-full bg-zinc-900 rounded p-1 overflow-hidden">
                  {Array.from({ length: 32 }).map((_, i) => {
                    const heightPercent = 20 + Math.sin(i * 0.4) * 55 + (i % 4 === 0 ? 25 : 0);
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-xs transition-all ${
                          i % 8 === 0 ? 'bg-teal-300' : 'bg-teal-500/60'
                        }`}
                        style={{ height: `${Math.max(15, Math.min(100, heightPercent))}%` }}
                        title={`Frame ${Math.round((i / 32) * totalFrames)}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Technical Metrics Grid */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-mono">
              <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60">
                <span className="text-zinc-500 block">DENSIDAD:</span>
                <span className="text-teal-300 font-bold">{megapixels} MP</span>
              </div>
              <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60">
                <span className="text-zinc-500 block">CADENCIA:</span>
                <span className="text-teal-300 font-bold">{frameTimeMs} ms/f</span>
              </div>
              <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60">
                <span className="text-zinc-500 block">ESTADO:</span>
                <span className="text-emerald-400 font-bold">100% Vector</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center text-xs">
          <span className="text-zinc-500 text-[11px] font-mono">
            slow studio &bull; Motor vectorial 1920×1080
          </span>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            >
              Cerrar
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold shadow-md shadow-teal-500/20 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isNewProjectMode ? 'Crear Documento' : 'Aplicar Cambios'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
