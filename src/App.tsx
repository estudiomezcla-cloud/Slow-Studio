import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FlashDocument,
  FlashElement,
  FlashScene,
  FlashSymbol,
  Keyframe,
  Layer,
  ToolType,
  TweenType,
  EasingType,
  RegistrationPoint,
} from './types/flash';
import { FlashAIChat } from './components/chat/FlashAIChat';
import { FlashStage } from './components/stage/FlashStage';
import { FlashTimeline } from './components/timeline/FlashTimeline';
import { FlashToolbox } from './components/toolbox/FlashToolbox';
import { PropertiesPanel } from './components/panels/PropertiesPanel';
import { LibraryPanel } from './components/panels/LibraryPanel';
import { ActionScriptModal } from './components/modals/ActionScriptModal';
import { FramePromptModal } from './components/modals/FramePromptModal';
import { SymbolModal } from './components/modals/SymbolModal';
import { ExportModal } from './components/modals/ExportModal';
import { ProjectSettingsModal, ProjectSettings } from './components/modals/ProjectSettingsModal';
import { playKeyframeAdd, playButtonClick, playTweenCreate } from './utils/audio';
import {
  Folder,
  Sliders,
  Download,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Layers,
  Settings,
  PlusCircle,
  Film,
  ArrowLeft,
} from 'lucide-react';

