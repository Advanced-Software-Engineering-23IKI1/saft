import { fft } from './fft.js';
import UPNG from "upng-js";



/**
 * Compute a magnitude spectrogram from audio samples.
 *
 * @param {ArrayLike<number>} samples Real-valued audio samples (Float32Array).
 * @param {number} sampleRate Sample rate in Hz.
 * @param {number} [windowSize=2048] FFT window size (power of 2).
 * @param {number} [hopSize=512] Hop size between frames in samples.
 * @returns {{
 *   data: number[][],
 *   freqBins: number,
 *   timeFrames: number,
 *   freqResolution: number,
 *   timeResolution: number
 * }}
 */

export function computeSpectrogram(samples, sampleRate, windowSize = 2048, hopSize = 512 ) {
    console.log('DEBUG: samples.length:', samples.length);


    // FFT requires power-of-2 window size
    if ((windowSize & (windowSize - 1)) !== 0) {
        throw new Error(`windowSize must be power of 2, got ${windowSize}`);
    }

    // Input sanity: fail fast if samples have NaN/Infinity
    let firstBad = -1;
    for (let i = 0; i < Math.min(samples.length, 500000); i++) {
        if (!Number.isFinite(samples[i])) { firstBad = i; break; }
    }
    if (firstBad >= 0) {
        throw new Error(`Input samples contain NaN/Infinity at index ${firstBad}: ${samples[firstBad]}`);
    }

    const { spectrogram, half } = computeFFTs(windowSize, samples, hopSize);

    return {
        data: spectrogram,
        freqBins: half,
        timeFrames: spectrogram.length,
        freqResolution: sampleRate / windowSize,
        timeResolution: hopSize / sampleRate
    };
}



/**
 * Compute FFT magnitudes over sliding windows to generate a spectrogram.
 *
 * @param {number} windowSize Number of samples per FFT window.
 * @param {Float32Array|Array<number>} samples Input audio samples.
 * @param {number} hopSize Step size between successive windows.
 * @returns {{ spectrogram: Array<Array<number>>, half: number }}
 *          - spectrogram: 2D array [time][frequency] of magnitudes.
 *          - half: Number of positive frequency bins per window.
 */
function computeFFTs(windowSize, samples, hopSize) {
    const spectrogram = [];
    const half = Math.floor(windowSize / 2) + 1;

    for (let start = 0; start + windowSize <= samples.length; start += hopSize) {
        // Frame (works for Float32Array too)
        const frame = samples.slice(start, start + windowSize);

        // Window -> plain JS number[] (hardens against typed-array quirks)
        const windowed = applyHannWindow(frame, windowSize);

        // Numeric FFT (returns {re, im})
        const out = fft(windowed);

        if (!out || !out.re || !out.im) {
            throw new TypeError('fft() must return an object { re, im }');
        }
        const re = out.re, im = out.im;

        // Tripwire: detect NaNs early in FFT output
        for (let k = 0; k < Math.min(16, re.length); k++) {
            if (!Number.isFinite(re[k]) || !Number.isFinite(im[k])) {
                console.log('BAD FFT BIN', k, { re: re[k], im: im[k] });
                throw new Error(`FFT produced NaN/Infinity at bin ${k}`);
            }
        }

        // Magnitude (positive frequencies only)
        const magnitude = new Array(half);
        for (let k = 0; k < half; k++) {
            const mag = Math.hypot(re[k], im[k]);
            magnitude[k] = Number.isFinite(mag) ? mag : 0;
        }

        spectrogram.push(magnitude);
    }
    return { spectrogram, half };
}

/**
 * Apply a Hann window to a frame of samples.
 *
 * @param {Array<number>} frame Array of input samples.
 * @param {number} size Number of samples in the frame.
 * @returns {Array<number>} Windowed samples.
 */
function applyHannWindow(frame, size) {
    const out = new Array(size);
    const denom = (size - 1) || 1;

    for (let i = 0; i < size; i++) {
        const s = Number(frame[i]);
        const sample = Number.isFinite(s) ? s : 0;
        const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / denom));
        out[i] = sample * w;
    }
    return out;
}


export function computeSpectrogramRenderingData(
    spectrogram,
    sampleRate,
    minFreq = 0,
    maxFreq = sampleRate / 2
) {
    const { data, freqBins, timeFrames } = spectrogram;
    const { maxBin, minBin } = computeBins(freqBins, sampleRate, minFreq, maxFreq);

    const height = maxBin - minBin + 1
    const width = timeFrames;

    const { maxDB, minDB } = computeDBrange(width, data, minBin, maxBin);
    return {data, width, height, minBin, maxBin, minDB, maxDB}
}


/**
 * Encode RGBA pixels as a PNG, display it in an <img>, and attach download handler.
 *
 * @param {Uint8ClampedArray} pixels RGBA pixel buffer.
 * @param {number} width Image width in pixels.
 * @param {number} height Image height in pixels.
 * @param {string} imgId ID of the target <img> element.
 * @param {string} downloadBtnId ID of the download button element.
 * @throws {Error} If the target <img> element is not found.
 */
