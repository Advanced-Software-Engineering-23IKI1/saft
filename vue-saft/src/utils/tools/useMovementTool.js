import { Tool } from '@/enums/ToolEnum.js';
import { distance, getMidpoint } from '@/utils/canvasUtils.js';
import { getCanvasPoint } from '@/utils/canvasUtils.js';
import { computeInternalPos } from '@/utils/canvasUtils.js';
import { clearOverlay } from '../overlay';


export function useMovementTool(canvasDimensions, canvasRef, overlayRef, spectrogramStore, invalidate, maxPixelCount, toolEvents, canvasOffsets, canvasScaleFactor, zoom) {



    let minZoom = 0.2, maxZoom = 25;

    let pointers = new Map(); // pointerId -> {x,y}
    let lastX = 0, lastY = 0;

    let scrollWheelSpeed = 0.2;

    // Pinch state
    let pinchStartDist = 0;
    let pinchStartZoom = 1;
    let pinchStartCenterCanvas = null;
    let pinchStartCenterInternal = null;


    toolEvents.set(Tool.Movement,
        {

            onCanvasWheel(e) {
                e.preventDefault();

                // Ctrl+wheel => zoom
                if (e.ctrlKey) {
                    const mouseX = e.offsetX;
                    const mouseY = e.offsetY;

                    const zoomFactor = Math.exp(-e.deltaY * 0.001);

                    const oldZoom = zoom.value;
                    const newZoom = Math.max(minZoom, Math.min(maxZoom, oldZoom * zoomFactor));

                    const oldZoomInternalPos = computeInternalPos({ x: mouseX, y: mouseY }, oldZoom, canvasScaleFactor.value, canvasOffsets.internalHeightOffset, canvasOffsets.internalWidthOffset);
                    const newZoomInternalPosRelative = computeInternalPos({ x: mouseX, y: mouseY }, newZoom, canvasScaleFactor.value, 0, 0);
                    canvasOffsets.internalWidthOffset = oldZoomInternalPos.x - newZoomInternalPosRelative.x;
                    canvasOffsets.internalHeightOffset = oldZoomInternalPos.y - newZoomInternalPosRelative.y;

                    zoom.value = newZoom;

                    updateMinZoom();
                    checkInternalOffsetValues();
                    invalidate();
                    return;
                }

                const dx = (e.shiftKey && e.deltaX === 0) ? e.deltaY : e.deltaX;
                const dy = (e.shiftKey && e.deltaX === 0) ? 0 : e.deltaY;

                let internalRelativePos = computeInternalPos({ x: Math.round(dx * scrollWheelSpeed), y: Math.round(dy * scrollWheelSpeed) }, zoom.value, canvasScaleFactor.value, 0, 0);

                canvasOffsets.internalWidthOffset += internalRelativePos.x;
                canvasOffsets.internalHeightOffset += internalRelativePos.y;

                checkInternalOffsetValues();
                invalidate();
            },


            onCanvasPointerDown(e) {
                canvasRef.value.setPointerCapture(e.pointerId);
                const point = getCanvasPoint(e, canvasRef);
                pointers.set(e.pointerId, point);

                if (pointers.size === 1) {
                    lastX = point.x;
                    lastY = point.y;

                } if (pointers.size === 2) {
                    const [p1, p2] = [...pointers.values()];

                    pinchStartDist = distance(p1, p2);
                    pinchStartZoom = zoom.value;
                    pinchStartCenterCanvas = getMidpoint(p1, p2);
                    pinchStartCenterInternal = computeInternalPos(pinchStartCenterCanvas, pinchStartZoom, canvasScaleFactor.value, canvasOffsets.internalHeightOffset, canvasOffsets.internalWidthOffset);
                }
                            },


            onCanvasPointerMove(e) {
                if (!pointers.has(e.pointerId)) return;
                const point = getCanvasPoint(e, canvasRef);
                pointers.set(e.pointerId, point);


                if (pointers.size === 1) {
                    // pan: screen px -> source px via step
                    const dx = point.x - lastX;
                    const dy = point.y - lastY;
                    lastX = point.x;
                    lastY = point.y;

                    const internalRelativePos = computeInternalPos({ x: dx, y: dy }, zoom.value, canvasScaleFactor.value, 0, 0);

                    canvasOffsets.internalWidthOffset -= internalRelativePos.x;
                    canvasOffsets.internalHeightOffset -= internalRelativePos.y;
                    checkInternalOffsetValues();
                    invalidate();
                    return;
                }

                if (pointers.size === 2) {
                    const [p1, p2] = [...pointers.values()];
                    const pinchCurrentDist = distance(p1, p2);

                    if (pinchStartDist > 0) {
                        const newZoom = pinchStartZoom * (pinchCurrentDist / pinchStartDist);
                        zoom.value = Math.max(minZoom, Math.min(maxZoom, newZoom));

                        const internalRelativePos = computeInternalPos(pinchStartCenterCanvas, zoom.value, canvasScaleFactor.value, 0, 0);

                        canvasOffsets.internalWidthOffset = pinchStartCenterInternal.x - internalRelativePos.x;
                        canvasOffsets.internalHeightOffset = pinchStartCenterInternal.y - internalRelativePos.y;

                        updateMinZoom();
                        checkInternalOffsetValues();
                        invalidate();
                    }
                }

            },

            endPointer(e) {
                pointers.delete(e.pointerId);

                clearOverlay(overlayRef.value);

                // new pan origin
                if (pointers.size === 1) {
                    const [p] = pointers.values();
                    lastX = p.x;
                    lastY = p.y;
                }

                if (pointers.size < 2) {
                    pinchStartDist = 0;
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

        })



    /**
    * Clamp the current render offsets so the visible box stays within the rendered image bounds,
    * then sync the horizontal/vertical slider UI values to the updated offsets.
    *
    * @returns {void} Does not return a value.
    */
    const checkInternalOffsetValues = () => {
        if (!spectrogramStore.renderData) return;
        if (!canvasRef.value) return;

        // canvasDimensions are already scaled by canvasScaleFactor, so we can use them directly here to compute the internal dimensions of the visible box.
        const internalDimension = computeInternalPos({ x: canvasDimensions.width, y: canvasDimensions.height }, zoom.value, 1, 0, 0);

        canvasOffsets.maxInternalWidthOffset = Math.max(0, spectrogramStore.renderData.width - internalDimension.x);
        canvasOffsets.maxInternalHeightOffset = Math.max(0, spectrogramStore.renderData.height - internalDimension.y);

        canvasOffsets.internalWidthOffset = Math.min(Math.max(canvasOffsets.internalWidthOffset, 0), canvasOffsets.maxInternalWidthOffset);
        canvasOffsets.internalHeightOffset = Math.min(Math.max(canvasOffsets.internalHeightOffset, 0), canvasOffsets.maxInternalHeightOffset);
    }

    /**
     * Updates `minZoom` to the smallest zoom that still is inside of dimension of the render data.
     */
    const updateMinZoom = () => {

        const renderData = spectrogramStore.renderData;
        if (!renderData) return;
        const minZoomW = canvasDimensions.width / renderData.width;
        const minZoomH = canvasDimensions.height / renderData.height;
        minZoom = Math.max(minZoomW, minZoomH);
        if (zoom.value < minZoom) {
            zoom.value = minZoom
        }
        if (zoom.value > maxZoom) {
            zoom.value = maxZoom
        }

    }



    const canvasResizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            if (entry.target === canvasRef.value) {
                const { width, height } = entry.contentRect;
                overlayRef.value.height =height;
                overlayRef.value.width = width;
                canvasDimensions.width = width;
                canvasDimensions.height = height;

                const currentPixelCount = width * height;
                canvasScaleFactor.value = Math.min(Math.sqrt(maxPixelCount / currentPixelCount), 1);
                canvasDimensions.width = width * canvasScaleFactor.value;
                canvasDimensions.height = height * canvasScaleFactor.value;
                updateMinZoom();
                checkInternalOffsetValues();
                invalidate();
            }
        }

    })

    return {
        canvasResizeObserver
    }



}