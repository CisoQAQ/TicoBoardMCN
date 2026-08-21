<template>
  <Teleport to="body">
    <div
      v-if="selectedNode && visible"
      ref="toolbarRef"
      class="element-toolbar"
      :style="toolbarStyle"
      @mousedown.stop
      @mousemove.stop
      @mouseup.stop
      @wheel.stop
      @click.stop
    >
      <!-- 浮动面板-->
      <div v-if="openPanel === 'fill'" class="toolbar-panel" :class="{ 'panel-below': !toolbarBelowElement }">
        <div class="panel-title">填充</div>
        <div class="color-grid">
          <div
            v-for="(color, idx) in colorGrid"
            :key="idx"
            class="color-swatch"
            :class="{ active: fillColor === color }"
            :style="{ background: color === null ? 'transparent' : color }"
            :data-color="color"
            @click.stop="setFillColor(color)"
          >
            <span v-if="color === null" class="no-fill-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none">
                <line x1="4" y1="4" x2="20" y2="20" />
              </svg>
            </span>
            <span v-else-if="fillColor === color" class="check-mark">✓</span>
          </div>
        </div>
        <div class="custom-color-row">
          <label class="custom-color-btn" @mousedown.stop @click.stop>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v20M2 12h20" stroke="white" stroke-width="2" />
            </svg>
            <input type="color" class="native-color-input" :value="customFillColor" @input="onCustomFillChange" />
          </label>
        </div>
      </div>

      <div v-if="openPanel === 'border'" class="toolbar-panel" :class="{ 'panel-below': !toolbarBelowElement }">
        <div class="panel-title">边框</div>
        <div class="config-row">
          <span class="config-label">粗细</span>
          <input class="stroke-slider" type="range" min="1" max="30" :value="strokeWidth" @input="setStrokeWidth" @mousedown.stop />
          <span class="config-value">{{ strokeWidth }}</span>
        </div>
        <div class="config-row">
          <span class="config-label">样式</span>
          <div class="style-buttons">
            <button
              v-for="s in strokeStyles"
              :key="s.value"
              class="style-btn"
              :class="{ active: strokeDash === s.value }"
              @click.stop="setStrokeDash(s.value)"
            >
              <svg v-if="s.value === ''" width="28" height="6" viewBox="0 0 28 6">
                <line x1="0" y1="3" x2="28" y2="3" stroke="currentColor" stroke-width="2" />
              </svg>
              <svg v-else-if="s.value === 'dashed'" width="28" height="6" viewBox="0 0 28 6">
                <line x1="0" y1="3" x2="8" y2="3" stroke="currentColor" stroke-width="2" />
                <line x1="12" y1="3" x2="20" y2="3" stroke="currentColor" stroke-width="2" />
                <line x1="24" y1="3" x2="28" y2="3" stroke="currentColor" stroke-width="2" />
              </svg>
              <svg v-else width="28" height="6" viewBox="0 0 28 6">
                <circle cx="3" cy="3" r="1.5" fill="currentColor" />
                <circle cx="10" cy="3" r="1.5" fill="currentColor" />
                <circle cx="17" cy="3" r="1.5" fill="currentColor" />
                <circle cx="24" cy="3" r="1.5" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
        <div class="color-grid">
          <div
            v-for="(color, idx) in colorGrid"
            :key="idx"
            class="color-swatch"
            :class="{ active: strokeColor === color }"
            :style="{ background: color === null ? 'transparent' : color }"
            @click.stop="setStrokeColor(color)"
          >
            <span v-if="color === null" class="no-fill-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none">
                <line x1="4" y1="4" x2="20" y2="20" />
              </svg>
            </span>
            <span v-else-if="strokeColor === color" class="check-mark">✓</span>
          </div>
        </div>
        <div class="custom-color-row">
          <label class="custom-color-btn" @mousedown.stop @click.stop>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v20M2 12h20" stroke="white" stroke-width="2" />
            </svg>
            <input type="color" class="native-color-input" :value="customStrokeColor" @input="onCustomStrokeChange" />
          </label>
        </div>
      </div>

      <div v-if="openPanel === 'opacity'" class="toolbar-panel" :class="{ 'panel-below': !toolbarBelowElement }">
        <div class="panel-title">透明度</div>
        <div class="config-row">
          <input class="opacity-slider" type="range" min="0" max="1" step="0.01" :value="opacity" @input="setOpacity" @mousedown.stop />
          <span class="config-value">{{ Math.round(opacity * 100) }}%</span>
        </div>
      </div>

      <!-- 工具栏主条 -->
      <div ref="barRef" class="toolbar-bar">
        <!-- 透明度 -->
        <div class="toolbar-item" title="透明度" @click.stop="togglePanel('opacity')">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" fill="none" />
            <text x="12" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">1</text>
          </svg>
          <span v-if="openPanel !== 'opacity'" class="color-dot" :style="{ background: opacityFillColor }" />
        </div>

        <!-- 填充 -->
        <div class="toolbar-item" title="填充颜色" @click.stop="togglePanel('fill')">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
              stroke="currentColor"
              stroke-width="1.5"
              fill="none"
            />
            <path d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="currentColor" stroke-width="1.5" fill="none" />
          </svg>
          <span class="color-dot" :style="{ background: fillColor }" />
        </div>

        <!-- 边框 -->
        <div class="toolbar-item" title="边框样式" @click.stop="togglePanel('border')">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5" fill="none" />
            <rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1.5" fill="none" />
          </svg>
          <span class="color-dot" :style="{ background: strokeColor }" />
        </div>

        <div class="toolbar-divider" />

        <!-- 锁定 -->
        <div class="toolbar-item" :class="{ active: isLocked }" :title="isLocked ? '解锁' : '锁定'" @click.stop="toggleLock">
          <svg v-if="!isLocked" width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5" fill="none" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.5" fill="none" />
          </svg>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5" fill="currentColor" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.5" fill="none" />
            <circle cx="12" cy="16" r="1.5" fill="#fff" />
          </svg>
        </div>

        <!-- 隐藏 -->
        <div class="toolbar-item" :class="{ active: isHidden }" :title="isHidden ? '显示' : '隐藏'" @click.stop="toggleHide">
          <svg v-if="!isHidden" width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" stroke-width="1.5" fill="none" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" fill="none" />
          </svg>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
              stroke="currentColor"
              stroke-width="1.5"
              fill="none"
            />
            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.5" />
          </svg>
        </div>

        <div class="toolbar-divider" />

        <!-- 删除 -->
        <div class="toolbar-item danger" title="删除" @click.stop="deleteNode">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"
              stroke="currentColor"
              stroke-width="1.5"
              fill="none"
            />
            <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" stroke-width="1.5" />
            <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" stroke-width="1.5" />
          </svg>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, nextTick, onMounted, onBeforeUnmount } from 'vue';
