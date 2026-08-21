<template>
  <Teleport to="body">
    <div v-if="visible" class="gallery-mask" @click.self="handleClose">
      <div class="gallery-dialog" @mousedown.stop @click.stop>
        <!-- 顶部：返回 + 源下拉选择 + 标题 + 上传 icon -->
        <div class="gallery-header">
          <div class="header-left">
            <button class="back-btn" @click="handleClose">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              <span>返回</span>
            </button>

            <div class="source-dropdown-wrap" @click.stop>
              <button class="source-trigger-btn" type="button" @click="sourceDropdownOpen = !sourceDropdownOpen">
                <span class="source-icon" v-html="currentSourceObj.iconSvg"></span>
                <svg
                  class="caret-icon"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  :style="{ transform: sourceDropdownOpen ? 'rotate(180deg)' : '' }"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div v-if="sourceDropdownOpen" class="source-dropdown-menu">
                <div
                  v-for="src in sources"
                  :key="src.id"
                  class="source-dropdown-item"
                  :class="{ active: currentSource === src.id }"
                  @click="switchSource(src.id)"
                >
                  <span class="sd-icon" v-html="src.iconSvg"></span>
                  <span class="sd-name">{{ src.name }}</span>
                  <svg
                    v-if="currentSource === src.id"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#298fff"
                    stroke-width="2.5"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            <h2 class="gallery-title">图库</h2>
          </div>

          <div class="header-right">
            <label class="header-icon-btn" title="上传本地图片">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <input type="file" accept="image/*" class="hidden-input" @change="handleHeaderUpload" />
            </label>
          </div>
        </div>

        <!-- 搜索栏：左侧源icon + 放大镜 + 输入框 + 取消 -->
        <div class="gallery-search-bar">
          <div class="search-input-wrap">
            <span class="search-source-icon" v-html="currentSourceObj.iconSvg"></span>
            <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              ref="searchInputRef"
              v-model="searchKeyword"
              type="text"
              class="search-input"
              placeholder="搜索图片（输入后回车）..."
              @keydown.enter="handleSearch"
              @focus="sourceDropdownOpen = false"
            />
            <button v-if="searchKeyword" class="clear-btn" type="button" @click="clearSearch">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <button class="cancel-btn" type="button" @click="handleCancel">取消</button>
        </div>

        <div ref="scrollContainerRef" class="gallery-content" @scroll="handleScroll" @click="sourceDropdownOpen = false">
          <div v-if="loading && images.length === 0" class="loading-state">
            <div class="spinner"></div>
            <span>加载中...</span>
          </div>

          <div v-else-if="images.length === 0 && !loading" class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <p>{{ searchKeyword ? '没有找到相关图片，换个关键词试试' : '输入关键词开始搜索图片' }}</p>
          </div>

          <div v-else class="waterfall-columns">
            <div v-for="(col, colIdx) in waterfallColumns" :key="colIdx" class="waterfall-column">
              <div
                v-for="item in col"
                :key="item.id"
                class="waterfall-item"
                :class="{ dragging: dragItemId === item.id }"
                draggable="true"
                @dragstart="handleDragStart($event, item)"
                @dragend="handleDragEnd"
              >
                <img v-if="item.loaded" :src="item.thumbUrl" :style="{ height: item.displayHeight + 'px' }" draggable="false" />
                <div v-else class="image-placeholder" :style="{ height: item.displayHeight + 'px' }">
                  <div class="ph-skeleton"></div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="loading && images.length > 0" class="loading-more">
            <div class="spinner small"></div>
            <span>加载更多...</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

const props = defineProps({ visible: { type: Boolean, default: false } });
const emit = defineEmits(['update:visible', 'close']);

const COL_COUNT = 3;
const PAGE_SIZE = 18;
const LOAD_THRESHOLD = 200;

const searchInputRef = ref(null);
const scrollContainerRef = ref(null);
const currentSource = ref('baidu');
const sourceDropdownOpen = ref(false);
const searchKeyword = ref('');
const images = ref([]);
const loading = ref(false);
const page = ref(1);
const hasMore = ref(true);
const dragItemId = ref(null);
let seedCounter = 0;

