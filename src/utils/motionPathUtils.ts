import { FlashElement, Keyframe, Layer, MotionPathData, MotionPathPoint } from '../types/flash';
import { applyEasing } from './interpolation';

/**
 * Evaluates position (X, Y) along a quadratic or cubic Bézier curve at parameter t in [0, 1].
 */
export function evaluateBezierPoint(
  p0: MotionPathPoint,
  cp1: MotionPathPoint,
  pEnd: MotionPathPoint,
  cp2?: MotionPathPoint,
  t: number = 0,
  type: 'quadratic' | 'cubic' = 'quadratic'
): MotionPathPoint {
  const clampedT = Math.max(0, Math.min(1, t));

  if (type === 'cubic' && cp2) {
    // Cubic Bézier: B(t) = (1-t)^3 * P0 + 3(1-t)^2 * t * CP1 + 3(1-t) * t^2 * CP2 + t^3 * P_end
    const mt = 1 - clampedT;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = clampedT * clampedT;
    const t3 = t2 * clampedT;

    return {
      x: mt3 * p0.x + 3 * mt2 * clampedT * cp1.x + 3 * mt * t2 * cp2.x + t3 * pEnd.x,
      y: mt3 * p0.y + 3 * mt2 * clampedT * cp1.y + 3 * mt * t2 * cp2.y + t3 * pEnd.y,
    };
  }

  // Quadratic Bézier: B(t) = (1-t)^2 * P0 + 2(1-t) * t * CP1 + t^2 * P_end
  const mt = 1 - clampedT;
  const mt2 = mt * mt;
  const t2 = clampedT * clampedT;

  return {
    x: mt2 * p0.x + 2 * mt * clampedT * cp1.x + t2 * pEnd.x,
    y: mt2 * p0.y + 2 * mt * clampedT * cp1.y + t2 * pEnd.y,
  };
}

/**
 * Evaluates the tangent direction angle (in degrees, 0-360) along the curve at parameter t.
 * Useful for "Auto-orient to path" / "Orientar según la trayectoria".
 */
export function evaluateBezierTangent(
  p0: MotionPathPoint,
  cp1: MotionPathPoint,
  pEnd: MotionPathPoint,
  cp2?: MotionPathPoint,
  t: number = 0,
  type: 'quadratic' | 'cubic' = 'quadratic'
): number {
  const clampedT = Math.max(0, Math.min(1, t));
  let dx = 0;
  let dy = 0;

  if (type === 'cubic' && cp2) {
    // Derivative of cubic Bézier: B'(t) = 3(1-t)^2 * (CP1 - P0) + 6(1-t)*t * (CP2 - CP1) + 3t^2 * (P_end - CP2)
    const mt = 1 - clampedT;
    const mt2 = mt * mt;
    const t2 = clampedT * clampedT;

    dx = 3 * mt2 * (cp1.x - p0.x) + 6 * mt * clampedT * (cp2.x - cp1.x) + 3 * t2 * (pEnd.x - cp2.x);
    dy = 3 * mt2 * (cp1.y - p0.y) + 6 * mt * clampedT * (cp2.y - cp1.y) + 3 * t2 * (pEnd.y - cp2.y);
  } else {
    // Derivative of quadratic Bézier: B'(t) = 2(1-t) * (CP1 - P0) + 2t * (P_end - CP1)
    const mt = 1 - clampedT;
    dx = 2 * mt * (cp1.x - p0.x) + 2 * clampedT * (pEnd.x - cp1.x);
    dy = 2 * mt * (cp1.y - p0.y) + 2 * clampedT * (pEnd.y - cp1.y);
  }

  if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
    return 0;
  }

  const rad = Math.atan2(dy, dx);
  return (rad * 180) / Math.PI;
}

/**
 * Creates default initial control points for a motion path between p0 and pEnd.
 */
export function createDefaultMotionPath(
  p0: MotionPathPoint,
  pEnd: MotionPathPoint,
  type: 'quadratic' | 'cubic' = 'quadratic',
  preset: 'arc' | 's-curve' | 'loop' | 'wave' | 'bounce' | 'linear' = 'arc'
): MotionPathData {
  return applyMotionPathPreset(p0, pEnd, preset, {
    enabled: true,
    type,
    cp1: { x: (p0.x + pEnd.x) / 2, y: (p0.y + pEnd.y) / 2 },
    autoOrient: false,
    showFrameTicks: true,
  });
}

