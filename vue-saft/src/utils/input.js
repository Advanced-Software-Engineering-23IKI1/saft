// for memory reasons declared once and reused
let audioCtx;


/**
 * Load an audio File object, decode it via the Web Audio API,
 * and return PCM samples for a chosen channel along with the sample rate.
 *
 * @param {File} file Audio file object to decode.
 * @param {number} [channel=0] Zero-based channel index to extract (clamped to the available channels).
 * @returns {Promise<{ samples: Float32Array, sampleRate: number } | undefined>} Resolves to an object
 * containing the channel samples and sample rate, or `undefined` if no file was provided.
 */
export async function getSample(file, channel = 0) {
  
  if (!file) {
    alert('Please select or record an audio file.');
    return undefined;
  }

  audioCtx ??= new AudioContext();

  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const ch = Math.min(channel, audioBuffer.numberOfChannels - 1);

  const samples = audioBuffer.getChannelData(ch);
  const sampleRate = audioBuffer.sampleRate;

  return { samples, sampleRate };
}



/**
 * Close the shared Web Audio `AudioContext` (if it exists) and clear the reference.
 *
 * @returns {Promise<void>} Resolves when the audio context has been closed (or immediately if none exists).
 */
export async function closeAudio() {
  if (audioCtx) {
    await audioCtx.close();
    audioCtx = null;
  }
}


// Recording logic
