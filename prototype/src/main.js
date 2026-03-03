import { computeSpectrogram, computeSpectrogramRenderingData, renderPixels } from './spectrogram.js';
import { getSample, closeAudio } from './input.js'
import { colormapInferno } from './colormaps.js';


import pako from "pako";
import { fft } from './fft.js';


globalThis.pako = pako;

const fileInput = document.getElementById("fileInput");
const processBtn = document.getElementById("processBtn");
var canvas = document.getElementById("spectrogramCanvas");
var horizontalSlider = document.getElementById("hScrollbar")
var verticalSlider = document.getElementById("vScrollbar")
var progressBar = document.getElementById("progressBar")
var progressLabel = document.getElementById("progressLabel")

const maxFreq = 20000
const minFreq = 0
const windowSize = 2048
const hopSize = 250
const boxheight = canvas.height
const boxwidth = canvas.width
const channel = 0

let height_offset = 0
let width_offset = 0
let zoom = 1;
const minZoom = 0.2, maxZoom = 10;

let renderData

let rafId = 0;
let needsRedraw = false;


processBtn.addEventListener("click", async () => {
  
  const sample = await getSample(fileInput, channel);

  progressLabel.textContent = `FFT progress:`;
  const spectrogram = await computeSpectrogram(sample.samples, sample.sampleRate, windowSize, hopSize, progressBar);

  closeAudio();

  progressLabel.textContent = `Pre rendering progress:`;
  renderData = await computeSpectrogramRenderingData(spectrogram, sample.sampleRate, minFreq, maxFreq, progressBar);

  progressLabel.textContent = `no work`;
  progressBar.value = 0;


  horizontalSlider.min = 0;
  horizontalSlider.max = renderData.width - boxwidth;

  verticalSlider.min = 0;
  verticalSlider.max = renderData.height - boxheight
  invalidate();

});




canvas.addEventListener('wheel', (e) => {
  e.preventDefault();

  const dx = (e.shiftKey && e.deltaX === 0) ? e.deltaY : e.deltaX;
  const dy = (e.shiftKey && e.deltaX === 0) ? 0 : e.deltaY;

  width_offset += Math.floor(dx/2);

  height_offset -= Math.floor(dy/2);

  checkOffsetValues();
  invalidate()

}, { passive: false });


horizontalSlider.addEventListener('input', (e) => {
    const value = Number(e.target.value);
    width_offset = value
    invalidate()
});


verticalSlider.addEventListener('input', (e) => {
    const value = Number(e.target.value);
    height_offset = value
    invalidate()
});





let pointers = new Map(); // pointerId -> {x,y}
let lastX = 0, lastY = 0;

// Pinch state
let startDist = 0;
let startZoom = 1;


function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 1) {
    lastX = e.clientX;
    lastY = e.clientY;

  } else if (pointers.size === 2) {
    const [p1, p2] = [...pointers.values()];
    startDist = distance(p1, p2);
    startZoom = zoom;
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

 
  if (pointers.size === 1) {
    // pan with one finger (movement => offset change)
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    width_offset -= Math.round(dx);
    height_offset += Math.round(dy);
    checkOffsetValues();
    invalidate();
    return;
  }

  if (pointers.size === 2) {
    // 2-finger pinch zoom (distance change => scale)
    const [p1, p2] = [...pointers.values()];
    const d = distance(p1, p2);
    if (startDist > 0) {
      const nextZoom = startZoom * (d / startDist);
      zoom = Math.max(minZoom, Math.min(maxZoom, nextZoom));
      invalidate();
    }
  }
});

function endPointer(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) startDist = 0;

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
function checkOffsetValues() {
  if (renderData) {

    if (width_offset < 0 || boxwidth > renderData.width) {
      width_offset = 0;

    } else if (width_offset > (renderData.width - boxwidth)) {
      width_offset = renderData.width - boxwidth;
    }
    if (height_offset < 0 || boxheight > renderData.height) {
      height_offset = 0;

    } else if (height_offset > (renderData.height - boxheight)) {
      height_offset = renderData.height - boxheight;
    }
  }

  horizontalSlider.value = width_offset;
  verticalSlider.value = height_offset;
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
  renderPixels(renderData, height_offset, width_offset, colormapInferno, zoom, canvas);
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