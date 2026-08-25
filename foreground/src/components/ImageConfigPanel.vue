<template>
  <div class="image-config-panel-root" @wheel.stop>
    <div class="image-config-panel" @wheel.stop>
      <!-- ========== 图片素材 小节 ========== -->
      <div class="config-section material-section">
        <div class="material-icon-wrap">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </div>
        <div class="material-text">
          <div class="material-title">图片素材</div>
          <div class="material-sub">搜索图库或上传图片</div>
        </div>
      </div>

      <!-- ========== 一行合并布局：源下拉 + 输入框（原"图库"标题已删除） ========== -->
      <div class="gallery-search-bar merged-row">
        <!-- 源下拉按钮 -->
        <div class="source-dropdown-wrap" @click.stop>
          <button class="source-trigger-btn" type="button" @click="sourceDropdownOpen = !sourceDropdownOpen">
            <span class="source-icon" v-html="currentSourceObj.iconSvg"></span>
            <svg
              class="caret-icon"
              width="11"
              height="11"
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
            <!-- 图源 -->
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
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#298fff"
                stroke-width="2.5"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <!-- 分隔 + 上传 -->
            <div class="sd-divider"></div>
            <div class="source-dropdown-item upload-item" @click="triggerHeaderUpload">
              <span class="sd-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </span>
              <span class="sd-name" style="color: #555">上传本地图片</span>
            </div>
          </div>
        </div>

        <!-- 搜索输入框：占满剩余 -->
        <div class="search-input-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- ========== 瀑布流图片 ========== -->
      <div ref="scrollContainerRef" class="gallery-content" @wheel.stop @scroll="handleScroll" @click="sourceDropdownOpen = false">
        <div v-if="loading && images.length === 0" class="loading-state">
          <div class="spinner"></div>
          <span>加载中...</span>
        </div>

        <div v-else-if="(images.length === 0 && !loading) || searchError || showLoadFailedError" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <p>
            {{
              searchError ||
              (showLoadFailedError
                ? '部分图片加载失败，请稍后重试或尝试其他关键词'
                : searchKeyword
                  ? '没有找到相关图片，换个关键词试试'
                  : '输入关键词开始搜索图片')
            }}
          </p>
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
              <img
                v-if="item.loaded"
                :src="item.useFallback ? item.fallbackThumbUrl : item.thumbUrl"
                :style="{ height: item.displayHeight + 'px' }"
                draggable="false"
                @error="handleImageError(item)"
              />
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

      <input ref="hiddenUploadInput" type="file" accept="image/*" class="hidden-file" @change="handleLocalFile" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useToolStore } from '../store/tool';
import { searchBaiduImages } from '../api/imageSearch';

const toolStore = useToolStore();

const COL_COUNT = 3;
const PAGE_SIZE = 18;
const LOAD_THRESHOLD = 200;

const searchInputRef = ref(null);
const scrollContainerRef = ref(null);
const hiddenUploadInput = ref(null);
const currentSource = ref('baidu');
const sourceDropdownOpen = ref(false);
const searchKeyword = ref('');
const images = ref([]);
const loading = ref(false);
const page = ref(1);
const hasMore = ref(true);
const dragItemId = ref(null);
const searchError = ref('');
let seedCounter = 0;

const baiduLoadFailedCount = computed(() => {
  if (currentSource.value !== 'baidu') return 0;
  return images.value.filter(img => img.loadFailed).length;
});

const showLoadFailedError = computed(() => {
  if (currentSource.value === 'baidu' && baiduLoadFailedCount.value > 0) {
    const total = images.value.length;
    const failed = baiduLoadFailedCount.value;
    return failed >= total * 0.5 || failed >= 5;
  }
  return false;
});

