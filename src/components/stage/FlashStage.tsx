import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  CameraViewport,
  FlashElement,
  FlashSymbol,
  Layer,
  MotionPathData,
  OnionSkinSettings,
  ToolType,
} from '../../types/flash';
import { getLayerElementsAtFrame } from '../../utils/interpolation';
import { resolveCanvasFill } from '../../utils/colorUtils';
import {
  findActiveMotionTweenSegment,
  sampleMotionPathFrames,
  evaluateBezierPoint,
} from '../../utils/motionPathUtils';
import { ThreeStageView } from './ThreeStageView';
import { MiniStage } from './MiniStage';
import { CameraViewControl } from './CameraViewControl';
import { OnionSkinControl } from './OnionSkinControl';
import { playButtonClick, playButtonHover } from '../../utils/audio';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Grid,
  Play,
  Pause,
  Layers,
  Sparkles,
  Hand,
  RotateCcw,
  Camera,
  Tv,
  Sliders,
  Focus,
  Spline,
} from 'lucide-react';

interface FlashStageProps {
  layers: Layer[];
  currentFrame: number;
  totalFrames: number;
  width: number;
  height: number;
  backgroundColor: string;
  activeTool: ToolType;
  primaryColor: string;
  strokeColor: string;
  strokeWidth: number;
  selectedElementId: string | null;
  selectedPointIndex: number | null;
  selectedLayerId?: string;
  isIsolatedMode?: boolean;
  onToggleIsolatedMode?: () => void;
  onSelectLayer?: (layerId: string) => void;
  onSelectElement: (id: string | null) => void;
  onSelectPointIndex: (index: number | null) => void;
  onUpdateElement: (element: FlashElement) => void;
  onAddElement: (element: FlashElement) => void;
  onEnterSymbol?: (symbolId: string) => void;
  symbols: FlashSymbol[];
  isPlaying: boolean;
  onTogglePlay: () => void;
  onionSkin: boolean;
  onToggleOnionSkin: () => void;
  onExecuteAction?: (action: string) => void;
  activeKeyframePrompt?: string;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  snapToGrid?: boolean;
  onToggleSnapToGrid?: () => void;
  gridSize?: number;
  onUpdateMotionPath?: (path: MotionPathData, kfFrame: number) => void;
  isMotionPathPanelOpen?: boolean;
  onToggleMotionPathPanel?: () => void;
}

