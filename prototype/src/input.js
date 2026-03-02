

/**
 * Load a WAV file and return its samples and sample rate.
 *
 * @param {HTMLInputElement} fileInput File input element with a WAV file.
 * @returns {Promise<{samples: Float32Array, sampleRate: number}>} Audio data.
 */
export async function getSample(fileInput){
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

  return {samples, sampleRate}

}