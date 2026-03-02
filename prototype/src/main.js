import { computeSpectrogram, computeSpectrogramPixels, generatePNG } from './spectrogram.js';
import { getSample} from './input.js'
import pako from "pako";

globalThis.pako = pako; 


const fileInput = document.getElementById("fileInput");
const processBtn = document.getElementById("processBtn");

const maxFreq = 15000
const minFreq = 0
const windowSize = 2048
const hopSize = 250
const boxheight = 0
const boxwidth = 0
const height_offset = 0
const width_offset = 0

const imgId = 'spectrogramImg'
const downloadBtnId = 'downloadBtn'



processBtn.addEventListener("click", async () => {

  const { samples, sampleRate } = await getSample(fileInput);

  const spectrogram = computeSpectrogram(samples, sampleRate, windowSize, hopSize);

  const { pixels, width, height }  = computeSpectrogramPixels(spectrogram, sampleRate, boxheight, boxwidth, height_offset, width_offset, minFreq, maxFreq);

  generatePNG(pixels, width, height, imgId, downloadBtnId);
});





