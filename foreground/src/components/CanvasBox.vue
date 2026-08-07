<template>
  <div class="canvas-box" style="width: 100%; height: 100vh; margin: 0; padding: 0">
    <FabricCanvas ref="fabricCanvasRef"> </FabricCanvas>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import FabricCanvas from './FabricCanvas.vue';

const fabricCanvasRef = ref(null);
const selectTool = ref(null);

const changeTool = tool => {
  selectTool.value = tool;
  fabricCanvasRef.value.changeTool(tool);
};
</script>

<style scoped>
.canvas-box {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
