import { updateStore, spectrogramStore } from "@/store/store"
import { clampValue, dbToLinear } from "./utils"


    export function pixelToIndex(pixel) {
        return (pixel.x << 16) ^ (pixel.y & 0xffff)
    }

    export function indexToPixel(index) {
        return {
            x: index >> 16,
            y: index & 0xffff
        }
    }

    export function pixelToFlatIndex(pixel, width) {
        return pixel.y * width + pixel.x
    }
    export function flatIndexToPixel(flatIndex, width) {
        return {
            x: flatIndex % width,
            y: Math.floor(flatIndex / width)
        }
    }


export function applyCombinedUpdateToSpectrogram() {
    if (!spectrogramStore.renderData) return


    const { data, minDB, maxDB, maxBin, width } = spectrogramStore.renderData
    const update = updateStore.combinedUpdate

    if (!update) return

    for (let index = 0; index < update.length; index++) {
        const delta = update[index]
        if (delta === 0) continue

        const pixel = flatIndexToPixel(index, width)
        const yFloatFlipped = maxBin - pixel.y;

        // no clue about the minus 1 but it works
        const yFlipped = Math.floor(yFloatFlipped)-1;

        const value = data[pixel.x][yFlipped] + delta
        const newValue = clampValue(value, dbToLinear(minDB), dbToLinear(maxDB))
        data[pixel.x][yFlipped] = newValue
    }

    clearUpdates()
}

export function computeCombinedUpdate() {
    if(!spectrogramStore.renderData){return}
    
    const { width, height } = spectrogramStore.renderData
    const combinedDeltaArray = new Float32Array(width * height);
    for (const update of updateStore.activeUpdates) {
        for (const [index, delta] of update.pixelMap.entries()) {
            let pixel = indexToPixel(index)
            const flatIndex = pixelToFlatIndex(pixel, width)
            combinedDeltaArray[flatIndex] +=delta
        }
    }

    updateStore.combinedUpdate = combinedDeltaArray
}

export function addUpdate(update) {
    updateStore.activeUpdates.push(update)
    updateStore.inactiveUpdates.length = 0 // clear redo stack
    computeCombinedUpdate()
}




export function undoUpdate() {
    const lastUpdate = updateStore.activeUpdates.pop()
    if (lastUpdate) {
        updateStore.inactiveUpdates.push(lastUpdate)
        computeCombinedUpdate()

    }
}

export function redoUpdate() {
    const lastUndone = updateStore.inactiveUpdates.pop()
    if (lastUndone) {
        updateStore.activeUpdates.push(lastUndone)
        computeCombinedUpdate()
    }
}


export function clearUpdates() {
    updateStore.combinedUpdate = null
    updateStore.activeUpdates.length = 0
    updateStore.inactiveUpdates.length = 0
}


export function createUpdate() {
    return {
        pixelMap: new Map(), // Map<string, delta (linear amplitude)>
        timestamp: new Date(),
        }
}

export function addIndexDelta(update, index, delta) {
    const existingDelta = update.pixelMap.get(index) || 0
    update.pixelMap.set(index, existingDelta + delta)
}

export function addPixelDelta(update, pixel, delta) {
    const index = pixelToIndex(pixel)
    const existingDelta = update.pixelMap.get(index) || 0
    update.pixelMap.set(index, existingDelta + delta)
}

export function getPixelDelta(update, pixel) {
    const index = pixelToIndex(pixel)
    return update.pixelMap.get(index) || 0
}
