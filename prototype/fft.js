
function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
}

/**
 * FFT for real input.
 * @param {ArrayLike<number>} input real-valued samples, length must be power of 2
 * @returns {{re: Float64Array, im: Float64Array}} complex spectrum
 */
function fft(input) {
    const N = input.length;
    if (!isPowerOfTwo(N)) throw new Error(`fft(): length must be power of 2, got ${N}`);

    const re = new Float64Array(N);
    const im = new Float64Array(N);

    // Copy input -> re, im=0 with sanitization
    for (let i = 0; i < N; i++) {
        const v = Number(input[i]);
        re[i] = Number.isFinite(v) ? v : 0;
        im[i] = 0;
    }

    // Bit reversal permutation
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
    for (let len = 2; len <= N; len <<= 1) {
        const half = len >> 1;
        const ang = -2 * Math.PI / len;

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

    return { re, im };
}

module.exports = { fft };