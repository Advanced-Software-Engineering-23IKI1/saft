import { computeSpectrogram, drawSpectrogram } from './spectrogram.js';
import pako from "pako";

globalThis.pako = pako; 


const fileInput = document.getElementById("fileInput");
const processBtn = document.getElementById("processBtn");
const downloadBtn = document.getElementById("downloadBtn");


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
    windowSize: 2048,
    hopSize: 125
  });

  const maxFreq = 128000
  const minFreq = 0

  drawSpectrogram(spectrogram,sampleRate,minFreq, maxFreq,"spectrogramImg","downloadBtn");
});