import Konva from 'konva';

const props = defineProps({
  stageRef: {
    type: Object,
    required: true,
  },
});

const colorGrid = [
  null,
  '#000000',
  '#ffffff',
  '#ff0000',
  '#4caf50',
  '#298fff',
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
  '#6366f1',
  '#f97316',
];

const strokeStyles = [
  { value: '', label: '实线' },
  { value: 'dashed', label: '虚线' },
  { value: 'dotted', label: '点线' },
];

const BAR_HEIGHT = 42;
const BAR_GAP = 50;

let stage = null;
let rafId = null;
let eventHandler = null;

const selectedNode = ref(null);
const openPanel = ref(null);
const visible = ref(true);
const customFillColor = ref('#ff0000');
const customStrokeColor = ref('#ff0000');
const barRef = ref(null);
const toolbarRef = ref(null);
const barWidth = ref(288);
const panelHeight = ref(0);
const toolbarLeft = ref(0);
const toolbarTop = ref(0);
const toolbarBelowElement = ref(false);
const toolbarStyle = computed(() => ({
  left: `${toolbarLeft.value}px`,
  top: `${toolbarTop.value}px`,
}));
const anchor = ref(null);
let transformerRef = null;
let transformerTimer = null;

function handleClickOutside(e) {
  if (!selectedNode.value || !visible.value || !stage) return;

  const toolbarEl = toolbarRef.value;
  if (!toolbarEl) return;

  const target = e.target;
  if (target === toolbarEl || toolbarEl.contains(target)) return;

  const node = selectedNode.value;
  const container = stage.container();
  if (!container) return;

  try {
    const nodeRect = node.getClientRect({ skipTransform: false });
    const containerRect = container.getBoundingClientRect();
    const stagePos = stage.position();
    const stageScale = stage.scaleX();

    const elementScreenRect = {
      left: containerRect.left + stagePos.x + nodeRect.x * stageScale,
      top: containerRect.top + stagePos.y + nodeRect.y * stageScale,
      width: nodeRect.width * stageScale,
      height: nodeRect.height * stageScale,
    };

    const clickX = e.clientX;
    const clickY = e.clientY;

    const clickedOnElement =
      clickX >= elementScreenRect.left &&
      clickX <= elementScreenRect.left + elementScreenRect.width &&
      clickY >= elementScreenRect.top &&
      clickY <= elementScreenRect.top + elementScreenRect.height;

    if (!clickedOnElement) {
      selectedNode.value = null;
      visible.value = false;
      openPanel.value = null;
      anchor.value = null;
      stopPositionTracking();
      if (stage) {
        stage.fire('selectionChange', { node: null });
      }
    }
  } catch (err) {
    selectedNode.value = null;
    visible.value = false;
    openPanel.value = null;
    anchor.value = null;
    stopPositionTracking();
    if (stage) {
      stage.fire('selectionChange', { node: null });
    }
  }
}

