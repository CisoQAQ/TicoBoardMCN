import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import api from './api';
import VueKonva from 'vue-konva';
const app = createApp(App);
app.config.globalProperties.$api = api; // 假设你有一个 api 对象用于处理 API 请求
import SvgIcon from './components/SvgIcon.vue';
import './assets/iconfont/iconfont.js';
import { createPinia } from 'pinia';

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
app.use(ElementPlus);
app.use(createPinia());

app.use(router);
app.use(VueKonva);
app.component('SvgIcon', SvgIcon);
app.mount('#app');
