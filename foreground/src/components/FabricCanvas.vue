<template>
  <div
    ref="canvasContainerRef"
    class="canvas-container"
    style="width: 100vw; height: 100vh; background: #f5f5f5; overflow: hidden; cursor: grab; position: relative"
    :style="{ cursor: canvasCursor, outline: dragOver ? '2px dashed #298fff' : 'none' }"
    @wheel="handleCanvasWheel"
    @mousedown="handleCanvasMouseDown"
    @mousemove="handleCanvasMouseMove"
    @mouseup="handleCanvasMouseUp"
    @mouseleave="handleCanvasMouseUp"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <v-stage
      ref="stageRef"
      :config="stageConfig"
      @wheel="handleCanvasWheel"
      @mousedown="handleCanvasMouseDown"
      @mousemove="handleCanvasMouseMove"
      @mouseup="handleCanvasMouseUp"
      @mouseleave="handleCanvasMouseUp"
    >
      <CanvasGridBackground :stage-x="stageConfig.x" :stage-y="stageConfig.y" :scale="stageConfig.scaleX" :grid-size="30" />

      <v-layer>
        <Polygon :stage-ref="stageRef" name="canvas-element" />
        <Barcode :stage-ref="stageRef" name="canvas-element" />
      </v-layer>
    </v-stage>

    <!-- 画笔绘制逻辑，放在 v-stage 外面 -->
    <PenDraw v-if="stageRef" :stage-ref="stageRef" />
    <ElementToolbar v-if="stageRef" :stage-ref="stageRef" />

    <ToolBar />

    <div
      style="
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        padding: 10px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 16px;
      "
    >
      <button @click="zoomOut" style="background: none; border: none; font-size: 18px; cursor: pointer">➖</button>
      <span style="font-weight: 600; min-width: 50px; text-align: center">{{ zoomText }}</span>
      <button @click="zoomIn" style="background: none; border: none; font-size: 18px; cursor: pointer">➕</button>
      <button @click="resetZoom" style="background: none; border: none; font-size: 16px; cursor: pointer; color: #666">重置</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useCanvasStage } from '../utils/useCanvasStage';
import { useToolStore } from '../store/tool';

import CanvasGridBackground from './CanvasGridBackground.vue';
import ToolBar from './ToolBar.vue';
import Polygon from './Polygon.vue';
import Barcode from './Barcode.vue';
import PenDraw from './PenDraw.vue';
import ElementToolbar from './ElementToolbar.vue';
import { decodeBaiduObjUrl, normalizeUrl } from '../api/imageSearch';

const toolStore = useToolStore();
const canvasContainerRef = ref(null);
const dragOver = ref(false);

const { stageRef, stageConfig, zoomText, canvasCursor, startDrag, stopDrag, onDrag, handleWheel, zoomIn, zoomOut, resetZoom } =
  useCanvasStage();

const drawingToolNames = ['rectangle', 'pen', 'image', 'qrcode', 'barcode'];

const isCanvasMoveMode = computed(() => {
  return !toolStore.activeTool || toolStore.activeTool === 'select' || !drawingToolNames.includes(toolStore.activeTool);
});

const handleCanvasMouseDown = e => {
  if (!isCanvasMoveMode.value) return;
  startDrag(e);
};

const handleCanvasMouseMove = e => {
  if (!isCanvasMoveMode.value) return;
  onDrag(e);
};

const handleCanvasMouseUp = e => {
  stopDrag(e);
};

const handleCanvasWheel = e => {
  handleWheel(e);
};

/* ========== 图片拖放处理 ========== */

const handleDragOver = e => {
  dragOver.value = true;
  try {
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  } catch (_) {}
};

const handleDragLeave = e => {
  const rect = canvasContainerRef.value?.getBoundingClientRect();
  if (rect) {
    const { clientX, clientY } = e;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      dragOver.value = false;
    }
  } else {
    dragOver.value = false;
  }
};

