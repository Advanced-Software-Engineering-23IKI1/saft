<script setup>

import { ref } from 'vue';
import { Undo, Redo, Move, Brush, Eraser, LoaderCircle, Download } from 'lucide-vue-next';
import SpectrogramCanvas from '@/components/ui/SpectrogramCanvas.vue'
import { Tool } from '@/enums/ToolEnum.js';
import { applyCombinedUpdateToSpectrogram, redoUpdate, undoUpdate } from '@/utils/updateUtils';
import { audioStore, spectrogramStore, updateStore } from '@/store/store';
import { useSaftFileWorker } from '@/utils/useSaftFileWorker';
import { encodeWAV, reverseFFT } from '@/utils/png_to_audio';

const conversionProgress = ref(0)
const conversionName = ref('Create Audio')


const activeTool = ref(Tool.Movement)
const { exportSpectrogram, isLoading } = useSaftFileWorker()

const spectrogramRef = ref(null)

function redraw() {
    spectrogramRef.value?.invalidate()
}

function applyAndExport() {
    applyCombinedUpdateToSpectrogram();
    redraw();
    exportSpectrogram();
}

async function convertToWav() {
    applyCombinedUpdateToSpectrogram();
    redraw();

    const data = spectrogramStore.renderData.data
    const phase = spectrogramStore.renderData.phase
    const windowSize = spectrogramStore.renderData.windowSize
    const hopSize = spectrogramStore.renderData.hopSize
    const sampleRate = spectrogramStore.renderData.sampleRate

    const samples = await reverseFFT(data, phase, windowSize, hopSize, conversionName, conversionProgress);
    audioStore.audioFile = encodeWAV(samples, sampleRate);
}


async function goNext(navigate) {
    try {
        await convertToWav()
        if (audioStore.audioFile) {
            navigate()
        }

    } catch (error) {
        console.error('Error processing the audio file:', error)
        alert('An error occurred while processing the audio file. Please try again with a different file.')
    }
}


</script>

<template>
    <div class="flex flex-col gap-3 mb-4">
        <!-- Image Container – Responsive + Horizontal Scroll -->
        <div class="w-full  flex flex-col px-5">
            <div class=" flex bg-saft-brown-50/90 backdrop-blur-md
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
                        <Move class="w-7 h-7 brightness-0 dark:invert absolute inset-0 m-auto" />

                    </button>
                    <button @click="activeTool = Tool.Brush"
                        :class="[activeTool === Tool.Brush ? 'bg-saft-mint-500 hover:bg-saft-mint-600' : 'bg-saft-mint-200 hover:bg-saft-mint-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="2">
                        <Brush class="w-7 h-7 brightness-0 dark:invert absolute inset-0 m-auto" />
                    </button>
                    <button @click="activeTool = Tool.Brush2"
                        :class="[activeTool === Tool.Brush2 ? 'bg-saft-mint-500 hover:bg-saft-mint-600' : 'bg-saft-mint-200 hover:bg-saft-mint-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="2">
                        <Eraser class="w-7 h-7 brightness-0 dark:invert absolute inset-0 m-auto" />

                    </button>
                </div>


                <div
                    class="flex gap-2 bg-saft-brown-50 backdrop-blur-lg border-2 border-saft-blue-200/90 rounded-2xl p-3 shadow-2xl">
                    <button @click="() => { redoUpdate(); redraw(); }"
                        :class="[(updateStore.inactiveUpdates.length > 0) ? 'bg-saft-main-500 hover:bg-saft-main-600' : 'bg-saft-main-200 hover:bg-saft-main-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex flex-col items-center justify-center shadow-lg transition-all relative overflow-hidden">
                        <Redo class="w-7 h-7 stroke-black dark:invert" />
                        <span class="text-[10px] text-black dark:invert leading-none mt-1">Redo</span>
                    </button>

                    <button @click="() => { undoUpdate(); redraw(); }"
                        :class="[(updateStore.activeUpdates.length > 0) ? 'bg-saft-main-500 hover:bg-saft-main-600' : 'bg-saft-main-200 hover:bg-saft-main-300']"
                        class="w-14 h-14 active:scale-[0.95] rounded-xl flex flex-col items-center justify-center shadow-lg transition-all relative overflow-hidden">
                        <Undo class="w-7 h-7 stroke-black dark:invert" />
                        <span class="text-[10px] text-black dark:invert leading-none mt-1">Undo</span>
                    </button>

                    <button @click="applyAndExport" :disabled="isLoading"
                        class="w-14 h-14 bg-saft-main-400 hover:bg-saft-main-500 disabled:bg-saft-main-300 disabled:cursor-not-allowed 
                        active:scale-[0.95] rounded-xl flex flex-col items-center justify-center shadow-lg transition-all relative overflow-hidden" data-tool="5">
                        <LoaderCircle v-if="isLoading" class="w-6 h-6 animate-spin  dark:invert" />
                        <Download v-else class="w-7 h-7 stroke-black dark:invert" />
                        <span class="text-[10px] text-black dark:invert leading-none mt-1">Save</span>
                    </button>

                </div>

            </div>
        </div>
        <RouterLink :to="{ name: 'download' }" custom v-slot="{ navigate }">
            <div class="flex justify-center">
                <button id="createAudioButton" class="w-full max-w-sm py-4
                        text-lg text-white font-semibold
                        bg-saft-blue-500
                        hover:bg-saft-blue-600 
                        active:scale-[0.95]
                        rounded-full flex items-center justify-center 
                        shadow-xl
                        border-2 border-white/50 
                        transition-all duration-200
                        touch-manipulation" @click="goNext(navigate)"
                        :style="{ '--progress-value': conversionProgress}">
                    {{ conversionName }}
                </button>
            </div>
        </RouterLink>
    </div>
</template>

<style scoped>
#createAudioButton:hover {
    background: linear-gradient(to right, var(--color-saft-blue-700) 0%, var(--color-saft-blue-700) calc(var(--progress-value) * 100%), var(--color-saft-blue-600) calc(var(--progress-value) * 100%), var(--color-saft-blue-600) 100%);
}

#createAudioButton {
    /*var(--color-saft-blue-500)*/
    background: linear-gradient(to right, var(--color-saft-blue-700) 0%, var(--color-saft-blue-700) calc(var(--progress-value) * 100%), var(--color-saft-blue-500) calc(var(--progress-value) * 100%), var(--color-saft-blue-500) 100%);
}


</style>