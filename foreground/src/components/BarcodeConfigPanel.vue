<template>
  <div
    v-if="visible"
    class="barcode-config-panel"
    @mousedown.stop
    @mousemove.stop
    @mouseup.stop
    @click.stop
    @wheel.stop.prevent="handleWheel"
  >
    <div class="panel-header">
      <div class="header-icon">
        <SvgIcon name="barcode" size="22px" color="#298fff" />
      </div>
      <div class="header-text">
        <div class="panel-title">条形码</div>
        <div class="panel-subtitle">1D Barcode</div>
      </div>
    </div>

    <div class="config-section">
      <div class="config-title">条码类型</div>
      <div class="type-search-row">
        <el-input v-model="searchKeyword" size="small" clearable placeholder="搜索码类型、关键字">
          <template #prefix><SvgIcon name="search" size="14px" color="#8b95a7" /></template>
        </el-input>
      </div>
      <div class="type-count">
        共 {{ filteredTypeList.length }} / {{ barcodeTypeList.length }} 种
        <span v-if="!isSearching && showAll" class="toggle-btn" @click="showAll = false"> 收起 <span class="caret" data-dir="up" /> </span>
        <span v-else-if="!isSearching && totalCollapsedItems > 0" class="toggle-btn" @click="showAll = true">
          展开 {{ totalCollapsedItems }} 项 <span class="caret" data-dir="down" />
        </span>
      </div>
      <div v-if="displayTypeList.length > 0" class="type-grid">
        <div
          v-for="item in displayTypeList"
          :key="item.value"
          class="type-item"
          :class="{ active: localConfig.subtype === item.value }"
          @click="handleSubtypeChange(item.value)"
        >
          <div class="type-item-name">{{ item.label }}</div>
          <div class="type-item-meta">
            <span class="meta-tag" :class="`tag-${item.category}`">{{ item.category }}</span>
            <span class="meta-bcid">{{ item.bcid }}</span>
          </div>
        </div>
      </div>
      <div v-else class="search-empty">未找到匹配的码类型</div>
    </div>

    <div class="config-section">
      <div class="config-title">
        <span>条码内容</span>
        <span class="value-hint">{{ currentSubtypeInfo.bcid }}</span>
      </div>
      <el-input v-model="localConfig.value" :placeholder="`例：${currentSubtypeInfo.defaultValue}`" @input="handleValueChange" />
      <div class="input-hint" v-if="currentSubtypeInfo.hint">
        {{ currentSubtypeInfo.hint }}
      </div>
    </div>

    <div class="config-section colors-section">
      <div class="config-title">颜色配置</div>
      <div class="color-row">
        <div class="color-item-box">
          <span class="color-label">前景</span>
          <el-color-picker v-model="localConfig.foregroundColor" show-alpha :predefine="predefineColors" @change="handleConfigChange" />
        </div>
        <div class="color-item-box">
          <span class="color-label">背景</span>
          <el-color-picker v-model="localConfig.backgroundColor" show-alpha :predefine="predefineColors" @change="handleConfigChange" />
        </div>
      </div>
    </div>

    <div class="config-section preview-section">
      <div class="config-title">实时预览</div>
      <div class="preview-box">
        <canvas ref="previewCanvasRef" />
      </div>
      <div class="preview-tip">配置完成后，在画布上拖拽绘制</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue';
import { useToolStore } from '../store/tool';
import bwipjs from 'bwip-js';
import { BARCODE_TYPE_LIST, DEFAULT_PREDEFINE_COLORS, resolveBarcodeMeta, getBarcodeDefaultValue } from '../utils/constants';
import { colorToHex } from '../utils/common';
import SvgIcon from './SvgIcon.vue';

const toolStore = useToolStore();

const previewCanvasRef = ref(null);
const barcodeTypeList = BARCODE_TYPE_LIST;
const predefineColors = DEFAULT_PREDEFINE_COLORS;
const searchKeyword = ref('');
const showAll = ref(false);
const COLLAPSE_COUNT = 4;

const isSearching = computed(() => searchKeyword.value.trim().length > 0);

watch(isSearching, v => {
  if (v) showAll.value = true;
});

const subtypeHints = {
  ean13: '需 12~13 位数字',
  ean8: '需 7~8 位数字',
  upca: '需 11~12 位数字',
  upce: '需 6~8 位数字',
  itf14: '需 13~14 位数字',
  code39: '支持 A-Z / 0-9 / - . $ / + % 空格',
  interleaved2of5: '需偶数位数字',
};

