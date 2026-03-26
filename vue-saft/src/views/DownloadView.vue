<script setup>
import Mediaplayer from '@/components/ui/Mediaplayer.vue'
import { audioStore } from '@/store/store'
import { ref, watch } from 'vue'

const currentAudioFile = ref(null)

watch(
  () => audioStore.audioFile,
  (file) => {
    currentAudioFile.value = file ?? null
  },
  { immediate: true }
)


function downloadWav() {
  if (!currentAudioFile.value) return

  const file = currentAudioFile.value
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')

  link.href = url
  link.download = file.name || 'audio.wav'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  setTimeout(() => URL.revokeObjectURL(url), 100)
}

</script>

<template>
  <div class="flex flex-col gap-6 mb-6 ">
    <div class="w-full flex justify-center">
      <!-- Play Button  
      <button class=" w-20 h-20
                                        bg-saft-main-500
                                        hover:bg-saft-main-600 
                                        active:scale-[0.95]
                                        rounded-full flex items-center justify-center 
                                        shadow-xl
                                        border-2 border-white/50 
                                        transition-all duration-200
                                        touch-manipulation">
        <Volume2 class="w-11 h-11 brightness-0 invert" />
      </button> -->
    </div>
    <Mediaplayer :file="currentAudioFile" />

    <div class="flex justify-center">
      <button @click="downloadWav" class=" w-full max-w-sm py-4
                                  text-lg text-white font-semibold
                                  bg-saft-blue-500
                                  hover:bg-saft-blue-600 
                                  active:scale-[0.95]
                                  rounded-full flex items-center justify-center 
                                  shadow-xl
                                  border-2 border-white/50 
                                  transition-all duration-200
                                  touch-manipulation">
        Download WAV
      </button>
    </div>
  </div>
</template>
