<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Home } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import { getState, resetState } from '@/store/saftState'

const router = useRouter()
const state = computed(() => getState())

function back() {
  router.push({ name: 'canvas' })
}

function startOver() {
  resetState()
  router.push({ name: 'upload' })
}
</script>
<template>
  <section class="space-y-6">
    <Card>
      <h1 class="text-xl font-semibold">Download</h1>
      <p class="mt-2 text-sm text-slate-300">
        Placeholder: hier kommt später Abspielen/Download hin.
      </p>

      <div class="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" @click="back">
          <ArrowLeft class="h-4 w-4" />
          Zurück zu Canvas
        </Button>

        <Button variant="primary" @click="startOver">
          <Home class="h-4 w-4" />
          Neuer Durchlauf
        </Button>
      </div>
    </Card>

    <div class="text-xs text-slate-400">
      Debug state: {{ state }}
    </div>
  </section>
</template>


