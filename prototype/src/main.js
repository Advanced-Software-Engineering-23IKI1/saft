import { computeSpectrogram, computeSpectrogramRenderingData, generatePNG, renderPixels } from './spectrogram.js';
import { getSample } from './input.js'
import { colormapInferno } from './colormaps.js';


import pako from "pako";


globalThis.pako = pako;


const fileInput = document.getElementById("fileInput");
const processBtn = document.getElementById("processBtn");
var canvas = document.getElementById("spectrogramCanvas");
var horizontalSlider = document.getElementById("hScrollbar")
var verticalSlider = document.getElementById("vScrollbar")

const maxFreq = 18000
const minFreq = 0
const windowSize = 2048
const hopSize = 250
const boxheight = 600
const boxwidth = 300
let height_offset = 0
let width_offset = 0


let renderData
let rendering = false;


processBtn.addEventListener("click", async () => {
  stopRendering();
  canvas.width = boxwidth
  canvas.height = boxheight

  horizontalSlider.style.width = boxwidth+'px';   
  verticalSlider.style.height = boxheight+'px';
  
  const sample = await getSample(fileInput);
  const spectrogram = computeSpectrogram(sample.samples, sample.sampleRate, windowSize, hopSize);
  renderData = computeSpectrogramRenderingData(spectrogram, sample.sampleRate, minFreq, maxFreq);

  horizontalSlider.min = 0;
  horizontalSlider.max = renderData.width - boxwidth;

  verticalSlider.min = 0;
  verticalSlider.max = renderData.height - boxheight

  startRendering();
});




canvas.addEventListener('wheel', (e) => {
  e.preventDefault();

  const dx = (e.shiftKey && e.deltaX === 0) ? e.deltaY : e.deltaX;
  const dy = (e.shiftKey && e.deltaX === 0) ? 0 : e.deltaY;

  width_offset += Math.floor(dx/2);

  height_offset -= Math.floor(dy/2);

  checkOffsetValues();

}, { passive: false });


horizontalSlider.addEventListener('input', (e) => {
    const value = Number(e.target.value);
    width_offset = value
});


verticalSlider.addEventListener('input', (e) => {
    const value = Number(e.target.value);
    height_offset = value
});




let isPanning = false;
let lastX = 0, lastY = 0;

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  isPanning = true;
  lastX = e.clientX;
  lastY = e.clientY;
});

canvas.addEventListener("pointermove", (e) => {
  if (!isPanning) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  width_offset -= Math.round(dx);
  height_offset += Math.round(dy);
  checkOffsetValues();
});

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

function endPan(e) {
  isPanning = false;
  try { canvas.releasePointerCapture(e.pointerId); } catch {}
}
canvas.addEventListener("pointerup", endPan);
canvas.addEventListener("pointercancel", endPan);



function renderSpectrogram() {
  if (!renderData){
    return
  }
  renderPixels(renderData.width, renderData.data, renderData.height, renderData.minBin, renderData.maxBin, renderData.minDB, renderData.maxDB, height_offset, width_offset, colormapInferno, canvas);
  // generatePNG(pixels, boxwidth, boxheight, imgId, downloadBtnId);
}


function workChunk() {
  if (!rendering) return;

  renderSpectrogram()
  setTimeout(workChunk, 0);
}

function startRendering() { rendering = true; workChunk(); }
function stopRendering() {rendering = false;}

