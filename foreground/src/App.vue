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
</style>