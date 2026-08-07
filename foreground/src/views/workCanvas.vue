<template>
  <CanvasBox 
    :initial-scale="1"
    :min-scale="0.2"
    :max-scale="5"
    :grid-size="20"
    grid-color="#e5e7eb"
  >
  </CanvasBox>
</template>

<script setup>
import CanvasBox from '../components/CanvasBox.vue'
</script>

<style>

</style>