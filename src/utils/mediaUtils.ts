import { MediaAsset, MediaFolder, MediaAssetType } from '../types/flash';

// Procedural WAV synthesis helper (creates valid self-contained audio/wav Data URIs)
function createWavDataUri(
  sampleRate: number,
  durationSec: number,
  generator: (t: number) => number
): string {
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.max(-1, Math.min(1, generator(t)));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  // Convert buffer to base64 Data URI
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Procedural sound presets
export function generateProceduralSound(type: 'pop' | 'bounce' | 'chime' | 'laser' | 'bell'): {
  url: string;
  duration: number;
} {
  const sampleRate = 44100;

  if (type === 'pop') {
    const duration = 0.12;
    const url = createWavDataUri(sampleRate, duration, (t) => {
      const freq = 600 * Math.exp(-t * 28);
      const envelope = Math.exp(-t * 30);
      return Math.sin(2 * Math.PI * freq * t) * envelope * 0.85;
    });
    return { url, duration };
  }

  if (type === 'bounce') {
    const duration = 0.28;
    const url = createWavDataUri(sampleRate, duration, (t) => {
      // Frequency chirp down then up
      const freq = 180 + 320 * Math.sin(t * Math.PI * 4) * Math.exp(-t * 8);
      const envelope = Math.exp(-t * 7);
      return Math.sin(2 * Math.PI * freq * t) * envelope * 0.9;
    });
    return { url, duration };
  }

  if (type === 'chime') {
    const duration = 0.75;
    const url = createWavDataUri(sampleRate, duration, (t) => {
      const harm1 = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 4);
      const harm2 = Math.sin(2 * Math.PI * 1320 * t) * Math.exp(-t * 5) * 0.5;
      const harm3 = Math.sin(2 * Math.PI * 1760 * t) * Math.exp(-t * 6) * 0.3;
      return (harm1 + harm2 + harm3) * 0.7;
    });
    return { url, duration };
  }

  if (type === 'laser') {
    const duration = 0.22;
    const url = createWavDataUri(sampleRate, duration, (t) => {
      const freq = 1600 * Math.exp(-t * 18);
      const envelope = Math.exp(-t * 12);
      return (Math.sin(2 * Math.PI * freq * t) > 0 ? 0.6 : -0.6) * envelope;
    });
    return { url, duration };
  }

  // Bell / notification
  const duration = 0.85;
  const url = createWavDataUri(sampleRate, duration, (t) => {
    const fundamental = Math.sin(2 * Math.PI * 523.25 * t) * Math.exp(-t * 3);
    const octave = Math.sin(2 * Math.PI * 1046.5 * t) * Math.exp(-t * 4) * 0.4;
    return (fundamental + octave) * 0.8;
  });
  return { url, duration };
}

// Built-in Default Studio Media Folders
export const DEFAULT_MEDIA_FOLDERS: MediaFolder[] = [
  {
    id: 'folder_images',
    name: 'Imágenes y Sprites',
    color: '#14b8a6', // Verde agua
    createdAt: Date.now() - 3000,
  },
  {
    id: 'folder_sfx',
    name: 'Efectos de Sonido (FX)',
    color: '#38bdf8', // Celeste
    createdAt: Date.now() - 2000,
  },
  {
    id: 'folder_music',
    name: 'Música y Voces',
    color: '#a855f7', // Púrpura
    createdAt: Date.now() - 1000,
  },
  {
    id: 'folder_videos',
    name: 'Clips de Video',
    color: '#f59e0b', // Ámbar
    createdAt: Date.now(),
  },
];

// SVG Emblem Generator for Initial Image Asset
const SLOW_STUDIO_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09090b" />
      <stop offset="100%" stop-color="#14b8a6" stop-opacity="0.2" />
    </linearGradient>
    <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2dd4bf" />
      <stop offset="100%" stop-color="#0f766e" />
    </linearGradient>
  </defs>
  <rect width="400" height="300" rx="16" fill="url(#bg)" stroke="#14b8a6" stroke-width="2" stroke-opacity="0.4"/>
  <circle cx="200" cy="120" r="54" fill="url(#tealGrad)" />
  <path d="M175 120 L195 100 L195 140 Z" fill="#09090b" />
  <path d="M205 100 L225 120 L205 140 Z" fill="#09090b" />
  <text x="200" y="215" font-family="system-ui, sans-serif" font-weight="800" font-size="24" fill="#ffffff" text-anchor="middle" letter-spacing="1">slow studio</text>
  <text x="200" y="240" font-family="monospace" font-weight="600" font-size="12" fill="#2dd4bf" text-anchor="middle" letter-spacing="2">VECTOR ENGINE</text>
</svg>
`)}`;