// Initial default slow studio project: Full HD 1920x1080 Bouncing Ball with Verde Agua theme
const INITIAL_DOCUMENT: FlashDocument = {
  title: 'animacion_verde_agua_1080p',
  width: 1920,
  height: 1080,
  fps: 24,
  totalFrames: 48,
  backgroundColor: '#ffffff',
  scenes: [
    {
      id: 'scene_1',
      name: 'Escena 1',
      layers: [
        {
          id: 'layer_ball',
          name: 'Pelota Verde Agua',
          visible: true,
          locked: false,
          color: '#14b8a6',
          keyframes: [
            {
              frame: 1,
              tweenType: 'motion',
              easing: 'easeIn',
              prompt: 'Pelota arriba lista para caer',
              elements: [
                {
                  id: 'ball_1',
                  name: 'Pelota',
                  type: 'shape',
                  shapeType: 'circle',
                  x: 960,
                  y: 260,
                  width: 140,
                  height: 140,
                  rotation: 0,
                  scaleX: 1,
                  scaleY: 1,
                  opacity: 1,
                  fill: '#14b8a6',
                  stroke: '#0f766e',
                  strokeWidth: 4,
                },
              ],
            },
            {
              frame: 16,
              tweenType: 'motion',
              easing: 'bounce',
              prompt: 'Impacto con el suelo y deformación squash',
              elements: [
                {
                  id: 'ball_1',
                  name: 'Pelota',
                  type: 'shape',
                  shapeType: 'circle',
                  x: 960,
                  y: 840,
                  width: 210,
                  height: 90, // Squash
                  rotation: 0,
                  scaleX: 1.45,
                  scaleY: 0.65,
                  opacity: 1,
                  fill: '#0d9488',
                  stroke: '#115e59',
                  strokeWidth: 4,
                },
              ],
            },
            {
              frame: 32,
              tweenType: 'motion',
              easing: 'easeOut',
              prompt: 'Rebote hacia arriba con stretch',
              elements: [
                {
                  id: 'ball_1',
                  name: 'Pelota',
                  type: 'shape',
                  shapeType: 'circle',
                  x: 960,
                  y: 280,
                  width: 130,
                  height: 160, // Stretch
                  rotation: 0,
                  scaleX: 0.9,
                  scaleY: 1.15,
                  opacity: 1,
                  fill: '#2dd4bf',
                  stroke: '#0f766e',
                  strokeWidth: 4,
                },
              ],
            },
            {
              frame: 48,
              tweenType: 'motion',
              easing: 'linear',
              prompt: 'Retorno a posición original',
              actions: 'gotoAndPlay(1);',
              elements: [
                {
                  id: 'ball_1',
                  name: 'Pelota',
                  type: 'shape',
                  shapeType: 'circle',
                  x: 960,
                  y: 260,
                  width: 140,
                  height: 140,
                  rotation: 0,
                  scaleX: 1,
                  scaleY: 1,
                  opacity: 1,
                  fill: '#14b8a6',
                  stroke: '#0f766e',
                  strokeWidth: 4,
                },
              ],
            },
          ],
        },
        {
          id: 'layer_shadow',
          name: 'Sombra Suelo',
          visible: true,
          locked: false,
          color: '#64748b',
          keyframes: [
            {
              frame: 1,
              tweenType: 'motion',
              easing: 'easeIn',
              elements: [
                {
                  id: 'shadow_1',
                  name: 'Sombra',
                  type: 'shape',
                  shapeType: 'circle',
                  x: 960,
                  y: 920,
                  width: 80,
                  height: 24,
                  rotation: 0,
                  scaleX: 1,
                  scaleY: 1,
                  opacity: 0.25,
                  fill: '#000000',
                  stroke: 'transparent',
                  strokeWidth: 0,
                },
              ],
            },
            {
              frame: 16,
              tweenType: 'motion',
              easing: 'bounce',
              elements: [
                {
                  id: 'shadow_1',
                  name: 'Sombra',
                  type: 'shape',
                  shapeType: 'circle',
                  x: 960,
                  y: 920,
                  width: 190,
                  height: 44,
                  rotation: 0,
                  scaleX: 1,
                  scaleY: 1,
                  opacity: 0.6,
                  fill: '#000000',
                  stroke: 'transparent',
                  strokeWidth: 0,
                },
              ],
            },
            {
              frame: 32,
              tweenType: 'motion',
              easing: 'easeOut',
              elements: [
                {
                  id: 'shadow_1',
                  name: 'Sombra',
                  type: 'shape',
                  shapeType: 'circle',
                  x: 960,
                  y: 920,
                  width: 90,
                  height: 28,
                  rotation: 0,
                  scaleX: 1,
                  scaleY: 1,
                  opacity: 0.3,
                  fill: '#000000',
                  stroke: 'transparent',
                  strokeWidth: 0,
                },
              ],
            },
            {
              frame: 48,
              tweenType: 'none',
              elements: [
                {
                  id: 'shadow_1',
                  name: 'Sombra',
                  type: 'shape',
                  shapeType: 'circle',
                  x: 960,
                  y: 920,
                  width: 80,
                  height: 24,
                  rotation: 0,
                  scaleX: 1,
                  scaleY: 1,
                  opacity: 0.25,
                  fill: '#000000',
                  stroke: 'transparent',
                  strokeWidth: 0,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  symbols: [
    {
      id: 'sym_movieclip_1',
      name: 'EstrellaGiratoria',
      type: 'movieclip',
      totalFrames: 24,
      layers: [
        {
          id: 'sublayer_1',
          name: 'Vectores Sub-animación',
          visible: true,
          locked: false,
          color: '#14b8a6',
          keyframes: [
            {
              frame: 1,
              tweenType: 'motion',
              easing: 'linear',
              elements: [
                {
                  id: 'sub_star',
                  name: 'Estrella Interior',
                  type: 'shape',
                  shapeType: 'star',
                  x: 960,
                  y: 540,
                  width: 120,
                  height: 120,
                  rotation: 0,
                  scaleX: 1,
                  scaleY: 1,
                  opacity: 1,
                  fill: '#2dd4bf',
                  stroke: '#0f766e',
                  strokeWidth: 3,
                },
              ],
            },
            {
              frame: 24,
              tweenType: 'motion',
              easing: 'linear',
              elements: [
                {
                  id: 'sub_star',
                  name: 'Estrella Interior',
                  type: 'shape',
                  shapeType: 'star',
                  x: 960,
                  y: 540,
                  width: 120,
                  height: 120,
                  rotation: 360,
                  scaleX: 1,
                  scaleY: 1,
                  opacity: 1,
                  fill: '#14b8a6',
                  stroke: '#0f766e',
                  strokeWidth: 3,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export default function App() {
  const [doc, setDoc] = useState<FlashDocument>(INITIAL_DOCUMENT);
  const [currentSceneId, setCurrentSceneId] = useState<string>('scene_1');
  const [currentSymbolId, setCurrentSymbolId] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('layer_ball');
  const [selectedElementId, setSelectedElementId] = useState<string | null>('ball_1');
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [onionSkin, setOnionSkin] = useState<boolean>(false);

  // Toolbox State in Verde Agua
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [primaryColor, setPrimaryColor] = useState<string>('#14b8a6');
  const [strokeColor, setStrokeColor] = useState<string>('#0f766e');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);

  // Side Panels (Properties vs Library)
  const [activeSidePanel, setActiveSidePanel] = useState<'properties' | 'library' | 'none'>('properties');

  // Modals
  const [actionScriptModal, setActionScriptModal] = useState<{
    isOpen: boolean;
    layerId: string;
    frame: number;
    initialCode: string;
  }>({ isOpen: false, layerId: '', frame: 1, initialCode: '' });

  const [framePromptModal, setFramePromptModal] = useState<{
    isOpen: boolean;
    layerId: string;
    frame: number;
    initialPrompt: string;
  }>({ isOpen: false, layerId: '', frame: 1, initialPrompt: '' });

  const [symbolModal, setSymbolModal] = useState<boolean>(false);
  const [exportModal, setExportModal] = useState<boolean>(false);
  // Show New Document creation dialog when the app starts!
  const [projectSettingsModal, setProjectSettingsModal] = useState<{ isOpen: boolean; isNew: boolean }>({
    isOpen: true,
    isNew: true,
  });

  // Active Scene layers or nested Symbol layers (MovieClip sub-animation!)
  const currentScene = doc.scenes.find((s) => s.id === currentSceneId) || doc.scenes[0];
  const currentSymbol = doc.symbols.find((s) => s.id === currentSymbolId);
  const activeLayers = currentSymbol ? currentSymbol.layers : currentScene.layers;

  // Selected layer & keyframe
  const selectedLayer = activeLayers.find((l) => l.id === selectedLayerId) || activeLayers[0];
  const activeKeyframe = selectedLayer?.keyframes.find((kf) => kf.frame === currentFrame) || null;

  // Animation playback timer
  const animFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(performance.now());

  // Playback Loop at configured FPS
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const frameInterval = 1000 / doc.fps;

    const tick = (now: number) => {
      const elapsed = now - lastTickTimeRef.current;

      if (elapsed >= frameInterval) {
        lastTickTimeRef.current = now - (elapsed % frameInterval);

        setCurrentFrame((prev) => {
          for (const layer of activeLayers) {
            const kf = layer.keyframes.find((k) => k.frame === prev);
            if (kf && kf.actions) {
              if (kf.actions.includes('stop();')) {
                setIsPlaying(false);
                return prev;
              }
              const gotoMatch = kf.actions.match(/gotoAndPlay\((\d+)\);/);
              if (gotoMatch) {
                return Number(gotoMatch[1]);
              }
            }
          }

          if (prev >= doc.totalFrames) {
            if (isLooping) return 1;
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    lastTickTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, doc.fps, doc.totalFrames, isLooping, activeLayers]);

  // Keyboard Shortcuts (including Grouping Ctrl+G and Break Apart Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const isModifier = e.ctrlKey || e.metaKey;

      if (isModifier && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        handleGroupSelected();
        return;
      }

      if (isModifier && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleBreakApartSelected();
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'ArrowRight' || e.key === '.') {
        e.preventDefault();
        setCurrentFrame((f) => Math.min(doc.totalFrames, f + 1));
      } else if (e.code === 'ArrowLeft' || e.key === ',') {
        e.preventDefault();
        setCurrentFrame((f) => Math.max(1, f - 1));
      } else if (e.code === 'KeyV') {
        setActiveTool('select');
      } else if (e.code === 'KeyA') {
        setActiveTool('subselect');
      } else if (e.code === 'KeyQ') {
        setActiveTool('freetransform');
      } else if (e.code === 'KeyR') {
        setActiveTool('rect');
      } else if (e.code === 'KeyO') {
        setActiveTool('circle');
      } else if (e.code === 'KeyS') {
        setActiveTool('star');
      } else if (e.code === 'KeyB' && !isModifier) {
        setActiveTool('brush');
      } else if (e.code === 'KeyY') {
        setActiveTool('pencil');
      } else if (e.code === 'KeyK') {
        setActiveTool('paintbucket');
      } else if (e.code === 'KeyE') {
        setActiveTool('eraser');
      } else if (e.code === 'KeyH') {
        setActiveTool('hand');
      } else if (e.code === 'KeyZ') {
        setActiveTool('zoom');
      } else if (e.code === 'Digit3') {
        setActiveTool('three');
      } else if (e.key === 'F6') {
        e.preventDefault();
        handleInsertKeyframe(selectedLayerId, currentFrame);
        playKeyframeAdd();
      } else if (e.key === 'F7') {
        e.preventDefault();
        handleInsertBlankKeyframe(selectedLayerId, currentFrame);
        playKeyframeAdd();
      } else if (e.key === 'F8') {
        e.preventDefault();
        setSymbolModal(true);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          handleDeleteSelectedElement();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [doc.totalFrames, selectedLayerId, currentFrame, selectedElementId, selectedLayer]);

  // Layer Mutations
  const updateActiveLayers = useCallback(
    (newLayers: Layer[]) => {
      setDoc((prev) => {
        if (currentSymbolId) {
          return {
            ...prev,
            symbols: prev.symbols.map((s) =>
              s.id === currentSymbolId ? { ...s, layers: newLayers } : s
            ),
          };
        }
        return {
          ...prev,
          scenes: prev.scenes.map((sc) =>
            sc.id === currentSceneId ? { ...sc, layers: newLayers } : sc
          ),
        };
      });
    },
    [currentSymbolId, currentSceneId]
  );

  const handleAddLayer = () => {
    const newLayer: Layer = {
      id: `layer_${Date.now()}`,
      name: `Capa ${activeLayers.length + 1}`,
      visible: true,
      locked: false,
      color: ['#14b8a6', '#06b6d4', '#10b981', '#3b82f6', '#8b5cf6'][activeLayers.length % 5],
      keyframes: [
        {
          frame: 1,
          tweenType: 'none',
          elements: [],
        },
      ],
    };
    updateActiveLayers([...activeLayers, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const handleDeleteLayer = (layerId: string) => {
    if (activeLayers.length <= 1) return;
    const filtered = activeLayers.filter((l) => l.id !== layerId);
    updateActiveLayers(filtered);
    if (selectedLayerId === layerId) {
      setSelectedLayerId(filtered[0].id);
    }
  };

  const handleToggleLayerVisibility = (layerId: string) => {
    updateActiveLayers(
      activeLayers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  };

  const handleToggleLayerLock = (layerId: string) => {
    updateActiveLayers(
      activeLayers.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l))
    );
  };

  // Keyframe Actions
  const handleInsertKeyframe = (layerId: string, frame: number) => {
    const layer = activeLayers.find((l) => l.id === layerId);
    if (!layer) return;

    const existingSorted = [...layer.keyframes].sort((a, b) => a.frame - b.frame);
    let prevElements: FlashElement[] = [];
    for (const k of existingSorted) {
      if (k.frame <= frame) prevElements = k.elements;
    }

    const newKeyframe: Keyframe = {
      frame,
      tweenType: 'none',
      elements: JSON.parse(JSON.stringify(prevElements)),
    };

    const newKfs = layer.keyframes.filter((k) => k.frame !== frame);
    newKfs.push(newKeyframe);

    updateActiveLayers(
      activeLayers.map((l) => (l.id === layerId ? { ...l, keyframes: newKfs } : l))
    );
  };

  const handleInsertBlankKeyframe = (layerId: string, frame: number) => {
    const layer = activeLayers.find((l) => l.id === layerId);
    if (!layer) return;

    const newKeyframe: Keyframe = {
      frame,
      tweenType: 'none',
      elements: [],
    };

    const newKfs = layer.keyframes.filter((k) => k.frame !== frame);
    newKfs.push(newKeyframe);

    updateActiveLayers(
      activeLayers.map((l) => (l.id === layerId ? { ...l, keyframes: newKfs } : l))
    );
  };

  const handleClearKeyframe = (layerId: string, frame: number) => {
    const layer = activeLayers.find((l) => l.id === layerId);
    if (!layer || frame === 1) return;

    const newKfs = layer.keyframes.filter((k) => k.frame !== frame);
    updateActiveLayers(
      activeLayers.map((l) => (l.id === layerId ? { ...l, keyframes: newKfs } : l))
    );
  };

  const handleSetTween = (
    layerId: string,
    frame: number,
    tween: TweenType,
    easing: EasingType = 'linear'
  ) => {
    const layer = activeLayers.find((l) => l.id === layerId);
    if (!layer) return;

    const kf =
      layer.keyframes.find((k) => k.frame === frame) ||
      [...layer.keyframes].reverse().find((k) => k.frame <= frame);

    if (kf) {
      kf.tweenType = tween;
      kf.easing = easing;
      updateActiveLayers([...activeLayers]);
    }
  };

  // Element Updates
  const handleUpdateElement = (updated: FlashElement) => {
    if (!selectedLayer) return;

    let kf = selectedLayer.keyframes.find((k) => k.frame === currentFrame);
    if (!kf) {
      handleInsertKeyframe(selectedLayer.id, currentFrame);
      kf = selectedLayer.keyframes.find((k) => k.frame === currentFrame);
    }

    if (kf) {
      kf.elements = kf.elements.map((el) => (el.id === updated.id ? updated : el));
      updateActiveLayers([...activeLayers]);
    }
  };

  const handleAddElement = (newEl: FlashElement) => {
    if (!selectedLayer) return;

    let kf = selectedLayer.keyframes.find((k) => k.frame === currentFrame);
    if (!kf) {
      handleInsertKeyframe(selectedLayer.id, currentFrame);
      kf = selectedLayer.keyframes.find((k) => k.frame === currentFrame);
    }

    if (kf) {
      kf.elements.push(newEl);
      updateActiveLayers([...activeLayers]);
    }
  };

  const handleDeleteSelectedElement = () => {
    if (!selectedLayer || !selectedElementId) return;
    const kf = selectedLayer.keyframes.find((k) => k.frame === currentFrame);
    if (kf) {
      kf.elements = kf.elements.filter((e) => e.id !== selectedElementId);
      setSelectedElementId(null);
      updateActiveLayers([...activeLayers]);
    }
  };

  // Grouping (Ctrl+G)
  const handleGroupSelected = () => {
    if (!selectedLayer || !selectedElementId) return;
    const kf = selectedLayer.keyframes.find((k) => k.frame === currentFrame);
    if (!kf) return;

    const el = kf.elements.find((e) => e.id === selectedElementId);
    if (!el || el.type === 'group') return;

    const groupEl: FlashElement = {
      id: `group_${Date.now()}`,
      name: `Grupo (${el.name})`,
      type: 'group',
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      fill: 'transparent',
      stroke: 'transparent',
      strokeWidth: 0,
      children: [JSON.parse(JSON.stringify(el))],
    };

    kf.elements = kf.elements.map((e) => (e.id === selectedElementId ? groupEl : e));
    setSelectedElementId(groupEl.id);
    updateActiveLayers([...activeLayers]);
    playButtonClick();
  };

  // Break Apart (Ctrl+B)
  const handleBreakApartSelected = () => {
    if (!selectedLayer || !selectedElementId) return;
    const kf = selectedLayer.keyframes.find((k) => k.frame === currentFrame);
    if (!kf) return;

    const el = kf.elements.find((e) => e.id === selectedElementId);
    if (!el) return;

    if (el.type === 'group' && el.children && el.children.length > 0) {
      // Unpack group children into layer elements
      const unpacked = el.children;
      kf.elements = kf.elements.filter((e) => e.id !== selectedElementId).concat(unpacked);
      setSelectedElementId(unpacked[0].id);
      updateActiveLayers([...activeLayers]);
      playButtonClick();
    } else if (el.type === 'symbolInstance' && el.symbolId) {
      // Break symbol apart into raw shapes
      const sym = doc.symbols.find((s) => s.id === el.symbolId);
      if (sym && sym.layers.length > 0) {
        const frame1Els = sym.layers[0].keyframes[0]?.elements || [];
        const rawClones = frame1Els.map((sub, i) => ({
          ...JSON.parse(JSON.stringify(sub)),
          id: `break_${Date.now()}_${i}`,
          x: el.x + (sub.x - (sym.layers[0].keyframes[0]?.elements[0]?.x || 0)),
          y: el.y + (sub.y - (sym.layers[0].keyframes[0]?.elements[0]?.y || 0)),
        }));
        kf.elements = kf.elements.filter((e) => e.id !== selectedElementId).concat(rawClones);
        if (rawClones.length > 0) setSelectedElementId(rawClones[0].id);
        updateActiveLayers([...activeLayers]);
        playButtonClick();
      }
    }
  };

  // Convert to Symbol (F8)
  const handleConvertToSymbol = (
    name: string,
    type: 'movieclip' | 'button' | 'graphic',
    regPoint: RegistrationPoint = 'center'
  ) => {
    const selectedEl = activeLayers
      .flatMap((l) => l.keyframes.find((k) => k.frame === currentFrame)?.elements || [])
      .find((e) => e.id === selectedElementId);

    const elementsToEncapsulate = selectedEl ? [selectedEl] : [];

    const newSymbol: FlashSymbol = {
      id: `sym_${Date.now()}`,
      name,
      type,
      totalFrames: 24,
      layers: [
        {
          id: `sublayer_${Date.now()}`,
          name: 'Capa 1',
          visible: true,
          locked: false,
          color: '#14b8a6',
          keyframes: [
            {
              frame: 1,
              tweenType: 'none',
              elements: JSON.parse(JSON.stringify(elementsToEncapsulate)),
            },
          ],
        },
      ],
    };

    // Replace selected element on stage with SymbolInstance
    if (selectedEl && selectedLayer) {
      const symInstance: FlashElement = {
        id: `inst_${Date.now()}`,
        name: `Instancia de ${name}`,
        type: 'symbolInstance',
        symbolId: newSymbol.id,
        x: selectedEl.x,
        y: selectedEl.y,
        width: selectedEl.width,
        height: selectedEl.height,
        rotation: selectedEl.rotation || 0,
        scaleX: selectedEl.scaleX ?? 1,
        scaleY: selectedEl.scaleY ?? 1,
        opacity: selectedEl.opacity ?? 1,
        fill: selectedEl.fill || '#14b8a6',
        stroke: selectedEl.stroke || '#0f766e',
        strokeWidth: selectedEl.strokeWidth || 2,
        registrationPoint: regPoint,
      };

      const kf = selectedLayer.keyframes.find((k) => k.frame === currentFrame);
      if (kf) {
        kf.elements = kf.elements.map((e) => (e.id === selectedEl.id ? symInstance : e));
        setSelectedElementId(symInstance.id);
      }
    }

    setDoc((prev) => ({
      ...prev,
      symbols: [...prev.symbols, newSymbol],
    }));

    playButtonClick();
  };

  // Apply project settings / new project
  const handleApplyProjectSettings = (settings: ProjectSettings, isNewProject = false) => {
    if (isNewProject) {
      const centerX = Math.round(settings.width / 2);
      const topY = Math.round(settings.height * 0.25);
      const groundY = Math.round(settings.height * 0.78);
      const shadowY = Math.round(settings.height * 0.85);
      const ballSize = Math.max(40, Math.round(settings.height * 0.13));

      const initialLayers: Layer[] =
        settings.template === 'blank'
          ? [
              {
                id: `layer_${Date.now()}`,
                name: 'Capa 1',
                visible: true,
                locked: false,
                color: '#14b8a6',
                keyframes: [
                  {
                    frame: 1,
                    tweenType: 'none',
                    elements: [],
                  },
                ],
              },
            ]
          : [
              {
                id: `layer_ball_${Date.now()}`,
                name: 'Pelota Verde Agua',
                visible: true,
                locked: false,
                color: '#14b8a6',
                keyframes: [
                  {
                    frame: 1,
                    tweenType: 'motion',
                    easing: 'easeIn',
                    prompt: 'Pelota arriba lista para caer',
                    elements: [
                      {
                        id: 'ball_1',
                        name: 'Pelota',
                        type: 'shape',
                        shapeType: 'circle',
                        x: centerX,
                        y: topY,
                        width: ballSize,
                        height: ballSize,
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                        opacity: 1,
                        fill: '#14b8a6',
                        stroke: '#0f766e',
                        strokeWidth: 4,
                      },
                    ],
                  },
                  {
                    frame: 16,
                    tweenType: 'motion',
                    easing: 'bounce',
                    prompt: 'Impacto y deformación squash',
                    elements: [
                      {
                        id: 'ball_1',
                        name: 'Pelota',
                        type: 'shape',
                        shapeType: 'circle',
                        x: centerX,
                        y: groundY,
                        width: Math.round(ballSize * 1.5),
                        height: Math.round(ballSize * 0.65),
                        rotation: 0,
                        scaleX: 1.45,
                        scaleY: 0.65,
                        opacity: 1,
                        fill: '#0d9488',
                        stroke: '#115e59',
                        strokeWidth: 4,
                      },
                    ],
                  },
                  {
                    frame: 32,
                    tweenType: 'motion',
                    easing: 'easeOut',
                    prompt: 'Rebote y stretch hacia arriba',
                    elements: [
                      {
                        id: 'ball_1',
                        name: 'Pelota',
                        type: 'shape',
                        shapeType: 'circle',
                        x: centerX,
                        y: topY + 20,
                        width: Math.round(ballSize * 0.9),
                        height: Math.round(ballSize * 1.15),
                        rotation: 0,
                        scaleX: 0.9,
                        scaleY: 1.15,
                        opacity: 1,
                        fill: '#2dd4bf',
                        stroke: '#0f766e',
                        strokeWidth: 4,
                      },
                    ],
                  },
                  {
                    frame: 48,
                    tweenType: 'motion',
                    easing: 'linear',
                    prompt: 'Retorno a posición original',
                    actions: 'gotoAndPlay(1);',
                    elements: [
                      {
                        id: 'ball_1',
                        name: 'Pelota',
                        type: 'shape',
                        shapeType: 'circle',
                        x: centerX,
                        y: topY,
                        width: ballSize,
                        height: ballSize,
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                        opacity: 1,
                        fill: '#14b8a6',
                        stroke: '#0f766e',
                        strokeWidth: 4,
                      },
                    ],
                  },
                ],
              },
              {
                id: `layer_shadow_${Date.now()}`,
                name: 'Sombra Suelo',
                visible: true,
                locked: false,
                color: '#64748b',
                keyframes: [
                  {
                    frame: 1,
                    tweenType: 'motion',
                    easing: 'easeIn',
                    elements: [
                      {
                        id: 'shadow_1',
                        name: 'Sombra',
                        type: 'shape',
                        shapeType: 'circle',
                        x: centerX,
                        y: shadowY,
                        width: Math.round(ballSize * 0.6),
                        height: Math.round(ballSize * 0.18),
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                        opacity: 0.25,
                        fill: '#000000',
                        stroke: 'transparent',
                        strokeWidth: 0,
                      },
                    ],
                  },
                  {
                    frame: 16,
                    tweenType: 'motion',
                    easing: 'bounce',
                    elements: [
                      {
                        id: 'shadow_1',
                        name: 'Sombra',
                        type: 'shape',
                        shapeType: 'circle',
                        x: centerX,
                        y: shadowY,
                        width: Math.round(ballSize * 1.4),
                        height: Math.round(ballSize * 0.3),
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                        opacity: 0.6,
                        fill: '#000000',
                        stroke: 'transparent',
                        strokeWidth: 0,
                      },
                    ],
                  },
                  {
                    frame: 48,
                    tweenType: 'none',
                    elements: [
                      {
                        id: 'shadow_1',
                        name: 'Sombra',
                        type: 'shape',
                        shapeType: 'circle',
                        x: centerX,
                        y: shadowY,
                        width: Math.round(ballSize * 0.6),
                        height: Math.round(ballSize * 0.18),
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                        opacity: 0.25,
                        fill: '#000000',
                        stroke: 'transparent',
                        strokeWidth: 0,
                      },
                    ],
                  },
                ],
              },
            ];

      const newDoc: FlashDocument = {
        title: settings.title,
        width: settings.width,
        height: settings.height,
        fps: settings.fps,
        totalFrames: settings.totalFrames,
        backgroundColor: settings.backgroundColor,
        scenes: [
          {
            id: `scene_${Date.now()}`,
            name: 'Escena 1',
            layers: initialLayers,
          },
        ],
        symbols: [],
      };
      setDoc(newDoc);
      setCurrentSceneId(newDoc.scenes[0].id);
      setCurrentSymbolId(null);
      setCurrentFrame(1);
      setSelectedLayerId(initialLayers[0].id);
      setSelectedElementId(initialLayers[0].keyframes[0]?.elements[0]?.id || null);
    } else {
      setDoc((prev) => ({
        ...prev,
        title: settings.title,
        width: settings.width,
        height: settings.height,
        fps: settings.fps,
        totalFrames: settings.totalFrames,
        backgroundColor: settings.backgroundColor,
      }));
    }
  };

  const handleApplyAiAnimation = (animData: {
    totalFrames?: number;
    fps?: number;
    backgroundColor?: string;
    layers: Layer[];
  }) => {
    setDoc((prev) => ({
      ...prev,
      totalFrames: animData.totalFrames || prev.totalFrames,
      fps: animData.fps || prev.fps,
      backgroundColor: animData.backgroundColor || prev.backgroundColor,
      scenes: prev.scenes.map((s, idx) =>
        idx === 0 ? { ...s, layers: animData.layers } : s
      ),
    }));

    if (animData.layers.length > 0) {
      setSelectedLayerId(animData.layers[0].id);
      setCurrentFrame(1);
    }
  };

  const handleApplyFramePrompt = async (frame: number, prompt: string, shouldGenerateWithAi = true) => {
    if (!selectedLayer) return;

    let kf = selectedLayer.keyframes.find((k) => k.frame === frame);
    if (!kf) {
      handleInsertKeyframe(selectedLayer.id, frame);
      kf = selectedLayer.keyframes.find((k) => k.frame === frame);
    }

    if (kf) {
      kf.prompt = prompt;
      updateActiveLayers([...activeLayers]);
    }

    if (shouldGenerateWithAi && kf) {
      try {
        const response = await fetch('/api/ai/frame-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frame,
            prompt,
            currentElements: kf.elements,
          }),
        });
        if (response.ok) {
          const result = await response.json();
          if (result.elements) {
            kf.elements = result.elements;
            updateActiveLayers([...activeLayers]);
          }
        }
      } catch (e) {
        console.error('Error generando frame con IA:', e);
      }
    }
  };

  const handleExecuteAction = (actionStr: string) => {
    if (actionStr.includes('stop();')) {
      setIsPlaying(false);
    } else if (actionStr.includes('play();')) {
      setIsPlaying(true);
    } else if (actionStr.includes('gotoAndPlay(')) {
      const match = actionStr.match(/gotoAndPlay\((\d+)\)/);
      if (match) {
        setCurrentFrame(Number(match[1]));
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Top Application Header Bar */}
      <header className="h-11 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between shrink-0 select-none">
        {/* Brand & Breadcrumbs Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-teal-400 to-teal-600 text-zinc-950 font-black flex items-center justify-center text-sm font-mono shadow-md shadow-teal-500/20">
              s
            </div>
            <span className="font-bold text-base tracking-tight text-white">slow studio</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-teal-400 border border-teal-500/30 font-mono">
              {doc.width}×{doc.height} • {doc.fps} fps
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-800 mx-1" />

          {/* Breadcrumb Navigation: Escena 1 > MovieClip Sub-animación */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            {currentSymbolId ? (
              <>
                <button
                  onClick={() => setCurrentSymbolId(null)}
                  className="hover:text-teal-400 transition flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-teal-300"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Volver a {currentScene.name}</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                <span className="text-teal-300 font-medium flex items-center gap-1 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30">
                  <Film className="w-3 h-3 text-teal-400" />
                  <span>{currentSymbol?.name} (Sub-animación)</span>
                </span>
              </>
            ) : (
              <span className="text-zinc-200 font-medium flex items-center gap-1">
                <Film className="w-3 h-3 text-teal-400" />
                <span>{currentScene.name}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Header Controls: New Project, Settings, Export, Panels */}
        <div className="flex items-center gap-2">
          {/* New Project button */}
          <button
            onClick={() => setProjectSettingsModal({ isOpen: true, isNew: true })}
            title="Crear Nuevo Proyecto con resolución personalizada"
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 border border-zinc-700 transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-teal-400" />
            <span>Nuevo</span>
          </button>

          {/* Project Settings / Resolution button */}
          <button
            onClick={() => setProjectSettingsModal({ isOpen: true, isNew: false })}
            title="Configurar Resolución y FPS"
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 border border-zinc-700 transition"
          >
            <Settings className="w-3.5 h-3.5 text-teal-400" />
            <span>Resolución</span>
          </button>

          <div className="h-4 w-px bg-zinc-800 mx-1" />

          {/* Panel Toggle Tabs */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded border border-zinc-800 text-xs">
            <button
              onClick={() =>
                setActiveSidePanel(activeSidePanel === 'properties' ? 'none' : 'properties')
              }
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition ${
                activeSidePanel === 'properties'
                  ? 'bg-teal-500 text-zinc-950 font-medium shadow-sm shadow-teal-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Propiedades</span>
            </button>
            <button
              onClick={() => setActiveSidePanel(activeSidePanel === 'library' ? 'none' : 'library')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition ${
                activeSidePanel === 'library'
                  ? 'bg-teal-500 text-zinc-950 font-medium shadow-sm shadow-teal-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Biblioteca ({doc.symbols.length})</span>
            </button>
          </div>

          <div className="h-4 w-px bg-zinc-800 mx-1" />

          {/* Export Project button */}
          <button
            onClick={() => setExportModal(true)}
            className="px-3 py-1 rounded bg-teal-500 hover:bg-teal-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar (GIF / HTML5 / .exe)</span>
          </button>
        </div>
      </header>

      {/* Main Split Body:
          LEFT: slow Copilot IA
          RIGHT: Vector Stage, Toolbox, Timeline & Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Artificial Intelligence Chat Box */}
        <FlashAIChat
          currentDocument={doc}
          currentFrame={currentFrame}
          onApplyAnimation={handleApplyAiAnimation}
          onApplyFramePrompt={(frame, prompt) => handleApplyFramePrompt(frame, prompt, true)}
          onPlayAnimation={() => {
            setCurrentFrame(1);
            setIsPlaying(true);
          }}
        />

        {/* Right Side: slow studio Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
          <div className="flex-1 flex overflow-hidden">
            {/* Toolbox on the left */}
            <FlashToolbox
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              primaryColor={primaryColor}
              onChangePrimaryColor={setPrimaryColor}
              strokeColor={strokeColor}
              onChangeStrokeColor={setStrokeColor}
              strokeWidth={strokeWidth}
              onChangeStrokeWidth={setStrokeWidth}
            />

            {/* The White Interactive HTML5 Canvas (Escenario Base 1920x1080) */}
            <FlashStage
              layers={activeLayers}
              currentFrame={currentFrame}
              totalFrames={doc.totalFrames}
              width={doc.width}
              height={doc.height}
              backgroundColor={doc.backgroundColor}
              activeTool={activeTool}
              primaryColor={primaryColor}
              strokeColor={strokeColor}
              strokeWidth={strokeWidth}
              selectedElementId={selectedElementId}
              selectedPointIndex={selectedPointIndex}
              onSelectElement={setSelectedElementId}
              onSelectPointIndex={setSelectedPointIndex}
              onUpdateElement={handleUpdateElement}
              onAddElement={handleAddElement}
              onEnterSymbol={(symId) => setCurrentSymbolId(symId)}
              symbols={doc.symbols}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              onionSkin={onionSkin}
              onToggleOnionSkin={() => setOnionSkin((o) => !o)}
              onExecuteAction={handleExecuteAction}
              activeKeyframePrompt={activeKeyframe?.prompt}
            />

            {/* Right Side Panel */}
            {activeSidePanel === 'properties' && (
              <PropertiesPanel
                selectedElement={
                  activeLayers
                    .flatMap((l) => l.keyframes.find((k) => k.frame === currentFrame)?.elements || [])
                    .find((e) => e.id === selectedElementId) || null
                }
                activeKeyframe={activeKeyframe}
                currentFrame={currentFrame}
                fps={doc.fps}
                width={doc.width}
                height={doc.height}
                backgroundColor={doc.backgroundColor}
                onUpdateElement={handleUpdateElement}
                onUpdateKeyframe={(updates) => {
                  if (activeKeyframe && selectedLayer) {
                    Object.assign(activeKeyframe, updates);
                    updateActiveLayers([...activeLayers]);
                  }
                }}
                onConvertToSymbol={() => setSymbolModal(true)}
                onGroupSelected={handleGroupSelected}
                onBreakApartSelected={handleBreakApartSelected}
                onPromptGenerateForFrame={(f, p) => handleApplyFramePrompt(f, p, true)}
                onOpenProjectSettings={() => setProjectSettingsModal({ isOpen: true, isNew: false })}
              />
            )}

            {activeSidePanel === 'library' && (
              <LibraryPanel
                symbols={doc.symbols}
                onInstantiateSymbol={(sym) => {
                  const newEl: FlashElement = {
                    id: `sym_inst_${Date.now()}`,
                    name: sym.name,
                    type: 'symbolInstance',
                    symbolId: sym.id,
                    x: Math.round(doc.width / 2) - 100,
                    y: Math.round(doc.height / 2) - 80,
                    width: 200,
                    height: 160,
                    rotation: 0,
                    scaleX: 1,
                    scaleY: 1,
                    opacity: 1,
                    fill: '#14b8a6',
                    stroke: '#0f766e',
                    strokeWidth: 3,
                  };
                  handleAddElement(newEl);
                  setSelectedElementId(newEl.id);
                  playButtonClick();
                }}
                onEditSymbol={(symId) => setCurrentSymbolId(symId)}
                onCreateNewSymbol={() => setSymbolModal(true)}
              />
            )}
          </div>

          {/* Timeline on the bottom */}
          <FlashTimeline
            layers={activeLayers}
            currentFrame={currentFrame}
            totalFrames={doc.totalFrames}
            fps={doc.fps}
            isPlaying={isPlaying}
            isLooping={isLooping}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
            onSelectFrame={setCurrentFrame}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            onToggleLoop={() => setIsLooping((l) => !l)}
            onStop={() => {
              setIsPlaying(false);
              setCurrentFrame(1);
            }}
            onStepBack={() => setCurrentFrame((f) => Math.max(1, f - 1))}
            onStepForward={() => setCurrentFrame((f) => Math.min(doc.totalFrames, f + 1))}
            onAddLayer={handleAddLayer}
            onDeleteLayer={handleDeleteLayer}
            onToggleLayerVisibility={handleToggleLayerVisibility}
            onToggleLayerLock={handleToggleLayerLock}
            onInsertKeyframe={handleInsertKeyframe}
            onInsertBlankKeyframe={handleInsertBlankKeyframe}
            onClearKeyframe={handleClearKeyframe}
            onSetTween={handleSetTween}
            onOpenFramePrompt={(layerId, frame) => {
              const layer = activeLayers.find((l) => l.id === layerId);
              const kf = layer?.keyframes.find((k) => k.frame === frame);
              setFramePromptModal({
                isOpen: true,
                layerId,
                frame,
                initialPrompt: kf?.prompt || '',
              });
            }}
            onOpenFrameActions={(layerId, frame) => {
              const layer = activeLayers.find((l) => l.id === layerId);
              const kf = layer?.keyframes.find((k) => k.frame === frame);
              setActionScriptModal({
                isOpen: true,
                layerId,
                frame,
                initialCode: kf?.actions || '',
              });
            }}
            onChangeFps={(newFps) => setDoc((prev) => ({ ...prev, fps: newFps }))}
          />
        </div>
      </div>

      {/* Modals */}
      <ProjectSettingsModal
        isOpen={projectSettingsModal.isOpen}
        onClose={() => setProjectSettingsModal({ isOpen: false, isNew: false })}
        currentSettings={{
          title: doc.title,
          width: doc.width,
          height: doc.height,
          fps: doc.fps,
          totalFrames: doc.totalFrames,
          backgroundColor: doc.backgroundColor,
        }}
        onApplySettings={handleApplyProjectSettings}
        isNewProjectMode={projectSettingsModal.isNew}
      />

      <ActionScriptModal
        isOpen={actionScriptModal.isOpen}
        onClose={() => setActionScriptModal((m) => ({ ...m, isOpen: false }))}
        initialCode={actionScriptModal.initialCode}
        frameNumber={actionScriptModal.frame}
        onSave={(code) => {
          const layer = activeLayers.find((l) => l.id === actionScriptModal.layerId);
          let kf = layer?.keyframes.find((k) => k.frame === actionScriptModal.frame);
          if (!kf && layer) {
            handleInsertKeyframe(layer.id, actionScriptModal.frame);
            kf = layer.keyframes.find((k) => k.frame === actionScriptModal.frame);
          }
          if (kf) {
            kf.actions = code;
            updateActiveLayers([...activeLayers]);
          }
        }}
      />

      <FramePromptModal
        isOpen={framePromptModal.isOpen}
        onClose={() => setFramePromptModal((m) => ({ ...m, isOpen: false }))}
        frameNumber={framePromptModal.frame}
        initialPrompt={framePromptModal.initialPrompt}
        onApplyPrompt={async (prompt, shouldGen) => {
          await handleApplyFramePrompt(framePromptModal.frame, prompt, shouldGen);
        }}
      />

      <SymbolModal
        isOpen={symbolModal}
        onClose={() => setSymbolModal(false)}
        defaultName={`Simbolo ${doc.symbols.length + 1}`}
        onConfirm={handleConvertToSymbol}
      />

      <ExportModal
        isOpen={exportModal}
        onClose={() => setExportModal(false)}
        document={doc}
      />
    </div>
  );
}
