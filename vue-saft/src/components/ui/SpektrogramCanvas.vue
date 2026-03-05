<script setup>
import { spectrogramStore } from '@/store/store';
import { useTemplateRef } from 'vue'
import { computeSpectrogram, computeSpectrogramRenderingData, renderPixels } from '@/utils/spectrogram.js';
import { colormapInferno } from '@/utils/colormaps.js';
import { distance, getMidpoint } from '@/utils/utils.js';

    

const canvasRef = useTemplateRef('spectrogramCanvas');
const horizontalSlider = useTemplateRef('hScrollbar');
const verticalSlider = useTemplateRef('vScrollbar');

// Animation
let renderData
let needsRedraw = false;
let rafId = 0;


// panning and pinching 
let internalHeightOffset = 0
let internalWidthOffset = 0
let zoom = 1;
let minZoom = 0.2, maxZoom = 25;

let pointers = new Map(); // pointerId -> {x,y}
let lastX = 0, lastY = 0;

// Pinch state
let pinchStartDist = 0;
let pinchStartZoom = 1;
let pinchStartCenterCanvas = null;
let pinchStartCenterInternal = null; 

function onCanvasWheel(e){
  e.preventDefault(); 

  // Ctrl+wheel => zoom
  if (e.ctrlKey) {
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;

    const zoomFactor = Math.exp(-e.deltaY * 0.001);

    const oldZoom = zoom;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, oldZoom * zoomFactor));

    // for stable zooming
    const internalX = internalWidthOffset  + mouseX * (1 / oldZoom);
    const internalY = internalHeightOffset + mouseY * (1 / oldZoom);

    zoom = newZoom;

    const internalValuesPerPixel = (1 / zoom)

    internalWidthOffset  = internalX - mouseX * internalValuesPerPixel;
    internalHeightOffset = internalY - mouseY * internalValuesPerPixel;

    checkInternalOffsetValues();
    invalidate();
    return;
  }

  const dx = (e.shiftKey && e.deltaX === 0) ? e.deltaY : e.deltaX;
  const dy = (e.shiftKey && e.deltaX === 0) ? 0 : e.deltaY;

  internalWidthOffset  += Math.floor(dx / 2)*(1/zoom);
  internalHeightOffset += Math.floor(dy / 2)*(1/zoom);

  checkInternalOffsetValues();
  invalidate();
}


function onHSliderInput(e) {
    const value = Number(e.target.value);
    internalWidthOffset = value
    invalidate()
}

function onVSliderInput(e) {
    const value = Number(e.target.value);
    internalHeightOffset = value
    invalidate()
}

function onCanvasPointerDown(e) {
  canvasRef.value.setPointerCapture(e.pointerId);
  const point = {x: e.clientX,y: e.clientY};
  pointers.set(e.pointerId, point);

  if (pointers.size === 1) {
    lastX = point.x;
    lastY = point.y;

  } if (pointers.size === 2) {
    const [p1, p2] = [...pointers.values()];

    pinchStartDist = distance(p1, p2);
    pinchStartZoom = zoom;
    pinchStartCenterCanvas = getMidpoint(p1, p2);

    const internalValuesPerPixel = (1 / pinchStartZoom)

    // for stable panning and zooming
    pinchStartCenterInternal = {
      x: internalWidthOffset + pinchStartCenterCanvas.x * internalValuesPerPixel,
      y: internalHeightOffset + pinchStartCenterCanvas.y * internalValuesPerPixel,
    };
  }
}


function onCanvasPointerMove(e) {
  if (!pointers.has(e.pointerId)) return;
  const point = {x: e.clientX,y: e.clientY};
  pointers.set(e.pointerId, point);

  const step = 1 / zoom;
 
  if (pointers.size === 1) {
    // pan: screen px -> source px via step
    const dx = point.x - lastX;
    const dy = point.y - lastY;
    lastX = point.x;
    lastY = point.y;

    internalWidthOffset  -= dx * step;
    internalHeightOffset -= dy * step; 

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

      const internalValuesPerPixel = (1 / zoom)

      internalWidthOffset  = pinchStartCenterInternal.x - pinchStartCenterCanvas.x * internalValuesPerPixel;
      internalHeightOffset = pinchStartCenterInternal.y - pinchStartCenterCanvas.y * internalValuesPerPixel;

      checkInternalOffsetValues();
      invalidate();
    }
  }
}

function endPointer(e) {
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
}



/**
 * Clamp the current render offsets so the visible box stays within the rendered image bounds,
 * then sync the horizontal/vertical slider UI values to the updated offsets.
 *
 * @returns {void} Does not return a value.
 */
function checkInternalOffsetValues() {
  if (!renderData) return;

  const internalValuesPerPixel = 1 / zoom;

  const internalWidth = canvasRef.value.width * internalValuesPerPixel;
  const internalHeight = canvasRef.value.height * internalValuesPerPixel;

  const maxInternalWidthOffset = Math.max(0, renderData.width  - internalWidth);
  const maxInternalHeightOffset = Math.max(0, renderData.height - internalHeight);

  internalWidthOffset  = Math.min(Math.max(internalWidthOffset,  0), maxInternalWidthOffset);
  internalHeightOffset = Math.min(Math.max(internalHeightOffset, 0), maxInternalHeightOffset);

  if (horizontalSlider) {
    horizontalSlider.value.min = 0;
    horizontalSlider.value.max = maxInternalWidthOffset;
    horizontalSlider.value.value = internalWidthOffset;
  }
  if (verticalSlider) {
    verticalSlider.value.min = 0;
    verticalSlider.value.max = maxInternalHeightOffset;
    verticalSlider.value.value = internalHeightOffset;
  }
}



/**
 * Updates `minZoom` to the smallest zoom that still is inside of dimension of the render data.
 */
function updateMinZoom(){
  
  if (!renderData) return;
  const minZoomW = canvasRef.value.width  / renderData.width;
  const minZoomH = canvasRef.value.height / renderData.height;
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
  renderPixels(spectrogramStore.renderData, internalHeightOffset, internalWidthOffset, colormapInferno, zoom, canvasRef.value);
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


updateMinZoom()
checkInternalOffsetValues()
invalidate();
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
  <div id="canvasRow">
    
    <canvas ref="spectrogramCanvas" id="spectrogramCanvas" width="300" height="600"
      @wheel="onCanvasWheel" @pointerdown="onCanvasPointerDown" @pointermove="onCanvasPointerMove"
      @pointerup="endPointer" @pointercancel="endPointer" @pointerleave="endPointer"></canvas>
    <input ref="vScrollbar" @input="onVSliderInput" type="range" id="vScrollbar" min="0" max="100" value="0" orient="vertical"/>
  </div>

  <input ref="hScrollbar" @input="onHSliderInput" type="range" id="hScrollbar" min="0" max="100" value="0"/>
</div>
</template>