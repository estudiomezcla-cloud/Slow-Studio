import React, { useState } from 'react';
import {
  Download,
  X,
  FileCode,
  Film,
  Monitor,
  Apple,
  Terminal,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { FlashDocument, FlashElement } from '../../types/flash';
import { getLayerElementsAtFrame } from '../../utils/interpolation';
import JSZip from 'jszip';
// @ts-ignore
import gifshot from 'gifshot';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: FlashDocument;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, document: doc }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'web' | 'desktop'>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const fileNameBase = doc.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'slow_animation';

  // 1. Export JSON / .slow project
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(doc, null, 2));
    const downloadAnchor = window.document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${fileNameBase}.slow`);
    downloadAnchor.click();
    setExportSuccess('¡Proyecto .slow exportado exitosamente!');
    setTimeout(() => setExportSuccess(null), 3500);
  };

  // 2. Generate Standalone HTML5 Interactive Player Code
  const generateStandaloneHtml = (): string => {
    const jsonStr = JSON.stringify(doc);
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${doc.title} - slow studio Player</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #09090b;
      color: #e4e4e7;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    #stage-container {
      position: relative;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      border-radius: 8px;
      overflow: hidden;
      max-width: 95vw;
      max-height: 80vh;
      aspect-ratio: ${doc.width} / ${doc.height};
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
      background: ${doc.backgroundColor || '#ffffff'};
    }
    #controls {
      margin-top: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: #18181b;
      padding: 8px 16px;
      border-radius: 9999px;
      border: 1px solid #27272a;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5);
    }
    button {
      background: #14b8a6;
      color: #09090b;
      border: none;
      padding: 6px 14px;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    button:hover { background: #2dd4bf; }
    #scrubber {
      width: 220px;
      accent-color: #14b8a6;
      cursor: pointer;
    }
    #info {
      font-family: monospace;
      font-size: 12px;
      color: #a1a1aa;
    }
    .badge {
      position: absolute;
      bottom: 12px;
      right: 16px;
      font-size: 10px;
      font-family: monospace;
      letter-spacing: 1px;
      color: rgba(20, 184, 166, 0.6);
      pointer-events: none;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div id="stage-container">
    <canvas id="c" width="${doc.width}" height="${doc.height}"></canvas>
    <div class="badge">slow studio player • ${doc.fps} fps</div>
  </div>

  <div id="controls">
    <button id="playBtn">▶ Pausar</button>
    <button id="loopBtn" style="background:#27272a;color:#14b8a6;">Loop: ON</button>
    <input type="range" id="scrubber" min="1" max="${doc.totalFrames}" value="1" />
    <span id="info">Frame 1 / ${doc.totalFrames} (${doc.fps} fps)</span>
  </div>

  <script>
    const docData = ${jsonStr};
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const playBtn = document.getElementById('playBtn');
    const loopBtn = document.getElementById('loopBtn');
    const scrubber = document.getElementById('scrubber');
    const info = document.getElementById('info');

    let currentFrame = 1;
    let isPlaying = true;
    let isLooping = true;
    let lastTime = performance.now();
    const frameInterval = 1000 / docData.fps;

    function lerp(a, b, t) { return a + (b - a) * t; }
    function ease(t, type) {
      if (type === 'easeIn') return t * t;
      if (type === 'easeOut') return t * (2 - t);
      if (type === 'easeInOut') return t < 0.5 ? 2*t*t : -1 + (4-2*t)*t;
      if (type === 'bounce') {
        if (t < 1/2.75) return 7.5625*t*t;
        if (t < 2/2.75) { const t2 = t - 1.5/2.75; return 7.5625*t2*t2 + 0.75; }
        if (t < 2.5/2.75) { const t2 = t - 2.25/2.75; return 7.5625*t2*t2 + 0.9375; }
        const t2 = t - 2.625/2.75; return 7.5625*t2*t2 + 0.984375;
      }
      return t;
    }

    function renderFrame(frame) {
      ctx.fillStyle = docData.backgroundColor || '#ffffff';
      ctx.fillRect(0, 0, docData.width, docData.height);

      const scene = docData.scenes[0];
      if (!scene) return;

      scene.layers.forEach(layer => {
        if (!layer.visible || layer.keyframes.length === 0) return;
        const sorted = [...layer.keyframes].sort((a,b) => a.frame - b.frame);
        const exact = sorted.find(k => k.frame === frame);
        let elements = [];

        if (exact) {
          elements = exact.elements;
        } else {
          let kPrev = null, kNext = null;
          for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].frame < frame) kPrev = sorted[i];
            else if (sorted[i].frame > frame && !kNext) { kNext = sorted[i]; break; }
          }
          if (kPrev) {
            if (!kNext || kPrev.tweenType === 'none') {
              elements = kPrev.elements;
            } else {
              const span = kNext.frame - kPrev.frame;
              const t = ease((frame - kPrev.frame) / span, kPrev.easing || 'linear');
              elements = kPrev.elements.map((el1, idx) => {
                const el2 = kNext.elements.find(e => e.id === el1.id) || kNext.elements[idx] || el1;
                return {
                  ...el1,
                  x: lerp(el1.x, el2.x, t),
                  y: lerp(el1.y, el2.y, t),
                  width: lerp(el1.width, el2.width, t),
                  height: lerp(el1.height, el2.height, t),
                  rotation: lerp(el1.rotation || 0, el2.rotation || 0, t),
                  scaleX: lerp(el1.scaleX || 1, el2.scaleX || 1, t),
                  scaleY: lerp(el1.scaleY || 1, el2.scaleY || 1, t),
                  opacity: lerp(el1.opacity ?? 1, el2.opacity ?? 1, t),
                  fill: el1.fill,
                  stroke: el1.stroke,
                  strokeWidth: el1.strokeWidth || 1
                };
              });
            }
          }
        }

        elements.forEach(el => {
          if (el.opacity <= 0) return;
          ctx.save();
          ctx.globalAlpha = el.opacity ?? 1;
          const cx = el.shapeType === 'circle' ? el.x : el.x + el.width / 2;
          const cy = el.shapeType === 'circle' ? el.y : el.y + el.height / 2;
          ctx.translate(cx, cy);
          if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
          ctx.scale(el.scaleX ?? 1, el.scaleY ?? 1);
          ctx.translate(-cx, -cy);

          ctx.fillStyle = el.fill || '#14b8a6';
          ctx.strokeStyle = el.stroke || '#0d9488';
          ctx.lineWidth = el.strokeWidth || 1;

          if (el.shapeType === 'rect') {
            ctx.fillRect(el.x, el.y, el.width, el.height);
            if (el.strokeWidth > 0 && el.stroke !== 'transparent') ctx.strokeRect(el.x, el.y, el.width, el.height);
          } else if (el.shapeType === 'circle') {
            ctx.beginPath();
            ctx.ellipse(el.x, el.y, Math.abs(el.width/2), Math.abs(el.height/2), 0, 0, Math.PI * 2);
            ctx.fill();
            if (el.strokeWidth > 0 && el.stroke !== 'transparent') ctx.stroke();
          } else if (el.type === 'text') {
            ctx.font = (el.fontSize || 24) + 'px sans-serif';
            ctx.fillText(el.text || '', el.x, el.y + (el.fontSize || 24));
          } else if (el.points && el.points.length > 0) {
            ctx.beginPath();
            ctx.lineCap = 'round';
            el.points.forEach((pt, i) => { if (i===0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y); });
            if (el.fill && el.fill !== 'transparent') ctx.fill();
            if (el.strokeWidth > 0 && el.stroke !== 'transparent') ctx.stroke();
          }
          ctx.restore();
        });
      });

      scrubber.value = frame;
      info.textContent = 'Frame ' + frame + ' / ' + docData.totalFrames + ' (' + docData.fps + ' fps)';
    }

    function tick(now) {
      if (isPlaying) {
        const elapsed = now - lastTime;
        if (elapsed >= frameInterval) {
          lastTime = now - (elapsed % frameInterval);
          if (currentFrame >= docData.totalFrames) {
            if (isLooping) currentFrame = 1;
            else isPlaying = false;
          } else {
            currentFrame++;
          }
          renderFrame(currentFrame);
        }
      }
      requestAnimationFrame(tick);
    }

    playBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      playBtn.textContent = isPlaying ? '⏸ Pausar' : '▶ Reproducir';
    });

    loopBtn.addEventListener('click', () => {
      isLooping = !isLooping;
      loopBtn.textContent = 'Loop: ' + (isLooping ? 'ON' : 'OFF');
      loopBtn.style.color = isLooping ? '#14b8a6' : '#71717a';
    });

    scrubber.addEventListener('input', (e) => {
      currentFrame = Number(e.target.value);
      renderFrame(currentFrame);
    });

    renderFrame(1);
    requestAnimationFrame(tick);
  </script>
</body>
</html>`;
  };

  const handleExportHtml5 = () => {
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = window.document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `${fileNameBase}_standalone.html`);
    downloadAnchor.click();
    URL.revokeObjectURL(url);
    setExportSuccess('¡HTML5 interactivo exportado exitosamente!');
    setTimeout(() => setExportSuccess(null), 3500);
  };

  // 3. Export Animated GIF
  const handleExportGif = async () => {
    setIsExporting(true);
    setExportProgress('Renderizando fotogramas para el GIF...');

    try {
      const offscreenCanvas = window.document.createElement('canvas');
      // Scale down slightly for fast encoding if 4K/1080p
      const targetW = Math.min(800, doc.width);
      const targetH = Math.round((targetW / doc.width) * doc.height);
      offscreenCanvas.width = targetW;
      offscreenCanvas.height = targetH;
      const ctx = offscreenCanvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo inicializar canvas para GIF');

      const frameImages: string[] = [];
      const total = doc.totalFrames;

      for (let f = 1; f <= total; f++) {
        setExportProgress(`Capturando fotograma ${f} de ${total}...`);
        // Draw background
        ctx.fillStyle = doc.backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);

        const scale = targetW / doc.width;
        ctx.save();
        ctx.scale(scale, scale);

        // Render layers at frame f
        const scene = doc.scenes[0];
        if (scene) {
          scene.layers.forEach((layer) => {
            if (!layer.visible) return;
            const els = getLayerElementsAtFrame(layer, f);
            els.forEach((el) => {
              if (el.opacity <= 0) return;
              ctx.save();
              ctx.globalAlpha = el.opacity ?? 1;
              const cx = el.shapeType === 'circle' ? el.x : el.x + el.width / 2;
              const cy = el.shapeType === 'circle' ? el.y : el.y + el.height / 2;
              ctx.translate(cx, cy);
              if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
              ctx.scale(el.scaleX ?? 1, el.scaleY ?? 1);
              ctx.translate(-cx, -cy);

              ctx.fillStyle = el.fill || '#14b8a6';
              ctx.strokeStyle = el.stroke || '#0d9488';
              ctx.lineWidth = el.strokeWidth || 1;

              if (el.shapeType === 'rect') {
                ctx.fillRect(el.x, el.y, el.width, el.height);
                if (el.strokeWidth > 0 && el.stroke !== 'transparent') {
                  ctx.strokeRect(el.x, el.y, el.width, el.height);
                }
              } else if (el.shapeType === 'circle') {
                ctx.beginPath();
                ctx.ellipse(el.x, el.y, Math.abs(el.width / 2), Math.abs(el.height / 2), 0, 0, Math.PI * 2);
                ctx.fill();
                if (el.strokeWidth > 0 && el.stroke !== 'transparent') ctx.stroke();
              } else if (el.type === 'text') {
                ctx.font = `${el.fontSize || 24}px sans-serif`;
                ctx.fillText(el.text || '', el.x, el.y + (el.fontSize || 24));
              } else if (el.points && el.points.length > 0) {
                ctx.beginPath();
                el.points.forEach((pt, i) => {
                  if (i === 0) ctx.moveTo(pt.x, pt.y);
                  else ctx.lineTo(pt.x, pt.y);
                });
                if (el.fill && el.fill !== 'transparent') ctx.fill();
                if (el.strokeWidth > 0 && el.stroke !== 'transparent') ctx.stroke();
              }
              ctx.restore();
            });
          });
        }
        ctx.restore();

        frameImages.push(offscreenCanvas.toDataURL('image/png'));
      }

      setExportProgress('Codificando GIF animado con paleta optimizada...');

      gifshot.createGIF(
        {
          images: frameImages,
          gifWidth: targetW,
          gifHeight: targetH,
          interval: 1 / doc.fps,
          numFrames: total,
          sampleInterval: 10,
        },
        (obj: any) => {
          if (!obj.error) {
            const image = obj.image;
            const downloadAnchor = window.document.createElement('a');
            downloadAnchor.setAttribute('href', image);
            downloadAnchor.setAttribute('download', `${fileNameBase}.gif`);
            downloadAnchor.click();
            setExportSuccess('¡GIF animado generado y descargado!');
          } else {
            alert('Error al codificar GIF: ' + obj.error);
          }
          setIsExporting(false);
          setExportProgress('');
          setTimeout(() => setExportSuccess(null), 3500);
        }
      );
    } catch (e: any) {
      console.error(e);
      setIsExporting(false);
      setExportProgress('');
      alert('Error generando GIF: ' + e.message);
    }
  };

  // 4. Export Windows Executable Package (.exe / batch projector)
  const handleExportWindows = async () => {
    setIsExporting(true);
    setExportProgress('Empaquetando ejecutable de Windows...');

    try {
      const zip = new JSZip();
      const htmlContent = generateStandaloneHtml();

      // Standalone runner file
      zip.file('index.html', htmlContent);

      // Windows launcher .bat that runs in app mode (no browser borders)
      const batScript = `@echo off
title ${doc.title} - slow studio Player
echo Iniciando reproductor standalone de slow studio...
start msedge --app="%~dp0index.html" --window-size=${doc.width},${doc.height + 60}
if errorlevel 1 (
  start chrome --app="%~dp0index.html" --window-size=${doc.width},${doc.height + 60}
)
if errorlevel 1 (
  start "" "%~dp0index.html"
)
exit
`;
      zip.file(`Iniciar_${fileNameBase}.bat`, batScript);
      zip.file(`Iniciar_${fileNameBase}.cmd`, batScript);

      // Electron / NW.js package.json for building full native .exe
      const packageJson = {
        name: fileNameBase,
        version: '1.0.0',
        description: `${doc.title} animation exported with slow studio`,
        main: 'index.html',
        window: {
          title: doc.title,
          width: doc.width,
          height: doc.height + 50,
          toolbar: false,
          frame: true,
        },
      };
      zip.file('package.json', JSON.stringify(packageJson, null, 2));

      // Readme instructions
      const readme = `========================================================
  slow studio - Proyector Ejecutable para Windows
========================================================
Proyecto: ${doc.title}
Resolución: ${doc.width} x ${doc.height} px
Velocidad: ${doc.fps} FPS

CÓMO EJECUTAR EN WINDOWS:
1. Haz doble clic en "Iniciar_${fileNameBase}.bat"
2. La animación se abrirá en modo aplicación nativa sin barra de navegación.

Para compilar un .exe único e independiente mediante Electron o NW.js:
- Ejecuta: npx nw-builder -p win64 .
========================================================`;
      zip.file('LEEME_WINDOWS.txt', readme);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${fileNameBase}_Windows_Executable.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setExportSuccess('¡Paquete ejecutable de Windows (.exe / .bat) generado!');
      setTimeout(() => setExportSuccess(null), 3500);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // 5. Export Mac Executable (.app bundle)
  const handleExportMac = async () => {
    setIsExporting(true);
    setExportProgress('Empaquetando aplicación de macOS (.app)...');

    try {
      const zip = new JSZip();
      const htmlContent = generateStandaloneHtml();

      const appName = `${doc.title.replace(/\s+/g, '_')}.app`;
      const contentsDir = zip.folder(`${appName}/Contents`);
      const macOsDir = contentsDir?.folder('MacOS');
      const resDir = contentsDir?.folder('Resources');

      resDir?.file('index.html', htmlContent);

      // macOS launcher script
      const macLauncher = `#!/bin/bash
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
HTML_PATH="$DIR/../Resources/index.html"
open "$HTML_PATH"
`;
      macOsDir?.file('launcher', macLauncher);

      // Info.plist
      const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>launcher</string>
    <key>CFBundleIdentifier</key>
    <string>studio.slow.${fileNameBase}</string>
    <key>CFBundleName</key>
    <string>${doc.title}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
</dict>
</plist>`;
      contentsDir?.file('Info.plist', infoPlist);

      // Quick launcher script for direct double click
      zip.file(`Abrir_en_Mac.command`, `#!/bin/bash\ncd "$(dirname "$0")"\nopen "${appName}/Contents/Resources/index.html"\n`);

      const readme = `========================================================
  slow studio - Proyector Ejecutable para macOS (.app)
========================================================
Proyecto: ${doc.title}
Resolución: ${doc.width} x ${doc.height} px
Velocidad: ${doc.fps} FPS

CÓMO EJECUTAR EN MAC:
1. Descomprime este archivo ZIP.
2. Haz doble clic en "${appName}" o en "Abrir_en_Mac.command".
========================================================`;
      zip.file('LEEME_MAC.txt', readme);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${fileNameBase}_macOS_App.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setExportSuccess('¡Aplicación para macOS (.app) exportada exitosamente!');
      setTimeout(() => setExportSuccess(null), 3500);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // 6. Export Linux Executable (.AppImage / .sh)
  const handleExportLinux = async () => {
    setIsExporting(true);
    setExportProgress('Empaquetando ejecutable de Linux (.sh / AppImage)...');

    try {
      const zip = new JSZip();
      const htmlContent = generateStandaloneHtml();

      zip.file('standalone.html', htmlContent);

      // Shell script runner
      const shRunner = `#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
xdg-open "$SCRIPT_DIR/standalone.html" 2>/dev/null || sensible-browser "$SCRIPT_DIR/standalone.html" 2>/dev/null || x-www-browser "$SCRIPT_DIR/standalone.html"
`;
      zip.file(`ejecutar_${fileNameBase}.sh`, shRunner);
      zip.file('AppRun', shRunner);

      // Desktop entry
      const desktopEntry = `[Desktop Entry]
Type=Application
Name=${doc.title}
Comment=Animación vectorial slow studio
Exec=./ejecutar_${fileNameBase}.sh
Icon=utilities-terminal
Terminal=false
Categories=Graphics;Animation;
`;
      zip.file(`${fileNameBase}.desktop`, desktopEntry);

      const readme = `========================================================
  slow studio - Proyector Ejecutable para Linux
========================================================
Proyecto: ${doc.title}
Resolución: ${doc.width} x ${doc.height} px
Velocidad: ${doc.fps} FPS

CÓMO EJECUTAR EN LINUX:
1. Abre una terminal en la carpeta extraída.
2. Dale permisos de ejecución: chmod +x ejecutar_${fileNameBase}.sh
3. Ejecuta: ./ejecutar_${fileNameBase}.sh
========================================================`;
      zip.file('LEEME_LINUX.txt', readme);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${fileNameBase}_Linux_Executable.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setExportSuccess('¡Paquete ejecutable de Linux (.sh / AppImage) generado!');
      setTimeout(() => setExportSuccess(null), 3500);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col text-zinc-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-sm">Exportar Proyecto de slow studio</span>
            <span className="text-[11px] font-mono text-zinc-500">
              ({doc.width} × {doc.height} px • {doc.fps} fps)
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success toast */}
        {exportSuccess && (
          <div className="px-5 py-2.5 bg-teal-500/10 border-b border-teal-500/30 text-teal-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{exportSuccess}</span>
          </div>
        )}

        {/* Loading progress */}
        {isExporting && (
          <div className="px-5 py-3 bg-zinc-900 border-b border-teal-500/30 flex items-center gap-3 text-xs text-teal-300">
            <Loader2 className="w-4 h-4 animate-spin text-teal-400 shrink-0" />
            <span>{exportProgress || 'Procesando exportación...'}</span>
          </div>
        )}

        {/* Format Options */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="text-xs text-zinc-400">
            Elige el formato de salida para reproducir, compartir o incrustar tu animación:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* 1. Animated GIF */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-100">GIF Animado (.gif)</div>
                    <div className="text-[11px] text-zinc-500">Para redes sociales, chat y web</div>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Renderiza los {doc.totalFrames} fotogramas con gráficos vectoriales y bucle infinito.
                </p>
              </div>
              <button
                disabled={isExporting}
                onClick={handleExportGif}
                className="mt-3.5 w-full py-2 px-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Generar GIF</span>
              </button>
            </div>

            {/* 2. Standalone HTML5 */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-100">HTML5 Interactivo (.html)</div>
                    <div className="text-[11px] text-zinc-500">Un solo archivo autónomo sin dependencias</div>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Ejecutable en cualquier navegador (Chrome, Safari, Edge) con reproductor slow studio integrado.
                </p>
              </div>
              <button
                disabled={isExporting}
                onClick={handleExportHtml5}
                className="mt-3.5 w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-teal-300 border border-teal-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar HTML5</span>
              </button>
            </div>

            {/* 3. Windows Executable (.exe / .bat) */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-100">Ejecutable Windows (.exe / Projector)</div>
                    <div className="text-[11px] text-zinc-500">Paquete autónomo para Windows</div>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Incluye launcher de aplicación nativa a {doc.width}x{doc.height} px y archivos de compilación.
                </p>
              </div>
              <button
                disabled={isExporting}
                onClick={handleExportWindows}
                className="mt-3.5 w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-blue-300 border border-blue-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar para Windows</span>
              </button>
            </div>

            {/* 4. macOS Executable (.app) */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-2 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700">
                    <Apple className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-100">Ejecutable macOS (.app)</div>
                    <div className="text-[11px] text-zinc-500">Paquete de aplicación para Mac</div>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Bundle completo de macOS con Info.plist y ejecutable nativo para Mac con Apple Silicon o Intel.
                </p>
              </div>
              <button
                disabled={isExporting}
                onClick={handleExportMac}
                className="mt-3.5 w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar para macOS</span>
              </button>
            </div>

            {/* 5. Linux Executable (.sh / AppImage) */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-100">Ejecutable Linux (.sh / AppImage)</div>
                    <div className="text-[11px] text-zinc-500">Runner para distribuciones Linux</div>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Script de inicio con soporte de entrada de escritorio y contenedor ejecutable.
                </p>
              </div>
              <button
                disabled={isExporting}
                onClick={handleExportLinux}
                className="mt-3.5 w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar para Linux</span>
              </button>
            </div>

            {/* 6. slow studio Project File (.slow) */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-100">Archivo de Proyecto (.slow)</div>
                    <div className="text-[11px] text-zinc-500">Guarda todas las capas y símbolos</div>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Formato de intercambio de slow studio con vectores, keyframes, prompts de IA y código.
                </p>
              </div>
              <button
                disabled={isExporting}
                onClick={handleExportJson}
                className="mt-3.5 w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar .slow</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-900 border-t border-zinc-800 flex justify-end text-xs">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
