<template>
  <div class="pen-config-panel" @mousedown.stop @mousemove.stop @mouseup.stop @click.stop @wheel.stop.prevent="handleWheel">
    <div class="panel-header">
      <div class="panel-title">画笔</div>
      <div class="shortcut">P</div>
    </div>

    <div class="pen-list">
      <div
        v-for="item in penList"
        :key="item.type"
        class="pen-item"
        :class="{ active: toolStore.penConfig.type === item.type }"
        @click.stop="setPenType(item)"
      >
        <div class="pen-preview">
          <div
            class="pen-line"
            :style="{
              height: `${item.previewWidth}px`,
              background: item.previewBackground,
              opacity: item.previewOpacity,
              borderStyle: item.dashed ? 'dashed' : 'solid',
            }"
          ></div>
          <div
            class="pen-head"
            :style="{
              background: item.color,
            }"
          ></div>
        </div>
      </div>

      <div class="eraser-item" @click.stop="setEraserLikePen">
        <div class="eraser-icon">×</div>
        <div class="eraser-box"></div>
      </div>
    </div>

    <div class="config-section">
      <div class="config-title">粗细 {{ toolStore.penConfig.strokeWidth }}</div>

      <input
        class="stroke-slider"
        type="range"
        min="1"
        max="40"
        :value="toolStore.penConfig.strokeWidth"
        @input.stop="setStrokeWidth"
        @mousedown.stop
      />
    </div>

    <div class="color-grid">
      <button
        v-for="color in colors"
        :key="color"
        class="color-item"
        :class="{ active: toolStore.penConfig.strokeColor === color }"
        :style="{ background: color }"
        @click.stop="setStrokeColor(color)"
      >
        <span v-if="toolStore.penConfig.strokeColor === color" class="dot"></span>
      </button>

      <div class="color-picker-wrap" :class="{ active: isCustomColorActive }" @mousedown.stop @mouseup.stop @click.stop>
        <el-color-picker
          v-model="currentStrokeColor"
          show-alpha
          :predefine="predefineColors"
          @change="handleColorPickerChange"
          @active-change="handleColorPickerActiveChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useToolStore } from '../store/tool';

const toolStore = useToolStore();

const penList = [
  {
    type: 'pen',
    label: '画笔',
    color: '#35b85f',
    strokeWidth: 6,
    opacity: 1,
    tension: 0.45,
    dash: [],
    previewWidth: 4,
    previewBackground: '#35b85f',
    previewOpacity: 1,
  },
  {
    type: 'marker',
    label: '马克笔',
    color: '#ff9800',
    strokeWidth: 8,
    opacity: 0.95,
    tension: 0.35,
    dash: [],
    previewWidth: 5,
    previewBackground: '#ff9800',
    previewOpacity: 1,
  },
  {
    type: 'highlighter',
    label: '荧光笔',
    color: '#fff200',
    strokeWidth: 16,
    opacity: 0.35,
    tension: 0.25,
    dash: [],
    previewWidth: 14,
    previewBackground: '#fff200',
    previewOpacity: 0.75,
  },
  {
    type: 'dashed',
    label: '虚线笔',
    lineCap: 'butt',
    color: '#35b85f',
    strokeWidth: 5,
    opacity: 1,
    tension: 0,
    lineCap: 'round', // 保留圆润端点
    lineJoin: 'round',
    dash: [12, 8],
    dashed: true,
    previewWidth: 4,
    previewBackground: '#35b85f',
    previewOpacity: 1,
  },
];

const colors = ['#000000', '#ff0000', '#35b85f', '#ff9800', '#0b8f1f', '#0000ff'];

const predefineColors = [
  '#000000',
  '#ff0000',
  '#35b85f',
  '#ff9800',
  '#0b8f1f',
  '#0000ff',
  '#298fff',
  '#6366f1',
  '#f97316',
  '#14b8a6',
  '#f43f5e',
  'rgba(41, 143, 255, 0.5)',
  'rgba(99, 102, 241, 0.5)',
  'rgba(249, 115, 22, 0.5)',
];

const currentStrokeColor = computed({
  get() {
    return toolStore.penConfig.strokeColor;
  },
  set(value) {
    if (!value) return;
    toolStore.setPenStrokeColor(value);
  },
});

const isCustomColorActive = computed(() => {
  return !colors.includes(toolStore.penConfig.strokeColor);
});
const getDashByWidth = width => [Math.max(12, width * 2.5), Math.max(8, width * 1.5)];

const setStrokeWidth = e => {
  const width = Number(e.target.value);
  const isDashed = toolStore.penConfig.type === 'dashed';

  toolStore.setPenConfig({
    strokeWidth: width,
    ...(isDashed && {
      dash: getDashByWidth(width),
      tension: 0,
      lineCap: 'round',
      lineJoin: 'round',
    }),
  });
};

