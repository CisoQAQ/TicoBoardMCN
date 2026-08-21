<template />

<script setup>
import { shallowRef, watch, onUnmounted } from 'vue';
import { useToolStore } from '../store/tool';
import Konva from 'konva';

const props = defineProps({
  stageRef: {
    type: Object,
    required: true,
  },
});

const toolStore = useToolStore();

let stage = null;
let layer = null;

const isDrawing = shallowRef(false);
const currentShape = shallowRef(null);

let startX = 0;
let startY = 0;

let transformer = null;
let measureLabel = null;
let rafId = null;

let radiusAnchor = null;
let radiusBadge = null;
let _radiusDragging = false;
let _radiusShape = null;

const EVENT_NS = '.shapeDraw';

const MIN_SIZE = 4;

/**
 * 配置面板里的 shapeConfig.type 到真实绘制类型的映射
 */
const TOOL_MAP = {
  rect: 'rect',
  rectangle: 'rect',
  square: 'square',
  triangle: 'triangle',
  rhombus: 'rhombus',
  pentagon: 'pentagon',
  hexagon: 'hexagon',
  circle: 'circle',
  line: 'line',
  'line-or': 'line',
};

watch(
  () => props.stageRef,
  val => {
    const nextStage = resolveStage(val);

    if (!nextStage) return;

    if (stage && stage !== nextStage) {
      unbindEvents();
    }

    stage = nextStage;
    layer = resolveLayer(stage);

    if (!layer) {
      console.warn('[ShapeDraw] 未找到 Konva Layer');
      return;
    }

    initTransformer();
    initMeasureLabel();
    bindEvents();

    stage.on('selectionChange', onSelectionChange);
  },
  {
    immediate: true,
  }
);

