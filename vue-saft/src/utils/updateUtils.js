import { updateStore, spectrogramStore } from "@/store/store"
import { clampValue, dbToLinear } from "./utils"

/**
 * Convert a pixel coordinate into a compact integer key.
 *
 * @param {{x: number, y: number}} pixel Pixel coordinate.
 * @returns {number} Encoded integer index for the pixel.
 */
export function pixelToIndex(pixel) {
    return (pixel.x << 16) ^ (pixel.y & 0xffff)
}

/**
 * Convert an encoded integer key back into a pixel coordinate.
 *
 * @param {number} index Encoded pixel index.
 * @returns {{x: number, y: number}} Decoded pixel coordinate.
 */
export function indexToPixel(index) {
    return {
        x: index >> 16,
        y: index & 0xffff
    }
}

/**
 * Convert a 2D pixel coordinate into a flat array index.
 *
 * @param {{x: number, y: number}} pixel Pixel coordinate.
 * @param {number} width Width of the 2D grid.
 * @returns {number} Flat array index for the pixel.
 */
export function pixelToFlatIndex(pixel, width) {
    return pixel.y * width + pixel.x
}

/**
 * Convert a flat array index back into a 2D pixel coordinate.
 *
 * @param {number} flatIndex Flat array index.
 * @param {number} width Width of the 2D grid.
 * @returns {{x: number, y: number}} Pixel coordinate for the flat index.
 */
export function flatIndexToPixel(flatIndex, width) {
    return {
        x: flatIndex % width,
        y: Math.floor(flatIndex / width)
    }
}

/**
 * Apply the currently combined update to the spectrogram render data.
 *
 * @returns {void}
 */
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
        const yFlipped = Math.floor(yFloatFlipped) - 1;

        const value = data[pixel.x][yFlipped] + delta
        const newValue = clampValue(value, dbToLinear(minDB), dbToLinear(maxDB))
        data[pixel.x][yFlipped] = newValue
    }

    clearUpdates()
}

/**
 * Recompute the combined update array from all active updates.
 *
 * @returns {void}
 */
export function computeCombinedUpdate() {
    if (!spectrogramStore.renderData) { return }

    const { width, height } = spectrogramStore.renderData
    const combinedDeltaArray = new Float32Array(width * height);

    for (const update of updateStore.activeUpdates) {
        for (const [index, delta] of update.pixelMap.entries()) {
            let pixel = indexToPixel(index)
            const flatIndex = pixelToFlatIndex(pixel, width)
            combinedDeltaArray[flatIndex] += delta
        }
    }

    updateStore.combinedUpdate = combinedDeltaArray
}

/**
 * Add an update to the active update stack and clear the redo history.
 *
 * @param {{pixelMap: Map<number, number>, timestamp: Date}} update Update object to add.
 * @returns {void}
 */
export function addUpdateClearRedo(update) {
    updateStore.activeUpdates.push(update)
    updateStore.inactiveUpdates.length = 0 // clear redo stack
    computeCombinedUpdate()
}

/**
 * Remove and return the most recent active update.
 *
 * @returns {{pixelMap: Map<number, number>, timestamp: Date}} The popped update, or a new update if none exist.
 */
export function popActiveUpdate() {
    let update = updateStore.activeUpdates.pop() || createUpdate()
    return update
}

/**
 * Undo the most recent active update and move it to the redo stack.
 *
 * @returns {void}
 */
export function undoUpdate() {
    const lastUpdate = updateStore.activeUpdates.pop()
    if (lastUpdate) {
        updateStore.inactiveUpdates.push(lastUpdate)
        computeCombinedUpdate()
    }
}

/**
 * Reapply the most recently undone update.
 *
 * @returns {void}
 */
export function redoUpdate() {
    const lastUndone = updateStore.inactiveUpdates.pop()
    if (lastUndone) {
        updateStore.activeUpdates.push(lastUndone)
        computeCombinedUpdate()
    }
}

/**
 * Clear all active, combined, and redo updates.
 *
 * @returns {void}
 */
export function clearUpdates() {
    updateStore.combinedUpdate = null
    updateStore.activeUpdates.length = 0
    updateStore.inactiveUpdates.length = 0
}

/**
 * Create a new empty update object.
 *
 * @returns {{pixelMap: Map<number, number>, timestamp: Date}} Newly created update.
 */
export function createUpdate() {
    return {
        pixelMap: new Map(), // Map<string, delta (linear amplitude)>
        timestamp: new Date(),
    }
}

/**
 * Add a delta value to an update using an encoded pixel index.
 *
 * @param {{pixelMap: Map<number, number>, timestamp: Date}} update Target update object.
 * @param {number} index Encoded pixel index.
 * @param {number} delta Delta value to add.
 * @returns {void}
 */
export function addIndexDelta(update, index, delta) {
    const existingDelta = update.pixelMap.get(index) || 0
    update.pixelMap.set(index, existingDelta + delta)
}

/**
 * Add a dB-based delta value to an update using a pixel coordinate.
 *
 * @param {{pixelMap: Map<number, number>, timestamp: Date}} update Target update object.
 * @param {{x: number, y: number}} pixel Pixel coordinate.
 * @param {number} deltaDB Delta value in dB.
 * @returns {void}
 */
export function addPixelDelta(update, pixel, deltaDB) {
    const index = pixelToIndex(pixel)
    const existingDelta = update.pixelMap.get(index) || 0
    update.pixelMap.set(index, existingDelta + dbToLinear(deltaDB))
}

/**
 * Get the stored delta value for a pixel in a given update.
 *
 * @param {{pixelMap: Map<number, number>, timestamp: Date}} update Source update object.
 * @param {{x: number, y: number}} pixel Pixel coordinate.
 * @returns {number} Delta value for the pixel, or `0` if none exists.
 */
export function getPixelDelta(update, pixel) {
    const index = pixelToIndex(pixel)
    return update.pixelMap.get(index) || 0
}
