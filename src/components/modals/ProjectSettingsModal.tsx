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
        title: title.trim() || 'proyecto_slow',
        width: Math.max(100, Number(width)),
        height: Math.max(100, Number(height)),
        fps: Math.max(1, Math.min(120, Number(fps))),
        totalFrames: Math.max(1, Number(totalFrames)),
        backgroundColor,
        template,
      },
      isNewProjectMode
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-teal-500 text-zinc-950 font-black flex items-center justify-center text-sm font-mono shadow-md shadow-teal-500/20">
              s
            </div>
            <div>
              <div className="font-bold text-sm text-zinc-100">
                {isNewProjectMode ? 'Crear Nuevo Documento en slow studio' : 'Propiedades de Mesa de Trabajo'}
              </div>
              <div className="text-[11px] text-zinc-500">
                Configura la resolución proporcional, fotogramas por segundo y plantilla de inicio
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Presets Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300 font-semibold text-xs">Resoluciones Predeterminadas:</label>
              <span className="text-[11px] font-mono text-teal-400">Proporcional 100%</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-teal-500/15 border-teal-500 text-teal-300 shadow-sm shadow-teal-500/10'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      {p.icon}
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                        {p.tag}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-zinc-100 truncate">{p.label}</div>
                      <div className="font-mono text-[10px] text-zinc-500 mt-0.5">{p.w} × {p.h} px</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Width & Height */}
          <div className="grid grid-cols-2 gap-3 bg-zinc-900/50 p-3.5 rounded-xl border border-zinc-800/80">
            <div className="space-y-1">
              <label className="text-zinc-400 text-[11px]">Anchura personalizada (px):</label>
              <input
                type="number"
                min={100}
                max={7680}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 font-mono text-zinc-100 focus:outline-none focus:border-teal-500"
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 font-mono text-zinc-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Speed (FPS) & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-zinc-300 font-semibold text-xs">Velocidad (FPS):</label>
              <div className="flex gap-1.5">
                {[12, 24, 30, 60].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setFps(rate)}
                    className={`flex-1 py-1.5 rounded-lg text-center font-mono text-xs border transition ${
                      fps === rate
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {rate}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px]">
                <span className="text-zinc-500">FPS exacto:</span>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="w-16 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-center text-teal-400 focus:outline-none"
                />
                <span className="text-zinc-500">fps</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-300 font-semibold text-xs">Duración (Fotogramas):</label>
              <input
                type="number"
                min={1}
                max={2000}
                value={totalFrames}
                onChange={(e) => setTotalFrames(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-zinc-100 focus:outline-none focus:border-teal-500"
              />
              <div className="text-[10px] text-zinc-500 font-mono">
                = {(totalFrames / fps).toFixed(2)} segundos a {fps} fps
              </div>
            </div>
          </div>

          {/* Template Choice if New Project */}
          {isNewProjectMode && (
            <div className="space-y-2">
              <label className="text-zinc-300 font-semibold text-xs">Contenido Inicial:</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTemplate('example')}
                  className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                    template === 'example'
                      ? 'bg-teal-500/15 border-teal-500 text-teal-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <PlayCircle className="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-xs text-zinc-100">Pelota Verde Agua (Squash & Stretch)</div>
                    <div className="text-[10px] text-zinc-500">Animación lista para reproducir y editar</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplate('blank')}
                  className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                    template === 'blank'
                      ? 'bg-teal-500/15 border-teal-500 text-teal-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <FilePlus className="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-xs text-zinc-100">Mesa en Blanco</div>
                    <div className="text-[10px] text-zinc-500">Lienzo vacío para dibujar o pedir a la IA</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Stage Background color */}
          <div className="space-y-1.5">
            <label className="text-zinc-300 font-semibold text-xs">Color del Lienzo:</label>
            <div className="flex items-center gap-3">
              <label
                className="w-8 h-8 rounded-lg border border-zinc-700 shadow cursor-pointer overflow-hidden relative"
                style={{ backgroundColor }}
              >
                <input
                  type="color"
                  value={backgroundColor.startsWith('#') ? backgroundColor : '#ffffff'}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="opacity-0 w-full h-full cursor-pointer"
                />
              </label>

              <div className="flex gap-2">
                {[
                  { name: 'Blanco', col: '#ffffff' },
                  { name: 'Oscuro', col: '#09090b' },
                  { name: 'Verde Agua', col: '#0f766e' },
                ].map((bg) => (
                  <button
                    key={bg.name}
                    type="button"
                    onClick={() => setBackgroundColor(bg.col)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[11px] text-zinc-300"
                  >
                    {bg.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center text-xs">
          <span className="text-zinc-500 text-[11px]">slow studio • Motor vectorial 1080p</span>
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
