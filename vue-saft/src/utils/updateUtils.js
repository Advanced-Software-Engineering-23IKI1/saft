import { updateStore, spectrogramStore } from "@/store/store"

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
    const { data, maxBin, width, minDB, maxDB } = spectrogramStore.renderData

    const update = updateStore.combinedUpdate

    if (!update) return

    for (let index = 0; index < update.length; index++) {
        let newVal = update[index]
        if (Number.isNaN(newVal)) {
            continue
        }

        const pixel = flatIndexToPixel(index, width)
        const yFloatFlipped = maxBin - pixel.y;

        const yFlipped = Math.floor(yFloatFlipped) - 1;

        data[pixel.x][yFlipped] = newVal
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

    const size = width * height
    let combinedUpdateArray = updateStore.combinedUpdate
    if (!(combinedUpdateArray instanceof Float32Array)||combinedUpdateArray.length !== size){
        combinedUpdateArray = new Float32Array(size)
    }
    combinedUpdateArray.fill(NaN)


    for (const update of updateStore.activeUpdates) {
        for (const [index, newVal] of update.pixelMap.entries()) {
            let pixel = indexToPixel(index)
            const flatIndex = pixelToFlatIndex(pixel, width)
            combinedUpdateArray[flatIndex] = newVal
        }
    }

    updateStore.combinedUpdate = combinedUpdateArray
}

/**
 * Add an update to the active update stack and clear the redo history.
 *
 * @param {{pixelMap: Map<number, number>, timestamp: Date}} update Update object to add.
 * @returns {void}
 */
export function addUpdate(update) {
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
    }
    computeCombinedUpdate()

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
    }
    computeCombinedUpdate()

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
 * Stores a linear pixel value in the update map for a given pixel.
 *
 * @param {{ pixelMap: Map<number, number> }} update - Update object containing the pixel map.
 * @param {{ x: number, y: number }} pixel - Pixel coordinate to update.
 * @param {number} valueLinear - Linear amplitude value to store.
 * @returns {void}
 */
export function addPixelValue(update, pixel, valueLinear) {
    const index = pixelToIndex(pixel);
    update.pixelMap.set(index, valueLinear);
}