/**
 * Applies preset curvature shapes to a MotionPathData.
 */
export function applyMotionPathPreset(
  p0: MotionPathPoint,
  pEnd: MotionPathPoint,
  preset: 'arc' | 's-curve' | 'loop' | 'wave' | 'bounce' | 'linear' | 'invert',
  current?: MotionPathData
): MotionPathData {
  const dx = pEnd.x - p0.x;
  const dy = pEnd.y - p0.y;
  const dist = Math.hypot(dx, dy) || 100;
  const midX = (p0.x + pEnd.x) / 2;
  const midY = (p0.y + pEnd.y) / 2;

  // Normal vector perpendicular to trajectory
  const nx = -dy / dist;
  const ny = dx / dist;

  const currentType = preset === 's-curve' || preset === 'wave' || preset === 'loop'
    ? 'cubic'
    : current?.type || 'quadratic';

  let cp1: MotionPathPoint = { x: midX, y: midY };
  let cp2: MotionPathPoint | undefined = undefined;

  switch (preset) {
    case 'arc': {
      // Elegant upward/outward arch
      const offset = dist * 0.35;
      cp1 = {
        x: Math.round(midX + nx * offset),
        y: Math.round(midY + ny * offset),
      };
      if (currentType === 'cubic') {
        cp1 = {
          x: Math.round(p0.x + dx * 0.33 + nx * offset),
          y: Math.round(p0.y + dy * 0.33 + ny * offset),
        };
        cp2 = {
          x: Math.round(p0.x + dx * 0.67 + nx * offset),
          y: Math.round(p0.y + dy * 0.67 + ny * offset),
        };
      }
      break;
    }

    case 's-curve':
    case 'wave': {
      const offset = dist * 0.35;
      cp1 = {
        x: Math.round(p0.x + dx * 0.25 + nx * offset),
        y: Math.round(p0.y + dy * 0.25 + ny * offset),
      };
      cp2 = {
        x: Math.round(p0.x + dx * 0.75 - nx * offset),
        y: Math.round(p0.y + dy * 0.75 - ny * offset),
      };
      break;
    }

    case 'loop': {
      // Loop-the-loop circle above the trajectory
      const offset = dist * 0.65;
      cp1 = {
        x: Math.round(p0.x + dx * 0.8 + nx * offset),
        y: Math.round(p0.y + dy * 0.8 + ny * offset),
      };
      cp2 = {
        x: Math.round(p0.x + dx * 0.2 + nx * offset),
        y: Math.round(p0.y + dy * 0.2 + ny * offset),
      };
      break;
    }

    case 'bounce': {
      // Parabolic gravity bounce
      const offset = dist * 0.45;
      cp1 = {
        x: Math.round(midX + nx * offset),
        y: Math.round(Math.min(p0.y, pEnd.y) - offset),
      };
      if (currentType === 'cubic') {
        cp2 = {
          x: Math.round(p0.x + dx * 0.75),
          y: Math.round(p0.y + dy * 0.75 + ny * (offset * 0.5)),
        };
      }
      break;
    }

    case 'invert': {
      // Inverts current control points relative to straight baseline
      if (current) {
        const invCP = (cp: MotionPathPoint): MotionPathPoint => {
          // Vector from baseline midpoint to CP
          const vx = cp.x - midX;
          const vy = cp.y - midY;
          return {
            x: Math.round(midX - vx),
            y: Math.round(midY - vy),
          };
        };
        cp1 = invCP(current.cp1);
        if (current.cp2) {
          cp2 = invCP(current.cp2);
        }
      }
      break;
    }

    case 'linear':
    default: {
      if (currentType === 'cubic') {
        cp1 = {
          x: Math.round(p0.x + dx * 0.33),
          y: Math.round(p0.y + dy * 0.33),
        };
        cp2 = {
          x: Math.round(p0.x + dx * 0.67),
          y: Math.round(p0.y + dy * 0.67),
        };
      } else {
        cp1 = { x: Math.round(midX), y: Math.round(midY) };
      }
      break;
    }
  }

  return {
    enabled: current?.enabled ?? true,
    type: currentType,
    cp1,
    cp2,
    autoOrient: current?.autoOrient ?? false,
    showFrameTicks: current?.showFrameTicks ?? true,
  };
}

