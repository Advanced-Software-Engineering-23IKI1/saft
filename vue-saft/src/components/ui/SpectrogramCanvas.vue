<script setup>
import { spectrogramStore } from '@/store/store';
import { reactive, useTemplateRef } from 'vue'
import { renderPixels } from '@/utils/spectrogram.js';
import { colormapInferno } from '@/utils/colormaps.js';
import { distance, getMidpoint } from '@/utils/utils.js';
import { nextTick } from 'vue';
import { getCanvasPoint } from '@/utils/utils.js';
import { Tool } from '@/enums/ToolEnum.js';

// export prop for activeTool
const props = defineProps({
  activeTool: {
    type: Number,
    required: true,
    validator: (value) => Object.values(Tool).includes(value)
  }
})  

// subject to fine-tuning (based on device)
const maxPixelCount = 300*300;
let canvasScaleFactor = 1;

const canvasRef = useTemplateRef('spectrogramCanvas');
const canvasOffsets = reactive({
  internalWidthOffset: 0,
  internalHeightOffset: 0,
  maxInternalHeightOffset: 1,
  maxInternalWidthOffset: 1,
})

const canvasDimensions = reactive({
  width: 300,
  height: 300,
})

const canvasResizeObserver = new ResizeObserver(entries => {
  for (let entry of entries) {
    if (entry.target === canvasRef.value) {
      const { width, height } = entry.contentRect;
      canvasDimensions.width = width;
      canvasDimensions.height = height;
      
      const currentPixelCount = width * height;
      canvasScaleFactor = Math.min(Math.sqrt(maxPixelCount / currentPixelCount), 1);
      canvasDimensions.width = width * canvasScaleFactor;
      canvasDimensions.height = height * canvasScaleFactor;

      updateMinZoom();
      checkInternalOffsetValues();
      invalidate();
    }
  }
})


// Animation
let needsRedraw = false;
let rafId = 0;


// panning and pinching 
let zoom = 1;
let minZoom = 0.2, maxZoom = 25;

let pointers = new Map(); // pointerId -> {x,y}
let lastX = 0, lastY = 0;

// Pinch state
let pinchStartDist = 0;
let pinchStartZoom = 1;
let pinchStartCenterCanvas = null;
let pinchStartCenterInternal = null; 

const toolEvents = new Map(); // toolId -> { onCanvasWheel, onCanvasPointerDown, onCanvasPointerMove, onCanvasPointerUp, onCanvasPointerCancel, onCanvasPointerLeave }

toolEvents.set(Tool.Scroll, 
{ // movement tool

  onCanvasWheel(e) {
    e.preventDefault(); 

    // Ctrl+wheel => zoom
    if (e.ctrlKey) {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;

      const zoomFactor = Math.exp(-e.deltaY * 0.001);

      const oldZoom = zoom;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, oldZoom * zoomFactor));

      // for stable zooming
      const internalX = canvasOffsets.internalWidthOffset  + mouseX * (1 / oldZoom) * canvasScaleFactor;
      const internalY = canvasOffsets.internalHeightOffset + mouseY * (1 / oldZoom) * canvasScaleFactor;

      zoom = newZoom;

      const internalValuesPerPixel = (1 / zoom) * canvasScaleFactor

      canvasOffsets.internalWidthOffset  = internalX - mouseX * internalValuesPerPixel;
      canvasOffsets.internalHeightOffset = internalY - mouseY * internalValuesPerPixel;

      updateMinZoom();
      checkInternalOffsetValues();
      invalidate();
      return;
    }

    const dx = (e.shiftKey && e.deltaX === 0) ? e.deltaY : e.deltaX;
    const dy = (e.shiftKey && e.deltaX === 0) ? 0 : e.deltaY;

    canvasOffsets.internalWidthOffset  += Math.floor(dx / 2)*(1/zoom);
    canvasOffsets.internalHeightOffset += Math.floor(dy / 2)*(1/zoom);

    checkInternalOffsetValues();
    invalidate();
  },
  
  
  onCanvasPointerDown(e) {

    canvasRef.value.setPointerCapture(e.pointerId);
    const point = getCanvasPoint(e, canvasRef);
    pointers.set(e.pointerId, point);

    if (pointers.size === 1) {
      lastX = point.x;
      lastY = point.y;

    } if (pointers.size === 2) {
      const [p1, p2] = [...pointers.values()];

      pinchStartDist = distance(p1, p2);
      pinchStartZoom = zoom;
      pinchStartCenterCanvas = getMidpoint(p1, p2);

      const internalValuesPerPixel = (1 / pinchStartZoom) * canvasScaleFactor;

      // for stable panning and zooming
      pinchStartCenterInternal = {
        x: canvasOffsets.internalWidthOffset + pinchStartCenterCanvas.x * internalValuesPerPixel,
        y: canvasOffsets.internalHeightOffset + pinchStartCenterCanvas.y * internalValuesPerPixel,
      };
    }
  },


  onCanvasPointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    const point = getCanvasPoint(e, canvasRef);
    pointers.set(e.pointerId, point);

    const step = 1 * canvasScaleFactor / zoom;
   
    if (pointers.size === 1) {
      // pan: screen px -> source px via step
      const dx = point.x - lastX;
      const dy = point.y - lastY;
      lastX = point.x;
      lastY = point.y;

      canvasOffsets.internalWidthOffset  -= dx * step;
      canvasOffsets.internalHeightOffset -= dy * step; 

      checkInternalOffsetValues();     
      invalidate();
      return;
    }

     if (pointers.size === 2) {
      const [p1, p2] = [...pointers.values()];
      const pinchCurrentDist = distance(p1, p2);

      if (pinchStartDist > 0) {
        const newZoom = pinchStartZoom * (pinchCurrentDist / pinchStartDist);
        zoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

        const internalValuesPerPixel = (1 / zoom) * canvasScaleFactor;

        canvasOffsets.internalWidthOffset  = pinchStartCenterInternal.x - pinchStartCenterCanvas.x * internalValuesPerPixel;
        canvasOffsets.internalHeightOffset = pinchStartCenterInternal.y - pinchStartCenterCanvas.y * internalValuesPerPixel;

        updateMinZoom();
        checkInternalOffsetValues();
        invalidate();
      }
    }

  },

  endPointer(e) {
    pointers.delete(e.pointerId);


    // new pan origin
    if (pointers.size === 1) {
      const [p] = pointers.values();
      lastX = p.x;
      lastY = p.y;
    }

     if (pointers.size < 2) {
      pinchStartDist = 0;
    }

    try { canvasRef.value.releasePointerCapture(e.pointerId); } catch {}
  },
  onCanvasPointerUp(e) {
    this.endPointer(e);
  },
  onCanvasPointerCancel(e) {
    this.endPointer(e);
  },
  onCanvasPointerLeave(e) {
    this.endPointer(e);
  }

})



