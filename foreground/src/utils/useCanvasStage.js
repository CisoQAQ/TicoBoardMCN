import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useToolStore } from '../store/tool';

export const useCanvasStage = () => {
  const stageRef = ref(null);
  const stageConfig = reactive({
    width: window.innerWidth,
    height: window.innerHeight,
    scaleX: 1,
    scaleY: 1,
    x: 0,
    y: 0,
  });
  const toolStore = useToolStore();
  let stage = null;
  let layer = null;
  const isDragging = ref(false);
  let lastPointer = { x: 0, y: 0 };
  let isSelecting = false;
  let selectionRect = null;
  let startPoint = { x: 0, y: 0 };
  let pendingStageSync = false;
  // 绘制时，是否需要同步画布配置
  let pendingDraw = false;

  const canvasCursor = computed(() => {
    if (isDragging.value) return 'grabbing';

    const currentActive = toolStore.activeTool;
    if (currentActive === null) return 'grab';
    switch (currentActive) {
      case 'pen':
        return "url('/src/assets/svg/pen.png') 7 20, progress";
      case 'select':
        return 'url("/src/assets/svg/cursor.png") 12 5, progress';
      case 'text-size':
        return 'url("/src/assets/svg/text.png") 15 15, progress';
      case 'image':
      case 'upload':
      case 'card':
      case 'rectangle':
      case 'qrcode':
      case 'barcode':
      case 'map-connection':
      case 'line-template':
        return 'url("/src/assets/svg/add.png") 15 15, progress';
      default:
        return 'default';
    }
  });
  const zoomText = computed(() => `${Math.round(stageConfig.scaleX * 100)}%`);

  const handleResize = () => {
    stageConfig.width = window.innerWidth;
    stageConfig.height = window.innerHeight;
  };

  const getStagePointer = () => {
    if (!stage) return null;
    return stage.getPointerPosition();
  };

  /**
   * 获取画布世界坐标。
   *
   * 不直接用 stage.getRelativePointerPosition()，
   * 而是通过 transform 反算，缩放和平移后更稳定。
   */
  const getCanvasPointer = () => {
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point(pointer);
  };

  const getEventTarget = e => {
    return e?.target || null;
  };

  /**
   * 判断当前点击目标是否属于画布元素
   * 支持：
   * 1. 当前 target 自己有 canvas-element
   * 2. target 在某个 Group 里面，父级有 canvas-element
   */
  const isCanvasElementTarget = target => {
    if (!target || !stage) return false;

    let current = target;

    while (current && current !== stage) {
      if (current.hasName?.('canvas-element')) {
        return true;
      }
      current = current.getParent?.();
    }

    return false;
  };

  /**
   * 判断是否点在空白区域
   */
  const isBlankAreaTarget = target => {
    if (!target || !stage) return false;
    if (target === stage) return true;
    // 如果你给背景节点加了 name: 'canvas-background'，这里也允许
    if (target.hasName?.('canvas-background')) return true;
    return false;
  };

  const batchDrawStage = () => {
    if (!stage) return;
    stage.getLayers().forEach(currentLayer => {
      currentLayer.batchDraw();
    });
  };
  // 请求画布重绘
  const requestDraw = () => {
    if (pendingDraw) return;
    pendingDraw = true;
    requestAnimationFrame(() => {
      pendingDraw = false;
      batchDrawStage();
    });
  };

  // 同步画布配置
  const syncConfig = () => {
    if (!stage) return;
    stageConfig.x = stage.x();
    stageConfig.y = stage.y();
    stageConfig.scaleX = stage.scaleX();
    stageConfig.scaleY = stage.scaleY();
  };

  // 请求画布配置同步
  const requestStageSync = () => {
    if (pendingStageSync) return;
    pendingStageSync = true;
    requestAnimationFrame(() => {
      pendingStageSync = false;
      syncConfig();
      batchDrawStage();
    });
  };

  /**
   * 画布拖拽模式：元素不能拖
   * 选择模式：元素可以拖
   *
   * 注意：
   * 你的 Polygon / Rect / Image / Group 等节点需要加：
   * name: 'canvas-element'
   */
  const updateElementDraggable = () => {
    if (!stage) return;
    const canDragElement = toolStore.activeTool === 'select';
    stage.find('.canvas-element').forEach(node => {
      node.draggable(canDragElement);
    });
    requestDraw();
  };

  // 初始化画布
  const initStage = () => {
    if (!stageRef.value) return;
    stage = stageRef.value.getStage();
    const layers = stage.find('Layer');
    layer = layers[layers.length - 1] || null;
    updateElementDraggable();
  };
  // 开始选择
  const startSelect = e => {
    if (!stage || !layer) return;
    const target = getEventTarget(e);
    // 点到元素，不启动框选
    if (isCanvasElementTarget(target)) return;
    // 不是空白区域，也不启动框选
    if (!isBlankAreaTarget(target)) return;
    const pointer = getCanvasPointer();
    if (!pointer) return;
    isSelecting = true;
    startPoint = { x: pointer.x, y: pointer.y };
    selectionRect = new window.Konva.Rect({
      x: startPoint.x,
      y: startPoint.y,
      width: 0,
      height: 0,
      fill: 'rgba(66, 133, 244, 0.15)',
      stroke: '#4285f4',
      strokeWidth: 1,
      dash: [5, 5],
      name: 'selectionRect',
      listening: false,
      perfectDrawEnabled: false,
    });

    layer.add(selectionRect);
    layer.batchDraw();
  };

  const startCanvasDrag = e => {
    if (!stage) return;
    const target = getEventTarget(e);
    // 点到元素，不拖动画布
    if (isCanvasElementTarget(target)) return;
    // 不是空白区域，不拖动画布
    if (!isBlankAreaTarget(target)) return;
    const pointer = getStagePointer();
    if (!pointer) return;
    isDragging.value = true;
    lastPointer = { x: pointer.x, y: pointer.y };
  };

  const startDrag = e => {
    if (!stage) return;
    const target = getEventTarget(e);
    // 点到元素，直接交给元素自己处理
    // 不启动背景框选，也不启动画布拖拽
    if (isCanvasElementTarget(target)) return;
    if (toolStore.activeTool === 'select') {
      startSelect(e);
      return;
    }
    if (toolStore.activeTool === null) startCanvasDrag(e);
  };

  const dragCanvas = () => {
    if (!stage) return;
    const pointer = getStagePointer();
    if (!pointer) return;
    const dx = pointer.x - lastPointer.x;
    const dy = pointer.y - lastPointer.y;
    stage.position({
      x: stage.x() + dx,
      y: stage.y() + dy,
    });
    lastPointer = { x: pointer.x, y: pointer.y };
    requestStageSync();
  };

  const dragSelection = () => {
    if (!stage || !selectionRect) return;
    const pointer = getCanvasPointer();
    if (!pointer) return;
    const x = Math.min(startPoint.x, pointer.x);
    const y = Math.min(startPoint.y, pointer.y);
    const width = Math.abs(startPoint.x - pointer.x);
    const height = Math.abs(startPoint.y - pointer.y);
    selectionRect.position({
      x,
      y,
    });
    selectionRect.size({
      width,
      height,
    });
    layer?.batchDraw();
  };

  const onDrag = () => {
    if (!stage) return;
    if (isDragging.value) {
      dragCanvas();
      return;
    }
    if (isSelecting && selectionRect) {
      dragSelection();
    }
  };

  const clearSelectionRect = () => {
    if (!selectionRect) return;
    const area = {
      x: selectionRect.x(),
      y: selectionRect.y(),
      width: selectionRect.width(),
      height: selectionRect.height(),
    };
    console.log('框选区域：', area);
    selectionRect.destroy();
    selectionRect = null;
    layer?.batchDraw();
  };

  const stopDrag = () => {
    if (!stage) return;
    isDragging.value = false;
    if (isSelecting && selectionRect) {
      clearSelectionRect();
    }
    isSelecting = false;
    syncConfig();
    requestDraw();
  };

  const setScale = (newScale, scaleCenter) => {
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = scaleCenter ||
      stage.getPointerPosition() || {
        x: stage.width() / 2,
        y: stage.height() / 2,
      };
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    stage.scale({
      x: newScale,
      y: newScale,
    });
    stage.position({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
    requestStageSync();
  };

  const handleWheel = e => {
    if (!stage) return;
    const evt = e?.evt || e;
    evt.preventDefault();
    const oldScale = stage.scaleX();
    const scaleBy = 1.1;
    const newScale = evt.deltaY < 0 ? Math.min(5, oldScale * scaleBy) : Math.max(0.2, oldScale / scaleBy);
    const pointer = stage.getPointerPosition() || {
      x: stage.width() / 2,
      y: stage.height() / 2,
    };
    setScale(newScale, pointer);
  };

  const zoomIn = () => {
    if (!stage) return;
    const center = {
      x: stage.width() / 2,
      y: stage.height() / 2,
    };
    setScale(Math.min(5, stage.scaleX() * 1.2), center);
  };

  const zoomOut = () => {
    if (!stage) return;
    const center = {
      x: stage.width() / 2,
      y: stage.height() / 2,
    };
    setScale(Math.max(0.2, stage.scaleX() / 1.2), center);
  };

  const resetZoom = () => {
    if (!stage) return;
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    syncConfig();
    requestDraw();
  };

  onMounted(async () => {
    await nextTick();
    initStage();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mouseup', stopDrag);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('mouseup', stopDrag);
  });

  watch(
    () => toolStore.activeTool,
    () => {
      updateElementDraggable();
    }
  );

  return {
    stageRef,
    stageConfig,
    zoomText,
    canvasCursor,
    startDrag,
    stopDrag,
    onDrag,
    handleWheel,
    zoomIn,
    zoomOut,
    resetZoom,
  };
};
