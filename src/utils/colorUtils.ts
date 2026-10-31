// Color, Gradient, and Palette Utilities for slow studio
// Supports Solid colors, Linear Gradients, Radial Gradients, and Studio Palettes

export interface GradientStop {
  color: string;
  offset: number; // 0 to 1
  id: string;
}

export interface GradientData {
  type: 'solid' | 'linear' | 'radial';
  angle: number; // 0 to 360 degrees (for linear)
  stops: GradientStop[];
  solidColor: string;
}

export interface StudioPalette {
  id: string;
  name: string;
  isBuiltIn?: boolean;
  colors: string[]; // Hex, RGBA, or gradient strings
}

// Built-in Studio Palettes
export const BUILTIN_PALETTES: StudioPalette[] = [
  {
    id: 'verde_agua_studio',
    name: 'slow studio (Verde Agua)',
    isBuiltIn: true,
    colors: [
      '#14b8a6', // Teal 500 (Principal)
      '#2dd4bf', // Teal 400
      '#5eead4', // Teal 300
      '#0d9488', // Teal 600
      '#0f766e', // Teal 700
      '#115e59', // Teal 800
      '#042f2e', // Teal 950
      '#06b6d4', // Cyan 500
      '#38bdf8', // Sky 400
      '#10b981', // Emerald 500
      '#ffffff', // Blanco
      '#09090b', // Zinc 950
    ],
  },
  {
    id: 'studio_gradients',
    name: 'Degradados de Estudio',
    isBuiltIn: true,
    colors: [
      'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)', // Verde Agua & Cyan
      'linear-gradient(90deg, #2dd4bf 0%, #0f766e 100%)', // Teal Deep
      'linear-gradient(180deg, #5eead4 0%, #14b8a6 50%, #042f2e 100%)', // Triple Verde Agua
      'radial-gradient(circle, #2dd4bf 0%, #0f766e 70%, #042f2e 100%)', // Orbe Verde Agua
      'linear-gradient(90deg, #f43f5e 0%, #fb923c 50%, #facc15 100%)', // Sunset Glow
      'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #3b82f6 100%)', // Cyberpunk Synth
      'radial-gradient(circle, #ffffff 0%, #38bdf8 60%, #0369a1 100%)', // Energía Celestial
      'linear-gradient(45deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%)', // Oro Líquido
    ],
  },
  {
    id: 'flash_classic_retro',
    name: 'Flash MX / Retro Web',
    isBuiltIn: true,
    colors: [
      '#ff0000',
      '#ff6600',
      '#ffff00',
      '#00ff00',
      '#00ffff',
      '#0066ff',
      '#0000ff',
      '#9900ff',
      '#ff00ff',
      '#ffffff',
      '#999999',
      '#000000',
    ],
  },
  {
    id: 'cyberpunk_neon',
    name: 'Cyberpunk Neón',
    isBuiltIn: true,
    colors: [
      '#00f0ff', // Cyan Neón
      '#ff0055', // Rosa Neón
      '#ffe600', // Amarillo Cyber
      '#7928ca', // Púrpura Profundo
      '#00ff66', // Verde Ácido
      '#10002b', // Negro Neón
      'linear-gradient(90deg, #00f0ff 0%, #ff0055 100%)',
      'radial-gradient(circle, #00ff66 0%, #10002b 100%)',
    ],
  },
  {
    id: 'sunset_chill',
    name: 'Atardecer Suave',
    isBuiltIn: true,
    colors: [
      '#2e0854', // Violeta noche
      '#7c2d12', // Tierra fuego
      '#c2410c', // Naranja atardecer
      '#ea580c', // Resplandor
      '#fbbf24', // Dorado sol
      '#fef08a', // Luz suave
      'linear-gradient(180deg, #2e0854 0%, #c2410c 60%, #fbbf24 100%)',
      'radial-gradient(circle, #fef08a 0%, #ea580c 50%, #2e0854 100%)',
    ],
  },
];

const LOCAL_STORAGE_KEY = 'slow_studio_user_palettes';

export function loadUserPalettes(): StudioPalette[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error loading custom palettes:', err);
  }
  return [
    {
      id: 'custom_palette_default',
      name: 'Mi Paleta Personalizada',
      colors: ['#14b8a6', '#2dd4bf', '#0f766e', '#06b6d4', '#ffffff', '#000000'],
    },
  ];
}

export function saveUserPalettes(palettes: StudioPalette[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(palettes));
  } catch (err) {
    console.warn('Error saving custom palettes:', err);
  }
}

// Check if string is a gradient
export function isGradient(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith('linear-gradient') || trimmed.startsWith('radial-gradient');
}

