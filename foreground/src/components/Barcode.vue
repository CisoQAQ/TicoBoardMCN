<template />

<script setup>
import { shallowRef, watch, onUnmounted, nextTick } from 'vue';
import { useToolStore } from '../store/tool';
import Konva from 'konva';
import bwipjs from 'bwip-js';
import {
  resolveQrBcid,
  resolveBarcodeBcid,
  resolveBarcodeMeta,
  DRAW_CONSTANTS,
  EVENT_NAMESPACES,
  QRCODE_TYPE_LIST,
  BARCODE_TYPE_LIST,
} from '../utils/constants';
import { colorToHex, getDrawBox, resolveStage, resolveLayer, getPointerPosition, isDeleteKey, getShapeClientBox } from '../utils/common';

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
let currentBarcodeImage = null;
let currentBarcodeConfig = null;

let startX = 0;
let startY = 0;
let endX = 0;
let endY = 0;

let transformer = null;
let measureLabel = null;
let rafId = null;

const EVENT_NS = EVENT_NAMESPACES.BARCODE_DRAW;

const MIN_SIZE = DRAW_CONSTANTS.MIN_BARCODE_SIZE;
const TAP_THRESHOLD = 5;

let hasShapeOnLayer = false;

const barcodeToolNames = ['qrcode', 'barcode'];

function is2DCodeCategory(subtype) {
  return QRCODE_TYPE_LIST.some(i => i.value === subtype);
}

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
      console.warn('[Barcode] 未找到 Konva Layer');
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

function isBarcodeTool() {
  return barcodeToolNames.includes(toolStore.activeTool);
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
  if (!isDeleteKey(e)) return;
  if (!transformer) return;
  const nodes = transformer.nodes();
  if (!nodes || nodes.length === 0) return;
  nodes.forEach(node => node.destroy());
  transformer.nodes([]);
  stage.fire('selectionChange', { node: null });
  requestLayerDraw();
}

function isCanvasElementTarget(target) {
  if (!target || !stage) return false;
  let current = target;
  while (current && current !== stage) {
    if (current.hasName?.('canvas-element')) {
      return true;
    }
    if (current.hasName?.('barcode')) {
      return true;
    }
    current = current.getParent?.();
  }

  return false;
}

async function generateBarcodeImage(config) {
  return new Promise((resolve, reject) => {
    try {
      const offscreenCanvas = document.createElement('canvas');
      const bcid = config._bcid || config.type;

      const bgHex = colorToHex(config.backgroundColor || '#ffffff');
      const fgHex = colorToHex(config.foregroundColor || '#000000');

      const options = {
        bcid,
        text: config.value,
        scale: 5,
        backgroundcolor: 'FFFFFF',
        color: '000000',
        paddingwidth: 0,
        paddingheight: 0,
      };

      if (config._altcode) {
        options.altcode = config._altcode;
      }

      if (config._2d) {
        if (config.subtype === 'qrcode') {
          options.eclevel = 'M';
        }
      } else {
        options.includetext = true;
        options.textgaps = 1;
      }

      bwipjs.toCanvas(offscreenCanvas, options);

      applyColorOverlay(offscreenCanvas, '000000', fgHex, 'FFFFFF', bgHex);

      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = offscreenCanvas.toDataURL('image/png');
    } catch (err) {
      reject(err);
    }
  });
}

