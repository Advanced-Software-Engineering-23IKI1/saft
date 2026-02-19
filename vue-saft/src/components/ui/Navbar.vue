<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { state } from '@/store/saftState'

const route = useRoute()

const steps = computed(() => ([
  { name: 'upload', label: 'Upload', enabled: true },
  { name: 'canvas', label: 'Canvas', enabled: state.hasUpload },
  { name: 'download', label: 'Download', enabled: state.hasExport },
]))

function stepClass(enabled, active) {
  if (!enabled) return 'px-3 py-1.5 text-sm font-semibold rounded-lg bg-slate-800 text-slate-400 cursor-not-allowed'
  if (active) return 'px-3 py-1.5 text-sm font-semibold rounded-lg bg-indigo-600 text-white'
  return 'px-3 py-1.5 text-sm font-semibold rounded-lg bg-indigo-600/50 text-indigo-200 hover:bg-indigo-600/30'
}
</script>

<template>
    <nav class="flex items-center gap-2">
            <RouterLink
              v-for="s in steps"
              :key="s.name"
              :to="{ name: s.name }"
              custom
              v-slot="{ navigate }"
            >
              <button
                :class="stepClass(s.enabled, route.name === s.name)"
                @click="s.enabled && navigate()"
              >
                {{ s.label }}
              </button>
            </RouterLink>
          </nav>
</template>