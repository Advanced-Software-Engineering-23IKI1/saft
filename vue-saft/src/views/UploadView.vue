<script setup>
import { useTemplateRef, computed, ref } from 'vue'
import { getSample, closeAudio } from '@/utils/input'
import { computeSpectrogram, computeSpectrogramRenderingData, importSpectrogram } from '@/utils/spectrogram'
import { spectrogramStore } from '@/store/store'
import MediaPlayer from '@/components/ui/Mediaplayer.vue'
import { useAudioRecorder } from '@/utils/useAudioRecorder'
import microfonicon from '@/assets/img/micIcon.png'
import uploadicon from '@/assets/img/uploadIcon.png'

const conversionProgress = ref(0)
const conversionName = ref('Create Spectrogram')

const fileInput = useTemplateRef('fileInput')
const fileSelected = ref(false)
const uploadedFile = ref(null)

const spectrogramInput = useTemplateRef('spectrogramInput')
const spectrogramSelected = ref(false)
const spectrogramFile = ref(null)

const {
    recordedFile,
    isRecording,
    recordedFileSelected,
    peakIndicator,
    toggleRecording,
    clearRecording,
} = useAudioRecorder()

const channel = 0

async function retrieveSample() {
    spectrogramStore.renderData = null

    let maxFreq = 20000
    let minFreq = 0
    let windowSize = 2048
    let hopSize = 250

    let spectrogram = null
    let sampleRate = null
    let freqBins = null
    let timeFrames = null

    if (!spectrogramFile.value) {
        const file = recordedFile.value ?? uploadedFile.value
        const sample = await getSample(file, channel)
        sampleRate = sample.sampleRate
        const samples = sample.samples
        if (!sample) return

        conversionName.value = 'Running FFT'
        const computedSpectrogram = await computeSpectrogram(
            samples,
            sampleRate,
            windowSize,
            hopSize,
            conversionProgress
        )
        spectrogram = computedSpectrogram.data
        freqBins = computedSpectrogram.freqBins
        timeFrames = computedSpectrogram.timeFrames

        await closeAudio()
    } else {

        const importedSpectrogram = await importSpectrogram(spectrogramFile.value)
        spectrogram = importedSpectrogram.spectrogram
        freqBins = importedSpectrogram.freqBins
        timeFrames = importedSpectrogram.timeFrames
        sampleRate = importedSpectrogram.sampleRate
        minFreq = importedSpectrogram.minFreq
        maxFreq = importedSpectrogram.maxFreq
        windowSize = importedSpectrogram.windowSize
        hopSize = importedSpectrogram.hopSize
    }


    conversionName.value = 'Prerendering Spectrogram'
    spectrogramStore.renderData = await computeSpectrogramRenderingData(
        spectrogram,
        freqBins,
        timeFrames,
        sampleRate,
        minFreq,
        maxFreq,
        conversionProgress
    )

    spectrogramStore.renderData.windowSize = windowSize
    spectrogramStore.renderData.hopSize = hopSize
    spectrogramStore.renderData.sampleRate = sampleRate
    spectrogramStore.renderData.minFreq = minFreq
    spectrogramStore.renderData.maxFreq = maxFreq
    spectrogramStore.renderData.freqBins = freqBins
    spectrogramStore.renderData.timeFrames = timeFrames

    conversionProgress.value = 0
    conversionName.value = 'Create Spectrogram'
}



function handleFileSelect() {
    uploadedFile.value = fileInput.value?.files?.[0] ?? null
    fileSelected.value = !!uploadedFile.value

    if (fileSelected.value) {
        clearRecording()
        resetSpectrogramSelection()
    }
}

function handleSpectrogramFileSelect() {
    spectrogramFile.value = spectrogramInput.value?.files?.[0] ?? null
    spectrogramSelected.value = !!spectrogramFile.value

    if (spectrogramSelected.value) {
        clearRecording()
        resetFileSelection()
    }
}

function resetFileSelection() {
    if (fileInput.value) {
        fileInput.value.value = ''
           uploadedFile.value = null
            fileSelected.value = false
    }
 
}

function resetSpectrogramSelection() {
    if (spectrogramInput.value) {
        spectrogramInput.value.value = ''
        spectrogramFile.value = null
        spectrogramSelected.value = false
    }
}
 

async function handleRecordingToggle() {
    if (!isRecording.value) {
        resetFileSelection()
        resetSpectrogramSelection()
    }

    await toggleRecording()
}

const currentAudioFile = computed(() => {
    return recordedFile.value ?? uploadedFile.value ?? null
})



