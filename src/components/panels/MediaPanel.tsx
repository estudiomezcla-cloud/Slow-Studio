import React, { useState, useRef } from 'react';
import {
  MediaAsset,
  MediaFolder,
  MediaAssetType,
  FlashElement,
  KeyframeSound,
} from '../../types/flash';
import {
  formatFileSize,
  formatDuration,
  playAssetAudio,
  stopCurrentPlayingAudio,
  generateProceduralSound,
  processUploadedFile,
} from '../../utils/mediaUtils';
import {
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Music,
  Video,
  Plus,
  Play,
  Square,
  Trash2,
  Edit2,
  FolderInput,
  Upload,
  Download,
  Search,
  Check,
  X,
  Mic,
  Sparkles,
  Volume2,
  Layers,
  ChevronRight,
  Maximize2,
  Wand2,
} from 'lucide-react';

interface MediaPanelProps {
  folders: MediaFolder[];
  assets: MediaAsset[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string, color?: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onAddAsset: (asset: MediaAsset) => void;
  onRenameAsset: (assetId: string, newName: string) => void;
  onDeleteAsset: (assetId: string) => void;
  onMoveAsset: (assetId: string, targetFolderId: string | null) => void;
  onInsertImageToStage: (asset: MediaAsset) => void;
  onAttachSoundToKeyframe: (sound: KeyframeSound) => void;
  currentFrame?: number;
  isExpandedModal?: boolean;
  onClose?: () => void;
}

const FOLDER_COLORS = ['#14b8a6', '#38bdf8', '#a855f7', '#f59e0b', '#ec4899', '#10b981', '#64748b'];

export const MediaPanel: React.FC<MediaPanelProps> = ({
  folders,
  assets,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onAddAsset,
  onRenameAsset,
  onDeleteAsset,
  onMoveAsset,
  onInsertImageToStage,
  onAttachSoundToKeyframe,
  currentFrame = 1,
  isExpandedModal = false,
  onClose,
}) => {
  const [filterType, setFilterType] = useState<MediaAssetType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playingAssetId, setPlayingAssetId] = useState<string | null>(null);
  const audioInstanceRef = useRef<HTMLAudioElement | null>(null);

  // Folder creation / rename states
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [newFolderColor, setNewFolderColor] = useState<string>('#14b8a6');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState<string>('');

