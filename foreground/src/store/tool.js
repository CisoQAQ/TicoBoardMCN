import { defineStore } from 'pinia';
import { QRCODE_DEFAULT_VALUES, BARCODE_DEFAULT_VALUES } from '../utils/constants';

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

const defaultBarcodeConfig = () => ({
  type: 'qrcode',
  subtype: 'qrcode',
  value: QRCODE_DEFAULT_VALUES.qrcode,
  backgroundColor: '#ffffff',
  foregroundColor: '#000000',
});

export const useToolStore = defineStore('tool', {
  state: () => ({
    activeTool: null,

    gridType: 'dot',

    shapeConfig: defaultShapeConfig(),

    penConfig: defaultPenConfig(),

    barcodeConfig: defaultBarcodeConfig(),

    barcodeDialogVisible: false,
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

    initDefaultBarcodeConfig() {
      this.barcodeConfig = defaultBarcodeConfig();
    },

    updateBarcodeConfig(config) {
      this.barcodeConfig = {
        ...this.barcodeConfig,
        ...config,
      };
    },

    setBarcodeType(type) {
      this.barcodeConfig.type = type;
      if (type === 'qrcode') {
        this.barcodeConfig.subtype = this.barcodeConfig.subtype || 'qrcode';
        this.barcodeConfig.value = QRCODE_DEFAULT_VALUES[this.barcodeConfig.subtype] || QRCODE_DEFAULT_VALUES.qrcode;
      } else if (type === 'barcode') {
        this.barcodeConfig.subtype = this.barcodeConfig.subtype || 'code128';
        this.barcodeConfig.value = BARCODE_DEFAULT_VALUES[this.barcodeConfig.subtype] || BARCODE_DEFAULT_VALUES.code128;
      }
    },

    setBarcodeSubtype(subtype, category) {
      this.barcodeConfig.subtype = subtype;
      const lookup = category === 'qrcode' ? QRCODE_DEFAULT_VALUES : BARCODE_DEFAULT_VALUES;
      this.barcodeConfig.value = lookup[subtype] || this.barcodeConfig.value;
    },

    setBarcodeValue(value) {
      this.barcodeConfig.value = value;
    },

    setBarcodeBackgroundColor(color) {
      this.barcodeConfig.backgroundColor = color;
    },

    setBarcodeForegroundColor(color) {
      this.barcodeConfig.foregroundColor = color;
    },

    setBarcodeDialogVisible(visible) {
      this.barcodeDialogVisible = visible;
    },

    openBarcodeDialog(defaultType = 'qrcode') {
      this.barcodeConfig.type = defaultType;
      if (defaultType === 'qrcode') {
        this.barcodeConfig.subtype = 'qrcode';
        this.barcodeConfig.value = QRCODE_DEFAULT_VALUES.qrcode;
      } else {
        this.barcodeConfig.subtype = 'code128';
        this.barcodeConfig.value = BARCODE_DEFAULT_VALUES.code128;
      }
      this.barcodeDialogVisible = true;
    },

    closeBarcodeDialog() {
      this.barcodeDialogVisible = false;
    },
  },
});