export const FlashStage: React.FC<FlashStageProps> = ({
  layers,
  currentFrame,
  totalFrames,
  width,
  height,
  backgroundColor,
  activeTool,
  primaryColor,
  strokeColor,
  strokeWidth,
  selectedElementId,
  selectedPointIndex,
  selectedLayerId,
  isIsolatedMode,
  onToggleIsolatedMode,
  onSelectLayer,
  onSelectElement,
  onSelectPointIndex,
  onUpdateElement,
  onAddElement,
  onEnterSymbol,
  symbols,
  isPlaying,
  onTogglePlay,
  onionSkin,
  onToggleOnionSkin,
  onExecuteAction,
  activeKeyframePrompt,
  showGrid = false,
  onToggleGrid,
  snapToGrid = false,
  onToggleSnapToGrid,
  gridSize = 20,
  onUpdateMotionPath,
  isMotionPathPanelOpen = false,
  onToggleMotionPathPanel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(0.45);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isAltPressed, setIsAltPressed] = useState<boolean>(false);

  const [localShowGrid, setLocalShowGrid] = useState<boolean>(showGrid);
  const isGridVisible = showGrid || localShowGrid || snapToGrid;
  const toggleGrid = onToggleGrid || (() => setLocalShowGrid((g) => !g));

  const isSnapActive = !!snapToGrid;
  const currentGridSize = gridSize || 20;

  const snapVal = useCallback(
    (val: number) => {
      if (!isSnapActive) return val;
      return Math.round(val / currentGridSize) * currentGridSize;
    },
    [isSnapActive, currentGridSize]
  );

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [panStart, setPanStart] = useState<{ clientX: number; clientY: number } | null>(null);
  const [dragType, setDragType] = useState<
    'move' | 'create' | 'handle' | 'vectorPoint' | 'pan' | 'cameraMove' | 'cameraResize' | 'motionPath_cp1' | 'motionPath_cp2'
  >('move');
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [tempPoints, setTempPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [hoveredButtonId, setHoveredButtonId] = useState<string | null>(null);

  // Feature 1: Advanced Onion Skinning (Ghosting) State
  const [onionSkinSettings, setOnionSkinSettings] = useState<OnionSkinSettings>({
    enabled: onionSkin,
    mode: 'all',
    pastFramesCount: 2,
    futureFramesCount: 2,
    baseOpacity: 0.35,
    pastColor: '#14b8a6', // Verde agua
    futureColor: '#38bdf8', // Cian
  });
  const [isOnionSkinMenuOpen, setIsOnionSkinMenuOpen] = useState<boolean>(false);

  // Sync prop changes
  useEffect(() => {
    setOnionSkinSettings((prev) => ({ ...prev, enabled: onionSkin }));
  }, [onionSkin]);

  // Feature 2: Camera Viewport Framing State
  const [cameraViewport, setCameraViewport] = useState<CameraViewport>({
    x: Math.round(width * 0.15),
    y: Math.round(height * 0.15),
    width: Math.round(width * 0.7),
    height: Math.round(height * 0.7),
    active: false,
    isEditing: false,
  });
  const [isCameraControlOpen, setIsCameraControlOpen] = useState<boolean>(false);

  // Feature 3: MiniStage floating panel visibility
  const [showMiniStage, setShowMiniStage] = useState<boolean>(true);

  // Feature 4: Modo Aislamiento (Solo ver capa activa)
  const [localIsolateMode, setLocalIsolateMode] = useState<boolean>(false);
  const isIsolated = isIsolatedMode !== undefined ? isIsolatedMode : localIsolateMode;
  const toggleIsolateMode = useCallback(() => {
    if (onToggleIsolatedMode) {
      onToggleIsolatedMode();
    } else {
      setLocalIsolateMode((prev) => !prev);
    }
  }, [onToggleIsolatedMode]);

  const [autoIsolateOnSelect, setAutoIsolateOnSelect] = useState<boolean>(false);

  // Auto-fit stage inside container on mount or when resolution changes
  const fitToScreen = useCallback(() => {
    if (containerRef.current) {
      const containerW = containerRef.current.clientWidth - 48;
      const containerH = containerRef.current.clientHeight - 60;
      if (containerW > 100 && containerH > 100) {
        const fitScale = Math.min(containerW / width, containerH / height);
        const rounded = Math.max(0.1, Math.min(2, Math.round(fitScale * 20) / 20));
        setZoom(rounded);
        setPanOffset({ x: 0, y: 0 });
        return;
      }
    }
    setZoom(width > 1200 ? 0.45 : 0.8);
    setPanOffset({ x: 0, y: 0 });
  }, [width, height]);

  // Feature 2 Action: Apply Camera Auto-Zoom and Auto-Pan Centering
  const applyCameraFraming = useCallback(() => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth - 48;
    const containerH = containerRef.current.clientHeight - 60;
    if (containerW <= 100 || containerH <= 100) return;

    // Scale so that cameraViewport fits inside visible container
    const fitScale = Math.min(
      containerW / cameraViewport.width,
      containerH / cameraViewport.height
    );
    const targetZoom = Math.max(0.1, Math.min(2.5, Math.round(fitScale * 20) / 20));

    // Calculate center offset so camera center matches container center
    const camCenterX = cameraViewport.x + cameraViewport.width / 2;
    const camCenterY = cameraViewport.y + cameraViewport.height / 2;
    const stageCenterX = width / 2;
    const stageCenterY = height / 2;

    const targetPanX = Math.round((stageCenterX - camCenterX) * targetZoom);
    const targetPanY = Math.round((stageCenterY - camCenterY) * targetZoom);

    setZoom(targetZoom);
    setPanOffset({ x: targetPanX, y: targetPanY });
    setCameraViewport((prev) => ({ ...prev, active: true }));
  }, [cameraViewport, width, height]);

  const resetCameraFraming = useCallback(() => {
    setCameraViewport((prev) => ({ ...prev, active: false }));
    fitToScreen();
  }, [fitToScreen]);

  useEffect(() => {
    fitToScreen();
  }, [fitToScreen]);

  // Track Spacebar, Alt, and Isolation shortcuts (I to toggle, Esc to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
      if (e.altKey) {
        setIsAltPressed(true);
      }
      if (e.key === 'Escape' && isIsolated) {
        e.preventDefault();
        if (onToggleIsolatedMode) onToggleIsolatedMode();
        else setLocalIsolateMode(false);
      }
      if ((e.key === 'i' || e.key === 'I') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleIsolateMode();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
      if (!e.altKey) {
        setIsAltPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isIsolated, onToggleIsolatedMode, toggleIsolateMode]);

  // Feature: Modo Aislamiento (Solo ver capa activa)
  // Determines which layer is actively isolated
  const currentActiveLayerId =
    selectedLayerId ||
    (selectedElementId
      ? layers.find((l) =>
          getLayerElementsAtFrame(l, currentFrame).some((e) => e.id === selectedElementId)
        )?.id
      : layers[0]?.id);

  const activeIsolatedLayer =
    layers.find((l) => l.id === currentActiveLayerId) || layers[0];

  const effectiveLayers =
    isIsolated && currentActiveLayerId
      ? layers.filter((l) => l.id === currentActiveLayerId)
      : layers;

  // Compute visible elements at current frame (respecting layer isolation)
  const currentElements: FlashElement[] = [];
  effectiveLayers.forEach((layer) => {
    if (layer.visible) {
      currentElements.push(...getLayerElementsAtFrame(layer, currentFrame));
    }
  });

  const selectedElement = currentElements.find((e) => e.id === selectedElementId);
  const hasThreeElements = currentElements.some((e) => e.type === 'threeObject');

  // Active Motion Tween segment for interactive motion path Bézier editing
  const activeTargetLayer =
    layers.find((l) => l.id === selectedLayerId) || activeIsolatedLayer || layers[0] || null;
  const activeMotionTween = findActiveMotionTweenSegment(
    activeTargetLayer,
    currentFrame,
    selectedElementId
  );

  // Convert client mouse event to stage canvas coordinates
  const getStageCoordinates = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      return {
        x: Math.round((e.clientX - rect.left) * scaleX),
        y: Math.round((e.clientY - rect.top) * scaleY),
      };
    },
    [width, height]
  );

  // Render 2D Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Optional Grid & Snap Guidelines
    if (isGridVisible) {
      const step = currentGridSize;
      const majorStep = step * 4;

      // Minor lines
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += step) {
        if (x % majorStep !== 0) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }
      for (let y = 0; y <= height; y += step) {
        if (y % majorStep !== 0) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Major lines
      ctx.strokeStyle = isSnapActive ? 'rgba(20, 184, 166, 0.22)' : 'rgba(20, 184, 166, 0.14)';
      ctx.lineWidth = 1.2;
      for (let x = 0; x <= width; x += majorStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += majorStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Feature 1: Advanced Onion Skinning (Ghosting Modes: All, Previous, Next)
    if (onionSkinSettings.enabled && !isPlaying) {
      const { mode, pastFramesCount, futureFramesCount, baseOpacity, pastColor, futureColor } =
        onionSkinSettings;

      // 1. Past frames (before current playhead)
      if (mode === 'all' || mode === 'prev') {
        const count = mode === 'prev' ? 1 : pastFramesCount;
        const pastFrames: number[] = [];
        for (let i = 1; i <= count; i++) {
          const f = currentFrame - i;
          if (f >= 1) pastFrames.push(f);
        }

        pastFrames.forEach((f, idx) => {
          const dist = idx + 1;
          const factor = Math.max(0.2, 1 - (dist - 1) * 0.25);
          const opacity = baseOpacity * factor;

          effectiveLayers.forEach((layer) => {
            if (!layer.visible) return;
            const els = getLayerElementsAtFrame(layer, f);
            els.forEach((el) => {
              drawElement(ctx, el, symbols, currentFrame, {
                overrideOpacity: opacity,
                overrideStroke: pastColor,
                overrideFill: pastColor,
              });
            });
          });
        });
      }

      // 2. Future frames (after current playhead)
      if (mode === 'all' || mode === 'next') {
        const count = mode === 'next' ? 1 : futureFramesCount;
        const futureFrames: number[] = [];
        for (let i = 1; i <= count; i++) {
          const f = currentFrame + i;
          if (f <= totalFrames) futureFrames.push(f);
        }

        futureFrames.forEach((f, idx) => {
          const dist = idx + 1;
          const factor = Math.max(0.2, 1 - (dist - 1) * 0.25);
          const opacity = baseOpacity * factor;

          effectiveLayers.forEach((layer) => {
            if (!layer.visible) return;
            const els = getLayerElementsAtFrame(layer, f);
            els.forEach((el) => {
              drawElement(ctx, el, symbols, currentFrame, {
                overrideOpacity: opacity,
                overrideStroke: futureColor,
                overrideFill: futureColor,
              });
            });
          });
        });
      }
    }

    // Draw current frame elements
    currentElements.forEach((el) => {
      if (el.type === 'threeObject') return;
      const isHovered = el.id === hoveredButtonId;
      drawElement(ctx, el, symbols, currentFrame, { isHovered });
    });

    // Draw active drawing preview (pencil/brush/shapes)
    if (isDragging && dragStart && tempPoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      tempPoints.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.restore();
    }

    // Selection gizmo & bounding box in verde agua theme
    if (selectedElement && selectedElement.type !== 'threeObject' && !isPlaying) {
      if (activeTool === 'subselect') {
        drawVectorSubselectionPoints(ctx, selectedElement, selectedPointIndex);
      } else {
        drawSelectionGizmo(ctx, selectedElement);
      }
    }

    // Feature 2: Camera Viewport Overlay & Framing (Cinematic Letterboxing and Viewport Box)
    if (cameraViewport.active || cameraViewport.isEditing) {
      const cx = cameraViewport.x;
      const cy = cameraViewport.y;
      const cw = cameraViewport.width;
      const ch = cameraViewport.height;

      ctx.save();
      // Letterbox dark matte outside camera viewport
      ctx.fillStyle = cameraViewport.active ? 'rgba(0, 0, 0, 0.72)' : 'rgba(0, 0, 0, 0.42)';
      ctx.fillRect(0, 0, width, cy);
      ctx.fillRect(0, cy + ch, width, height - (cy + ch));
      ctx.fillRect(0, cy, cx, ch);
      ctx.fillRect(cx + cw, cy, width - (cx + cw), ch);

      // Camera border
      ctx.strokeStyle = cameraViewport.active ? '#14b8a6' : '#2dd4bf';
      ctx.lineWidth = cameraViewport.active ? 2.5 : 2;
      ctx.setLineDash(cameraViewport.active ? [] : [8, 6]);
      ctx.strokeRect(cx, cy, cw, ch);
      ctx.setLineDash([]);

      // Rule of thirds grid lines
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + cw / 3, cy);
      ctx.lineTo(cx + cw / 3, cy + ch);
      ctx.moveTo(cx + (cw * 2) / 3, cy);
      ctx.lineTo(cx + (cw * 2) / 3, cy + ch);
      ctx.moveTo(cx, cy + ch / 3);
      ctx.lineTo(cx + cw, cy + ch / 3);
      ctx.moveTo(cx, cy + (ch * 2) / 3);
      ctx.lineTo(cx + cw, cy + (ch * 2) / 3);
      ctx.stroke();

      // Camera corner brackets
      const bLen = Math.min(24, cw * 0.1);
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy + bLen);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + bLen, cy);
      ctx.moveTo(cx + cw - bLen, cy);
      ctx.lineTo(cx + cw, cy);
      ctx.lineTo(cx + cw, cy + bLen);
      ctx.moveTo(cx, cy + ch - bLen);
      ctx.lineTo(cx, cy + ch);
      ctx.lineTo(cx + bLen, cy + ch);
      ctx.moveTo(cx + cw - bLen, cy + ch);
      ctx.lineTo(cx + cw, cy + ch);
      ctx.lineTo(cx + cw, cy + ch - bLen);
      ctx.stroke();

      // Center crosshair
      const midX = cx + cw / 2;
      const midY = cy + ch / 2;
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(midX - 10, midY);
      ctx.lineTo(midX + 10, midY);
      ctx.moveTo(midX, midY - 10);
      ctx.lineTo(midX, midY + 10);
      ctx.stroke();

      // Camera info badge
      ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
      ctx.fillRect(cx + 6, cy + 6, 125, 24);
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 6, cy + 6, 125, 24);

      // Status indicator dot
      ctx.beginPath();
      ctx.arc(cx + 17, cy + 18, 4, 0, Math.PI * 2);
      ctx.fillStyle = cameraViewport.active ? '#ef4444' : '#2dd4bf';
      ctx.fill();

      ctx.fillStyle = '#f4f4f5';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(cameraViewport.active ? 'CAM 1 • REC' : 'CAM • VIEW', cx + 27, cy + 22);

      // Drag resize handle if isEditing
      if (cameraViewport.isEditing) {
        ctx.fillStyle = '#2dd4bf';
        ctx.fillRect(cx + cw - 8, cy + ch - 8, 16, 16);
        ctx.strokeStyle = '#0f766e';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx + cw - 8, cy + ch - 8, 16, 16);
      }

      ctx.restore();
    }

    // Feature: Motion Path Bézier Curve rendering & interactive handles directly on Canvas
    if (activeMotionTween && activeMotionTween.motionPath && activeMotionTween.motionPath.enabled && !isPlaying) {
      const mp = activeMotionTween.motionPath;
      const p0 = { x: activeMotionTween.elPrev.x, y: activeMotionTween.elPrev.y };
      const pEnd = { x: activeMotionTween.elNext.x, y: activeMotionTween.elNext.y };
      const cp1 = mp.cp1;
      const cp2 = mp.cp2;

      ctx.save();

      // 1. Dashed Handle Connection Lines from Anchors to Control Points
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(cp1.x, cp1.y);
      if (mp.type === 'cubic' && cp2) {
        ctx.moveTo(pEnd.x, pEnd.y);
        ctx.lineTo(cp2.x, cp2.y);
      } else {
        ctx.lineTo(pEnd.x, pEnd.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. The Bézier Trajectory Curve with Neon Glow
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.35)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      if (mp.type === 'cubic' && cp2) {
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, pEnd.x, pEnd.y);
      } else {
        ctx.quadraticCurveTo(cp1.x, cp1.y, pEnd.x, pEnd.y);
      }
      ctx.stroke();

      // Sharp crisp inner dashed line
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Intermediate Frame Ticks (dots indicating frame spacing / easing along curve)
      if (mp.showFrameTicks !== false) {
        const frameDots = sampleMotionPathFrames(
          p0,
          pEnd,
          mp,
          activeMotionTween.kfPrev.frame,
          activeMotionTween.kfNext.frame,
          activeMotionTween.kfPrev.easing
        );

        frameDots.forEach((dot) => {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2);
          if (dot.frame === currentFrame) {
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#0f766e';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Pulsing Playhead indicator ring on path
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 8, 0, Math.PI * 2);
            ctx.strokeStyle = '#2dd4bf';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Frame badge
            ctx.fillStyle = '#14b8a6';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`F${dot.frame}`, dot.x + 10, dot.y - 6);
          } else {
            ctx.fillStyle = 'rgba(45, 212, 191, 0.7)';
            ctx.fill();
          }
        });
      }

      // 4. Start Keyframe Anchor (P0 diamond)
      ctx.fillStyle = '#14b8a6';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y - 7);
      ctx.lineTo(p0.x + 7, p0.y);
      ctx.lineTo(p0.x, p0.y + 7);
      ctx.lineTo(p0.x - 7, p0.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f4f4f5';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`F${activeMotionTween.kfPrev.frame}`, p0.x - 12, p0.y + 18);

      // 5. End Keyframe Anchor (P_end diamond)
      ctx.fillStyle = '#0f766e';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pEnd.x, pEnd.y - 7);
      ctx.lineTo(pEnd.x + 7, pEnd.y);
      ctx.lineTo(pEnd.x, pEnd.y + 7);
      ctx.lineTo(pEnd.x - 7, pEnd.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f4f4f5';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`F${activeMotionTween.kfNext.frame}`, pEnd.x - 12, pEnd.y + 18);

      // 6. Interactive Control Point Handles (CP1 and CP2)
      // CP1 Handle
      ctx.beginPath();
      ctx.arc(cp1.x, cp1.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#2dd4bf';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cp1.x, cp1.y, 14, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#2dd4bf';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('CP1', cp1.x + 12, cp1.y - 6);

      // CP2 Handle (if cubic)
      if (mp.type === 'cubic' && cp2) {
        ctx.beginPath();
        ctx.arc(cp2.x, cp2.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cp2.x, cp2.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('CP2', cp2.x + 12, cp2.y - 6);
      }

      ctx.restore();
    }
  }, [
    currentFrame,
    totalFrames,
    layers,
    symbols,
    width,
    height,
    backgroundColor,
    showGrid,
    onionSkinSettings,
    cameraViewport,
    isPlaying,
    currentElements,
    activeMotionTween,
    selectedElement,
    selectedPointIndex,
    activeTool,
    tempPoints,
    isDragging,
    dragStart,
    strokeColor,
    strokeWidth,
    hoveredButtonId,
  ]);

  // Double click on canvas to enter symbol sub-animation
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getStageCoordinates(e);
    const hit = [...currentElements].reverse().find((el) => hitTestElement(pt, el));
    if (hit && hit.type === 'symbolInstance' && hit.symbolId && onEnterSymbol) {
      onEnterSymbol(hit.symbolId);
      playButtonClick();
    }
  };

  // Mouse Wheel: zoom or pan
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom with wheel
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      setZoom((z) => Math.max(0.1, Math.min(2.5, Math.round((z + delta) * 100) / 100)));
    } else {
      // Pan with wheel / trackpad
      setPanOffset((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Mouse handlers for Hand, Zoom, Drawing, Selecting, and Transforming
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // 1. Hand Tool / Spacebar Pan
    if (activeTool === 'hand' || isSpacePressed || e.button === 1) {
      setIsDragging(true);
      setDragType('pan');
      setPanStart({ clientX: e.clientX, clientY: e.clientY });
      return;
    }

    // 2. Zoom Tool (Z)
    if (activeTool === 'zoom') {
      const isZoomOut = isAltPressed || e.altKey;
      setZoom((prev) => {
        const factor = isZoomOut ? 0.8 : 1.25;
        return Math.max(0.1, Math.min(2.5, Math.round(prev * factor * 100) / 100));
      });
      playButtonClick();
      return;
    }

    const rawPt = getStageCoordinates(e);
    const pt = isSnapActive ? { x: snapVal(rawPt.x), y: snapVal(rawPt.y) } : rawPt;

    // Motion Path Bézier Control Points dragging on Canvas
    if (activeMotionTween && activeMotionTween.motionPath && activeMotionTween.motionPath.enabled) {
      const cp1 = activeMotionTween.motionPath.cp1;
      if (Math.hypot(pt.x - cp1.x, pt.y - cp1.y) <= 18) {
        setIsDragging(true);
        setDragType('motionPath_cp1');
        setDragStart(pt);
        return;
      }
      if (activeMotionTween.motionPath.type === 'cubic' && activeMotionTween.motionPath.cp2) {
        const cp2 = activeMotionTween.motionPath.cp2;
        if (Math.hypot(pt.x - cp2.x, pt.y - cp2.y) <= 18) {
          setIsDragging(true);
          setDragType('motionPath_cp2');
          setDragStart(pt);
          return;
        }
      }
    }

    // Camera Viewport interactive edit on canvas
    if (cameraViewport.isEditing) {
      const brX = cameraViewport.x + cameraViewport.width;
      const brY = cameraViewport.y + cameraViewport.height;
      if (Math.hypot(pt.x - brX, pt.y - brY) < 25) {
        setIsDragging(true);
        setDragType('cameraResize');
        setDragStart(pt);
        return;
      }
      if (
        pt.x >= cameraViewport.x &&
        pt.x <= cameraViewport.x + cameraViewport.width &&
        pt.y >= cameraViewport.y &&
        pt.y <= cameraViewport.y + cameraViewport.height
      ) {
        setIsDragging(true);
        setDragType('cameraMove');
        setDragStart({ x: pt.x - cameraViewport.x, y: pt.y - cameraViewport.y });
        return;
      }
    }

    // 3. Subselection vector points tool ('subselect' - A)
    if (activeTool === 'subselect') {
      if (selectedElement) {
        const ptIdx = hitTestVectorPoints(pt, selectedElement);
        if (ptIdx !== null) {
          onSelectPointIndex(ptIdx);
          setIsDragging(true);
          setDragType('vectorPoint');
          setDragStart(pt);
          return;
        }
      }

      const hit = [...currentElements].reverse().find((el) => hitTestElement(pt, el));
      if (hit) {
        onSelectElement(hit.id);
        const hitLayer = layers.find((l) =>
          getLayerElementsAtFrame(l, currentFrame).some((el) => el.id === hit.id)
        );
        if (hitLayer && onSelectLayer) {
          onSelectLayer(hitLayer.id);
        }
        if (autoIsolateOnSelect && !isIsolated) {
          if (onToggleIsolatedMode) onToggleIsolatedMode();
          else setLocalIsolateMode(true);
        }
        const ptIdx = hitTestVectorPoints(pt, hit);
        onSelectPointIndex(ptIdx);
        setIsDragging(true);
        setDragType(ptIdx !== null ? 'vectorPoint' : 'move');
        setDragStart(pt);
      } else {
        onSelectElement(null);
        onSelectPointIndex(null);
        if (autoIsolateOnSelect && isIsolated) {
          if (onToggleIsolatedMode) onToggleIsolatedMode();
          else setLocalIsolateMode(false);
        }
      }
      return;
    }

    // 4. Selection or Free Transform ('select' - V, 'freetransform' - Q)
    if (activeTool === 'select' || activeTool === 'freetransform') {
      if (selectedElement) {
        const handle = hitTestHandles(pt, selectedElement);
        if (handle) {
          setIsDragging(true);
          setDragType('handle');
          setActiveHandle(handle);
          setDragStart(pt);
          return;
        }
      }

      const hit = [...currentElements].reverse().find((el) => hitTestElement(pt, el));
      if (hit) {
        onSelectElement(hit.id);
        const hitLayer = layers.find((l) =>
          getLayerElementsAtFrame(l, currentFrame).some((el) => el.id === hit.id)
        );
        if (hitLayer && onSelectLayer) {
          onSelectLayer(hitLayer.id);
        }
        if (autoIsolateOnSelect && !isIsolated) {
          if (onToggleIsolatedMode) onToggleIsolatedMode();
          else setLocalIsolateMode(true);
        }
        setIsDragging(true);
        setDragType('move');
        setDragStart(pt);

        if (hit.type === 'button') {
          playButtonClick();
          if (hit.actions && onExecuteAction) {
            onExecuteAction(hit.actions);
          }
        }
      } else {
        onSelectElement(null);
        if (autoIsolateOnSelect && isIsolated) {
          if (onToggleIsolatedMode) onToggleIsolatedMode();
          else setLocalIsolateMode(false);
        }
      }
      return;
    }

    // 5. Paint bucket tool
    if (activeTool === 'paintbucket') {
      const hit = [...currentElements].reverse().find((el) => hitTestElement(pt, el));
      if (hit) {
        onUpdateElement({ ...hit, fill: primaryColor });
        playButtonClick();
      }
      return;
    }

    // 6. Eraser tool
    if (activeTool === 'eraser') {
      const hit = [...currentElements].reverse().find((el) => hitTestElement(pt, el));
      if (hit) {
        onUpdateElement({ ...hit, opacity: 0 });
      }
      return;
    }

    // 7. Creation tools (rect, circle, star, brush, pencil, text, three)
    setIsDragging(true);
    setDragType('create');
    setDragStart(pt);
    setTempPoints([pt]);

    if (activeTool === 'text') {
      const newEl: FlashElement = {
        id: `text_${Date.now()}`,
        name: 'Texto Vectorial',
        type: 'text',
        x: pt.x,
        y: pt.y,
        width: 250,
        height: 60,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: primaryColor || '#14b8a6',
        stroke: 'transparent',
        strokeWidth: 0,
        text: 'slow studio',
        fontSize: 36,
        fontFamily: 'sans-serif',
      };
      onAddElement(newEl);
      onSelectElement(newEl.id);
      setIsDragging(false);
    } else if (activeTool === 'three') {
      const new3D: FlashElement = {
        id: `three_${Date.now()}`,
        name: 'Objeto 3D',
        type: 'threeObject',
        x: pt.x,
        y: pt.y,
        width: 140,
        height: 140,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: primaryColor,
        stroke: '#000000',
        strokeWidth: 1,
        threeData: {
          modelType: 'spaceship',
          color: primaryColor || '#14b8a6',
          metalness: 0.85,
          roughness: 0.25,
          rotX: 15,
          rotY: 45,
          rotZ: 0,
        },
      };
      onAddElement(new3D);
      onSelectElement(new3D.id);
      setIsDragging(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Panning with Hand tool or Spacebar
    if (dragType === 'pan' && panStart) {
      const dx = e.clientX - panStart.clientX;
      const dy = e.clientY - panStart.clientY;
      setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ clientX: e.clientX, clientY: e.clientY });
      return;
    }

    const rawPt = getStageCoordinates(e);
    const pt = isSnapActive && dragType !== 'pan'
      ? { x: snapVal(rawPt.x), y: snapVal(rawPt.y) }
      : rawPt;

    // Button hover detection
    if (!isDragging) {
      const hit = [...currentElements].reverse().find((el) => hitTestElement(pt, el));
      if (hit && hit.type === 'button') {
        if (hoveredButtonId !== hit.id) {
          setHoveredButtonId(hit.id);
          playButtonHover();
        }
      } else if (hoveredButtonId) {
        setHoveredButtonId(null);
      }
    }

    if (!isDragging || !dragStart) return;

    // Motion Path Control Point 1 dragging on Canvas
    if (dragType === 'motionPath_cp1' && activeMotionTween && onUpdateMotionPath) {
      onUpdateMotionPath(
        {
          ...activeMotionTween.motionPath!,
          cp1: { x: Math.round(pt.x), y: Math.round(pt.y) },
        },
        activeMotionTween.kfPrev.frame
      );
      return;
    }

    // Motion Path Control Point 2 dragging on Canvas
    if (dragType === 'motionPath_cp2' && activeMotionTween && onUpdateMotionPath) {
      onUpdateMotionPath(
        {
          ...activeMotionTween.motionPath!,
          cp2: { x: Math.round(pt.x), y: Math.round(pt.y) },
        },
        activeMotionTween.kfPrev.frame
      );
      return;
    }

    // Camera Viewport dragging
    if (dragType === 'cameraMove') {
      const newX = Math.max(0, Math.min(width - cameraViewport.width, pt.x - dragStart.x));
      const newY = Math.max(0, Math.min(height - cameraViewport.height, pt.y - dragStart.y));
      setCameraViewport((prev) => ({ ...prev, x: Math.round(newX), y: Math.round(newY) }));
      return;
    }

    // Camera Viewport resizing
    if (dragType === 'cameraResize') {
      const newW = Math.max(80, Math.min(width - cameraViewport.x, pt.x - cameraViewport.x));
      const newH = Math.max(50, Math.min(height - cameraViewport.y, pt.y - cameraViewport.y));
      setCameraViewport((prev) => ({ ...prev, width: Math.round(newW), height: Math.round(newH) }));
      return;
    }

    if (dragType === 'vectorPoint' && selectedElement && selectedPointIndex !== null) {
      const points = getElementPoints(selectedElement);
      if (points && points[selectedPointIndex]) {
        const newPoints = [...points];
        newPoints[selectedPointIndex] = { x: pt.x, y: pt.y };
        onUpdateElement({
          ...selectedElement,
          shapeType: 'path',
          points: newPoints,
        });
      }
      return;
    }

    if (dragType === 'move' && selectedElement) {
      const dx = pt.x - dragStart.x;
      const dy = pt.y - dragStart.y;

      if (selectedElement.type === 'group' && selectedElement.children) {
        const updatedChildren = selectedElement.children.map((c) => ({
          ...c,
          x: c.x + dx,
          y: c.y + dy,
        }));
        onUpdateElement({
          ...selectedElement,
          x: selectedElement.x + dx,
          y: selectedElement.y + dy,
          children: updatedChildren,
        });
      } else {
        onUpdateElement({
          ...selectedElement,
          x: selectedElement.x + dx,
          y: selectedElement.y + dy,
        });
      }
      setDragStart(pt);
    } else if (dragType === 'handle' && selectedElement && activeHandle) {
      const dx = pt.x - dragStart.x;
      const dy = pt.y - dragStart.y;
      let newW = selectedElement.width;
      let newH = selectedElement.height;

      if (activeHandle === 'br') {
        newW = Math.max(10, selectedElement.width + dx);
        newH = Math.max(10, selectedElement.height + dy);
      } else if (activeHandle === 'rot') {
        const cx = selectedElement.x + selectedElement.width / 2;
        const cy = selectedElement.y + selectedElement.height / 2;
        const angle = Math.atan2(pt.y - cy, pt.x - cx) * (180 / Math.PI);
        onUpdateElement({ ...selectedElement, rotation: Math.round(angle) });
        return;
      }

      onUpdateElement({
        ...selectedElement,
        width: newW,
        height: newH,
      });
      setDragStart(pt);
    } else if (dragType === 'create') {
      if (activeTool === 'brush' || activeTool === 'pencil') {
        setTempPoints((prev) => [...prev, pt]);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragType === 'pan') {
      setIsDragging(false);
      setPanStart(null);
      return;
    }

    if (!isDragging || !dragStart) {
      setIsDragging(false);
      return;
    }

    const rawPt = getStageCoordinates(e);
    const pt = isSnapActive ? { x: snapVal(rawPt.x), y: snapVal(rawPt.y) } : rawPt;

    if (dragType === 'move' && selectedElement && isSnapActive) {
      onUpdateElement({
        ...selectedElement,
        x: snapVal(selectedElement.x),
        y: snapVal(selectedElement.y),
      });
    }

    if (dragType === 'create') {
      const minX = Math.min(dragStart.x, pt.x);
      const minY = Math.min(dragStart.y, pt.y);
      const w = Math.max(isSnapActive ? currentGridSize : 15, Math.abs(pt.x - dragStart.x));
      const h = Math.max(isSnapActive ? currentGridSize : 15, Math.abs(pt.y - dragStart.y));

      if (activeTool === 'rect') {
        const newEl: FlashElement = {
          id: `rect_${Date.now()}`,
          name: 'Rectángulo Vector',
          type: 'shape',
          shapeType: 'rect',
          x: minX,
          y: minY,
          width: w,
          height: h,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          fill: primaryColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        };
        onAddElement(newEl);
        onSelectElement(newEl.id);
      } else if (activeTool === 'circle') {
        const newEl: FlashElement = {
          id: `circle_${Date.now()}`,
          name: 'Óvalo Vector',
          type: 'shape',
          shapeType: 'circle',
          x: minX + w / 2,
          y: minY + h / 2,
          width: w,
          height: h,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          fill: primaryColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        };
        onAddElement(newEl);
        onSelectElement(newEl.id);
      } else if (activeTool === 'star') {
        const newEl: FlashElement = {
          id: `star_${Date.now()}`,
          name: 'Estrella Vector',
          type: 'shape',
          shapeType: 'star',
          x: minX + w / 2,
          y: minY + h / 2,
          width: w,
          height: h,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          fill: primaryColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        };
        onAddElement(newEl);
        onSelectElement(newEl.id);
      } else if (activeTool === 'brush' || activeTool === 'pencil') {
        if (tempPoints.length > 1) {
          const newEl: FlashElement = {
            id: `path_${Date.now()}`,
            name: activeTool === 'brush' ? 'Trazo Pincel' : 'Trazo Lápiz',
            type: 'shape',
            shapeType: 'path',
            x: 0,
            y: 0,
            width: width,
            height: height,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            fill: 'transparent',
            stroke: strokeColor || primaryColor,
            strokeWidth: activeTool === 'brush' ? strokeWidth * 2 : strokeWidth,
            points: tempPoints,
          };
          onAddElement(newEl);
          onSelectElement(newEl.id);
        }
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setActiveHandle(null);
    setTempPoints([]);
  };

  // Determine stage cursor
  const getStageCursor = () => {
    if (dragType === 'motionPath_cp1' || dragType === 'motionPath_cp2') {
      return 'cursor-crosshair';
    }
    if (activeTool === 'hand' || isSpacePressed) {
      return isDragging ? 'cursor-grabbing' : 'cursor-grab';
    }
    if (activeTool === 'zoom') {
      return isAltPressed ? 'cursor-zoom-out' : 'cursor-zoom-in';
    }
    if (activeTool === 'select' || activeTool === 'freetransform') {
      return 'cursor-default';
    }
    if (activeTool === 'subselect') {
      return 'cursor-pointer';
    }
    return 'cursor-crosshair';
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="flex-1 flex flex-col bg-zinc-950 border-l border-zinc-800 h-full overflow-hidden select-none relative"
    >
      {/* Stage Header bar */}
      <div className="h-10 px-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-300 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-zinc-400">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-zinc-200">Mesa de Trabajo</span>
            <span className="text-zinc-600">|</span>
            <span className="text-teal-400 font-semibold">
              {width} × {height} px
            </span>
          </div>

          {activeKeyframePrompt && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] max-w-[260px] truncate">
              <Sparkles className="w-3 h-3 text-teal-400 shrink-0" />
              <span className="truncate">Frame {currentFrame}: {activeKeyframePrompt}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Feature 1: Advanced Onion Skinning (Ghosting Modes) Button & Dropdown */}
          <div className="flex items-center bg-zinc-800 rounded p-0.5">
            <button
              onClick={() => {
                const nextState = !onionSkinSettings.enabled;
                setOnionSkinSettings((s) => ({ ...s, enabled: nextState }));
                onToggleOnionSkin();
              }}
              title="Activar / Desactivar Papel Cebolla (Ghosting)"
              className={`px-2 py-1 rounded text-xs flex items-center gap-1.5 transition ${
                onionSkinSettings.enabled
                  ? 'bg-teal-500/20 text-teal-300 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-teal-400" />
              <span>Papel Cebolla</span>
              <span className="text-[10px] text-teal-400/80 font-mono uppercase">
                ({onionSkinSettings.mode})
              </span>
            </button>
            <button
              onClick={() => setIsOnionSkinMenuOpen((o) => !o)}
              title="Ajustes avanzados de Ghosting (Modos, opacidad, colores)"
              className={`p-1 rounded hover:text-teal-300 text-zinc-400 border-l border-zinc-700/60 ml-0.5 transition ${
                isOnionSkinMenuOpen ? 'bg-zinc-700 text-teal-300' : ''
              }`}
            >
              <Sliders className="w-3 h-3" />
            </button>
          </div>

          {/* Feature 2: Camera Viewport (Vista de Cámara) Button & Popover */}
          <div className="flex items-center bg-zinc-800 rounded p-0.5">
            <button
              onClick={() => {
                if (cameraViewport.active) {
                  resetCameraFraming();
                } else {
                  applyCameraFraming();
                }
              }}
              title="Activar / Desactivar Vista de Cámara (Auto-Zoom y Encuadre)"
              className={`px-2 py-1 rounded text-xs flex items-center gap-1.5 transition ${
                cameraViewport.active
                  ? 'bg-teal-500 text-zinc-950 font-bold shadow-sm shadow-teal-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Cámara</span>
              {cameraViewport.active && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
              )}
            </button>
            <button
              onClick={() => setIsCameraControlOpen((c) => !c)}
              title="Configuración de Vista de Cámara y Planos"
              className={`p-1 rounded hover:text-teal-300 text-zinc-400 border-l border-zinc-700/60 ml-0.5 transition ${
                isCameraControlOpen ? 'bg-zinc-700 text-teal-300' : ''
              }`}
            >
              <Sliders className="w-3 h-3" />
            </button>
          </div>

          {/* Feature 3: MiniStage Picture-in-Picture Toggle */}
          <button
            onClick={() => setShowMiniStage((s) => !s)}
            title="Mostrar / Ocultar panel de vista previa MiniStage"
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition ${
              showMiniStage
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-teal-400" />
            <span>MiniStage</span>
          </button>

          {/* Feature 4: Modo Aislamiento (Solo ver capa activa) */}
          <div className="flex items-center bg-zinc-800 rounded p-0.5">
            <button
              onClick={toggleIsolateMode}
              title={`Modo Aislamiento (Solo ver capa activa) [I]: ${
                isIsolated ? 'ACTIVADO' : 'DESACTIVADO'
              }`}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1.5 transition cursor-pointer ${
                isIsolated
                  ? 'bg-teal-500 text-zinc-950 font-bold shadow-sm shadow-teal-500/25 ring-1 ring-teal-300'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Focus className="w-3.5 h-3.5" />
              <span>Aislar Capa</span>
              {isIsolated && (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-pulse inline-block" />
              )}
            </button>
            <button
              onClick={() => setAutoIsolateOnSelect((prev) => !prev)}
              title={`Auto-aislar al seleccionar objeto en el escenario: ${
                autoIsolateOnSelect ? 'ACTIVADO' : 'DESACTIVADO'
              }`}
              className={`px-1.5 py-1 rounded text-[10px] font-mono border-l border-zinc-700/60 ml-0.5 transition cursor-pointer ${
                autoIsolateOnSelect
                  ? 'bg-zinc-700 text-teal-300 font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              AUTO
            </button>
          </div>

          {/* Feature 5: Motion Path (Curvas Bézier Interactivas en Canvas) */}
          {onToggleMotionPathPanel && (
            <button
              onClick={onToggleMotionPathPanel}
              title="Panel de Trayectorias de Movimiento (Motion Path Bézier) [M]"
              className={`px-2 py-1 rounded text-xs flex items-center gap-1.5 transition cursor-pointer ${
                isMotionPathPanelOpen || activeMotionTween?.motionPath?.enabled
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-sm shadow-teal-500/20'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
              }`}
            >
              <Spline className="w-3.5 h-3.5 text-teal-400" />
              <span>Motion Path</span>
              {activeMotionTween?.motionPath?.enabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              )}
            </button>
          )}

          {/* Snap-to-Grid Magnet Button */}
          {onToggleSnapToGrid && (
            <button
              onClick={onToggleSnapToGrid}
              title={`Ajustar a Cuadrícula Magnética (Snap-to-Grid) [G]: ${isSnapActive ? 'ACTIVADO' : 'DESACTIVADO'}`}
              className={`px-2 py-1 rounded flex items-center gap-1 transition ${
                isSnapActive
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-500/15 font-semibold'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono">Snap {currentGridSize}px</span>
            </button>
          )}

          {/* Grid toggle */}
          <button
            onClick={toggleGrid}
            title="Mostrar / Ocultar Cuadrícula [Ctrl+']"
            className={`p-1.5 rounded transition ${
              isGridVisible ? 'bg-zinc-700 text-teal-400' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Zoom & Pan Controls */}
          <div className="flex items-center gap-1 bg-zinc-800 rounded px-1.5 py-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.1, Math.round((z - 0.05) * 100) / 100))}
              className="p-1 hover:text-white"
              title="Alejar zoom"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="w-11 text-center font-mono text-[11px] text-teal-300 font-bold">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.05) * 100) / 100))}
              className="p-1 hover:text-white"
              title="Acercar zoom"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={fitToScreen}
              title="Ajustar Escenario a Pantalla (Fit)"
              className="p-1 hover:text-teal-400 ml-1 text-zinc-400"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                setPanOffset({ x: 0, y: 0 });
                setZoom(1);
              }}
              title="Zoom 100% y centrar"
              className="p-1 hover:text-teal-400 text-zinc-400"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Play/Pause Quick Button */}
          <button
            onClick={onTogglePlay}
            className={`p-1.5 rounded transition ${
              isPlaying
                ? 'bg-teal-500 text-zinc-950 shadow-sm shadow-teal-500/20'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
            }`}
            title="Reproducir / Pausar"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Viewport Workspace: Strictly Proportional Artboard Container */}
      <div className="flex-1 overflow-hidden bg-zinc-900/70 relative flex items-center justify-center">
        {/* Floating Isolation Mode Indicator & Layer Selector */}
        {isIsolated && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 bg-zinc-950/95 backdrop-blur-md border border-teal-500/60 rounded-full shadow-2xl shadow-teal-950/80 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-1.5 text-teal-400">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping inline-block" />
              <Focus className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <span className="text-zinc-400 text-[11px]">Modo Aislamiento:</span>
              <select
                value={activeIsolatedLayer?.id || ''}
                onChange={(e) => onSelectLayer && onSelectLayer(e.target.value)}
                aria-label="Capa aislada activa"
                className="bg-zinc-900 border border-teal-500/50 text-teal-300 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
              >
                {layers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} {l.layerType === 'background' ? '(Fondo)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-zinc-500 hidden sm:inline">• Ocultando otras capas</span>
            <button
              onClick={toggleIsolateMode}
              className="ml-1 px-2.5 py-0.5 bg-teal-500/20 hover:bg-teal-500/35 text-teal-200 hover:text-white rounded-full text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer border border-teal-500/40"
              title="Salir del Modo Aislamiento (Esc o I)"
            >
              <span>Salir</span>
              <kbd className="text-[9px] bg-zinc-800 text-zinc-300 px-1 py-0.2 rounded font-mono">Esc</kbd>
            </button>
          </div>
        )}

        <div
          className={`relative shadow-2xl transition-all duration-75 select-none ${getStageCursor()} ${
            isIsolated ? 'ring-2 ring-teal-500/70 shadow-[0_0_35px_rgba(20,184,166,0.22)]' : ''
          }`}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            aspectRatio: `${width} / ${height}`, // Strictly preserves aspect ratio!
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* HTML5 Canvas with strict pixel resolution */}
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            className="block w-full h-full rounded shadow-2xl"
            style={{
              backgroundColor: backgroundColor || '#ffffff',
              aspectRatio: `${width} / ${height}`,
            }}
          />

          {/* 3D WebGL Overlay when 3D elements exist */}
          {hasThreeElements && (
            <ThreeStageView elements={currentElements} width={width} height={height} />
          )}

          {/* Artboard Border & Brand Label */}
          <div className="absolute inset-0 pointer-events-none border border-zinc-700/60 rounded" />
          <div className="absolute bottom-3 right-4 pointer-events-none text-[11px] font-mono tracking-widest text-zinc-400/50 uppercase">
            slow studio • {width}×{height} • {currentFrame} / {totalFrames}
          </div>
        </div>
      </div>

      {/* Feature 1 Popover: Advanced Onion Skinning (Ghosting Modes) */}
      <OnionSkinControl
        isOpen={isOnionSkinMenuOpen}
        onClose={() => setIsOnionSkinMenuOpen(false)}
        settings={onionSkinSettings}
        onUpdateSettings={setOnionSkinSettings}
      />

      {/* Feature 2 Popover: Camera Viewport Framing (Vista de Cámara) */}
      <CameraViewControl
        isOpen={isCameraControlOpen}
        onClose={() => setIsCameraControlOpen(false)}
        viewport={cameraViewport}
        stageWidth={width}
        stageHeight={height}
        onUpdateViewport={setCameraViewport}
        onApplyCameraFraming={applyCameraFraming}
        onResetCameraFraming={resetCameraFraming}
      />

      {/* Feature 3: MiniStage Picture-in-Picture Preview Panel */}
      {showMiniStage && (
        <MiniStage
          layers={layers}
          symbols={symbols}
          currentFrame={currentFrame}
          totalFrames={totalFrames}
          fps={24}
          width={width}
          height={height}
          backgroundColor={backgroundColor}
          cameraViewport={cameraViewport}
          onSelectFrame={() => {}}
          mainIsPlaying={isPlaying}
        />
      )}
    </div>
  );
};

// Vector helpers
function getElementPoints(el: FlashElement): Array<{ x: number; y: number }> | null {
  if (el.points && el.points.length > 0) return el.points;
  if (el.shapeType === 'rect') {
    return [
      { x: el.x, y: el.y },
      { x: el.x + el.width, y: el.y },
      { x: el.x + el.width, y: el.y + el.height },
      { x: el.x, y: el.y + el.height },
    ];
  }
  if (el.shapeType === 'circle') {
    return [
      { x: el.x, y: el.y - el.height / 2 },
      { x: el.x + el.width / 2, y: el.y },
      { x: el.x, y: el.y + el.height / 2 },
      { x: el.x - el.width / 2, y: el.y },
    ];
  }
  return null;
}

const mediaImageCache = new Map<string, HTMLImageElement>();

function drawElement(
  ctx: CanvasRenderingContext2D,
  el: FlashElement,
  symbols: FlashSymbol[],
  currentFrame: number,
  options: {
    overrideOpacity?: number;
    overrideStroke?: string;
    overrideFill?: string;
    isHovered?: boolean;
  } = {}
) {
  const opacity = options.overrideOpacity !== undefined ? options.overrideOpacity : el.opacity ?? 1;
  if (opacity <= 0) return;

  ctx.save();
  ctx.globalAlpha = opacity;

  // Real-time Filters (Desenfoque / Blur, Brillo / Brightness, Contraste / Contrast, Sombra Paralela / Drop Shadow)
  if (el.filters) {
    const filterParts: string[] = [];
    if (el.filters.blur !== undefined && el.filters.blur > 0) {
      filterParts.push(`blur(${el.filters.blur}px)`);
    }
    if (el.filters.brightness !== undefined && el.filters.brightness !== 100) {
      filterParts.push(`brightness(${el.filters.brightness}%)`);
    }
    if (el.filters.contrast !== undefined && el.filters.contrast !== 100) {
      filterParts.push(`contrast(${el.filters.contrast}%)`);
    }
    if (filterParts.length > 0) {
      ctx.filter = filterParts.join(' ');
    }

    if (el.filters.dropShadow?.enabled) {
      ctx.shadowColor = el.filters.dropShadow.color || 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = el.filters.dropShadow.blur ?? 8;
      ctx.shadowOffsetX = el.filters.dropShadow.offsetX ?? 4;
      ctx.shadowOffsetY = el.filters.dropShadow.offsetY ?? 4;
    }
  }

  const cx = el.shapeType === 'circle' || el.shapeType === 'star' ? el.x : el.x + el.width / 2;
  const cy = el.shapeType === 'circle' || el.shapeType === 'star' ? el.y : el.y + el.height / 2;

  ctx.translate(cx, cy);
  if (el.rotation) {
    ctx.rotate((el.rotation * Math.PI) / 180);
  }
  ctx.scale(el.scaleX ?? 1, el.scaleY ?? 1);
  ctx.translate(-cx, -cy);

  if (el.type === 'group' && el.children) {
    el.children.forEach((child) => {
      drawElement(ctx, child, symbols, currentFrame, options);
    });
    ctx.restore();
    return;
  }

  if (el.type === 'symbolInstance' && el.symbolId) {
    const symbol = symbols.find((s) => s.id === el.symbolId);
    if (symbol) {
      if (symbol.type === 'movieclip') {
        const mcFrame = symbol.totalFrames
          ? ((currentFrame - 1) % symbol.totalFrames) + 1
          : currentFrame;
        symbol.layers.forEach((layer) => {
          if (!layer.visible) return;
          const subEls = getLayerElementsAtFrame(layer, mcFrame);
          subEls.forEach((subEl) => {
            drawElement(ctx, subEl, symbols, mcFrame, options);
          });
        });
      } else {
        symbol.layers.forEach((layer) => {
          if (!layer.visible) return;
          const subEls = getLayerElementsAtFrame(layer, 1);
          subEls.forEach((subEl) => {
            drawElement(ctx, subEl, symbols, 1, options);
          });
        });
      }
    }
    ctx.restore();
    return;
  }

  ctx.fillStyle = resolveCanvasFill(ctx, options.overrideFill || el.fill, el);
  ctx.strokeStyle = resolveCanvasFill(ctx, options.overrideStroke || el.stroke, el);
  ctx.lineWidth = el.strokeWidth || 1;

  if (el.type === 'shape') {
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
      if (el.strokeWidth > 0 && el.stroke !== 'transparent') {
        ctx.stroke();
      }
    } else if (el.shapeType === 'star') {
      drawStar(ctx, el.x, el.y, 5, el.width / 2, el.width / 4);
      ctx.fill();
      if (el.strokeWidth > 0 && el.stroke !== 'transparent') {
        ctx.stroke();
      }
    } else if (el.shapeType === 'path' && el.points && el.points.length > 0) {
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      el.points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      if (el.fill && el.fill !== 'transparent') ctx.fill();
      if (el.strokeWidth > 0 && el.stroke !== 'transparent') ctx.stroke();
    }
  } else if (el.type === 'text') {
    ctx.font = `${el.fontSize || 32}px ${el.fontFamily || 'sans-serif'}`;
    ctx.fillText(el.text || '', el.x, el.y + (el.fontSize || 32));
  } else if (el.type === 'button') {
    const isHover = options.isHovered;
    ctx.fillStyle = isHover ? '#0d9488' : el.fill || '#14b8a6';
    ctx.fillRect(el.x, el.y, el.width, el.height);

    ctx.strokeStyle = isHover ? '#2dd4bf' : '#0f766e';
    ctx.lineWidth = 3;
    ctx.strokeRect(el.x, el.y, el.width, el.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(el.name || 'Botón', el.x + el.width / 2, el.y + el.height / 2);
  } else if (el.type === 'image') {
    if (el.mediaUrl) {
      let img = mediaImageCache.get(el.mediaUrl);
      if (!img) {
        img = new Image();
        img.src = el.mediaUrl;
        mediaImageCache.set(el.mediaUrl, img);
      }
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, el.x, el.y, el.width, el.height);
      } else {
        // Fallback placeholder while image is decoding
        ctx.fillStyle = 'rgba(20, 184, 166, 0.15)';
        ctx.fillRect(el.x, el.y, el.width, el.height);
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(el.x, el.y, el.width, el.height);
        ctx.fillStyle = '#2dd4bf';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.name || 'Cargando imagen...', el.x + el.width / 2, el.y + el.height / 2);
      }
    } else {
      ctx.fillStyle = '#14b8a6';
      ctx.fillRect(el.x, el.y, el.width, el.height);
    }
  } else if (el.type === 'video') {
    ctx.fillStyle = '#09090b';
    ctx.fillRect(el.x, el.y, el.width, el.height);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(el.x, el.y, el.width, el.height);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`▶ Clip: ${el.name || 'Video'}`, el.x + el.width / 2, el.y + el.height / 2);
  }

  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

function hitTestElement(pt: { x: number; y: number }, el: FlashElement): boolean {
  if (el.opacity === 0) return false;
  if (el.shapeType === 'circle') {
    const rx = Math.abs(el.width / 2);
    const ry = Math.abs(el.height / 2);
    const dx = pt.x - el.x;
    const dy = pt.y - el.y;
    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
  }
  if (el.shapeType === 'star') {
    const dist = Math.hypot(pt.x - el.x, pt.y - el.y);
    return dist <= el.width / 2;
  }
  return pt.x >= el.x && pt.x <= el.x + el.width && pt.y >= el.y && pt.y <= el.y + el.height;
}

function drawVectorSubselectionPoints(
  ctx: CanvasRenderingContext2D,
  el: FlashElement,
  selectedPtIdx: number | null
) {
  const points = getElementPoints(el);
  if (!points) return;

  ctx.save();
  points.forEach((pt, idx) => {
    const isSelected = idx === selectedPtIdx;
    ctx.fillStyle = isSelected ? '#14b8a6' : '#ffffff';
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 2;
    ctx.fillRect(pt.x - 4, pt.y - 4, 8, 8);
    ctx.strokeRect(pt.x - 4, pt.y - 4, 8, 8);
  });
  ctx.restore();
}

function hitTestVectorPoints(pt: { x: number; y: number }, el: FlashElement): number | null {
  const points = getElementPoints(el);
  if (!points) return null;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (Math.hypot(pt.x - p.x, pt.y - p.y) < 14) {
      return i;
    }
  }
  return null;
}

function drawSelectionGizmo(ctx: CanvasRenderingContext2D, el: FlashElement) {
  ctx.save();
  const x = el.shapeType === 'circle' || el.shapeType === 'star' ? el.x - el.width / 2 : el.x;
  const y = el.shapeType === 'circle' || el.shapeType === 'star' ? el.y - el.height / 2 : el.y;
  const w = el.width;
  const h = el.height;

  ctx.strokeStyle = '#14b8a6';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  ctx.setLineDash([]);

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 2;

  const handleSize = 8;
  const corners = [
    { x: x - 2, y: y - 2 },
    { x: x + w + 2, y: y - 2 },
    { x: x - 2, y: y + h + 2 },
    { x: x + w + 2, y: y + h + 2, id: 'br' },
  ];

  corners.forEach((c) => {
    ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
  });

  const pivotX = x + w / 2;
  const pivotY = y + h / 2;
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#14b8a6';
  ctx.fill();

  const rotX = x + w / 2;
  const rotY = y - 22;
  ctx.beginPath();
  ctx.arc(rotX, rotY, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#2dd4bf';
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(rotX, y - 2);
  ctx.lineTo(rotX, rotY + 5);
  ctx.strokeStyle = '#14b8a6';
  ctx.stroke();

  ctx.restore();
}

function hitTestHandles(pt: { x: number; y: number }, el: FlashElement): string | null {
  const x = el.shapeType === 'circle' || el.shapeType === 'star' ? el.x - el.width / 2 : el.x;
  const y = el.shapeType === 'circle' || el.shapeType === 'star' ? el.y - el.height / 2 : el.y;
  const w = el.width;
  const h = el.height;

  if (Math.hypot(pt.x - (x + w + 2), pt.y - (y + h + 2)) < 15) {
    return 'br';
  }
  if (Math.hypot(pt.x - (x + w / 2), pt.y - (y - 22)) < 15) {
    return 'rot';
  }
  return null;
}
