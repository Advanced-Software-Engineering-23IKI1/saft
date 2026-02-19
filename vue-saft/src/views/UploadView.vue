<script setup>
import { computed } from 'vue' //
import { useRouter } from 'vue-router'
import { Upload, RotateCcw } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import { getState, setHasUpload } from '@/store/saftState'

const router = useRouter()
const state = computed(() => getState())

function goNext(navigate) {
  setHasUpload(true)
  navigate()
}

</script>

<template>
  <section class="space-y-6">
    <Card>
      <h1 class="text-xl font-semibold">Upload</h1>
      <p class="mt-2 text-sm text-slate-300">
        Placeholder: hier kommt später Datei-Upload/Record + Parameter hin.
      </p>

      <div class="mt-6 flex flex-wrap gap-3">
        <RouterLink :to="{ name: 'canvas' }" custom v-slot="{ navigate }">
            <button
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            @click="goNext(navigate)"
            >
                <Upload class="h-4 w-4" />
                Weiter zu Canvas
            </button>
        </RouterLink>
      </div>
    </Card>

    <div class="text-xs text-slate-400">
      Debug state: {{ state }}
    </div>
  </section>
</template>