const setPenType = item => {
  const isDashed = item.type === 'dashed';

  toolStore.setPenConfig({
    type: item.type,
    strokeColor: item.color,
    strokeWidth: item.strokeWidth,
    opacity: item.opacity,
    tension: item.tension,
    dash: isDashed ? getDashByWidth(item.strokeWidth) : [],
    lineCap: isDashed ? 'butt' : 'round',
    lineJoin: 'round',
    isEraser: false,
  });
};

const setEraserLikePen = () => {
  toolStore.setPenConfig({
    type: 'eraser',
    strokeColor: '#ffffff',
    strokeWidth: 20,
    opacity: 1,
    tension: 0.3,
    dash: [],
    isEraser: true,
    lineCap: 'round',
    lineJoin: 'round',
  });
};

// const setStrokeWidth = e => {
//   toolStore.setPenStrokeWidth(Number(e.target.value));
// };

const setStrokeColor = color => {
  toolStore.setPenStrokeColor(color);
};

const handleColorPickerChange = color => {
  if (!color) return;
  toolStore.setPenStrokeColor(color);
};

const handleColorPickerActiveChange = color => {
  if (!color) return;
  toolStore.setPenStrokeColor(color);
};

const handleWheel = e => {
  e.currentTarget.scrollTop += e.deltaY;
};
</script>

<style lang="scss" scoped>
.pen-config-panel {
  position: fixed;
  left: 104px;
  top: 185px;
  right: 16px;
  bottom: 16px;
  width: auto;
  max-width: 236px;
  max-height: calc(100vh - 185px - 16px);
  padding: 14px 12px 16px;
  border-radius: 18px;
  background: #f6f6f7;
  box-shadow:
    rgb(101 119 134 / 20%) 0 0 15px,
    rgb(101 119 134 / 15%) 0 0 3px 1px;
  z-index: 999;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  contain: layout paint;

  &::-webkit-scrollbar {
    display: none;
  }
}

.panel-header {
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px 8px;
}

.panel-title {
  font-size: 14px;
  color: #666;
}

.shortcut {
  font-size: 13px;
  color: #999;
}

.pen-list {
  margin-bottom: 14px;
}

.pen-item {
  height: 44px;
  border-radius: 10px;
  background: #fff;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  cursor: pointer;
  box-shadow: rgb(101 119 134 / 8%) 0 2px 6px;

  &:hover {
    background: #ecf5ff;
  }

  &.active {
    outline: 2px solid #298fff;
    outline-offset: 1px;
  }
}

.pen-preview {
  width: 100%;
  height: 100%;
  padding: 0 12px;
  display: flex;
  align-items: center;
}

.pen-line {
  flex: 1;
  border-radius: 999px;
  background: #35b85f;
  filter: drop-shadow(14px 0 10px rgb(0 0 0 / 16%));
}

.pen-head {
  width: 24px;
  height: 12px;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

.eraser-item {
  height: 44px;
  border-radius: 10px;
  background: #fff;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 16px;
  cursor: pointer;
  gap: 8px;

  &:hover {
    background: #ecf5ff;
  }
}

.eraser-icon {
  color: #d85c5c;
  font-size: 24px;
  font-weight: 600;
}

.eraser-box {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f7c6c6, #d77f7f);
}

.config-section {
  margin-bottom: 14px;
}

.config-title {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.stroke-slider {
  width: 100%;
  accent-color: #298fff;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(3, 42px);
  justify-content: center;
  gap: 10px 16px;
}

.color-item {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid rgb(0 0 0 / 12%);
  cursor: pointer;
  position: relative;
  padding: 0;

  &.active {
    outline: 2px solid #298fff;
    outline-offset: 2px;
  }
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid rgb(0 0 0 / 18%);
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.color-picker-wrap {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border: 1px solid rgb(0 0 0 / 12%);
  background:
    radial-gradient(circle at 80% 15%, #ffffff 0%, transparent 24%), radial-gradient(circle at 18% 18%, #ff2a2a 0%, transparent 36%),
    radial-gradient(circle at 84% 24%, #fff000 0%, transparent 38%), radial-gradient(circle at 86% 82%, #00e5ff 0%, transparent 36%),
    radial-gradient(circle at 16% 82%, #00f060 0%, transparent 38%),
    linear-gradient(135deg, #ff0000 0%, #ff7a00 18%, #fff000 35%, #00f060 52%, #00c8ff 68%, #304ffe 82%, #b000ff 100%);

  &.active {
    outline: 2px solid #298fff;
    outline-offset: 2px;
  }
}

.color-picker-wrap :deep(.el-color-picker) {
  width: 38px;
  height: 38px;
  display: block;
}

.color-picker-wrap :deep(.el-color-picker__trigger) {
  width: 38px;
  height: 38px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
}

.color-picker-wrap :deep(.el-color-picker__color) {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: transparent;
}

.color-picker-wrap :deep(.el-color-picker__color-inner) {
  border-radius: 50%;
  background: transparent !important;
}

.color-picker-wrap :deep(.el-color-picker__icon),
.color-picker-wrap :deep(.el-color-picker__empty) {
  display: none;
}
</style>

<style lang="scss">
.el-color-dropdown {
  z-index: 3000 !important;
}
</style>
