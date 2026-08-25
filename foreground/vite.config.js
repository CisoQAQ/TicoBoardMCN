import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'node:crypto': 'crypto',
    },
  },
  optimizeDeps: {
    include: ['fabric'],
    esbuildOptions: { define: { global: 'window' } },
  },
  ssr: { noExternal: ['fabric'] },
  server: {
    proxy: {
      '/baidu-img': {
        target: 'https://image.baidu.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/baidu-img/, ''),
        headers: {
          Referer: 'https://image.baidu.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
      '/bdimg': {
        target: 'https://t7.baidu.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/bdimg/, ''),
        headers: {
          Referer: 'https://image.baidu.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
      '/bdimg2': {
        target: 'https://img0.baidu.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/bdimg2/, ''),
        headers: {
          Referer: 'https://image.baidu.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
      '/bdimg3': {
        target: 'https://t12.baidu.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/bdimg3/, ''),
        headers: {
          Referer: 'https://image.baidu.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
    },
  },
});