const STARBURST_BADGE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <defs>
    <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#5eead4" />
      <stop offset="70%" stop-color="#0d9488" />
      <stop offset="100%" stop-color="#042f2e" />
    </radialGradient>
  </defs>
  <polygon points="150,20 185,90 260,60 230,135 295,175 220,195 235,270 165,230 130,290 100,220 25,235 65,165 5,125 80,105 70,30 135,70" fill="url(#starGlow)" stroke="#2dd4bf" stroke-width="4"/>
  <circle cx="150" cy="150" r="48" fill="#09090b" stroke="#5eead4" stroke-width="3"/>
  <text x="150" y="157" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#2dd4bf" text-anchor="middle">SLOW</text>
</svg>
`)}`;

// Built-in Default Studio Media Assets
export const DEFAULT_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: 'asset_img_logo',
    name: 'Logo Oficial slow studio.svg',
    type: 'image',
    url: SLOW_STUDIO_LOGO_SVG,
    folderId: 'folder_images',
    size: 4200,
    dimensions: { width: 400, height: 300 },
    mimeType: 'image/svg+xml',
    createdAt: Date.now() - 3000,
  },
  {
    id: 'asset_img_star',
    name: 'Insignia Vectorial Neón.svg',
    type: 'image',
    url: STARBURST_BADGE_SVG,
    folderId: 'folder_images',
    size: 2800,
    dimensions: { width: 300, height: 300 },
    mimeType: 'image/svg+xml',
    createdAt: Date.now() - 2500,
  },
  {
    id: 'asset_snd_bounce',
    name: 'Boing Rebote Pelota.wav',
    type: 'audio',
    url: generateProceduralSound('bounce').url,
    folderId: 'folder_sfx',
    size: 24700,
    duration: 0.28,
    mimeType: 'audio/wav',
    createdAt: Date.now() - 2000,
  },
  {
    id: 'asset_snd_pop',
    name: 'Pop Impacto.wav',
    type: 'audio',
    url: generateProceduralSound('pop').url,
    folderId: 'folder_sfx',
    size: 10600,
    duration: 0.12,
    mimeType: 'audio/wav',
    createdAt: Date.now() - 1500,
  },
  {
    id: 'asset_snd_chime',
    name: 'Chime Victoria Armónico.wav',
    type: 'audio',
    url: generateProceduralSound('chime').url,
    folderId: 'folder_sfx',
    size: 66200,
    duration: 0.75,
    mimeType: 'audio/wav',
    createdAt: Date.now() - 1000,
  },
  {
    id: 'asset_snd_laser',
    name: 'Laser Retro Sci-Fi.wav',
    type: 'audio',
    url: generateProceduralSound('laser').url,
    folderId: 'folder_sfx',
    size: 19400,
    duration: 0.22,
    mimeType: 'audio/wav',
    createdAt: Date.now() - 500,
  },
];

// Helper: Convert user uploaded File to MediaAsset
export async function processUploadedFile(file: File, folderId?: string | null): Promise<MediaAsset> {
  const mime = file.type || '';
  let type: MediaAssetType = 'image';
  if (mime.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
    type = 'audio';
  } else if (mime.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
    type = 'video';
  }

  const url = await readFileAsDataUrl(file);

  let dimensions: { width: number; height: number } | undefined;
  let duration: number | undefined;

  if (type === 'image') {
    dimensions = await getImageDimensions(url);
  } else if (type === 'audio') {
    duration = await getAudioDuration(url);
  } else if (type === 'video') {
    const videoMeta = await getVideoMetadata(url);
    dimensions = { width: videoMeta.width, height: videoMeta.height };
    duration = videoMeta.duration;
  }

  return {
    id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: file.name,
    type,
    url,
    folderId: folderId || null,
    size: file.size,
    dimensions,
    duration,
    mimeType: mime || `${type}/*`,
    createdAt: Date.now(),
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 200, height: img.naturalHeight || 200 });
    img.onerror = () => resolve({ width: 200, height: 200 });
    img.src = url;
  });
}

function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => resolve(audio.duration || 0);
    audio.onerror = () => resolve(0);
    audio.src = url;
  });
}

function getVideoMetadata(url: string): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth || 320,
        height: video.videoHeight || 240,
        duration: video.duration || 0,
      });
    };
    video.onerror = () => resolve({ width: 320, height: 240, duration: 0 });
    video.src = url;
  });
}

// Global active audio playback tracking
let currentPlayingAudio: HTMLAudioElement | null = null;

export function playAssetAudio(url: string, volume = 1): HTMLAudioElement {
  if (currentPlayingAudio) {
    currentPlayingAudio.pause();
    currentPlayingAudio = null;
  }

  const audio = new Audio(url);
  audio.volume = Math.max(0, Math.min(1, volume));
  audio.play().catch(() => {});
  currentPlayingAudio = audio;
  return audio;
}

export function stopCurrentPlayingAudio() {
  if (currentPlayingAudio) {
    currentPlayingAudio.pause();
    currentPlayingAudio = null;
  }
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
}
