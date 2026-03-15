<script setup>
import { ref, watch, onBeforeUnmount, computed } from 'vue'
import { Play, Pause } from 'lucide-vue-next'

const props = defineProps({
  file: {
    type: Object,
    default: null
  }
})

const audioElement = ref(null)
const audioPreviewUrl = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

const progress = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

const fileName = computed(() => {
  return props.file?.name || 'Audio preview'
})

function formatTime(value) {
  if (!Number.isFinite(value)) return '0:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const currentTimeLabel = computed(() => formatTime(currentTime.value))
const durationLabel = computed(() => formatTime(duration.value))

watch(
  () => props.file,
  async (newFile) => {
    if (audioPreviewUrl.value) {
      URL.revokeObjectURL(audioPreviewUrl.value)
      audioPreviewUrl.value = null
    }

    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0

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

function togglePlayback() {
  if (!audioElement.value) return

  if (audioElement.value.paused) {
    audioElement.value.play()
  } else {
    audioElement.value.pause()
  }
}

function onLoadedMetadata() {
  duration.value = audioElement.value?.duration || 0
}

function onTimeUpdate() {
  currentTime.value = audioElement.value?.currentTime || 0
}

function onPlay() {
  isPlaying.value = true
}

function onPause() {
  isPlaying.value = false
}

function onEnded() {
  isPlaying.value = false
  currentTime.value = 0
}

function seekAudio(event) {
  if (!audioElement.value || !duration.value) return

  const rect = event.currentTarget.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percent = Math.max(0, Math.min(1, clickX / rect.width))
  audioElement.value.currentTime = percent * duration.value
}
</script>

<template>
  <div
    v-if="audioPreviewUrl"
    class="w-full max-w-[22rem] mx-auto mb-4
           bg-saft-brown-50 backdrop-blur-sm
           rounded-3xl border-2 border-saft-blue-200/50
           shadow-lg px-4 py-4"
  >
    <audio
      ref="audioElement"
      :src="audioPreviewUrl"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
      class="hidden"
    ></audio>

    <div class="flex items-center gap-4">
      <button
        type="button"
        @click="togglePlayback"
        class="w-14 h-14 shrink-0 rounded-full
               bg-saft-main-500 hover:bg-saft-main-600
               active:scale-[0.95]
               text-white
               flex items-center justify-center
               shadow-md transition-all duration-200"
      >
        <Play v-if="!isPlaying" class="w-6 h-6 ml-0.5 fill-white" />
        <Pause v-else class="w-6 h-6" />
      </button>

      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold text-saft-brown-900 truncate">
          {{ fileName }}
        </div>

        <button
          type="button"
          @click="seekAudio"
          class="w-full mt-3 h-3 rounded-full overflow-hidden
                 bg-saft-blue-100 block"
        >
          <div
            class="h-full bg-saft-main-500 transition-all duration-100"
            :style="{ width: `${progress}%` }"
          ></div>
        </button>

        <div class="mt-2 flex justify-between text-xs text-saft-brown-600">
          <span>{{ currentTimeLabel }}</span>
          <span>{{ durationLabel }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
