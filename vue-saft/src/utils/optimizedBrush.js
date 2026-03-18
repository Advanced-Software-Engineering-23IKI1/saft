export class OptimizedBrush {
  constructor(size = 5) {
    this.size = size;
    this.offsets = this.calculateOffsets(size);
  }

  setSize(size) {
    this.size = size;
    this.offsets = this.calculateOffsets(size);
  }

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
}
