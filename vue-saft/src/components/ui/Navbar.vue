<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { spectrogramStore } from '@/store/store.js';

const route = useRoute()

function spectrogramDataAvailable() {
  return spectrogramStore.renderData
}

const steps = computed(() => ([
  { name: 'upload', label: 'Upload', enabled: true },
  { name: 'canvas', label: 'Canvas', enabled: spectrogramDataAvailable() },
  { name: 'download', label: 'Download', enabled: spectrogramDataAvailable() },
]))

function stepClass(enabled, active) {
  // same logic/order as your original:
  // 1) disabled
  // 2) enabled + inactive
  // 3) active
  // 4) default (enabled but inactive)
  if (!enabled) {
    return 'tab-btn flex-1 px-1 py-3 font-semibold text-lg rounded-t-xl border-b-2 ' +
      'text-saft-brown-500 bg-transparent cursor-not-allowed opacity-60'
  }

  if (enabled && !active) {
    return 'tab-btn flex-1 px-1 py-3 font-semibold text-lg rounded-t-xl border-b-2 ' +
      'bg-saft-brown-100 text-saft-brown-900 border-transparent ' +
      'hover:bg-saft-brown-200 transition-all duration-200 active:scale-[0.98]'
  }

  if (active) {
    return 'tab-btn flex-1 px-1 py-3 font-semibold text-lg rounded-t-xl border-b-2 ' +
      'bg-saft-brown-50 text-saft-brown-900 border-saft-main-500 ' +
      'hover:saft-brown-100 transition-all duration-200 active:scale-[0.98]'
  }

  return 'tab-btn flex-1 px-1 py-3 font-semibold text-lg rounded-t-xl border-b-2 ' +
    'text-saft-brown-500 bg-transparent border-transparent ' +
    'hover:bg-saft-brown-200 hover:text-saft-brown-900 transition-all duration-200 active:scale-[0.98]'
}
</script>

<template>
  <nav class="flex border-b border-white/20 mb-6 pb-2">
    <RouterLink v-for="s in steps" :key="s.name" :to="{ name: s.name }" custom v-slot="{ navigate }">
      <button :class="stepClass(s.enabled, route.name === s.name)" @click="s.enabled && navigate()">
        {{ s.label }}
      </button>
    </RouterLink>
  </nav>
</template>