import React from 'react';
import { FlashSymbol } from '../../types/flash';
import { Folder, Film, MousePointerClick, Image, Plus } from 'lucide-react';

interface LibraryPanelProps {
  symbols: FlashSymbol[];
  onInstantiateSymbol: (symbol: FlashSymbol) => void;
  onEditSymbol: (symbolId: string) => void;
  onCreateNewSymbol: () => void;
}

export const LibraryPanel: React.FC<LibraryPanelProps> = ({
  symbols,
  onInstantiateSymbol,
  onEditSymbol,
  onCreateNewSymbol,
}) => {
  return (
    <div className="w-64 bg-zinc-950 border-l border-zinc-800 flex flex-col h-full text-xs text-zinc-300 select-none overflow-y-auto shrink-0">
      {/* Header */}
      <div className="h-10 px-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between font-semibold text-zinc-200">
        <div className="flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5 text-teal-400" />
          <span>Biblioteca de Símbolos</span>
        </div>
        <button
          onClick={onCreateNewSymbol}
          title="Nuevo Símbolo (F8)"
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-teal-300"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Symbol List */}
      <div className="p-3 space-y-2 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
          Símbolos en slow studio
        </div>

        {symbols.length === 0 ? (
          <div className="p-4 rounded border border-dashed border-zinc-800 text-center text-zinc-600 text-xs">
            Sin símbolos. Selecciona un elemento y pulsa "Convertir en Símbolo" (F8).
          </div>
        ) : (
          symbols.map((sym) => {
            const isButton = sym.type === 'button';
            const isMovieClip = sym.type === 'movieclip';

            return (
              <div
                key={sym.id}
                className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium text-zinc-200">
                    {isButton ? (
                      <MousePointerClick className="w-3.5 h-3.5 text-teal-400" />
                    ) : isMovieClip ? (
                      <Film className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <Image className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span className="truncate max-w-[130px]">{sym.name}</span>
                  </div>
                  <span className="text-[10px] px-1 py-0.5 rounded bg-zinc-950 text-teal-400 border border-teal-500/30">
                    {sym.type === 'movieclip' ? 'MovieClip' : sym.type === 'button' ? 'Botón' : 'Gráfico'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => onInstantiateSymbol(sym)}
                    className="flex-1 py-1 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition"
                  >
                    Insertar al Escenario
                  </button>
                  <button
                    onClick={() => onEditSymbol(sym.id)}
                    title="Editar línea de tiempo interior del símbolo"
                    className="py-1 px-2 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-[11px] font-medium border border-teal-500/30 transition"
                  >
                    Editar Sub-animación
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