export function generatePNG(pixels, width, height, imgId, downloadBtnId) {
    const rgbaBytes = new Uint8Array(pixels.buffer); // pixels = Uint8ClampedArray

    // Encode as PNG
    const pngBuffer = UPNG.encode([rgbaBytes.buffer], width, height, 0); // 0 = truecolor RGBA    const blob = new Blob([pngBuffer], { type: 'image/png' });

    const img = document.getElementById(imgId);
    if (!img) throw new Error(`No <img> with id="${imgId}" found`);

    const blob = new Blob([pngBuffer], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    img.src = url;

    const downloadBtn = document.getElementById(downloadBtnId);
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.href = url;
            link.download = `spectrogram-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
    }
}


// TODO: needs to be adjusted
/**
 * Render spectrogram RGBA pixels from FFT magnitude frames.
 *
 * @param {number} width Image width (time axis).
 * @param {Array<Array<number>>} data 2D array [time][frequency] of magnitudes.
 * @param {number} height Image height (frequency axis).
 * @param {number} minBin Starting frequency bin (inclusive).
 * @param {number} maxBin Ending frequency bin (inclusive).
 * @param {number} minDB Minimum dB for normalization.
 * @param {number} maxDB Maximum dB for normalization.
 * @param {(x: number) => [number, number, number]} colormap Function mapping [0,1] → RGB.
 * @returns {Uint8ClampedArray} RGBA pixel buffer.
 */
export function renderPixels(width, data, height, minBin, maxBin, minDB, maxDB, boxheight, boxwidth, height_offset, width_offset, colormap) {
    let pixels = new Uint8ClampedArray(boxwidth * boxheight * 4); // RGBA

    for (let tx = 0; tx < boxwidth; tx++) {

        if (width_offset<0){
            width_offset = 0

        }else if (width_offset>(width-boxwidth)){
            width_offset = width-boxwidth
        }

        let t = width_offset + tx;
        const frame = data[t] || [];


        for (let ly = 0; ly < boxheight; ly++) {

            if (height_offset<0){
                height_offset=0
            }else if(height_offset>(height-boxheight)){
                height_offset = height-boxheight
            }

            let y = height_offset + ly;

            // Logarithmic mapping:
            // const logMin = Math.log10(minBin + 1);
            // const logMax = Math.log10(maxBin + 1);
            // const logBin = logMin + (y / height) * (logMax - logMin);
            // const binFloat = Math.pow(10, logBin) - 1;
            const binFloat = minBin + (y / height) * height;
            const bin = Math.floor(binFloat);


            const val = Math.max(frame[bin] || 0, 1e-12);
            const db = 20 * Math.log10(val);

            const norm = (db - minDB) / (maxDB - minDB);
            const clamped = Math.max(0, Math.min(1, norm));

            const [r, g, b] = colormap(clamped);

            const flippedY = boxheight - 1 - ly;
            const idx = (flippedY * boxwidth + tx) * 4;

            pixels[idx] = r;
            pixels[idx + 1] = g;
            pixels[idx + 2] = b;
            pixels[idx + 3] = 255;
        }
    }
    return {pixels, width_offset, height_offset}
}



/**
 * Compute and clamp global dB range across time frames and bin range.
 *
 * @param {number} timeFrames Number of time frames.
 * @param {Array<Array<number>>} data 2D array [time][frequency] of magnitudes.
 * @param {number} minBin Starting bin index (inclusive).
 * @param {number} maxBin Ending bin index (inclusive).
 * @returns {{ minDB: number, maxDB: number }}
 */
function computeDBrange(timeFrames, data, minBin, maxBin) {

    let minDB = Infinity;
    let maxDB = -Infinity;

    for (let t = 0; t < timeFrames; t++) {
        const frame = data[t] || [];
        for (let f = minBin; f <= maxBin; f++) {
            const val = Math.max(frame[f] || 0, 1e-12);
            const db = 20 * Math.log10(val);
            if (db < minDB) minDB = db;
            if (db > maxDB) maxDB = db;
        }
    }

    // Clamp dynamic range (better visuals)
    maxDB = Math.max(maxDB, -10);
    minDB = maxDB - 80; 

    return { maxDB, minDB };
}

/**
 * Convert a frequency range (Hz) to FFT bin indices.
 *
 * @param {number} freqBins   Number of FFT bins (windowSize / 2 + 1).
 * @param {number} sampleRate Sample rate in Hz.
 * @param {number} minFreq    Minimum frequency in Hz.
 * @param {number} maxFreq    Maximum frequency in Hz.
 * @returns {{ minBin: number, maxBin: number }}
 * @throws {Error} If the computed range is invalid.
 */
function computeBins(freqBins, sampleRate, minFreq, maxFreq) {
    // Compute frequency resolution
    // freqBins = windowSize/2 + 1
    const windowSize = (freqBins - 1) * 2;
    const freqResolution = sampleRate / windowSize;

    const minBin = Math.max(0, Math.floor(minFreq / freqResolution));
    const maxBin = Math.min(freqBins - 1, Math.ceil(maxFreq / freqResolution));

    if (minBin >= maxBin) {
        throw new Error("Invalid frequency range");
    }
    // console.log(`Showing frequencies ${minFreq}Hz – ${maxFreq}Hz`);
    // console.log(`Bins ${minBin} – ${maxBin}`);

    return { maxBin, minBin };
}

