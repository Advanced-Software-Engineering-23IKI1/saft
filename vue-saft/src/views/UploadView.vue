<script setup>
import { useTemplateRef, computed, ref, watch } from 'vue'
import { getSample, closeAudio } from '@/utils/input'
import { computeSpectrogram, computeSpectrogramRenderingData } from '@/utils/spectrogram'
import { useSaftFileWorker } from '@/utils/useSaftFileWorker'
import { spectrogramStore } from '@/store/store'
import MediaPlayer from '@/components/ui/Mediaplayer.vue'
import { useAudioRecorder } from '@/utils/useAudioRecorder'

import { clearUpdates } from '@/utils/updateUtils'
import { Citrus, Mic, Upload, LoaderCircle, Music, HardDriveUpload } from 'lucide-vue-next';

const conversionProgress = ref(0)
const conversionName = ref('Create Spectrogram')

const fileInput = useTemplateRef('fileInput')
const fileSelected = ref(false)
const uploadedFile = ref(null)
const currentAudioFile = ref(null)

const { importSpectrogram, isLoading, isSpectrogram } = useSaftFileWorker()

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

    if (uploadedFile.value && (await isSpectrogram(uploadedFile.value))) {
        const importedSpectrogram = await importSpectrogram(uploadedFile.value)
        spectrogram = importedSpectrogram.spectrogram
        freqBins = importedSpectrogram.freqBins
        timeFrames = importedSpectrogram.timeFrames
        sampleRate = importedSpectrogram.sampleRate
        minFreq = importedSpectrogram.minFreq
        maxFreq = importedSpectrogram.maxFreq
        windowSize = importedSpectrogram.windowSize
        hopSize = importedSpectrogram.hopSize

    } else {
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
    }
}


function resetFileSelection() {
    if (fileInput.value) {
        fileInput.value.value = ''
        uploadedFile.value = null
        fileSelected.value = false
    }

}


async function handleRecordingToggle() {
    if (!isRecording.value) {
        resetFileSelection()
    }

    await toggleRecording()
}


watch(
  [uploadedFile, recordedFile],
  async ([uploaded, recorded]) => {
    if (uploaded && await isSpectrogram(uploaded.slice(0, 4))) {
      currentAudioFile.value = null
      return
    }
    currentAudioFile.value = recorded ?? uploaded ?? null
  },
  { immediate: true }
)


async function goNext(navigate) {
    try {
        await retrieveSample()
        if (spectrogramStore.renderData) {
            clearUpdates()
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

                <!-- <img :src="microfonicon" class="w-12 h-12 invert relative z-10" alt="Mikrofon" />
                  -->
                <Mic class="w-11 h-11 stroke-white" />
            </button>

            <!-- Upload Button -->
            <label for="fileInput" :class="[
                fileSelected
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-saft-main-500 hover:bg-saft-main-600',
                isLoading ? 'cursor-wait opacity-80' : 'cursor-pointer'
            ]"
                class="w-20 h-20 active:scale-[0.95] rounded-full flex items-center justify-center shadow-xl border-2 border-white/50 transition-all duration-200 touch-manipulation">
                <LoaderCircle v-if="isLoading" class="w-11 h-11 stroke-white animate-spin" />
                <Upload v-else class="w-11 h-11 stroke-white" />
            </label>

            <input id="fileInput" ref="fileInput" type="file" accept=".wav, .mp3, .saft" style="display: none"
                :disabled="isLoading" @change="handleFileSelect">

        </div>

        <MediaPlayer :file="currentAudioFile" />

        <RouterLink :to="{ name: 'canvas' }" custom v-slot="{ navigate }">
            <div class="flex justify-center py-4">
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


/* Dark mode spin button */
.dark-mode input[type="number"]::-webkit-inner-spin-button,
.dark-mode input[type="number"]::-webkit-outer-spin-button {
    filter: invert(1);
}
</style>