// Parse string (solid hex/rgba or CSS gradient) into structured GradientData
export function parseColorOrGradient(value: string | undefined | null): GradientData {
  const fallback: GradientData = {
    type: 'solid',
    angle: 90,
    stops: [
      { id: 'stop_1', color: '#14b8a6', offset: 0 },
      { id: 'stop_2', color: '#2dd4bf', offset: 1 },
    ],
    solidColor: '#14b8a6',
  };

  if (!value || typeof value !== 'string') return fallback;
  const trimmed = value.trim();

  // Linear Gradient
  if (trimmed.toLowerCase().startsWith('linear-gradient')) {
    try {
      const inner = trimmed.substring(trimmed.indexOf('(') + 1, trimmed.lastIndexOf(')'));
      const parts = splitTopLevel(inner, ',');
      let angle = 90;
      let startIndex = 0;

      if (parts.length > 0) {
        const first = parts[0].trim();
        if (first.includes('deg')) {
          angle = parseFloat(first);
          startIndex = 1;
        } else if (first.startsWith('to ')) {
          if (first.includes('right')) angle = 90;
          else if (first.includes('left')) angle = 270;
          else if (first.includes('bottom')) angle = 180;
          else if (first.includes('top')) angle = 0;
          startIndex = 1;
        }
      }

      const rawStops = parts.slice(startIndex);
      const stops: GradientStop[] = rawStops.map((stopStr, idx) => {
        const clean = stopStr.trim();
        const lastSpace = clean.lastIndexOf(' ');
        if (lastSpace !== -1) {
          const color = clean.substring(0, lastSpace).trim();
          const percentStr = clean.substring(lastSpace + 1).replace('%', '').trim();
          const offset = isNaN(Number(percentStr)) ? idx / Math.max(1, rawStops.length - 1) : Number(percentStr) / 100;
          return { id: `stop_${idx}_${Date.now()}`, color: color || '#14b8a6', offset: Math.max(0, Math.min(1, offset)) };
        }
        return {
          id: `stop_${idx}_${Date.now()}`,
          color: clean || '#14b8a6',
          offset: idx / Math.max(1, rawStops.length - 1),
        };
      });

      return {
        type: 'linear',
        angle: isNaN(angle) ? 90 : ((angle % 360) + 360) % 360,
        stops: stops.length >= 2 ? stops : fallback.stops,
        solidColor: stops[0]?.color || '#14b8a6',
      };
    } catch {
      return fallback;
    }
  }

  // Radial Gradient
  if (trimmed.toLowerCase().startsWith('radial-gradient')) {
    try {
      const inner = trimmed.substring(trimmed.indexOf('(') + 1, trimmed.lastIndexOf(')'));
      const parts = splitTopLevel(inner, ',');
      let startIndex = 0;

      if (parts.length > 0) {
        const first = parts[0].trim();
        if (first.startsWith('circle') || first.startsWith('ellipse')) {
          startIndex = 1;
        }
      }

      const rawStops = parts.slice(startIndex);
      const stops: GradientStop[] = rawStops.map((stopStr, idx) => {
        const clean = stopStr.trim();
        const lastSpace = clean.lastIndexOf(' ');
        if (lastSpace !== -1) {
          const color = clean.substring(0, lastSpace).trim();
          const percentStr = clean.substring(lastSpace + 1).replace('%', '').trim();
          const offset = isNaN(Number(percentStr)) ? idx / Math.max(1, rawStops.length - 1) : Number(percentStr) / 100;
          return { id: `stop_${idx}_${Date.now()}`, color: color || '#14b8a6', offset: Math.max(0, Math.min(1, offset)) };
        }
        return {
          id: `stop_${idx}_${Date.now()}`,
          color: clean || '#14b8a6',
          offset: idx / Math.max(1, rawStops.length - 1),
        };
      });

      return {
        type: 'radial',
        angle: 0,
        stops: stops.length >= 2 ? stops : fallback.stops,
        solidColor: stops[0]?.color || '#14b8a6',
      };
    } catch {
      return fallback;
    }
  }

  // Solid Color
  return {
    type: 'solid',
    angle: 90,
    stops: [
      { id: 'stop_1', color: trimmed || '#14b8a6', offset: 0 },
      { id: 'stop_2', color: '#2dd4bf', offset: 1 },
    ],
    solidColor: trimmed || '#14b8a6',
  };
}

// Split comma-separated tokens without splitting inside parentheses (e.g. rgba(0,0,0,1))
function splitTopLevel(str: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth--;

    if (ch === delimiter && parenDepth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim().length > 0) {
    result.push(current.trim());
  }
  return result;
}

// Serialize GradientData to CSS string or Solid Color string
export function buildGradientString(data: GradientData): string {
  if (data.type === 'solid') {
    return data.solidColor || '#14b8a6';
  }

  const sortedStops = [...data.stops].sort((a, b) => a.offset - b.offset);
  const stopsFormatted = sortedStops
    .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
    .join(', ');

  if (data.type === 'linear') {
    const angle = Math.round(data.angle ?? 90);
    return `linear-gradient(${angle}deg, ${stopsFormatted})`;
  }

  if (data.type === 'radial') {
    return `radial-gradient(circle, ${stopsFormatted})`;
  }

  return data.solidColor || '#14b8a6';
}