const sources = [
  {
    id: 'baidu',
    name: '百度图片',
    iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#2319dc" opacity="0.08"/>
      <path d="M7.5 7.2c.8-1.3 2.1-2.2 3.8-2.2 2.6 0 4.7 2.1 4.7 4.7 0 .7-.2 1.4-.4 2 1 .5 1.9 1.3 2.4 2.5.8 1.8.1 4-1.7 4.8-.6.3-1.3.4-2 .3H8.5c-2.4 0-4.5-1.9-4.5-4.5 0-1.7.9-3.1 2.3-3.9-.3-.7-.5-1.4-.5-2 0-.5.1-1 .4-1.7h1.3z" fill="#2932e1" stroke="#2932e1" stroke-width="0.8"/>
      <circle cx="9.2" cy="9.5" r="1.1" fill="#fff"/>
      <circle cx="13.3" cy="9.5" r="1.1" fill="#fff"/>
    </svg>`,
  },
  {
    id: 'unsplash',
    name: 'Unsplash',
    iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
      const parts = kwRaw.split(/[\s,，+]+/).filter(Boolean);
      if (sourceId === 'baidu') {
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
          海贼王: 'one piece,anime,luffy,pirate',
          路飞: 'luffy,one piece,anime',
          索隆: 'zoro,one piece,anime',
          娜美: 'nami,one piece,anime',
          火影: 'naruto,anime',
          鸣人: 'naruto,anime',
          佐助: 'sasuke,naruto,anime',
          鬼灭之刃: 'demon slayer,anime,tanjiro',
          炭治郎: 'tanjiro,demon slayer,anime',
          进击的巨人: 'attack on titan,anime,eren',
          咒术回战: 'jujutsu kaisen,anime,gojo',
          五条悟: 'gojo,jujutsu kaisen,anime',
          动漫: 'anime,manga',
          漫画: 'manga,anime',
          游戏: 'game,gaming',
          电竞: 'esports,gaming',
          英雄联盟: 'league of legends,lol,game',
          王者荣耀: 'mobile legends,game,esports',
          原神: 'genshin impact,game,anime',
          动漫人物: 'anime character,cartoon',
          卡通: 'cartoon,animation',
          迪士尼: 'disney,cartoon',
          漫威: 'marvel,superhero,avengers',
          蜘蛛侠: 'spiderman,marvel,superhero',
          钢铁侠: 'ironman,marvel,avengers',
          DC: 'dc comics,superhero,batman',
          蝙蝠侠: 'batman,dc comics,superhero',
          超人: 'superman,dc comics,superhero',
          电影: 'movie,cinema,film',
          明星: 'celebrity,star',
          音乐: 'music,concert',
          吉他: 'guitar,music',
          钢琴: 'piano,music',
          运动: 'sports,fitness',
          篮球: 'basketball,nba,sports',
          足球: 'football,soccer,sports',
          羽毛球: 'badminton,sports',
          乒乓球: 'table tennis,ping pong,sports',
          游泳: 'swimming,water,sports',
          跑步: 'running,jogging,sports',
          健身: 'fitness,gym,workout',
          瑜伽: 'yoga,fitness,meditation',
          旅行: 'travel,trip,adventure',
          度假: 'vacation,holiday,beach',
          雪山: 'snow mountain,alps,winter',
          湖泊: 'lake,water,nature',
          河流: 'river,water,nature',
          瀑布: 'waterfall,nature',
          森林: 'forest,woods,tree',
          沙漠: 'desert,sand,nature',
          星空: 'stars,night sky,galaxy,space',
          宇宙: 'space,galaxy,universe,planet',
          科技: 'technology,tech,digital',
          电脑: 'computer,laptop,tech',
          手机: 'phone,smartphone,mobile',
          机器人: 'robot,ai,technology',
          人工智能: 'ai,robot,technology,future',
          未来: 'future,cyber,sci fi,technology',
          赛博朋克: 'cyberpunk,neon,future,city',
          复古: 'vintage,retro,old',
          怀旧: 'nostalgia,retro,vintage',
          艺术: 'art,painting,creative',
          绘画: 'painting,drawing,art',
          摄影: 'photography,camera,art',
          时尚: 'fashion,style,model',
          美妆: 'makeup,beauty,cosmetics',
          穿搭: 'outfit,fashion,style,clothing',
          美食家: 'gourmet,food,cooking,chef',
          甜点: 'dessert,cake,sweet,bakery',
          蛋糕: 'cake,dessert,birthday,sweet',
          奶茶: 'bubble tea,milk tea,drink',
          咖啡拉花: 'latte art,coffee,cafe',
          宠物: 'pet,animal,cute',
          兔子: 'rabbit,bunny,pet,cute',
          仓鼠: 'hamster,pet,cute',
          鸟: 'bird,parrot,animal',
          鱼: 'fish,aquarium,ocean',
          海洋生物: 'marine life,ocean,fish,dolphin',
          蝴蝶: 'butterfly,insect,nature',
          花束: 'bouquet,flower,romance',
          玫瑰: 'rose,flower,romance,love',
          向日葵: 'sunflower,flower,yellow,nature',
          樱花: 'cherry blossom,sakura,flower,japan,spring',
          郁金香: 'tulip,flower,spring,nature',
          荷花: 'lotus,flower,water,summer',
          秋天: 'autumn,fall,leaves,orange,nature',
          冬天: 'winter,snow,cold,nature',
          春天: 'spring,flower,bloom,nature',
          夏天: 'summer,sun,beach,hot,nature',
          日出: 'sunrise,morning,orange,nature',
          日落: 'sunset,evening,orange,nature,beach',
          雨天: 'rain,rainy,umbrella,weather',
          雪景: 'snow,winter,christmas,nature',
          云海: 'sea of clouds,mountain,fog,nature',
          古镇: 'ancient town,old town,chinese architecture',
          故宫: 'forbidden city,chinese architecture,beijing,history',
          长城: 'great wall,china,ancient,landmark',
          中国风: 'chinese style,traditional,asian,architecture',
          和风: 'japanese style,japan,asian,traditional',
          欧式: 'european style,classic architecture,vintage',
          室内设计: 'interior design,home decor,modern house',
          客厅: 'living room,home,interior,modern',
          卧室: 'bedroom,home,cozy,interior',
          厨房: 'kitchen,home,modern,interior',
          办公室: 'office,workspace,modern,business',
          咖啡厅: 'cafe,coffee shop,cozy,interior',
          书店: 'bookstore,library,books,reading',
          图书馆: 'library,books,reading,study',
          婚礼: 'wedding,romance,bride,love,celebration',
          情侣: 'couple,love,romance,relationship',
          友谊: 'friendship,friends,people,happiness',
          家庭: 'family,love,home,people,happiness',
          宝宝: 'baby,child,cute,family',
          儿童: 'children,kids,child,young,school',
          学生: 'student,school,education,study,young',
          校园: 'campus,school,university,education,students',
          毕业: 'graduation,cap,school,achievement,student',
          办公: 'office work,business,laptop,desk,meeting',
          会议: 'meeting,business,team,office,discussion',
          团队: 'teamwork,team,business,collaboration,people',
          创业: 'startup,entrepreneur,business,idea,innovation',
          钱: 'money,finance,cash,bank,wealth',
          股票: 'stock market,finance,investment,chart,business',
          经济: 'economy,finance,business,market,growth',
          数据: 'data,analytics,chart,statistics,technology',
          图表: 'chart,graph,data,analytics,business',
          报告: 'report,paper,document,business,work',
          证书: 'certificate,diploma,award,achievement,document',
          奖杯: 'trophy,award,win,champion,success',
          奖牌: 'medal,award,win,olympics,sports',
          成功: 'success,achievement,victory,mountain top,goal',
          梦想: 'dream,goal,aspiration,future,hope',
          读书: 'reading,book,study,education,knowledge',
          书籍: 'books,library,literature,knowledge,reading',
          写字: 'writing,pen,paper,notebook,work',
          考试: 'exam,study,school,test,student',
          学习: 'study,learning,education,knowledge,student',
          教学: 'teaching,teacher,school,education,classroom',
          老师: 'teacher,professor,school,education,classroom',
          教室: 'classroom,school,education,students,desk',
          黑板: 'blackboard,school,classroom,teacher,education',
        };
        const extra = parts.map(p => extraEn[p]).filter(Boolean);
        const enParts = parts.map(p => {
          if (/[\u4e00-\u9fa5]/.test(p) && !extraEn[p]) {
            return p;
          }
          return p;
        });
        kwParam = [...enParts, ...extra].join(',');
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
      fallbackThumbUrl: thumbUrl,
      fallbackFullUrl: fullUrl,
      useFallback: false,
      loaded: false,
    });
  }
  return results;
};

const buildFallbackUrls = (keyword, seed, width, height) => {
  const kwRaw = (keyword || '').trim();
  let kwParam;
  if (kwRaw) {
    const parts = kwRaw.split(/[\s,，+]+/).filter(Boolean);
    const extraEn = {
      海贼王: 'one piece,anime,luffy,pirate',
      路飞: 'luffy,one piece,anime',
      索隆: 'zoro,one piece,anime',
      娜美: 'nami,one piece,anime',
      火影: 'naruto,anime',
      鸣人: 'naruto,anime',
      佐助: 'sasuke,naruto,anime',
      鬼灭之刃: 'demon slayer,anime,tanjiro',
      炭治郎: 'tanjiro,demon slayer,anime',
      进击的巨人: 'attack on titan,anime,eren',
      咒术回战: 'jujutsu kaisen,anime,gojo',
      五条悟: 'gojo,jujutsu kaisen,anime',
      猫: 'cat,kitten',
      狗: 'dog,puppy',
      动漫: 'anime,manga',
      漫画: 'manga,anime',
      游戏: 'game,gaming',
      原神: 'genshin impact,game,anime',
      卡通: 'cartoon,animation',
      漫威: 'marvel,superhero,avengers',
      蜘蛛侠: 'spiderman,marvel,superhero',
      钢铁侠: 'ironman,marvel,avengers',
      蝙蝠侠: 'batman,dc comics,superhero',
      超人: 'superman,dc comics,superhero',
      花: 'flower',
      山: 'mountain',
      海: 'ocean,beach',
      天空: 'sky,cloud',
      汽车: 'car,vehicle',
      美食: 'food',
      风景: 'landscape',
      人物: 'people',
      动物: 'animal',
      咖啡: 'coffee',
      水果: 'fruit',
    };
    const extra = parts.map(p => extraEn[p]).filter(Boolean);
    const enParts = parts.map(p => (/[\u4e00-\u9fa5]/.test(p) && !extraEn[p] ? p : p));
    kwParam = [...enParts, ...extra].join(',');
    if (!kwParam) kwParam = 'nature';
  } else {
    kwParam = 'nature,landscape';
  }
  const tw = 400;
  const ratio = height / width;
  const th = Math.round(tw * ratio);
  const fw = 1200;
  const fh = Math.round(fw * ratio);
  return {
    fallbackThumbUrl: `https://loremflickr.com/${tw}/${th}/${encodeURIComponent(kwParam)}?lock=${seed}`,
    fallbackFullUrl: `https://loremflickr.com/${fw}/${fh}/${encodeURIComponent(kwParam)}?lock=${seed}`,
  };
};

