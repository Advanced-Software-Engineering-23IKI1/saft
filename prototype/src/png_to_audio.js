import { fftComplex } from './fft.js';
import { applyHannWindow } from './spectrogram.js';
// Load PNG -> magnitude spectrogram
export async function loadSpectrogramFromPng(file) {
  // `file` can be a File object (from <input>) or a URL string
  const url = typeof file === 'string' ? file : URL.createObjectURL(file);

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  if (typeof file !== 'string') URL.revokeObjectURL(url);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const frames = canvas.width;
  const freqBins = canvas.height;
  const mag = Array.from({ length: frames }, () => new Float32Array(freqBins));

  for (let x = 0; x < frames; x++) {
    for (let y = 0; y < freqBins; y++) {
      const idx = (y * frames + x) * 4;
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3 / 255;
      mag[x][freqBins - 1 - y] = gray * gray;
    }
  }

  return { mag, frames, freqBins };
}

// Updated STFT using your applyHannWindow
export function stft(signal, nFFT, hopLength) {
    const frames = [];
    const nFrames = Math.floor((signal.length - nFFT) / hopLength) + 1;
    
    for (let t = 0; t < nFrames; t++) {
        const offset = t * hopLength;
        // Create zero-padded frame
        const frame = new Array(nFFT).fill(0);
        for (let n = 0; n < nFFT; n++) {
            frame[n] = (signal[offset + n] || 0);
        }
        
        // Apply Hann window
        const windowedFrame = applyHannWindow(frame, nFFT);
        const frameRe = new Float64Array(windowedFrame);
        const frameIm = new Float64Array(nFFT).fill(0);
        
        frames.push(fftComplex(frameRe, frameIm, false));
    }
    return frames;
}

function istft(stftFrames, nFFT, hopLength) {
    const framesTime = [];
    for (const { re, im } of stftFrames) {
        const { re: timeRe } = fftComplex(re, im, true);
        // Convert to Array for your applyHannWindow
        const frameArray = Array.from(timeRe);
        const windowedFrame = applyHannWindow(frameArray, nFFT);
        framesTime.push(Float32Array.from(windowedFrame));
    }
    return overlapAdd(framesTime, hopLength);
}

function overlapAdd(frames, hopLength) {
    const frameSize = frames[0].length;
    const totalLength = hopLength * (frames.length - 1) + frameSize;
    const y = new Float32Array(totalLength);
    for (let t = 0; t < frames.length; t++) {
        const offset = t * hopLength;
        const frame = frames[t];
        for (let n = 0; n < frameSize; n++) {
            y[offset + n] += frame[n];
        }
    }
    return y;
}

// Griffin-Lim 
export function griffinLimFromImage(mag, nFFT, hopLength, nIter = 32) {
    const nFrames = mag.length;
    const freqBins = mag[0].length;
    if (freqBins !== nFFT / 2 + 1) {
        const rawNFFT = (freqBins - 1) * 2;
        // Round up to next power of 2
        nFFT = Math.pow(2, Math.ceil(Math.log2(rawNFFT)));
        console.warn(`freqBins (${freqBins}) != nFFT/2+1, snapping nFFT to ${nFFT}`);
    }
    let stftFrames = [];

    // Random phase init
    for (let t = 0; t < nFrames; t++) {
        const real = new Float64Array(nFFT);
        const imag = new Float64Array(nFFT);
        for (let k = 0; k < freqBins; k++) {
            const phase = (Math.random() * 2 - 1) * Math.PI;
            real[k] = mag[t][k] * Math.cos(phase);
            imag[k] = mag[t][k] * Math.sin(phase);
        }
        for (let k = 1; k < freqBins - 1; k++) {
            const m = nFFT - k;
            real[m] = real[k];
            imag[m] = -imag[k];
        }
        stftFrames.push({ re: real, im: imag });
    }

    // Iterations
    for (let it = 0; it < nIter; it++) {
        const y = istft(stftFrames, nFFT, hopLength);
        const newStft = stft(y, nFFT, hopLength);
        for (let t = 0; t < nFrames; t++) {
            const Xr = newStft[t].re;
            const Xi = newStft[t].im;
            const real = stftFrames[t].re;
            const imag = stftFrames[t].im;
            for (let k = 0; k < freqBins; k++) {
                const phi = Math.atan2(Xi[k], Xr[k]);
                real[k] = mag[t][k] * Math.cos(phi);
                imag[k] = mag[t][k] * Math.sin(phi);
            }
            for (let k = 1; k < freqBins - 1; k++) {
                const m = nFFT - k;
                real[m] = real[k];
                imag[m] = -imag[k];
            }
        }
    }

    return istft(stftFrames, nFFT, hopLength);
}
