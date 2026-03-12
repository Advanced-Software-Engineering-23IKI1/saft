import { updateStore, spectrogramStore } from "@/store/store"
import { clampValue, dbToLinear } from "./utils"


export function pixelToIndex(pixel) {
    return `${pixel.x},${pixel.y}`
}

export function indexToPixel(index) {
    const [x, y] = index.split(',').map(Number)
    return { x, y }
    
}


function applyUpdateToSpectrogram(update) {
    if (!spectrogramStore.renderData) return
    console.log("Applying update to spectrogram:", update)

    const { data, minDB, maxDB, maxBin } = spectrogramStore.renderData

    for (const [index, delta] of update.pixelMap.entries()) {

        const pixel = indexToPixel(index)

        const yFloatFlipped = maxBin - pixel.y;

        // no clue about the minus 1 but it works
        const yFlipped = Math.floor(yFloatFlipped)-1;

        const value = data[pixel.x][yFlipped] + delta
        const newValue = clampValue(value, dbToLinear(minDB), dbToLinear(maxDB))
        data[pixel.x][yFlipped] = newValue
    }
}


export function combinedValidUpdate() {
    const combined = createUpdate()

    for (const update of updateStore.updates) {
        if (!update.undone) {
            for (const [index, delta] of update.pixelMap.entries()) {
                addIndexDelta(combined, index, delta)
            }
        }
    }

    return combined
}

export function addUpdate(update) {
    updateStore.updates.push(update)

    if (updateStore.updates.length > updateStore.maxUpdateLength) {
        const earliestUpdate = updateStore.updates.shift()
        if (earliestUpdate && !earliestUpdate.undone) {
            applyUpdateToSpectrogram(earliestUpdate)
        }
    }

    // TODO: discard earlier undon updates that are now out of range
}

export function undoUpdate() {
    const last = [...updateStore.updates].reverse().find(u => !u.undone)
    if (last) last.undone = true
}

export function redoUpdate() {
    const firstUndone = updateStore.updates.find(u => u.undone)
    if (firstUndone) firstUndone.undone = false
}

export function clearUpdates() {
    updateStore.updates.length = 0
}

export function createUpdate() {
    return {
        pixelMap: new Map(), // Map<string, delta (linear amplitude)>
        timestamp: new Date(),
        undone: false
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