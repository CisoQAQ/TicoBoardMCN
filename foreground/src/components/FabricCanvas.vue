<template>
  <div
    class="canvas-container"
    style="width: 100vw; height: 100vh; background: #f5f5f5; overflow: hidden; cursor: grab; position: relative"
    :style="{ cursor: canvasCursor }"
    @wheel="handleCanvasWheel"
    @mousedown="handleCanvasMouseDown"
    @mousemove="handleCanvasMouseMove"
    @mouseup="handleCanvasMouseUp"
    @mouseleave="handleCanvasMouseUp"
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
      </v-layer>
    </v-stage>

    <!-- 画笔绘制逻辑，放在 v-stage 外面 -->
    <PenDraw v-if="stageRef" :stage-ref="stageRef" />
    <!-- <ImageDraw v-if="stageRef" :stage-ref="stageRef" /> -->

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
import { computed } from 'vue';
import { useCanvasStage } from '../utils/useCanvasStage';
import { useToolStore } from '../store/tool';

import CanvasGridBackground from './CanvasGridBackground.vue';
import ToolBar from './ToolBar.vue';
import Polygon from './Polygon.vue';
import PenDraw from './PenDraw.vue';
// import ImageDraw from './ImageConfigPanel.vue/index.js';

const toolStore = useToolStore();

const { stageRef, stageConfig, zoomText, canvasCursor, startDrag, stopDrag, onDrag, handleWheel, zoomIn, zoomOut, resetZoom } =
  useCanvasStage();

const isCanvasMoveMode = computed(() => {
  return !toolStore.activeTool || toolStore.activeTool === 'select';
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
</script>
