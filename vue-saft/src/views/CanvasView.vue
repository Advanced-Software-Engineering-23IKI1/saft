<template>
  <section class="space-y-6">
    <Card>
      <h1 class="text-xl font-semibold">Canvas</h1>
      <p class="mt-2 text-sm text-slate-300">
        Placeholder: hier kommt später Spektrogramm + Edit-Tools hin.
      </p>

      <div class="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" @click="back">
          <ArrowLeft class="h-4 w-4" />
          Zurück zu Upload
        </Button>

        <Button variant="success" @click="goNext">
          <Wand2 class="h-4 w-4" />
          „Export ready“ → Download
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
import { ArrowLeft, Wand2 } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import { getState, setHasExport } from '@/store/saftState'

const router = useRouter()
const state = computed(() => getState())

function back() {
  router.push({ name: 'upload' })
}

function goNext() {
  setHasExport(true)
  router.push({ name: 'download' })
}
</script>
