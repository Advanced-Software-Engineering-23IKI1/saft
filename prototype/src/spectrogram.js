import { fft } from './fft.js';

const nextFrame = () => new Promise(requestAnimationFrame); // yield to repaint

/**
 * Compute a magnitude spectrogram from audio samples.
 *
 * @param {ArrayLike<number>} samples Real-valued audio samples (Float32Array).
 * @param {number} sampleRate Sample rate in Hz.
 * @param {number} [windowSize=2048] FFT window size (power of 2).
 * @param {number} [hopSize=512] Hop size between frames in samples.
 * @param {HTMLProgressElement} fftProgressBar Progress bar to update during FFT computation.
 * @returns {{
 *   data: number[][],
 *   freqBins: number,
 *   timeFrames: number,
 *   freqResolution: number,
 *   timeResolution: number
 * }}
 */
export async function computeSpectrogram(samples, sampleRate, windowSize = 2048, hopSize = 512, fftProgressBar ) {
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

    const { spectrogram, half } = await computeFFTs(windowSize, samples, hopSize, fftProgressBar);

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
 * @param {HTMLProgressElement} fftProgressBar Progress bar to update during FFT computation.
 * @returns {{ spectrogram: Array<Array<number>>, half: number }}
 *          - spectrogram: 2D array [time][frequency] of magnitudes.
 *          - half: Number of positive frequency bins per window.
 */
async function computeFFTs(windowSize, samples, hopSize, fftProgressBar) {
    const spectrogram = [];
    const half = Math.floor(windowSize / 2) + 1;
    const maxVal = samples.length;
    fftProgressBar.max = maxVal;
    fftProgressBar.value = 0;

    for (let start = 0; start + windowSize <= maxVal; start += hopSize) {
        
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

        if ((start & (Math.floor(maxVal/50)-1)) === 0) {
            fftProgressBar.value = start;
            await nextFrame(); 
        }
    }
    fftProgressBar.value = maxVal;
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

/**
 * Prepare derived rendering metadata for a spectrogram so it can be drawn efficiently
 * (dimensions, bin range, and dB normalization range).
 *
 * @param {{ data: Array<Array<number>>, freqBins: number, timeFrames: number }} spectrogram
 * Spectrogram object containing the magnitude data and its time/frequency dimensions.
 * @param {number} sampleRate Sample rate of the original audio (Hz).
 * @param {number} [minFreq=0] Minimum frequency to include (Hz).
 * @param {number} [maxFreq=sampleRate/2] Maximum frequency to include (Hz).
 * @param {HTMLProgressElement} renderDataProgressBar Progress bar to update during dB range computation.
 * @returns {{ data: Array<Array<number>>, width: number, height: number, minBin: number, maxBin: number, minDB: number, maxDB: number }}
 * Rendering data including the original spectrogram data plus computed width/height, selected bin range,
 * and dB range for normalization.
 */
export async function computeSpectrogramRenderingData(
    spectrogram,
    sampleRate,
    minFreq = 0,
    maxFreq = sampleRate / 2,
    renderDataProgressBar
) {
    const { data, freqBins, timeFrames } = spectrogram;
    const { maxBin, minBin } = computeBins(freqBins, sampleRate, minFreq, maxFreq);

    const height = maxBin - minBin + 1
    const width = timeFrames;

    const { maxDB, minDB } = await computeDBrange(width, data, minBin, maxBin, renderDataProgressBar);
    return {data, width, height, minBin, maxBin, minDB, maxDB}
}



/**
 * Render a spectrogram-like pixel view onto a canvas by mapping normalized dB values
 * through a colormap function and writing the resulting RGBA pixels via `ImageData`.
 *
 * @param {Object} renderData Render source containing the 2D magnitude data and scaling metadata.
 * @param {number} renderData.width Total width of the render buffer (time frames / columns).
 * @param {number} renderData.height Total height of the render buffer (frequency bins / rows).
 * @param {Array<Array<number>>} renderData.data 2D array indexed as `data[t][bin]`.
 * @param {number} renderData.minBin Minimum bin index represented in the view.
 * @param {number} renderData.maxBin Maximum bin index represented in the view.
 * @param {number} renderData.minDB Minimum dB value used for normalization.
 * @param {number} renderData.maxDB Maximum dB value used for normalization.
 * @param {number} height_offset Vertical offset (in bins/pixels) into the render buffer.
 * @param {number} width_offset Horizontal offset (in frames/pixels) into the render buffer.
 * @param {(value: number) => Array<number>} colormap Function that maps a normalized value in [0, 1]
 * to an RGB triplet `[r, g, b]` (0–255).
 * @param {number} zoom Zoom level for the rendering.
 * @param {HTMLCanvasElement} canvas Target canvas to draw into (uses its current width/height).
 * @returns {{ width_offset: number, height_offset: number }} The offsets used for rendering.
 */
export function renderPixels(renderData, height_offset, width_offset, colormap, zoom, canvas) {

    const width = renderData.width
    const height = renderData.height
    const data = renderData.data
    const minBin = renderData.minBin
    const maxBin = renderData.maxBin
    const minDB = renderData.minDB
    const maxDB = renderData.maxDB

    const boxwidth = canvas.width
    const boxheight = canvas.height

    // How many source pixels (frames/bins) you advance per 1 screen pixel.
    // zoom = 1 => 1:1, zoom = 2 => 0.5 source px per screen px (zoomed in),
    // zoom = 0.5 => 2 source px per screen px (zoomed out).
    const step = 1 / zoom;

    
    var ctx = canvas.getContext("2d");
    var imagedata = ctx.createImageData(boxwidth, boxheight);

    for (let tx = 0; tx < boxwidth; tx++) {
        const tFloat = width_offset + tx * step;
        const t = Math.floor(tFloat);
        const frame = data[t] || [];

        for (let ly = 0; ly < boxheight; ly++) {
            const yFloat = height_offset + ly * step;

            const binFloat = minBin + yFloat;
            const bin = Math.floor(binFloat);

            const val = Math.max(frame[bin] || 0, 1e-12);
            const db = 20 * Math.log10(val);

            const norm = (db - minDB) / (maxDB - minDB);
            const clamped = Math.max(0, Math.min(1, norm));

            const [r, g, b] = colormap(clamped);

            const flippedY = boxheight - 1 - ly;
            const idx = (flippedY * boxwidth + tx) * 4;

            imagedata.data[idx] = r;
            imagedata.data[idx+1] = g;
            imagedata.data[idx+2] = b;
            imagedata.data[idx+3] = 255;

        }
    }
    ctx.putImageData(imagedata, 0,0);

    return {width_offset, height_offset}
}



/**
 * Compute and clamp global dB range across time frames and bin range.
 *
 * @param {number} timeFrames Number of time frames.
 * @param {Array<Array<number>>} data 2D array [time][frequency] of magnitudes.
 * @param {number} minBin Starting bin index (inclusive).
 * @param {number} maxBin Ending bin index (inclusive).
 * @param {HTMLProgressElement} renderDataProgressBar Progress bar to update during computation.
 * @returns {{ minDB: number, maxDB: number }}
 */
async function computeDBrange(timeFrames, data, minBin, maxBin, renderDataProgressBar) {

    let minDB = Infinity;
    let maxDB = -Infinity;

    renderDataProgressBar.value = 0;
    renderDataProgressBar.max = timeFrames;

    for (let t = 0; t < timeFrames; t++) {
        const frame = data[t] || [];
        for (let f = minBin; f <= maxBin; f++) {
            const val = Math.max(frame[f] || 0, 1e-12);
            const db = 20 * Math.log10(val);
            if (db < minDB) minDB = db;
            if (db > maxDB) maxDB = db;
        }
        if ((t & (Math.floor(timeFrames/50) - 1)) === 0) {
            renderDataProgressBar.value = t;
            await nextFrame();
        }
    }

    // Clamp dynamic range (better visuals)
    maxDB = Math.max(maxDB, -10);
    minDB = maxDB - 80; 

    renderDataProgressBar.value = timeFrames;

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
    const windowSize = (freqBins - 1) * 2;
    const freqResolution = sampleRate / windowSize;

    const minBin = Math.max(0, Math.floor(minFreq / freqResolution));
    const maxBin = Math.min(freqBins - 1, Math.ceil(maxFreq / freqResolution));

    if (minBin >= maxBin) {
        throw new Error("Invalid frequency range");
    }

    return { maxBin, minBin };
}

