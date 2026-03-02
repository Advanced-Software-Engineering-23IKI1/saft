import { computeSpectrogram, computeSpectrogramRenderingData, generatePNG, renderPixels } from './spectrogram.js';
import { getSample } from './input.js'
import { colormapInferno } from './colormaps.js';
import pako from "pako";


globalThis.pako = pako;


const fileInput = document.getElementById("fileInput");
const processBtn = document.getElementById("processBtn");

const maxFreq = 15000
const minFreq = 0
const windowSize = 2048
const hopSize = 250
const boxheight = 250
const boxwidth = 250
let height_offset = 0
let width_offset = 0

const imgId = 'spectrogramImg'
const downloadBtnId = 'downloadBtn'

let renderData
let rendering = false;


processBtn.addEventListener("click", async () => {
  stopRendering();
  const sample = await getSample(fileInput);
  const spectrogram = computeSpectrogram(sample.samples, sample.sampleRate, windowSize, hopSize);
  renderData = computeSpectrogramRenderingData(spectrogram, sample.sampleRate, minFreq, maxFreq);
  startRendering();
});




document.getElementById(imgId).addEventListener('wheel', (e) => {
  e.preventDefault();

  const dx = (e.shiftKey && e.deltaX === 0) ? e.deltaY : e.deltaX;
  const dy = (e.shiftKey && e.deltaX === 0) ? 0 : e.deltaY;

  width_offset += Math.floor(dx/2);
  height_offset -= Math.floor(dy/2);

}, { passive: false });




function renderSpectrogram() {
  if (!renderData){
    return
  }
  let data = renderPixels(renderData.width, renderData.data, renderData.height, renderData.minBin, renderData.maxBin, renderData.minDB, renderData.maxDB, boxheight, boxwidth, height_offset, width_offset, colormapInferno);
  let pixels = data.pixels
  width_offset = data.width_offset
  height_offset = data.height_offset
  generatePNG(pixels, boxwidth, boxheight, imgId, downloadBtnId);


}


function workChunk() {
  if (!rendering) return;

  renderSpectrogram()
  setTimeout(workChunk, 0);
}

function startRendering() { rendering = true; workChunk(); }
function stopRendering() {rendering = false;}
