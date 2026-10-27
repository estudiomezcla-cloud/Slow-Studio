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

export interface FlashElement {
  id: string;
  name: string;
  type: 'shape' | 'group' | 'text' | 'button' | 'symbolInstance' | 'threeObject';
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
  actions?: string;
}

export interface Keyframe {
  frame: number; // 1-indexed
  tweenType: TweenType;
  easing?: EasingType;
  prompt?: string;
  actions?: string; // e.g. "stop();", "gotoAndPlay(1);"
  elements: FlashElement[];
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
  keyframes: Keyframe[];
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
