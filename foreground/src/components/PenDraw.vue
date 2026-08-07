<template>
  <div style="display: none"></div>
</template>

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
let rafId = null;

const isDrawing = shallowRef(false);
const currentLine = shallowRef(null);

const EVENT_NS = '.penDraw';
const MIN_POINT_COUNT = 4;

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
      console.warn('[PenDraw] Layer not found');
      return;
    }

    bindEvents();
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

    if (layers.length > 0) {
      return layers[layers.length - 1];
    }
  }

  const children = stageInstance.children || [];

  if (children.length > 0) {
    return children[children.length - 1];
  }

  return null;
}

function bindEvents() {
  if (!stage) return;

  unbindEvents();

  stage.on(`mousedown${EVENT_NS} touchstart${EVENT_NS}`, onPointerDown);
  stage.on(`mousemove${EVENT_NS} touchmove${EVENT_NS}`, onPointerMove);
  stage.on(`mouseup${EVENT_NS} touchend${EVENT_NS}`, onPointerUp);
  stage.on(`mouseleave${EVENT_NS}`, onPointerUp);
}

function unbindEvents() {
  if (!stage) return;

  stage.off(EVENT_NS);
}

function isPenTool() {
  return toolStore.activeTool === 'pen';
}

function getPointerPosition() {
  if (!stage) return null;

  const pointer = stage.getPointerPosition();

  if (!pointer) return null;

  const transform = stage.getAbsoluteTransform().copy();

  transform.invert();

  return transform.point(pointer);
}

function getPenStyleConfig() {
  const config = toolStore.penConfig || {};
  const type = config.type || 'pen';
  const isEraser = type === 'eraser';

  return {
    type,
    isEraser,
    stroke: config.strokeColor || '#2fb35a',
    strokeWidth: Number(config.strokeWidth || 6),
    opacity: Number(config.opacity ?? 1),
    lineCap: config.lineCap || 'round',
    lineJoin: config.lineJoin || 'round',
    tension: Number(config.tension ?? 0.45),
    dash: Array.isArray(config.dash) ? config.dash : [],
  };
}

function onPointerDown(e) {
  if (!isPenTool()) return;

  const pos = getPointerPosition();

  if (!pos) return;

  e.cancelBubble = true;

  const styleConfig = getPenStyleConfig();

  isDrawing.value = true;

  if (styleConfig.isEraser) {
    eraseHitLines(pos, styleConfig.strokeWidth);
    requestLayerDraw();
    return;
  }

  currentLine.value = new Konva.Line({
    points: [pos.x, pos.y],
    stroke: styleConfig.stroke,
    strokeWidth: styleConfig.strokeWidth,
    opacity: styleConfig.opacity,
    lineCap: styleConfig.lineCap,
    lineJoin: styleConfig.lineJoin,
    tension: styleConfig.tension,
    dash: styleConfig.dash,
    name: 'pen-line canvas-element',
    draggable: false,
    listening: true,
  });

  currentLine.value.setAttr('penType', styleConfig.type);

  layer.add(currentLine.value);
  requestLayerDraw();
}

function onPointerMove(e) {
  if (!isDrawing.value) return;

  const pos = getPointerPosition();

  if (!pos) return;

  e.cancelBubble = true;

  const styleConfig = getPenStyleConfig();

  if (styleConfig.isEraser) {
    eraseHitLines(pos, styleConfig.strokeWidth);
    requestLayerDraw();
    return;
  }

  if (!currentLine.value) return;

  const oldPoints = currentLine.value.points();

  const lastX = oldPoints[oldPoints.length - 2];
  const lastY = oldPoints[oldPoints.length - 1];

  const dx = pos.x - lastX;
  const dy = pos.y - lastY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 1.5) return;

  currentLine.value.points([...oldPoints, pos.x, pos.y]);

  requestLayerDraw();
}

function onPointerUp(e) {
  if (!isDrawing.value) return;

  if (e) {
    e.cancelBubble = true;
  }

  const styleConfig = getPenStyleConfig();

  isDrawing.value = false;

  if (styleConfig.isEraser) {
    currentLine.value = null;
    requestLayerDraw();
    return;
  }

  if (!currentLine.value) return;

  const line = currentLine.value;
  const points = line.points();

  if (points.length < MIN_POINT_COUNT) {
    line.destroy();
    currentLine.value = null;
    requestLayerDraw();
    return;
  }

  line.draggable(toolStore.activeTool === 'select');

  bindLineEvents(line);

  currentLine.value = null;

  requestLayerDraw();
}
function eraseHitLines(pos, eraserSize) {
  if (!layer || !pos) return;

  const radius = Math.max(Number(eraserSize || 20) / 2, 6);

  const lines = layer.find('.pen-line');

  lines.forEach(line => {
    if (!line) return;

    // Konva node destroyed after destroy() usually has no parent/stage
    if (!line.getStage || !line.getStage()) return;

    const hit = isLineHitByEraser(line, pos, radius);

    if (hit) {
      line.destroy();
    }
  });
}

function isLineHitByEraser(line, eraserPos, eraserRadius) {
  const points = line.points();

  if (!points || points.length < 4) return false;

  const lineStrokeWidth = Number(line.strokeWidth() || 1);
  const hitRadius = eraserRadius + lineStrokeWidth / 2;

  const lineTransform = line.getAbsoluteTransform();

  for (let i = 0; i < points.length - 2; i += 2) {
    const p1 = lineTransform.point({
      x: points[i],
      y: points[i + 1],
    });

    const p2 = lineTransform.point({
      x: points[i + 2],
      y: points[i + 3],
    });

    const distance = distancePointToSegment(eraserPos.x, eraserPos.y, p1.x, p1.y, p2.x, p2.y);

    if (distance <= hitRadius) {
      return true;
    }
  }

  return false;
}

function distancePointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);

  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  const diffX = px - closestX;
  const diffY = py - closestY;

  return Math.sqrt(diffX * diffX + diffY * diffY);
}
function bindLineEvents(line) {
  if (!line) return;

  line.on('mousedown tap', e => {
    e.cancelBubble = true;
  });

  line.on('dragstart dragmove dragend', e => {
    e.cancelBubble = true;
  });

  line.on('transformstart transform transformend', e => {
    e.cancelBubble = true;
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

  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (currentLine.value) {
    currentLine.value.destroy();
    currentLine.value = null;
  }

  stage = null;
  layer = null;
});
</script>
