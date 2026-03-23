/**
 * Clamps a numeric value between a minimum and maximum decibel range.
 *
 * @param {number} value - The input value to clamp.
 * @param {number} minDB - The minimum allowed decibel value.
 * @param {number} maxDB - The maximum allowed decibel value.
 * @returns {number} The clamped value.
 */
export function clampValue(value, minDB, maxDB) {
  return Math.max(minDB, Math.min(value, maxDB));
}

/**
 * Converts a decibel value to a linear amplitude value.
 *
 * @param {number} db - The decibel value to convert.
 * @returns {number} The corresponding linear amplitude value.
 */
export function dbToLinear(db) {
  const value = Math.pow(10, db / 20);
  return value;
}

/**
 * Converts a linear amplitude value to decibels.
 *
 * @param {number} lin - The linear amplitude value to convert. Should be greater than \(0\).
 * @returns {number} The corresponding decibel value.
 */
export function linearToDb(lin) {
  let db = 20 * Math.log10(lin);
  return db;
}

/**
 * Applies a decibel offset to a linear amplitude value, then clamps
 * the result within a specified decibel range.
 *
 * @param {number} val - The input linear amplitude value.
 * @param {number} brushDB - The decibel amount to add.
 * @param {number} minDB - The minimum allowed decibel value after adjustment.
 * @param {number} maxDB - The maximum allowed decibel value after adjustment.
 * @returns {number} The adjusted linear amplitude value.
 */
export function addDBtoLinear(val, brushDB, minDB, maxDB) {
  const minAmp = 1e-8;
  val = Math.max(val, minAmp);

  let db = linearToDb(val);
  db += brushDB;
  db = clampValue(db, minDB, maxDB);
  val = dbToLinear(db);
  return val;
}
