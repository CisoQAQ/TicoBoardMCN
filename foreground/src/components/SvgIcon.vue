<template>
  <i class="iconfont" :class="`icon-${name}`" :style="{ color, fontSize: size }" />
</template>

<script setup>
const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: '22px',
  },
  color: {
    type: String,
    default: '#1677ff',
  },
});
</script>

<style scoped>
.iconfont {
  font-weight: normal;
  font-style: normal;
  display: inline-block;
  vertical-align: middle;
}
</style>
