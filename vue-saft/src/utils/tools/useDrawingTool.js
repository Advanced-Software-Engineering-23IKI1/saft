import { Tool } from '@/enums/ToolEnum.js';
import { computeInternalPos, distance, getMidpoint } from '../canvasUtils';
import { getCanvasPoint } from '../canvasUtils';
import { addPixelDelta, addUpdateClearRedo, popActiveUpdate, undoUpdate } from '../updateUtils';
import { dbToLinear } from '../utils';
import { clearOverlay, brushSizeOverlay } from '../overlay';




export function useDrawingTool(canvasDimensions, canvasRef, overlayRef, spectrogramStore, invalidate, maxPixelCount, toolEvents, canvasOffsets, canvasScaleFactor, zoom) {
    class OptimizedBrush {
        constructor(radius) {
            this.radius = radius;
            // Calculate and cache the local offsets once when the brush is created
            this.offsets = this.calculateOffsets(radius);
        }
        calculateOffsets(size) {
            const offsets = [];

            // The radius is half of the diameter
            const radius = size / 2;
            const rSquared = radius * radius;

            // Calculate the bounding box limits
            // Size 1 -> min: 0, max: 0
            // Size 2 -> min: 0, max: 1
            // Size 4 -> min: -1, max: 2
            const minD = -Math.floor((size - 1) / 2);
            const maxD = Math.ceil((size - 1) / 2);

            // Calculate the true geometric center of this box
            const cx = (minD + maxD) / 2;
            const cy = (minD + maxD) / 2;

            // Iterate through the bounding box
            for (let dx = minD; dx <= maxD; dx++) {
                for (let dy = minD; dy <= maxD; dy++) {
                    // Find distance from the current pixel to the true geometric center
                    const distX = dx - cx;
                    const distY = dy - cy;

                    // Check if the pixel falls within the squared radius
                    if ((distX * distX) + (distY * distY) <= rSquared) {
                        offsets.push({ dx, dy });
                    }
                }
            }

            return offsets;
        }

        // Retrieve absolute coordinates based on the brush's current center
        getPixels(cx, cy, gridWidth = Infinity, gridHeight = Infinity) {
            const pixels = [];

            // Iterate through the pre-calculated offsets instead of recalculating the circle
            for (let i = 0; i < this.offsets.length; i++) {
                const x = cx + this.offsets[i].dx;
                const y = cy + this.offsets[i].dy;

                // Ensure the coordinates do not bleed outside the canvas/grid boundaries
                if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
                    pixels.push({ x, y });
                }
            }

            return pixels;
        }
    }
    let pinchStartDist = 0;
    let isPinching = false;
    let blockDrawingUntilAllTouchesUp = false;

    let pointers = new Map(); // pointerId -> {x,y}
    let brushsize = 5, minBrush = 1, maxBrush = 50;
    const myBrush = new OptimizedBrush(5);
    toolEvents.set(Tool.Brush, {

        onCanvasWheel(e) {
            e.preventDefault();
            if (e.deltaY > 0) {
                brushsize = Math.min(++brushsize, maxBrush);
            }
            else if (e.deltaY < 0) {
                brushsize = Math.max(--brushsize, minBrush);
            }
            myBrush.offsets = myBrush.calculateOffsets(brushsize)
            // console.log(zoom.value);
            brushSizeOverlay(overlayRef.value, brushsize * zoom.value * 1.25);
        },

        onCanvasPointerDown(e) {
            clearOverlay(overlayRef.value);
            canvasRef.value.setPointerCapture(e.pointerId);
            const point = getCanvasPoint(e, canvasRef);
            pointers.set(e.pointerId, point);

            if (pointers.size === 1) {
                if (e.pointerType === 'touch') return;
                let tempupdate = popActiveUpdate()
                const internalPos = computeInternalPos(point, zoom.value, canvasScaleFactor.value, canvasOffsets.internalHeightOffset, canvasOffsets.internalWidthOffset)
                const currentPixels = myBrush.getPixels(Math.floor(internalPos.x), Math.floor(internalPos.y));
                currentPixels.forEach(({ x, y }) => {
                    addPixelDelta(tempupdate, { x: x, y: y }, dbToLinear(-6))
                });
                addUpdateClearRedo(tempupdate);
                invalidate();

            }
            if (pointers.size === 2) {
                const [p1, p2] = [...pointers.values()];
                pinchStartDist = distance(p1, p2);
                isPinching = true;
                blockDrawingUntilAllTouchesUp = true;
                return;
            }

        },

        onCanvasPointerMove(e) {
            if (!pointers.has(e.pointerId)) return;
            const point = getCanvasPoint(e, canvasRef);
            pointers.set(e.pointerId, point);


            if (pointers.size === 1) {
                if (isPinching || blockDrawingUntilAllTouchesUp) return;
                let tempupdate = popActiveUpdate()
                const internalPos = computeInternalPos(point, zoom.value, canvasScaleFactor.value, canvasOffsets.internalHeightOffset, canvasOffsets.internalWidthOffset)
                const currentPixels = myBrush.getPixels(Math.floor(internalPos.x), Math.floor(internalPos.y));
                currentPixels.forEach(({ x, y }) => {
                    addPixelDelta(tempupdate, { x: x, y: y }, dbToLinear(-6))
                });
                console.log(dbToLinear(-6));
                // console.log(canvasDimensions.width, canvasDimensions.height);
                addUpdateClearRedo(tempupdate);
                invalidate();
                return;


            }
            if (pointers.size === 2) {
                const [p1, p2] = [...pointers.values()];
                const pinchCurrentDist = distance(p1, p2);
                const distDelta = pinchCurrentDist - pinchStartDist;

                if (Math.abs(distDelta) > 5) {
                    if (distDelta > 0) {
                        brushsize = Math.min(brushsize + 1, maxBrush);
                    } else {
                        brushsize = Math.max(brushsize - 1, minBrush);
                    }

                    myBrush.offsets = myBrush.calculateOffsets(brushsize);
                    brushSizeOverlay(overlayRef.value, brushsize * zoom.value * 1.25);

                    pinchStartDist = pinchCurrentDist;
                }

                return;
            }
        },

        endPointer(e) {
            pointers.delete(e.pointerId);
            clearOverlay(overlayRef.value);

            if (pointers.size < 2) {
                pinchStartDist = 0;
                isPinching = false;
            }

            if (pointers.size === 0) {
                blockDrawingUntilAllTouchesUp = false;
            }

            try { canvasRef.value.releasePointerCapture(e.pointerId); } catch { }
        },
        onCanvasPointerUp(e) {
            this.endPointer(e);
        },
        onCanvasPointerCancel(e) {
            this.endPointer(e);
        },
        onCanvasPointerLeave(e) {
            this.endPointer(e);
        }
    });


    return {}
}