// ========== 替换 handleDrop（增加：把拖拽数据里的 width/height hint 传进去，避免再 probe） ==========
const handleDrop = async e => {
  dragOver.value = false;
  const stage = stageRef.value?.getStage ? stageRef.value.getStage() : stageRef.value?.stage || null;
  if (!stage) return;

  let fullUrl = null;
  let thumbUrl = null;
  let dataUrl = null;
  let hintW = null; // 【新增】drag 时直接带原图/缩略图宽高，画布端无需 probe 网络
  let hintH = null;

  try {
    const raw = e.dataTransfer?.getData('text/plain');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.type === 'gallery-image') {
        thumbUrl = normalizeUrl(decodeBaiduObjUrl(parsed.thumbUrl)) || parsed.thumbUrl;
        fullUrl = normalizeUrl(decodeBaiduObjUrl(parsed.fullUrl)) || parsed.fullUrl;
        const isEncrypted = u => typeof u === 'string' && /ippr[a-z]?_z2C|_z&e3B|AzdH3F/i.test(u);
        if (isEncrypted(fullUrl) && !isEncrypted(thumbUrl)) {
          fullUrl = thumbUrl;
        }
        if (parsed.width) hintW = parsed.width;
        if (parsed.height) hintH = parsed.height;
      }
    }
  } catch (_) {}

  if (!fullUrl && !dataUrl) {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const f = files[0];
      if (f.type && f.type.startsWith('image/')) {
        // 本地上传的图片：先用 URL.createObjectURL 快速预读尺寸（FileReader onload 只给 dataURL，读尺寸还是要 Image probe，这里并行做）
        const probe = new Image();
        probe.onload = () => {
          hintW = probe.width;
          hintH = probe.height;
        };
        try {
          probe.src = URL.createObjectURL(f);
        } catch (_) {}

        const url = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = evt => resolve(evt.target.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(f);
        });
        if (url) dataUrl = url;
      }
    }
  }

  const srcToLoad = dataUrl || fullUrl || thumbUrl;
  if (!srcToLoad) return;

  const clientX = e.clientX;
  const clientY = e.clientY;
  const containerRect = canvasContainerRef.value.getBoundingClientRect();
  const relX = clientX - containerRect.left;
  const relY = clientY - containerRect.top;

  addImageToStage(stage, srcToLoad, { x: relX, y: relY }, containerRect, { thumbUrl, hintW, hintH });
};

