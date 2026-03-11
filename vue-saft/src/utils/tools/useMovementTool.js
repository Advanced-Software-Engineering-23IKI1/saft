import { Tool } from '@/enums/ToolEnum.js';
import { distance, getMidpoint } from '@/utils/utils.js';
import { getCanvasPoint } from '@/utils/utils.js';


export function useMovementTool(canvasDimensions, canvasRef, spectrogramStore, invalidate, maxPixelCount, toolEvents, canvasOffsets, canvasScaleFactor, zoom) {


    
    let minZoom = 0.2, maxZoom = 25;

    let pointers = new Map(); // pointerId -> {x,y}
    let lastX = 0, lastY = 0;

    // Pinch state
    let pinchStartDist = 0;
    let pinchStartZoom = 1;
    let pinchStartCenterCanvas = null;
    let pinchStartCenterInternal = null;


    toolEvents.set(Tool.Scroll,
        { // movement tool

            onCanvasWheel(e) {
                e.preventDefault();

                // Ctrl+wheel => zoom
                if (e.ctrlKey) {
                    const mouseX = e.offsetX;
                    const mouseY = e.offsetY;

                    const zoomFactor = Math.exp(-e.deltaY * 0.001);

                    const oldZoom = zoom.value;
                    const newZoom = Math.max(minZoom, Math.min(maxZoom, oldZoom * zoomFactor));

                    // for stable zooming
                    const internalX = canvasOffsets.internalWidthOffset + mouseX * (1 / oldZoom) * canvasScaleFactor.value;
                    const internalY = canvasOffsets.internalHeightOffset + mouseY * (1 / oldZoom) * canvasScaleFactor.value;

                    zoom.value = newZoom;

                    const internalValuesPerPixel = (1 / zoom.value) * canvasScaleFactor.value;

                    canvasOffsets.internalWidthOffset = internalX - mouseX * internalValuesPerPixel;
                    canvasOffsets.internalHeightOffset = internalY - mouseY * internalValuesPerPixel;

                    updateMinZoom();
                    checkInternalOffsetValues();
                    invalidate();
                    return;
                }

                const dx = (e.shiftKey && e.deltaX === 0) ? e.deltaY : e.deltaX;
                const dy = (e.shiftKey && e.deltaX === 0) ? 0 : e.deltaY;

                canvasOffsets.internalWidthOffset += Math.floor(dx / 2) * (1 / zoom.value);
                canvasOffsets.internalHeightOffset += Math.floor(dy / 2) * (1 / zoom.value);

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

                    const internalValuesPerPixel = (1 / pinchStartZoom) * canvasScaleFactor.value;

                    // for stable panning and zooming
                    pinchStartCenterInternal = {
                        x: canvasOffsets.internalWidthOffset + pinchStartCenterCanvas.x * internalValuesPerPixel,
                        y: canvasOffsets.internalHeightOffset + pinchStartCenterCanvas.y * internalValuesPerPixel,
                    };
                }
            },


            onCanvasPointerMove(e) {
                if (!pointers.has(e.pointerId)) return;
                const point = getCanvasPoint(e, canvasRef);
                pointers.set(e.pointerId, point);

                const step = 1 * canvasScaleFactor.value / zoom.value;

                if (pointers.size === 1) {
                    // pan: screen px -> source px via step
                    const dx = point.x - lastX;
                    const dy = point.y - lastY;
                    lastX = point.x;
                    lastY = point.y;

                    canvasOffsets.internalWidthOffset -= dx * step;
                    canvasOffsets.internalHeightOffset -= dy * step;

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

                        const internalValuesPerPixel = (1 / zoom.value) * canvasScaleFactor.value;

                        canvasOffsets.internalWidthOffset = pinchStartCenterInternal.x - pinchStartCenterCanvas.x * internalValuesPerPixel;
                        canvasOffsets.internalHeightOffset = pinchStartCenterInternal.y - pinchStartCenterCanvas.y * internalValuesPerPixel;

                        updateMinZoom();
                        checkInternalOffsetValues();
                        invalidate();
                    }
                }

            },

            endPointer(e) {
                pointers.delete(e.pointerId);


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

        const internalValuesPerPixel = 1 / zoom.value;


        const internalWidth = canvasDimensions.width * internalValuesPerPixel;
        const internalHeight = canvasDimensions.height * internalValuesPerPixel;

        canvasOffsets.maxInternalWidthOffset = Math.max(0, spectrogramStore.renderData.width - internalWidth);
        canvasOffsets.maxInternalHeightOffset = Math.max(0, spectrogramStore.renderData.height - internalHeight);

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