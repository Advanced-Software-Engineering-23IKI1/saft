import { Tool } from '@/enums/ToolEnum.js';
import { computeInternalPos, distance, getMidpoint } from '../canvasUtils';
import { getCanvasPoint } from '../canvasUtils';
import { addPixelValue, addUpdate, createUpdate, indexToPixel, pixelToFlatIndex, pixelToIndex, popActiveUpdate, undoUpdate } from '../updateUtils';
import { clearOverlay, brushSizeOverlay } from '../overlay';
import { OptimizedBrush } from '../optimizedBrush';
import { addDBtoLinear } from '../utils';
import { updateStore } from '@/store/store';


export function useDrawingTool(canvasDimensions, canvasRef, overlayRef, spectrogramStore, invalidate, maxPixelCount, toolEvents, canvasOffsets, canvasScaleFactor, zoom) {

    let pinchStartDist = 0;
    let isPinching = false;
    let blockDrawingUntilAllTouchesUp = false;

    const brushDbAdd = 2;
    const brushDbRemove = -2;
    const minAmpAdd = 1e-1
    const minAmpRemove = 1e-8

    let pointers = new Map(); // pointerId -> {x,y}
    let brushsize = 5
    const minBrush = 1, maxBrush = 50;
    const myBrush = new OptimizedBrush(5)

    let seenPixels = new Set();

    // interpolation 
    let startbrushpos = null;
    let currentpixelpos = null;





    toolEvents.set(Tool.Brush, {

        onCanvasWheel(e) {
            onCanvasWheelFunction(e)
        },

        onCanvasPointerDown(e) {
            onCanvasPointerDownFunction(e, brushDbAdd, minAmpAdd)

        },

        onCanvasPointerMove(e) {
            onCanvasPointerMoveFunction(e, brushDbAdd, minAmpAdd)
        },

        endPointer(e) {
            endPointerFunction(e)

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

    toolEvents.set(Tool.Brush2, {

        onCanvasWheel(e) {
            onCanvasWheelFunction(e)
        },

        onCanvasPointerDown(e) {
            onCanvasPointerDownFunction(e, brushDbRemove, minAmpRemove)

        },

        onCanvasPointerMove(e) {
            onCanvasPointerMoveFunction(e, brushDbRemove, minAmpRemove)
        },

        endPointer(e) {
            endPointerFunction(e)
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



    /**
     * Recalculates the brush offsets and resizes the brush overlay
     * based on the current brush size, zoom level, and canvas scale factor.
     *
     * @returns {void}
     */
    function resizeBrushOverlay() {
        myBrush.offsets = myBrush.calculateOffsets(brushsize);
        brushSizeOverlay(overlayRef.value, brushsize * zoom.value * canvasScaleFactor.value);
    }


    /**
     * Applies a decibel adjustment to a list of spectrogram pixels and stores
     * the updated linear values in a temporary update buffer.
     *
     * Reads the current value from the spectrogram data, overrides it with a
     * pending update value when available, applies the dB brush change, and
     * writes the result back to `tempupdate`.
     *
     * @param {Array<{x: number, y: number}>} currentPixels - Pixels affected by the brush.
     * @param {*} tempupdate - Temporary update structure that receives modified pixel values.
     * @param {number} brushDB - Decibel amount to add to each selected pixel.
     * @param {minAmp}
     * @returns {void}
     */
    function addPixelsToUpdate(currentPixels, tempupdate, brushDB, minAmp) {
        if (!spectrogramStore.renderData) return
        const { minDB, maxDB, data, maxBin, width } = spectrogramStore.renderData

        let update
        if (updateStore) {
            update = updateStore.combinedUpdate
        }

        currentPixels.forEach((pixel) => {
            let val = getSpectrogramValue(maxBin, data, pixel);
            if (val) {
                val = getUpdateVal(val, pixel, width, update)
                val = addDBtoLinear(val, brushDB, minDB, maxDB, minAmp);
                addPixelValue(tempupdate, pixel, val);
            }

        });

    }



    /**
     * Returns the spectrogram value at a given pixel coordinate.
     *
     * @param {number} maxBin - The maximum spectrogram bin index.
     * @param {Array<Array<number>>} data - Two-dimensional spectrogram amplitude data.
     * @param {{x: number, y: number}} pixel - The pixel coordinate to sample.
     * @returns {number} The linear value stored at the mapped spectrogram position.
     * @private
     */
    function getSpectrogramValue(maxBin, data, pixel) {
        const yFloatFlipped = maxBin - pixel.y;
        const yFlipped = Math.floor(yFloatFlipped) - 1;
        return data[pixel.x]?.[yFlipped] ?? null;
    }


    /**
     * Returns the most recent value for a pixel, preferring a pending update
     * buffer value over the original spectrogram value when one exists.
     *
     * @param {number} val - The original pixel value.
     * @param {{x: number, y: number}} pixel - The pixel coordinate.
     * @param {number} width - The spectrogram width used for flat-index conversion.
     * @param {Array<number>|undefined} update - Optional flattened update buffer.
     * @returns {number} The resolved value for the pixel.
     * @private
     */
    function getUpdateVal(val, pixel, width, update) {
        if (update) {
            const updateVal = update[pixelToFlatIndex(pixel, width)]
            if (!Number.isNaN(updateVal)) {
                val = updateVal
            }
        }
        return val
    }

    /**
     * Starts a canvas pointer interaction for brush drawing or pinch detection.
     *
     * Clears the overlay, captures the active pointer, stores its canvas position,
     * and begins a brush update when the first pointer is pressed. When a second
     * pointer is detected, switches into pinch mode and blocks drawing until all
     * touches are released.
     *
     * @param {PointerEvent} e - Pointer event that started the interaction.
     * @param {number} brushDB - Decibel amount to apply to brushed pixels.
     * @param {number} minAmp - Minimum allowed linear amplitude value.
     * @returns {void}
     */
    function onCanvasPointerDownFunction(e, brushDB, minAmp) {
        clearOverlay(overlayRef.value);
        canvasRef.value.setPointerCapture(e.pointerId);
        const point = getCanvasPoint(e, canvasRef);
        pointers.set(e.pointerId, point);

        if (pointers.size === 1) {
            let tempupdate = createUpdate()
            const internalPos = computeInternalPos(point, zoom.value, canvasScaleFactor.value, canvasOffsets.internalHeightOffset, canvasOffsets.internalWidthOffset)
            startbrushpos = { x: Math.floor(internalPos.x), y: Math.floor(internalPos.y) }
            const currentPixels = myBrush.getPixels(Math.floor(internalPos.x), Math.floor(internalPos.y));
            currentPixels.forEach(element => {
                seenPixels.add(pixelToIndex(element))
            });
            if (!(e.pointerType === 'touch')) {
                addPixelsToUpdate(currentPixels, tempupdate, brushDB, minAmp)
            };
            addUpdate(tempupdate);
            invalidate();

        }
        if (pointers.size === 2) {
            const [p1, p2] = [...pointers.values()];
            pinchStartDist = distance(p1, p2);
            isPinching = true;
            blockDrawingUntilAllTouchesUp = true;
            return;
        }
    }

    /**
     * Adjusts the brush size in response to a mouse wheel event.
     *
     * Increases or decreases the current brush size within the configured minimum
     * and maximum bounds, then updates the brush overlay to match the new size.
     *
     * @param {WheelEvent} e - Wheel event used to resize the brush.
     * @returns {void}
     */
    function onCanvasWheelFunction(e) {
        e.preventDefault();
        if (e.deltaY > 0) {
            brushsize = Math.min(++brushsize, maxBrush);
        }
        else if (e.deltaY < 0) {
            brushsize = Math.max(--brushsize, minBrush);
        }
        resizeBrushOverlay();
    }

    /**
     * Handles canvas pointer movement for drawing or pinch resizing.
     *
     * Updates the stored pointer position, extends the current brush stroke when a
     * single pointer is active, and applies updates only to newly reached pixels.
     * When two pointers are active, interprets the movement as a pinch gesture and
     * adjusts the brush size instead of drawing.
     *
     * @param {PointerEvent} e - Pointer move event.
     * @param {number} brushDB - Decibel amount to apply to brushed pixels.
     * @param {number} minAmp - Minimum allowed linear amplitude value.
     * @returns {void}
     */
    function onCanvasPointerMoveFunction(e, brushDB, minAmp) {
        if (!pointers.has(e.pointerId)) return;
        const point = getCanvasPoint(e, canvasRef);
        pointers.set(e.pointerId, point);

        if (pointers.size === 1) {
            if (isPinching || blockDrawingUntilAllTouchesUp || !startbrushpos) return;
            let tempupdate = popActiveUpdate()
            const internalPos = computeInternalPos(point, zoom.value, canvasScaleFactor.value, canvasOffsets.internalHeightOffset, canvasOffsets.internalWidthOffset)
            currentpixelpos = { x: Math.floor(internalPos.x), y: Math.floor(internalPos.y) }
            let pixels = new Set()
            pixels = myBrush.getInterpolatedPixelsSet(currentpixelpos, startbrushpos)
            const newPixels = pixels.difference(seenPixels);

            const newPixelArray = new Array()
            newPixels.forEach(element => {
                newPixelArray.push(indexToPixel(element))
            });
            addPixelsToUpdate(newPixelArray, tempupdate, brushDB, minAmp);
            seenPixels = pixels 
            startbrushpos = { x: Math.floor(internalPos.x), y: Math.floor(internalPos.y) }
            addUpdate(tempupdate);
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
                resizeBrushOverlay()
                pinchStartDist = pinchCurrentDist;
            }
            return;
        }
    }

    /**
     * Ends a pointer interaction and resets transient drawing state.
     *
     * Removes the pointer from the active pointer map, clears the overlay, resets
     * tracked brush positions and seen pixels, and exits pinch mode when fewer than
     * two pointers remain. Drawing is re-enabled once all active touches are gone.
     *
     * @param {PointerEvent} e - Pointer event that ended the interaction.
     * @returns {void}
     */
    function endPointerFunction(e) {
        pointers.delete(e.pointerId);
        clearOverlay(overlayRef.value);
        seenPixels = new Set();
        startbrushpos = null
        currentpixelpos = null
        if (pointers.size < 2) {
            pinchStartDist = 0;
            isPinching = false;
        }

        if (pointers.size === 0) {
            blockDrawingUntilAllTouchesUp = false;
        }
        try { canvasRef.value.releasePointerCapture(e.pointerId); } catch { }
    }


    return {}
}
