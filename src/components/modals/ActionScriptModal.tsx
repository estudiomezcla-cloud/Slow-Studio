import React, { useState } from 'react';
import { Code, X } from 'lucide-react';

interface ActionScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode: string;
  frameNumber: number;
  onSave: (code: string) => void;
}

export const ActionScriptModal: React.FC<ActionScriptModalProps> = ({
  isOpen,
  onClose,
  initialCode,
  frameNumber,
  onSave,
}) => {
  const [code, setCode] = useState(initialCode);

  if (!isOpen) return null;

  const presets = [
    { label: 'stop();', code: 'stop();', desc: 'Detiene la reproducción en este fotograma' },
    { label: 'play();', code: 'play();', desc: 'Reanuda la animación' },
    { label: 'gotoAndPlay(1);', code: 'gotoAndPlay(1);', desc: 'Vuelve al inicio en bucle' },
    { label: 'gotoAndStop(1);', code: 'gotoAndStop(1);', desc: 'Va al primer fotograma y se detiene' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col text-zinc-200">
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-sm">
              Acciones de Fotograma (Frame {frameNumber}) - slow script
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="text-xs text-zinc-400">
            Escribe código de slow script que se ejecutará cuando el cabezal alcance este fotograma:
          </div>

          <textarea
            rows={5}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Escribe tus acciones aquí, ej:&#10;stop();"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-teal-300 focus:outline-none focus:border-teal-500"
          />

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
              Acciones Comunes:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.code}
                  onClick={() => setCode(p.code)}
                  className="p-2 rounded bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 text-left transition"
                >
                  <div className="font-mono text-teal-400 text-xs font-bold">{p.label}</div>
                  <div className="text-[10px] text-zinc-400 truncate">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-900 border-t border-zinc-800 flex justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onSave(code);
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold transition"
          >
            Guardar Acciones
          </button>
        </div>
      </div>
    </div>
  );
};
