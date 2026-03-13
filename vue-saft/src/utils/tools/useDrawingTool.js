import { Tool } from '@/enums/ToolEnum.js';
import { computeInternalPos } from '../canvasUtils';
import { getCanvasPoint } from '../canvasUtils';
import { addPixelDelta, addUpdate, createUpdate } from '../updateUtils';
import { dbToLinear } from '../utils';





export function useDrawingTool(canvasDimensions, canvasRef, spectrogramStore, invalidate, maxPixelCount, toolEvents, canvasOffsets, canvasScaleFactor, zoom) {
    


    toolEvents.set(Tool.Brush, {

        onCanvasWheel(e) {
            // do nothing, prevent default zooming
            // or resize brush
            e.preventDefault();
        },

        onCanvasPointerDown(e) {
            e.preventDefault();
            const point = getCanvasPoint(e, canvasRef);
            const internalPos = computeInternalPos(point, zoom.value, canvasScaleFactor.value, canvasOffsets.internalHeightOffset, canvasOffsets.internalWidthOffset)
            const update = createUpdate()
            addPixelDelta(update, { x: Math.floor(internalPos.x), y: Math.floor(internalPos.y) }, dbToLinear(-6))
            // start drawing left click add amplitude, right click remove amplitude
            addUpdate(update);
            invalidate();
           
        },

        onCanvasPointerMove(e) {
            e.preventDefault();
            // const point = getCanvasPoint(e, canvasRef);
            // console.log(computeInternalPos(point, zoom.value, canvasScaleFactor.value, canvasOffsets.internalHeightOffset, canvasOffsets.internalWidthOffset));            // continue drawing
        },

        endPointer(e){
            e.preventDefault();
            // finish drawing
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


    