function applyColorOverlay(canvas, srcFg, targetFg, srcBg, targetBg) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  if (!width || !height) return;

  const fgR = parseInt(targetFg.substring(0, 2), 16);
  const fgG = parseInt(targetFg.substring(2, 4), 16);
  const fgB = parseInt(targetFg.substring(4, 6), 16);
  const bgR = parseInt(targetBg.substring(0, 2), 16);
  const bgG = parseInt(targetBg.substring(2, 4), 16);
  const bgB = parseInt(targetBg.substring(4, 6), 16);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;

    if (brightness < 128) {
      data[i] = fgR;
      data[i + 1] = fgG;
      data[i + 2] = fgB;
    } else {
      data[i] = bgR;
      data[i + 1] = bgG;
      data[i + 2] = bgB;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

async function onMouseDown(e) {
  if (!isBarcodeTool()) return;

  if (isCanvasElementTarget(e.target)) return;
  if (e.target !== stage) return;

  const pos = getPointerPosition(stage);
  if (!pos) return;

  const raw = toolStore.barcodeConfig;
  const isQrTool = toolStore.activeTool === 'qrcode';
  const subtype =
    raw.subtype && (isQrTool ? QRCODE_TYPE_LIST.some(i => i.value === raw.subtype) : BARCODE_TYPE_LIST.some(i => i.value === raw.subtype))
      ? raw.subtype
      : isQrTool
        ? 'qrcode'
        : 'code128';

  const bcid = isQrTool ? resolveQrBcid(subtype) : resolveBarcodeBcid(subtype);
  const barcodeMeta = isQrTool ? {} : resolveBarcodeMeta(subtype);

  if (!raw.value) {
    console.warn('条码内容为空');
    return;
  }

  const config = {
    ...raw,
    subtype,
    _2d: is2DCodeCategory(subtype) || isQrTool,
    _bcid: bcid,
    _altcode: barcodeMeta.altcode,
  };

  try {
    const img = await generateBarcodeImage(config);
    currentBarcodeImage = img;
    currentBarcodeConfig = config;

    isDrawing.value = true;
    hasShapeOnLayer = false;
    startX = pos.x;
    startY = pos.y;
    endX = pos.x;
    endY = pos.y;

    currentShape.value = createBarcodeShape(startX, startY, img, config);

    if (!currentShape.value) return;

    clearSelection();

    if (measureLabel) {
      measureLabel.visible(false);
      measureLabel.moveToTop();
    }

    if (transformer) {
      transformer.moveToTop();
    }
  } catch (err) {
    console.error('生成条码图片失败:', err);
    alert('条码生成失败: ' + (err.message || '参数错误'));
  }
}

function createBarcodeShape(x, y, img, config) {
  const ratio = img.width / img.height;
  const defaultWidth = config._2d ? DRAW_CONSTANTS.DEFAULT_QRCODE_WIDTH : DRAW_CONSTANTS.DEFAULT_BARCODE_WIDTH;
  const defaultHeight = defaultWidth / ratio;

  return new Konva.Image({
    x,
    y,
    image: img,
    width: defaultWidth,
    height: defaultHeight,
    name: 'barcode canvas-element',
    draggable: false,
    perfectDrawEnabled: true,
  });
}

function onMouseMove() {
  if (!isDrawing.value || !currentShape.value) return;

  const pos = getPointerPosition(stage);
  if (!pos) return;

  endX = pos.x;
  endY = pos.y;

  const dragDistance = Math.max(Math.abs(endX - startX), Math.abs(endY - startY));

  const box = getDrawBox(startX, startY, pos.x, pos.y);
  updateBarcodeShape(currentShape.value, box);

  if (dragDistance >= TAP_THRESHOLD && !hasShapeOnLayer) {
    hasShapeOnLayer = true;
    layer.add(currentShape.value);
    if (measureLabel) measureLabel.visible(true);
    if (transformer) transformer.moveToTop();
  }

  if (hasShapeOnLayer) {
    updateMeasureLabel(box);
    requestLayerDraw();
  }
}

function updateBarcodeShape(shape, box) {
  if (!currentBarcodeImage) return;

  const img = currentBarcodeImage;
  const ratio = img.width / img.height;

  let width = box.width;
  let height = box.height;

  if (width > 0 && height > 0) {
    const drawRatio = width / height;
    if (drawRatio > ratio) {
      width = height * ratio;
    } else {
      height = width / ratio;
    }
  }

  shape.x(box.left);
  shape.y(box.top);
  shape.width(width);
  shape.height(height);
}

async function onMouseUp() {
  if (!isDrawing.value) return;
  isDrawing.value = false;

  if (!currentShape.value) {
    hideMeasureLabel();
    return;
  }

  const shape = currentShape.value;
  const savedConfig = currentBarcodeConfig;
  const savedImage = currentBarcodeImage;
  hideMeasureLabel();

  const dragDistance = Math.max(Math.abs(endX - startX), Math.abs(endY - startY));
  const isTap = dragDistance < TAP_THRESHOLD;

  if (isTap) {
    shape.destroy();
    currentShape.value = null;
    currentBarcodeImage = null;
    currentBarcodeConfig = null;
    requestLayerDraw();
    return;
  }

  let finalShape = shape;
  try {
    const regenerated = await regenerateShapeByActualSize(shape, savedConfig, savedImage);
    if (regenerated) finalShape = regenerated;
  } catch (err) {
    console.warn('重绘条码失败，使用原始绘制:', err);
  }

  finalShape.draggable(toolStore.activeTool === 'select');
  finalShape.name('barcode canvas-element');
  bindBarcodeEvents(finalShape, savedConfig);

  if (toolStore.activeTool === 'select') selectBarcode(finalShape);
  else clearSelection();

  currentShape.value = null;
  currentBarcodeImage = null;
  currentBarcodeConfig = null;
  requestLayerDraw();
}

function bindBarcodeEvents(shape, cfg) {
  if (!shape) return;
  if (cfg) {
    shape.setAttr('__barcode_config__', JSON.stringify(cfg));
  }

  shape.on('mousedown tap', e => {
    e.cancelBubble = true;
    selectBarcode(shape);
  });

  shape.on('dragstart dragmove dragend', e => {
    e.cancelBubble = true;
    if (e.type === 'dragstart') {
      stage.fire('toolbarVisibleChange', { visible: false });
    } else if (e.type === 'dragend') {
      stage.fire('toolbarVisibleChange', { visible: true });
    }
  });

  shape.on('transformstart transform transformend', e => {
    e.cancelBubble = true;
    if (e.type === 'transformstart') {
      stage.fire('toolbarVisibleChange', { visible: false });
    } else if (e.type === 'transformend') {
      stage.fire('toolbarVisibleChange', { visible: true });
      try {
        const cfgRaw = shape.getAttr('__barcode_config__');
        const savedCfg = cfgRaw ? JSON.parse(cfgRaw) : null;
        const baseImg = shape.image();
        regenerateShapeByActualSize(shape, savedCfg, baseImg, true);
      } catch (_) {}
    }
  });
}

async function regenerateShapeByActualSize(shape, cfg, baseImg, replaceInPlace = false) {
  if (!shape || !cfg) return null;
  try {
    const clientBox = replaceInPlace ? shape.getClientRect({ skipTransform: true }) : getShapeClientBox(shape);
    if (!clientBox.width || !clientBox.height) return null;

    const ratio = baseImg ? baseImg.width / baseImg.height : 1;
    let width = Math.max(MIN_SIZE, Math.abs(clientBox.width));
    let height = Math.max(MIN_SIZE, Math.abs(clientBox.height));
    const drawRatio = width / height;
    if (drawRatio > ratio) {
      width = height * ratio;
    } else {
      height = width / ratio;
    }

    const offscreenCanvas = document.createElement('canvas');

    const bgHex = colorToHex(cfg.backgroundColor || '#ffffff');
    const fgHex = colorToHex(cfg.foregroundColor || '#000000');
    const bcid = cfg._bcid || cfg.type;

    const options = {
      bcid,
      text: cfg.value,
      scale: 5,
      backgroundcolor: 'FFFFFF',
      color: '000000',
      paddingwidth: 0,
      paddingheight: 0,
    };
    if (cfg._altcode) {
      options.altcode = cfg._altcode;
    }
    if (cfg._2d) {
      if (cfg.subtype === 'qrcode') options.eclevel = 'M';
    } else {
      options.includetext = true;
      options.textgaps = 1;
    }

    bwipjs.toCanvas(offscreenCanvas, options);
    applyColorOverlayRef(offscreenCanvas, fgHex, bgHex);

    const regenerated = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = offscreenCanvas.toDataURL('image/png');
    });

    if (replaceInPlace) {
      const px = shape.x();
      const py = shape.y();
      shape.image(regenerated);
      shape.width(width);
      shape.height(height);
      const nodes = transformer ? transformer.nodes() : [];
      if (nodes.includes(shape) && transformer) {
        transformer.forceUpdate();
      }
    } else {
      shape.image(regenerated);
      shape.width(width);
      shape.height(height);
    }
    requestLayerDraw();
    return shape;
  } catch (err) {
    console.error('重新生成条码失败:', err);
    return null;
  }
}

