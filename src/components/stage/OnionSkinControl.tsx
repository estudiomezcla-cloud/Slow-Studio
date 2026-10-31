import React from 'react';
import { OnionSkinMode, OnionSkinSettings } from '../../types/flash';
import { Eye, Layers, Sliders, X, Check, Palette, Sparkles } from 'lucide-react';

interface OnionSkinControlProps {
  settings: OnionSkinSettings;
  onUpdateSettings: (settings: OnionSkinSettings) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const OnionSkinControl: React.FC<OnionSkinControlProps> = ({
  settings,
  onUpdateSettings,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const pastColorPresets = ['#14b8a6', '#ef4444', '#f59e0b', '#a855f7'];
  const futureColorPresets = ['#38bdf8', '#10b981', '#3b82f6', '#ec4899'];

  return (
    <div className="absolute top-12 left-4 z-40 w-84 bg-zinc-950/95 border border-zinc-800 hover:border-teal-500/40 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col text-zinc-200 text-xs">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-teal-400" />
          <span className="font-semibold text-zinc-100">Papel Cebolla Avanzado (Ghosting)</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:text-white text-zinc-400 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3.5 space-y-3.5">
        {/* Master On/Off Switch */}
        <div className="flex items-center justify-between bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
          <div>
            <div className="font-semibold text-zinc-200">Activar Papel Cebolla</div>
            <div className="text-[10px] text-zinc-400">
              Visualiza fotogramas adyacentes como siluetas
            </div>
          </div>
          <button
            onClick={() => onUpdateSettings({ ...settings, enabled: !settings.enabled })}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
              settings.enabled
                ? 'bg-teal-500 text-zinc-950 shadow-md shadow-teal-500/20'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
            }`}
          >
            {settings.enabled ? 'Activado' : 'Desactivado'}
          </button>
        </div>

        {/* Ghosting Mode Selector */}
        <div>
          <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1.5 tracking-wider">
            Modo de Ghosting
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onUpdateSettings({ ...settings, mode: 'all' })}
              className={`py-2 px-2 rounded-lg border text-center transition ${
                settings.mode === 'all'
                  ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                  : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              <div className="text-[11px]">Todos</div>
              <div className="text-[9px] text-zinc-500">Antes y después</div>
            </button>
            <button
              onClick={() => onUpdateSettings({ ...settings, mode: 'prev' })}
              className={`py-2 px-2 rounded-lg border text-center transition ${
                settings.mode === 'prev'
                  ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                  : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              <div className="text-[11px]">Anterior</div>
              <div className="text-[9px] text-zinc-500">Fotograma previo</div>
            </button>
            <button
              onClick={() => onUpdateSettings({ ...settings, mode: 'next' })}
              className={`py-2 px-2 rounded-lg border text-center transition ${
                settings.mode === 'next'
                  ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                  : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              <div className="text-[11px]">Siguiente</div>
              <div className="text-[9px] text-zinc-500">Fotograma futuro</div>
            </button>
          </div>
        </div>

        {/* Opacity Slider */}
        <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-zinc-300 font-medium">Opacidad del Ghosting:</span>
            <span className="font-mono text-teal-400 font-bold">
              {Math.round(settings.baseOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={0.9}
            step={0.05}
            value={settings.baseOpacity}
            onChange={(e) =>
              onUpdateSettings({ ...settings, baseOpacity: parseFloat(e.target.value) })
            }
            className="w-full accent-teal-400 cursor-pointer"
          />
        </div>

        {/* Frames Range Count */}
        {settings.mode === 'all' && (
          <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">
                Frames Previos: <span className="text-teal-400 font-bold">{settings.pastFramesCount}</span>
              </label>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={settings.pastFramesCount}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    pastFramesCount: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-teal-400 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">
                Frames Siguientes: <span className="text-cyan-400 font-bold">{settings.futureFramesCount}</span>
              </label>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={settings.futureFramesCount}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    futureFramesCount: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Color Coding Indicators */}
        <div className="space-y-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3 h-3 text-teal-400" />
            <span>Código de Color (Color-Coding)</span>
          </div>

          {/* Past frames color */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-300">Fotogramas Anteriores:</span>
            <div className="flex items-center gap-1.5">
              {pastColorPresets.map((c) => (
                <button
                  key={c}
                  onClick={() => onUpdateSettings({ ...settings, pastColor: c })}
                  className={`w-4 h-4 rounded-full border transition ${
                    settings.pastColor === c
                      ? 'border-white scale-110 shadow-sm'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Future frames color */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-300">Fotogramas Siguientes:</span>
            <div className="flex items-center gap-1.5">
              {futureColorPresets.map((c) => (
                <button
                  key={c}
                  onClick={() => onUpdateSettings({ ...settings, futureColor: c })}
                  className={`w-4 h-4 rounded-full border transition ${
                    settings.futureColor === c
                      ? 'border-white scale-110 shadow-sm'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
