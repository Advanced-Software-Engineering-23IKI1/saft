<script setup>
import { computed } from 'vue' //
import { useRouter } from 'vue-router'
import { Upload, RotateCcw } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import { getState, setHasUpload } from '@/store/saftState'

const router = useRouter()
const state = computed(() => getState())

function goNext(navigate) {
    setHasUpload(true)
    navigate()
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
            <button class=" w-24 h-24
                          bg-saft-main-500
                          hover:bg-saft-main-600 
                          active:scale-[0.95]
                          rounded-full flex items-center justify-center 
                          shadow-xl
                          border-2 border-white/50 
                          transition-all duration-200
                          touch-manipulation">
                <img :src="uploadicon" class="w-11 h-11 brightness-0 invert" alt="Upload" />
            </button>
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
                Create Spectrogram
            </button>
        </RouterLink>
    </div>
    <div class="text-xs text-slate-400">
        Debug state: {{ state }}
    </div>
</template>
