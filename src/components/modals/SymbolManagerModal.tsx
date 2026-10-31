import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FlashDocument, FlashElement, FlashSymbol } from '../../types/flash';
import {
  SymbolInstanceLocation,
  countSymbolInstancesInDocument,
  calculateSymbolBoundingBox,
} from '../../utils/symbolUtils';
import { getLayerElementsAtFrame } from '../../utils/interpolation';
import { resolveCanvasFill } from '../../utils/colorUtils';
import { playButtonClick } from '../../utils/audio';
import {
  X,
  Folder,
  Film,
  MousePointerClick,
  Image,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Play,
  Pause,
  RotateCcw,
  Search,
  Eye,
  Maximize2,
  Check,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface SymbolManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: FlashDocument;
  onRenameSymbol: (symbolId: string, newName: string) => void;
  onDeleteSymbol: (symbolId: string, mode: 'cascade' | 'breakApart') => void;
  onDuplicateSymbol: (symbolId: string) => void;
  onInstantiateSymbol: (symbol: FlashSymbol) => void;
  onEditSymbolTimeline: (symbolId: string) => void;
  onCreateNewSymbol: () => void;
  onJumpToInstance?: (location: SymbolInstanceLocation) => void;
}

export const SymbolManagerModal: React.FC<SymbolManagerModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onRenameSymbol,
  onDeleteSymbol,
  onDuplicateSymbol,
  onInstantiateSymbol,
  onEditSymbolTimeline,
  onCreateNewSymbol,
  onJumpToInstance,
}) => {
  const [selectedSymbolId, setSelectedSymbolId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'movieclip' | 'button' | 'graphic'>('all');

  // Preview State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [previewFrame, setPreviewFrame] = useState<number>(1);
  const [previewButtonState, setPreviewButtonState] = useState<'up' | 'over' | 'down' | 'hit'>('up');
  const [previewZoom, setPreviewZoom] = useState<'fit' | '100' | '150'>('fit');
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Rename Inline State
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [renameValue, setRenameValue] = useState<string>('');

  // Delete Confirmation State
  const [deleteConfirmSymbol, setDeleteConfirmSymbol] = useState<{
    symbol: FlashSymbol;
    instanceCount: number;
  } | null>(null);

  // Auto-select first symbol if none selected or if selected removed
  useEffect(() => {
    if (!isOpen) return;
    if (doc.symbols.length > 0) {
      const exists = doc.symbols.some((s) => s.id === selectedSymbolId);
      if (!selectedSymbolId || !exists) {
        setSelectedSymbolId(doc.symbols[0].id);
      }
    } else {
      setSelectedSymbolId('');
    }
  }, [isOpen, doc.symbols, selectedSymbolId]);

  const selectedSymbol = doc.symbols.find((s) => s.id === selectedSymbolId) || doc.symbols[0] || null;

  // Sync rename input when selected symbol changes
  useEffect(() => {
    if (selectedSymbol) {
      setRenameValue(selectedSymbol.name);
      setIsRenaming(false);
      setPreviewFrame(1);
    }
  }, [selectedSymbol?.id, selectedSymbol?.name]);

  // Instance Stats for all symbols (cached per render)
  const instanceStats = selectedSymbol
    ? countSymbolInstancesInDocument(doc, selectedSymbol.id)
    : { total: 0, locations: [] };

  // Filtered symbols
  const filteredSymbols = doc.symbols.filter((sym) => {
    const matchesSearch = sym.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesType = typeFilter === 'all' || sym.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // MovieClip loop animation timer
  useEffect(() => {
    if (!isOpen || !selectedSymbol || selectedSymbol.type !== 'movieclip' || !isPlaying) return;

    const totalFrames = selectedSymbol.totalFrames || 24;
    const fps = doc.fps || 24;
    const intervalMs = 1000 / fps;

    const timer = setInterval(() => {
      setPreviewFrame((prev) => (prev >= totalFrames ? 1 : prev + 1));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isOpen, selectedSymbol, isPlaying, doc.fps]);

  // Render canvas preview of the selected symbol
  const renderPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !selectedSymbol) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;

    // Clear background with dark checkerboard pattern
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, cw, ch);

    // Subtle grid pattern
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < cw; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ch);
      ctx.stroke();
    }
    for (let y = 0; y < ch; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }

    // Determine elements to draw for current frame or button state
    let elementsToDraw: FlashElement[] = [];

    if (selectedSymbol.type === 'button') {
      if (selectedSymbol.buttonStates && selectedSymbol.buttonStates[previewButtonState]) {
        elementsToDraw = selectedSymbol.buttonStates[previewButtonState];
      } else if (selectedSymbol.layers.length > 0) {
        // Fallback to layers at frame 1
        elementsToDraw = selectedSymbol.layers.flatMap((l) =>
          l.visible ? getLayerElementsAtFrame(l, 1) : []
        );
      }
    } else {
      // MovieClip or Graphic
      elementsToDraw = selectedSymbol.layers.flatMap((l) =>
        l.visible ? getLayerElementsAtFrame(l, previewFrame) : []
      );
    }

    // Calculate bounds of elements to center and scale preview
    const bounds = calculateSymbolBoundingBox(selectedSymbol, previewFrame);

    ctx.save();

    // Scale calculation
    let scale = 1;
    if (previewZoom === 'fit') {
      const padding = 40;
      const scaleX = (cw - padding) / Math.max(50, bounds.width);
      const scaleY = (ch - padding) / Math.max(50, bounds.height);
      scale = Math.min(scaleX, scaleY, 2.5); // cap zoom
    } else if (previewZoom === '100') {
      scale = 1;
    } else if (previewZoom === '150') {
      scale = 1.5;
    }

    // Translate center of symbol to center of canvas
    ctx.translate(cw / 2, ch / 2);
    ctx.scale(scale, scale);
    ctx.translate(-bounds.centerX, -bounds.centerY);

    // Draw origin axes crosshair lightly
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.25)';
    ctx.lineWidth = 1 / scale;
    ctx.beginPath();
    ctx.moveTo(bounds.centerX - 30, bounds.centerY);
    ctx.lineTo(bounds.centerX + 30, bounds.centerY);
    ctx.moveTo(bounds.centerX, bounds.centerY - 30);
    ctx.lineTo(bounds.centerX, bounds.centerY + 30);
    ctx.stroke();

    // Draw elements
    const drawSimpleElement = (el: FlashElement) => {
      if (el.opacity <= 0) return;
      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;

      const cx = el.shapeType === 'circle' || el.shapeType === 'star' ? el.x : el.x + el.width / 2;
      const cy = el.shapeType === 'circle' || el.shapeType === 'star' ? el.y : el.y + el.height / 2;

      ctx.translate(cx, cy);
      if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.scale(el.scaleX ?? 1, el.scaleY ?? 1);
      ctx.translate(-cx, -cy);

      if (el.type === 'group' && el.children) {
        el.children.forEach(drawSimpleElement);
        ctx.restore();
        return;
      }

      ctx.fillStyle = resolveCanvasFill(ctx, el.fill, el);
      ctx.strokeStyle = resolveCanvasFill(ctx, el.stroke, el);
      ctx.lineWidth = el.strokeWidth || 1;

      if (el.shapeType === 'rect') {
        ctx.fillRect(el.x, el.y, el.width, el.height);
        if (el.strokeWidth > 0 && el.stroke !== 'transparent') {
          ctx.strokeRect(el.x, el.y, el.width, el.height);
        }
      } else if (el.shapeType === 'circle') {
        ctx.beginPath();
        const rx = Math.abs(el.width / 2);
        const ry = Math.abs(el.height / 2);
        ctx.ellipse(el.x, el.y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        if (el.strokeWidth > 0 && el.stroke !== 'transparent') ctx.stroke();
      } else if (el.shapeType === 'star') {
        ctx.beginPath();
        const spikes = 5;
        const outer = el.width / 2;
        const inner = outer / 2.5;
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;
        ctx.moveTo(el.x, el.y - outer);
        for (let i = 0; i < spikes; i++) {
          let x = el.x + Math.cos(rot) * outer;
          let y = el.y + Math.sin(rot) * outer;
          ctx.lineTo(x, y);
          rot += step;
          x = el.x + Math.cos(rot) * inner;
          y = el.y + Math.sin(rot) * inner;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.closePath();
        ctx.fill();
        if (el.strokeWidth > 0 && el.stroke !== 'transparent') ctx.stroke();
      } else if (el.shapeType === 'path' && el.points && el.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      } else if (el.type === 'text') {
        ctx.font = `${el.fontSize || 24}px sans-serif`;
        ctx.fillStyle = el.fill || '#14b8a6';
        ctx.fillText(el.text || 'Texto', el.x, el.y + (el.fontSize || 24));
      }

      ctx.restore();
    };

    elementsToDraw.forEach(drawSimpleElement);

    ctx.restore();
  }, [selectedSymbol, previewFrame, previewButtonState, previewZoom]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  if (!isOpen) return null;

  const handleCommitRename = () => {
    if (!selectedSymbol) return;
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== selectedSymbol.name) {
      onRenameSymbol(selectedSymbol.id, trimmed);
    }
    setIsRenaming(false);
  };

  const handleStartDelete = (sym: FlashSymbol) => {
    const stats = countSymbolInstancesInDocument(doc, sym.id);
    setDeleteConfirmSymbol({
      symbol: sym,
      instanceCount: stats.total,
    });
  };

  const handleExecuteDelete = (mode: 'cascade' | 'breakApart') => {
    if (!deleteConfirmSymbol) return;
    onDeleteSymbol(deleteConfirmSymbol.symbol.id, mode);
    setDeleteConfirmSymbol(null);
    playButtonClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden text-zinc-200">
        {/* Header */}
        <div className="h-14 px-5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Gestión de Símbolos • Biblioteca
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-teal-400 border border-teal-500/30">
                  {doc.symbols.length} {doc.symbols.length === 1 ? 'símbolo' : 'símbolos'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Previsualiza MovieClips, rastrea instancias en escenas y administra tu biblioteca.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onCreateNewSymbol();
              }}
              className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Símbolo (F8)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Symbol List + Right Symbol Inspector/Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Symbol Browser & Search Filter */}
          <div className="w-80 bg-zinc-900/40 border-r border-zinc-800 flex flex-col shrink-0">
            {/* Search and Filters */}
            <div className="p-3 border-b border-zinc-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar símbolo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500/60"
                />
              </div>

              {/* Type Filter Chips */}
              <div className="flex items-center gap-1 text-[10px]">
                {(
                  [
                    { id: 'all', label: 'Todos' },
                    { id: 'movieclip', label: 'MovieClips' },
                    { id: 'button', label: 'Botones' },
                    { id: 'graphic', label: 'Gráficos' },
                  ] as const
                ).map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setTypeFilter(chip.id)}
                    className={`px-2 py-0.5 rounded transition ${
                      typeFilter === chip.id
                        ? 'bg-teal-500 text-zinc-950 font-bold'
                        : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-400'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List of symbols */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredSymbols.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                    <Folder className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-zinc-400 font-medium">No se encontraron símbolos</p>
                  <p className="text-[11px] text-zinc-500">
                    {searchQuery ? 'Prueba con otra búsqueda' : 'Convierte vectores en símbolos usando F8.'}
                  </p>
                </div>
              ) : (
                filteredSymbols.map((sym) => {
                  const isSelected = selectedSymbol?.id === sym.id;
                  const stats = countSymbolInstancesInDocument(doc, sym.id);

                  return (
                    <div
                      key={sym.id}
                      onClick={() => {
                        setSelectedSymbolId(sym.id);
                        playButtonClick();
                      }}
                      className={`p-2.5 rounded-lg border transition cursor-pointer ${
                        isSelected
                          ? 'bg-teal-500/10 border-teal-500/50 shadow-sm'
                          : 'bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          {sym.type === 'movieclip' ? (
                            <Film className={`w-4 h-4 shrink-0 ${isSelected ? 'text-teal-400' : 'text-cyan-400'}`} />
                          ) : sym.type === 'button' ? (
                            <MousePointerClick
                              className={`w-4 h-4 shrink-0 ${isSelected ? 'text-teal-400' : 'text-emerald-400'}`}
                            />
                          ) : (
                            <Image className={`w-4 h-4 shrink-0 ${isSelected ? 'text-teal-400' : 'text-amber-400'}`} />
                          )}
                          <span className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                            {sym.name}
                          </span>
                        </div>

                        {/* Instance Count Badge */}
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                            stats.total > 0
                              ? 'bg-teal-950/80 text-teal-300 border border-teal-500/40'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                          title={`${stats.total} instancias en el proyecto`}
                        >
                          {stats.total} inst.
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 mt-1 border-t border-zinc-800/40">
                        <span className="capitalize">
                          {sym.type === 'movieclip' ? 'MovieClip' : sym.type === 'button' ? 'Botón' : 'Gráfico'}
                        </span>
                        <span>
                          {sym.layers.length} {sym.layers.length === 1 ? 'capa' : 'capas'} • {sym.totalFrames || 24}f
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Detailed Symbol Inspector & Canvas Preview */}
          {selectedSymbol ? (
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Symbol Header & Renaming Bar */}
              <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 max-w-lg">
                  {isRenaming ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCommitRename();
                          if (e.key === 'Escape') setIsRenaming(false);
                        }}
                        autoFocus
                        className="bg-zinc-950 border border-teal-500 rounded px-2.5 py-1 text-sm text-white font-semibold focus:outline-none flex-1"
                      />
                      <button
                        onClick={handleCommitRename}
                        className="p-1.5 rounded bg-teal-500 text-zinc-950 hover:bg-teal-400 font-bold"
                        title="Guardar nombre"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsRenaming(false)}
                        className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-white"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                        <span>{selectedSymbol.name}</span>
                      </h3>
                      <button
                        onClick={() => {
                          setRenameValue(selectedSymbol.name);
                          setIsRenaming(true);
                        }}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-teal-300 transition"
                        title="Renombrar símbolo directamente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-teal-300 border border-teal-500/30 uppercase font-mono tracking-wider">
                    {selectedSymbol.type}
                  </span>
                </div>

                {/* Primary Actions for Selected Symbol */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onInstantiateSymbol(selectedSymbol);
                      playButtonClick();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Crear una nueva instancia en el centro del escenario actual"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insertar al Escenario</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onEditSymbolTimeline(selectedSymbol.id);
                      playButtonClick();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Abrir la línea de tiempo interior del símbolo para editar sus fotogramas y vectores"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                    <span>Editar Sub-animación</span>
                  </button>

                  <button
                    onClick={() => {
                      onDuplicateSymbol(selectedSymbol.id);
                      playButtonClick();
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-teal-300 transition"
                    title="Duplicar símbolo en la biblioteca"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleStartDelete(selectedSymbol)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 transition"
                    title="Eliminar símbolo de la biblioteca"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Preview and Instances Container */}
              <div className="flex-1 p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto">
                {/* PREVIEW CANVAS COLUMN (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-teal-400" />
                      <span>Previsualización en Tiempo Real</span>
                    </span>

                    {/* Zoom / Scaling control */}
                    <div className="flex items-center gap-1 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800 text-[10px]">
                      {(['fit', '100', '150'] as const).map((z) => (
                        <button
                          key={z}
                          onClick={() => setPreviewZoom(z)}
                          className={`px-1.5 py-0.5 rounded ${
                            previewZoom === z
                              ? 'bg-teal-500 text-zinc-950 font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {z === 'fit' ? 'Ajustar' : `${z}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Canvas Viewport */}
                  <div className="relative aspect-[16/10] bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-inner flex items-center justify-center">
                    <canvas
                      ref={previewCanvasRef}
                      width={560}
                      height={350}
                      className="block w-full h-full object-contain"
                    />

                    {/* Overlay info */}
                    <div className="absolute top-2.5 left-3 px-2 py-0.5 rounded bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-zinc-400 pointer-events-none">
                      {selectedSymbol.type === 'movieclip'
                        ? `Frame ${previewFrame} / ${selectedSymbol.totalFrames || 24}`
                        : selectedSymbol.type === 'button'
                        ? `Estado: ${previewButtonState}`
                        : `Gráfico`}
                    </div>
                  </div>

                  {/* Playback & Scrubbing Controls */}
                  {selectedSymbol.type === 'movieclip' ? (
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setIsPlaying((p) => !p)}
                            className="p-1.5 rounded bg-teal-500 text-zinc-950 hover:bg-teal-400 font-bold transition"
                            title={isPlaying ? 'Pausar' : 'Reproducir MovieClip'}
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => {
                              setIsPlaying(false);
                              setPreviewFrame(1);
                            }}
                            className="p-1.5 rounded bg-zinc-800 text-zinc-300 hover:text-white transition"
                            title="Volver al frame 1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-[11px] text-zinc-300 ml-1">
                            {previewFrame} / {selectedSymbol.totalFrames || 24}
                          </span>
                        </div>

                        <span className="text-[11px] text-zinc-400 font-mono">
                          {doc.fps} FPS • Loop Activo
                        </span>
                      </div>

                      {/* Frame scrubber range slider */}
                      <input
                        type="range"
                        min="1"
                        max={selectedSymbol.totalFrames || 24}
                        value={previewFrame}
                        onChange={(e) => {
                          setIsPlaying(false);
                          setPreviewFrame(Number(e.target.value));
                        }}
                        className="w-full accent-teal-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>
                  ) : selectedSymbol.type === 'button' ? (
                    /* Button state switcher */
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5 flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-medium">Estado del Botón:</span>
                      <div className="flex items-center gap-1">
                        {(
                          [
                            { id: 'up', label: 'Reposo (Up)' },
                            { id: 'over', label: 'Sobre (Over)' },
                            { id: 'down', label: 'Presionado (Down)' },
                            { id: 'hit', label: 'Zona Activa (Hit)' },
                          ] as const
                        ).map((state) => (
                          <button
                            key={state.id}
                            onClick={() => setPreviewButtonState(state.id)}
                            className={`px-2 py-1 rounded text-[11px] transition ${
                              previewButtonState === state.id
                                ? 'bg-teal-500 text-zinc-950 font-bold'
                                : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300'
                            }`}
                          >
                            {state.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5 text-center text-xs text-zinc-400">
                      Símbolo Gráfico estático
                    </div>
                  )}
                </div>

                {/* INSTANCE MANAGER & STATS COLUMN (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col space-y-4">
                  {/* Instance Statistics Card */}
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-teal-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Instancias en el Proyecto
                        </h4>
                      </div>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                          instanceStats.total > 0
                            ? 'bg-teal-500 text-zinc-950 shadow-sm shadow-teal-500/20'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {instanceStats.total} {instanceStats.total === 1 ? 'instancia' : 'instancias'}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {instanceStats.total > 0
                        ? `Hay ${instanceStats.total} apariciones activas de este símbolo en las líneas de tiempo del proyecto:`
                        : 'Este símbolo no tiene instancias activas en el escenario actualmente.'}
                    </p>

                    {/* Instance Location List */}
                    {instanceStats.total > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {instanceStats.locations.map((loc, idx) => (
                          <div
                            key={loc.id || idx}
                            className="p-2 rounded bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs group hover:border-teal-500/40 transition"
                          >
                            <div className="space-y-0.5 truncate">
                              <div className="flex items-center gap-1.5 font-medium text-zinc-200 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                                <span className="truncate">{loc.containerName}</span>
                                <span className="text-zinc-600">•</span>
                                <span className="text-zinc-400 truncate">{loc.layerName}</span>
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono">
                                Fotograma {loc.frame} • Posición ({loc.x}, {loc.y})
                              </div>
                            </div>

                            {onJumpToInstance && (
                              <button
                                onClick={() => {
                                  onJumpToInstance(loc);
                                  onClose();
                                  playButtonClick();
                                }}
                                className="px-2 py-1 rounded bg-zinc-800 hover:bg-teal-500 hover:text-zinc-950 text-zinc-300 text-[10px] font-medium flex items-center gap-1 shrink-0 transition"
                                title="Seleccionar y centrar esta instancia en el escenario"
                              >
                                <span>Ver</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg border border-dashed border-zinc-800 text-center space-y-1.5">
                        <Sparkles className="w-4 h-4 text-zinc-600 mx-auto" />
                        <span className="text-[11px] text-zinc-500 block">
                          Pulsa "Insertar al Escenario" para usarlo en la animación.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Symbol Metadata Details */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2.5 text-xs">
                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Detalles Técnicos
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                        <span className="text-zinc-500 block text-[10px]">Capas Internas:</span>
                        <span className="text-teal-300 font-bold">{selectedSymbol.layers.length}</span>
                      </div>
                      <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                        <span className="text-zinc-500 block text-[10px]">Duración:</span>
                        <span className="text-teal-300 font-bold">{selectedSymbol.totalFrames || 24} frames</span>
                      </div>
                      <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80 col-span-2">
                        <span className="text-zinc-500 block text-[10px]">ID de Biblioteca:</span>
                        <span className="text-zinc-400 text-[10px] truncate block">{selectedSymbol.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs">
              Selecciona o crea un símbolo para comenzar.
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {deleteConfirmSymbol && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-100">
            <div className="bg-zinc-900 border border-red-500/40 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-red-400">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Eliminar Símbolo "{deleteConfirmSymbol.symbol.name}"
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Esta acción eliminará el símbolo de la biblioteca.
                  </p>
                </div>
              </div>

              {deleteConfirmSymbol.instanceCount > 0 ? (
                <div className="space-y-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs">
                  <p className="text-amber-300 font-medium">
                    ⚠️ Este símbolo tiene {deleteConfirmSymbol.instanceCount}{' '}
                    {deleteConfirmSymbol.instanceCount === 1 ? 'instancia activa' : 'instancias activas'}{' '}
                    en el proyecto.
                  </p>
                  <p className="text-zinc-400 text-[11px]">
                    ¿Cómo deseas proceder con las instancias existentes en el escenario?
                  </p>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => handleExecuteDelete('cascade')}
                      className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center justify-between transition cursor-pointer"
                    >
                      <span>Eliminar símbolo y todas sus instancias</span>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleExecuteDelete('breakApart')}
                      className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-between transition cursor-pointer"
                    >
                      <span>Desarmar en vectores simples (Break Apart)</span>
                      <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-400">
                  Este símbolo no tiene instancias en el escenario y puede eliminarse con total seguridad.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmSymbol(null)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                {deleteConfirmSymbol.instanceCount === 0 && (
                  <button
                    onClick={() => handleExecuteDelete('cascade')}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Eliminar Símbolo
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