// Resolves a fill string (solid or gradient) into a CanvasRenderingContext2D compatible fillStyle (string or CanvasGradient)
export function resolveCanvasFill(
  ctx: CanvasRenderingContext2D,
  fill: string | undefined | null,
  bounds: { x: number; y: number; width: number; height: number; shapeType?: string }
): string | CanvasGradient {
  if (!fill || typeof fill !== 'string' || fill === 'transparent') {
    return fill || 'transparent';
  }

  const trimmed = fill.trim();
  if (!isGradient(trimmed)) {
    return trimmed;
  }

  const parsed = parseColorOrGradient(trimmed);
  const isCircleOrStar = bounds.shapeType === 'circle' || bounds.shapeType === 'star';
  const cx = isCircleOrStar ? bounds.x : bounds.x + bounds.width / 2;
  const cy = isCircleOrStar ? bounds.y : bounds.y + bounds.height / 2;
  const hw = Math.max(1, Math.abs(bounds.width / 2));
  const hh = Math.max(1, Math.abs(bounds.height / 2));

  if (parsed.type === 'linear') {
    // Angle in degrees to radians, 0deg = bottom-to-top, 90deg = left-to-right
    const angleRad = ((parsed.angle - 90) * Math.PI) / 180;
    const dx = Math.cos(angleRad) * hw;
    const dy = Math.sin(angleRad) * hh;

    const x0 = cx - dx;
    const y0 = cy - dy;
    const x1 = cx + dx;
    const y1 = cy + dy;

    try {
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      const sortedStops = [...parsed.stops].sort((a, b) => a.offset - b.offset);
      sortedStops.forEach((s) => {
        const offset = Math.max(0, Math.min(1, s.offset));
        grad.addColorStop(offset, s.color);
      });
      return grad;
    } catch {
      return parsed.solidColor || '#14b8a6';
    }
  }

  if (parsed.type === 'radial') {
    const radius = Math.max(hw, hh);
    try {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, radius));
      const sortedStops = [...parsed.stops].sort((a, b) => a.offset - b.offset);
      sortedStops.forEach((s) => {
        const offset = Math.max(0, Math.min(1, s.offset));
        grad.addColorStop(offset, s.color);
      });
      return grad;
    } catch {
      return parsed.solidColor || '#14b8a6';
    }
  }

  return parsed.solidColor || '#14b8a6';
}

// Color conversion helpers (RGB, HEX, HSV)
export function hexToRgb(hex: string): { r: number; g: number; b: number; a: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length === 6) {
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
      a: 1,
    };
  }
  if (clean.length === 8) {
    const num = parseInt(clean, 16);
    return {
      r: (num >> 24) & 255,
      g: (num >> 16) & 255,
      b: (num >> 8) & 255,
      a: Math.round(((num & 255) / 255) * 100) / 100,
    };
  }
  return { r: 20, g: 184, b: 166, a: 1 };
}

export function rgbToHex(r: number, g: number, b: number, a = 1): string {
  const rHex = Math.round(Math.max(0, Math.min(255, r))).toString(16).padStart(2, '0');
  const gHex = Math.round(Math.max(0, Math.min(255, g))).toString(16).padStart(2, '0');
  const bHex = Math.round(Math.max(0, Math.min(255, b))).toString(16).padStart(2, '0');
  if (a < 1) {
    const aHex = Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');
    return `#${rHex}${gHex}${bHex}${aHex}`;
  }
  return `#${rHex}${gHex}${bHex}`;
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const normR = r / 255;
  const normG = g / 255;
  const normB = b / 255;

  const max = Math.max(normR, normG, normB);
  const min = Math.min(normR, normG, normB);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === normR) h = ((normG - normB) / delta) % 6;
    else if (max === normG) h = (normB - normR) / delta + 2;
    else h = (normR - normG) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : Math.round((delta / max) * 100);
  const v = Math.round(max * 100);

  return { h, s, v };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const normS = s / 100;
  const normV = v / 100;

  const c = normV * normS;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = normV - c;

  let rPrime = 0, gPrime = 0, bPrime = 0;
  if (h >= 0 && h < 60) {
    rPrime = c; gPrime = x; bPrime = 0;
  } else if (h >= 60 && h < 120) {
    rPrime = x; gPrime = c; bPrime = 0;
  } else if (h >= 120 && h < 180) {
    rPrime = 0; gPrime = c; bPrime = x;
  } else if (h >= 180 && h < 240) {
    rPrime = 0; gPrime = x; bPrime = c;
  } else if (h >= 240 && h < 300) {
    rPrime = x; gPrime = 0; bPrime = c;
  } else {
    rPrime = c; gPrime = 0; bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
}
