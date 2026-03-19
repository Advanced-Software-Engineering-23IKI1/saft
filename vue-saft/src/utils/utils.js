
export function clampValue(value, minDB, maxDB) {
    return Math.max(minDB, Math.min(value, maxDB))
}



export function dbToLinear(db, strength = 0.5) {
  const value = Math.pow(10, db / 20) * strength;
  return db < 0 ? -value : value;
}