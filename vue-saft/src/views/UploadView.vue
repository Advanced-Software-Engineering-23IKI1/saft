<script setup>

import { useTemplateRef, computed, ref, reactive } from 'vue';
import { getSample, closeAudio } from '@/utils/input';
import { computeSpectrogram, computeSpectrogramRenderingData } from '@/utils/spectrogram';
import { spectrogramStore } from '@/store/store';
import MediaPlayer from '@/components/ui/Mediaplayer.vue'

// upload refs
const fileInput = useTemplateRef('fileInput');
const conversionProgress = ref(0);
const conversionName = ref("Create Spectrogram");
const fileSelected = ref(false);
const uploadedFile = ref(null);

// recording refs
let mediaRecorder;
let recordChunks = reactive([]);
const recordedFile = ref(null);
const isRecording = ref(false);
const recordedFileSelected = ref(false);
const peakIndicator = ref(0);

const saveChunkToRecording = (event) => {
    recordChunks.push(event.data);
};

const saveRecording = async () => {
    if (!recordChunks.length) {
        recordedFile.value = null;
        return;
    }
    const nowStr = Date.now();
    const fileName = `saft-recording-${nowStr}.wav`;

    const blob = new Blob(recordChunks, { type: 'audio/wav' });
    const file = new File([blob], fileName, { type: 'audio/wav' });

    recordedFile.value = file;
    recordedFileSelected.value = true;
    fileSelected.value = false;
    uploadedFile.value = null;
    if (fileInput.value) {
        fileInput.value.value = '';
    }
    recordChunks = reactive([]);
};

async function recordingLogic() {
    if (!isRecording.value) {
        recordChunks = [];
        try {
            navigator.mediaDevices.getUserMedia({
                audio: true // We are only interested in the audio
            }).then(stream => {
                isRecording.value = true;

                // Create an audio context and connect the stream source to an analyser node
                const context = new AudioContext();
                const source = context.createMediaStreamSource(stream);
                const analyser = context.createAnalyser();
                source.connect(analyser);

                // The array we will put sound wave data in
                const array = new Uint8Array(analyser.fftSize);

                function getPeakLevel() {
                    analyser.getByteTimeDomainData(array);
                    return array.reduce((max, current) => Math.max(max, Math.abs(current - 127)), 0) / 128;
                }

                function tick() {
                    if (isRecording.value) {
                        const peak = getPeakLevel();
                        peakIndicator.value = peak * 100;
                        requestAnimationFrame(tick);
                    } else {
                        peakIndicator.value = 0
                    }
                }
                tick();

                // Create a new MediaRecorder instance, and provide the audio-stream.
                mediaRecorder = new MediaRecorder(stream);
                
                // Set the MediaRecorder's events handlers
                mediaRecorder.ondataavailable = saveChunkToRecording;
                mediaRecorder.onstop = saveRecording;
                mediaRecorder.start();
            });
        } catch (error) {
            console.error('Error starting the record: ', error);
            alert(error?.message || 'Microphone access failed');
        }
    }
    else {
        if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => {
                track.stop();
            });
            isRecording.value = false;
        }
    }
}

const maxFreq = 20000
const minFreq = 0
const windowSize = 2048
const hopSize = 250
const channel = 0;

async function retrieveSample() {

    spectrogramStore.spectrogram = null;
    spectrogramStore.renderData = null;

    const file = recordedFile.value ?? uploadedFile.value;

    const sample = await getSample(file, channel);
    if (!sample) return;

    conversionName.value = "Running FFT"
    spectrogramStore.spectrogram = await computeSpectrogram(sample.samples, sample.sampleRate, windowSize, hopSize, conversionProgress);

    await closeAudio();
    conversionName.value = "Prerendering Spectrogram"
    spectrogramStore.renderData = await computeSpectrogramRenderingData(spectrogramStore.spectrogram, sample.sampleRate, minFreq, maxFreq, conversionProgress);

    conversionProgress.value = 0
    conversionName.value = "Create Spectrogram"

    //updateMinZoom()
    //checkInternalOffsetValues()
    //invalidate();
}

function handleFileSelect() {
    uploadedFile.value = fileInput.value?.files?.[0] ?? null;
    fileSelected.value = fileInput.value?.files?.length > 0;
    recordedFileSelected.value = !fileSelected.value
    if (fileSelected.value) {
        recordedFile.value = null;
    }
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
            <button @click="recordingLogic" :class="[
                isRecording
                    ? 'bg-red-500 hover:bg-red-600'
                    : recordedFileSelected
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-saft-main-500 hover:bg-saft-main-600'
            ]" class="relative overflow-hidden w-24 h-24
         active:scale-[0.95]
         rounded-full flex items-center justify-center
         shadow-xl border-2 border-white/50
         transition-all duration-200 touch-manipulation">
                <div v-if="isRecording"
                    class="absolute left-0 bottom-0 w-full bg-red-800/70 transition-all duration-100"
                    :style="{ height: `${Math.min(peakIndicator*1.5, 100)}%` }"></div>

                <img :src="microfonicon" class="w-12 h-12 brightness-0 invert relative z-10" alt="Mikrofon" />
            </button>
            <!-- Upload Button (identisch) -->
            <label for="fileInput"
                :class="[fileSelected ? 'bg-green-500 hover:bg-green-600' : 'bg-saft-main-500 hover:bg-saft-main-600']"
                class=" w-24 h-24
                          active:scale-[0.95]
                          rounded-full flex items-center justify-center 
                          shadow-xl
                          border-2 border-white/50 
                          transition-all duration-200
                          touch-manipulation">
                <img :src="uploadicon" class="w-11 h-11 brightness-0 invert" alt="Upload" />
            </label>
            <input style="display: none" type="file" ref="fileInput" id="fileInput"
                accept=".wav, .mp3, audio/wav, audio/mpeg" @change="handleFileSelect">
        </div>
            <MediaPlayer :file="currentAudioFile" />
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
                :style="{ '--progress-value': conversionProgress }">
                {{ conversionName }}
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