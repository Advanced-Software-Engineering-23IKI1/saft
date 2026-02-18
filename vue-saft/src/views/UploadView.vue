<template>
  <section class="space-y-6">
    <Card>
      <h1 class="text-xl font-semibold">Upload</h1>
      <p class="mt-2 text-sm text-slate-300">
        Placeholder: hier kommt später Datei-Upload/Record + Parameter hin.
      </p>

      <div class="mt-6 flex flex-wrap gap-3">
        <Button variant="primary" @click="goNext">
          <Upload class="h-4 w-4" />
          Weiter zu Canvas
        </Button>

        <Button variant="outline" @click="reset">
          <RotateCcw class="h-4 w-4" />
          Reset State
        </Button>
      </div>
    </Card>

    <div class="text-xs text-slate-400">
      Debug state: {{ state }}
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Upload, RotateCcw } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import { getState, setHasUpload, resetState } from '@/store/saftState'

const router = useRouter()
const state = computed(() => getState())

function goNext() {
  setHasUpload(true)
  router.push({ name: 'canvas' })
}

function reset() {
  resetState()
  router.push({ name: 'upload' })
}
</script>
