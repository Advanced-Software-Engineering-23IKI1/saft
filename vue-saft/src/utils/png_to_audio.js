import { fftComplex } from './fft.js';
import { applyHannWindow } from './spectrogram.js';
const nextFrame = () => new Promise(requestAnimationFrame); // yield to repaint

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
export async function griffinLimFromImage(mag, nFFT, hopLength, nIter = 32, conversionName, conversionProgress) {
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
    conversionName.value = "Random Phase Init"
    let updateInterval = Math.max(1, Math.floor(nFrames / 50));
    let updateIndex = 0;
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
        updateIndex += 1;
        if (updateIndex % updateInterval === 0) {
            conversionProgress.value = updateIndex / nFrames;
            await nextFrame();
        }
    }

    // Iterations
    conversionName.value = "Running Iterations"
    updateInterval = Math.max(1, Math.floor(nIter / 50));
    updateIndex = 0;
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
        updateIndex += 1;
        if (updateIndex % updateInterval === 0) {
            conversionProgress.value = updateIndex / nIter;
            await nextFrame();
        }
    }

    return istft(stftFrames, nFFT, hopLength);
}



function floatTo16BitPCM(float32) {
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
        let s = Math.max(-1, Math.min(1, float32[i]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
}

function writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

export function encodeWAV(samples, sampleRate, numChannels = 1) {
    const pcm = floatTo16BitPCM(samples);
    const bitsPerSample = 16;
    const blockAlign = numChannels * bitsPerSample / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcm.length * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < pcm.length; i++, offset += 2) {
        view.setInt16(offset, pcm[i], true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
}