const localConfig = reactive({
  subtype: 'code128',
  value: getBarcodeDefaultValue('code128'),
  backgroundColor: '#ffffff',
  foregroundColor: '#000000',
});

const visible = computed(() => toolStore.activeTool === 'barcode');

const filteredTypeList = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase();
  if (!kw) return barcodeTypeList;
  return barcodeTypeList.filter(item => {
    const pool = `${item.value} ${item.label} ${item.bcid} ${item.category || ''} ${item.keywords || ''}`.toLowerCase();
    return pool.includes(kw);
  });
});

const totalCollapsedItems = computed(() => Math.max(0, filteredTypeList.value.length - COLLAPSE_COUNT));

const displayTypeList = computed(() => {
  if (isSearching.value || showAll.value) return filteredTypeList.value;
  return filteredTypeList.value.slice(0, COLLAPSE_COUNT);
});

const currentSubtypeInfo = computed(() => {
  const item = barcodeTypeList.find(i => i.value === localConfig.subtype) || barcodeTypeList[0];
  return {
    ...item,
    defaultValue: getBarcodeDefaultValue(item.value),
    hint: subtypeHints[item.value] || '',
  };
});

watch(
  () => toolStore.activeTool,
  val => {
    if (val === 'barcode') {
      applyStoreConfig();
      nextTick(renderPreview);
    }
  },
  { immediate: true }
);

function applyStoreConfig() {
  const cfg = toolStore.barcodeConfig;
  localConfig.subtype = cfg.subtype && barcodeTypeList.some(i => i.value === cfg.subtype) ? cfg.subtype : 'code128';
  localConfig.value = cfg.value || getBarcodeDefaultValue(localConfig.subtype);
  localConfig.backgroundColor = cfg.backgroundColor || '#ffffff';
  localConfig.foregroundColor = cfg.foregroundColor || '#000000';
}

function handleSubtypeChange(value) {
  if (localConfig.subtype === value) return;
  localConfig.subtype = value;
  localConfig.value = getBarcodeDefaultValue(value);
  syncConfig();
  nextTick(renderPreview);
}

function handleValueChange() {
  syncConfig();
  nextTick(renderPreview);
}

function handleConfigChange() {
  syncConfig();
  nextTick(renderPreview);
}

function syncConfig() {
  toolStore.updateBarcodeConfig({
    type: 'barcode',
    subtype: localConfig.subtype,
    value: localConfig.value,
    backgroundColor: localConfig.backgroundColor,
    foregroundColor: localConfig.foregroundColor,
  });
}

function renderPreview() {
  const canvas = previewCanvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!localConfig.value) return;

  const fgHex = colorToHex(localConfig.foregroundColor);
  const bgHex = colorToHex(localConfig.backgroundColor);

  try {
    const meta = resolveBarcodeMeta(localConfig.subtype);
    const options = {
      bcid: meta.bcid,
      text: localConfig.value,
      scale: 4,
      backgroundcolor: 'FFFFFF',
      color: '000000',
      paddingwidth: 0,
      paddingheight: 0,
      includetext: true,
      textgaps: 1,
    };
    if (meta.altcode) {
      options.altcode = meta.altcode;
    }

    bwipjs.toCanvas(canvas, options);
    applyColorOverlay(canvas, fgHex, bgHex);
  } catch (err) {
    console.error('条形码预览失败:', err);
  }
}

function applyColorOverlay(canvas, fgHex, bgHex) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  if (!width || !height) return;

  const fgR = parseInt(fgHex.substring(0, 2), 16);
  const fgG = parseInt(fgHex.substring(2, 4), 16);
  const fgB = parseInt(fgHex.substring(4, 6), 16);
  const bgR = parseInt(bgHex.substring(0, 2), 16);
  const bgG = parseInt(bgHex.substring(2, 4), 16);
  const bgB = parseInt(bgHex.substring(4, 6), 16);

  const imageData = ctx.getImageData(0, 0, width, height);
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

const handleWheel = e => {
  e.currentTarget.scrollTop += e.deltaY;
};

onMounted(() => {
  syncConfig();
  nextTick(renderPreview);
});
</script>

