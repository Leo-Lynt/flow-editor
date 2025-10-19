<script setup>
import { onMounted } from 'vue'
import FlowCanvas from './components/FlowCanvas.vue'
import { useTheme } from './composables/useTheme.js'

const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})
</script>

<template>
  <div id="app" class="h-screen overflow-hidden bg-flow-bg dark:bg-flow-bg-dark text-flow-text dark:text-flow-text-dark font-sans antialiased transition-colors duration-200">
    <FlowCanvas />
  </div>
</template>

<style>
/* Global styles that can't be easily replaced with Tailwind */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Global scrollbar styles */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  @apply bg-flow-surface dark:bg-flow-surface-dark;
}

::-webkit-scrollbar-thumb {
  @apply bg-flow-border dark:bg-flow-border-dark rounded-sm;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-flow-border-hover dark:bg-flow-border-hover-dark;
}

/* Focus styles */
*:focus {
  outline: none;
}

*:focus-visible {
  @apply outline-2 outline-primary outline-offset-2;
}

/* Smooth transitions for theme changes */
* {
  @apply transition-colors duration-200;
}

/* Vue Flow - Reset handles to allow component-level styling */
.vue-flow__handle {
  cursor: crosshair !important;
}
</style>