async function goNext(navigate) {
    try {
        await retrieveSample()
        if (spectrogramStore.renderData) {
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
        <div class="flex justify-center gap-6">

            <!-- Record Button -->
            <button @click="handleRecordingToggle" :class="[
                isRecording
                    ? 'bg-red-500 hover:bg-red-600'
                    : recordedFileSelected
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-saft-main-500 hover:bg-saft-main-600'
            ]" class="relative overflow-hidden w-20 h-20
         active:scale-[0.95]
         rounded-full flex items-center justify-center
         shadow-xl border-2 border-white/50
         transition-all duration-200 touch-manipulation">
                <div v-if="isRecording"
                    class="absolute left-0 bottom-0 w-full bg-red-800/70 transition-all duration-100"
                    :style="{ height: `${Math.min(peakIndicator * 1.5, 100)}%` }"></div>

                <img :src="microfonicon" class="w-12 h-12 invert relative z-10" alt="Mikrofon" />
            </button>

            <!-- Upload Button -->
            <label for="fileInput"
                :class="[fileSelected ? 'bg-green-500 hover:bg-green-600' : 'bg-saft-main-500 hover:bg-saft-main-600']"
                class=" w-20 h-20
                          active:scale-[0.95]
                          rounded-full flex items-center justify-center 
                          shadow-xl
                          border-2 border-white/50 
                          transition-all duration-200
                          touch-manipulation">
                <img :src="uploadicon" class="w-11 h-11 invert" alt="Upload" />
            </label>
            <input style="display: none" type="file" ref="fileInput" id="fileInput"
                accept=".wav, .mp3, audio/wav, audio/mpeg" @change="handleFileSelect">


            <!-- Spektrogram Button -->
            <label for="spectrogramInput"
                :class="[spectrogramFile ? 'bg-green-500 hover:bg-green-600' : 'bg-saft-main-500 hover:bg-saft-main-600']"
                class=" w-20 h-20
                          active:scale-[0.95]
                          rounded-full flex items-center justify-center 
                          shadow-xl
                          border-2 border-white/50 
                          transition-all duration-200
                          touch-manipulation">
                <img :src="uploadicon" class="w-11 h-11 invert" alt="Upload" />
            </label>
            <input style="display: none" type="file" ref="spectrogramInput" id="spectrogramInput" accept=".saft"
                @change="handleSpectrogramFileSelect">


        </div>

        <MediaPlayer :file="currentAudioFile" />

        <div class="flex justify-center gap-6">
            <div class="grid grid-cols-[1fr_2fr] gap-x-2 gap-y-2 justify-items-center max-w-md">
                <!-- Stride Input -->
                <label for="stride" class="text-lg font-semibold text-saft-brown-700 justify-center flex items-center">
                    Stride
                </label>
                <div class="relative">
                    <input type="number" id="stride" min="0" step="0.1" placeholder="0.0" class="w-full max-w-xs py-2 pl-4 pr-4 text-lg font-semibold text-saft-brown-900
                bg-saft-brown-50 backdrop-blur-sm rounded-full border-2 border-saft-blue-200/50 
                focus:border-saft-blue-400 focus:ring-4 focus:ring-saft-blue-200/50
                shadow-lg hover:shadow-xl transition-all duration-200
                invalid:text-red-500 invalid:border-red-300"
                        oninput="this.value = !!this.value && this.value >= 0 ? this.value : ''" />
                </div>

                <!-- Window Size Input -->
                <label for="windowSize"
                    class="text-lg font-semibold text-saft-brown-700 justify-center flex items-center">
                    Win Size
                </label>
                <div class="relative">
                    <input type="number" id="windowSize" min="0" step="1" placeholder="0" class="w-full max-w-xs py-2 pl-4 pr-4 text-lg font-semibold text-saft-brown-900
                bg-saft-brown-50 backdrop-blur-sm rounded-full border-2 border-saft-blue-200/50 
                focus:border-saft-blue-400 focus:ring-4 focus:ring-saft-blue-200/50
                shadow-lg hover:shadow-xl transition-all duration-200
                invalid:text-red-500 invalid:border-red-300"
                        oninput="this.value = !!this.value && this.value >= 0 ? this.value : ''" />
                </div>

                <!-- N Bins Input -->
                <label for="nbins" class="text-lg font-semibold text-saft-brown-700 justify-center flex items-center">
                    n bins
                </label>
                <div class="relative">
                    <input type="number" id="nbins" min="0" step="1" placeholder="0" class="w-full max-w-xs py-2 pl-4 pr-4 text-lg font-semibold text-saft-brown-900
                bg-saft-brown-50 backdrop-blur-sm rounded-full border-2 border-saft-blue-200/50 
                focus:border-saft-blue-400 focus:ring-4 focus:ring-saft-blue-200/50
                shadow-lg hover:shadow-xl transition-all duration-200
                invalid:text-red-500 invalid:border-red-300"
                        oninput="this.value = !!this.value && this.value >= 0 ? this.value : ''" />
                </div>
            </div>
        </div>

        <RouterLink :to="{ name: 'canvas' }" custom v-slot="{ navigate }">
            <div class="flex justify-center">
                <!-- Create Spectrogram Button -->
                <button id="createSpectrogramButton" class="w-full max-w-sm py-4
                        text-lg text-white font-semibold
                        active:scale-[0.95]
                        rounded-full flex items-center justify-center 
                        shadow-xl
                        border-2 border-white/50 
                        transition-all duration-200
                        touch-manipulation" @click="goNext(navigate)"
                    :style="{ '--progress-value': conversionProgress }">
                    {{ conversionName }}
                </button>
            </div>
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