<style lang="scss" scoped>
.barcode-config-panel {
  position: fixed;
  left: 104px;
  top: 185px;
  right: 16px;
  bottom: 16px;
  width: auto;
  max-width: 264px;
  max-height: calc(100vh - 200px - 16px);
  padding: 14px 14px 16px;
  border-radius: 16px;
  background: #f8f9fb;
  box-shadow:
    0 6px 24px rgba(101, 119, 134, 0.16),
    0 1px 3px rgba(101, 119, 134, 0.1);
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
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 2px 4px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 14px;
}

.header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(41, 143, 255, 0.1);
}

.panel-title {
  font-size: 17px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.2;
}

.panel-subtitle {
  margin-top: 3px;
  font-size: 11px;
  color: #8b95a7;
  letter-spacing: 0.4px;
}

.config-section + .config-section {
  margin-top: 14px;
}

.config-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: #58607a;
  margin-bottom: 8px;
  padding: 0 2px;
}

.value-hint {
  font-size: 10px;
  font-weight: 500;
  color: #9ba6b8;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 6px;
}

.type-search-row {
  margin-bottom: 8px;

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    padding: 2px 10px;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: none;
  }
}

.type-count {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10.5px;
  color: #9ba6b8;
  margin-bottom: 8px;
  padding: 0 2px;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #298fff;
  font-weight: 500;
  user-select: none;

  &:hover {
    color: #0d6cd6;
  }
}

.caret {
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;

  &[data-dir='down'] {
    border-top: 5px solid currentColor;
    color: #298fff;
  }

  &[data-dir='up'] {
    border-bottom: 5px solid currentColor;
    color: #298fff;
  }
}

.search-empty {
  padding: 20px 8px;
  font-size: 12px;
  color: #9ba6b8;
  text-align: center;
  background: #fff;
  border-radius: 10px;
  border: 1px dashed rgba(0, 0, 0, 0.06);
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.type-item {
  position: relative;
  padding: 10px 8px 8px;
  border-radius: 10px;
  background: #fff;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.16s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;

  &:hover {
    border-color: rgba(41, 143, 255, 0.3);
    transform: translateY(-1px);
  }

  &.active {
    border-color: #298fff;
    background: rgba(41, 143, 255, 0.06);
    box-shadow: 0 2px 8px rgba(41, 143, 255, 0.12);
  }
}

.type-item-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;

  .active & {
    color: #298fff;
  }
}

.type-item-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.meta-tag {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 600;
  line-height: 1.4;

  &.tag-2D {
    color: #7c3aed;
    background: rgba(124, 58, 237, 0.1);
  }
  &.tag-1D {
    color: #059669;
    background: rgba(5, 150, 105, 0.1);
  }
  &.tag-Postal {
    color: #d97706;
    background: rgba(217, 119, 6, 0.1);
  }
  &.tag-Stacked {
    color: #0891b2;
    background: rgba(8, 145, 178, 0.1);
  }
}

.meta-bcid {
  font-size: 10px;
  color: #a0aabf;
  font-weight: 500;
  padding: 1px 5px;
  background: rgba(0, 0, 0, 0.035);
  border-radius: 5px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.input-hint {
  margin-top: 6px;
  padding: 4px 8px;
  font-size: 11px;
  color: #7c87a0;
  background: rgba(245, 158, 11, 0.08);
  border-radius: 6px;
  line-height: 1.4;
}

.colors-section {
  background: rgba(255, 255, 255, 0.55);
  border-radius: 12px;
  padding: 10px 10px 12px;
  margin-left: -2px;
  margin-right: -2px;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 14px;
  justify-content: space-between;
  padding: 0 4px;
}

.color-item-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.preview-section {
  padding-bottom: 4px;
}

.preview-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  padding: 12px;
  border-radius: 12px;
  background:
    linear-gradient(45deg, #f1f2f4 25%, transparent 25%) 0 0 / 12px 12px,
    linear-gradient(-45deg, #f1f2f4 25%, transparent 25%) 0 6px / 12px 12px,
    linear-gradient(45deg, transparent 75%, #f1f2f4 75%) 6px -6px / 12px 12px,
    linear-gradient(-45deg, transparent 75%, #f1f2f4 75%) -6px 0 / 12px 12px,
    #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;

  canvas {
    max-width: 100%;
    max-height: 150px;
    background: #fff;
    border-radius: 4px;
  }
}

.preview-tip {
  margin-top: 10px;
  font-size: 11.5px;
  color: #8b95a7;
  text-align: center;
  padding: 6px 10px;
  background: rgba(41, 143, 255, 0.05);
  border-radius: 8px;
}
</style>
