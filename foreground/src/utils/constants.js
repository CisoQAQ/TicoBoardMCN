export const GRID_TYPES = {
  DOT: 'dot',
  LINE: 'line',
};

export const DEFAULT_GRID_TYPE = GRID_TYPES.DOT;

export const TOOL_NAMES = {
  SELECT: 'select',
  PEN: 'pen',
  MAP_CONNECTION: 'map-connection',
  RECTANGLE: 'rectangle',
  TEXT_SIZE: 'text-size',
  IMAGE: 'image',
  UPLOAD: 'upload',
  CARD: 'card',
  QRCODE: 'qrcode',
  BARCODE: 'barcode',
  LINE_TEMPLATE: 'line-template',
};

export const DRAWING_TOOL_NAMES = [TOOL_NAMES.RECTANGLE, TOOL_NAMES.PEN, TOOL_NAMES.IMAGE, TOOL_NAMES.QRCODE, TOOL_NAMES.BARCODE];

export const BARCODE_TOOL_NAMES = [TOOL_NAMES.QRCODE, TOOL_NAMES.BARCODE];

export const TOOL_LIST = [
  { name: TOOL_NAMES.SELECT, label: '选择', size: '24px' },
  { name: TOOL_NAMES.PEN, label: '画笔' },
  { name: TOOL_NAMES.MAP_CONNECTION, label: '连线' },
  { name: TOOL_NAMES.RECTANGLE, label: '图形' },
  { name: TOOL_NAMES.TEXT_SIZE, label: '文本' },
  { name: TOOL_NAMES.IMAGE, label: '图片' },
  { name: TOOL_NAMES.UPLOAD, label: '上传' },
  { name: TOOL_NAMES.CARD, label: '卡片' },
  { name: TOOL_NAMES.QRCODE, label: '二维码' },
  { name: TOOL_NAMES.BARCODE, label: '条形码' },
  { name: TOOL_NAMES.LINE_TEMPLATE, label: '模版' },
];

export const SHAPE_TYPE_MAP = {
  rect: 'rect',
  rectangle: 'rect',
  square: 'square',
  triangle: 'triangle',
  rhombus: 'rhombus',
  pentagon: 'pentagon',
  hexagon: 'hexagon',
  circle: 'circle',
  line: 'line',
  'line-or': 'line',
};

export const SHAPE_LIST = [
  { name: 'rectangle', label: '所有形状', icon: 'rectangle' },
  { name: 'Circle', label: '圆形', icon: 'Circle' },
  { name: 'rhombus', label: '菱形', icon: 'rhombus' },
  { name: 'triangle', label: '三角形', icon: 'triangle' },
  { name: 'line-or', label: '线条', icon: 'line-or' },
];

export const QRCODE_TYPE_LIST = [
  { value: 'qrcode', label: 'QR Code', icon: 'qrcode', bcid: 'qrcode', category: '2D', keywords: 'qr quick response 二维码' },
  { value: 'qrcode-micro', label: 'Micro QR Code', icon: 'qrcode', bcid: 'microqrcode', category: '2D', keywords: 'micro small 微型 小' },
  {
    value: 'datamatrix',
    label: 'Data Matrix',
    icon: 'datamatrix',
    bcid: 'datamatrix',
    category: '2D',
    keywords: 'dm data matrix 数据矩阵',
  },
  {
    value: 'datamatrix-rect',
    label: 'Data Matrix Rect',
    icon: 'datamatrix',
    bcid: 'datamatrixrectangular',
    category: '2D',
    keywords: 'rectangle 矩形',
  },
  { value: 'pdf417', label: 'PDF417', icon: 'pdf417', bcid: 'pdf417', category: '堆叠', keywords: 'pdf stacked 堆叠' },
  {
    value: 'pdf417-truncated',
    label: 'PDF417 Truncated',
    icon: 'pdf417',
    bcid: 'pdf417trunc',
    category: '堆叠',
    keywords: 'compact 紧凑 截断',
  },
  { value: 'micro-pdf417', label: 'Micro PDF417', icon: 'pdf417', bcid: 'micropdf417', category: '堆叠', keywords: 'micro' },
  { value: 'azteccode', label: 'Aztec Code', icon: 'azteccode', bcid: 'azteccode', category: '2D', keywords: 'aztec 阿兹特克' },
  { value: 'aztec-runes', label: 'Aztec Runes', icon: 'azteccode', bcid: 'aztecrune', category: '2D', keywords: 'rune 数字 符文' },
  { value: 'maxicode', label: 'MaxiCode', icon: 'maxicode', bcid: 'maxicode', category: '2D', keywords: 'maxi ups 圆形 蜂窝' },
  { value: 'dotcode', label: 'DotCode', icon: 'dotcode', bcid: 'dotcode', category: '2D', keywords: 'dot 点 医药' },
  { value: 'gridmatrix', label: 'Grid Matrix', icon: 'gridmatrix', bcid: 'gridmatrix', category: '2D', keywords: 'grid 网格 中国 gm' },
  { value: 'hanxin', label: 'Han Xin Code', icon: 'hanxin', bcid: 'hanxin', category: '2D', keywords: 'han xin 汉信码 中国 chinese' },
  { value: 'code-one', label: 'Code One', icon: 'codeone', bcid: 'codeone', category: '2D', keywords: 'code1' },
  { value: 'codablock-f', label: 'Codablock F', icon: 'codablock', bcid: 'codablockf', category: '堆叠', keywords: 'block' },
  { value: 'code-16k', label: 'Code 16K', icon: 'code16k', bcid: 'code16k', category: '堆叠', keywords: '' },
  { value: 'code-49', label: 'Code 49', icon: 'code49', bcid: 'code49', category: '堆叠', keywords: '' },
  { value: 'channel-code', label: 'Channel Code', icon: 'channel', bcid: 'channelcode', category: '堆叠', keywords: 'channel 通道' },
  { value: 'telepen', label: 'Telepen', icon: 'telepen', bcid: 'telepen', category: '1D', keywords: '' },
  { value: 'posicode', label: 'PosiCode', icon: 'posicode', bcid: 'posicode', category: '2D', keywords: 'posi' },
];

