import React, { useState } from 'react';
import {
  Image,
  X,
  Sparkles,
  Layers,
  Lock,
  Check,
  Search,
  Filter,
  Palette,
  ArrowDownToLine,
  Sliders,
} from 'lucide-react';
import { BACKGROUND_PRESETS, BackgroundPreset } from '../../utils/backgroundPresets';

interface BackgroundLayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (
    presetId: string,
    options: { placeAtBottom: boolean; autoLock: boolean; customColor?: string }
  ) => void;
  stageWidth: number;
  stageHeight: number;
}

export const BackgroundLayerModal: React.FC<BackgroundLayerModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  stageWidth,
  stageHeight,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('sunset');
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [placeAtBottom, setPlaceAtBottom] = useState<boolean>(true);
  const [autoLock, setAutoLock] = useState<boolean>(true);
  const [customColor, setCustomColor] = useState<string>('#0f172a');

  if (!isOpen) return null;

  const categories = ['Todos', 'Cinemático', 'Naturaleza', 'Retro', 'Estudio', 'Técnico'];

  const filteredPresets = BACKGROUND_PRESETS.filter((p) => {
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleApply = () => {
    onSelectPreset(selectedPresetId, {
      placeAtBottom,
      autoLock,
      customColor: selectedPresetId === 'custom' ? customColor : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center">
              <Image className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Crear Capa de Fondo (Background Layer)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono font-medium">
                  {stageWidth} × {stageHeight} px
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Selecciona un estilo de fondo vectorial preconfigurado para tu animación
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

        {/* Filter bar & Search */}
        <div className="px-5 py-3 border-b border-zinc-800/80 bg-zinc-900/30 flex flex-wrap items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer shrink-0 ${
                  activeCategory === cat
                    ? 'bg-teal-500 text-zinc-950 font-semibold shadow-sm shadow-teal-500/20'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar estilo de fondo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Main Grid: Presets */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPresets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => setSelectedPresetId(preset.id)}
                className={`group relative rounded-xl border p-3 flex flex-col justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-zinc-900/90 border-teal-500 ring-2 ring-teal-500/40 shadow-lg shadow-teal-500/10'
                    : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70'
                }`}
              >
                {/* Visual Thumbnail Card */}
                <div
                  className="w-full h-28 rounded-lg mb-2.5 relative overflow-hidden border border-zinc-700/50 flex items-end p-2 shadow-inner"
                  style={{ background: preset.thumbnailBg }}
                >
                  {/* Category Pill */}
                  <span className="absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-mono uppercase tracking-wider font-semibold border border-white/10">
                    {preset.category}
                  </span>

                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-teal-500 text-zinc-950 flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Proportional Stage Preview Label */}
                  <span className="text-[10px] text-white/80 font-mono drop-shadow-md">
                    16:9 Vector
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-xs text-white group-hover:text-teal-300 transition">
                    {preset.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-zinc-800/60">
                  {preset.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-950/70 text-zinc-400 font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Layer Configuration Footer */}
        <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-4">
          {/* Options */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={placeAtBottom}
                onChange={(e) => setPlaceAtBottom(e.target.checked)}
                className="rounded bg-zinc-800 border-zinc-700 text-teal-500 focus:ring-teal-500"
              />
              <span className="flex items-center gap-1">
                <ArrowDownToLine className="w-3.5 h-3.5 text-teal-400" />
                <span>Colocar al fondo del todo (Capa 0)</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoLock}
                onChange={(e) => setAutoLock(e.target.checked)}
                className="rounded bg-zinc-800 border-zinc-700 text-teal-500 focus:ring-teal-500"
              />
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Bloquear capa automáticamente</span>
              </span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-zinc-950 flex items-center gap-2 shadow-lg shadow-teal-500/20 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Insertar Capa de Fondo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
