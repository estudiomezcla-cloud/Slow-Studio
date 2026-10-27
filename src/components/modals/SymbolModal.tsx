import React, { useState } from 'react';
import { FolderPlus, X, Film, MousePointerClick, Image } from 'lucide-react';
import { RegistrationPoint } from '../../types/flash';

interface SymbolModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultName: string;
  onConfirm: (name: string, type: 'movieclip' | 'button' | 'graphic', regPoint?: RegistrationPoint) => void;
}

export const SymbolModal: React.FC<SymbolModalProps> = ({
  isOpen,
  onClose,
  defaultName,
  onConfirm,
}) => {
  const [name, setName] = useState(defaultName || 'Simbolo 1');
  const [type, setType] = useState<'movieclip' | 'button' | 'graphic'>('movieclip');
  const [regPoint, setRegPoint] = useState<RegistrationPoint>('center');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col text-zinc-200">
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-sm">Convertir en Símbolo (F8)</span>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400">Nombre del Símbolo:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Tipo de Comportamiento:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('movieclip')}
                className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center gap-1.5 ${
                  type === 'movieclip'
                    ? 'bg-teal-500/10 border-teal-500 text-teal-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Film className="w-4 h-4" />
                <span className="text-[11px] font-medium">MovieClip</span>
              </button>

              <button
                type="button"
                onClick={() => setType('button')}
                className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center gap-1.5 ${
                  type === 'button'
                    ? 'bg-teal-500/10 border-teal-500 text-teal-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MousePointerClick className="w-4 h-4" />
                <span className="text-[11px] font-medium">Botón</span>
              </button>

              <button
                type="button"
                onClick={() => setType('graphic')}
                className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center gap-1.5 ${
                  type === 'graphic'
                    ? 'bg-teal-500/10 border-teal-500 text-teal-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Image className="w-4 h-4" />
                <span className="text-[11px] font-medium">Gráfico</span>
              </button>
            </div>
            {type === 'movieclip' && (
              <p className="text-[11px] text-zinc-500">
                Los MovieClips tienen su propia sub-línea de tiempo interna independiente que puedes editar haciendo doble clic.
              </p>
            )}
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
              if (name.trim()) {
                onConfirm(name.trim(), type, regPoint);
                onClose();
              }
            }}
            className="px-4 py-1.5 rounded bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold transition"
          >
            Crear Símbolo
          </button>
        </div>
      </div>
    </div>
  );
};