export interface ActiveTweenSegment {
  kfPrev: Keyframe;
  kfNext: Keyframe;
  elPrev: FlashElement;
  elNext: FlashElement;
  span: number;
  t: number;
  motionPath: MotionPathData | null;
}

/**
 * Finds the currently active Motion Tween segment on a layer around the given playhead frame.
 */
export function findActiveMotionTweenSegment(
  layer: Layer | null | undefined,
  currentFrame: number,
  elementId?: string | null
): ActiveTweenSegment | null {
  if (!layer || layer.keyframes.length < 2) return null;

  const sorted = [...layer.keyframes].sort((a, b) => a.frame - b.frame);

  let kfPrev: Keyframe | null = null;
  let kfNext: Keyframe | null = null;

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].frame <= currentFrame) {
      kfPrev = sorted[i];
    } else if (sorted[i].frame > currentFrame && !kfNext) {
      kfNext = sorted[i];
      break;
    }
  }

  // If current frame is beyond all keyframes, or before first keyframe
  if (!kfPrev || !kfNext) {
    // If exact on last keyframe, look at previous segment
    if (kfPrev && !kfNext && sorted.length >= 2) {
      const idx = sorted.findIndex((k) => k.frame === kfPrev?.frame);
      if (idx > 0) {
        kfNext = kfPrev;
        kfPrev = sorted[idx - 1];
      }
    }
  }

  if (!kfPrev || !kfNext) return null;
  if (kfPrev.tweenType !== 'motion') return null;

  // Find target element in both keyframes
  let elPrev = elementId ? kfPrev.elements.find((e) => e.id === elementId) : kfPrev.elements[0];
  let elNext = elementId ? kfNext.elements.find((e) => e.id === elementId) : kfNext.elements[0];

  if (!elPrev && kfPrev.elements.length > 0) elPrev = kfPrev.elements[0];
  if (!elNext && kfNext.elements.length > 0) elNext = kfNext.elements[0];

  if (!elPrev || !elNext) return null;

  const span = Math.max(1, kfNext.frame - kfPrev.frame);
  const rawT = Math.max(0, Math.min(1, (currentFrame - kfPrev.frame) / span));
  const easedT = applyEasing(rawT, kfPrev.easing || 'linear');

  // Check where motionPath is stored: kfPrev.motionPaths[el.id] || kfPrev.motionPath || elPrev.motionPath
  const motionPath =
    (kfPrev.motionPaths && kfPrev.motionPaths[elPrev.id]) ||
    kfPrev.motionPath ||
    elPrev.motionPath ||
    null;

  return {
    kfPrev,
    kfNext,
    elPrev,
    elNext,
    span,
    t: easedT,
    motionPath,
  };
}

/**
 * Samples points along the Bézier curve for each frame in the tween span.
 * Returns point positions and tangent angles for rendering trajectory dots and ticks.
 */
export function sampleMotionPathFrames(
  p0: MotionPathPoint,
  pEnd: MotionPathPoint,
  motionPath: MotionPathData,
  startFrame: number,
  endFrame: number,
  easing: any = 'linear'
): Array<{ x: number; y: number; frame: number; angle: number }> {
  const span = Math.max(1, endFrame - startFrame);
  const samples: Array<{ x: number; y: number; frame: number; angle: number }> = [];

  for (let f = startFrame; f <= endFrame; f++) {
    const rawT = (f - startFrame) / span;
    const easedT = applyEasing(rawT, easing);

    const pt = evaluateBezierPoint(
      p0,
      motionPath.cp1,
      pEnd,
      motionPath.cp2,
      easedT,
      motionPath.type
    );

    const angle = evaluateBezierTangent(
      p0,
      motionPath.cp1,
      pEnd,
      motionPath.cp2,
      easedT,
      motionPath.type
    );

    samples.push({
      x: pt.x,
      y: pt.y,
      frame: f,
      angle,
    });
  }

  return samples;
}