export const BARCODE_TYPE_LIST = [
  { value: 'code128', label: 'Code 128', icon: 'barcode', bcid: 'code128', category: '1D', keywords: 'auto 通用' },
  { value: 'code128a', label: 'Code 128A', icon: 'barcode', bcid: 'code128', altcode: 'A', category: '1D', keywords: 'subset' },
  { value: 'code128b', label: 'Code 128B', icon: 'barcode', bcid: 'code128', altcode: 'B', category: '1D', keywords: 'subset' },
  {
    value: 'code128c',
    label: 'Code 128C',
    icon: 'barcode',
    bcid: 'code128',
    altcode: 'C',
    category: '1D',
    keywords: 'subset numeric 数字',
  },
  { value: 'gs1_128', label: 'GS1-128', icon: 'barcode', bcid: 'gs1-128', category: '1D', keywords: 'ean128' },
  { value: 'ean13', label: 'EAN-13', icon: 'barcode', bcid: 'ean13', category: '1D', keywords: '商品 零售 retail' },
  { value: 'ean8', label: 'EAN-8', icon: 'barcode', bcid: 'ean8', category: '1D', keywords: 'short 短码' },
  { value: 'upca', label: 'UPC-A', icon: 'barcode', bcid: 'upca', category: '1D', keywords: 'usa 美国' },
  { value: 'upce', label: 'UPC-E', icon: 'barcode', bcid: 'upce', category: '1D', keywords: '压缩 zero suppress' },
  { value: 'code39', label: 'Code 39', icon: 'barcode', bcid: 'code39', category: '1D', keywords: '字母数字' },
  { value: 'code93', label: 'Code 93', icon: 'barcode', bcid: 'code93', category: '1D', keywords: '紧凑' },
  { value: 'code11', label: 'Code 11', icon: 'barcode', bcid: 'code11', category: '1D', keywords: 'usd-8' },
  { value: 'codabar', label: 'Codabar', icon: 'barcode', bcid: 'rationalizedCodabar', category: '1D', keywords: 'nw7 图书馆' },
  { value: 'interleaved2of5', label: 'ITF 2/5', icon: 'barcode', bcid: 'interleaved2of5', category: '1D', keywords: 'i25 交叉' },
  { value: 'itf14', label: 'ITF-14', icon: 'barcode', bcid: 'itf14', category: '1D', keywords: 'gtin14' },
  { value: 'msi', label: 'MSI', icon: 'barcode', bcid: 'msi', category: '1D', keywords: 'plessey' },
  { value: 'plessey', label: 'Plessey', icon: 'barcode', bcid: 'plessey', category: '1D', keywords: 'uk' },
  { value: 'isbn', label: 'ISBN', icon: 'barcode', bcid: 'isbn', category: '1D', keywords: '图书 书号 book' },
  { value: 'pharmacode', label: 'Pharmacode', icon: 'barcode', bcid: 'pharmacode', category: '1D', keywords: '医药 药品' },
];

// 二维码默认值
export const QRCODE_DEFAULT_VALUES = {
  qrcode: 'https://example.com',
  'qrcode-micro': 'http://ex.co',
  datamatrix: 'Hello Data Matrix',
  'datamatrix-rect': 'Rect-DM-01',
  pdf417: 'Hello PDF417 2D Barcode',
  'pdf417-truncated': 'Compact PDF417-ABC',
  'micro-pdf417': 'Micro-PDF 123',
  azteccode: 'Hello Aztec Code 1234567890',
  'aztec-runes': '123456',
  maxicode: '15238280250840184018',
  dotcode: 'DotCode-12345-ABC',
  gridmatrix: 'Grid Matrix 网格码 ABC-123',
  hanxin: '汉信码示例内容-ABCD1234',
  'code-one': 'CODE1-Example-0001',
  'codablock-f': 'Codablock-F Line1\nLine2 ABCD-12345',
  'code-16k': 'CODE16K Example String',
  'code-49': 'CODE49-ABCD-123456',
  'channel-code': '1234567',
  telepen: 'Telepen-1234',
  posicode: 'PosiCode-A1',
};

