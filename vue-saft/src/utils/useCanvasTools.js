
import { reactive, ref } from 'vue';
import { useMovementTool } from './tools/useMovementTool';
import { useDrawingTool } from './tools/useDrawingTool';
import { useTextTool } from './tools/useTextTool';
import { useImageTool } from './tools/useImageTool';



export function useCanvasTools(canvasDimensions, canvasRef, spectrogramStore, invalidate, maxPixelCount) {

    const toolEvents = new Map(); // toolId -> { onCanvasWheel, onCanvasPointerDown, onCanvasPointerMove, onCanvasPointerUp, onCanvasPointerCancel, onCanvasPointerLeave }


    const canvasOffsets = reactive({
        internalWidthOffset: 0,
        internalHeightOffset: 0,
        maxInternalHeightOffset: 1,
        maxInternalWidthOffset: 1,
    })
    const canvasScaleFactor = ref(1);
    const zoom = ref(1);



    const { canvasResizeObserver } = useMovementTool(
        canvasDimensions, canvasRef, spectrogramStore,
        invalidate, maxPixelCount,
        toolEvents, canvasOffsets, canvasScaleFactor, zoom);


    useDrawingTool(
        canvasDimensions, canvasRef, spectrogramStore,
        invalidate, maxPixelCount,
        toolEvents, canvasOffsets, canvasScaleFactor, zoom);

    useTextTool(
        canvasDimensions, canvasRef, spectrogramStore,
        invalidate, maxPixelCount,
        toolEvents, canvasOffsets, canvasScaleFactor, zoom);

    useImageTool(
        canvasDimensions, canvasRef, spectrogramStore,
        invalidate, maxPixelCount,
        toolEvents, canvasOffsets, canvasScaleFactor, zoom);
    


    return {
        zoom,
        canvasOffsets,
        canvasResizeObserver,
        toolEvents
    }
}