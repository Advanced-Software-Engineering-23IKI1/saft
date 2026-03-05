<script setup>
import { RouterLink } from 'vue-router'

import speakericon from '@/assets/img/speaker.png'

</script>

<template>
  <div class="flex flex-col gap-6 mb-6 ">
    <div class="w-full flex justify-center">
      <!-- Play Button -->
      <button class=" w-32 h-32
                                        bg-saft-main-500
                                        hover:bg-saft-main-600 
                                        active:scale-[0.95]
                                        rounded-full flex items-center justify-center 
                                        shadow-xl
                                        border-2 border-white/50 
                                        transition-all duration-200
                                        touch-manipulation">
        <img :src="speakericon" class="w-20 h-20 brightness-0 invert" alt="Mikrofon" />
      </button>
    </div>
    <button class=" w-full py-4
                                text-lg text-white font-semibold
                                bg-saft-main-500
                                hover:bg-saft-main-600 
                                active:scale-[0.95]
                                rounded-full flex items-center justify-center 
                                shadow-xl
                                border-2 border-white/50 
                                transition-all duration-200
                                touch-manipulation">
      Export to MP3
    </button>
  </div>
</template>
