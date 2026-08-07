<template>
  <v-layer ref="layerRef">
    <v-shape v-if="currentType === 'line'" :config="lineShapeConfig" />
    <v-shape v-if="currentType === 'dot'" :config="dotShapeConfig" />
  </v-layer>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { useToolStore } from '../store/tool';

const props = defineProps({
  stageX: { type: Number, required: true },
  stageY: { type: Number, required: true },
  scale: { type: Number, required: true },
  gridSize: { type: Number, default: 20 },
  dotRadius: { type: Number, default: 1.5 },
  dotColor: { type: String, default: '#d9d9d9' },
  gridColor: { type: String, default: '#d9d9d9' },
});

const toolStore = useToolStore();
const currentType = computed(() => toolStore.getGridType());

const layerRef = ref(null);
const viewWidth = ref(window.innerWidth);
const viewHeight = ref(window.innerHeight);
let resizeObserver = null;
let isInited = false; // 防止重复初始化

function updateViewSize() {
  const stage = layerRef.value?.node?.getStage?.();
  if (!stage) return;
  const container = stage.container();
  if (!container) return;
  viewWidth.value = container.clientWidth;
  viewHeight.value = container.clientHeight;
}

watch(
  () => layerRef.value?.node,
  node => {
    if (!node || isInited) return;
    isInited = true;
    // 首次校准尺寸
    updateViewSize();
    // 监听容器尺寸变化
    const stage = node.getStage();
    const container = stage.container();
    resizeObserver = new ResizeObserver(updateViewSize);
    resizeObserver.observe(container);
  },
  { immediate: true }
);

// 组件卸载时清理监听
onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

// 动态网格步长
const effectiveGridSize = computed(() => {
  const baseSize = props.gridSize;
  const idealStep = baseSize / props.scale;
  const factors = [1, 2, 5, 10, 20, 50, 100, 200, 500];
  const steps = factors.map(f => baseSize * f);
  const matched = steps.find(step => step >= idealStep);
  return matched || steps[steps.length - 1];
});

// 视口范围计算
const viewRange = computed(() => {
  const { scale, stageX, stageY } = props;
  const gridSize = effectiveGridSize.value;

  const left = -stageX / scale;
  const right = (-stageX + viewWidth.value) / scale;
  const top = -stageY / scale;
  const bottom = (-stageY + viewHeight.value) / scale;

  return {
    startX: Math.floor(left / gridSize) * gridSize - gridSize,
    endX: Math.ceil(right / gridSize) * gridSize + gridSize,
    startY: Math.floor(top / gridSize) * gridSize - gridSize,
    endY: Math.ceil(bottom / gridSize) * gridSize + gridSize,
    gridSize,
  };
});

// 线网格 Shape 配置
const lineShapeConfig = computed(() => {
  const { startX, endX, startY, endY, gridSize } = viewRange.value;
  return {
    startX,
    endX,
    startY,
    endY,
    gridSize,
    stroke: props.gridColor,
    strokeWidth: 1 / props.scale,
    listening: false,
    perfectDrawEnabled: false,
    shadowForStrokeEnabled: false,
    sceneFunc: (ctx, shape) => {
      const { startX, endX, startY, endY, gridSize, stroke, strokeWidth } = shape.getAttrs();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    },
  };
});

// 点阵 Shape 配置
const dotShapeConfig = computed(() => {
  const { startX, endX, startY, endY, gridSize } = viewRange.value;
  return {
    startX,
    endX,
    startY,
    endY,
    gridSize,
    fill: props.dotColor,
    radius: props.dotRadius / props.scale,
    listening: false,
    perfectDrawEnabled: false,
    sceneFunc: (ctx, shape) => {
      const { startX, endX, startY, endY, gridSize, fill, radius } = shape.getAttrs();
      ctx.fillStyle = fill;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        for (let y = startY; y <= endY; y += gridSize) {
          ctx.moveTo(x + radius, y);
          ctx.arc(x, y, radius, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    },
  };
});
</script>
