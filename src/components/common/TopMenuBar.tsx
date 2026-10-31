import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  FolderOpen,
  Save,
  Download,
  Settings,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  Clipboard,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Magnet,
  Eye,
  PlusSquare,
  Layers,
  Component,
  FolderPlus,
  Play,
  Square,
  RotateCcw,
  Repeat,
  Sparkles,
  HelpCircle,
  Info,
  Check,
  ChevronDown,
  Image,
  Focus,
  Palette,
  Film,
  Spline,
} from 'lucide-react';
import { ToolType } from '../../types/flash';

interface TopMenuBarProps {
  onNewDocument: () => void;
  onOpenDocument: () => void;
  onSaveDocument: () => void;
  onOpenSettings: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenColorPicker?: (target?: 'fill' | 'stroke' | 'background') => void;
  onOpenMotionPath?: () => void;
  onOpenMediaLibrary?: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onZoom100: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  gridSize: number;
  onChangeGridSize: (size: number) => void;
  onionSkin: boolean;
  onToggleOnionSkin: () => void;
  isIsolatedMode?: boolean;
  onToggleIsolatedMode?: () => void;
  onInsertKeyframe: () => void;
  onInsertBlankKeyframe: () => void;
  onInsertFrame: () => void;
  onDeleteKeyframe: () => void;
  onConvertToSymbol: () => void;
  onOpenSymbolManager?: () => void;
  onAddLayer: () => void;
  onAddBackgroundLayer?: () => void;
  onGroupSelected: () => void;
  onBreakApartSelected: () => void;
  onCreateMotionTween: () => void;
  onCreateShapeTween: () => void;
  onRemoveTween: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRewind: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  activeTool: ToolType;
  onSelectTool: (t: ToolType) => void;
  onShowHelp: () => void;
  onShowAbout: () => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  onNewDocument,
  onOpenDocument,
  onSaveDocument,
  onOpenSettings,
  onExport,
  onUndo,
  onRedo,
  onOpenColorPicker,
  onOpenMotionPath,
  onOpenMediaLibrary,
  onCut,
  onCopy,
  onPaste,
  onSelectAll,
  onDeleteSelected,
  onDuplicateSelected,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoom100,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnapToGrid,
  gridSize,
  onChangeGridSize,
  onionSkin,
  onToggleOnionSkin,
  isIsolatedMode,
  onToggleIsolatedMode,
  onInsertKeyframe,
  onInsertBlankKeyframe,
  onInsertFrame,
  onDeleteKeyframe,
  onConvertToSymbol,
  onOpenSymbolManager,
  onAddLayer,
  onAddBackgroundLayer,
  onGroupSelected,
  onBreakApartSelected,
  onCreateMotionTween,
  onCreateShapeTween,
  onRemoveTween,
  isPlaying,
  onTogglePlay,
  onRewind,
  onStepForward,
  onStepBackward,
  activeTool,
  onSelectTool,
  onShowHelp,
  onShowAbout,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const handleMenuHover = (menuName: string) => {
    if (openMenu !== null) {
      setOpenMenu(menuName);
    }
  };

  const closeAndRun = (action: () => void) => {
    setOpenMenu(null);
    action();
  };