function applyColorOverlayRef(canvas, fgHex, bgHex) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  if (!w || !h) return;
  const fgR = parseInt(fgHex.substring(0, 2), 16);
  const fgG = parseInt(fgHex.substring(2, 4), 16);
  const fgB = parseInt(fgHex.substring(4, 6), 16);
  const bgR = parseInt(bgHex.substring(0, 2), 16);
  const bgG = parseInt(bgHex.substring(2, 4), 16);
  const bgB = parseInt(bgHex.substring(4, 6), 16);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (brightness < 128) {
      data[i] = fgR;
      data[i + 1] = fgG;
      data[i + 2] = fgB;
    } else {
      data[i] = bgR;
      data[i + 1] = bgG;
      data[i + 2] = bgB;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

function updateMeasureLabel(box) {
  if (!measureLabel) return;

  const width = Math.round(box.width);
  const height = Math.round(box.height);

  measureLabel.text(`${width} × ${height}`);

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

function selectBarcode(shape) {
  if (!transformer || !shape) return;

  transformer.nodes([shape]);
  transformer.moveToTop();

  stage.fire('selectionChange', { node: shape });
  requestLayerDraw();
}

function clearSelection() {
  if (!transformer) return;

  transformer.nodes([]);
  stage.fire('selectionChange', { node: null });
}

function onSelectionChange(e) {
  if (!e || !e.node) {
    if (transformer && transformer.nodes().length > 0) {
      transformer.nodes([]);
      requestLayerDraw();
    }
  }
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
  currentBarcodeImage = null;
  currentBarcodeConfig = null;
});
</script>