// 条码默认值
export const BARCODE_DEFAULT_VALUES = {
  code128: 'ABC-1234-xyz',
  code128a: 'CODE128A-STANDARD',
  code128b: 'Code128B-MixedCase',
  code128c: '1234567890123456',
  gs1_128: '(01)09521234543213(3103)000123',
  ean13: '9520123456788',
  ean8: '95200002',
  upca: '012345000058',
  upce: '01234558',
  code39: 'CODE39-12345',
  code93: 'CODE93-123',
  code11: '123-456-7890',
  codabar: 'A12345678B',
  interleaved2of5: '123456789012',
  itf14: '12345678901231',
  code25: '1234567890',
  msi: '1234567',
  plessey: 'ABC1234',
  isbn: '978-1-56581-231-4 90000',
  pharmacode: '12345',
};

export const BCID_MAP = {
  [TOOL_NAMES.QRCODE]: 'qrcode',
  [TOOL_NAMES.BARCODE]: 'code128',
};

export function resolveQrBcid(type) {
  return QRCODE_TYPE_LIST.find(item => item.value === type)?.bcid || 'qrcode';
}

export function resolveBarcodeMeta(type) {
  const item = BARCODE_TYPE_LIST.find(i => i.value === type);
  return {
    bcid: item?.bcid || 'code128',
    altcode: item?.altcode || undefined,
  };
}

export function resolveBarcodeBcid(type) {
  return resolveBarcodeMeta(type).bcid;
}

export function getQrDefaultValue(type) {
  return QRCODE_DEFAULT_VALUES[type] || QRCODE_DEFAULT_VALUES.qrcode;
}

export function getBarcodeDefaultValue(type) {
  return BARCODE_DEFAULT_VALUES[type] || BARCODE_DEFAULT_VALUES.code128;
}

export const DEFAULT_PRESET_COLORS = [
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

export const DEFAULT_PREDEFINE_COLORS = [
  ...DEFAULT_PRESET_COLORS,
  '#298fff',
  '#6366f1',
  '#f97316',
  '#14b8a6',
  '#f43f5e',
  'rgba(41, 143, 255, 0.5)',
  'rgba(99, 102, 241, 0.5)',
  'rgba(249, 115, 22, 0.5)',
];

export const DEFAULT_SHAPE_CONFIG = {
  type: 'rectangle',
  style: 'normal',
  strokeWidth: 8,
  strokeColor: '#298fff',
  fillColor: '#ffffff',
  opacity: 1,
};

export const DEFAULT_PEN_CONFIG = {
  type: 'pen',
  strokeColor: '#35b85f',
  strokeWidth: 6,
  opacity: 1,
  lineCap: 'round',
  lineJoin: 'round',
  tension: 0.45,
  dash: [],
};

export const DEFAULT_BARCODE_CONFIG = {
  type: 'qrcode',
  value: 'https://example.com',
  scale: 2,
  backgroundColor: '#ffffff',
  foregroundColor: '#000000',
};

export const DEFAULT_QRCODE_VALUE = 'https://example.com';
export const DEFAULT_CODE128_VALUE = '1234567890';

export const DRAW_CONSTANTS = {
  MIN_SHAPE_SIZE: 4,
  MIN_BARCODE_SIZE: 20,
  DEFAULT_QRCODE_WIDTH: 150,
  DEFAULT_BARCODE_WIDTH: 200,
  DEFAULT_PADDING: 10,
};

export const EVENT_NAMESPACES = {
  SHAPE_DRAW: '.shapeDraw',
  BARCODE_DRAW: '.barcodeDraw',
  PEN_DRAW: '.penDraw',
};

export const CANVAS_ELEMENT_NAME = 'canvas-element';
export const SHAPE_NAME = 'shape';
export const BARCODE_NAME = 'barcode';

export const TRANSFORMER_CONFIG = {
  borderStroke: '#4285f4',
  borderStrokeWidth: 1,
  anchorStroke: '#fff',
  anchorFill: '#4285f4',
  anchorSize: 8,
  rotateEnabled: true,
  rotateAnchorOffset: 30,
  ignoreStroke: false,
};

export const BARCODE_RENDER_OPTIONS = {
  qrcode: {
    eclevel: 'M',
  },
  code128: {
    includetext: true,
    textgaps: 1,
  },
};
