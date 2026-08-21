import Konva from 'konva';

export function noop() {}

export function createFnWrapper(fn) {
  return (...args) => fn && fn(...args);
}

export function colorToHex(color) {
  if (!color) return 'ffffff';
  color = String(color).trim();

  if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/);
    if (match) {
      const r = Math.max(0, Math.min(255, Number(match[1])));
      const g = Math.max(0, Math.min(255, Number(match[2])));
      const b = Math.max(0, Math.min(255, Number(match[3])));
      return `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }

  if (color.startsWith('#')) {
    color = color.substring(1);
  }

  if (color.length === 3) {
    color = color
      .split('')
      .map(c => c + c)
      .join('');
  }

  if (color.length >= 6) {
    return color.substring(0, 6);
  }

  return 'ffffff';
}

export const hexToRgba = colorToHex;

export function getDrawBox(x1, y1, x2, y2) {
  return {
    left: Math.min(x1, x2),
    top: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

export function resolveStage(val) {
  if (!val) return null;

  if (typeof val.getStage === 'function') {
    return val.getStage();
  }

  if (val.value && typeof val.value.getStage === 'function') {
    return val.value.getStage();
  }

  if (val instanceof Konva.Stage) {
    return val;
  }

  return null;
}

export function resolveLayer(stageInstance) {
  if (!stageInstance) return null;

  if (typeof stageInstance.getLayers === 'function') {
    const layers = stageInstance.getLayers();
    if (layers.length > 0) return layers[layers.length - 1];
  }

  return stageInstance.children?.[stageInstance.children.length - 1] || null;
}

export function getPointerPosition(stage) {
  if (!stage) return null;
  const pointer = stage.getPointerPosition();
  if (!pointer) return null;
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  return transform.point(pointer);
}

export function isCanvasElementTarget(target, stage, extraNames = []) {
  if (!target || !stage) return false;
  const names = ['canvas-element', 'shape', 'barcode', ...extraNames];
  let current = target;
  while (current && current !== stage) {
    for (const name of names) {
      if (current.hasName?.(name)) {
        return true;
      }
    }
    current = current.getParent?.();
  }
  return false;
}

export function isDeleteKey(e) {
  const key = e.key;
  if (key !== 'Delete' && key !== 'Backspace') return false;
  const tag = (e.target?.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return false;
  return true;
}

export function getShapeClientBox(shape) {
  if (!shape) {
    return { width: 0, height: 0 };
  }
  return shape.getClientRect({
    skipTransform: false,
  });
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function createRafThrottler() {
  let rafId = null;
  return function requestLayerDraw(layer) {
    if (!layer) return;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      layer.batchDraw();
      rafId = null;
    });
  };
}

export function destroyKonvaNode(node) {
  if (node && typeof node.destroy === 'function') {
    node.destroy();
  }
  return null;
}

export function cancelRaf(rafId) {
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  return null;
}

export function unbindStageEvents(stage, namespace) {
  if (!stage || !namespace) return;
  stage.off(namespace);
}

export function uid(prefix = '') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = deepClone(obj[key]);
    }
  }
  return result;
}
