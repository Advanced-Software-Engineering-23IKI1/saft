<script setup>

function goNext(navigate) {
    navigate()
}
import canvasimage from '@/assets/img/exampleSpectro.png'
import scrollicon from '@/assets/img/scroll.png'
import brushicon from '@/assets/img/brush.png'
import texticon from '@/assets/img/text.png'
import erasericon from '@/assets/img/eraser.png'
import deleteicon from '@/assets/img/delete.png'

</script>

<template>
    <div class="flex flex-col gap-3 mb-4">
        <!-- Image Container – Responsive + Horizontal Scroll -->
        <div class="w-full h-[60vh] flex flex-col p-1">
            <div class="flex-1 bg-saft-brown-50/90 backdrop-blur-md border-4 border-saft-blue-300/70 
      rounded-3xl shadow-2xl relative overflow-hidden">
                <!-- Scrollable Image Area -->
                <div class="absolute inset-0 overflow-x-auto overflow-y-hidden bg-gradient-to-br from-saft-brown-100/60 to-saft-blue-50/60
  [&::-webkit-scrollbar]:h-4 sm:[&::-webkit-scrollbar]:h-5
  [&::-webkit-scrollbar-track]:bg-saft-blue-100/80 [&::-webkit-scrollbar-track]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-saft-blue-500 hover:[&::-webkit-scrollbar-thumb]:bg-saft-blue-600
  [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:shadow-lg">
                    <img :src="canvasimage" class="h-full w-[160%] min-w-[200%] block !object-none flex-shrink-0"
                        alt="Spectrogramm" id="dynamic-image" />
                </div>
            </div>
            <!-- Toolbar -->
            <div class="w-full flex justify-center gap-3 py-4 px-2">
                <div
                    class="flex gap-2 bg-white/95 backdrop-blur-lg border-2 border-saft-blue-200/90 rounded-2xl p-3 shadow-2xl">
                    <button
                        class="w-14 h-14 bg-saft-main-500 hover:bg-saft-main-600 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="1">
                        <img :src="scrollicon" class="w-7 h-7 brightness-0 invert absolute inset-0 m-auto" alt="Scroll">
                    </button>
                    <button
                        class="w-14 h-14 bg-saft-blue-500 hover:bg-saft-blue-600 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="2">
                        <img :src="brushicon" class="w-7 h-7 brightness-0 invert absolute inset-0 m-auto" alt="Brush">
                    </button>
                    <button
                        class="w-14 h-14 bg-saft-brown-500 hover:bg-saft-brown-600 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
                        data-tool="3">
                        <img :src="texticon" class="w-7 h-7 brightness-0 invert absolute inset-0 m-auto" alt="Text">
                    </button>
                    <button
                        class="w-14 h-14 bg-saft-mint-500 hover:bg-saft-mint-600 active:scale-[0.95] rounded-xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden"
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
