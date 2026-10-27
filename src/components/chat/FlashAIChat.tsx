import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, FlashDocument, Layer } from '../../types/flash';
import {
  Sparkles,
  Send,
  Loader2,
  Play,
  RotateCcw,
  Zap,
  Layers,
} from 'lucide-react';

interface FlashAIChatProps {
  currentDocument: FlashDocument;
  currentFrame: number;
  onApplyAnimation: (animationData: {
    totalFrames?: number;
    fps?: number;
    backgroundColor?: string;
    layers: Layer[];
    description?: string;
  }) => void;
  onApplyFramePrompt: (frame: number, prompt: string) => void;
  onPlayAnimation: () => void;
}

export const FlashAIChat: React.FC<FlashAIChatProps> = ({
  currentDocument,
  currentFrame,
  onApplyAnimation,
  onApplyFramePrompt,
  onPlayAnimation,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '¡Bienvenido a slow studio! Soy tu copiloto de animación vectorial con IA. Escribe cualquier orden (por ejemplo: "dibuja un círculo verde agua que salte" o "haz una nave espacial 3D") y generaré la animación de inmediato en el escenario 1920×1080.',
      timestamp: Date.now(),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [targetMode, setTargetMode] = useState<'full' | 'currentFrame'>('full');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const quickPrompts = [
    'dibuja un círculo verde agua que salte',
    'nave espacial 3D despegando con propulsores',
    'interpolación de forma de círculo a estrella dorada',
    'botón interactivo que cambie al pasar el ratón',
    'pelota de baloncesto rebotando con squash y stretch en 1080p',
    'personaje robótico saludando cuadro a cuadro',
  ];

  const handleSubmit = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    setInputPrompt('');

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      if (targetMode === 'currentFrame') {
        onApplyFramePrompt(currentFrame, prompt);
        const assistantMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: `He configurado la instrucción en el fotograma ${currentFrame}: "${prompt}". Puedes ver el keyframe actualizado en la línea de tiempo.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsLoading(false);
        return;
      }

      // Full animation generation via server-side Gemini endpoint
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          currentAnimation: {
            fps: currentDocument.fps,
            totalFrames: currentDocument.totalFrames,
            layers: currentDocument.scenes[0]?.layers || [],
            width: currentDocument.width,
            height: currentDocument.height,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.animation && data.animation.layers) {
        const formattedLayers: Layer[] = data.animation.layers.map((l: any, idx: number) => ({
          id: l.id || `layer_${Date.now()}_${idx}`,
          name: l.name || `Capa ${idx + 1}`,
          visible: l.visible !== undefined ? l.visible : true,
          locked: l.locked !== undefined ? l.locked : false,
          color: l.color || ['#14b8a6', '#06b6d4', '#10b981', '#3b82f6'][idx % 4],
          keyframes: (l.keyframes || []).map((kf: any) => ({
            frame: kf.frame || 1,
            tweenType: kf.tweenType || 'motion',
            easing: kf.easing || 'easeOut',
            prompt: kf.prompt || '',
            actions: kf.actions || '',
            elements: (kf.elements || []).map((el: any) => ({
              id: el.id || `el_${Date.now()}_${Math.random()}`,
              name: el.name || 'Elemento',
              type: el.type || 'shape',
              shapeType: el.shapeType || 'circle',
              x: el.x ?? 960,
              y: el.y ?? 540,
              width: el.width ?? 120,
              height: el.height ?? 120,
              rotation: el.rotation ?? 0,
              scaleX: el.scaleX ?? 1,
              scaleY: el.scaleY ?? 1,
              opacity: el.opacity ?? 1,
              fill: el.fill || '#14b8a6',
              stroke: el.stroke || '#0f766e',
              strokeWidth: el.strokeWidth ?? 3,
              text: el.text,
              threeData: el.threeModelType
                ? {
                    modelType: el.threeModelType,
                    color: el.fill || '#14b8a6',
                    metalness: 0.85,
                    roughness: 0.25,
                    rotX: el.threeRotX ?? 0,
                    rotY: el.threeRotY ?? 0,
                    rotZ: el.threeRotZ ?? 0,
                  }
                : undefined,
            })),
          })),
        }));

        onApplyAnimation({
          totalFrames: data.animation.totalFrames || 48,
          fps: data.animation.fps || currentDocument.fps || 24,
          backgroundColor: data.animation.backgroundColor || currentDocument.backgroundColor || '#ffffff',
          layers: formattedLayers,
          description: data.textResponse,
        });

        setTimeout(() => {
          onPlayAnimation();
        }, 150);

        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: data.textResponse || '¡Animación vectorial generada con éxito!',
          timestamp: Date.now(),
          animationPreview: {
            layerCount: formattedLayers.length,
            keyframeCount: formattedLayers.reduce((acc, l) => acc + l.keyframes.length, 0),
            description: `Generados ${data.animation.totalFrames || 48} fotogramas a ${
              data.animation.fps || 24
            } fps`,
          },
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('Estructura de respuesta inválida');
      }
    } catch (err: any) {
      console.error(err);
      handleLocalFallback(prompt);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalFallback = (prompt: string) => {
    const is3D = /3d|nave|espacial|cubo|robot/i.test(prompt);
    const isBounce = /salte|rebote|pelota|círculo|circulo/i.test(prompt);

    const generatedLayers: Layer[] = [
      {
        id: `layer_${Date.now()}`,
        name: is3D ? 'Nave 3D' : 'Animación Principal',
        visible: true,
        locked: false,
        color: '#14b8a6',
        keyframes: isBounce
          ? [
              {
                frame: 1,
                tweenType: 'motion',
                easing: 'easeIn',
                prompt: 'Posición inicial arriba',
                elements: [
                  {
                    id: 'ball',
                    name: 'Pelota Verde Agua',
                    type: is3D ? 'threeObject' : 'shape',
                    shapeType: 'circle',
                    x: 960,
                    y: 280,
                    width: 140,
                    height: 140,
                    rotation: 0,
                    scaleX: 1,
                    scaleY: 1,
                    opacity: 1,
                    fill: '#14b8a6',
                    stroke: '#0f766e',
                    strokeWidth: 4,
                    threeData: is3D
                      ? {
                          modelType: 'spaceship',
                          color: '#14b8a6',
                          metalness: 0.85,
                          roughness: 0.25,
                          rotX: 10,
                          rotY: 20,
                          rotZ: 0,
                        }
                      : undefined,
                  },
                ],
              },
              {
                frame: 18,
                tweenType: 'motion',
                easing: 'bounce',
                prompt: 'Impacto con el suelo y deformación squash',
                elements: [
                  {
                    id: 'ball',
                    name: 'Pelota Verde Agua',
                    type: is3D ? 'threeObject' : 'shape',
                    shapeType: 'circle',
                    x: 960,
                    y: 840,
                    width: 210,
                    height: 90,
                    rotation: 0,
                    scaleX: 1.45,
                    scaleY: 0.6,
                    opacity: 1,
                    fill: '#0d9488',
                    stroke: '#115e59',
                    strokeWidth: 4,
                    threeData: is3D
                      ? {
                          modelType: 'spaceship',
                          color: '#0d9488',
                          metalness: 0.85,
                          roughness: 0.25,
                          rotX: 30,
                          rotY: 180,
                          rotZ: 0,
                        }
                      : undefined,
                  },
                ],
              },
              {
                frame: 36,
                tweenType: 'motion',
                easing: 'easeOut',
                prompt: 'Rebote y stretch hacia arriba',
                elements: [
                  {
                    id: 'ball',
                    name: 'Pelota Verde Agua',
                    type: is3D ? 'threeObject' : 'shape',
                    shapeType: 'circle',
                    x: 960,
                    y: 300,
                    width: 130,
                    height: 160,
                    rotation: 0,
                    scaleX: 0.9,
                    scaleY: 1.15,
                    opacity: 1,
                    fill: '#2dd4bf',
                    stroke: '#0f766e',
                    strokeWidth: 4,
                    threeData: is3D
                      ? {
                          modelType: 'spaceship',
                          color: '#2dd4bf',
                          metalness: 0.85,
                          roughness: 0.25,
                          rotX: 0,
                          rotY: 360,
                          rotZ: 0,
                        }
                      : undefined,
                  },
                ],
              },
            ]
          : [
              {
                frame: 1,
                tweenType: 'motion',
                easing: 'easeInOut',
                elements: [
                  {
                    id: 'el_1',
                    name: 'Objeto Vectorial',
                    type: is3D ? 'threeObject' : 'shape',
                    shapeType: 'star',
                    x: 450,
                    y: 540,
                    width: 160,
                    height: 160,
                    rotation: 0,
                    scaleX: 1,
                    scaleY: 1,
                    opacity: 1,
                    fill: '#14b8a6',
                    stroke: '#0f766e',
                    strokeWidth: 3,
                    threeData: is3D
                      ? {
                          modelType: 'robot',
                          color: '#14b8a6',
                          metalness: 0.85,
                          roughness: 0.2,
                          rotX: 0,
                          rotY: 0,
                          rotZ: 0,
                        }
                      : undefined,
                  },
                ],
              },
              {
                frame: 24,
                tweenType: 'motion',
                easing: 'easeInOut',
                elements: [
                  {
                    id: 'el_1',
                    name: 'Objeto Vectorial',
                    type: is3D ? 'threeObject' : 'shape',
                    shapeType: 'star',
                    x: 1470,
                    y: 540,
                    width: 190,
                    height: 190,
                    rotation: 360,
                    scaleX: 1.25,
                    scaleY: 1.25,
                    opacity: 1,
                    fill: '#2dd4bf',
                    stroke: '#0d9488',
                    strokeWidth: 3,
                    threeData: is3D
                      ? {
                          modelType: 'robot',
                          color: '#2dd4bf',
                          metalness: 0.85,
                          roughness: 0.2,
                          rotX: 20,
                          rotY: 180,
                          rotZ: 0,
                        }
                      : undefined,
                  },
                ],
              },
            ],
      },
    ];

    onApplyAnimation({
      totalFrames: 48,
      fps: currentDocument.fps || 24,
      backgroundColor: currentDocument.backgroundColor || '#ffffff',
      layers: generatedLayers,
      description: `Generada animación local: ${prompt}`,
    });

    onPlayAnimation();

    setMessages((prev) => [
      ...prev,
      {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: `¡Listo! He creado la animación para "${prompt}" con interpolación clásica y keyframes fluidos en el canvas de slow studio.`,
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="w-[380px] lg:w-[420px] bg-zinc-950 flex flex-col h-full border-r border-zinc-800 select-none shrink-0">
      {/* Header in verde agua */}
      <div className="h-10 px-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-teal-500 text-zinc-950 font-bold flex items-center justify-center text-xs font-mono shadow-sm shadow-teal-500/30">
            s
          </div>
          <span className="font-semibold text-zinc-100 text-sm tracking-tight">slow Copilot IA</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-800 text-teal-400 border border-zinc-700">
            slow studio
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
          <span className="text-[11px] font-mono">Gemini 3.8</span>
        </div>
      </div>

      {/* Target Mode Selector */}
      <div className="px-3 py-2 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between text-xs">
        <span className="text-zinc-400 text-[11px]">Modo de generación:</span>
        <div className="flex items-center bg-zinc-950 p-0.5 rounded border border-zinc-800">
          <button
            onClick={() => setTargetMode('full')}
            className={`px-2 py-0.5 rounded text-[11px] transition ${
              targetMode === 'full'
                ? 'bg-teal-500 text-zinc-950 font-medium shadow-sm shadow-teal-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Escena Completa
          </button>
          <button
            onClick={() => setTargetMode('currentFrame')}
            className={`px-2 py-0.5 rounded text-[11px] transition ${
              targetMode === 'currentFrame'
                ? 'bg-teal-500 text-zinc-950 font-medium shadow-sm shadow-teal-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Solo Frame {currentFrame}
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m) => {
          const isAi = m.role === 'assistant';
          return (
            <div key={m.id} className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}>
              <div
                className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                  isAi
                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                    : 'bg-teal-500 text-zinc-950 font-medium shadow-sm shadow-teal-500/20'
                }`}
              >
                {isAi && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-teal-400 text-[11px] font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>slow Copilot</span>
                  </div>
                )}
                <div className="whitespace-pre-line">{m.content}</div>

                {m.animationPreview && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Layers className="w-3.5 h-3.5 text-teal-400" />
                      <span>{m.animationPreview.layerCount} capas</span>
                      <span>•</span>
                      <span>{m.animationPreview.keyframeCount} keyframes</span>
                    </div>
                    <button
                      onClick={onPlayAnimation}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-teal-300 flex items-center gap-1 transition"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Ver</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-teal-400 bg-zinc-900/90 border border-teal-500/20 px-3.5 py-2.5 rounded-xl max-w-[85%]">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Generando fotogramas clave e interpolación...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts Chips */}
      <div className="px-3 py-2 bg-zinc-900/40 border-t border-zinc-800/80">
        <div className="flex items-center gap-1 mb-1.5 text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
          <Zap className="w-3 h-3 text-teal-400" />
          <span>Órdenes rápidas sugeridas</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.slice(0, 4).map((qp) => (
            <button
              key={qp}
              disabled={isLoading}
              onClick={() => handleSubmit(qp)}
              className="text-[11px] px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition hover:border-teal-500/40 text-left truncate max-w-full"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 bg-zinc-900 border-t border-zinc-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            placeholder={
              targetMode === 'full'
                ? 'Ej: dibuja un círculo verde agua que salte...'
                : `Describir cambio para el frame ${currentFrame}...`
            }
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg pl-3 pr-10 py-2.5 text-xs focus:outline-none focus:border-teal-500 transition placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="absolute right-1.5 p-1.5 rounded-md bg-teal-500 text-zinc-950 hover:bg-teal-400 disabled:opacity-30 disabled:hover:bg-teal-500 transition shadow-sm"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500">
          <span>Pulsa Enter para enviar la orden</span>
          <span>
            {currentDocument.width}×{currentDocument.height} px • {currentDocument.fps} fps
          </span>
        </div>
      </div>
    </div>
  );
};
