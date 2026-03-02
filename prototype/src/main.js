import { computeSpectrogram, drawSpectrogram } from './spectrogram.js';
import pako from "pako";

globalThis.pako = pako; 


const fileInput = document.getElementById("fileInput");
const processBtn = document.getElementById("processBtn");

const maxFreq = 15000
const minFreq = 0
const windowSize = 2048
const hopSize = 250


processBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) {
    alert("Please select a WAV file.");
    return;
  }

  const arrayBuffer = await file.arrayBuffer();

  // Decode audio using Web Audio API
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const samples = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  console.log("Samples:", samples.length);
  console.log("Sample Rate:", sampleRate);

  const spectrogram = computeSpectrogram(samples, sampleRate, {
    windowSize: windowSize,
    hopSize: hopSize
  });

  drawSpectrogram(spectrogram,sampleRate,minFreq, maxFreq,"spectrogramImg","downloadBtn");
});


