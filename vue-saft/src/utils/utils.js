
export function clampValue(value, minDB, maxDB) {
  return Math.max(minDB, Math.min(value, maxDB))
}



export function dbToLinear(db) {
  const value = Math.pow(10, db / 20);
  return value;
}

export function linearToDb(lin) {
  let db = 20 * Math.log10(lin);
  return db;
}