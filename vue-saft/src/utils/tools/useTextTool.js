import { Tool } from '@/enums/ToolEnum.js';
import { computeInternalPos } from '../canvasUtils';
import { getCanvasPoint } from '../canvasUtils';





export function useTextTool(canvasDimensions, canvasRef, spectrogramStore, invalidate, maxPixelCount, toolEvents, canvasOffsets, canvasScaleFactor, zoom) {
    


    toolEvents.set(Tool.Text, {

        onCanvasWheel(e) {
            e.preventDefault();
        },

        onCanvasPointerDown(e) {
            e.preventDefault();
            // const point = getCanvasPoint(e, canvasRef);
            // console.log(computeInternalPos(point, zoom.value, canvasScaleFactor.value, canvasOffsets.internalHeightOffset, canvasOffsets.internalWidthOffset));
        },

        onCanvasPointerMove(e) {
            e.preventDefault();
            // const point = getCanvasPoint(e, canvasRef);
            // console.log(computeInternalPos(point, zoom.value, canvasScaleFactor.value, canvasOffsets.internalHeightOffset, canvasOffsets.internalWidthOffset));
        },

        endPointer(e){
            e.preventDefault();
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


    