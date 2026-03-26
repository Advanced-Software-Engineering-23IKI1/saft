
import { reactive, ref } from 'vue';
import { useMovementTool } from './tools/useMovementTool';
import { useDrawingTool } from './tools/useDrawingTool';
import { computeInternalPos } from './canvasUtils';



export function useCanvasTools(canvasDimensions, canvasRef, overlayRef, spectrogramStore, invalidate, maxPixelCount) {

    const toolEvents = new Map(); // toolId -> { onCanvasWheel, onCanvasPointerDown, onCanvasPointerMove, onCanvasPointerUp, onCanvasPointerCancel, onCanvasPointerLeave }


    const canvasOffsets = reactive({
        internalWidthOffset: 0,
        internalHeightOffset: Math.max(0, spectrogramStore.renderData.height),
        maxInternalHeightOffset: Math.max(0, spectrogramStore.renderData.height),
        maxInternalWidthOffset: 1,
    })
    const canvasScaleFactor = ref(1);
    const zoom = ref(1);



    const { canvasResizeObserver } = useMovementTool(
        canvasDimensions, canvasRef, overlayRef, spectrogramStore,
        invalidate, maxPixelCount,
        toolEvents, canvasOffsets, canvasScaleFactor, zoom);


    useDrawingTool(
        canvasDimensions, canvasRef, overlayRef, spectrogramStore,
        invalidate, maxPixelCount,
        toolEvents, canvasOffsets, canvasScaleFactor, zoom);


    return {
        zoom,
        canvasOffsets,
        canvasResizeObserver,
        toolEvents
    }
}