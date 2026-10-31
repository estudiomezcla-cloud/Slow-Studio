export type ToolType =
  | 'select'
  | 'freetransform'
  | 'subselect'
  | 'rect'
  | 'circle'
  | 'star'
  | 'pencil'
  | 'brush'
  | 'text'
  | 'paintbucket'
  | 'eraser'
  | 'three'
  | 'hand'
  | 'zoom';

export type TweenType = 'none' | 'motion' | 'shape';
export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce';
export type RegistrationPoint = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type MediaAssetType = 'image' | 'audio' | 'video';

export interface MediaFolder {
  id: string;
  name: string;
  parentId?: string | null;
  color?: string;
  createdAt: number;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaAssetType;
  url: string; // Data URL or object URL
  folderId?: string | null; // null/undefined for root
  size?: number; // bytes
  dimensions?: { width: number; height: number };
  duration?: number; // seconds (audio/video)
  mimeType?: string;
  createdAt: number;
  thumbnail?: string;
}

export interface KeyframeSound {
  assetId: string;
  name: string;
  url: string;
  sync: 'event' | 'stream' | 'stop';
  loop?: boolean;
  volume?: number; // 0 to 1
}

export interface FlashElement {
  id: string;
  name: string;
  type: 'shape' | 'group' | 'text' | 'button' | 'symbolInstance' | 'threeObject' | 'image' | 'video';
  shapeType?: 'circle' | 'rect' | 'star' | 'polygon' | 'path';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  scaleX: number;
  scaleY: number;
  skewX?: number;
  skewY?: number;
  opacity: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  points?: Array<{ x: number; y: number }>;
  symbolId?: string; // ID of symbol in library
  registrationPoint?: RegistrationPoint;
  colorEffect?: {
    type: 'none' | 'alpha' | 'tint' | 'brightness';
    value: number; // 0 to 1
    tintColor?: string;
  };
  children?: FlashElement[]; // For type === 'group'
  buttonState?: 'up' | 'over' | 'down' | 'hit';
  threeData?: {
    modelType: 'spaceship' | 'robot' | 'cube' | 'sphere' | 'gem';
    color: string;
    metalness: number;
    roughness: number;
    rotX: number;
    rotY: number;
    rotZ: number;
  };
  filters?: ElementFilters;
  actions?: string;
  motionPath?: MotionPathData;
  mediaAssetId?: string;
  mediaUrl?: string;
}

export interface MotionPathPoint {
  x: number;
  y: number;
}

export interface MotionPathData {
  enabled: boolean;
  type: 'quadratic' | 'cubic';
  cp1: MotionPathPoint;
  cp2?: MotionPathPoint;
  autoOrient?: boolean;
  showFrameTicks?: boolean;
}

export interface ElementFilters {
  blur?: number; // in px, e.g. 0 to 50, default 0
  brightness?: number; // percentage, e.g. 0 to 200, default 100
  contrast?: number; // percentage, e.g. 0 to 200, default 100
  dropShadow?: {
    enabled: boolean;
    color: string;
    blur: number; // in px
    offsetX: number; // in px
    offsetY: number; // in px
  };
}

export interface Keyframe {
  frame: number; // 1-indexed
  tweenType: TweenType;
  easing?: EasingType;
  prompt?: string;
  actions?: string; // e.g. "stop();", "gotoAndPlay(1);"
  elements: FlashElement[];
  motionPath?: MotionPathData;
  motionPaths?: Record<string, MotionPathData>;
  sound?: KeyframeSound;
}

export type LayerType = 'normal' | 'background' | 'guide';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
  keyframes: Keyframe[];
  layerType?: LayerType;
  backgroundPresetId?: string;
}

export interface FlashSymbol {
  id: string;
  name: string;
  type: 'movieclip' | 'button' | 'graphic';
  layers: Layer[]; // Sub-animation timeline for MovieClip & Graphic
  totalFrames?: number;
  buttonStates?: {
    up: FlashElement[];
    over: FlashElement[];
    down: FlashElement[];
    hit: FlashElement[];
  };
}

export interface FlashScene {
  id: string;
  name: string;
  layers: Layer[];
}

export interface FlashDocument {
  title: string;
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  backgroundColor: string;
  scenes: FlashScene[];
  symbols: FlashSymbol[];
  mediaFolders?: MediaFolder[];
  mediaAssets?: MediaAsset[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  animationPreview?: {
    layerCount: number;
    keyframeCount: number;
    description?: string;
  };
}

export type OnionSkinMode = 'all' | 'prev' | 'next';

export interface OnionSkinSettings {
  enabled: boolean;
  mode: OnionSkinMode;
  pastFramesCount: number;
  futureFramesCount: number;
  baseOpacity: number;
  pastColor: string;
  futureColor: string;
}

export interface CameraViewport {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  isEditing?: boolean;
}

