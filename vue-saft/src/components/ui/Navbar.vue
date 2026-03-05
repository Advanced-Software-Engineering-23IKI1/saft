<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const steps = computed(() => ([
  { name: 'upload', label: 'Upload', enabled: true },
  { name: 'canvas', label: 'Canvas', enabled: true },
  { name: 'download', label: 'Download', enabled: true },
]))

function stepClass(enabled, active) {
  // same logic/order as your original:
  // 1) disabled
  // 2) active
  // 3) default (enabled but inactive)
  if (!enabled) {
    return 'tab-btn flex-1 px-4 py-3 font-semibold text-lg rounded-t-xl border-b-2 ' +
      'text-saft-brown-500 bg-transparent cursor-not-allowed opacity-60'
  }

  if (active) {
    return 'tab-btn flex-1 px-4 py-3 font-semibold text-lg rounded-t-xl border-b-2 ' +
      'bg-white/30 text-saft-brown-900 border-saft-main-500 ' +
      'hover:bg-white/50 transition-all duration-200 active:scale-[0.98]'
  }

  return 'tab-btn flex-1 px-4 py-3 font-semibold text-lg rounded-t-xl border-b-2 ' +
    'text-saft-brown-500 bg-transparent border-transparent ' +
    'hover:bg-white/50 hover:text-saft-brown-900 transition-all duration-200 active:scale-[0.98]'
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