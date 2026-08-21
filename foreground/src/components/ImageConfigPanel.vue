<template>
  <div class="shape-config-panel" @mousedown.stop @mousemove.stop @mouseup.stop @click.stop @wheel.stop.prevent="handleWheel">
    <!-- 顶部图形类型 -->
    <div class="shape-list">
      <h1>IMAGE</h1>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useToolStore } from '../store/tool';

const toolStore = useToolStore();

const shapeList = [
  { name: 'rectangle', label: '所有形状', icon: 'rectangle' },
  { name: 'Circle', label: '圆形', icon: 'Circle' },
  { name: 'rhombus', label: '菱形', icon: 'rhombus' },
  { name: 'triangle', label: '三角形', icon: 'triangle' },
  { name: 'line-or', label: '线条', icon: 'line-or' },
];

const colors = [
  '#4caf50',
  '#000000',
  '#ffffff',
  '#ff0000',
  '#00f000',
  '#0000ff',
  '#ffeb7a',
  '#8f98a6',
  '#5d6678',
  '#0c71b8',
  '#42a5f5',
  '#5c6bc0',
  '#ab47bc',
  '#26a69a',
  '#8d4653',
  '#ffa726',
  '#ff7043',
  '#ff2f68',
];

const predefineColors = [
  '#4caf50',
  '#000000',
  '#ffffff',
  '#ff0000',
  '#00f000',
  '#0000ff',
  '#ffeb7a',
  '#8f98a6',
  '#5d6678',
  '#0c71b8',
  '#42a5f5',
  '#5c6bc0',
  '#ab47bc',
  '#26a69a',
  '#8d4653',
  '#ffa726',
  '#ff7043',
  '#ff2f68',
  '#298fff',
  '#6366f1',
  '#f97316',
  '#14b8a6',
  '#f43f5e',
  'rgba(41, 143, 255, 0.5)',
  'rgba(99, 102, 241, 0.5)',
  'rgba(249, 115, 22, 0.5)',
];

const currentShape = computed(() => {
  return shapeList.find(item => item.name === toolStore.shapeConfig.type) || shapeList[0];
});

/**
 * Element Plus 颜色选择器绑定值
 * 这里直接和 Pinia 的 shapeConfig.fillColor 联动
 */
const currentFillColor = computed({
  get() {
    return toolStore.shapeConfig.fillColor;
  },
  set(value) {
    if (!value) return;
    toolStore.setShapeFillColor(value);
  },
});

/**
 * 如果当前颜色不在预设色里，就认为是自定义颜色
 * 此时让彩虹色块显示选中状态
 */
const isCustomColorActive = computed(() => {
  return !colors.includes(toolStore.shapeConfig.fillColor);
});

const setShapeType = type => {
  toolStore.setShapeType(type);
};

const setStyle = style => {
  toolStore.setShapeStyle(style);
};

const setStrokeWidth = e => {
  toolStore.setShapeStrokeWidth(Number(e.target.value));
};

const setFillColor = color => {
  toolStore.setShapeFillColor(color);
};

const handleColorPickerChange = color => {
  if (!color) return;
  toolStore.setShapeFillColor(color);
};

const handleColorPickerActiveChange = color => {
  if (!color) return;
  toolStore.setShapeFillColor(color);
};

const handleWheel = e => {
  e.currentTarget.scrollTop += e.deltaY;
};
</script>

<style lang="scss" scoped>
.shape-config-panel {
  position: fixed;
  left: 104px;
  top: 185px;
  right: 16px;
  bottom: 16px;
  width: auto;
  max-width: 236px;
  max-height: calc(100vh - 185px - 16px);
  padding: 16px;
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

.shape-list {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.shape-item {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: rgb(101 119 134 / 10%) 0 2px 6px;

  &:hover {
    background: #ecf5ff;
  }

  &.active {
    background: #298fff;
  }
}

.shape-info-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin-bottom: 16px;
  border-radius: 12px;
  background: #fff;
}

.shape-info-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shape-info-text {
  flex: 1;
}

.shape-title {
  font-size: 16px;
  font-weight: 600;
  color: #222;
}

.shape-subtitle {
  margin-top: 2px;
  font-size: 12px;
  color: #999;
}

.shape-info-tip {
  width: 18px;
  height: 18px;
  border: 1px solid #aaa;
  border-radius: 50%;
  color: #999;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.config-section {
  margin-bottom: 16px;
}

.config-title {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.style-switch {
  height: 32px;
  padding: 2px;
  border-radius: 8px;
  background: #e9e9e9;
  display: flex;

  button {
    flex: 1;
    border: none;
    background: transparent;
    border-radius: 7px;
    cursor: pointer;
    font-size: 13px;

    &.active {
      background: #fff;
      font-weight: 600;
      box-shadow: rgb(0 0 0 / 12%) 0 1px 4px;
    }
  }
}

.stroke-slider {
  width: 100%;
  accent-color: #298fff;
}

.stroke-preview {
  margin-top: 8px;
  height: 34px;
  background: #e5e5e5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stroke-line {
  background: #fff;
  border-radius: 2px;

  &.thin {
    width: 24px;
    height: 2px;
  }

  &.middle {
    width: 40px;
    height: 4px;
  }

  &.bold {
    width: 22px;
    height: 8px;
  }
}

.color-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 36px);
  gap: 10px;
}

.color-item {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid rgb(0 0 0 / 8%);
  cursor: pointer;
  position: relative;
  padding: 0;

  &.active {
    outline: 2px solid #298fff;
    outline-offset: 2px;
  }
}

.check {
  color: #111;
  font-size: 18px;
  font-weight: 600;
}

/**
 * 自定义颜色选择器入口
 * 这里做成你截图里的彩虹小方块
 */
.color-picker-wrap {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border: 1px solid rgb(0 0 0 / 8%);

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

/**
 * 隐藏 Element Plus 默认触发器样式
 * 保留点击能力，让外层彩虹色块作为视觉入口
 */
.color-picker-wrap :deep(.el-color-picker) {
  width: 36px;
  height: 36px;
  display: block;
}

.color-picker-wrap :deep(.el-color-picker__trigger) {
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
}

.color-picker-wrap :deep(.el-color-picker__color) {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: transparent;
}

.color-picker-wrap :deep(.el-color-picker__color-inner) {
  border-radius: 6px;
  background: transparent !important;
}

.color-picker-wrap :deep(.el-color-picker__icon) {
  display: none;
}

.color-picker-wrap :deep(.el-color-picker__empty) {
  display: none;
}
</style>

<style lang="scss">
/**
 * Element Plus 颜色选择器弹窗是挂到 body 上的，
 * scoped 样式影响不到，所以这里用非 scoped 样式提一下层级。
 */
.el-color-dropdown {
  z-index: 3000 !important;
}
</style>
