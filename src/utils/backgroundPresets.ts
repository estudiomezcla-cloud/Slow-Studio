import { FlashElement } from '../types/flash';

export interface BackgroundPreset {
  id: string;
  name: string;
  category: 'Cinemático' | 'Naturaleza' | 'Retro' | 'Estudio' | 'Técnico';
  description: string;
  thumbnailBg: string;
  tags: string[];
  generateElements: (width: number, height: number) => FlashElement[];
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'sunset',
    name: 'Atardecer Horizonte',
    category: 'Cinemático',
    description: 'Cielo crepuscular con sol brillante, montañas distantes y siluetas en capas.',
    thumbnailBg: 'linear-gradient(180deg, #2e0854 0%, #b91c1c 50%, #f97316 75%, #0f172a 100%)',
    tags: ['Atardecer', 'Sol', 'Montañas', 'Gradiente'],
    generateElements: (width, height) => {
      const elements: FlashElement[] = [];

      // 1. Cielo Base (Sky Backdrop)
      elements.push({
        id: `bg_sky_${Date.now()}_1`,
        name: 'Cielo Atardecer',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#2e0854', // Violeta oscuro crepuscular
        stroke: 'transparent',
        strokeWidth: 0,
      });

      // 2. Banda de luz horizonte (Horizon Glow)
      const glowHeight = Math.round(height * 0.48);
      elements.push({
        id: `bg_glow_${Date.now()}_2`,
        name: 'Resplandor Horizonte',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: Math.round(height * 0.42),
        width,
        height: glowHeight,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.85,
        fill: '#ea580c', // Naranja fuego
        stroke: 'transparent',
        strokeWidth: 0,
        filters: {
          blur: 16,
        },
      });

      // 3. Sol Poniente Gigante con Glow
      const sunSize = Math.round(Math.min(width, height) * 0.28);
      elements.push({
        id: `bg_sun_${Date.now()}_3`,
        name: 'Sol Poniente',
        type: 'shape',
        shapeType: 'circle',
        x: Math.round(width * 0.5),
        y: Math.round(height * 0.52),
        width: sunSize,
        height: sunSize,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#fde047', // Amarillo oro brillante
        stroke: '#f97316',
        strokeWidth: 3,
        filters: {
          dropShadow: {
            enabled: true,
            color: '#f97316',
            blur: 24,
            offsetX: 0,
            offsetY: 0,
          },
        },
      });

      // 4. Montañas Lejanas (Distant peaks)
      const peakY = Math.round(height * 0.55);
      const mPoints: Array<{ x: number; y: number }> = [
        { x: 0, y: height },
        { x: 0, y: peakY + 40 },
        { x: Math.round(width * 0.18), y: peakY - 80 },
        { x: Math.round(width * 0.35), y: peakY + 20 },
        { x: Math.round(width * 0.52), y: peakY - 110 },
        { x: Math.round(width * 0.7), y: peakY + 10 },
        { x: Math.round(width * 0.86), y: peakY - 70 },
        { x: width, y: peakY + 30 },
        { x: width, y: height },
      ];
      elements.push({
        id: `bg_mountains_${Date.now()}_4`,
        name: 'Montañas Silueta',
        type: 'shape',
        shapeType: 'path',
        x: 0,
        y: 0,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.95,
        fill: '#1e1b4b', // Silueta azul noche profundo
        stroke: '#312e81',
        strokeWidth: 1,
        points: mPoints,
      });

      // 5. Suelo del horizonte (Horizon Ground)
      const groundH = Math.round(height * 0.32);
      elements.push({
        id: `bg_ground_${Date.now()}_5`,
        name: 'Suelo Horizonte',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: height - groundH,
        width,
        height: groundH,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#0f172a', // Azul noche oscuro primer plano
        stroke: '#1e293b',
        strokeWidth: 2,
      });

      return elements;
    },
  },

  {
    id: 'night_stars',
    name: 'Cielo Nocturno y Estrellas',
    category: 'Cinemático',
    description: 'Noche cósmica con luna creciente, constelación de estrellas vectoriales y niebla astral.',
    thumbnailBg: 'linear-gradient(180deg, #020617 0%, #0f172a 60%, #1e1b4b 100%)',
    tags: ['Noche', 'Luna', 'Estrellas', 'Cosmos'],
    generateElements: (width, height) => {
      const elements: FlashElement[] = [];

      // 1. Cielo Nocturno Base
      elements.push({
        id: `bg_night_${Date.now()}_1`,
        name: 'Cielo Espacio',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#020617', // Negro azulado profundo
        stroke: 'transparent',
        strokeWidth: 0,
      });

      // 2. Nebulosa suave (Nebula glow)
      elements.push({
        id: `bg_nebula_${Date.now()}_2`,
        name: 'Nebulosa Azul',
        type: 'shape',
        shapeType: 'circle',
        x: Math.round(width * 0.7),
        y: Math.round(height * 0.35),
        width: Math.round(width * 0.65),
        height: Math.round(height * 0.45),
        rotation: -15,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.3,
        fill: '#38bdf8',
        stroke: 'transparent',
        strokeWidth: 0,
        filters: {
          blur: 28,
        },
      });

      // 3. Luna Llena Brillante con Cráteres
      const moonSize = Math.round(Math.min(width, height) * 0.16);
      elements.push({
        id: `bg_moon_${Date.now()}_3`,
        name: 'Luna Brillante',
        type: 'shape',
        shapeType: 'circle',
        x: Math.round(width * 0.8),
        y: Math.round(height * 0.22),
        width: moonSize,
        height: moonSize,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#fef08a', // Luz de luna suave
        stroke: '#fef9c3',
        strokeWidth: 2,
        filters: {
          dropShadow: {
            enabled: true,
            color: '#38bdf8',
            blur: 22,
            offsetX: 0,
            offsetY: 0,
          },
        },
      });

      // 4. Estrellas vectoriales dispersas
      const starSeeds = [
        { x: 0.1, y: 0.12, s: 22, rot: 10 },
        { x: 0.22, y: 0.25, s: 16, rot: 45 },
        { x: 0.34, y: 0.08, s: 26, rot: 0 },
        { x: 0.45, y: 0.28, s: 14, rot: 30 },
        { x: 0.58, y: 0.14, s: 20, rot: 60 },
        { x: 0.68, y: 0.26, s: 18, rot: 15 },
        { x: 0.9, y: 0.38, s: 16, rot: 50 },
        { x: 0.15, y: 0.45, s: 18, rot: 25 },
        { x: 0.38, y: 0.48, s: 14, rot: 40 },
        { x: 0.84, y: 0.08, s: 24, rot: 75 },
      ];

      starSeeds.forEach((st, idx) => {
        elements.push({
          id: `bg_star_${Date.now()}_${idx}`,
          name: `Estrella ${idx + 1}`,
          type: 'shape',
          shapeType: 'star',
          x: Math.round(width * st.x),
          y: Math.round(height * st.y),
          width: st.s,
          height: st.s,
          rotation: st.rot,
          scaleX: 1,
          scaleY: 1,
          opacity: 0.9,
          fill: '#ffffff',
          stroke: '#93c5fd',
          strokeWidth: 1,
          filters: {
            dropShadow: {
              enabled: true,
              color: '#60a5fa',
              blur: 6,
              offsetX: 0,
              offsetY: 0,
            },
          },
        });
      });

      // 5. Suelo Silueta Nocturna
      const groundH = Math.round(height * 0.22);
      elements.push({
        id: `bg_nightground_${Date.now()}_99`,
        name: 'Horizonte Nocturno',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: height - groundH,
        width,
        height: groundH,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#090d16',
        stroke: '#1e293b',
        strokeWidth: 1,
      });

      return elements;
    },
  },

  {
    id: 'synthwave',
    name: 'Cuadrícula Synthwave Neón',
    category: 'Retro',
    description: 'Estilo años 80 retro-futurista con sol magenta, horizonte de neón y perspectiva de cuadrícula.',
    thumbnailBg: 'linear-gradient(180deg, #130026 0%, #3b0764 50%, #090014 100%)',
    tags: ['Synthwave', 'Neón', 'Cyberpunk', '80s', 'Grid'],
    generateElements: (width, height) => {
      const elements: FlashElement[] = [];

      // 1. Cielo Espacio Violeta
      elements.push({
        id: `bg_synth_sky_${Date.now()}_1`,
        name: 'Cielo Synthwave',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#0f021f',
        stroke: 'transparent',
        strokeWidth: 0,
      });

      // 2. Sol Neón con Gradiente Magenta / Ámbar
      const sunRadius = Math.round(Math.min(width, height) * 0.25);
      elements.push({
        id: `bg_synth_sun_${Date.now()}_2`,
        name: 'Sol Neón Ochentero',
        type: 'shape',
        shapeType: 'circle',
        x: Math.round(width * 0.5),
        y: Math.round(height * 0.48),
        width: sunRadius,
        height: sunRadius,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#f43f5e',
        stroke: '#ec4899',
        strokeWidth: 4,
        filters: {
          dropShadow: {
            enabled: true,
            color: '#ec4899',
            blur: 26,
            offsetX: 0,
            offsetY: 0,
          },
        },
      });

      // 3. Suelo de la Cuadrícula
      const horizonY = Math.round(height * 0.52);
      elements.push({
        id: `bg_synth_floor_${Date.now()}_3`,
        name: 'Suelo Neón Base',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: horizonY,
        width,
        height: height - horizonY,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#090014',
        stroke: '#ec4899',
        strokeWidth: 3,
      });

      // 4. Líneas horizontales de perspectiva
      const floorH = height - horizonY;
      const hLines = [0.1, 0.22, 0.38, 0.58, 0.8, 1.0];
      hLines.forEach((frac, idx) => {
        elements.push({
          id: `bg_synth_hline_${Date.now()}_${idx}`,
          name: `Línea Horizonte ${idx + 1}`,
          type: 'shape',
          shapeType: 'rect',
          x: 0,
          y: Math.round(horizonY + floorH * frac) - 1,
          width,
          height: 2,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 0.85,
          fill: '#06b6d4',
          stroke: 'transparent',
          strokeWidth: 0,
          filters: {
            dropShadow: {
              enabled: true,
              color: '#06b6d4',
              blur: 4,
              offsetX: 0,
              offsetY: 0,
            },
          },
        });
      });

      return elements;
    },
  },

  {
    id: 'nature_hills',
    name: 'Colinas Verdes y Cielo',
    category: 'Naturaleza',
    description: 'Paisaje diurno fresco con cielo celeste, nubes suaves y colinas verdes en capas de profundidad.',
    thumbnailBg: 'linear-gradient(180deg, #38bdf8 0%, #7dd3fc 45%, #10b981 60%, #047857 100%)',
    tags: ['Colinas', 'Cielo', 'Nubes', 'Naturaleza', 'Pradera'],
    generateElements: (width, height) => {
      const elements: FlashElement[] = [];

      // 1. Cielo Celeste Radiante
      elements.push({
        id: `bg_nature_sky_${Date.now()}_1`,
        name: 'Cielo Azul',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#38bdf8',
        stroke: 'transparent',
        strokeWidth: 0,
      });

      // 2. Sol Suave
      elements.push({
        id: `bg_nature_sun_${Date.now()}_2`,
        name: 'Sol Matutino',
        type: 'shape',
        shapeType: 'circle',
        x: Math.round(width * 0.18),
        y: Math.round(height * 0.2),
        width: Math.round(Math.min(width, height) * 0.16),
        height: Math.round(Math.min(width, height) * 0.16),
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.95,
        fill: '#fde047',
        stroke: '#fef08a',
        strokeWidth: 2,
        filters: {
          dropShadow: {
            enabled: true,
            color: '#fef08a',
            blur: 16,
            offsetX: 0,
            offsetY: 0,
          },
        },
      });

      // 3. Nube 1
      const cloudW = Math.round(width * 0.22);
      elements.push({
        id: `bg_cloud_${Date.now()}_3`,
        name: 'Nube Vectorial 1',
        type: 'shape',
        shapeType: 'circle',
        x: Math.round(width * 0.65),
        y: Math.round(height * 0.22),
        width: cloudW,
        height: Math.round(cloudW * 0.5),
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.85,
        fill: '#ffffff',
        stroke: 'transparent',
        strokeWidth: 0,
        filters: {
          blur: 1,
        },
      });

      // 4. Colinas Lejanas (Emerald)
      const h1Points = [
        { x: 0, y: height },
        { x: 0, y: Math.round(height * 0.62) },
        { x: Math.round(width * 0.3), y: Math.round(height * 0.52) },
        { x: Math.round(width * 0.7), y: Math.round(height * 0.64) },
        { x: width, y: Math.round(height * 0.56) },
        { x: width, y: height },
      ];
      elements.push({
        id: `bg_hill1_${Date.now()}_4`,
        name: 'Colina Lejana',
        type: 'shape',
        shapeType: 'path',
        x: 0,
        y: 0,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#059669', // Verde esmeralda profundo
        stroke: '#047857',
        strokeWidth: 2,
        points: h1Points,
      });

      // 5. Colina Cercana (Verde Vivo)
      const h2Points = [
        { x: 0, y: height },
        { x: 0, y: Math.round(height * 0.72) },
        { x: Math.round(width * 0.45), y: Math.round(height * 0.66) },
        { x: Math.round(width * 0.85), y: Math.round(height * 0.76) },
        { x: width, y: Math.round(height * 0.72) },
        { x: width, y: height },
      ];
      elements.push({
        id: `bg_hill2_${Date.now()}_5`,
        name: 'Colina Primer Plano',
        type: 'shape',
        shapeType: 'path',
        x: 0,
        y: 0,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#10b981', // Verde brillante
        stroke: '#059669',
        strokeWidth: 3,
        points: h2Points,
      });

      return elements;
    },
  },

  {
    id: 'city_skyline',
    name: 'Metrópolis Nocturna',
    category: 'Cinemático',
    description: 'Skyline urbano crepuscular con rascacielos vectoriales y ventanas iluminadas.',
    thumbnailBg: 'linear-gradient(180deg, #090d16 0%, #1e293b 60%, #020617 100%)',
    tags: ['Ciudad', 'Skyline', 'Rascacielos', 'Urbano'],
    generateElements: (width, height) => {
      const elements: FlashElement[] = [];

      // 1. Cielo Ciudad Crepúsculo
      elements.push({
        id: `bg_city_sky_${Date.now()}_1`,
        name: 'Cielo Urbano',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#0f172a',
        stroke: 'transparent',
        strokeWidth: 0,
      });

      // 2. Luna Ciudad
      elements.push({
        id: `bg_city_moon_${Date.now()}_2`,
        name: 'Luna Urbana',
        type: 'shape',
        shapeType: 'circle',
        x: Math.round(width * 0.82),
        y: Math.round(height * 0.18),
        width: Math.round(Math.min(width, height) * 0.14),
        height: Math.round(Math.min(width, height) * 0.14),
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.9,
        fill: '#e2e8f0',
        stroke: 'transparent',
        strokeWidth: 0,
      });

      // 3. Rascacielos fondo (Edificios lejanos)
      const bHeights = [0.45, 0.55, 0.42, 0.6, 0.48, 0.58, 0.38, 0.52];
      const bWidth = Math.round(width / bHeights.length);

      bHeights.forEach((hFrac, i) => {
        const bH = Math.round(height * hFrac);
        elements.push({
          id: `bg_bldg_${Date.now()}_${i}`,
          name: `Edificio ${i + 1}`,
          type: 'shape',
          shapeType: 'rect',
          x: i * bWidth,
          y: height - bH,
          width: bWidth,
          height: bH,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          fill: i % 2 === 0 ? '#1e293b' : '#111827',
          stroke: '#334155',
          strokeWidth: 1,
        });

        // Ventana iluminada decorativa
        elements.push({
          id: `bg_win_${Date.now()}_${i}`,
          name: `Ventana ${i + 1}`,
          type: 'shape',
          shapeType: 'rect',
          x: i * bWidth + Math.round(bWidth * 0.3),
          y: height - bH + 30,
          width: Math.round(bWidth * 0.4),
          height: Math.round(bH * 0.25),
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 0.7,
          fill: i % 3 === 0 ? '#fef08a' : '#38bdf8',
          stroke: 'transparent',
          strokeWidth: 0,
        });
      });

      // 4. Calle / Suelo
      const roadH = Math.round(height * 0.14);
      elements.push({
        id: `bg_road_${Date.now()}_99`,
        name: 'Carretera Suelo',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: height - roadH,
        width,
        height: roadH,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#020617',
        stroke: '#475569',
        strokeWidth: 2,
      });

      return elements;
    },
  },

  {
    id: 'studio_minimal',
    name: 'Estudio Fotográfico Minimal',
    category: 'Estudio',
    description: 'Escenario de estudio fotográfico suave con curva de ciclorama y elipse de sombra base.',
    thumbnailBg: 'linear-gradient(180deg, #18181b 0%, #27272a 60%, #09090b 100%)',
    tags: ['Estudio', 'Minimal', 'Sombra', 'Fotografía', 'Ciclorama'],
    generateElements: (width, height) => {
      const elements: FlashElement[] = [];

      // 1. Pared de Fondo Estudio
      elements.push({
        id: `bg_studio_wall_${Date.now()}_1`,
        name: 'Pared de Estudio',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#18181b', // Zinc oscuro suave
        stroke: 'transparent',
        strokeWidth: 0,
      });

      // 2. Foco / Resplandor Ambiental Central
      elements.push({
        id: `bg_studio_spot_${Date.now()}_2`,
        name: 'Spotlight Ambiental',
        type: 'shape',
        shapeType: 'circle',
        x: Math.round(width * 0.5),
        y: Math.round(height * 0.42),
        width: Math.round(width * 0.7),
        height: Math.round(height * 0.5),
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.18,
        fill: '#2dd4bf', // Suave tinte verde agua slow studio
        stroke: 'transparent',
        strokeWidth: 0,
        filters: {
          blur: 30,
        },
      });

      // 3. Suelo Ciclorama con Curva
      const floorH = Math.round(height * 0.35);
      elements.push({
        id: `bg_studio_floor_${Date.now()}_3`,
        name: 'Suelo Ciclorama',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: height - floorH,
        width,
        height: floorH,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#121215',
        stroke: '#27272a',
        strokeWidth: 1,
      });

      // 4. Elipse de Sombra Suelo
      elements.push({
        id: `bg_studio_shadow_${Date.now()}_4`,
        name: 'Sombra de Tarima',
        type: 'shape',
        shapeType: 'circle',
        x: Math.round(width * 0.5),
        y: Math.round(height * 0.8),
        width: Math.round(width * 0.6),
        height: Math.round(height * 0.12),
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.45,
        fill: '#000000',
        stroke: 'transparent',
        strokeWidth: 0,
        filters: {
          blur: 14,
        },
      });

      return elements;
    },
  },

  {
    id: 'blueprint_technical',
    name: 'Cuadrícula Blueprint Técnica',
    category: 'Técnico',
    description: 'Fondo de dibujo técnico arquitectónico azul marino con líneas guía de precisión.',
    thumbnailBg: 'linear-gradient(180deg, #072b4a 0%, #031c33 100%)',
    tags: ['Blueprint', 'Técnico', 'Cuadrícula', 'Arquitectura'],
    generateElements: (width, height) => {
      const elements: FlashElement[] = [];

      // 1. Fondo Azul Blueprint
      elements.push({
        id: `bg_bp_base_${Date.now()}_1`,
        name: 'Fondo Blueprint',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#082f49', // Azul cian profundo
        stroke: 'transparent',
        strokeWidth: 0,
      });

      // 2. Marco perimetral técnico
      const margin = 40;
      elements.push({
        id: `bg_bp_border_${Date.now()}_2`,
        name: 'Margen Técnico',
        type: 'shape',
        shapeType: 'rect',
        x: margin,
        y: margin,
        width: width - margin * 2,
        height: height - margin * 2,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.7,
        fill: 'transparent',
        stroke: '#38bdf8',
        strokeWidth: 2,
      });

      // 3. Ejes de coordenadas centrales
      elements.push({
        id: `bg_bp_axis_x_${Date.now()}_3`,
        name: 'Eje X Central',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: Math.round(height / 2) - 1,
        width,
        height: 2,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.4,
        fill: '#0ea5e9',
        stroke: 'transparent',
        strokeWidth: 0,
      });

      elements.push({
        id: `bg_bp_axis_y_${Date.now()}_4`,
        name: 'Eje Y Central',
        type: 'shape',
        shapeType: 'rect',
        x: Math.round(width / 2) - 1,
        y: 0,
        width: 2,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.4,
        fill: '#0ea5e9',
        stroke: 'transparent',
        strokeWidth: 0,
      });

      // 4. Marca de origen circular
      elements.push({
        id: `bg_bp_origin_${Date.now()}_5`,
        name: 'Marca de Origen',
        type: 'shape',
        shapeType: 'circle',
        x: Math.round(width / 2),
        y: Math.round(height / 2),
        width: 60,
        height: 60,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.6,
        fill: 'transparent',
        stroke: '#38bdf8',
        strokeWidth: 2,
      });

      return elements;
    },
  },

  {
    id: 'pastel_dawn',
    name: 'Amanecer Pastel Suave',
    category: 'Cinemático',
    description: 'Tonos pasteles matutinos suaves degradados con paleta de lavanda, durazno y menta.',
    thumbnailBg: 'linear-gradient(180deg, #fbcfe8 0%, #fed7aa 50%, #bbf7d0 100%)',
    tags: ['Amanecer', 'Pastel', 'Suave', 'Rosa', 'Durazno'],
    generateElements: (width, height) => {
      const elements: FlashElement[] = [];

      elements.push({
        id: `bg_pastel_sky_${Date.now()}_1`,
        name: 'Cielo Pastel Rosa',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#fce7f3', // Rosa pastel
        stroke: 'transparent',
        strokeWidth: 0,
      });

      elements.push({
        id: `bg_pastel_glow_${Date.now()}_2`,
        name: 'Resplandor Durazno',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: Math.round(height * 0.38),
        width,
        height: Math.round(height * 0.4),
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.7,
        fill: '#ffedd5', // Durazno cálido
        stroke: 'transparent',
        strokeWidth: 0,
        filters: {
          blur: 20,
        },
      });

      elements.push({
        id: `bg_pastel_floor_${Date.now()}_3`,
        name: 'Suelo Menta Pastel',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: Math.round(height * 0.68),
        width,
        height: Math.round(height * 0.32),
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.9,
        fill: '#dcfce7', // Menta verde pastel suave
        stroke: '#bbf7d0',
        strokeWidth: 2,
      });

      return elements;
    },
  },
];

export function getBackgroundPresetById(id: string): BackgroundPreset | undefined {
  return BACKGROUND_PRESETS.find((p) => p.id === id);
}

export function generateBackgroundElements(presetId: string, width: number, height: number): FlashElement[] {
  const preset = getBackgroundPresetById(presetId);
  if (!preset) {
    // Default fallback simple colored rectangle
    return [
      {
        id: `bg_custom_${Date.now()}`,
        name: 'Fondo Sólido',
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        fill: '#0f172a',
        stroke: 'transparent',
        strokeWidth: 0,
      },
    ];
  }
  return preset.generateElements(width, height);
}
