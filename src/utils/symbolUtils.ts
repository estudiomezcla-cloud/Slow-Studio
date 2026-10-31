import { FlashDocument, FlashElement, FlashSymbol, Layer } from '../types/flash';
import { getLayerElementsAtFrame } from './interpolation';

export interface SymbolInstanceLocation {
  id: string;
  containerType: 'scene' | 'symbol';
  containerId: string;
  containerName: string;
  layerId: string;
  layerName: string;
  frame: number;
  elementId: string;
  elementName: string;
  x: number;
  y: number;
}

export interface SymbolInstanceStats {
  total: number;
  locations: SymbolInstanceLocation[];
}

/**
 * Searches entire FlashDocument (all scenes, layers, keyframes and other symbols)
 * to count and pinpoint every instance of a given symbolId.
 */
export function countSymbolInstancesInDocument(
  doc: FlashDocument,
  symbolId: string
): SymbolInstanceStats {
  const locations: SymbolInstanceLocation[] = [];

  const inspectElement = (
    el: FlashElement,
    containerType: 'scene' | 'symbol',
    containerId: string,
    containerName: string,
    layerId: string,
    layerName: string,
    frame: number
  ) => {
    if (el.type === 'symbolInstance' && el.symbolId === symbolId) {
      locations.push({
        id: `${containerId}_${layerId}_${frame}_${el.id}`,
        containerType,
        containerId,
        containerName,
        layerId,
        layerName,
        frame,
        elementId: el.id,
        elementName: el.name || 'Instancia de Símbolo',
        x: Math.round(el.x),
        y: Math.round(el.y),
      });
    }

    // Check nested elements inside groups
    if (el.type === 'group' && el.children && el.children.length > 0) {
      el.children.forEach((child) =>
        inspectElement(child, containerType, containerId, containerName, layerId, layerName, frame)
      );
    }
  };

  // 1. Inspect all scenes
  doc.scenes.forEach((scene) => {
    scene.layers.forEach((layer) => {
      layer.keyframes.forEach((kf) => {
        kf.elements.forEach((el) => {
          inspectElement(el, 'scene', scene.id, scene.name, layer.id, layer.name, kf.frame);
        });
      });
    });
  });

  // 2. Inspect nested instances inside other symbols
  doc.symbols.forEach((otherSym) => {
    if (otherSym.id === symbolId) return; // avoid self-comparison
    otherSym.layers.forEach((layer) => {
      layer.keyframes.forEach((kf) => {
        kf.elements.forEach((el) => {
          inspectElement(el, 'symbol', otherSym.id, otherSym.name, layer.id, layer.name, kf.frame);
        });
      });
    });
  });

  return {
    total: locations.length,
    locations,
  };
}

/**
 * Renames a symbol in the document library and updates corresponding instance labels.
 */
export function renameSymbolInDocument(
  doc: FlashDocument,
  symbolId: string,
  newName: string
): FlashDocument {
  const trimmed = newName.trim();
  if (!trimmed) return doc;

  const oldSymbol = doc.symbols.find((s) => s.id === symbolId);
  const oldName = oldSymbol?.name || '';

  const newSymbols = doc.symbols.map((sym) =>
    sym.id === symbolId ? { ...sym, name: trimmed } : sym
  );

  const updateElement = (el: FlashElement): FlashElement => {
    if (el.type === 'symbolInstance' && el.symbolId === symbolId) {
      const isDefaultName = !el.name || el.name === oldName || el.name === `Instancia de ${oldName}`;
      return {
        ...el,
        name: isDefaultName ? `Instancia de ${trimmed}` : el.name,
      };
    }
    if (el.type === 'group' && el.children) {
      return {
        ...el,
        children: el.children.map(updateElement),
      };
    }
    return el;
  };

  const newScenes = doc.scenes.map((scene) => ({
    ...scene,
    layers: scene.layers.map((layer) => ({
      ...layer,
      keyframes: layer.keyframes.map((kf) => ({
        ...kf,
        elements: kf.elements.map(updateElement),
      })),
    })),
  }));

  const updatedSymbolsWithInstances = newSymbols.map((sym) => ({
    ...sym,
    layers: sym.layers.map((layer) => ({
      ...layer,
      keyframes: layer.keyframes.map((kf) => ({
        ...kf,
        elements: kf.elements.map(updateElement),
      })),
    })),
  }));

  return {
    ...doc,
    symbols: updatedSymbolsWithInstances,
    scenes: newScenes,
  };
}

/**
 * Safely removes a symbol from document library with choices:
 * - 'cascade': deletes all symbol instances from all scenes/keyframes
 * - 'breakApart': unpacks the symbol's frame 1 elements into raw shapes where instances were
 */