function resolveStage(val) {
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

function resolveLayer(stageInstance) {
  if (!stageInstance) return null;

  if (typeof stageInstance.getLayers === 'function') {
    const layers = stageInstance.getLayers();

    /**
     * 建议使用最后一个 layer。
     * 如果第一个 layer 是网格背景层，图形加到第一个 layer 会被背景逻辑影响。
     */
    if (layers.length > 0) return layers[layers.length - 1];
  }

  return stageInstance.children?.[stageInstance.children.length - 1] || null;
}

/**
 * 当前是否是图形绘制模式
 *
 * 注意：
 * activeTool 现在只表示主工具。
 * 图形主工具统一是 rectangle。
 */
function isShapeTool() {
  return toolStore.activeTool === 'rectangle';
}

/**
 * 当前实际绘制的图形类型
 *
 * 例如：
 * toolStore.shapeConfig.type = 'triangle'
 * 返回 'triangle'
 */
function getActiveShapeType() {
  const shapeType = (toolStore.shapeConfig?.type || 'rectangle').toLowerCase();

  return TOOL_MAP[shapeType] || 'rect';
}

/**
 * 从右侧配置面板读取默认绘制样式
 */
function getShapeStyleConfig() {
  const config = toolStore.shapeConfig || {};

  return {
    fill: config.fillColor || '#ffffff',
    stroke: config.strokeColor || '#298fff',
    strokeWidth: Number(config.strokeWidth || 2),
    opacity: Number(config.opacity ?? 1),
  };
}

function bindEvents() {
  if (!stage) return;

  unbindEvents();

  stage.on(`mousedown${EVENT_NS}`, onMouseDown);
  stage.on(`mousemove${EVENT_NS}`, onMouseMove);
  stage.on(`mouseup${EVENT_NS}`, onMouseUp);
  stage.on(`mouseleave${EVENT_NS}`, onMouseUp);

  window.addEventListener('keydown', handleKeyDown);
}

function unbindEvents() {
  if (!stage) return;
  stage.off(EVENT_NS);
  window.removeEventListener('keydown', handleKeyDown);
}

function initTransformer() {
  if (transformer) return;

  transformer = new Konva.Transformer({
    borderStroke: '#4285f4',
    borderStrokeWidth: 1,
    anchorStroke: '#fff',
    anchorFill: '#4285f4',
    anchorSize: 8,
    rotateEnabled: true,
    rotateAnchorOffset: 30,
    ignoreStroke: false,
  });

  layer.add(transformer);
}

function initMeasureLabel() {
  if (measureLabel) return;

  measureLabel = new Konva.Text({
    text: '',
    fontSize: 14,
    fill: '#333',
    padding: 4,
    visible: false,
    listening: false,
  });

  layer.add(measureLabel);
}

function handleKeyDown(e) {
  const key = e.key;
  if (key !== 'Delete' && key !== 'Backspace') return;

  const tag = (e.target?.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
  if (!transformer) return;
  const nodes = transformer.nodes();
  if (!nodes || nodes.length === 0) return;
  nodes.forEach(node => node.destroy());
  transformer.nodes([]);
  stage.fire('selectionChange', { node: null });
  requestLayerDraw();
}

/**
 * 获取画布世界坐标。
 * 支持 stage 缩放、平移后的准确坐标。
 */
function getPointerPosition() {
  if (!stage) return null;
  const pointer = stage.getPointerPosition();
  if (!pointer) return null;
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  return transform.point(pointer);
}

/**
 * 判断是否点到了已有画布元素。
 * 防止在已有图形上再次开始绘制。
 */
function isCanvasElementTarget(target) {
  if (!target || !stage) return false;
  let current = target;
  while (current && current !== stage) {
    if (current.hasName?.('canvas-element')) {
      return true;
    }
    if (current.hasName?.('shape')) {
      return true;
    }
    current = current.getParent?.();
  }

  return false;
}

function onMouseDown(e) {
  if (!isShapeTool()) return;

  // 点到已有元素，不创建新图形
  if (isCanvasElementTarget(e.target)) return;

  // 只允许从空白画布开始绘制
  if (e.target !== stage) return;

  const pos = getPointerPosition();
  if (!pos) return;

  isDrawing.value = true;

  startX = pos.x;
  startY = pos.y;

  const shapeType = getActiveShapeType();

  currentShape.value = createShape(shapeType, startX, startY);

  if (!currentShape.value) return;

  clearSelection();

  layer.add(currentShape.value);

  if (measureLabel) {
    measureLabel.visible(false);
    measureLabel.moveToTop();
  }

  if (transformer) {
    transformer.moveToTop();
  }

  requestLayerDraw();
}

function onMouseMove() {
  if (!isDrawing.value || !currentShape.value) return;

  const pos = getPointerPosition();
  if (!pos) return;

  const shapeType = getActiveShapeType();
  const box = getDrawBox(startX, startY, pos.x, pos.y);

  updateShape(currentShape.value, shapeType, box);
  updateMeasureLabel(shapeType, box);

  requestLayerDraw();
}

function onMouseUp() {
  if (!isDrawing.value) return;
  isDrawing.value = false;
  if (!currentShape.value) {
    hideMeasureLabel();
    return;
  }
  const shape = currentShape.value;
  const box = getShapeClientBox(shape);
  hideMeasureLabel();
  if (box.width < MIN_SIZE && box.height < MIN_SIZE) {
    shape.destroy();
    currentShape.value = null;
    requestLayerDraw();
    return;
  }
  shape.draggable(toolStore.activeTool === 'select');
  shape.name('shape canvas-element');
  bindShapeEvents(shape);
  if (toolStore.activeTool === 'select') selectShape(shape);
  else clearSelection();
  currentShape.value = null;
  requestLayerDraw();
}

function createShape(type, x, y) {
  const styleConfig = getShapeStyleConfig();
  const baseConfig = {
    x,
    y,
    fill: styleConfig.fill,
    stroke: styleConfig.stroke,
    strokeWidth: styleConfig.strokeWidth,
    opacity: styleConfig.opacity,
    name: 'shape canvas-element',
    draggable: false,
  };

  switch (type) {
    case 'circle':
      return new Konva.Circle({
        ...baseConfig,
        radius: 0,
      });

    case 'triangle':
      return new Konva.RegularPolygon({
        ...baseConfig,
        sides: 3,
        radius: 0,
      });

    case 'pentagon':
      return new Konva.RegularPolygon({
        ...baseConfig,
        sides: 5,
        radius: 0,
      });

    case 'hexagon':
      return new Konva.RegularPolygon({
        ...baseConfig,
        sides: 6,
        radius: 0,
      });

    case 'rhombus':
      return new Konva.Line({
        points: [x, y, x, y, x, y, x, y],
        closed: true,
        fill: styleConfig.fill,
        stroke: styleConfig.stroke,
        strokeWidth: styleConfig.strokeWidth,
        opacity: styleConfig.opacity,
        name: 'shape canvas-element',
        draggable: false,
      });

    case 'line':
      return new Konva.Line({
        points: [x, y, x, y],
        stroke: styleConfig.stroke,
        strokeWidth: styleConfig.strokeWidth,
        opacity: styleConfig.opacity,
        lineCap: 'round',
        lineJoin: 'round',
        name: 'shape canvas-element',
        draggable: false,
      });

    case 'square':
      return new Konva.Rect({
        ...baseConfig,
        width: 0,
        height: 0,
        cornerRadius: 0,
      });

    case 'rect':
    default:
      return new Konva.Rect({
        ...baseConfig,
        width: 0,
        height: 0,
        cornerRadius: 0,
      });
  }
}

function updateShape(shape, type, box) {
  switch (type) {
    case 'circle': {
      const size = Math.max(box.width, box.height);

      shape.x(box.left + size / 2);
      shape.y(box.top + size / 2);
      shape.radius(size / 2);

      break;
    }

    case 'triangle':
    case 'pentagon':
    case 'hexagon': {
      const size = Math.max(box.width, box.height);

      shape.x(box.left + size / 2);
      shape.y(box.top + size / 2);
      shape.radius(size / 2);

      break;
    }

    case 'rhombus': {
      const centerX = box.left + box.width / 2;
      const centerY = box.top + box.height / 2;

      shape.points([centerX, box.top, box.left + box.width, centerY, centerX, box.top + box.height, box.left, centerY]);

      break;
    }

    case 'line': {
      const endX = startX <= box.left ? box.left + box.width : box.left;
      const endY = startY <= box.top ? box.top + box.height : box.top;

      shape.points([startX, startY, endX, endY]);

      break;
    }

    case 'square': {
      const size = Math.max(box.width, box.height);
      const maxR = Math.floor(size / 2);
      const prevR = Number(shape.cornerRadius?.() || 0);

      shape.x(box.left);
      shape.y(box.top);
      shape.width(size);
      shape.height(size);
      shape.cornerRadius(Math.min(prevR, maxR));

      break;
    }

    case 'rect':
    default: {
      const prevR = Number(shape.cornerRadius?.() || 0);
      const maxR = Math.floor(Math.min(box.width, box.height) / 2);

      shape.x(box.left);
      shape.y(box.top);
      shape.width(box.width);
      shape.height(box.height);
      shape.cornerRadius(Math.min(prevR, maxR));

      break;
    }
  }
}

function isRectShape(shape) {
  return shape && shape.getClassName && shape.getClassName() === 'Rect';
}

function destroyRadiusAnchor() {
  if (radiusAnchor) {
    radiusAnchor.off('.radiusCtrl');
    radiusAnchor.remove();
    radiusAnchor.destroy();
    radiusAnchor = null;
  }
  if (radiusBadge) {
    radiusBadge.remove();
    radiusBadge.destroy();
    radiusBadge = null;
  }
  _radiusShape = null;
  _radiusDragging = false;
}

function ensureRadiusAnchor() {
  if (!layer) return null;
  if (!radiusAnchor) {
    const outerCircle = new Konva.Circle({
      x: 0,
      y: 0,
      radius: 10,
      fill: 'transparent',
      stroke: '#4285f4',
      strokeWidth: 1.2,
    });
    const innerCircle = new Konva.Circle({
      x: 0,
      y: 0,
      radius: 5,
      fill: '#4285f4',
      stroke: '#ffffff',
      strokeWidth: 2,
    });
    radiusAnchor = new Konva.Group({
      x: 0,
      y: 0,
      name: '__radius_anchor__',
      draggable: true,
    });
    radiusAnchor.add(outerCircle);
    radiusAnchor.add(innerCircle);
    layer.add(radiusAnchor);

    radiusBadge = new Konva.Label({
      x: 0,
      y: 0,
      listening: false,
      opacity: 0,
      name: '__radius_badge__',
    });
    radiusBadge.add(
      new Konva.Tag({
        fill: '#298fff',
        cornerRadius: 10,
        lineJoin: 'round',
      })
    );
    const badgeText = new Konva.Text({
      text: '0',
      fontSize: 13,
      fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fill: '#ffffff',
      padding: 10,
      align: 'center',
    });
    radiusBadge.add(badgeText);
    layer.add(radiusBadge);

    const showBadge = () => {
      if (!radiusBadge) return;
      radiusBadge.stop && radiusBadge.stop();
      radiusBadge.opacity(1);
    };
    const hideBadge = () => {
      if (!radiusBadge) return;
      radiusBadge.stop && radiusBadge.stop();
      radiusBadge.to({
        opacity: 0,
        duration: 0.2,
      });
    };

    radiusAnchor.on('mousedown.radiusCtrl touchstart.radiusCtrl', e => {
      _radiusDragging = true;
      e.cancelBubble = true;
      showBadge();
    });
    radiusAnchor.on('dragmove.radiusCtrl', e => {
      if (!_radiusShape) return;
      e.cancelBubble = true;
      applyRadiusFromAnchor();
    });
    radiusAnchor.on('mouseenter.radiusCtrl', () => {
      showBadge();
    });
    radiusAnchor.on('mouseleave.radiusCtrl', () => {
      if (!_radiusDragging) hideBadge();
    });
    const onEnd = () => {
      if (_radiusDragging) {
        _radiusDragging = false;
        setTimeout(hideBadge, 250);
      }
    };
    radiusAnchor.on('dragend.radiusCtx mouseup.radiusCtx touchend.radiusCtx', onEnd);
  }
  return radiusAnchor;
}

function getRectWorldBox(shape) {
  if (!shape) return null;
  const w = Math.max(0, Number(shape.width?.() || 0));
  const h = Math.max(0, Number(shape.height?.() || 0));
  const abs = shape.getAbsoluteTransform();
  const tl = abs.point({ x: Number(shape.x?.() || 0), y: Number(shape.y?.() || 0) });
  return {
    left: tl.x,
    top: tl.y,
    right: tl.x + w,
    bottom: tl.y + h,
    width: w,
    height: h,
  };
}

function relayoutRadiusAnchor() {
  const shape = _radiusShape;
  if (!shape || !layer) {
    destroyRadiusAnchor();
    return;
  }
  ensureRadiusAnchor();
  const anchor = radiusAnchor;
  const badge = radiusBadge;
  if (!anchor || !badge) return;
  const box = getRectWorldBox(shape);
  if (!box) return;
  const r = Number(shape.cornerRadius?.() || 0);
  const maxR = Math.max(0, Math.floor(Math.min(box.width, box.height) / 2));
  const safeR = Math.min(Math.max(0, r), maxR);

  const anchorX = box.left + safeR + Math.max(6, Math.floor(Math.min(box.width, box.height) * 0.04));
  const anchorY = box.top + Math.max(0, safeR);

  anchor.x(anchorX);
  anchor.y(anchorY);
  anchor.moveToTop();

  const badgeText = badge.getText?.();
  if (badgeText) badgeText.text(`${Math.round(safeR)}`);
  const bw = badge.getWidth ? badge.getWidth() : 40;
  badge.x(anchorX - Math.floor(bw / 2));
  badge.y(anchorY + 22);
  badge.moveToTop();
}

function applyRadiusFromAnchor() {
  const shape = _radiusShape;
  const anchor = radiusAnchor;
  const badge = radiusBadge;
  if (!shape || !anchor || !layer) return;
  const box = getRectWorldBox(shape);
  if (!box) return;
  const maxR = Math.max(0, Math.floor(Math.min(box.width, box.height) / 2));

  let r = anchor.y() - box.top;
  if (r < 0) r = 0;
  if (r > maxR) r = maxR;
  r = Math.round(r);

  shape.cornerRadius(r);
  if (badge) {
    const badgeText = badge.getText?.();
    if (badgeText) badgeText.text(`${r}`);
    const bw = badge.getWidth ? badge.getWidth() : 40;
    badge.x(anchor.x() - Math.floor(bw / 2));
    badge.y(anchor.y() + 22);
  }
  requestLayerDraw();
}

function bindShapeEvents(shape) {
  if (!shape) return;

  shape.on('mousedown tap', e => {
    e.cancelBubble = true;
    selectShape(shape);
  });

  shape.on('dragstart dragmove dragend', e => {
    e.cancelBubble = true;
    if (e.type === 'dragstart') {
      stage.fire('toolbarVisibleChange', { visible: false });
      destroyRadiusAnchor();
    } else if (e.type === 'dragmove') {
      if (_radiusShape === shape && isRectShape(shape)) {
        relayoutRadiusAnchor();
      }
    } else if (e.type === 'dragend') {
      stage.fire('toolbarVisibleChange', { visible: true });
      if (_radiusShape === shape && isRectShape(shape)) {
        relayoutRadiusAnchor();
      }
    }
  });

  shape.on('transformstart transform transformend', e => {
    e.cancelBubble = true;
    if (e.type === 'transformstart') {
      stage.fire('toolbarVisibleChange', { visible: false });
      destroyRadiusAnchor();
    } else if (e.type === 'transformend') {
      stage.fire('toolbarVisibleChange', { visible: true });
      if (isRectShape(shape)) {
        const w = Math.max(0, Number(shape.width?.() || 0));
        const h = Math.max(0, Number(shape.height?.() || 0));
        const maxR = Math.floor(Math.min(w, h) / 2);
        const prevR = Number(shape.cornerRadius?.() || 0);
        shape.cornerRadius(Math.max(0, Math.min(prevR, maxR)));
        if (transformer && transformer.nodes().indexOf(shape) >= 0) {
          _radiusShape = shape;
          relayoutRadiusAnchor();
        }
      }
    }
  });

  shape.on('destroy', () => {
    if (_radiusShape === shape) {
      destroyRadiusAnchor();
    }
  });
}

function getDrawBox(x1, y1, x2, y2) {
  return {
    left: Math.min(x1, x2),
    top: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

function updateMeasureLabel(type, box) {
  if (!measureLabel) return;

  const width = Math.round(box.width);
  const height = Math.round(box.height);

  if (type === 'line') {
    const length = Math.round(Math.sqrt(width * width + height * height));
    measureLabel.text(`${length}`);
  } else {
    measureLabel.text(`${width} × ${height}`);
  }

  measureLabel.x(box.left + box.width / 2 - measureLabel.width() / 2);
  measureLabel.y(box.top + box.height + 8);
  measureLabel.visible(true);
  measureLabel.moveToTop();
}

function hideMeasureLabel() {
  if (!measureLabel) return;

  measureLabel.visible(false);
  measureLabel.text('');
}

function selectShape(shape) {
  if (!transformer || !shape) return;

  transformer.nodes([shape]);
  transformer.moveToTop();

  if (isRectShape(shape)) {
    _radiusShape = shape;
    relayoutRadiusAnchor();
  } else {
    _radiusShape = null;
    destroyRadiusAnchor();
  }

  stage.fire('selectionChange', { node: shape });
  requestLayerDraw();
}

function clearSelection() {
  if (!transformer) return;

  transformer.nodes([]);
  _radiusShape = null;
  destroyRadiusAnchor();
  stage.fire('selectionChange', { node: null });
}

function onSelectionChange(e) {
  if (!e || !e.node) {
    if (transformer && transformer.nodes().length > 0) {
      transformer.nodes([]);
    }
    _radiusShape = null;
    destroyRadiusAnchor();
    requestLayerDraw();
    return;
  }
  const node = e.node;
  if (transformer && transformer.nodes().indexOf(node) < 0) {
    transformer.nodes([node]);
  }
  if (isRectShape(node)) {
    _radiusShape = node;
    relayoutRadiusAnchor();
  } else {
    _radiusShape = null;
    destroyRadiusAnchor();
  }
  requestLayerDraw();
}

function getShapeClientBox(shape) {
  if (!shape) {
    return {
      width: 0,
      height: 0,
    };
  }

  return shape.getClientRect({
    skipTransform: false,
  });
}

function requestLayerDraw() {
  if (!layer) return;

  if (rafId) return;

  rafId = requestAnimationFrame(() => {
    layer.batchDraw();
    rafId = null;
  });
}

onUnmounted(() => {
  unbindEvents();

  if (stage) {
    stage.off('selectionChange', onSelectionChange);
  }

  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (measureLabel) {
    measureLabel.destroy();
    measureLabel = null;
  }

  destroyRadiusAnchor();

  if (transformer) {
    transformer.destroy();
    transformer = null;
  }

  if (currentShape.value) {
    currentShape.value.destroy();
    currentShape.value = null;
  }

  stage = null;
  layer = null;
});
</script>