const handleImageError = item => {
  if (!item) return;
  if (currentSource.value === 'baidu') {
    item.loaded = false;
    item.loadFailed = true;
    return;
  }
  if (!item.useFallback) {
    item.useFallback = true;
    if (item.fallbackThumbUrl) {
      item.thumbUrl = item.fallbackThumbUrl;
      item.fullUrl = item.fallbackFullUrl || item.fallbackThumbUrl;
    }
  }
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

const switchSource = sourceId => {
  sourceDropdownOpen.value = false;
  if (currentSource.value === sourceId) return;
  currentSource.value = sourceId;
  resetAndSearch();
};

const triggerHeaderUpload = () => {
  sourceDropdownOpen.value = false;
  nextTick(() => hiddenUploadInput.value?.click());
};

const clearSearch = () => {
  searchKeyword.value = '';
};
const handleSearch = () => {
  resetAndSearch();
};

const resetAndSearch = async () => {
  page.value = 1;
  hasMore.value = true;
  images.value = [];
  searchError.value = '';
  await loadNextPage();
  nextTick(async () => {
    if (scrollContainerRef.value) scrollContainerRef.value.scrollTop = 0;
    preloadVisibleImages();
    // 搜索兜底：内容不足 2 页高度 → 自动补到能滚动为止
    for (let i = 0; i < 4; i++) {
      await new Promise(r => setTimeout(r, 60));
      preloadVisibleImages();
      if (!scrollContainerRef.value) break;
      if (scrollContainerRef.value.scrollHeight > scrollContainerRef.value.clientHeight + 20) break;
      if (hasMore.value && !loading.value) await loadNextPage();
    }
  });
};

const loadNextPage = async () => {
  if (loading.value || !hasMore.value) return;
  loading.value = true;

  let newImages = [];
  const kw = searchKeyword.value.trim();

  if (currentSource.value === 'baidu' && kw) {
    console.log(currentSource.value, '1');
    try {
      const pn = (page.value - 1) * PAGE_SIZE;
      newImages = await searchBaiduImages({ word: kw, pn, rn: PAGE_SIZE });

      if (newImages.length === 0) {
        hasMore.value = false;
        searchError.value = '未找到相关图片，请尝试其他关键词';
      }
      if (newImages.length < PAGE_SIZE) {
        hasMore.value = false;
      }
    } catch (err) {
      console.warn('百度图片搜索失败:', err);
      hasMore.value = false;
      searchError.value = '图片搜索失败，请稍后重试';
    }
  } else {
    await new Promise(r => setTimeout(r, 250));
    newImages = generateImages(kw, page.value, currentSource.value);
  }

  newImages.forEach((img, idx) => {
    const colWidth = (scrollContainerRef.value?.clientWidth || 300) / COL_COUNT - 8;
    const w = img.width || 400;
    const h = img.height || Math.round(w * 1.2);
    const ratio = h / w;
    img.displayHeight = Math.round(colWidth * ratio);
    img.width = w;
    img.height = h;
    if (img.fallbackThumbUrl === undefined) {
      const seed = img.seed != null ? img.seed : (page.value - 1) * PAGE_SIZE + idx;
      const fb = buildFallbackUrls(kw, seed, w, h);
      img.fallbackThumbUrl = fb.fallbackThumbUrl;
      img.fallbackFullUrl = fb.fallbackFullUrl;
      img.useFallback = false;
    }
  });
  images.value = [...images.value, ...newImages];
  page.value++;
  if (page.value > 10) hasMore.value = false;
  loading.value = false;
  nextTick(preloadVisibleImages);
};

const preloadVisibleImages = () => {
  if (!scrollContainerRef.value) {
    // 容器还未挂载，默认至少加载 18 张（1 页满），保证能滚起来
    images.value.forEach((img, idx) => {
      if (idx < 18 && !img.loaded) img.loaded = true;
    });
    return;
  }
  const container = scrollContainerRef.value;
  const viewTop = container.scrollTop;
  const viewBottom = viewTop + container.clientHeight + 600; // 加大预读窗口
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
  // flatMap key = DOM 元素，value = flat 索引；注意 forEach 回调是 (value, key)
  flatMap.forEach((flatIdx, el) => {
    const top = el.offsetTop;
    const h = el.offsetHeight || 150;
    if (top + h >= viewTop && top <= viewBottom) {
      if (images.value[flatIdx] && !images.value[flatIdx].loaded) images.value[flatIdx].loaded = true;
    }
  });
  // 兜底：确保已经有足够多图片进入 loaded 以撑开滚动高度，否则懒加载永远不触发
  // 百度源图片加载失败时不强制加载，让其保持失败状态
  let loadedCount = 0;
  images.value.forEach(img => {
    if (img.loaded) loadedCount++;
  });
  const minGuarantee = Math.min(images.value.length, Math.max(18, COL_COUNT * 7));
  if (loadedCount < minGuarantee) {
    let need = minGuarantee - loadedCount;
    for (let i = 0; i < images.value.length && need > 0; i++) {
      if (!images.value[i].loaded && !(currentSource.value === 'baidu' && images.value[i].loadFailed)) {
        images.value[i].loaded = true;
        need--;
      }
    }
  }
};

const handleScroll = () => {
  sourceDropdownOpen.value = false;
  if (!scrollContainerRef.value) return;
  const el = scrollContainerRef.value;
  const distToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
  preloadVisibleImages();
  // 条件 1：距离底部 < 200（原逻辑）
  const nearBottom = distToBottom < LOAD_THRESHOLD;
  // 条件 2：滚动条滚到底部（distToBottom <= 1，应对小面板一次就显示完全的情况）
  const atBottom = distToBottom <= 1;
  // 条件 3：内容根本没溢出（scrollHeight <= clientHeight + 5），兜底补一页
  const notOverflow = el.scrollHeight <= el.clientHeight + 5;
  if ((nearBottom || atBottom || notOverflow) && hasMore.value && !loading.value) {
    loadNextPage();
  }
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
        // 【关键】把图片原始宽高附带进去，这样画布端不用再 probe 网络，立刻就能画正确尺寸的占位盒
        width: item.width,
        height: item.height,
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

const handleLocalFile = e => {
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

let resizeObserver = null;
onMounted(() => {
  nextTick(async () => {
    searchInputRef.value?.focus();
    if (images.value.length === 0) await loadNextPage();
    // 首屏后兜底：如果内容没撑出滚动条，自动连补 2 页
    for (let i = 0; i < 2; i++) {
      await new Promise(r => setTimeout(r, 80));
      preloadVisibleImages();
      if (!scrollContainerRef.value) break;
      if (scrollContainerRef.value.scrollHeight > scrollContainerRef.value.clientHeight + 10) break;
      if (hasMore.value && !loading.value) await loadNextPage();
    }
  });
});
onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick, true);
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style lang="scss" scoped>
/* ========= 根容器 ========= */
.image-config-panel-root {
  position: fixed;
  left: 104px;
  top: 185px;
  right: 16px;
  bottom: 16px;
  width: auto;
  max-width: 236px;
  max-height: calc(100vh - 200px - 16px);
  z-index: 999;
  pointer-events: none;
}
.image-config-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 14px;
  box-sizing: border-box;
  gap: 12px;
  overflow: hidden;
  border-radius: 18px;
  background: #f6f6f7;
  box-shadow:
    rgb(101 119 134 / 20%) 0 0 15px,
    rgb(101 119 134 / 15%) 0 0 3px 1px;
  pointer-events: auto;
}

.hidden-file {
  display: none;
}

/* ========= 图片素材 ========= */
.material-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: linear-gradient(135deg, #eaf2ff 0%, #f7f9fc 100%);
  border-radius: 12px;
  border: 1px solid #dde9fb;
  flex-shrink: 0;
}
.material-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #298fff;
  box-shadow: 0 3px 10px rgba(41, 143, 255, 0.12);
  flex-shrink: 0;
}
.material-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
}
.material-sub {
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}