const sources = [
  {
    id: 'baidu',
    name: '百度图片',
    iconSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#2319dc" opacity="0.08"/>
      <path d="M7.5 7.2c.8-1.3 2.1-2.2 3.8-2.2 2.6 0 4.7 2.1 4.7 4.7 0 .7-.2 1.4-.4 2 1 .5 1.9 1.3 2.4 2.5.8 1.8.1 4-1.7 4.8-.6.3-1.3.4-2 .3H8.5c-2.4 0-4.5-1.9-4.5-4.5 0-1.7.9-3.1 2.3-3.9-.3-.7-.5-1.4-.5-2 0-.5.1-1 .4-1.7h1.3z" fill="#2932e1" stroke="#2932e1" stroke-width="0.8"/>
      <circle cx="9.2" cy="9.5" r="1.1" fill="#fff"/>
      <circle cx="13.3" cy="9.5" r="1.1" fill="#fff"/>
    </svg>`,
  },
  {
    id: 'unsplash',
    name: 'Unsplash',
    iconSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" fill="#000" opacity="0.9"/>
      <path d="M7 10V8h3v2H7zm7 0V8h3v2h-3zm-8 3h11v4H6v-4z" fill="#fff"/>
    </svg>`,
  },
];

const currentSourceObj = computed(() => sources.find(s => s.id === currentSource.value) || sources[0]);

const hashString = str => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

/**
 * 核心：使用 LoremFlickr 按真实关键词返回对应图片
 * 例如 cat → 真的是猫咪照片，不再是随机图
 */
const generateImages = (keyword, pageNum, sourceId) => {
  const results = [];
  const seedBase = pageNum * 1000 + (keyword ? hashString(keyword) * 17 : 0);
  const ratios = [0.75, 1, 1.25, 1.33, 1.5, 0.66, 0.8, 1.4];

  for (let i = 0; i < PAGE_SIZE; i++) {
    const seed = seedBase + i + seedCounter++;
    const width = 400;
    const heightRatio = ratios[seed % ratios.length];
    const height = Math.round(width * heightRatio);

    const kwRaw = (keyword || '').trim();
    let kwParam;
    if (kwRaw) {
      // 分词（支持 空格/逗号/+ 分隔多个关键词）
      const parts = kwRaw.split(/[\s,，+]+/).filter(Boolean);
      if (sourceId === 'baidu') {
        // 百度源：常用中文→英文映射表，提高中文搜索命中率
        const extraEn = {
          猫: 'cat,kitten',
          狗: 'dog,puppy',
          花: 'flower',
          山: 'mountain',
          海: 'ocean,beach',
          天空: 'sky,cloud',
          汽车: 'car,vehicle',
          美食: 'food',
          女孩: 'girl',
          男孩: 'boy',
          房子: 'house,building',
          树: 'tree,forest',
          城市: 'city',
          建筑: 'architecture',
          食物: 'food',
          水果: 'fruit',
          动物: 'animal',
          风景: 'landscape',
          人物: 'people',
          咖啡: 'coffee',
        };
        const extra = parts.map(p => extraEn[p]).filter(Boolean);
        kwParam = [...parts, ...extra].join(',');
      } else {
        kwParam = parts.join(',');
      }
      if (!kwParam) kwParam = 'nature';
    } else {
      kwParam = 'nature,landscape';
    }

    const tw = 400;
    const th = Math.round(tw * heightRatio);
    const fw = 1200;
    const fh = Math.round(fw * heightRatio);
    // ?lock=seed 保证同一关键词+同一seed返回同一张（避免抖动）
    const thumbUrl = `https://loremflickr.com/${tw}/${th}/${encodeURIComponent(kwParam)}?lock=${seed}`;
    const fullUrl = `https://loremflickr.com/${fw}/${fh}/${encodeURIComponent(kwParam)}?lock=${seed}`;

    results.push({
      id: `${sourceId}-${pageNum}-${i}-${seed}`,
      seed,
      width,
      height,
      displayHeight: 0,
      thumbUrl,
      fullUrl,
      loaded: false,
    });
  }
  return results;
};

const waterfallColumns = computed(() => {
  const cols = Array.from({ length: COL_COUNT }, () => []);
  const colHeights = Array(COL_COUNT).fill(0);
  for (const img of images.value) {
    let minIdx = 0;
    for (let i = 1; i < COL_COUNT; i++) if (colHeights[i] < colHeights[minIdx]) minIdx = i;
    cols[minIdx].push(img);
    colHeights[minIdx] += (img.displayHeight || 150) + 8;
  }
  return cols;
});

const handleClose = () => {
  sourceDropdownOpen.value = false;
  emit('update:visible', false);
  emit('close');
};