// ========== 替换 addImageToStage（即时占位 + Tween 动画，零延迟不卡顿） ==========
const addImageToStage = (stage, src, screenPos, containerRect, opt = {}) => {
  // === 兼容 Konva 老版本（无 isDestroyed 方法）：销毁后 getParent() 为 null ===
  const __placeholderAlive = () =>
    !!(
      placeholderGroup &&
      (typeof placeholderGroup.isDestroyed === 'function'
        ? !placeholderGroup.isDestroyed()
        : placeholderGroup.getParent && placeholderGroup.getParent())
    );
  const __safeDestroyPlaceholder = () => {
    if (!__placeholderAlive()) return;
    try {
      placeholderGroup.destroy();
    } catch (_) {
      try {
        placeholderGroup.remove();
      } catch (_2) {}
    }
  };

  const scale = stage.scaleX();
  const stageX = stage.x();
  const stageY = stage.y();
  const worldX = (screenPos.x - stageX) / scale;
  const worldY = (screenPos.y - stageY) / scale;

  const layers = stage.getLayers();
  const layer = layers[layers.length - 1];
  if (!layer) return;

  const MAX_DIM = 300;

  // =========================================================
  //  步骤 1 / 3：立刻绘制占位盒子（0 延迟，不等任何网络）
  //  - 如果 hintW/hintH 有值（从 dataTransfer 带过来）→ 直接正确尺寸
  //  - 否则先画默认 260x200，等 probe 回来再 tween 到正确尺寸
  // =========================================================
  const getScaled = (w, h) => {
    const r = w / h;
    if (w > MAX_DIM || h > MAX_DIM) {
      if (r >= 1) return { w: MAX_DIM, h: MAX_DIM / r };
      return { h: MAX_DIM, w: MAX_DIM * r };
    }
    return { w, h };
  };

  let initW = 260,
    initH = 200;
  if (opt.hintW && opt.hintH) {
    const s = getScaled(opt.hintW, opt.hintH);
    initW = s.w;
    initH = s.h;
  }

  // 用 Konva.Group 组合：静态底板 + Arc tween（不写 setInterval 重绘整层）
  const placeholderGroup = new window.Konva.Group({
    x: worldX - initW / 2,
    y: worldY - initH / 2,
    width: initW,
    height: initH,
    name: 'image-placeholder canvas-element',
    listening: false,
  });

  const radius = Math.min(14, Math.min(initW, initH) * 0.08);

  // 1) 底板（圆角矩形 + 柔和阴影）—— 只绘制一次，永久静态
  const baseRect = new window.Konva.Rect({
    x: 0,
    y: 0,
    width: initW,
    height: initH,
    cornerRadius: radius,
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: initW, y: initH },
    fillLinearGradientColorStops: [0, '#eef3fb', 1, '#e3ebf6'],
    shadowColor: 'rgba(41, 143, 255, 0.35)',
    shadowBlur: 18,
    shadowOffsetY: 6,
    shadowOpacity: 1,
  });
  placeholderGroup.add(baseRect);

  // 2) 呼吸虚线边框（第二 Rect，只改 opacity + dashOffset tween）
  const pulseRect = new window.Konva.Rect({
    x: 0,
    y: 0,
    width: initW,
    height: initH,
    cornerRadius: radius,
    stroke: '#298fff',
    strokeWidth: 2,
    dash: [6, 5],
    opacity: 0.35,
  });
  placeholderGroup.add(pulseRect);

  // 3) Spinner 背景圆 + Arc（旋转 Tween 驱动，而不是 setInterval！）
  const cx = initW / 2;
  const cy = initH / 2;
  const sr = Math.max(16, Math.min(initW, initH) * 0.12);

  const spinnerBg = new window.Konva.Ring({
    x: cx,
    y: cy,
    innerRadius: sr - 2,
    outerRadius: sr,
    fill: '#ffffff',
    opacity: 0.85,
    stroke: 'rgba(200, 215, 235, 0.55)',
    strokeWidth: 1,
  });
  placeholderGroup.add(spinnerBg);

  // Arc：0.6 圈蓝色，作为旋转指针
  const spinnerArc = new window.Konva.Arc({
    x: cx,
    y: cy,
    innerRadius: sr - 3,
    outerRadius: sr,
    angle: 220, // 缺口弧（~61% 圆周）
    rotation: 0,
    fill: '#298fff',
    shadowColor: 'rgba(41,143,255,0.5)',
    shadowBlur: 4,
  });
  placeholderGroup.add(spinnerArc);

  layer.add(placeholderGroup);
  layer.batchDraw();

  // 【关键 1】Spinner 旋转：用 Konva.Tween（原生 RAF 驱动，单个属性变化，不重绘整层）
  const spinTween = new window.Konva.Tween({
    node: spinnerArc,
    rotation: 360,
    duration: 0.85,
    easing: window.Konva.Easings['Linear'],
    onFinish: () => {
      spinnerArc.rotation(0);
      spinTween.reset();
      spinTween.play();
    },
  });
  spinTween.play();

  // 【关键 2】虚线边 pulse：opacity + dashOffset 循环 Tween
  let pulseTimer = null;
  const startPulse = () => {
    let dir = 1;
    const runOne = () => {
      if (!__placeholderAlive()) return;
      new window.Konva.Tween({
        node: pulseRect,
        opacity: dir ? 0.75 : 0.22,
        dashOffset: dir ? -22 : 0,
        duration: 0.8,
        easing: window.Konva.Easings['InOutSine'],
        onFinish: () => {
          dir = 1 - dir;
          pulseTimer = setTimeout(runOne, 0);
        },
      }).play();
    };
    runOne();
  };
  startPulse();

  // =========================================================
  //  步骤 2 / 3：（若没有 hint）并行 probe 缩略图拿到真实尺寸 → resize 占位
  //  若已有 hint，本步直接 SKIP
  // =========================================================
  let isFinalized = false; // 图片加载完后就不再调 placeholder 相关操作
  let realW = initW,
    realH = initH;

  if (!opt.hintW || !opt.hintH) {
    const urls = [];
    if (opt.thumbUrl && opt.thumbUrl !== src) urls.push(opt.thumbUrl);
    urls.push(src);
    let idx = 0;
    const tryNext = () => {
      if (isFinalized || idx >= urls.length) return;
      const u = urls[idx++];
      const probe = new Image();
      probe.crossOrigin = 'anonymous';
      probe.onload = () => {
        if (isFinalized) return;
        const s = getScaled(probe.width, probe.height);
        realW = s.w;
        realH = s.h;
        // Tween 到正确尺寸（平滑过渡，而不是硬跳）
        const tgtX = worldX - s.w / 2;
        const tgtY = worldY - s.h / 2;
        const srNew = Math.max(16, Math.min(s.w, s.h) * 0.12);
        const rNew = Math.min(14, Math.min(s.w, s.h) * 0.08);

        new window.Konva.Tween({
          node: placeholderGroup,
          x: tgtX,
          y: tgtY,
          width: s.w,
          height: s.h,
          duration: 0.18,
          easing: window.Konva.Easings['EaseOut'],
        }).play();

        new window.Konva.Tween({
          node: baseRect,
          width: s.w,
          height: s.h,
          cornerRadius: rNew,
          duration: 0.18,
          easing: window.Konva.Easings['EaseOut'],
        }).play();

        new window.Konva.Tween({
          node: pulseRect,
          width: s.w,
          height: s.h,
          cornerRadius: rNew,
          duration: 0.18,
          easing: window.Konva.Easings['EaseOut'],
        }).play();

        new window.Konva.Tween({
          node: spinnerBg,
          x: s.w / 2,
          y: s.h / 2,
          innerRadius: srNew - 2,
          outerRadius: srNew,
          duration: 0.18,
          easing: window.Konva.Easings['EaseOut'],
        }).play();

        new window.Konva.Tween({
          node: spinnerArc,
          x: s.w / 2,
          y: s.h / 2,
          innerRadius: srNew - 3,
          outerRadius: srNew,
          duration: 0.18,
          easing: window.Konva.Easings['EaseOut'],
        }).play();
      };
      probe.onerror = () => tryNext();
      probe.src = u;
    };
    tryNext();
  } else {
    const s = getScaled(opt.hintW, opt.hintH);
    realW = s.w;
    realH = s.h;
  }

  // =========================================================
  //  步骤 3 / 3：原图加载完成 → 销毁所有 tween + placeholder，渲染真实图片
  // =========================================================
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    nextTick(() => {
      isFinalized = true;
      // 1) 停止所有 tween + timer
      if (pulseTimer) {
        clearTimeout(pulseTimer);
        pulseTimer = null;
      }
      try {
        spinTween.destroy();
      } catch (_) {}

      // 2) 计算最终尺寸
      const r = img.width / img.height;
      let w = img.width,
        h = img.height;
      if (w > MAX_DIM || h > MAX_DIM) {
        if (r >= 1) {
          w = MAX_DIM;
          h = MAX_DIM / r;
        } else {
          h = MAX_DIM;
          w = MAX_DIM * r;
        }
      }

      // 3) 从 placeholder 当前位置平滑过渡（从 placeholder 所在位置 -> 最终位置）
      let finalX = worldX - w / 2;
      let finalY = worldY - h / 2;
      if (__placeholderAlive()) {
        const curX = placeholderGroup.x();
        const curY = placeholderGroup.y();
        const curW = placeholderGroup.width();
        const curH = placeholderGroup.height();
        // 如果最终比例差不大，就用当前位置中心对齐，视觉上更"是同一个东西"
        finalX = curX + (curW - w) / 2;
        finalY = curY + (curH - h) / 2;

        // 渐隐：placeholder 淡出，避免"跳变"
        new window.Konva.Tween({
          node: placeholderGroup,
          opacity: 0,
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 0.15,
          easing: window.Konva.Easings['EaseIn'],
          onFinish: () => {
            __safeDestroyPlaceholder();
          },
        }).play();
      } else {
        __safeDestroyPlaceholder();
      }

      // 4) 添加真实图片，也带一个 150ms 淡入 tween
      const node = new window.Konva.Image({
        x: finalX,
        y: finalY,
        image: img,
        width: w,
        height: h,
        name: 'image canvas-element',
        draggable: toolStore.activeTool === 'select',
        perfectDrawEnabled: true,
        cornerRadius: Math.min(10, Math.min(w, h) * 0.04),
        shadowColor: 'rgba(15, 23, 42, 0.12)',
        shadowBlur: 14,
        shadowOffsetY: 4,
        opacity: 0, // 先透明
      });
      bindImageEvents(node, stage);
      layer.add(node);

      // 淡入：从 0 → 1 的 200ms
      new window.Konva.Tween({
        node,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 0.22,
        easing: window.Konva.Easings['EaseOut'],
      }).play();

      layer.batchDraw();
      stage.fire('selectionChange', { node: null });
    });
  };

  img.onerror = err => {
    console.warn('加载图片失败:', src, err);
    if (opt.thumbUrl && opt.thumbUrl !== src && !attemptedFallback) {
      attemptedFallback = true;
      const decThumb = normalizeUrl(decodeBaiduObjUrl(opt.thumbUrl)) || opt.thumbUrl;
      if (decThumb && decThumb !== src && !/ippr[a-z]?_z2C|_z&e3B/i.test(decThumb)) {
        console.warn('降级使用缩略图URL:', decThumb);
        img.src = decThumb;
        return;
      }
    }
    isFinalized = true;
    if (pulseTimer) {
      clearTimeout(pulseTimer);
      pulseTimer = null;
    }
    try {
      spinTween.destroy();
    } catch (_) {}
    __safeDestroyPlaceholder();
  };

  img.src = src;
};

