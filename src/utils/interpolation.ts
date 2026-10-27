import { EasingType, FlashElement, Keyframe, Layer } from '../types/flash';

export function applyEasing(t: number, easing: EasingType = 'linear'): number {
  switch (easing) {
    case 'easeIn':
      return t * t;
    case 'easeOut':
      return t * (2 - t);
    case 'easeInOut':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    case 'bounce': {
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        const t2 = t - 1.5 / 2.75;
        return 7.5625 * t2 * t2 + 0.75;
      } else if (t < 2.5 / 2.75) {
        const t2 = t - 2.25 / 2.75;
        return 7.5625 * t2 * t2 + 0.9375;
      } else {
        const t2 = t - 2.625 / 2.75;
        return 7.5625 * t2 * t2 + 0.984375;
      }
    }
    case 'linear':
    default:
      return t;
  }
}

export function lerpNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  if (!color || color === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
      a: 1,
    };
  }
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
    };
  }
  return { r: 20, g: 184, b: 166, a: 1 }; // Default verde agua teal
}

export function lerpColor(c1: string, c2: string, t: number): string {
  const col1 = parseColor(c1);
  const col2 = parseColor(c2);
  const r = Math.round(lerpNumber(col1.r, col2.r, t));
  const g = Math.round(lerpNumber(col1.g, col2.g, t));
  const b = Math.round(lerpNumber(col1.b, col2.b, t));
  const a = Math.round(lerpNumber(col1.a, col2.a, t) * 100) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function interpolatePoints(
  p1: Array<{ x: number; y: number }> | undefined,
  p2: Array<{ x: number; y: number }> | undefined,
  t: number
): Array<{ x: number; y: number }> | undefined {
  if (!p1 || !p2 || p1.length === 0 || p2.length === 0) return p1 || p2;
  const count = Math.max(p1.length, p2.length);
  const res: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < count; i++) {
    const pt1 = p1[Math.min(i, p1.length - 1)];
    const pt2 = p2[Math.min(i, p2.length - 1)];
    res.push({
      x: lerpNumber(pt1.x, pt2.x, t),
      y: lerpNumber(pt1.y, pt2.y, t),
    });
  }
  return res;
}

export function interpolateElement(el1: FlashElement, el2: FlashElement, t: number, tweenType: 'motion' | 'shape'): FlashElement {
  const interpolated: FlashElement = {
    ...el1,
    x: lerpNumber(el1.x, el2.x, t),
    y: lerpNumber(el1.y, el2.y, t),
    width: lerpNumber(el1.width, el2.width, t),
    height: lerpNumber(el1.height, el2.height, t),
    rotation: lerpNumber(el1.rotation || 0, el2.rotation || 0, t),
    scaleX: lerpNumber(el1.scaleX ?? 1, el2.scaleX ?? 1, t),
    scaleY: lerpNumber(el1.scaleY ?? 1, el2.scaleY ?? 1, t),
    opacity: lerpNumber(el1.opacity ?? 1, el2.opacity ?? 1, t),
    fill: lerpColor(el1.fill, el2.fill, t),
    stroke: lerpColor(el1.stroke, el2.stroke, t),
    strokeWidth: lerpNumber(el1.strokeWidth || 1, el2.strokeWidth || 1, t),
  };

  if (tweenType === 'shape') {
    interpolated.points = interpolatePoints(el1.points, el2.points, t);
    if (t > 0.5 && el2.shapeType) {
      interpolated.shapeType = el2.shapeType;
    }
  }

  // Handle nested groups
  if (el1.children && el2.children && el1.children.length > 0 && el2.children.length > 0) {
    interpolated.children = el1.children.map((c1, idx) => {
      const c2 = el2.children![idx] || c1;
      return interpolateElement(c1, c2, t, tweenType);
    });
  }

  if (el1.threeData && el2.threeData) {
    interpolated.threeData = {
      modelType: t < 0.5 ? el1.threeData.modelType : el2.threeData.modelType,
      color: lerpColor(el1.threeData.color, el2.threeData.color, t),
      metalness: lerpNumber(el1.threeData.metalness, el2.threeData.metalness, t),
      roughness: lerpNumber(el1.threeData.roughness, el2.threeData.roughness, t),
      rotX: lerpNumber(el1.threeData.rotX, el2.threeData.rotX, t),
      rotY: lerpNumber(el1.threeData.rotY, el2.threeData.rotY, t),
      rotZ: lerpNumber(el1.threeData.rotZ, el2.threeData.rotZ, t),
    };
  }

  return interpolated;
}

export function getLayerElementsAtFrame(layer: Layer, frame: number): FlashElement[] {
  if (!layer.visible || layer.keyframes.length === 0) return [];

  const sorted = [...layer.keyframes].sort((a, b) => a.frame - b.frame);
  const exact = sorted.find((kf) => kf.frame === frame);
  if (exact) {
    return exact.elements;
  }

  let kfPrev: Keyframe | null = null;
  let kfNext: Keyframe | null = null;

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].frame < frame) {
      kfPrev = sorted[i];
    } else if (sorted[i].frame > frame && !kfNext) {
      kfNext = sorted[i];
      break;
    }
  }

  if (!kfPrev) {
    return [];
  }

  if (!kfNext || kfPrev.tweenType === 'none') {
    return kfPrev.elements;
  }

  const span = kfNext.frame - kfPrev.frame;
  if (span <= 0) return kfPrev.elements;

  const rawT = (frame - kfPrev.frame) / span;
  const easedT = applyEasing(rawT, kfPrev.easing || 'linear');

  const results: FlashElement[] = [];
  const maxElements = Math.max(kfPrev.elements.length, kfNext.elements.length);

  for (let i = 0; i < maxElements; i++) {
    const el1 = kfPrev.elements[i] || kfNext.elements[i];
    const el2 =
      kfNext.elements.find((e) => e.id === el1.id) ||
      kfNext.elements[i] ||
      el1;

    results.push(interpolateElement(el1, el2, easedT, kfPrev.tweenType));
  }

  return results;
}