export function deleteSymbolFromDocument(
  doc: FlashDocument,
  symbolId: string,
  mode: 'cascade' | 'breakApart' = 'cascade'
): FlashDocument {
  const targetSymbol = doc.symbols.find((s) => s.id === symbolId);
  const newSymbols = doc.symbols.filter((s) => s.id !== symbolId);

  const cleanElements = (elements: FlashElement[]): FlashElement[] => {
    const result: FlashElement[] = [];

    elements.forEach((el) => {
      if (el.type === 'symbolInstance' && el.symbolId === symbolId) {
        if (mode === 'breakApart' && targetSymbol && targetSymbol.layers.length > 0) {
          // Unpack raw shapes
          const frame1Els = targetSymbol.layers[0]?.keyframes[0]?.elements || [];
          frame1Els.forEach((sub, i) => {
            const unpacked: FlashElement = {
              ...JSON.parse(JSON.stringify(sub)),
              id: `unpacked_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
              x: el.x + (sub.x - (frame1Els[0]?.x || 0)),
              y: el.y + (sub.y - (frame1Els[0]?.y || 0)),
              rotation: (sub.rotation || 0) + (el.rotation || 0),
              opacity: (sub.opacity ?? 1) * (el.opacity ?? 1),
            };
            result.push(unpacked);
          });
        }
        // In cascade mode, skip adding this element
        return;
      }

      if (el.type === 'group' && el.children) {
        result.push({
          ...el,
          children: cleanElements(el.children),
        });
        return;
      }

      result.push(el);
    });

    return result;
  };

  const newScenes = doc.scenes.map((scene) => ({
    ...scene,
    layers: scene.layers.map((layer) => ({
      ...layer,
      keyframes: layer.keyframes.map((kf) => ({
        ...kf,
        elements: cleanElements(kf.elements),
      })),
    })),
  }));

  const cleanedSymbols = newSymbols.map((sym) => ({
    ...sym,
    layers: sym.layers.map((layer) => ({
      ...layer,
      keyframes: layer.keyframes.map((kf) => ({
        ...kf,
        elements: cleanElements(kf.elements),
      })),
    })),
  }));

  return {
    ...doc,
    symbols: cleanedSymbols,
    scenes: newScenes,
  };
}

/**
 * Duplicates a symbol deeply in the library with a new ID.
 */
export function duplicateSymbolInDocument(
  doc: FlashDocument,
  symbolId: string,
  customName?: string
): { updatedDoc: FlashDocument; newSymbol: FlashSymbol | null } {
  const source = doc.symbols.find((s) => s.id === symbolId);
  if (!source) return { updatedDoc: doc, newSymbol: null };

  const newId = `sym_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newName = customName || `${source.name}_copia`;

  // Deep clone layers & keyframes to ensure independent mutations
  const clonedLayers: Layer[] = source.layers.map((l, lIdx) => ({
    ...JSON.parse(JSON.stringify(l)),
    id: `sublayer_${Date.now()}_${lIdx}`,
    keyframes: l.keyframes.map((kf, kIdx) => ({
      ...JSON.parse(JSON.stringify(kf)),
      elements: kf.elements.map((el, eIdx) => ({
        ...JSON.parse(JSON.stringify(el)),
        id: `el_${Date.now()}_${lIdx}_${kIdx}_${eIdx}`,
      })),
    })),
  }));

  const newSymbol: FlashSymbol = {
    ...JSON.parse(JSON.stringify(source)),
    id: newId,
    name: newName,
    layers: clonedLayers,
    totalFrames: source.totalFrames || 24,
  };

  return {
    updatedDoc: {
      ...doc,
      symbols: [...doc.symbols, newSymbol],
    },
    newSymbol,
  };
}

/**
 * Computes the bounding box of a symbol across its layers at a specific frame (or across all frames).
 */
export function calculateSymbolBoundingBox(
  symbol: FlashSymbol,
  frame: number = 1
): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  hasElements: boolean;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let elementCount = 0;

  const processElement = (el: FlashElement) => {
    elementCount++;
    const halfW = (el.width || 40) / 2;
    const halfH = (el.height || 40) / 2;

    const left = el.shapeType === 'circle' || el.shapeType === 'star' ? el.x - halfW : el.x;
    const right = left + (el.width || 40);
    const top = el.shapeType === 'circle' || el.shapeType === 'star' ? el.y - halfH : el.y;
    const bottom = top + (el.height || 40);

    if (left < minX) minX = left;
    if (top < minY) minY = top;
    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;

    if (el.type === 'group' && el.children) {
      el.children.forEach(processElement);
    }
  };

  symbol.layers.forEach((layer) => {
    const els = getLayerElementsAtFrame(layer, frame);
    els.forEach(processElement);
  });

  if (elementCount === 0 || minX === Infinity) {
    return {
      minX: 0,
      minY: 0,
      maxX: 200,
      maxY: 160,
      width: 200,
      height: 160,
      centerX: 100,
      centerY: 80,
      hasElements: false,
    };
  }

  const width = Math.max(20, maxX - minX);
  const height = Math.max(20, maxY - minY);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
    hasElements: true,
  };
}
