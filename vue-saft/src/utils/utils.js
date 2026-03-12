
export function clampValue(value, minDB, maxDB) {
    return Math.max(minDB, Math.min(value, maxDB))
}



export function dbToLinear(db) {
    return Math.pow(10, db / 20);
}