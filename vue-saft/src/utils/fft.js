function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
}

/**
 * FFT / IFFT for complex input (real + imag).
 * If imag is omitted, it assumes purely real input.
 * @param {ArrayLike<number>} inputRe real part
 * @param {ArrayLike<number>|null} inputIm imag part (optional, can be null)
 * @param {boolean} inverse false => FFT, true => IFFT
 * @returns {{re: Float64Array, im: Float64Array}}
 */
export function fftComplex(inputRe, inputIm = null, inverse = false) {
    const N = inputRe.length;
    if (!isPowerOfTwo(N)) throw new Error(`fft(): length must be power of 2, got ${N}`);

    const re = new Float64Array(N);
    const im = new Float64Array(N);

    // Copy input -> re, im with sanitization
    for (let i = 0; i < N; i++) {
        const vr = Number(inputRe[i]);
        re[i] = Number.isFinite(vr) ? vr : 0;

        let vi = 0;
        if (inputIm) {
            const vIm = Number(inputIm[i]);
            vi = Number.isFinite(vIm) ? vIm : 0;
        }
        im[i] = vi;
    }

    // Bit reversal permutation (same for FFT / IFFT)
    for (let i = 1, j = 0; i < N; i++) {
        let bit = N >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) {
            let tr = re[i]; re[i] = re[j]; re[j] = tr;
            let ti = im[i]; im[i] = im[j]; im[j] = ti;
        }
    }

    // Cooley–Tukey
    // Forward: angle = -2π/len, Inverse: angle = +2π/len
    for (let len = 2; len <= N; len <<= 1) {
        const half = len >> 1;
        const ang = (inverse ? +2 : -2) * Math.PI / len;

        for (let i = 0; i < N; i += len) {
            for (let j = 0; j < half; j++) {
                const a = ang * j;
                const wr = Math.cos(a);
                const wi = Math.sin(a);

                const i0 = i + j;
                const i1 = i0 + half;

                const ur = re[i0], ui = im[i0];
                const vr = re[i1], vi = im[i1];

                // t = w * v
                const tr = wr * vr - wi * vi;
                const ti = wr * vi + wi * vr;

                re[i0] = ur + tr;
                im[i0] = ui + ti;
                re[i1] = ur - tr;
                im[i1] = ui - ti;
            }
        }
    }

    // For IFFT, divide by N to normalize
    if (inverse) {
        for (let i = 0; i < N; i++) {
            re[i] /= N;
            im[i] /= N;
        }
    }

    return { re, im };
}

/**
 * Convenience wrapper: FFT for real input.
 * @param {ArrayLike<number>} input real-valued samples
 */
export function fft(input) {
    return fftComplex(input, null, false);
}

/**
 * Convenience wrapper: IFFT returning real part.
 * @param {{re: ArrayLike<number>, im: ArrayLike<number>}} spectrum
 * @returns {Float64Array} real time-domain samples
 */
export function ifft(spectrum) {
    const { re, im } = fftComplex(spectrum.re, spectrum.im, true);
    return re; // imag part should be ~0 for a properly conjugate-symmetric spectrum
}