const bindImageEvents = (shape, stage) => {
  if (!shape) return;

  shape.on('mousedown tap', e => {
    try {
      e.cancelBubble = true;
    } catch (_) {}
    stage.fire('selectionChange', { node: shape });
  });

  shape.on('dragstart dragmove dragend', e => {
    try {
      e.cancelBubble = true;
    } catch (_) {}
    if (e.type === 'dragstart') {
      stage.fire('toolbarVisibleChange', { visible: false });
    } else if (e.type === 'dragend') {
      stage.fire('toolbarVisibleChange', { visible: true });
    }
  });

  shape.on('transformstart transform transformend', e => {
    try {
      e.cancelBubble = true;
    } catch (_) {}
    if (e.type === 'transformstart') {
      stage.fire('toolbarVisibleChange', { visible: false });
    } else if (e.type === 'transformend') {
      stage.fire('toolbarVisibleChange', { visible: true });
    }
  });
};

/* ========== 事件：本地上传 & 拖放统一入口 ========== */

const addImageFromDataUrlHandler = async evt => {
  const stage = stageRef.value?.getStage ? stageRef.value.getStage() : stageRef.value?.stage || null;
  if (!stage) return;

  const { dataUrl, center } = evt.detail || {};
  if (!dataUrl) return;

  const containerRect = canvasContainerRef.value?.getBoundingClientRect();
  const pos =
    center && containerRect
      ? { x: containerRect.width / 2, y: containerRect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  addImageToStage(stage, dataUrl, pos, containerRect || { width: window.innerWidth, height: window.innerHeight });
};

onMounted(() => {
  window.addEventListener('add-image-from-dataurl', addImageFromDataUrlHandler);
});

onUnmounted(() => {
  window.removeEventListener('add-image-from-dataurl', addImageFromDataUrlHandler);
});
</script>