const switchSource = sourceId => {
  sourceDropdownOpen.value = false;
  if (currentSource.value === sourceId) return;
  currentSource.value = sourceId;
  resetAndSearch();
};

const clearSearch = () => {
  searchKeyword.value = '';
};
const handleCancel = () => {
  searchKeyword.value = '';
};
const handleSearch = () => {
  resetAndSearch();
};

const resetAndSearch = async () => {
  page.value = 1;
  hasMore.value = true;
  images.value = [];
  await loadNextPage();
  nextTick(() => {
    if (scrollContainerRef.value) scrollContainerRef.value.scrollTop = 0;
    preloadVisibleImages();
  });
};

const loadNextPage = async () => {
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  await new Promise(r => setTimeout(r, 250));
  const newImages = generateImages(searchKeyword.value, page.value, currentSource.value);
  newImages.forEach(img => {
    const colWidth = (scrollContainerRef.value?.clientWidth || 300) / COL_COUNT - 8;
    const ratio = img.height / img.width;
    img.displayHeight = Math.round(colWidth * ratio);
  });
  images.value = [...images.value, ...newImages];
  page.value++;
  if (page.value > 10) hasMore.value = false;
  loading.value = false;
  nextTick(preloadVisibleImages);
};

const preloadVisibleImages = () => {
  images.value.forEach((img, idx) => {
    if (idx < 12 && !img.loaded) img.loaded = true;
  });
  if (!scrollContainerRef.value) return;
  const container = scrollContainerRef.value;
  const viewTop = container.scrollTop;
  const viewBottom = viewTop + container.clientHeight + 400;
  const colEls = container.querySelectorAll('.waterfall-column');
  const colArrays = Array.from(colEls).map(c => Array.from(c.children));
  const flatMap = new Map();
  let pos = 0;
  const maxLen = Math.max(...colArrays.map(a => a.length));
  for (let row = 0; row < maxLen; row++) {
    for (let c = 0; c < colArrays.length; c++) {
      const el = colArrays[c][row];
      if (el) {
        flatMap.set(el, pos);
        pos++;
      }
    }
  }
  flatMap.forEach((idx, el) => {
    const top = el.offsetTop;
    const h = el.offsetHeight || 150;
    if (top + h >= viewTop && top <= viewBottom) {
      if (images.value[idx] && !images.value[idx].loaded) images.value[idx].loaded = true;
    }
  });
};

const handleScroll = () => {
  sourceDropdownOpen.value = false;
  if (!scrollContainerRef.value) return;
  const el = scrollContainerRef.value;
  const distToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
  preloadVisibleImages();
  if (distToBottom < LOAD_THRESHOLD && hasMore.value && !loading.value) loadNextPage();
};

const handleDragStart = (e, item) => {
  dragItemId.value = item.id;
  try {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        type: 'gallery-image',
        fullUrl: item.fullUrl,
        thumbUrl: item.thumbUrl,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  } catch (err) {
    console.warn('dragstart error:', err);
  }
  window.dispatchEvent(new CustomEvent('gallery-drag-start', { detail: { image: item } }));
};

const handleDragEnd = () => {
  const endedId = dragItemId.value;
  dragItemId.value = null;
  window.dispatchEvent(new CustomEvent('gallery-drag-end', { detail: { imageId: endedId } }));
};

const handleHeaderUpload = e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    window.dispatchEvent(
      new CustomEvent('add-image-from-dataurl', {
        detail: { dataUrl: evt.target.result, center: true },
      })
    );
  };
  reader.readAsDataURL(file);
  e.target.value = '';
};

const handleGlobalClick = () => {
  if (sourceDropdownOpen.value) sourceDropdownOpen.value = false;
};

watch(
  () => props.visible,
  val => {
    if (val) {
      nextTick(() => {
        searchInputRef.value?.focus();
        if (images.value.length === 0) loadNextPage();
      });
      document.addEventListener('click', handleGlobalClick, true);
    } else {
      document.removeEventListener('click', handleGlobalClick, true);
      sourceDropdownOpen.value = false;
    }
  },
  { immediate: true }
);

