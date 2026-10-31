import React, { useState } from 'react';
import { FlashDocument, FlashSymbol } from '../../types/flash';
import { countSymbolInstancesInDocument } from '../../utils/symbolUtils';
import {
  Folder,
  Film,
  MousePointerClick,
  Image,
  Plus,
  Sliders,
  Edit2,
  Trash2,
  Copy,
  Check,
  X,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface LibraryPanelProps {
  symbols: FlashSymbol[];
  document: FlashDocument;
  onInstantiateSymbol: (symbol: FlashSymbol) => void;
  onEditSymbol: (symbolId: string) => void;
  onCreateNewSymbol: () => void;
  onOpenSymbolManager: () => void;
  onRenameSymbol?: (symbolId: string, newName: string) => void;
  onDeleteSymbol?: (symbolId: string) => void;
  onDuplicateSymbol?: (symbolId: string) => void;
}

export const LibraryPanel: React.FC<LibraryPanelProps> = ({
  symbols,
  document: doc,
  onInstantiateSymbol,
  onEditSymbol,
  onCreateNewSymbol,
  onOpenSymbolManager,
  onRenameSymbol,
  onDeleteSymbol,
  onDuplicateSymbol,
}) => {
  const [editingSymbolId, setEditingSymbolId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const handleStartRename = (sym: FlashSymbol) => {
    setEditingSymbolId(sym.id);
    setEditingName(sym.name);
  };

  const handleSaveRename = (symId: string) => {
    const trimmed = editingName.trim();
    if (trimmed && onRenameSymbol) {
      onRenameSymbol(symId, trimmed);
    }
    setEditingSymbolId(null);
  };

  return (
    <div className="w-72 bg-zinc-950 border-l border-zinc-800 flex flex-col h-full text-xs text-zinc-300 select-none overflow-y-auto shrink-0">
      {/* Header */}
      <div className="h-10 px-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between font-semibold text-zinc-200">
        <div className="flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5 text-teal-400" />
          <span>Biblioteca de Símbolos</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onCreateNewSymbol}
            title="Nuevo Símbolo (F8)"
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-teal-300 transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Prominent Symbol Manager Dedicated Panel Launcher Button */}
      <div className="p-2.5 border-b border-zinc-800/80 bg-zinc-900/50">
        <button
          onClick={onOpenSymbolManager}
          className="w-full py-2 px-3 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold flex items-center justify-between transition group shadow-sm"
          title="Abrir panel dedicado de Gestión de Símbolos con previsualizador y rastreador de instancias"
        >
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
            <span>Gestión de Símbolos</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-teal-300 border border-teal-500/20">
            {symbols.length}
          </span>
        </button>
      </div>

      {/* Symbol List */}
      <div className="p-3 space-y-2.5 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
          <span>Símbolos del Proyecto</span>
          <span>{symbols.length} total</span>
        </div>

        {symbols.length === 0 ? (
          <div className="p-5 rounded-lg border border-dashed border-zinc-800 text-center text-zinc-500 text-xs space-y-2">
            <Folder className="w-6 h-6 mx-auto text-zinc-600" />
            <p>Sin símbolos en la biblioteca.</p>
            <p className="text-[11px] text-zinc-600">
              Selecciona cualquier elemento en el escenario y presiona F8 para convertirlo en Símbolo.
            </p>
          </div>
        ) : (
          symbols.map((sym) => {
            const isButton = sym.type === 'button';
            const isMovieClip = sym.type === 'movieclip';
            const isEditing = editingSymbolId === sym.id;
            const stats = countSymbolInstancesInDocument(doc, sym.id);

            return (
              <div
                key={sym.id}
                className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 transition space-y-2"
              >
                {/* Title and Badge */}
                <div className="flex items-center justify-between gap-1">
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(sym.id);
                          if (e.key === 'Escape') setEditingSymbolId(null);
                        }}
                        autoFocus
                        className="w-full bg-zinc-950 border border-teal-500 text-white px-1.5 py-0.5 rounded text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveRename(sym.id)}
                        className="p-1 rounded bg-teal-500 text-zinc-950 hover:bg-teal-400"
                        title="Guardar nombre"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingSymbolId(null)}
                        className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
                        title="Cancelar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 font-medium text-zinc-200 truncate">
                        {isButton ? (
                          <MousePointerClick className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : isMovieClip ? (
                          <Film className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        ) : (
                          <Image className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className="truncate max-w-[110px]" title={sym.name}>
                          {sym.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Instance Counter Badge */}
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            stats.total > 0
                              ? 'bg-teal-950 text-teal-300 border border-teal-500/30 font-semibold'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                          title={`${stats.total} instancias en el proyecto`}
                        >
                          {stats.total} inst.
                        </span>

                        {/* Inline Actions */}
                        <button
                          onClick={() => handleStartRename(sym)}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-teal-300 transition"
                          title="Renombrar símbolo"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        {onDuplicateSymbol && (
                          <button
                            onClick={() => onDuplicateSymbol(sym.id)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-teal-300 transition"
                            title="Duplicar símbolo"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}

                        {onDeleteSymbol && (
                          <button
                            onClick={() => onDeleteSymbol(sym.id)}
                            className="p-1 rounded hover:bg-red-950/80 text-zinc-500 hover:text-red-400 transition"
                            title="Eliminar símbolo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtitle info: type + frames */}
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span className="capitalize">{sym.type === 'movieclip' ? 'MovieClip' : sym.type === 'button' ? 'Botón' : 'Gráfico'}</span>
                  <span>{sym.layers.length} capas • {sym.totalFrames || 24}f</span>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => onInstantiateSymbol(sym)}
                    className="flex-1 py-1 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition cursor-pointer"
                    title="Insertar instancia en el escenario"
                  >
                    Insertar
                  </button>
                  <button
                    onClick={() => onEditSymbol(sym.id)}
                    title="Editar línea de tiempo interior del símbolo"
                    className="py-1 px-2 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-[11px] font-medium border border-teal-500/30 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Editar</span>
                    <ExternalLink className="w-2.5 h-2.5 text-teal-400" />
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
