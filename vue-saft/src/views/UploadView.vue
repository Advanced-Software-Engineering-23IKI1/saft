<script setup>

import { useTemplateRef, reactive, ref } from 'vue';
import { getSample, closeAudio } from '@/utils/input';
import { computeSpectrogram, computeSpectrogramRenderingData } from '@/utils/spectrogram';
import { spectrogramStore } from '@/store/store';

const fileInput = useTemplateRef('fileInput');
const conversionProgress = ref(0);
const fileSelected = ref(false);

const maxFreq = 20000
const minFreq = 0
const windowSize = 2048
const hopSize = 250
const channel = 0;

async function retrieveSample() {

    spectrogramStore.spectrogram = null;
    spectrogramStore.renderData = null;

    const sample = await getSample(fileInput.value, channel);
    if (!sample) return;

    spectrogramStore.spectrogram = await computeSpectrogram(sample.samples, sample.sampleRate, windowSize, hopSize, conversionProgress);

    closeAudio();

    spectrogramStore.renderData = await computeSpectrogramRenderingData(spectrogramStore.spectrogram, sample.sampleRate, minFreq, maxFreq, conversionProgress);

    conversionProgress.value = 0

    //updateMinZoom()
    //checkInternalOffsetValues()
    //invalidate();
}

function handleFileSelect() {
    fileSelected.value = fileInput.value?.files?.length > 0;
}

async function goNext(navigate) {
    try {
        await retrieveSample()
        if (spectrogramStore.renderData) {
            navigate()
        } else {
            alert("Failed to process the audio file. Please try again with a different file.")
        }
    } catch (error) {
        console.error("Error processing the audio file:", error);
        alert("An error occurred while processing the audio file. Please try again with a different file.")
    }
}
import microfonicon from '@/assets/img/micIcon.png'
import uploadicon from '@/assets/img/uploadIcon.png'
</script>

<template>
    <div class="flex flex-col gap-3 mb-4">
        <!-- Zwei Buttons horizontal nebeneinander -->
        <div class="flex justify-center gap-6 mb-6">
            <!-- Mic Button -->
            <button class=" w-24 h-24
                          bg-saft-main-500
                          hover:bg-saft-main-600 
                          active:scale-[0.95]
                          rounded-full flex items-center justify-center 
                          shadow-xl
                          border-2 border-white/50 
                          transition-all duration-200
                          touch-manipulation">
                <img :src="microfonicon" class="w-12 h-12 brightness-0 invert" alt="Mikrofon" />
            </button>
            <!-- Upload Button (identisch) -->
            <label for="fileInput" :class="[fileSelected ? 'bg-green-500 hover:bg-green-600' : 'bg-saft-main-500 hover:bg-saft-main-600']" class=" w-24 h-24
                          active:scale-[0.95]
                          rounded-full flex items-center justify-center 
                          shadow-xl
                          border-2 border-white/50 
                          transition-all duration-200
                          touch-manipulation" >
                <img :src="uploadicon" class="w-11 h-11 brightness-0 invert" alt="Upload" />
            </label>
            <input style="display: none" type="file" ref="fileInput" id="fileInput" accept=".wav, .mp3, audio/wav, audio/mpeg" @change="handleFileSelect">
        </div>
        <div class="flex flex-col gap-1 mb-4">
            <label for="stride" class="text-lg font-semibold text-saft-brown-700">
                Stride
            </label>
            <div class="relative">
                <input type="number" id="stride" min="0" step="0.1" placeholder="0.0" class="w-full py-4 pl-4 pr-4 text-lg font-semibold text-saft-brown-900
          bg-white/80 backdrop-blur-sm rounded-full border-2 border-saft-blue-200/50 
          focus:border-saft-blue-400 focus:ring-4 focus:ring-saft-blue-200/50
          shadow-lg hover:shadow-xl transition-all duration-200
          invalid:text-red-500 invalid:border-red-300"
                    oninput="this.value = !!this.value && this.value >= 0 ? this.value : ''" />
            </div>
        </div>
        <div class="flex flex-col gap-1 mb-4">
            <label for="windowSize" class="text-lg font-semibold text-saft-brown-700">
                Window Size
            </label>
            <div class="relative">
                <input type="number" id="windowSize" min="0" step="1" placeholder="0" class="w-full py-4 pl-4 pr-4 text-lg font-semibold text-saft-brown-900
          bg-white/80 backdrop-blur-sm rounded-full border-2 border-saft-blue-200/50 
          focus:border-saft-blue-400 focus:ring-4 focus:ring-saft-blue-200/50
          shadow-lg hover:shadow-xl transition-all duration-200
          invalid:text-red-500 invalid:border-red-300"
                    oninput="this.value = !!this.value && this.value >= 0 ? this.value : ''" />
            </div>
        </div>
        <div class="flex flex-col gap-1 mb-4">
            <label for="nbins" class="text-lg font-semibold text-saft-brown-700">
                n bins
            </label>
            <div class="relative">
                <input type="number" id="nbins" min="0" step="1" placeholder="0" class="w-full py-4 pl-4 pr-4 text-lg font-semibold text-saft-brown-900
          bg-white/80 backdrop-blur-sm rounded-full border-2 border-saft-blue-200/50 
          focus:border-saft-blue-400 focus:ring-4 focus:ring-saft-blue-200/50
          shadow-lg hover:shadow-xl transition-all duration-200
          invalid:text-red-500 invalid:border-red-300"
                    oninput="this.value = !!this.value && this.value >= 0 ? this.value : ''" />
            </div>
        </div>
        <RouterLink :to="{ name: 'canvas' }" custom v-slot="{ navigate }">
            <button id="createSpectrogramButton" class="w-full py-4
                      text-lg text-white font-semibold
                      active:scale-[0.95]
                      rounded-full flex items-center justify-center 
                      shadow-xl
                      border-2 border-white/50 
                      transition-all duration-200
                      touch-manipulation" @click="goNext(navigate)"
                      :style="{'--progress-value': conversionProgress}">
                Create Spectrogram
            </button>
        </RouterLink>
    </div>
</template>

<style scoped>
#createSpectrogramButton:hover {
    background: linear-gradient(to right, var(--color-saft-blue-700) 0%, var(--color-saft-blue-700) calc(var(--progress-value) * 100%), var(--color-saft-blue-600) calc(var(--progress-value) * 100%), var(--color-saft-blue-600) 100%);
}
#createSpectrogramButton {
    /*var(--color-saft-blue-500)*/
    background: linear-gradient(to right, var(--color-saft-blue-700) 0%, var(--color-saft-blue-700) calc(var(--progress-value) * 100%), var(--color-saft-blue-500) calc(var(--progress-value) * 100%), var(--color-saft-blue-500) 100%);
}
</style>