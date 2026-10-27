import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FlashElement, FlashSymbol, Layer, ToolType } from '../../types/flash';
import { getLayerElementsAtFrame } from '../../utils/interpolation';
import { ThreeStageView } from './ThreeStageView';
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(0.45);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isAltPressed, setIsAltPressed] = useState<boolean>(false);

  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [panStart, setPanStart] = useState<{ clientX: number; clientY: number } | null>(null);
  const [dragType, setDragType] = useState<'move' | 'create' | 'handle' | 'vectorPoint' | 'pan'>('move');
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [tempPoints, setTempPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [hoveredButtonId, setHoveredButtonId] = useState<string | null>(null);

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

  useEffect(() => {
    fitToScreen();
  }, [fitToScreen]);

  // Track Spacebar and Alt key states for Hand and Zoom Out tools
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
  }, []);

  // Compute all visible elements at current frame
  const currentElements: FlashElement[] = [];
  layers.forEach((layer) => {
    if (layer.visible) {
      currentElements.push(...getLayerElementsAtFrame(layer, currentFrame));
    }
  });

  const selectedElement = currentElements.find((e) => e.id === selectedElementId);
  const hasThreeElements = currentElements.some((e) => e.type === 'threeObject');

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

    // Optional Grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.08)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x <= width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Onion Skinning: Render past and future frames in transparent verde agua / cyan tints
    if (onionSkin && !isPlaying) {
      const pastFrames = [currentFrame - 2, currentFrame - 1].filter((f) => f >= 1);
      const futureFrames = [currentFrame + 1, currentFrame + 2];

      pastFrames.forEach((f, idx) => {
        const opacity = (idx + 1) * 0.16;
        layers.forEach((layer) => {
          if (!layer.visible) return;
          const els = getLayerElementsAtFrame(layer, f);
          els.forEach((el) => {
            drawElement(ctx, el, symbols, currentFrame, {
              overrideOpacity: opacity,
              overrideStroke: 'rgba(20, 184, 166, 0.5)',
              overrideFill: 'rgba(20, 184, 166, 0.15)',
            });
          });
        });
      });

      futureFrames.forEach((f, idx) => {
        const opacity = (2 - idx) * 0.16;
        layers.forEach((layer) => {
          if (!layer.visible) return;
          const els = getLayerElementsAtFrame(layer, f);
          els.forEach((el) => {
            drawElement(ctx, el, symbols, currentFrame, {
              overrideOpacity: opacity,
              overrideStroke: 'rgba(56, 189, 248, 0.5)',
              overrideFill: 'rgba(56, 189, 248, 0.15)',
            });
          });
        });
      });
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
  }, [
    currentFrame,
    layers,
    symbols,
    width,
    height,
    backgroundColor,
    showGrid,
    onionSkin,
    isPlaying,
    currentElements,
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

    const pt = getStageCoordinates(e);

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
        const ptIdx = hitTestVectorPoints(pt, hit);
        onSelectPointIndex(ptIdx);
        setIsDragging(true);
        setDragType(ptIdx !== null ? 'vectorPoint' : 'move');
        setDragStart(pt);
      } else {
        onSelectElement(null);
        onSelectPointIndex(null);
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

    const pt = getStageCoordinates(e);

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

    const pt = getStageCoordinates(e);

    if (dragType === 'create') {
      const minX = Math.min(dragStart.x, pt.x);
      const minY = Math.min(dragStart.y, pt.y);
      const w = Math.max(15, Math.abs(pt.x - dragStart.x));
      const h = Math.max(15, Math.abs(pt.y - dragStart.y));

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
          {/* Onion Skin button */}
          <button
            onClick={onToggleOnionSkin}
            title="Piel de cebolla (Onion Skinning)"
            className={`px-2 py-1 rounded flex items-center gap-1 transition ${
              onionSkin
                ? 'bg-teal-500 text-zinc-950 font-medium shadow-sm shadow-teal-500/20'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Papel Cebolla</span>
          </button>

          {/* Grid toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            title="Cuadrícula guía"
            className={`p-1.5 rounded transition ${
              showGrid ? 'bg-zinc-700 text-teal-400' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
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
        <div
          className={`relative shadow-2xl transition-transform duration-75 select-none ${getStageCursor()}`}
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

  ctx.fillStyle = options.overrideFill || el.fill;
  ctx.strokeStyle = options.overrideStroke || el.stroke;
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
