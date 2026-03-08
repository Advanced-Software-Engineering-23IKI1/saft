
/**
 * Compute the midpoint between two pointer positions in the same coordinate space.
 *
 * @param {Point} p1 First pointer position.
 * @param {Point} p2 Second pointer position.
 * @returns {Point} Midpoint between `p1` and `p2`.
 */
export function getMidpoint(p1, p2) {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}


/**
 * Returns the Euclidean distance between two 2D points.
 *
 * @param {{x: number, y: number}} a First point.
 * @param {{x: number, y: number}} b Second point.
 * @returns {number} Distance between `a` and `b` (same units as the input coordinates).
 */
export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}


/**
 * Returns the position of a pointer event relative to the canvas.
 *
 * @param {MouseEvent|TouchEvent} e Pointer event.
 * @param {HTMLCanvasElement} canvasRef Reference to the canvas element.
 * @returns {{x: number, y: number}} Position of the pointer relative to the canvas.
 */
export function getCanvasPoint(e, canvasRef) {
  const rect = canvasRef.value.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
    };
}