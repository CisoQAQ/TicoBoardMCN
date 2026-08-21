<!-- App.vue -->
<template>
  <div id="app">
    <Header />
    <router-view />
  </div>
</template>

<script lang="ts" setup>
import Header from './components/Header.vue';
// 应用入口
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background-color: #fff;
}

.el-overlay-dialog {
  overflow: auto;
}

.el-overlay-dialog .el-dialog {
  margin: 8vh auto !important;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 16vh);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  margin-top: 8vh !important;
  margin-bottom: 8vh !important;
}

.el-overlay-dialog .el-dialog .el-dialog__header {
  flex-shrink: 0;
  padding-top: 14px;
  padding-bottom: 10px;
}

.el-overlay-dialog .el-dialog .el-dialog__body {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(100vh - 16vh - 110px);
  box-sizing: border-box;
}

.el-overlay-dialog .el-dialog .el-dialog__footer {
  flex-shrink: 0;
  padding-bottom: 14px;
}

.el-color-dropdown {
  max-width: calc(100vw - 16px) !important;
  max-height: calc(100vh - 16px) !important;
  overflow: auto;
}

.el-popper {
  max-width: calc(100vw - 16px) !important;
  max-height: calc(100vh - 16px) !important;
}

@media screen and (max-height: 600px) {
  .el-overlay-dialog .el-dialog {
    margin-top: 4vh !important;
    margin-bottom: 4vh !important;
    max-height: calc(100vh - 8vh);
  }
  .el-overlay-dialog .el-dialog .el-dialog__body {
    max-height: calc(100vh - 8vh - 110px);
  }
}
</style>
