// import { fetchFile } from '@ffmpeg/util';
// import { FFmpeg } from '@ffmpeg/ffmpeg';  

// export const ffmpeg = new FFmpeg();

let audioCtx; 

/**
 * Load a WAV file and return its samples and sample rate.
 *
 * @param {HTMLInputElement} fileInput File input element with a WAV file.
 * @returns {Promise<{samples: Float32Array, sampleRate: number}>} Audio data.
 */
export async function getSample(fileInput, channel = 0) {
  const file = fileInput.files?.[0];
  if (!file) {
    alert("Please select an audio file.");
    return;
  }

  audioCtx ??= new AudioContext();

  const arrayBuffer = await file.arrayBuffer(); 
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer); 

  const ch = Math.min(channel, audioBuffer.numberOfChannels - 1);

  const samples = audioBuffer.getChannelData(ch); 
  const sampleRate = audioBuffer.sampleRate; 

  return { samples, sampleRate };
}


export async function closeAudio() {
  if (audioCtx) {
    await audioCtx.close();
    audioCtx = null;
  }
  }