/* ========= 合并一行的搜索栏（下拉 + 输入框） ========= */
.gallery-search-bar.merged-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  flex-shrink: 0;
}
.source-dropdown-wrap {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}
.source-trigger-btn {
  width: 34px;
  height: 34px; /* 与搜索框等高 34px */
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
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
      width: 18px;
      height: 18px;
    }
  }
  .caret-icon {
    position: absolute;
    right: 1px;
    bottom: 0px;
    width: 9px;
    height: 9px;
    transition: transform 0.2s;
    color: #999;
    background: #fff;
    border-radius: 2px;
  }
}
.source-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 170px;
  background: #fff;
  border-radius: 10px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  padding: 5px;
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
.sd-divider {
  height: 1px;
  margin: 5px 2px;
  background: #eee;
}
.source-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 9px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.12s;
  &:hover {
    background: #f5f7fa;
  }
  &.active {
    background: #ecf5ff;
  }
  &.upload-item:hover {
    background: #ecf5ff;
    color: #298fff;
  }
  .sd-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    :deep(svg) {
      width: 22px;
      height: 22px;
    }
  }
  .sd-name {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: #333;
  }
}

/* 搜索框 */
.search-input-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 0 8px;
  height: 34px;
  transition: all 0.15s;
  border: 1px solid #e5e7eb;
  &:focus-within {
    background: #fff;
    box-shadow: 0 0 0 2px rgba(41, 143, 255, 0.22);
    border-color: transparent;
  }
}
.search-icon {
  color: #aaa;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  min-width: 0;
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  padding: 0 6px;
  font-size: 12px;
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

/* ========= 瀑布流内容 ========= */
.gallery-content {
  flex: 1;
  overflow-y: auto;
  padding: 2px 2px 4px;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: #d0d0d0 transparent;
  &::-webkit-scrollbar {
    width: 5px;
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
  padding: 24px 12px;
  color: #aaa;
  gap: 10px;
}
.empty-state svg {
  opacity: 0.5;
}
.empty-state p {
  font-size: 12px;
  margin: 0;
  text-align: center;
  line-height: 1.4;
}
.spinner {
  width: 26px;
  height: 26px;
  border: 3px solid #e5e5e5;
  border-top-color: #298fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  &.small {
    width: 14px;
    height: 14px;
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
  gap: 6px;
}
.waterfall-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.waterfall-item {
  position: relative;
  border-radius: 8px;
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
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border: 2px solid rgba(41, 143, 255, 0.6);
      border-radius: 8px;
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
  border-radius: 8px;
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
  gap: 6px;
  padding: 10px;
  color: #999;
  font-size: 11px;
}

/* ========= 底部提示 ========= */
.tip-box {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  background: #fff8e6;
  border: 1px solid #ffe8b0;
  color: #8a6d24;
  border-radius: 8px;
  font-size: 11px;
  line-height: 1.45;
  flex-shrink: 0;
  svg {
    flex-shrink: 0;
    color: #d8a224;
    margin-top: 1px;
  }
}
</style>