  return (
    <div
      ref={menuBarRef}
      className="h-7 bg-zinc-900 border-b border-zinc-800 flex items-center px-2 select-none text-[12px] text-zinc-300 z-40 relative"
    >
      {/* Brand icon */}
      <div className="flex items-center gap-1.5 mr-2 pr-2 border-r border-zinc-800">
        <div className="w-4 h-4 rounded bg-teal-500 text-zinc-950 font-black flex items-center justify-center text-[10px] font-mono font-bold">
          s
        </div>
        <span className="font-semibold text-white tracking-tight text-[11px]">slow studio</span>
      </div>

      {/* Menu items list */}
      <div className="flex items-center space-x-0.5">
        {/* Archivo */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('archivo')}
            onMouseEnter={() => handleMenuHover('archivo')}
            className={`px-2 py-0.5 rounded transition ${
              openMenu === 'archivo'
                ? 'bg-zinc-800 text-white font-medium'
                : 'hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            Archivo
          </button>
          {openMenu === 'archivo' && (
            <div className="absolute left-0 top-full mt-0.5 w-60 bg-zinc-900 border border-zinc-700/80 rounded-lg shadow-2xl py-1 text-xs text-zinc-200 z-50">
              <button
                onClick={() => closeAndRun(onNewDocument)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Nuevo Documento...</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+N</span>
              </button>
              <button
                onClick={() => closeAndRun(onOpenDocument)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Abrir Proyecto (.slow)...</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+O</span>
              </button>
              <button
                onClick={() => closeAndRun(onSaveDocument)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Proyecto (.slow)</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+S</span>
              </button>
              <div className="h-px bg-zinc-800 my-1" />
              {onOpenMediaLibrary && (
                <button
                  onClick={() => closeAndRun(onOpenMediaLibrary)}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition text-teal-300"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-3.5 h-3.5 text-teal-400" />
                    <span>Recursos Multimedia...</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">Panel</span>
                </button>
              )}
              <button
                onClick={() => closeAndRun(onOpenSettings)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configuración del Documento...</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+P</span>
              </button>
              <div className="h-px bg-zinc-800 my-1" />
              <button
                onClick={() => closeAndRun(onExport)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition font-semibold text-teal-300"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-teal-400" />
                  <span>⭐ Exportar las 3 Plataformas (.exe, .app, .sh)...</span>
                </div>
                <span className="text-[10px] text-teal-400/80 font-mono">ZIP</span>
              </button>
              <button
                onClick={() => closeAndRun(onExport)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Animación (MP4 / GIF / HTML5)...</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+E</span>
              </button>
            </div>
          )}
        </div>

        {/* Edición */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('edicion')}
            onMouseEnter={() => handleMenuHover('edicion')}
            className={`px-2 py-0.5 rounded transition ${
              openMenu === 'edicion'
                ? 'bg-zinc-800 text-white font-medium'
                : 'hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            Edición
          </button>
          {openMenu === 'edicion' && (
            <div className="absolute left-0 top-full mt-0.5 w-56 bg-zinc-900 border border-zinc-700/80 rounded-lg shadow-2xl py-1 text-xs text-zinc-200 z-50">
              <button
                onClick={() => closeAndRun(onUndo)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Deshacer</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Z</span>
              </button>
              <button
                onClick={() => closeAndRun(onRedo)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <Redo2 className="w-3.5 h-3.5" />
                  <span>Rehacer</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Y</span>
              </button>
              <div className="h-px bg-zinc-800 my-1" />
              <button
                onClick={() => closeAndRun(onCut)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Cortar</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+X</span>
              </button>
              <button
                onClick={() => closeAndRun(onCopy)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+C</span>
              </button>
              <button
                onClick={() => closeAndRun(onPaste)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Pegar</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+V</span>
              </button>
              <button
                onClick={() => closeAndRun(onDuplicateSelected)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <PlusSquare className="w-3.5 h-3.5" />
                  <span>Duplicar Selección</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+D</span>
              </button>
              <div className="h-px bg-zinc-800 my-1" />
              <button
                onClick={() => closeAndRun(onSelectAll)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <span>Seleccionar Todo</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+A</span>
              </button>
              <button
                onClick={() => closeAndRun(onDeleteSelected)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-red-500 hover:text-white transition text-red-300"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </div>
                <span className="text-[10px] font-mono">Supr</span>
              </button>
            </div>
          )}
        </div>

        {/* Ver */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('ver')}
            onMouseEnter={() => handleMenuHover('ver')}
            className={`px-2 py-0.5 rounded transition ${
              openMenu === 'ver'
                ? 'bg-zinc-800 text-white font-medium'
                : 'hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            Ver
          </button>
          {openMenu === 'ver' && (
            <div className="absolute left-0 top-full mt-0.5 w-64 bg-zinc-900 border border-zinc-700/80 rounded-lg shadow-2xl py-1 text-xs text-zinc-200 z-50">
              <button
                onClick={() => closeAndRun(onZoomIn)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Acercar</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl++</span>
              </button>
              <button
                onClick={() => closeAndRun(onZoomOut)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <ZoomOut className="w-3.5 h-3.5" />
                  <span>Alejar</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+-</span>
              </button>
              <button
                onClick={() => closeAndRun(onZoomFit)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Ajustar a Pantalla</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+0</span>
              </button>
              <button
                onClick={() => closeAndRun(onZoom100)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <span>Tamaño 100% Real</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+1</span>
              </button>
              <div className="h-px bg-zinc-800 my-1" />

              {/* Grid & Snap-to-Grid */}
              <button
                onClick={() => closeAndRun(onToggleGrid)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <Grid className="w-3.5 h-3.5" />
                  <span>Mostrar Cuadrícula</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {showGrid && <Check className="w-3 h-3 text-teal-400" />}
                  <span className="text-[10px] text-zinc-500 font-mono">Ctrl+'</span>
                </div>
              </button>
              <button
                onClick={() => closeAndRun(onToggleSnapToGrid)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <Magnet className="w-3.5 h-3.5 text-teal-400" />
                  <span className="font-medium text-teal-300">Ajustar a Cuadrícula (Snap)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {snapToGrid && <Check className="w-3 h-3 text-teal-400 font-bold" />}
                  <span className="text-[10px] text-zinc-500 font-mono">G</span>
                </div>
              </button>

              {/* Grid Size selector */}
              <div className="px-3 py-1.5 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Paso de Cuadrícula:</span>
                <div className="flex gap-1">
                  {[10, 20, 40].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => onChangeGridSize(sz)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        gridSize === sz
                          ? 'bg-teal-500 text-zinc-950 font-bold'
                          : 'bg-zinc-800 text-zinc-300 hover:text-white'
                      }`}
                    >
                      {sz}px
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-zinc-800 my-1" />
              <button
                onClick={() => closeAndRun(onToggleOnionSkin)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Papel Cebolla (Onion Skin)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {onionSkin && <Check className="w-3 h-3 text-teal-400" />}
                  <span className="text-[10px] text-zinc-500 font-mono">Alt+O</span>
                </div>
              </button>

              {onToggleIsolatedMode && (
                <button
                  onClick={() => closeAndRun(onToggleIsolatedMode)}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
                >
                  <div className="flex items-center gap-2">
                    <Focus className="w-3.5 h-3.5 text-teal-400" />
                    <span className="font-medium text-teal-300">Modo Aislamiento (Solo capa activa)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isIsolatedMode && <Check className="w-3 h-3 text-teal-400 font-bold" />}
                    <span className="text-[10px] text-zinc-500 font-mono">I</span>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Insertar */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('insertar')}
            onMouseEnter={() => handleMenuHover('insertar')}
            className={`px-2 py-0.5 rounded transition ${
              openMenu === 'insertar'
                ? 'bg-zinc-800 text-white font-medium'
                : 'hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            Insertar
          </button>
          {openMenu === 'insertar' && (
            <div className="absolute left-0 top-full mt-0.5 w-60 bg-zinc-900 border border-zinc-700/80 rounded-lg shadow-2xl py-1 text-xs text-zinc-200 z-50">
              <button
                onClick={() => closeAndRun(onInsertKeyframe)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <span>Fotograma Clave (Keyframe)</span>
                <span className="text-[10px] text-zinc-500 font-mono">F6</span>
              </button>
              <button
                onClick={() => closeAndRun(onInsertBlankKeyframe)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <span>Fotograma Clave Vacío</span>
                <span className="text-[10px] text-zinc-500 font-mono">F7</span>
              </button>
              <button
                onClick={() => closeAndRun(onInsertFrame)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <span>Insertar Fotograma</span>
                <span className="text-[10px] text-zinc-500 font-mono">F5</span>
              </button>
              <button
                onClick={() => closeAndRun(onDeleteKeyframe)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition text-zinc-400"
              >
                <span>Quitar Fotograma</span>
                <span className="text-[10px] font-mono">Shift+F6</span>
              </button>
              <div className="h-px bg-zinc-800 my-1" />
              <button
                onClick={() => closeAndRun(onConvertToSymbol)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition font-medium text-teal-300"
              >
                <div className="flex items-center gap-2">
                  <Component className="w-3.5 h-3.5" />
                  <span>Convertir en Símbolo...</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">F8</span>
              </button>
              {onOpenSymbolManager && (
                <button
                  onClick={() => closeAndRun(onOpenSymbolManager)}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition font-medium text-cyan-300"
                >
                  <div className="flex items-center gap-2">
                    <Film className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Gestión de Símbolos...</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">Ctrl+F8</span>
                </button>
              )}
              <button
                onClick={() => closeAndRun(onAddLayer)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Nueva Capa</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+L</span>
              </button>
              {onAddBackgroundLayer && (
                <button
                  onClick={() => closeAndRun(onAddBackgroundLayer)}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition font-medium text-teal-300"
                >
                  <div className="flex items-center gap-2">
                    <Image className="w-3.5 h-3.5 text-teal-400" />
                    <span>Nueva Capa de Fondo...</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">Shift+Ctrl+B</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modificar */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('modificar')}
            onMouseEnter={() => handleMenuHover('modificar')}
            className={`px-2 py-0.5 rounded transition ${
              openMenu === 'modificar'
                ? 'bg-zinc-800 text-white font-medium'
                : 'hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            Modificar
          </button>
          {openMenu === 'modificar' && (
            <div className="absolute left-0 top-full mt-0.5 w-60 bg-zinc-900 border border-zinc-700/80 rounded-lg shadow-2xl py-1 text-xs text-zinc-200 z-50">
              <button
                onClick={() => closeAndRun(onGroupSelected)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <span>Agrupar Vectores</span>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+G</span>
              </button>
              <button
                onClick={() => closeAndRun(onBreakApartSelected)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <span>Separar / Desagrupar</span>
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+B</span>
              </button>
              <div className="h-px bg-zinc-800 my-1" />
              <div className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Las 3 Interpolaciones:
              </div>
              <button
                onClick={() => closeAndRun(onRemoveTween)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition text-zinc-300"
              >
                <span>1. Cuadro a Cuadro (Sin Tween)</span>
                <span className="text-[10px] text-zinc-500 font-mono">Frame</span>
              </button>
              <button
                onClick={() => closeAndRun(onCreateMotionTween)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition text-cyan-400 font-medium"
              >
                <span>2. Interpolación de Movimiento</span>
                <span className="text-[10px] text-cyan-400/80 font-mono">Motion</span>
              </button>
              <button
                onClick={() => closeAndRun(onCreateShapeTween)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition text-emerald-400 font-medium"
              >
                <span>3. Interpolación de Forma</span>
                <span className="text-[10px] text-emerald-400/80 font-mono">Shape</span>
              </button>
            </div>
          )}
        </div>

        {/* Control */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('control')}
            onMouseEnter={() => handleMenuHover('control')}
            className={`px-2 py-0.5 rounded transition ${
              openMenu === 'control'
                ? 'bg-zinc-800 text-white font-medium'
                : 'hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            Control
          </button>
          {openMenu === 'control' && (
            <div className="absolute left-0 top-full mt-0.5 w-56 bg-zinc-900 border border-zinc-700/80 rounded-lg shadow-2xl py-1 text-xs text-zinc-200 z-50">
              <button
                onClick={() => closeAndRun(onTogglePlay)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition font-medium"
              >
                <div className="flex items-center gap-2">
                  {isPlaying ? <Square className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-teal-400" />}
                  <span>{isPlaying ? 'Detener' : 'Probar / Reproducir'}</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Enter / Espacio</span>
              </button>
              <button
                onClick={() => closeAndRun(onRewind)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rebobinar al Inicio</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Inicio</span>
              </button>
              <div className="h-px bg-zinc-800 my-1" />
              <button
                onClick={() => closeAndRun(onStepForward)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <span>Paso Adelante (+1 frame)</span>
                <span className="text-[10px] text-zinc-500 font-mono">.</span>
              </button>
              <button
                onClick={() => closeAndRun(onStepBackward)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <span>Paso Atrás (-1 frame)</span>
                <span className="text-[10px] text-zinc-500 font-mono">,</span>
              </button>
            </div>
          )}
        </div>

        {/* Herramientas */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('herramientas')}
            onMouseEnter={() => handleMenuHover('herramientas')}
            className={`px-2 py-0.5 rounded transition ${
              openMenu === 'herramientas'
                ? 'bg-zinc-800 text-white font-medium'
                : 'hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            Herramientas
          </button>
          {openMenu === 'herramientas' && (
            <div className="absolute left-0 top-full mt-0.5 w-56 bg-zinc-900 border border-zinc-700/80 rounded-lg shadow-2xl py-1 text-xs text-zinc-200 z-50">
              {[
                { id: 'select', label: 'Selección', key: 'V' },
                { id: 'subselect', label: 'Subselección (Nodos)', key: 'A' },
                { id: 'freetransform', label: 'Transformación Libre', key: 'Q' },
                { id: 'hand', label: 'Mano (Paneo)', key: 'H' },
                { id: 'zoom', label: 'Zoom', key: 'Z' },
                { id: 'rect', label: 'Rectángulo', key: 'R' },
                { id: 'circle', label: 'Óvalo / Círculo', key: 'O' },
                { id: 'star', label: 'Estrella / Polígono', key: 'S' },
                { id: 'brush', label: 'Pincel Fluido', key: 'B' },
                { id: 'pencil', label: 'Lápiz Vectorial', key: 'Y' },
                { id: 'text', label: 'Texto', key: 'T' },
                { id: 'paintbucket', label: 'Cubo de Pintura', key: 'K' },
                { id: 'eraser', label: 'Borrador', key: 'E' },
                { id: 'three', label: 'Objeto 3D Interactivo', key: '3' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => closeAndRun(() => onSelectTool(item.id as ToolType))}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between transition ${
                    activeTool === item.id
                      ? 'bg-teal-500/20 text-teal-300 font-semibold'
                      : 'hover:bg-teal-500 hover:text-zinc-950 text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {activeTool === item.id && <Check className="w-3 h-3 text-teal-400" />}
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{item.key}</span>
                </button>
              ))}

              {onOpenColorPicker && (
                <>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button
                    onClick={() => closeAndRun(() => onOpenColorPicker('fill'))}
                    className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition font-medium text-teal-300"
                  >
                    <div className="flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5 text-teal-400" />
                      <span>Selector de Color & Degradados</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">P</span>
                  </button>
                </>
              )}

              {onOpenMotionPath && (
                <button
                  onClick={() => closeAndRun(onOpenMotionPath)}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition font-medium text-cyan-300"
                >
                  <div className="flex items-center gap-2">
                    <Spline className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Trayectoria (Motion Path)...</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">M</span>
                </button>
              )}

              {onOpenMediaLibrary && (
                <button
                  onClick={() => closeAndRun(onOpenMediaLibrary)}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition font-medium text-teal-300"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-3.5 h-3.5 text-teal-400" />
                    <span>Recursos Multimedia...</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">Panel</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Ayuda */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('ayuda')}
            onMouseEnter={() => handleMenuHover('ayuda')}
            className={`px-2 py-0.5 rounded transition ${
              openMenu === 'ayuda'
                ? 'bg-zinc-800 text-white font-medium'
                : 'hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            Ayuda
          </button>
          {openMenu === 'ayuda' && (
            <div className="absolute left-0 top-full mt-0.5 w-56 bg-zinc-900 border border-zinc-700/80 rounded-lg shadow-2xl py-1 text-xs text-zinc-200 z-50">
              <button
                onClick={() => closeAndRun(onShowHelp)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Atajos de Teclado</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">F1</span>
              </button>
              <button
                onClick={() => closeAndRun(onShowAbout)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-teal-500 hover:text-zinc-950 transition"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" />
                  <span>Acerca de slow studio</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right side quick indicators */}
      <div className="ml-auto flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
        {/* Quick Snap indicator */}
        <button
          onClick={onToggleSnapToGrid}
          title={`Cuadrícula Magnética (Snap): ${snapToGrid ? 'ACTIVADO' : 'DESACTIVADO'} [G]`}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
            snapToGrid
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
              : 'hover:bg-zinc-800 text-zinc-500'
          }`}
        >
          <Magnet className="w-3 h-3" />
          <span>SNAP {snapToGrid ? `${gridSize}px` : 'OFF'}</span>
        </button>

        {isPlaying && (
          <span className="flex items-center gap-1.5 text-teal-400 font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            REPRODUCIENDO
          </span>
        )}
      </div>
    </div>
  );
};