function onCanvasWheel(e){
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
 * Clamp the current render offsets so the visible box stays within the rendered image bounds,
 * then sync the horizontal/vertical slider UI values to the updated offsets.
 *
 * @returns {void} Does not return a value.
 */
function checkInternalOffsetValues() {
  if (!spectrogramStore.renderData) return;
  if (!canvasRef.value) return;

  const internalValuesPerPixel = 1 / zoom;
  

  const internalWidth = canvasDimensions.width * internalValuesPerPixel;
  const internalHeight = canvasDimensions.height * internalValuesPerPixel;

  canvasOffsets.maxInternalWidthOffset = Math.max(0, spectrogramStore.renderData.width  - internalWidth);
  canvasOffsets.maxInternalHeightOffset = Math.max(0, spectrogramStore.renderData.height - internalHeight);

  canvasOffsets.internalWidthOffset  = Math.min(Math.max(canvasOffsets.internalWidthOffset,  0), canvasOffsets.maxInternalWidthOffset);
  canvasOffsets.internalHeightOffset = Math.min(Math.max(canvasOffsets.internalHeightOffset, 0), canvasOffsets.maxInternalHeightOffset);
}



/**
 * Updates `minZoom` to the smallest zoom that still is inside of dimension of the render data.
 */
function updateMinZoom(){

  const renderData = spectrogramStore.renderData;
  if (!renderData) return;
  const minZoomW = canvasDimensions.width  / renderData.width;
  const minZoomH = canvasDimensions.height / renderData.height;
  minZoom = Math.max(minZoomW, minZoomH);
  if (zoom<minZoom){
    zoom=minZoom
    checkInternalOffsetValues();
    invalidate()
  }
  if (zoom>maxZoom){
    zoom=maxZoom
    checkInternalOffsetValues();
    invalidate()
  }

}


/**
 * Render the current spectrogram view to the canvas using the current render data,
 * offsets, and the configured colormap.
 *
 * @returns {void} Does not return a value.
 */
function renderSpectrogram() {
  if (!spectrogramStore.renderData){
    return
  }
  renderPixels(spectrogramStore.renderData, canvasOffsets.internalHeightOffset, canvasOffsets.internalWidthOffset, colormapInferno, zoom, canvasRef.value);
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

// set resize observer when canvas ref is available using nextTick
nextTick(() => {
  if (canvasRef.value) {
    canvasResizeObserver.observe(canvasRef.value);
    updateMinZoom();
    checkInternalOffsetValues();
    invalidate();
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
  <canvas ref="spectrogramCanvas" id="spectrogramCanvas"
    @wheel="onCanvasWheel" @pointerdown="onCanvasPointerDown" @pointermove="onCanvasPointerMove"
    @pointerup="onCanvasPointerUp" @pointercancel="onCanvasPointerCancel" @pointerleave="onCanvasPointerLeave" v-bind="canvasDimensions"></canvas>
  <input ref="vScrollbar" @input="onVSliderInput" type="range" id="vScrollbar"  orient="vertical" min="0" :max="canvasOffsets.maxInternalHeightOffset" :value="canvasOffsets.internalHeightOffset"/>
  <input ref="hScrollbar" @input="onHSliderInput" type="range" id="hScrollbar" min="0" :max="canvasOffsets.maxInternalWidthOffset" :value="canvasOffsets.internalWidthOffset" />
</div>
</template>

<style scoped>
#spectrogramCanvas {
  touch-action: none; /* prevents browser pan/zoom gestures on this element */
  background-color: black;
  padding:0;
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
  position:absolute;
  right: 0;
  top: 0;
  writing-mode: vertical-rl;
  direction: ltr;
  width: 8px;      /* thickness */
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
border-radius: 3px;   cursor: pointer;
  margin-top: -2px;
}

/* Firefox */
#vScrollbar::-moz-range-track {
background: gray;}

#vScrollbar::-moz-range-thumb {
  background: black;
  border: none;
  width: 12px;
  height: 12px;
border-radius: 3px; }


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
border-radius: 3px;   cursor: pointer;
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
border-radius: 3px; }


</style>