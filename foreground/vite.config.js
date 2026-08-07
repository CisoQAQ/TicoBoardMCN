import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'node:crypto': 'crypto', // 保留你的原有别名
    },
  },
  // 新增1：强制预构建Fabric，解析CommonJS模块
  optimizeDeps: {
    include: ['fabric'],
    esbuildOptions: { define: { global: 'window' } }
  },
  // 新增2：强制不外部化Fabric，让Vite完整解析其导出
  ssr: { noExternal: ['fabric'] }
})