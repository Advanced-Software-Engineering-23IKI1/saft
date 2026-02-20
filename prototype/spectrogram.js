const { fft } = require('./fft');         // local module
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const math = require('mathjs');
const { PNG } = require('pngjs');



/**
 * @brief Computes the magnitude spectrogram of a real-valued audio signal.
 *
 * This function performs a Short-Time Fourier Transform (STFT) on the input
 * signal using overlapping Hann-windowed frames and a radix-2 FFT. For each
 * frame, only the positive frequency bins (0 Hz through Nyquist) are retained,
 * and their magnitudes are stored in the output spectrogram matrix.
 *
 * The resulting spectrogram is organized as a 2D array indexed by
 * time frame first and frequency bin second:
 *
 *     spectrogram.data[timeIndex][freqIndex]
 *
 * where freqIndex = 0 corresponds to DC (0 Hz), and freqIndex = freqBins-1
 * corresponds to the Nyquist frequency (sampleRate / 2).
 *
 * @param {ArrayLike<number>} samples
 *     Real-valued input audio samples. Typically a Float32Array from a WAV
 *     decoder. All values must be finite numbers (no NaN or Infinity).
 *
 * @param {number} sampleRate
 *     Sampling rate of the input signal in Hz (e.g., 44100).
 *
 * @param {Object} [params]
 *     Optional spectrogram parameters.
 *
 * @param {number} [params.windowSize=1024]
 *     FFT window size in samples. Must be a power of two. Determines frequency
 *     resolution: freqResolution = sampleRate / windowSize.
 *
 * @param {number} [params.hopSize=256]
 *     Hop size (frame advance) in samples. Determines time resolution:
 *     timeResolution = hopSize / sampleRate.
 *
 * @return {Object} Spectrogram object with the following properties:
 *
 * @return {number[][]} return.data
 *     2D array of magnitude values indexed as [timeFrame][frequencyBin].
 *     Units are linear magnitude (not dB).
 *
 * @return {number} return.freqBins
 *     Number of frequency bins per frame. Equals windowSize/2 + 1.
 *
 * @return {number} return.timeFrames
 *     Number of time frames in the spectrogram.
 *
 * @return {number} return.freqResolution
 *     Frequency spacing between bins in Hz.
 *
 * @return {number} return.timeResolution
 *     Time spacing between frames in seconds.
 *
 * @throws {Error}
 *     If windowSize is not a power of two.
 *
 * @throws {Error}
 *     If input samples contain NaN or Infinity.
 *
 * @note
 *     The FFT operates on Hann-windowed frames to reduce spectral leakage.
 *
 * @note
 *     Output magnitudes are linear. Convert to decibels with:
 *         dB = 20 * log10(magnitude + epsilon)
 *
 * @note
 *     Memory layout is optimized for visualization and sequential time access.
 *
 * @example
 * const spec = computeSpectrogram(samples, 44100, {
 *     windowSize: 1024,
 *     hopSize: 256
 * });
 *
 * console.log(spec.data[0][0]); // magnitude at t=0, f=0 Hz
 */


function computeSpectrogram(samples, sampleRate, params = {}) {
    console.log('DEBUG: samples.length:', samples.length);

    const { windowSize = 2048, hopSize = 512 } = params;

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

    return {
        data: spectrogram,
        freqBins: half,
        timeFrames: spectrogram.length,
        freqResolution: sampleRate / windowSize,
        timeResolution: hopSize / sampleRate
    };
}

// Hann window -> returns plain JS array of numbers
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


function save_to_png(
    spectrogram,
    sampleRate,
    outputPath = 'spectrogram.png',
    minFreq = 0,
    maxFreq = sampleRate / 2
) {
    const { data, freqBins, timeFrames } = spectrogram;

    // Compute frequency resolution
    // freqBins = windowSize/2 + 1
    const windowSize = (freqBins - 1) * 2;
    const freqResolution = sampleRate / windowSize;

    const minBin = Math.max(0, Math.floor(minFreq / freqResolution));
    const maxBin = Math.min(freqBins - 1, Math.ceil(maxFreq / freqResolution));

    if (minBin >= maxBin) {
        throw new Error("Invalid frequency range");
    }

    console.log(`Showing frequencies ${minFreq}Hz – ${maxFreq}Hz`);
    console.log(`Bins ${minBin} – ${maxBin}`);

    const visibleBins = maxBin - minBin + 1;

    const height = visibleBins
    const width = timeFrames;
    const pixels = new Uint8ClampedArray(width * height * 4); // RGBA

    // Compute global dB range 
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

    //  Colormap (Inferno-like smooth gradient) 
    function colormap(x) {
        const r = Math.min(255, Math.max(0, 255 * Math.pow(x, 0.5)));
        const g = Math.min(255, Math.max(0, 255 * Math.pow(x, 1.5)));
        const b = Math.min(255, Math.max(0, 255 * Math.pow(x, 3)));
        return [r, g, b];
    }


    // Render 
    for (let t = 0; t < timeFrames; t++) {
        const frame = data[t] || [];

        for (let y = 0; y < height; y++) {

            // Logarithmic mapping:
            // const logMin = Math.log10(minBin + 1);
            // const logMax = Math.log10(maxBin + 1);
            // const logBin = logMin + (y / height) * (logMax - logMin);
            // const binFloat = Math.pow(10, logBin) - 1;
            const binFloat = minBin + (y / height) * visibleBins;
            const bin = Math.floor(binFloat);


            const val = Math.max(frame[bin] || 0, 1e-12);
            const db = 20 * Math.log10(val);

            const norm = (db - minDB) / (maxDB - minDB);
            const clamped = Math.max(0, Math.min(1, norm));

            const [r, g, b] = colormap(clamped);

            const flippedY = height - 1 - y;
            const idx = (flippedY * width + t) * 4;

            pixels[idx] = r;
            pixels[idx + 1] = g;
            pixels[idx + 2] = b;
            pixels[idx + 3] = 255;
        }
    }


    const png = new PNG({ width, height });
    png.data = pixels; // assign your pixel array directly

    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });

    // Write PNG file
    png.pack().pipe(fs.createWriteStream(outputPath))
    .on('finish', () => console.log(`PNG saved: ${outputPath}`));
}


function dBToColor(norm) {
    let r, g, b;

    if (norm < 0.2) {
        r = 0; g = norm * 5; b = 1;
    } else if (norm < 0.4) {
        r = 0; g = 1; b = 1 - (norm - 0.2) * 2.5;
    } else if (norm < 0.7) {
        r = (norm - 0.4) * 2.5; g = 1; b = 0;
    } else {
        r = 1; g = 1 - (norm - 0.7) * 2.5; b = 0;
    }

    return { r: Math.floor(r * 255), g: Math.floor(g * 255), b: Math.floor(b * 255) };
}

module.exports = { computeSpectrogram, save_to_png };