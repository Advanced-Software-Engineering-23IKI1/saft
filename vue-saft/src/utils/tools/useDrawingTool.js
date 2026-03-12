import { Tool } from '@/enums/ToolEnum.js';
import { computeInternalPos } from '../canvasUtils';
import { getCanvasPoint } from '../canvasUtils';





export function useDrawingTool(canvasDimensions, canvasRef, spectrogramStore, invalidate, maxPixelCount, toolEvents, canvasOffsets, canvasScaleFactor, zoom) {
    


    toolEvents.set(Tool.Brush, {

        onCanvasWheel(e) {
            // do nothing, prevent default zooming
            // or resize brush
            e.preventDefault();
        },

        onCanvasPointerDown(e) {
            e.preventDefault();
            // const point = getCanvasPoint(e, canvasRef);
            // console.log(computeInternalPos(point, zoom.value, canvasScaleFactor.value, canvasOffsets.internalHeightOffset, canvasOffsets.internalWidthOffset));
            // start drawing left click add amplitude, right click remove amplitude
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


    