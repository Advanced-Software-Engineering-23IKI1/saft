import { Tool } from '@/enums/ToolEnum.js';
import { computeInternalPos, distance, getMidpoint } from '../canvasUtils';
import { getCanvasPoint } from '../canvasUtils';
import { addPixelValue, addUpdate, createUpdate, pixelToFlatIndex, popActiveUpdate, undoUpdate } from '../updateUtils';
import { clearOverlay, brushSizeOverlay } from '../overlay';
import { OptimizedBrush } from '../optimizedBrush';
import { clampValue, dbToLinear, linearToDb } from '../utils';
import { updateStore } from '@/store/store';



export function useDrawingTool(canvasDimensions, canvasRef, overlayRef, spectrogramStore, invalidate, maxPixelCount, toolEvents, canvasOffsets, canvasScaleFactor, zoom) {

    let pinchStartDist = 0;
    let isPinching = false;
    let blockDrawingUntilAllTouchesUp = false;

    const brushDbAdd = 2;   
    const brushDbRemove = -2; 

    let pointers = new Map(); // pointerId -> {x,y}
    let brushsize = 5
    const minBrush = 1, maxBrush = 50;
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
            resizeBrushOverlay();
        },

        onCanvasPointerDown(e) {
            clearOverlay(overlayRef.value);
            canvasRef.value.setPointerCapture(e.pointerId);
            const point = getCanvasPoint(e, canvasRef);
            pointers.set(e.pointerId, point);

            if (pointers.size === 1) {
                if (e.pointerType === 'touch') return;
                let tempupdate = createUpdate()
                const internalPos = computeInternalPos(point, zoom.value, canvasScaleFactor.value, canvasOffsets.internalHeightOffset, canvasOffsets.internalWidthOffset)
                const currentPixels = myBrush.getPixels(Math.floor(internalPos.x), Math.floor(internalPos.y));
                addPixelsToUpdate(currentPixels, tempupdate, brushDbAdd)

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

                addPixelsToUpdate(currentPixels, tempupdate, brushDbAdd);

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
    toolEvents.set(Tool.Brush2, {

        onCanvasWheel(e) {
            e.preventDefault();
            if (e.deltaY > 0) {
                brushsize = Math.min(++brushsize, maxBrush);
            }
            else if (e.deltaY < 0) {
                brushsize = Math.max(--brushsize, minBrush);
            }
            resizeBrushOverlay()
        },

        onCanvasPointerDown(e) {
            clearOverlay(overlayRef.value);
            canvasRef.value.setPointerCapture(e.pointerId);
            const point = getCanvasPoint(e, canvasRef);
            pointers.set(e.pointerId, point);

            if (pointers.size === 1) {
                if (e.pointerType === 'touch') return;
                let tempupdate = createUpdate()
                const internalPos = computeInternalPos(point, zoom.value, canvasScaleFactor.value, canvasOffsets.internalHeightOffset, canvasOffsets.internalWidthOffset)
                const currentPixels = myBrush.getPixels(Math.floor(internalPos.x), Math.floor(internalPos.y));
                addPixelsToUpdate(currentPixels, tempupdate, brushDbRemove)
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
                addPixelsToUpdate(currentPixels, tempupdate, brushDbRemove)
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

    function resizeBrushOverlay() {
        myBrush.offsets = myBrush.calculateOffsets(brushsize);
        brushSizeOverlay(overlayRef.value, brushsize * zoom.value * canvasScaleFactor.value);
    }


        function addPixelsToUpdate(currentPixels, tempupdate, brushDB) {
            if (!spectrogramStore.renderData) return
            const { minDB, maxDB, data, maxBin, width } = spectrogramStore.renderData
            let update = null
            if (updateStore) {
                update = updateStore.combinedUpdate
            }

            currentPixels.forEach((pixel) => {
                let val = getSpectrogramValue(maxBin, data, pixel);
                if (update) {
                    const updateVal = update[pixelToFlatIndex(pixel, width)]
                    if (!Number.isNaN(updateVal)) {
                        val = updateVal
                    }
                }
             
                const minAmp = 1e-8; 
                val = Math.max(val, minAmp);

                let db = linearToDb(val)
                db += brushDB;
                db = clampValue(db, minDB, maxDB)
                val = dbToLinear(db);
                addPixelValue(tempupdate, pixel, val);
            });
        }

        return {}
    }




function getSpectrogramValue(maxBin, data, pixel) {
    const yFloatFlipped = maxBin - pixel.y;
    const yFlipped = Math.floor(yFloatFlipped) - 1;
    return data[pixel.x][yFlipped];

}

