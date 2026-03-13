<script setup>
import { spectrogramStore } from '@/store/store';
import { reactive, useTemplateRef } from 'vue'
import { renderPixels } from '@/utils/spectrogram.js';
import { colormapInferno } from '@/utils/colormaps.js';
import { nextTick, onUnmounted } from 'vue';
import { Tool } from '@/enums/ToolEnum.js';
import { useCanvasTools } from '@/utils/useCanvasTools.js';


// export prop for activeTool
const props = defineProps({
  activeTool: {
    type: Number,
    required: true,
    validator: (value) => Object.values(Tool).includes(value)
  }
})

// subject to fine-tuning (based on device)
const maxPixelCount = 300 * 300;
const canvasRef = useTemplateRef('spectrogramCanvas');
const canvasContext = reactive({
  value: null
})

const canvasDimensions = reactive({
  width: 300,
  height: 300,
})

// Animation
let needsRedraw = false;
let rafId = 0;


const {
  zoom,
  canvasOffsets,
  canvasResizeObserver,
  toolEvents,
} = useCanvasTools(canvasDimensions, canvasRef, spectrogramStore, invalidate, maxPixelCount);



function onCanvasWheel(e) {
  toolEvents.get(props.activeTool)?.onCanvasWheel?.(e)
}
function onCanvasPointerDown(e) {
  toolEvents.get(props.activeTool)?.onCanvasPointerDown?.(e)
}
function onCanvasPointerMove(e) {
  toolEvents.get(props.activeTool)?.onCanvasPointerMove?.(e)
}
function onCanvasPointerUp(e) {
  toolEvents.get(props.activeTool)?.onCanvasPointerUp?.(e)
}
function onCanvasPointerCancel(e) {
  toolEvents.get(props.activeTool)?.onCanvasPointerCancel?.(e)
}
function onCanvasPointerLeave(e) {
  toolEvents.get(props.activeTool)?.onCanvasPointerLeave?.(e)
}

function onHSliderInput(e) {
  const value = Number(e.target.value);
  canvasOffsets.internalWidthOffset = value
  invalidate()
}

function onVSliderInput(e) {
  const value = Number(e.target.value);
  canvasOffsets.internalHeightOffset = value
  invalidate()
}






/**
 * Render the current spectrogram view to the canvas using the current render data,
 * offsets, and the configured colormap.
 *
 * @returns {void} Does not return a value.
 */
function renderSpectrogram() {
  if (!spectrogramStore.renderData) {
    return
  }
  renderPixels(spectrogramStore.renderData, canvasOffsets.internalHeightOffset, canvasOffsets.internalWidthOffset, colormapInferno, zoom.value, canvasRef.value, canvasContext.value);
  // generatePNG(pixels, boxwidth, boxheight, imgId, downloadBtnId);
}



/**
 * Mark the spectrogram view as needing a redraw and schedule a single render on the next
 * browser repaint using `requestAnimationFrame`.
 *
 * Multiple calls to `invalidate()` within the same frame are coalesced into one render.
 *
 * @returns {void} Does not return a value.
 */
function invalidate() {
  needsRedraw = true;
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    if (!needsRedraw) return;
    needsRedraw = false;
    renderSpectrogram();
  });
}

// call in parent component when applying updates to ensure changes are reflected on canvas
defineExpose({
  invalidate
})



// set resize observer when canvas ref is available using nextTick
nextTick(() => {
  if (canvasRef.value) {
    canvasResizeObserver.observe(canvasRef.value);
    canvasContext.value = canvasRef.value.getContext("2d");
    invalidate()

  }
})

// Cleanup on unmount to prevent memory leaks
onUnmounted(() => {
  canvasResizeObserver.disconnect();
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
})

</script>

<template>
  <!--div class="absolute inset-0 overflow-x-auto overflow-y-hidden bg-gradient-to-br from-saft-brown-100/60 to-saft-blue-50/60
[&::-webkit-scrollbar]:h-4 sm:[&::-webkit-scrollbar]:h-5
[&::-webkit-scrollbar-track]:bg-saft-blue-100/80 [&::-webkit-scrollbar-track]:rounded-full
[&::-webkit-scrollbar-thumb]:bg-saft-blue-500 hover:[&::-webkit-scrollbar-thumb]:bg-saft-blue-600
[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:shadow-lg">
    <img :src="canvasimage" class="h-full w-[160%] min-w-[200%] block !object-none flex-shrink-0"
        alt="Spectrogramm" id="dynamic-image" />
</div-->

  <div id="wrapper">
    <canvas ref="spectrogramCanvas" id="spectrogramCanvas" @wheel="onCanvasWheel" @pointerdown="onCanvasPointerDown"
      @pointermove="onCanvasPointerMove" @pointerup="onCanvasPointerUp" @pointercancel="onCanvasPointerCancel"
      @pointerleave="onCanvasPointerLeave" v-bind="canvasDimensions"></canvas>
    <input ref="vScrollbar" @input="onVSliderInput" type="range" id="vScrollbar" orient="vertical" min="0"
      :max="canvasOffsets.maxInternalHeightOffset" :value="canvasOffsets.internalHeightOffset" />
    <input ref="hScrollbar" @input="onHSliderInput" type="range" id="hScrollbar" min="0"
      :max="canvasOffsets.maxInternalWidthOffset" :value="canvasOffsets.internalWidthOffset" />
  </div>
</template>

<style scoped>
#spectrogramCanvas {
  touch-action: none;
  /* prevents browser pan/zoom gestures on this element */
  background-color: black;
  padding: 0;
  width: 100%;
  height: 100%;
}

#wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}


/* Reset default styling */
#vScrollbar,
#hScrollbar {

  margin: 0;
  padding: 0;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  touch-action: none;
}

/* -------------------- */
/* VERTICAL SCROLLBAR   */
/* -------------------- */

#vScrollbar {
  position: absolute;
  right: 0;
  top: 0;
  writing-mode: vertical-rl;
  direction: ltr;
  width: 8px;
  /* thickness */
  height: 100%;
}

/* Transparent track */
#vScrollbar::-webkit-slider-runnable-track {
  background: gray;
}

/* Black thumb */
#vScrollbar::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  background: black;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  cursor: pointer;
  margin-top: -2px;
}

/* Firefox */
#vScrollbar::-moz-range-track {
  background: gray;
}

#vScrollbar::-moz-range-thumb {
  background: black;
  border: none;
  width: 12px;
  height: 12px;
  border-radius: 3px;
}


/* -------------------- */
/* HORIZONTAL SCROLLBAR */
/* -------------------- */

#hScrollbar {
  height: 8px;
  width: 100%;
  bottom: 0;
  left: 0;
  position: absolute;
}

/* Transparent track */
#hScrollbar::-webkit-slider-runnable-track {
  background: gray;
}

/* Black thumb */
#hScrollbar::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  background: black;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  cursor: pointer;
}

/* Firefox */
#hScrollbar::-moz-range-track {
  background: gray;
}

#hScrollbar::-moz-range-thumb {
  background: black;
  border: none;
  width: 12px;
  height: 12px;
  border-radius: 3px;
}
</style>