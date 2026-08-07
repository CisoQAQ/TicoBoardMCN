import { defineStore } from 'pinia';

const defaultShapeConfig = () => ({
  type: 'rectangle',
  style: 'normal',
  strokeWidth: 8,
  strokeColor: '#298fff',
  fillColor: '#ffffff',
  opacity: 1,
});

const defaultPenConfig = () => ({
  type: 'pen',
  strokeColor: '#35b85f',
  strokeWidth: 6,
  opacity: 1,
  lineCap: 'round',
  lineJoin: 'round',
  tension: 0.45,
  dash: [],
});

export const useToolStore = defineStore('tool', {
  state: () => ({
    activeTool: null,

    gridType: 'dot',

    shapeConfig: defaultShapeConfig(),

    penConfig: defaultPenConfig(),
  }),

  actions: {
    setActiveTool(tool) {
      this.activeTool = tool;

      if (tool === 'rectangle' && !this.shapeConfig) {
        this.initDefaultShapeConfig();
      }

      if (tool === 'pen' && !this.penConfig) {
        this.initDefaultPenConfig();
      }
    },

    getActiveTool() {
      return this.activeTool;
    },

    setGridType(type) {
      this.gridType = type;
    },

    getGridType() {
      return this.gridType;
    },

    initDefaultShapeConfig() {
      this.shapeConfig = defaultShapeConfig();
    },

    updateShapeConfig(config) {
      this.shapeConfig = {
        ...this.shapeConfig,
        ...config,
      };
    },

    setShapeType(type) {
      this.shapeConfig.type = type;
    },

    setShapeStyle(style) {
      this.shapeConfig.style = style;
    },

    setShapeStrokeWidth(width) {
      this.shapeConfig.strokeWidth = width;
    },

    setShapeFillColor(color) {
      this.shapeConfig.fillColor = color;
    },

    setShapeStrokeColor(color) {
      this.shapeConfig.strokeColor = color;
    },

    setShapeOpacity(opacity) {
      this.shapeConfig.opacity = opacity;
    },

    initDefaultPenConfig() {
      this.penConfig = defaultPenConfig();
    },

    updatePenConfig(config) {
      this.penConfig = {
        ...this.penConfig,
        ...config,
      };
    },

    setPenConfig(config) {
      this.penConfig = {
        ...this.penConfig,
        ...config,
      };
    },

    setPenType(type) {
      this.penConfig.type = type;
    },

    setPenStrokeColor(color) {
      this.penConfig.strokeColor = color;
    },

    setPenStrokeWidth(width) {
      this.penConfig.strokeWidth = width;
    },

    setPenOpacity(opacity) {
      this.penConfig.opacity = opacity;
    },

    setPenDash(dash) {
      this.penConfig.dash = Array.isArray(dash) ? dash : [];
    },
  },
});
