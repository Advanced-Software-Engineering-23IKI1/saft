<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Home } from 'lucide-vue-next'
import { getState, resetState } from '@/store/saftState'

const state = computed(() => getState())

function startOver(navigate) {
  resetState()
  navigate()
}
</script>

<template>
  <section class="space-y-6">
    <div class="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
      <h1 class="text-xl font-semibold">Download</h1>
      <p class="mt-2 text-sm text-slate-300">
        Placeholder: hier kommt später Abspielen/Download hin.
      </p>

      <div class="mt-6 flex flex-wrap gap-3">
        <RouterLink :to="{ name: 'upload' }" custom v-slot="{ navigate }">
          <button
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            @click="startOver(navigate)"
          >
            <Home class="h-4 w-4" />
            Neuer Durchlauf
          </button>
        </RouterLink>
      </div>
    </div>

    <div class="text-xs text-slate-400">
      Debug state: {{ state }}
    </div>
  </section>
</template>
