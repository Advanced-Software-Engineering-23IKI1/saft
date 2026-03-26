import { fftComplex } from './fft.js';

const nextFrame = () => new Promise(requestAnimationFrame); // yield to repaint


function makeHannWindow(nFFT) {
    const win = new Float32Array(nFFT);
    for (let n = 0; n < nFFT; n++) {
        win[n] = 0.5 * (1 - Math.cos((2 * Math.PI * n) / nFFT));
    }
    return win;
}

function makeComplexFrames(nFrames, freqBins) {
    const re = new Array(nFrames);
    const im = new Array(nFrames);
    for (let t = 0; t < nFrames; t++) {
        re[t] = new Float32Array(freqBins);
        im[t] = new Float32Array(freqBins);
    }
    return { re, im };
}

function buildHermitianSpectrum(halfRe, halfIm, fullRe, fullIm, nFFT, freqBins) {
    fullRe.fill(0);
    fullIm.fill(0);

    for (let k = 0; k < freqBins; k++) {
        fullRe[k] = halfRe[k];
        fullIm[k] = halfIm[k];
    }

    for (let k = 1; k < freqBins - 1; k++) {
        const mirror = nFFT - k;
        fullRe[mirror] = halfRe[k];
        fullIm[mirror] = -halfIm[k];
    }
}

function stftFrameInto(signal, offset, nFFT, win, outRe, outIm, fftRe, fftIm) {
    for (let n = 0; n < nFFT; n++) {
        fftRe[n] = (signal[offset + n] || 0) * win[n];
        fftIm[n] = 0;
    }

    const out = fftComplex(fftRe, fftIm, false);

    if (out && out.re && out.im) {
        outRe.set(out.re);
        outIm.set(out.im);
    } else {
        outRe.set(fftRe);
        outIm.set(fftIm);
    }
}

function istftFromHalfSpectra(framesRe, framesIm, nFFT, hopLength, win, outY, outNorm, fftRe, fftIm) {
    const nFrames = framesRe.length;
    const freqBins = framesRe[0].length;
    const totalLength = hopLength * (nFrames - 1) + nFFT;

    outY.fill(0, 0, totalLength);
    outNorm.fill(0, 0, totalLength);

    for (let t = 0; t < nFrames; t++) {
        buildHermitianSpectrum(framesRe[t], framesIm[t], fftRe, fftIm, nFFT, freqBins);

        const inv = fftComplex(fftRe, fftIm, true);
        const timeRe = inv && inv.re ? inv.re : fftRe;

        const offset = t * hopLength;
        for (let n = 0; n < nFFT; n++) {
            const v = timeRe[n] * win[n];
            outY[offset + n] += v;
            outNorm[offset + n] += win[n] * win[n];
        }
    }

    for (let i = 0; i < totalLength; i++) {
        const norm = outNorm[i];
        if (norm > 1e-8) outY[i] /= norm;
    }

    return outY.subarray(0, totalLength);
}

export async function griffinLimFromImageFast(
    mag,
    nFFT,
    hopLength,
    nIter = 12,
    conversionName,
    conversionProgress
) {
    const nFrames = mag.length;
    const freqBins = mag[0].length;

    const momentum = .99

    if (freqBins !== (nFFT >> 1) + 1) {
        const rawNFFT = (freqBins - 1) * 2;
        nFFT = 2 ** Math.ceil(Math.log2(rawNFFT));
        console.warn(`freqBins (${freqBins}) != nFFT/2+1, snapping nFFT to ${nFFT}`);
    }

    const win = makeHannWindow(nFFT);
    const totalLength = hopLength * (nFrames - 1) + nFFT;
    const eps = 1e-12;

    const spec = makeComplexFrames(nFrames, freqBins);
    const prevSpec = momentum > 0 ? makeComplexFrames(nFrames, freqBins) : null;

    const y = new Float32Array(totalLength);
    const norm = new Float32Array(totalLength);

    const fullRe = new Float32Array(nFFT);
    const fullIm = new Float32Array(nFFT);

    const anaRe = new Float32Array(nFFT);
    const anaIm = new Float32Array(nFFT);



    conversionName.value = "First Loop"
    let updateInterval = Math.max(1, Math.floor(nFrames / 50));
    let updateIndex = 0;

    for (let t = 0; t < nFrames; t++) {
        const re = spec.re[t];
        const im = spec.im[t];
        const magFrame = mag[t];

        for (let k = 0; k < freqBins; k++) {
            const phase = (Math.random() * 2 - 1) * Math.PI;
            const m = magFrame[k];
            re[k] = m * Math.cos(phase);
            im[k] = m * Math.sin(phase);
        }

        updateIndex += 1;
        if (updateIndex % updateInterval === 0) {
            conversionProgress.value = updateIndex / nFrames;
            await nextFrame();
        }
    }

    conversionName.value = "Second Loop"
    updateInterval = Math.max(1, Math.floor(nIter / 50));
    updateIndex = 0;

    for (let it = 0; it < nIter; it++) {
        istftFromHalfSpectra(spec.re, spec.im, nFFT, hopLength, win, y, norm, fullRe, fullIm);

        for (let t = 0; t < nFrames; t++) {
            const offset = t * hopLength;
            stftFrameInto(y, offset, nFFT, win, anaRe, anaIm, fullRe, fullIm);

            const re = spec.re[t];
            const im = spec.im[t];
            const magFrame = mag[t];
            const prevRe = prevSpec ? prevSpec.re[t] : null;
            const prevIm = prevSpec ? prevSpec.im[t] : null;

            for (let k = 0; k < freqBins; k++) {
                let xr = anaRe[k];
                let xi = anaIm[k];

                if (momentum > 0 && prevRe && prevIm) {
                    const oldRe = re[k];
                    const oldIm = im[k];
                    xr = xr + momentum * (xr - prevRe[k]);
                    xi = xi + momentum * (xi - prevIm[k]);
                    prevRe[k] = oldRe;
                    prevIm[k] = oldIm;
                }

                const scale = magFrame[k] / (Math.hypot(xr, xi) + eps);
                re[k] = xr * scale;
                im[k] = xi * scale;
            }
        }

        updateIndex += 1;
        if (updateIndex % updateInterval === 0) {
            conversionProgress.value = updateIndex / nIter;
            await nextFrame();
        }

    }

    return istftFromHalfSpectra(spec.re, spec.im, nFFT, hopLength, win, y, norm, fullRe, fullIm).slice();
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
