
/**
 * Map a normalized value to an Inferno-like RGB color.
 *
 * @param {number} x Normalized value in range [0, 1].
 * @returns {[number, number, number]} RGB values in range [0, 255].
 */
export function colormapInferno(x) {
        const r = Math.min(255, Math.max(0, 255 * Math.pow(x, 0.5)));
        const g = Math.min(255, Math.max(0, 255 * Math.pow(x, 1.5)));
        const b = Math.min(255, Math.max(0, 255 * Math.pow(x, 3.0)));
        return [r, g, b];
    }
