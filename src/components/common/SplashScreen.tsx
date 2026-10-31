import React, { useState, useEffect } from 'react';
import { Sparkles, Play, Layers, Film } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState<number>(10);
  const [statusText, setStatusText] = useState<string>('Iniciando motor gráfico vectorial...');
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    const steps = [
      { p: 25, text: 'Cargando mesa de trabajo 1920×1080 proporcional...' },
      { p: 50, text: 'Inicializando sintetizador de interpolación y morfología...' },
      { p: 75, text: 'Sincronizando copiloto IA y biblioteca de símbolos...' },
      { p: 95, text: 'Calibrando cuadrícula magnética y herramientas...' },
      { p: 100, text: 'Listo para crear.' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].p);
        setStatusText(steps[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            onFinish();
          }, 350);
        }, 300);
      }
    }, 280);

    return () => clearInterval(interval);
  }, [onFinish]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 text-white select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onClick={handleSkip}
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(20,184,166,0.12),transparent_65%)]" />

      {/* Grid texture overlay */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'radial-gradient(circle, #2dd4bf 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative w-full max-w-md p-8 flex flex-col items-center text-center bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl">
        {/* slow studio Emblem */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 via-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <span className="font-mono text-4xl font-black text-zinc-950 tracking-tighter">s</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-900 border border-teal-400/40 flex items-center justify-center text-teal-300">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
          slow <span className="text-teal-400">studio</span>
        </h1>
        <p className="text-xs text-zinc-400 font-medium mb-6 uppercase tracking-widest">
          Motor de Animación Vectorial &middot; v2.4
        </p>

        {/* Feature Badges */}
        <div className="flex items-center gap-2 mb-6 text-[11px] text-zinc-400">
          <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 font-mono">
            1920×1080 FHD
          </span>
          <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 font-mono">
            Keyframes &amp; Tweens
          </span>
          <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-teal-400 font-mono">
            Snap-to-Grid
          </span>
        </div>

        {/* Progress Bar in Verde Agua */}
        <div className="w-full bg-zinc-950 rounded-full h-2 p-0.5 border border-zinc-800 mb-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-teal-300 rounded-full transition-all duration-300 ease-out shadow-sm shadow-teal-400/50"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Dynamic Status Text */}
        <div className="w-full flex justify-between items-center text-[11px] font-mono text-zinc-400">
          <span className="truncate max-w-[280px] text-left text-zinc-300">{statusText}</span>
          <span className="text-teal-400 font-bold ml-2">{progress}%</span>
        </div>

        {/* Fast-forward hint */}
        <button
          onClick={handleSkip}
          className="mt-6 text-[10px] text-zinc-500 hover:text-teal-300 transition underline underline-offset-4"
        >
          Haz clic o pulsa cualquier tecla para entrar inmediatamente
        </button>
      </div>
    </div>
  );
};
