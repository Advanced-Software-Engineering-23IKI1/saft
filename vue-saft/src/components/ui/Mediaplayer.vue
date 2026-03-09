<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  file: {
    type: File,
    default: null
  }
})

const audioPreviewUrl = ref(null)

watch(
  () => props.file,
  (newFile) => {
    if (audioPreviewUrl.value) {
      URL.revokeObjectURL(audioPreviewUrl.value)
      audioPreviewUrl.value = null
    }

    if (newFile) {
      audioPreviewUrl.value = URL.createObjectURL(newFile)
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (audioPreviewUrl.value) {
    URL.revokeObjectURL(audioPreviewUrl.value)
  }
})
</script>

<template>
  <div v-if="audioPreviewUrl">
    <audio :src="audioPreviewUrl" controls></audio>
  </div>
</template>
