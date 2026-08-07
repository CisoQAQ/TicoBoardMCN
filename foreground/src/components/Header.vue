<!-- src/components/Header.vue -->
<template>
  <header class="app-header" v-if="!isWorkCanvas">
    <div class="logo">MEITO</div>
    <nav>
      <router-link to="/workCanvas">
        <el-button class="height_btn"> 工作台 </el-button>
      </router-link>
      <el-dropdown placement="bottom-start">
        <el-button class="height_btn"> ME </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <router-link to="/userInfoEdit">
              <el-dropdown-item>编辑信息</el-dropdown-item>
            </router-link>
            <router-link to="/setting">
              <el-dropdown-item>设置</el-dropdown-item>
            </router-link>

            <el-dropdown-item>个人主页</el-dropdown-item>
            <el-dropdown-item @click="logout">登出</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <router-link to="/about"></router-link>
    </nav>
  </header>
</template>
<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();
const logout = () => {
  localStorage.clear();
  router.push('/login');
};
const isWorkCanvas = computed(() => {
  return route.meta.hiddenHeader === true;
});
</script>

<style scoped>
.height_btn {
  margin-right: 10px;
}
.app-header {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.logo {
  font-size: 1.2rem;
  font-weight: bold;
  margin-right: 20px;
}
nav a {
  margin: 0 10px;
  text-decoration: none;
  color: #333;
}
</style>