  // Asset rename state
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingAssetName, setEditingAssetName] = useState<string>('');

  // Move asset popup state
  const [movingAssetId, setMovingAssetId] = useState<string | null>(null);

  // Procedural FX generator menu state
  const [showFxMenu, setShowFxMenu] = useState<boolean>(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Hidden File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Play audio asset preview
  const handleTogglePlayAudio = (asset: MediaAsset) => {
    if (playingAssetId === asset.id) {
      stopCurrentPlayingAudio();
      setPlayingAssetId(null);
    } else {
      setPlayingAssetId(asset.id);
      const audio = playAssetAudio(asset.url);
      audioInstanceRef.current = audio;
      audio.onended = () => setPlayingAssetId(null);
      audio.onerror = () => setPlayingAssetId(null);
    }
  };

  // Upload handler
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const asset = await processUploadedFile(file, selectedFolderId);
        onAddAsset(asset);
      } catch (err) {
        console.error('Error al importar archivo multimedia:', err);
      }
    }
    e.target.value = '';
  };

  // Drag and drop upload onto panel
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const asset = await processUploadedFile(file, selectedFolderId);
        onAddAsset(asset);
      } catch (err) {
        console.error('Error al procesar archivo soltado:', err);
      }
    }
  };

  // Generate procedural FX
  const handleCreateProceduralFx = (type: 'pop' | 'bounce' | 'chime' | 'laser' | 'bell', label: string) => {
    const fx = generateProceduralSound(type);
    const targetFolder = folders.find((f) => f.name.toLowerCase().includes('sonido') || f.name.toLowerCase().includes('fx'))?.id || selectedFolderId;
    const newAsset: MediaAsset = {
      id: `fx_${type}_${Date.now()}`,
      name: `${label}.wav`,
      type: 'audio',
      url: fx.url,
      folderId: targetFolder || null,
      size: Math.round(fx.duration * 44100 * 2),
      duration: fx.duration,
      mimeType: 'audio/wav',
      createdAt: Date.now(),
    };
    onAddAsset(newAsset);
    setShowFxMenu(false);
  };

  // Microphone recording
  const handleToggleRecord = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const url = reader.result as string;
            const newAsset: MediaAsset = {
              id: `rec_${Date.now()}`,
              name: `Grabación_${new Date().toLocaleTimeString().replace(/:/g, '-')}.webm`,
              type: 'audio',
              url,
              folderId: selectedFolderId,
              size: blob.size,
              duration: 2.0,
              mimeType: 'audio/webm',
              createdAt: Date.now(),
            };
            onAddAsset(newAsset);
          };
          reader.readAsDataURL(blob);
          stream.getTracks().forEach((t) => t.stop());
        };

        recorder.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Micrófono no disponible:', err);
      }
    }
  };

  // Filter assets by folder, type, and search
  const filteredAssets = assets.filter((asset) => {
    if (selectedFolderId !== null && asset.folderId !== selectedFolderId) return false;
    if (filterType !== 'all' && asset.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return asset.name.toLowerCase().includes(q);
    }
    return true;
  });

  const activeFolder = folders.find((f) => f.id === selectedFolderId);

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`bg-zinc-950 flex flex-col text-xs text-zinc-300 select-none ${
        isExpandedModal
          ? 'w-[860px] max-w-[95vw] h-[640px] max-h-[90vh] rounded-xl border border-zinc-800 shadow-2xl overflow-hidden'
          : 'w-72 border-l border-zinc-800 h-full overflow-hidden shrink-0'
      }`}
    >
      {/* Top Header */}
      <div className="h-10 px-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between font-semibold text-zinc-200 shrink-0">
        <div className="flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5 text-teal-400" />
          <span>Recursos Multimedia</span>
          <span className="text-[10px] text-zinc-500 font-mono">({assets.length})</span>
        </div>

        <div className="flex items-center gap-1">
          {/* FX generator button */}
          <div className="relative">
            <button
              onClick={() => setShowFxMenu((v) => !v)}
              title="Generar Efectos de Sonido FX procedimentales"
              className="p-1 rounded hover:bg-zinc-800 text-teal-400 hover:text-teal-300 transition flex items-center gap-1"
            >
              <Wand2 className="w-3.5 h-3.5" />
            </button>

            {showFxMenu && (
              <div className="absolute right-0 top-7 z-50 w-48 bg-zinc-900 border border-teal-500/30 rounded-lg shadow-xl p-1.5 space-y-1 text-xs">
                <div className="px-2 py-1 text-[10px] font-semibold text-teal-300 uppercase tracking-wider">
                  Sintetizar Efecto FX
                </div>
                <button
                  onClick={() => handleCreateProceduralFx('pop', 'Pop Impacto')}
                  className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-zinc-200 flex items-center justify-between"
                >
                  <span>Pop Impacto</span>
                  <Volume2 className="w-3 h-3 text-teal-400" />
                </button>
                <button
                  onClick={() => handleCreateProceduralFx('bounce', 'Boing Rebote')}
                  className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-zinc-200 flex items-center justify-between"
                >
                  <span>Boing Rebote</span>
                  <Volume2 className="w-3 h-3 text-teal-400" />
                </button>
                <button
                  onClick={() => handleCreateProceduralFx('chime', 'Chime Armónico')}
                  className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-zinc-200 flex items-center justify-between"
                >
                  <span>Chime Victoria</span>
                  <Volume2 className="w-3 h-3 text-teal-400" />
                </button>
                <button
                  onClick={() => handleCreateProceduralFx('laser', 'Laser Retro')}
                  className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-zinc-200 flex items-center justify-between"
                >
                  <span>Laser Sci-Fi</span>
                  <Volume2 className="w-3 h-3 text-teal-400" />
                </button>
                <button
                  onClick={() => handleCreateProceduralFx('bell', 'Campana Alerta')}
                  className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-zinc-200 flex items-center justify-between"
                >
                  <span>Campana Alerta</span>
                  <Volume2 className="w-3 h-3 text-teal-400" />
                </button>
              </div>
            )}
          </div>

          {/* Record button */}
          <button
            onClick={handleToggleRecord}
            title={isRecording ? 'Detener grabación de voz' : 'Grabar audio desde micrófono'}
            className={`p-1 rounded transition ${
              isRecording ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
          </button>

          {/* Import file button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Importar imágenes, sonidos o videos"
            className="p-1 rounded hover:bg-zinc-800 text-teal-400 hover:text-teal-300 transition"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          {/* Close for modal */}
          {isExpandedModal && onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main split: Folders Sidebar + Assets Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Folders List (Left sub-panel) */}
        <div className="w-28 sm:w-32 bg-zinc-900/60 border-r border-zinc-800/80 flex flex-col shrink-0 overflow-y-auto p-1.5 space-y-1">
          <div className="flex items-center justify-between px-1.5 py-1 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
            <span>Carpetas</span>
            <button
              onClick={() => setIsCreatingFolder(true)}
              title="Nueva carpeta personalizada"
              className="p-0.5 rounded hover:bg-zinc-800 text-teal-400 hover:text-teal-300"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* All Assets (Root) */}
          <button
            onClick={() => onSelectFolder(null)}
            className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition cursor-pointer ${
              selectedFolderId === null
                ? 'bg-teal-500/20 text-teal-300 font-medium border border-teal-500/30'
                : 'hover:bg-zinc-800/60 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">Todos</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">{assets.length}</span>
          </button>

          {/* Custom Folders */}
          {folders.map((folder) => {
            const count = assets.filter((a) => a.folderId === folder.id).length;
            const isSelected = selectedFolderId === folder.id;
            const isEditing = editingFolderId === folder.id;

            return (
              <div key={folder.id} className="relative group">
                {isEditing ? (
                  <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded border border-teal-500">
                    <input
                      type="text"
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onRenameFolder(folder.id, editingFolderName.trim() || folder.name);
                          setEditingFolderId(null);
                        }
                        if (e.key === 'Escape') setEditingFolderId(null);
                      }}
                      autoFocus
                      className="w-full bg-transparent text-white text-[11px] outline-none"
                    />
                    <button
                      onClick={() => {
                        onRenameFolder(folder.id, editingFolderName.trim() || folder.name);
                        setEditingFolderId(null);
                      }}
                      className="text-teal-400 hover:text-teal-300"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectFolder(folder.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/20 text-teal-300 font-medium border border-teal-500/30'
                        : 'hover:bg-zinc-800/60 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: folder.color || '#14b8a6' }}
                      />
                      <span className="truncate" title={folder.name}>
                        {folder.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">{count}</span>
                  </button>
                )}

                {/* Inline Folder Actions on hover */}
                {!isEditing && (
                  <div className="hidden group-hover:flex items-center gap-1 absolute right-1 top-1.5 bg-zinc-900/90 px-1 rounded shadow">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFolderId(folder.id);
                        setEditingFolderName(folder.name);
                      }}
                      className="p-0.5 text-zinc-400 hover:text-teal-300"
                      title="Renombrar carpeta"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder.id);
                      }}
                      className="p-0.5 text-zinc-400 hover:text-red-400"
                      title="Eliminar carpeta"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* New folder creation form */}
          {isCreatingFolder && (
            <div className="p-1.5 bg-zinc-950 border border-teal-500/50 rounded space-y-1.5 mt-1">
              <input
                type="text"
                placeholder="Nombre carpeta..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFolderName.trim()) {
                    onCreateFolder(newFolderName.trim(), newFolderColor);
                    setNewFolderName('');
                    setIsCreatingFolder(false);
                  }
                  if (e.key === 'Escape') setIsCreatingFolder(false);
                }}
                autoFocus
                className="w-full bg-zinc-900 px-1.5 py-1 text-xs text-white rounded border border-zinc-700 outline-none focus:border-teal-400"
              />
              <div className="flex items-center gap-1">
                {FOLDER_COLORS.map((col) => (
                  <button
                    key={col}
                    onClick={() => setNewFolderColor(col)}
                    className={`w-3.5 h-3.5 rounded-full ${newFolderColor === col ? 'ring-1 ring-white' : ''}`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => setIsCreatingFolder(false)}
                  className="px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (newFolderName.trim()) {
                      onCreateFolder(newFolderName.trim(), newFolderColor);
                      setNewFolderName('');
                      setIsCreatingFolder(false);
                    }
                  }}
                  className="px-2 py-0.5 bg-teal-500 text-zinc-950 text-[10px] font-bold rounded hover:bg-teal-400"
                >
                  Crear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Assets Main Area (Right sub-panel) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
          {/* Filter & Search Bar */}
          <div className="p-2 border-b border-zinc-800/80 flex items-center justify-between gap-2 shrink-0">
            {/* Filter segmented buttons */}
            <div className="flex items-center bg-zinc-900 p-0.5 rounded border border-zinc-800 text-[11px]">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 rounded transition ${
                  filterType === 'all' ? 'bg-teal-500 text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType('image')}
                className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
                  filterType === 'image' ? 'bg-teal-500 text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>Imágenes</span>
              </button>
              <button
                onClick={() => setFilterType('audio')}
                className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
                  filterType === 'audio' ? 'bg-teal-500 text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Music className="w-3 h-3" />
                <span>Audio</span>
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
                  filterType === 'video' ? 'bg-teal-500 text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Video className="w-3 h-3" />
                <span>Video</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-[160px]">
              <Search className="w-3 h-3 text-zinc-500 absolute left-2 top-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar archivo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded pl-6 pr-2 py-1 text-[11px] text-zinc-200 placeholder-zinc-500 outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Active Folder Title & Context */}
          <div className="px-3 py-1.5 bg-zinc-900/30 border-b border-zinc-800/40 flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
            <div className="flex items-center gap-1.5">
              <span>Carpeta:</span>
              <span className="font-semibold text-zinc-200">
                {activeFolder ? activeFolder.name : 'Todos los Recursos'}
              </span>
            </div>
            <span>{filteredAssets.length} archivos</span>
          </div>

          {/* Assets Grid / List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filteredAssets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-zinc-500 space-y-3">
                <FolderInput className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
                <div className="space-y-1">
                  <p className="text-zinc-300 font-medium">Esta carpeta está vacía</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs">
                    Arrastra imágenes, sonidos o videos aquí, o haz clic en "Importar" para añadir archivos al proyecto.
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Archivos Multimedia</span>
                </button>
              </div>
            ) : (
              filteredAssets.map((asset) => {
                const isPlaying = playingAssetId === asset.id;
                const isEditing = editingAssetId === asset.id;
                const isMoving = movingAssetId === asset.id;
                const folder = folders.find((f) => f.id === asset.folderId);

                return (
                  <div
                    key={asset.id}
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 transition flex flex-col gap-2 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Left: Thumbnail & Name */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                          {asset.type === 'image' ? (
                            <img
                              src={asset.url}
                              alt={asset.name}
                              className="w-full h-full object-contain"
                            />
                          ) : asset.type === 'audio' ? (
                            <button
                              onClick={() => handleTogglePlayAudio(asset)}
                              title={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
                              className={`w-full h-full flex items-center justify-center transition cursor-pointer ${
                                isPlaying ? 'bg-teal-500 text-zinc-950' : 'text-teal-400 hover:bg-zinc-800'
                              }`}
                            >
                              {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            </button>
                          ) : (
                            <Video className="w-5 h-5 text-amber-400" />
                          )}
                        </div>

                        {/* Title & Metadata */}
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingAssetName}
                                onChange={(e) => setEditingAssetName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    onRenameAsset(asset.id, editingAssetName.trim() || asset.name);
                                    setEditingAssetId(null);
                                  }
                                  if (e.key === 'Escape') setEditingAssetId(null);
                                }}
                                autoFocus
                                className="w-full bg-zinc-950 border border-teal-500 text-white px-1.5 py-0.5 rounded text-xs outline-none"
                              />
                              <button
                                onClick={() => {
                                  onRenameAsset(asset.id, editingAssetName.trim() || asset.name);
                                  setEditingAssetId(null);
                                }}
                                className="text-teal-400 hover:text-teal-300"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="truncate font-medium text-zinc-200" title={asset.name}>
                              {asset.name}
                            </div>
                          )}

                          {/* Subtle unboxed metadata */}
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                            <span className="capitalize">{asset.type}</span>
                            <span aria-hidden="true">·</span>
                            <span>{formatFileSize(asset.size)}</span>
                            {asset.dimensions && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{asset.dimensions.width}×{asset.dimensions.height}</span>
                              </>
                            )}
                            {asset.duration !== undefined && asset.duration > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{formatDuration(asset.duration)}</span>
                              </>
                            )}
                            {folder && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-zinc-400 flex items-center gap-1">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full inline-block"
                                    style={{ backgroundColor: folder.color || '#14b8a6' }}
                                  />
                                  <span>{folder.name}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick actions menu */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Move to folder trigger */}
                        <div className="relative">
                          <button
                            onClick={() => setMovingAssetId(isMoving ? null : asset.id)}
                            title="Mover a otra carpeta"
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-teal-300 transition"
                          >
                            <FolderInput className="w-3.5 h-3.5" />
                          </button>

                          {/* Move Popover */}
                          {isMoving && (
                            <div className="absolute right-0 top-6 z-50 w-40 bg-zinc-900 border border-teal-500/40 rounded-lg shadow-xl p-1 text-xs space-y-0.5">
                              <div className="px-2 py-1 text-[10px] text-zinc-500 font-semibold uppercase">
                                Mover a...
                              </div>
                              <button
                                onClick={() => {
                                  onMoveAsset(asset.id, null);
                                  setMovingAssetId(null);
                                }}
                                className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-zinc-200"
                              >
                                (Sin carpeta)
                              </button>
                              {folders.map((f) => (
                                <button
                                  key={f.id}
                                  onClick={() => {
                                    onMoveAsset(asset.id, f.id);
                                    setMovingAssetId(null);
                                  }}
                                  className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-zinc-200 flex items-center gap-1.5 truncate"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: f.color || '#14b8a6' }}
                                  />
                                  <span className="truncate">{f.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Rename */}
                        <button
                          onClick={() => {
                            setEditingAssetId(asset.id);
                            setEditingAssetName(asset.name);
                          }}
                          title="Renombrar archivo"
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-teal-300 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteAsset(asset.id)}
                          title="Eliminar del proyecto"
                          className="p-1 rounded hover:bg-red-950/80 text-zinc-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Action buttons (Insert / Attach to Keyframe) */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800/60">
                      {asset.type === 'image' && (
                        <button
                          onClick={() => onInsertImageToStage(asset)}
                          className="flex-1 py-1 px-2 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-semibold text-[11px] border border-teal-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Insertar imagen en el escenario como elemento vectorial / gráfico"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Insertar en Escenario</span>
                        </button>
                      )}

                      {asset.type === 'audio' && (
                        <>
                          <button
                            onClick={() =>
                              onAttachSoundToKeyframe({
                                assetId: asset.id,
                                name: asset.name,
                                url: asset.url,
                                sync: 'event',
                                volume: 1,
                              })
                            }
                            className="flex-1 py-1 px-2 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-semibold text-[11px] border border-teal-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            title={`Asignar sonido al fotograma actual (${currentFrame})`}
                          >
                            <Volume2 className="w-3 h-3 text-teal-400" />
                            <span>Vincular a Frame {currentFrame}</span>
                          </button>
                          <button
                            onClick={() => handleTogglePlayAudio(asset)}
                            className="py-1 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] transition"
                            title={isPlaying ? 'Detener' : 'Probar sonido'}
                          >
                            {isPlaying ? 'Detener' : 'Probar'}
                          </button>
                        </>
                      )}

                      {asset.type === 'video' && (
                        <button
                          onClick={() => onInsertImageToStage(asset)}
                          className="flex-1 py-1 px-2 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-semibold text-[11px] border border-teal-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Insertar clip de video en el escenario"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Insertar en Escenario</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Hidden File Input for Native File Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilesSelected}
        multiple
        accept="image/*,audio/*,video/*"
        className="hidden"
      />
    </div>
  );
};
