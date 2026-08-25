# TicoBoardMCN 前端

TicoBoardMCN 是一个面向 MCN 场景的在线画布编辑器，提供图片搜索、图文排版、二维码/条形码生成、画布绘制等能力。

## 技术栈

| 分类   | 技术                       | 说明                         |
| ------ | -------------------------- | ---------------------------- |
| 框架   | Vue 3.5 + `<script setup>` | 单文件组件组合式 API         |
| 构建   | Vite 7                     | 极速开发与构建               |
| UI     | Element Plus               | 后台常用组件库               |
| 路由   | Vue Router 4               | 含登录守卫                   |
| 状态   | Pinia 3                    | 全局状态管理（用户、工具栏） |
| 画布   | Konva + vue-konva          | 2D 图形绘制与交互            |
| 3D     | three.js                   | 3D 场景能力                  |
| 富文本 | @wangeditor/editor-for-vue | 文本编辑                     |
| PDF    | pdfjs-dist                 | PDF 渲染                     |
| 条码   | bwip-js                    | 二维码 / 条形码生成          |
| 动画   | gsap + @tweenjs/tween.js   | 动画缓动库                   |
| 样式   | Sass / SCSS                | CSS 预处理器                 |
| 工具库 | @vueuse/core、axios        | 组合式工具 & HTTP 客户端     |

## 主要功能

### 1. 用户系统

- 登录 / 登出（基于 localStorage token 鉴权）
- 用户资料编辑
- 路由全局守卫，未登录自动跳转登录页

### 2. 画布工作台 `WorkCanvas`

画布编辑器是项目核心，支持在页面上自由排版多种元素：

| 模块     | 文件                                     | 说明                                                                                        |
| -------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| 图片配置 | `ImageConfigPanel.vue`                   | 支持 **百度图片源**（acjson 接口，含正则兜底解析）与 LoremFlickr 随机图，支持瀑布流滚动加载 |
| 形状     | `ShapeConfigPanel.vue`                   | 矩形、圆形、多边形等基础图形                                                                |
| 画笔     | `PenConfigPanel.vue` / `PenDraw.vue`     | 手绘路径                                                                                    |
| 多边形   | `Polygon.vue`                            | 自定义多边形绘制                                                                            |
| 二维码   | `QrcodeConfigPanel.vue`                  | bwip-js 生成 QR Code                                                                        |
| 条形码   | `BarcodeConfigPanel.vue` + `Barcode.vue` | 多种码制支持                                                                                |
| 工具栏   | `ToolBar.vue` + `ElementToolbar.vue`     | 元素操作工具条                                                                              |
| 画布容器 | `CanvasBox.vue` + `FabricCanvas.vue`     | Konva 画布承载与网格背景                                                                    |
| 主编辑器 | `Editor.vue`                             | 核心编辑流程组合                                                                            |

### 3. 图片搜索（重点）

路径：`src/api/imageSearch.js`

- **百度源**：通过 `/baidu-img/search/acjson` 代理请求，返回后支持：
  - 正常 JSON 解析
  - 返回字段含反引号包裹的 URL 清理
  - 遇到 `Bad escaped character` 等损坏 JSON 时，使用**正则逐字段提取**兜底
  - `pn=0` 返回空对象但有 `displayNum` 时，自动用 `pn=rn` 重试
- **LoremFlickr 源**：随机分类图片兜底
- 代理配置在 `vite.config.js` 中（`/baidu-img`、`/bdimg`、`/bdimg2`、`/bdimg3`），并伪造 Referer & User-Agent

### 4. 其他页面

- 首页 `home.vue`：工作台入口
- 设置页 `setting.vue`：应用设置
- 404 `notFound.vue`：兜底错误页

## 目录结构

```
foreground/
├── .env.development          # 开发环境变量 (VITE_API_BASE_URL)
├── vite.config.js            # Vite 配置 + 百度图片代理
├── index.html
├── package.json
└── src/
    ├── main.js               # 入口
    ├── App.vue
    ├── router/index.js       # 路由 + 登录守卫
    ├── store/                # Pinia
    │   ├── tool.js
    │   └── user.js
    ├── api/                  # 接口层
    │   ├── index.js
    │   ├── user.js
    │   └── imageSearch.js    # 图片搜索
    ├── utils/                # 工具函数
    │   ├── request.js        # axios 封装
    │   ├── common.js
    │   ├── constants.js
    │   └── useCanvasStage.js # 画布组合式函数
    ├── components/           # 业务组件（画布面板/工具栏等）
    ├── views/                # 页面级组件
    │   ├── login.vue
    │   ├── home.vue
    │   ├── workCanvas.vue
    │   ├── userInfoEdit.vue
    │   ├── setting.vue
    │   └── notFound.vue
    ├── styles/               # 全局样式 & element-plus 主题覆盖
    ├── assets/               # 静态资源 (svg/pdf/scss)
    └── style.css
```

## 快速开始

### 环境要求

- Node.js >= 18
- 包管理工具：npm / yarn / pnpm 任选

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

默认启动在 `http://localhost:5173`，已配置以下代理：

| 前缀         | 目标                    | 用途                 |
| ------------ | ----------------------- | -------------------- |
| `/baidu-img` | https://image.baidu.com | 百度 acjson 搜索接口 |
| `/bdimg`     | https://t7.baidu.com    | 百度图片资源 1       |
| `/bdimg2`    | https://img0.baidu.com  | 百度图片资源 2       |
| `/bdimg3`    | https://t12.baidu.com   | 百度图片资源 3       |
| `/api`       | `VITE_API_BASE_URL`     | 业务后端             |

### 生产构建

```bash
npm run build
```

构建产物输出到 `dist/`。

### 本地预览构建产物

```bash
npm run preview
```

## 环境变量

当前 `.env.development` 中定义：

```
VITE_API_BASE_URL=http://localhost:3333/api
```

生产部署时请配套设置 `VITE_API_BASE_URL` 为真实后端地址。

## 登录鉴权说明

- 登录成功后后端返回 token，前端写入 `localStorage.getItem('token')`
- 路由 `meta.requiresAuth !== false` 的页面，会在 `beforeEach` 中校验 token
- token 缺失则自动重定向到 `/login`
