<script setup>

import { ref } from 'vue';

function goNext(navigate) {
    navigate()
}
import scrollicon from '@/assets/img/scroll.png'
import brushicon from '@/assets/img/brush.png'
import texticon from '@/assets/img/text.png'
import erasericon from '@/assets/img/eraser.png'
import deleteicon from '@/assets/img/delete.png'
import SpektrogramCanvas from '@/components/ui/SpektrogramCanvas.vue'

const activeTool = ref(1) // 1: Scroll, 2: Brush, 3: Text, 4: Eraser


</script>

<template>
    <div class="flex flex-col gap-3 mb-4">
        <!-- Image Container – Responsive + Horizontal Scroll -->
        <div class="w-full h-[60vh] flex flex-col p-1">
            <div class="flex-1 bg-saft-brown-50/90 backdrop-blur-md border-4 border-saft-blue-300/70 
      rounded-3xl shadow-2xl relative overflow-hidden">
                <SpektrogramCanvas :active-tool="activeTool" />
            </div>
            <!-- Toolbar -->
            <div class="w-full flex justify-center gap-3 py-4 px-2">
                <div
                    class="flex gap-2 bg-white/95 backdrop-blur-lg border-2 border-saft-blue-200/90 rounded-2xl p-3 shadow-2xl">
                    <button @click="activeTool = 1"
                        :class="[activeTool === 1 ? 'bg-saft-main-500 hover:bg-saft-main-600' : 'bg-saft-main-200 hover:bg-saft-main-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="1">
                        <img :src="scrollicon" class="w-7 h-7 brightness-0 invert absolute inset-0 m-auto" alt="Scroll">
                    </button>
                    <button @click="activeTool = 2"
                        :class="[activeTool === 2 ? 'bg-saft-blue-500 hover:bg-saft-blue-600' : 'bg-saft-blue-200 hover:bg-saft-blue-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="2">
                        <img :src="brushicon" class="w-7 h-7 brightness-0 invert absolute inset-0 m-auto" alt="Brush">
                    </button>
                    <button @click="activeTool = 3"
                        :class="[activeTool === 3 ? 'bg-saft-brown-500 hover:bg-saft-brown-600' : 'bg-saft-brown-200 hover:bg-saft-brown-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="3">
                        <img :src="texticon" class="w-7 h-7 brightness-0 invert absolute inset-0 m-auto" alt="Text">
                    </button>
                    <button @click="activeTool = 4"
                        :class="[activeTool === 4 ? 'bg-saft-mint-500 hover:bg-saft-mint-600' : 'bg-saft-mint-200 hover:bg-saft-mint-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="4">
                        <img :src="erasericon" class="w-7 h-7 brightness-0 invert absolute inset-0 m-auto" alt="Eraser">
                    </button>
                    <button
                        class="w-14 h-14 bg-saft-main-400 hover:bg-saft-main-500 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="5">
                        <img :src="deleteicon" class="w-7 h-7 brightness-0 invert absolute inset-0 m-auto" alt="Delete">
                    </button>
                </div>
            </div>
        </div>
        <RouterLink :to="{ name: 'download' }" custom v-slot="{ navigate }">
            <button class="w-full py-4
                      text-lg text-white font-semibold
                      bg-saft-blue-500
                      hover:bg-saft-blue-600 
                      active:scale-[0.95]
                      rounded-full flex items-center justify-center 
                      shadow-xl
                      border-2 border-white/50 
                      transition-all duration-200
                      touch-manipulation" @click="goNext(navigate)">
                Compute Spectrogram
            </button>
        </RouterLink>
    </div>
</template>
