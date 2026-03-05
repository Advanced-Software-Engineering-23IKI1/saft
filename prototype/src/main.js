import { computeSpectrogram, computeSpectrogramRenderingData, renderPixels } from './spectrogram.js';
import { getSample, closeAudio } from './input.js'
import { colormapInferno } from './colormaps.js';
import {distance, getMidpoint } from './utils.js';



const fileInput = document.getElementById("fileInput");
const processBtn = document.getElementById("processBtn");
export var canvas = document.getElementById("spectrogramCanvas");
var horizontalSlider = document.getElementById("hScrollbar")
var verticalSlider = document.getElementById("vScrollbar")
var progressBar = document.getElementById("progressBar")
var progressLabel = document.getElementById("progressLabel")

const maxFreq = 20000
const minFreq = 0
const windowSize = 2048
const hopSize = 250
const channel = 0



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




processBtn.addEventListener("click", async () => {
  
  const sample = await getSample(fileInput, channel);

  progressLabel.textContent = `FFT progress:`;
  const spectrogram = await computeSpectrogram(sample.samples, sample.sampleRate, windowSize, hopSize, progressBar);

  closeAudio();

  progressLabel.textContent = `Pre rendering progress:`;
  renderData = await computeSpectrogramRenderingData(spectrogram, sample.sampleRate, minFreq, maxFreq, progressBar);

  progressLabel.textContent = `no work`;
  progressBar.value = 0;

  updateMinZoom()
  checkInternalOffsetValues()
  invalidate();

});



canvas.addEventListener('wheel', (e) => {
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
}, { passive: false });


horizontalSlider.addEventListener('input', (e) => {
    const value = Number(e.target.value);
    internalWidthOffset = value
    invalidate()
});


verticalSlider.addEventListener('input', (e) => {
    const value = Number(e.target.value);
    internalHeightOffset = value
    invalidate()
});


canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
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
});


canvas.addEventListener("pointermove", (e) => {
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
});

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

  try { canvas.releasePointerCapture(e.pointerId); } catch {}
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);
canvas.addEventListener("pointerleave", endPointer);



/**
 * Clamp the current render offsets so the visible box stays within the rendered image bounds,
 * then sync the horizontal/vertical slider UI values to the updated offsets.
 *
 * @returns {void} Does not return a value.
 */
function checkInternalOffsetValues() {
  if (!renderData) return;

  const internalValuesPerPixel = 1 / zoom;

  const internalWidth = canvas.width * internalValuesPerPixel;
  const internalHeight = canvas.height * internalValuesPerPixel;

  const maxInternalWidthOffset = Math.max(0, renderData.width  - internalWidth);
  const maxInternalHeightOffset = Math.max(0, renderData.height - internalHeight);

  internalWidthOffset  = Math.min(Math.max(internalWidthOffset,  0), maxInternalWidthOffset);
  internalHeightOffset = Math.min(Math.max(internalHeightOffset, 0), maxInternalHeightOffset);

  if (horizontalSlider) {
    horizontalSlider.min = 0;
    horizontalSlider.max = maxInternalWidthOffset;
    horizontalSlider.value = internalWidthOffset;
  }
  if (verticalSlider) {
    verticalSlider.min = 0;
    verticalSlider.max = maxInternalHeightOffset;
    verticalSlider.value = internalHeightOffset;
  }
}



/**
 * Updates `minZoom` to the smallest zoom that still is inside of dimension of the render data.
 */
function updateMinZoom(){
  
  if (!renderData) return;
  const minZoomW = canvas.width  / renderData.width;
  const minZoomH = canvas.height / renderData.height;
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
  if (!renderData){
    return
  }
  renderPixels(renderData, internalHeightOffset, internalWidthOffset, colormapInferno, zoom, canvas);
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