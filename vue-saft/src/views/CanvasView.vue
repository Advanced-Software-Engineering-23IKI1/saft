<script setup>

import { ref } from 'vue';
import { Undo, Redo, ArrowDownToLine, Move, Brush, Eraser, TextCursorInput, ImagePlus } from 'lucide-vue-next';

function goNext(navigate) {
    navigate()
}

import SpectrogramCanvas from '@/components/ui/SpectrogramCanvas.vue'
import { Tool } from '@/enums/ToolEnum.js';
import { applyCombinedUpdateToSpectrogram, redoUpdate, undoUpdate } from '@/utils/updateUtils';
import { updateStore } from '@/store/store';



const activeTool = ref(Tool.Movement)

const spectrogramRef = ref(null)

function redraw() {
    spectrogramRef.value?.invalidate()
}


</script>

<template>
    <div class="flex flex-col gap-3 mb-4">
        <!-- Image Container – Responsive + Horizontal Scroll -->
        <div class="w-full h-[45vh] flex flex-col p-1">
            <div class="h-full flex bg-saft-brown-50/90 backdrop-blur-md
      rounded-2xl shadow-2xl relative overflow-hidden">
                <SpectrogramCanvas ref="spectrogramRef" :active-tool="activeTool" />
            </div>
            <!-- Toolbar -->
            <div class="w-full flex flex-col sm:flex-row justify-center gap-3 py-4 px-2 items-center">
                <div
                    class="flex gap-2 bg-saft-brown-50 backdrop-blur-lg border-2 border-saft-blue-200/90 rounded-2xl p-3 shadow-2xl">
                    <button @click="activeTool = Tool.Movement"
                        :class="[activeTool === Tool.Movement ? 'bg-saft-mint-500 hover:bg-saft-mint-600' : 'bg-saft-mint-200 hover:bg-saft-mint-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="1">
                        <Move class="w-7 h-7 brightness-0 dark:invert absolute inset-0 m-auto"/>
                    </button>
                    <button @click="activeTool = Tool.Brush"
                        :class="[activeTool === Tool.Brush ? 'bg-saft-mint-500 hover:bg-saft-mint-600' : 'bg-saft-mint-200 hover:bg-saft-mint-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="2">
                        <Brush class="w-7 h-7 brightness-0 dark:invert absolute inset-0 m-auto"/>
                    </button>
                    <button @click="activeTool = Tool.Brush2"
                        :class="[activeTool === Tool.Brush2 ? 'bg-saft-mint-500 hover:bg-saft-mint-600' : 'bg-saft-mint-200 hover:bg-saft-mint-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="2">
                        <Eraser class="w-7 h-7 brightness-0 dark:invert absolute inset-0 m-auto"/>
                    </button>
                    <button @click="activeTool = Tool.Text"
                        :class="[activeTool === Tool.Text ? 'bg-saft-mint-500 hover:bg-saft-mint-600' : 'bg-saft-mint-200 hover:bg-saft-mint-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="3">
                        <TextCursorInput class="w-7 h-7 brightness-0 dark:invert absolute inset-0 m-auto"/>
                    </button>
                    <button @click="activeTool = Tool.Image"
                        :class="[activeTool === Tool.Image ? 'bg-saft-mint-500 hover:bg-saft-mint-600' : 'bg-saft-mint-200 hover:bg-saft-mint-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="4">
                        <ImagePlus class="w-7 h-7 brightness-0 dark:invert absolute inset-0 m-auto"/>
            
                    </button>
                </div>
                
                <!-- v-show="activeTool === Tool.Brush || activeTool === Tool.Text || activeTool === Tool.Image" -->
                <div
                    class="flex gap-2 bg-white/95 backdrop-blur-lg border-2 border-saft-blue-200/90 rounded-2xl p-3 shadow-2xl">
                    <button @click="() => { redoUpdate(); redraw(); }"
                        :class="[(updateStore.inactiveUpdates.length > 0) ? 'bg-saft-main-500 hover:bg-saft-main-600' : 'bg-saft-main-200 hover:bg-saft-main-300']"
                        class=" w-16 h-16 active:scale-[0.95] rounded-xl flex flex-col items-center justify-center shadow-lg transition-all">
                        <Redo class="w-7 h-7 stroke-white" />
                        <span class="text-[10px] text-white leading-none mt-1">Redo</span>
                    </button>

                    <button @click="() => { applyCombinedUpdateToSpectrogram(); redraw(); }"
                        :class="[(updateStore.activeUpdates.length > 0) ? 'bg-saft-main-500 hover:bg-saft-main-600' : 'bg-saft-main-200 hover:bg-saft-main-300']"
                        class=" w-16 h-16 active:scale-[0.95] rounded-xl flex flex-col items-center justify-center shadow-lg transition-all">
                        <ArrowDownToLine class="w-7 h-7 stroke-white" />
                        <span class="text-[10px] text-white leading-none mt-1">Apply</span>
                    </button>

                    <button @click="() => { undoUpdate(); redraw(); }"
                        :class="[(updateStore.activeUpdates.length > 0) ? 'bg-saft-main-500 hover:bg-saft-main-600' : 'bg-saft-main-200 hover:bg-saft-main-300']"
                        class=" w-16 h-16 active:scale-[0.95] rounded-xl flex flex-col items-center justify-center shadow-lg transition-all">
                        <Undo class="w-7 h-7 stroke-white" />
                        <span class="text-[10px] text-white leading-none mt-1">Undo</span>
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
