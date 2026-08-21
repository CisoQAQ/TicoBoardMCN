<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px" :close-on-click-modal="false" @close="handleClose">
    <div class="barcode-config">
      <div class="config-row">
        <div class="config-label">条码类型</div>
        <div class="config-value">
          <div class="type-list">
            <div
              v-for="item in barcodeTypeList"
              :key="item.value"
              class="type-item"
              :class="{ active: localConfig.type === item.value }"
              @click="setType(item.value)"
            >
              <SvgIcon :name="item.icon" size="22px" :color="localConfig.type === item.value ? '#fff' : '#298fff'" />
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="config-row">
        <div class="config-label">条码内容</div>
        <div class="config-value">
          <el-input v-model="localConfig.value" type="textarea" :rows="3" placeholder="请输入条码内容" resize="none" />
        </div>
      </div>

      <div class="config-row">
        <div class="config-label">缩放比例 {{ localConfig.scale }}</div>
        <div class="config-value">
          <el-slider v-model="localConfig.scale" :min="1" :max="10" :step="1" show-input :input-size="'small'" />
        </div>
      </div>

      <div class="config-row">
        <div class="config-label">颜色配置</div>
        <div class="config-value color-row">
          <div class="color-item-box">
            <span class="color-label">前景色</span>
            <el-color-picker v-model="localConfig.foregroundColor" show-alpha />
          </div>
          <div class="color-item-box">
            <span class="color-label">背景色</span>
            <el-color-picker v-model="localConfig.backgroundColor" show-alpha />
          </div>
        </div>
      </div>

      <div class="config-row">
        <div class="config-label">预览</div>
        <div class="config-value">
          <div class="preview-box">
            <canvas ref="previewCanvasRef"></canvas>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确认并绘制</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useToolStore } from '../store/tool';
import bwipjs from 'bwip-js';
const toolStore = useToolStore();
const emit = defineEmits(['confirm']);
const previewCanvasRef = ref(null);
const barcodeTypeList = [
  { value: 'qrcode', label: '二维码', icon: 'qrcode' },
  { value: 'code128', label: 'Code128', icon: 'barcode' },
];

const localConfig = ref({
  type: 'qrcode',
  value: 'https://example.com',
  scale: 2,
  backgroundColor: '#ffffff',
  foregroundColor: '#000000',
});

const dialogVisible = computed({
  get() {
    return toolStore.barcodeDialogVisible;
  },
  set(val) {
    toolStore.setBarcodeDialogVisible(val);
  },
});

const dialogTitle = computed(() => {
  const item = barcodeTypeList.find(t => t.value === localConfig.value.type);
  return item ? `${item.label}配置` : '条码配置';
});

watch(
  () => toolStore.barcodeDialogVisible,
  val => {
    if (val) {
      localConfig.value = { ...toolStore.barcodeConfig };
      nextTick(() => {
        renderPreview();
      });
    }
  }
);

watch(
  () => localConfig.value,
  () => {
    nextTick(() => {
      renderPreview();
    });
  },
  { deep: true }
);

function setType(type) {
  localConfig.value.type = type;
  if (type === 'qrcode' && !localConfig.value.value) {
    localConfig.value.value = 'https://example.com';
  } else if (type === 'code128' && !localConfig.value.value) {
    localConfig.value.value = '1234567890';
  }
}

function renderPreview() {
  const canvas = previewCanvasRef.value;
  if (!canvas) return;

  const { type, value, scale, backgroundColor, foregroundColor } = localConfig.value;

  if (!value) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  try {
    const options = {
      bcid: type,
      text: value,
      scale: scale,
      backgroundcolor: hexToRgba(backgroundColor),
      color: hexToRgba(foregroundColor),
      paddingwidth: 10,
      paddingheight: 10,
    };

    if (type === 'qrcode') {
      options.eclevel = 'M';
    }

    if (type === 'code128') {
      options.includetext = true;
      options.textgaps = 1;
    }

    bwipjs.toCanvas(canvas, options);
  } catch (err) {
    console.error('条码生成失败:', err);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4444';
    ctx.font = '14px sans-serif';
    ctx.fillText('生成失败: ' + (err.message || '参数错误'), 10, 30);
  }
}

function hexToRgba(color) {
  if (!color) return 'ffffff';
  color = String(color).trim();

  if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/);
    if (match) {
      const r = Math.max(0, Math.min(255, Number(match[1])));
      const g = Math.max(0, Math.min(255, Number(match[2])));
      const b = Math.max(0, Math.min(255, Number(match[3])));
      return `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }

  if (color.startsWith('#')) {
    color = color.substring(1);
  }

  if (color.length === 3) {
    color = color
      .split('')
      .map(c => c + c)
      .join('');
  }

  if (color.length >= 6) {
    return color.substring(0, 6);
  }

  return 'ffffff';
}

function handleClose() {
  toolStore.closeBarcodeDialog();
}

function handleConfirm() {
  if (!localConfig.value.value) {
    alert('请输入条码内容');
    return;
  }

  toolStore.updateBarcodeConfig({ ...localConfig.value });
  emit('confirm', { ...localConfig.value });
  toolStore.closeBarcodeDialog();
}
</script>

<style lang="scss" scoped>
.barcode-config {
  padding: 8px 0;
}

.config-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.config-label {
  width: 90px;
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
  line-height: 32px;
}

.config-value {
  flex: 1;
}

.type-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;

  &:hover {
    border-color: #298fff;
    background: #ecf5ff;
  }

  &.active {
    background: #298fff;
    border-color: #298fff;
    color: #fff;
  }
}

.color-row {
  display: flex;
  gap: 24px;
}

.color-item-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-label {
  font-size: 13px;
  color: #606266;
}

.preview-box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  min-height: 160px;

  canvas {
    max-width: 100%;
    background: #fff;
    border: 1px solid #e4e7ed;
  }
}
</style>
