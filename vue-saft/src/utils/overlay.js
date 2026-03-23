/**
 * Draw a circular brush size indicator in the center of an overlay canvas.
 *
 * @param {HTMLCanvasElement} overlay Overlay canvas used for the brush preview.
 * @param {number} [size=5] Radius of the displayed brush indicator in pixels.
 * @returns {void}
 */
export function brushSizeOverlay(overlay, size = 5) {
    const canvas = overlay;
    const ctx = canvas.getContext("2d");
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "red";
    ctx.stroke();
}

/**
 * Clear all drawn content from an overlay canvas.
 *
 * @param {HTMLCanvasElement} overlay Overlay canvas to clear.
 * @returns {void}
 */
export function clearOverlay(overlay) {
    const canvas = overlay;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