const fillColor = computed(() => {
  if (!selectedNode.value) return '#ffffff';
  const fill = selectedNode.value.fill();
  return fill || null;
});

const strokeColor = computed(() => {
  if (!selectedNode.value) return '#298fff';
  return selectedNode.value.stroke() || '#298fff';
});

const strokeWidth = computed(() => {
  if (!selectedNode.value) return 2;
  return Number(selectedNode.value.strokeWidth() || 2);
});

const strokeDash = computed(() => {
  if (!selectedNode.value) return '';
  const dash = selectedNode.value.dash();
  if (!dash || dash.length === 0) return '';
  if (dash.length >= 2) {
    if (dash[0] === 0) return 'dotted';
    return 'dashed';
  }
  return '';
});

const opacity = computed(() => {
  if (!selectedNode.value) return 1;
  return Number(selectedNode.value.opacity() ?? 1);
});

const isLocked = computed(() => {
  if (!selectedNode.value) return false;
  return !selectedNode.value.draggable();
});

const isHidden = computed(() => {
  if (!selectedNode.value) return false;
  return selectedNode.value.visible() === false;
});

const opacityFillColor = computed(() => {
  const o = opacity.value;
  if (o >= 0.99) return fillColor.value || '#ffffff';
  if (o <= 0.01) return 'transparent';
  const hex = fillColor.value || '#ffffff';
  if (hex.startsWith('#')) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${o})`;
  }
  return hex;
});

function getNodeScreenRect() {
  if (!selectedNode.value || !stage) return null;

  const node = selectedNode.value;
  const container = stage.container();
  if (!container) return null;

  const containerRect = container.getBoundingClientRect();
  const stagePos = stage.position();
  const stageScale = stage.scaleX();

  let rect;
  try {
    rect = node.getClientRect({ skipTransform: false });
  } catch (e) {
    return null;
  }

  if (!rect || rect.width < 0 || rect.height < 0) return null;
  if (rect.width < 2 && rect.height < 2) {
    rect = node.getClientRect({ skipTransform: true });
  }

  return {
    screenLeft: containerRect.left + stagePos.x + rect.x * stageScale,
    screenTop: containerRect.top + stagePos.y + rect.y * stageScale,
    screenHeight: rect.height * stageScale,
    screenWidth: rect.width * stageScale,
  };
}

function updatePosition() {
  const ctx = getNodeScreenRect();
  if (!ctx) return;

  const { screenLeft, screenTop, screenHeight, screenWidth } = ctx;
  const tw = barWidth.value;
  const hasPanel = !!openPanel.value;
  const ph = hasPanel ? panelHeight.value : 0;
  const panelWithGap = hasPanel ? ph + 8 : 0;

  let below;
  let left;
  let top;

  if (anchor.value) {
    below = anchor.value.below;
    if (below) {
      left = screenLeft + screenWidth / 2 - tw / 2;
      top = screenTop + screenHeight + anchor.value.gap;
    } else {
      left = screenLeft + screenWidth / 2 - tw / 2;
      top = screenTop - BAR_HEIGHT - anchor.value.gap;
    }
  } else {
    const neededAbove = BAR_HEIGHT + BAR_GAP;
    below = screenTop < neededAbove + 10;

    left = screenLeft + screenWidth / 2 - tw / 2;
    if (below) {
      top = screenTop + screenHeight + BAR_GAP;
    } else {
      top = screenTop - BAR_HEIGHT - BAR_GAP;
    }
  }

  left = Math.max(10, Math.min(left, window.innerWidth - tw - 10));

  if (below) {
    top = Math.max(10 + panelWithGap, Math.min(top, window.innerHeight - BAR_HEIGHT - 10));
  } else {
    top = Math.max(10, Math.min(top, window.innerHeight - BAR_HEIGHT - panelWithGap - 10));
  }

  toolbarLeft.value = left;
  toolbarTop.value = top;
  toolbarBelowElement.value = below;
}

watch(
  () => props.stageRef,
  val => {
    const nextStage = resolveStage(val);
    if (!nextStage) return;

    if (stage && stage !== nextStage) {
      stage.off('selectionChange', eventHandler);
    }

    stage = nextStage;

    eventHandler = e => {
      if (e && e.node) {
        selectedNode.value = e.node;
        visible.value = true;
        openPanel.value = null;
        anchor.value = null;
        nextTick(() => {
          measureBarWidth();
          updatePosition();
          startPositionTracking();
        });
      } else {
        selectedNode.value = null;
        visible.value = false;
        openPanel.value = null;
        anchor.value = null;
        stopPositionTracking();
      }
    };

    stage.on('selectionChange', eventHandler);
    stage.on('toolbarVisibleChange', e => {
      if (e && typeof e.visible === 'boolean') {
        visible.value = e.visible;
        if (e.visible) {
          nextTick(() => {
            measureBarWidth();
            updatePosition();
            startPositionTracking();
          });
        } else {
          openPanel.value = null;
        }
      }
    });
  },
  { immediate: true }
);

function measureBarWidth() {
  nextTick(() => {
    if (barRef.value) {
      barWidth.value = barRef.value.offsetWidth;
    }
    measurePanelHeight();
  });
}

function resolveStage(val) {
  if (!val) return null;
  if (typeof val.getStage === 'function') return val.getStage();
  if (val.value && typeof val.value.getStage === 'function') return val.value.getStage();
  if (val instanceof Konva.Stage) return val;
  return null;
}

function startPositionTracking() {
  stopPositionTracking();
  const tick = () => {
    if (!selectedNode.value || !visible.value) {
      stopPositionTracking();
      return;
    }
    updatePosition();
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

function stopPositionTracking() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function togglePanel(name) {
  if (openPanel.value === name) {
    openPanel.value = null;
    panelHeight.value = 0;
    anchor.value = null;
    nextTick(() => {
      updatePosition();
    });
  } else {
    const ctx = getNodeScreenRect();
    if (ctx) {
      const below = toolbarBelowElement.value;
      const currentTop = toolbarTop.value;
      let gap;
      if (below) {
        gap = currentTop - (ctx.screenTop + ctx.screenHeight);
      } else {
        gap = ctx.screenTop - (currentTop + BAR_HEIGHT);
      }
      anchor.value = { below, gap: Math.max(gap, 10) };
    }
    openPanel.value = name;
    measurePanelHeight();
  }
}

function measurePanelHeight() {
  nextTick(() => {
    nextTick(() => {
      if (!toolbarRef.value) {
        panelHeight.value = 0;
      } else {
        const panel = toolbarRef.value.querySelector('.toolbar-panel');
        panelHeight.value = panel ? panel.offsetHeight : 0;
      }
      updatePosition();
    });
  });
}

function setFillColor(color) {
  if (!selectedNode.value) return;
  if (color === null) {
    selectedNode.value.fill('transparent');
  } else {
    selectedNode.value.fill(color);
  }
  redraw();
}

function setStrokeColor(color) {
  if (!selectedNode.value) return;
  if (color === null) {
    selectedNode.value.stroke('transparent');
  } else {
    selectedNode.value.stroke(color);
  }
  redraw();
}

function setStrokeWidth(e) {
  if (!selectedNode.value) return;
  selectedNode.value.strokeWidth(Number(e.target.value));
  redraw();
}

function setStrokeDash(value) {
  if (!selectedNode.value) return;
  if (value === '') {
    selectedNode.value.dash([]);
  } else if (value === 'dashed') {
    selectedNode.value.dash([10, 4]);
  } else if (value === 'dotted') {
    selectedNode.value.dash([0, 4]);
  }
  redraw();
}

function setOpacity(e) {
  if (!selectedNode.value) return;
  selectedNode.value.opacity(Number(e.target.value));
  redraw();
}

function toggleLock() {
  if (!selectedNode.value) return;
  const newVal = !isLocked.value;
  selectedNode.value.draggable(!newVal);
  if (newVal) {
    selectedNode.value.dragBoundFunc(function () {
      return { x: this.absolutePosition().x, y: this.absolutePosition().y };
    });
  } else {
    selectedNode.value.dragBoundFunc(null);
  }
  redraw();
}

function toggleHide() {
  if (!selectedNode.value) return;
  const newVal = !isHidden.value;
  selectedNode.value.visible(!newVal);
  selectedNode.value.listening(!newVal);
  if (newVal) {
    if (selectedNode.value.getLayer) {
      selectedNode.value.getLayer().batchDraw();
    }
  }
  redraw();
}

function deleteNode() {
  if (!selectedNode.value) return;
  const node = selectedNode.value;
  node.destroy();
  if (stage) {
    stage.fire('selectionChange', { node: null });
  }
  redraw();
}

function onCustomFillChange(e) {
  const color = e?.target?.value || e;
  if (!color || !selectedNode.value) return;
  customFillColor.value = color;
  selectedNode.value.fill(color);
  redraw();
}

function onCustomStrokeChange(e) {
  const color = e?.target?.value || e;
  if (!color || !selectedNode.value) return;
  customStrokeColor.value = color;
  selectedNode.value.stroke(color);
  redraw();
}

function redraw() {
  if (!stage) return;
  const layers = stage.getLayers();
  if (layers && layers.length > 0) {
    layers[layers.length - 1].batchDraw();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  stopPositionTracking();
  document.removeEventListener('click', handleClickOutside);
  if (stage && eventHandler) {
    stage.off('selectionChange', eventHandler);
  }
});
</script>

<style lang="scss" scoped>
.element-toolbar {
  position: fixed;
  z-index: 1000;
  user-select: none;
  width: max-content;
}

.toolbar-bar {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  background: #fff;
  border-radius: 10px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.06);
  white-space: nowrap;
}

.toolbar-item {
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: #333;
  transition: background 0.15s;
  flex-shrink: 0;

  &:hover {
    background: #f0f4ff;
  }

  &.active {
    background: #e8f0ff;
    color: #298fff;
  }

  &.danger {
    &:hover {
      background: #ffe8e8;
      color: #ff4444;
    }
  }
}

.color-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e0e0e0;
  margin: 0 4px;
  flex-shrink: 0;
}

.toolbar-panel {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  min-width: 100%;
  padding: 14px;
  background: #fff;
  border-radius: 10px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.06);
  white-space: normal;

  &.panel-below {
    bottom: auto;
    top: calc(100% + 8px);
  }
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.config-label {
  font-size: 12px;
  color: #666;
  min-width: 36px;
}

.config-value {
  font-size: 12px;
  color: #333;
  min-width: 36px;
  text-align: right;
}

.stroke-slider {
  flex: 1;
  accent-color: #298fff;
  height: 4px;
}

.opacity-slider {
  flex: 1;
  accent-color: #298fff;
  height: 4px;
}

.style-buttons {
  display: flex;
  gap: 4px;
}

.style-btn {
  width: 36px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  color: #666;
  transition: all 0.15s;

  &.active {
    border-color: #298fff;
    color: #298fff;
    background: #f0f6ff;
  }

  &:hover {
    border-color: #298fff;
  }
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}

.color-swatch {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s;

  &:hover {
    transform: scale(1.08);
  }

  &.active {
    outline: 2px solid #298fff;
    outline-offset: 2px;
  }
}

.no-fill-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.check-mark {
  color: #333;
  font-size: 16px;
  font-weight: 700;
}

.custom-color-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-color-btn {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background:
    radial-gradient(circle at 80% 15%, #ffffff 0%, transparent 24%), radial-gradient(circle at 18% 18%, #ff2a2a 0%, transparent 36%),
    radial-gradient(circle at 84% 24%, #fff000 0%, transparent 38%), radial-gradient(circle at 86% 82%, #00e5ff 0%, transparent 36%),
    radial-gradient(circle at 16% 82%, #00f060 0%, transparent 38%),
    linear-gradient(135deg, #ff0000 0%, #ff7a00 18%, #fff000 35%, #00f060 52%, #00c8ff 68%, #304ffe 82%, #b000ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.08);
  }
}

.native-color-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}
</style>
