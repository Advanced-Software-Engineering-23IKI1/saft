import { computeSpectrogram, computeSpectrogramRenderingData, generatePNG, renderPixels } from './spectrogram.js';
import { getSample } from './input.js'
import { colormapInferno } from './colormaps.js';
import pako from "pako";


globalThis.pako = pako;


const fileInput = document.getElementById("fileInput");
const processBtn = document.getElementById("processBtn");
var canvas = document.getElementById("spectrogramCanvas");

const maxFreq = 24000
const minFreq = 0
const windowSize = 2048
const hopSize = 250
const boxheight = 500
const boxwidth = 350
let height_offset = 0
let width_offset = 0


let renderData
let rendering = false;


processBtn.addEventListener("click", async () => {
  stopRendering();
  canvas.width = boxwidth
  canvas.height = boxheight

  const sample = await getSample(fileInput);
  const spectrogram = computeSpectrogram(sample.samples, sample.sampleRate, windowSize, hopSize);
  renderData = computeSpectrogramRenderingData(spectrogram, sample.sampleRate, minFreq, maxFreq);
  startRendering();
});




canvas.addEventListener('wheel', (e) => {
  e.preventDefault();

  const dx = (e.shiftKey && e.deltaX === 0) ? e.deltaY : e.deltaX;
  const dy = (e.shiftKey && e.deltaX === 0) ? 0 : e.deltaY;

  width_offset += Math.floor(dx/2);

  height_offset -= Math.floor(dy/2);

  if (renderData){

    if (width_offset<0){
            width_offset = 0

    }else if (width_offset>(renderData.width-boxwidth)){
        width_offset = renderData.width-boxwidth
    }
    if (height_offset<0){
                height_offset=0

    }else if(height_offset>(renderData.height-boxheight)){
        height_offset = renderData.height-boxheight
    }
  }

}, { passive: false });




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
