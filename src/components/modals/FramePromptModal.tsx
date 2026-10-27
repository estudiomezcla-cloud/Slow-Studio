import React, { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';

interface FramePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  frameNumber: number;
  initialPrompt: string;
  onApplyPrompt: (prompt: string, shouldGenerateWithAi: boolean) => Promise<void> | void;
}

export const FramePromptModal: React.FC<FramePromptModalProps> = ({
  isOpen,
  onClose,
  frameNumber,
  initialPrompt,
  onApplyPrompt,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const suggestions = [
    'pelota aplastada contra el suelo (squash)',
    'pelota estirada hacia arriba (stretch)',
    'personaje saltando en el punto más alto',
    'giro de 180 grados con cambio de color a verde agua',
    'explosión de partículas o estela de humo',
  ];

  const handleAiGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      await onApplyPrompt(prompt, true);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveOnly = () => {
    onApplyPrompt(prompt, false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col text-zinc-200">
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-sm">
              Prompt de Inteligencia Artificial para el Fotograma {frameNumber}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="text-xs text-zinc-400">
            Describe cómo debe transformarse este fotograma específico. La IA de slow studio adaptará los elementos del frame para que la interpolación fluya naturalmente:
          </div>

          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: La pelota verde agua impacta fuertemente y se aplasta a la mitad de su altura..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-teal-500 resize-none"
          />

          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
              Ideas frecuentes para este frame:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="text-[11px] px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 text-zinc-300 transition"
                >
                  {s}
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
            onClick={handleSaveOnly}
            className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
          >
            Solo Guardar Nota
          </button>
          <button
            onClick={handleAiGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="px-4 py-1.5 rounded bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold flex items-center gap-1.5 transition disabled:opacity-40"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generar Frame con IA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
