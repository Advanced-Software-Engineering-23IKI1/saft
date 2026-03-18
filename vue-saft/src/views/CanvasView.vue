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
import SpectrogramCanvas from '@/components/ui/SpectrogramCanvas.vue'
import { Tool } from '@/enums/ToolEnum.js';
import { downloadSpectrogram } from '@/utils/spectrogram';



const activeTool = ref(Tool.Movement)


</script>

<template>
    <div class="flex flex-col gap-3 mb-4">
        <!-- Image Container -->
        <div class="w-full h-[45vh] flex flex-col p-1">
            <div class="h-full flex bg-saft-brown-50/90 backdrop-blur-md
      rounded-2xl shadow-2xl relative overflow-hidden">
                <SpectrogramCanvas :active-tool="activeTool" />
            </div>
            <!-- Toolbar -->
            <div class="w-full flex justify-center gap-3 py-4 px-2">
                <div
                    class="flex gap-2 bg-saft-brown-50 backdrop-blur-lg border-2 border-saft-blue-200/90 rounded-2xl p-3 shadow-2xl">
                    <button @click="activeTool = Tool.Movement"
                        :class="[activeTool === Tool.Movement ? 'bg-saft-mint-500 hover:bg-saft-mint-600' : 'bg-saft-mint-200 hover:bg-saft-mint-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="1">
                        <img :src="scrollicon" class="w-7 h-7 brightness-0 dark:invert absolute inset-0 m-auto" alt="Scroll">
                    </button>
                    <button @click="activeTool = Tool.Brush"
                        :class="[activeTool === Tool.Brush ? 'bg-saft-mint-500 hover:bg-saft-mint-600' : 'bg-saft-mint-200 hover:bg-saft-mint-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="2">
                        <img :src="brushicon" class="w-7 h-7 brightness-0 dark:invert absolute inset-0 m-auto" alt="Brush">
                    </button>
                    <button @click="activeTool = Tool.Text"
                        :class="[activeTool === Tool.Text ? 'bg-saft-mint-500 hover:bg-saft-mint-600' : 'bg-saft-mint-200 hover:bg-saft-mint-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="3">
                        <img :src="texticon" class="w-7 h-7 brightness-0 dark:invert absolute inset-0 m-auto" alt="Text">
                    </button>
                    <button @click="activeTool = Tool.Image"
                        :class="[activeTool === Tool.Image ? 'bg-saft-mint-500 hover:bg-saft-mint-600' : 'bg-saft-mint-200 hover:bg-saft-mint-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="4">
                        <img :src="erasericon" class="w-7 h-7 brightness-0 dark:invert absolute inset-0 m-auto" alt="Eraser">
                    </button>
                    <button
                        class="w-14 h-14 bg-saft-main-400 hover:bg-saft-main-500 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="5">
                        <img :src="deleteicon" class="w-7 h-7 brightness-0 dark:invert absolute inset-0 m-auto" alt="Delete">
                    </button>
                    <button @click="downloadSpectrogram"
                        class="w-14 h-14 bg-saft-main-400 hover:bg-saft-main-500 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="5">
                        <img :src="deleteicon" class="w-7 h-7 brightness-0 dark:invert absolute inset-0 m-auto" alt="Delete">
                    </button>
                </div>
            </div>
        </div>
        <RouterLink :to="{ name: 'download' }" custom v-slot="{ navigate }">
            <div class="flex justify-center">
                <button class="w-full max-w-sm py-4
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
            </div>
        </RouterLink>
    </div>
</template>