let resizeObserver = null;
onMounted(() => {
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => {
      images.value = images.value.map(img => {
        const colWidth = (scrollContainerRef.value?.clientWidth || 300) / COL_COUNT - 8;
        const ratio = img.height / img.width;
        return { ...img, displayHeight: Math.round(colWidth * ratio) };
      });
    });
    nextTick(() => {
      if (scrollContainerRef.value) resizeObserver.observe(scrollContainerRef.value);
    });
  }
});
onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick, true);
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style lang="scss" scoped>
.gallery-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.gallery-dialog {
  width: 420px;
  height: 640px;
  max-height: 85vh;
  background: #fff;
  border-radius: 18px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  margin-left: 200px;
  position: relative;
}
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* ===== 顶栏 ===== */
.gallery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.back-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  border: none;
  background: transparent;
  color: #298fff;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 6px;
  border-radius: 6px;
  margin-left: -6px;
  transition: background 0.15s;
  &:hover {
    background: #ecf5ff;
  }
}
.gallery-title {
  font-size: 17px;
  font-weight: 600;
  color: #222;
  margin: 0;
}

/* 源下拉菜单 */
.source-dropdown-wrap {
  position: relative;
  z-index: 10;
}
.source-trigger-btn {
  width: 40px;
  height: 36px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  color: #555;
  transition: all 0.15s;
  &:hover {
    border-color: #298fff;
    color: #298fff;
  }
  .source-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    :deep(svg) {
      width: 22px;
      height: 22px;
    }
  }
  .caret-icon {
    flex-shrink: 0;
    transition: transform 0.2s;
    color: #999;
  }
}
.source-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 160px;
  background: #fff;
  border-radius: 12px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  padding: 6px;
  z-index: 20;
  animation: menuIn 0.15s ease;
}
@keyframes menuIn {
  from {
    transform: translateY(-4px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.source-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
  &:hover {
    background: #f5f7fa;
  }
  &.active {
    background: #ecf5ff;
  }
  .sd-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    :deep(svg) {
      width: 26px;
      height: 26px;
    }
  }
  .sd-name {
    flex: 1;
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }
}
.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 4px;
}
.header-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #555;
  background: transparent;
  transition: all 0.15s;
  position: relative;
  &:hover {
    background: #ecf5ff;
    color: #298fff;
  }
  .hidden-input {
    display: none;
  }
}

/* ===== 搜索栏 ===== */
.gallery-search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px 14px;
  flex-shrink: 0;
}
.search-input-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: #f5f6f8;
  border-radius: 10px;
  padding: 0 10px;
  height: 38px;
  transition: all 0.15s;
  &:focus-within {
    background: #fff;
    box-shadow: 0 0 0 2px rgba(41, 143, 255, 0.25);
  }
}
.search-source-icon {
  margin-right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  :deep(svg) {
    width: 22px;
    height: 22px;
  }
}
.search-icon {
  color: #aaa;
  flex-shrink: 0;
  margin-left: 2px;
}
.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  padding: 0 8px;
  font-size: 14px;
  color: #333;
  height: 100%;
  &::placeholder {
    color: #bbb;
  }
}
.clear-btn {
  border: none;
  background: transparent;
  color: #bbb;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  border-radius: 50%;
  transition: all 0.15s;
  &:hover {
    background: #e5e5e5;
    color: #666;
  }
}
.cancel-btn {
  border: none;
  background: transparent;
  color: #298fff;
  cursor: pointer;
  font-size: 14px;
  padding: 6px 2px;
  flex-shrink: 0;
  font-weight: 500;
  &:hover {
    opacity: 0.75;
  }
}

/* ===== 内容区 ===== */
.gallery-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 20px;
  scrollbar-width: thin;
  scrollbar-color: #d0d0d0 transparent;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #d0d0d0;
    border-radius: 3px;
  }
}
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #aaa;
  gap: 12px;
}
.empty-state svg {
  opacity: 0.5;
}
.empty-state p {
  font-size: 14px;
  margin: 0;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e5e5;
  border-top-color: #298fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  &.small {
    width: 18px;
    height: 18px;
    border-width: 2px;
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.waterfall-columns {
  display: flex;
  gap: 8px;
}
.waterfall-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.waterfall-item {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  cursor: grab;
  background: #f0f0f0;
  transition: all 0.2s;
  user-select: none;
  img {
    width: 100%;
    display: block;
    object-fit: cover;
    pointer-events: none;
  }
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border: 2px solid rgba(41, 143, 255, 0.6);
      border-radius: 10px;
      pointer-events: none;
    }
  }
  &:active,
  &.dragging {
    cursor: grabbing;
    opacity: 0.6;
    transform: scale(0.98);
  }
}
.image-placeholder {
  width: 100%;
  background: #eee;
  border-radius: 10px;
  overflow: hidden;
}
.ph-skeleton {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: #999;
  font-size: 13px;
}
</style>
