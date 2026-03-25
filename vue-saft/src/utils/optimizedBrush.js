import { pixelToIndex } from "./updateUtils";

/**
 * Circular brush that caches local pixel offsets for a given brush size.
 */
export class OptimizedBrush {
  /**
   * Create a brush and precompute its pixel offsets.
   *
   * @param {number} [size=5] Brush diameter in pixels.
   */
  constructor(size = 5) {
    this.size = size;
    this.offsets = this.calculateOffsets(size);
  }

  /**
   * Update the brush size and recalculate cached offsets.
   *
   * @param {number} size New brush diameter in pixels.
   * @returns {void}
   */
  setSize(size) {
    this.size = size;
    this.offsets = this.calculateOffsets(size);
  }

  /**
   * Compute local pixel offsets that fall inside the brush shape.
   *
   * @param {number} size Brush diameter in pixels.
   * @returns {{dx: number, dy: number}[]} Cached local offsets for the brush.
   */
  calculateOffsets(size) {
    const offsets = [];
    const radius = size / 2;
    const rSquared = radius * radius;
    const minD = -Math.floor((size - 1) / 2);
    const maxD = Math.ceil((size - 1) / 2);
    const cx = (minD + maxD) / 2;
    const cy = (minD + maxD) / 2;

    for (let dx = minD; dx <= maxD; dx++) {
      for (let dy = minD; dy <= maxD; dy++) {
        const distX = dx - cx;
        const distY = dy - cy;
        if (distX * distX + distY * distY <= rSquared) {
          offsets.push({ dx, dy });
        }
      }
    }
    return offsets;
  }

  /**
   * Get all brush pixels at a given center position, optionally clipped to bounds.
   *
   * @param {number} cx Brush center x-coordinate.
   * @param {number} cy Brush center y-coordinate.
   * @param {number} [gridWidth=Infinity] Maximum allowed x bound.
   * @param {number} [gridHeight=Infinity] Maximum allowed y bound.
   * @returns {{x: number, y: number}[]} Absolute pixel coordinates inside the brush.
   */
  getPixels(cx, cy, gridWidth = Infinity, gridHeight = Infinity) {
    const pixels = [];
    for (let i = 0; i < this.offsets.length; i++) {
      const x = cx + this.offsets[i].dx;
      const y = cy + this.offsets[i].dy;
      if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
        pixels.push({ x, y });
      }
    }
    return pixels;
  }

  /**
   * Returns the discrete pixel centers along a straight line between two points.
   *
   * Interpolates from `p1` to `p2` using the larger axis delta as the step count
   * and rounds each intermediate position to integer pixel coordinates. The
   * result includes both endpoints and is used as the stroke path between brush
   * samples.
   *
   * @param {{x: number, y: number}} p1 - Line start point in pixel coordinates.
   * @param {{x: number, y: number}} p2 - Line end point in pixel coordinates.
   * @returns {{x: number, y: number}[]} Pixel coordinates along the line.
   */
  getLinePixels(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const pixels = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pixels.push({
        x: Math.round(p1.x + dx * t),
        y: Math.round(p1.y + dy * t),
      });
    }

    return pixels;
  }

    /**
   * Returns the union of brush-covered pixels for all interpolated points between two positions.
   *
   * Samples the line from `p1` to `p2`, expands each sampled point into its full
   * brush footprint, and stores the covered pixels as unique flat indices in a
   * set. This is used to build a continuous brush stroke without duplicate pixel
   * entries.
   *
   * @param {{x: number, y: number}} p1 - Stroke start position in pixel coordinates.
   * @param {{x: number, y: number}} p2 - Stroke end position in pixel coordinates.
   * @returns {Set<number>} Unique indexed pixels covered by the interpolated brush stroke.
   */
  getInterpolatedPixelsSet(p1, p2) {
    const pixels = new Set();
    this.getLinePixels(p1, p2).forEach(element => {
      this.getPixels(element.x, element.y).forEach(element => {
        pixels.add(pixelToIndex(element))
      });
    });
    return pixels;
  }
}
