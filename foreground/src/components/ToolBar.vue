<template>
  <div ref="toolBarRef" class="toolBar" @wheel.stop.prevent="handleWheel" @mousedown.stop @mousemove.stop @mouseup.stop @click.stop>
    <el-tooltip v-for="item in toolList" :key="item.name" effect="dark" :content="item.label" placement="left">
      <div class="icon-wrapper">
        <div class="iconBox" :class="{ active: toolStore.activeTool === item.name }" @click.stop="handleClick(item)">
          <SvgIcon :name="item.name" :size="item.size || '22px'" :color="toolStore.activeTool === item.name ? '#fff' : '#298fff'" />
        </div>
      </div>
    </el-tooltip>
  </div>

  <!-- 点击图形工具后，右侧直接展开配置面板 -->
  <ShapeConfigPanel v-if="toolStore.activeTool === 'rectangle'" />
  <PenConfigPanel v-if="toolStore.activeTool === 'pen'" />
  <ImageConfigPanel v-if="toolStore.activeTool === 'image'" />
  <QrcodeConfigPanel v-if="toolStore.activeTool === 'qrcode'" />
  <BarcodeConfigPanel v-if="toolStore.activeTool === 'barcode'" />
</template>

<script setup>
import { ref } from 'vue';
import { useToolStore } from '../store/tool';
import ShapeConfigPanel from './ShapeConfigPanel.vue';
import PenConfigPanel from './PenConfigPanel.vue';
import ImageConfigPanel from './ImageConfigPanel.vue';
import QrcodeConfigPanel from './QrcodeConfigPanel.vue';
import BarcodeConfigPanel from './BarcodeConfigPanel.vue';

const toolStore = useToolStore();
const toolBarRef = ref(null);

const toolList = ref([
  { name: 'select', label: '选择', size: '24px' },
  { name: 'pen', label: '画笔' },
  { name: 'map-connection', label: '连线' },
  { name: 'rectangle', label: '图形' },
  { name: 'text-size', label: '文本' },
  { name: 'image', label: '图片' },
  { name: 'upload', label: '上传' },
  { name: 'card', label: '卡片' },
  { name: 'qrcode', label: '二维码' },
  { name: 'barcode', label: '条形码' },
  { name: 'line-template', label: '模版' },
]);

const handleClick = item => {
  const currentActive = toolStore.getActiveTool();

  // 再次点击当前工具，取消激活
  if (item.name === currentActive) {
    toolStore.setActiveTool(null);
    return;
  }
  // 激活当前工具
  toolStore.setActiveTool(item.name);
};

/**
 * 鼠标在工具栏区域内滚动时：
 */
const handleWheel = e => {
  const el = toolBarRef.value;
  if (!el) return;

  el.scrollTop += e.deltaY;
};
</script>

<style lang="scss" scoped>
.toolBar {
  width: 48px;
  height: 70%;
  background-color: #f6f6f7;
  border-radius: 20px;
  position: absolute;
  top: 15%;
  z-index: 10;
  left: 15px;
  padding: 12px;
  box-shadow:
    rgb(101 119 134 / 20%) 0px 0px 15px,
    rgb(101 119 134 / 15%) 0px 0px 3px 1px;

  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  .icon-wrapper {
    position: relative;
  }

  .iconBox {
    background: #fff;
    width: 100%;
    height: 48px;
    border-radius: 10px;
    margin-top: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover {
      background-color: #ecf5ff;
    }

    &.active {
      background-color: #298fff;
    }
  }
}
</style>
