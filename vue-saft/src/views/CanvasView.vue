<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Wand2 } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import { getState, setHasExport } from '@/store/saftState'

const router = useRouter()
const state = computed(() => getState())

function goNext(navigate) {
  setHasExport(true)
  navigate()
}
</script>

<template>
  <section class="space-y-6">
    <Card>
      <h1 class="text-xl font-semibold">Canvas</h1>
      <p class="mt-2 text-sm text-slate-300">
        Placeholder: hier kommt später Spektrogramm + Edit-Tools hin.
      </p>

      <div class="mt-6 flex flex-wrap gap-3">
        <RouterLink :to="{ name: 'download' }" custom v-slot="{ navigate }">
            <button
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            @click="goNext(navigate)"
            >
                <Wand2 class="h-4 w-4" />
                „Export ready“ → Download
            </button>
        </RouterLink>

      </div>
    </Card>

    <div class="text-xs text-slate-400">
      Debug state: {{ state }}
    </div>
  </section>
</template>
