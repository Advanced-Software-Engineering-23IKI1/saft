<script setup>
import { Speaker, Volume2 } from 'lucide-vue-next';
import { RouterLink } from 'vue-router'

</script>

<template>
  <div class="flex flex-col gap-6 mb-6 ">
    <div class="w-full flex justify-center">
      <!-- Play Button -->
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
      </button>
    </div>
    <div class="flex justify-center">
      <button class=" w-full max-w-sm py-4
                                  text-lg text-white font-semibold
                                  bg-saft-blue-500
                                  hover:bg-saft-blue-600 
                                  active:scale-[0.95]
                                  rounded-full flex items-center justify-center 
                                  shadow-xl
                                  border-2 border-white/50 
                                  transition-all duration-200
                                  touch-manipulation">
        Export to MP3
      </button>
    </div>
  </div>
</template>
