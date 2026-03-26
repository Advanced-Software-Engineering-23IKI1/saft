import pako from "pako";

const MAGIC = "SAFT";
const MAGIC_SIZE = 4;
const HEADER_SIZE = 48;

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === "EXPORT") {
    exportSpectrogram(payload);
  }

  if (type === "IMPORT") {
    importSpectrogram(payload);
  }
};

/**
 * Serializes magnitude + phase spectrogram matrices and metadata into SAFT,
 * compresses both matrices with gzip, and posts the file parts back.
 *
 * @param {{
 *   data: ArrayLike<ArrayLike<number>>,
 *   phase: ArrayLike<ArrayLike<number>>,
 *   meta: {
 *     freqBins: number,
 *     timeFrames: number,
 *     sampleRate: number,
 *     minFreq: number,
 *     maxFreq: number,
 *     windowSize: number,
 *     hopSize: number
 *   }
 * }} payload
 */
function exportSpectrogram(payload) {
  const { data, phase, meta } = payload;

  if (!data?.length || !phase?.length) {
    self.postMessage({ type: "ERROR", payload: "Missing spectrogram or phase data" });
    return;
  }

  const rows = data.length;
  const cols = data[0]?.length ?? 0;

  if (!cols) {
    self.postMessage({ type: "ERROR", payload: "Spectrogram has no columns" });
    return;
  }

  if (phase.length !== rows) {
    self.postMessage({ type: "ERROR", payload: "Phase row count does not match spectrogram row count" });
    return;
  }

  const flatMag = new Float32Array(rows * cols);
  const flatPhase = new Float32Array(rows * cols);

  let index = 0;
  for (let i = 0; i < rows; i++) {
    if (data[i].length !== cols || phase[i].length !== cols) {
      self.postMessage({ type: "ERROR", payload: `Inconsistent row length at row ${i}` });
      return;
    }

    flatMag.set(data[i], index);
    flatPhase.set(phase[i], index);
    index += cols;
  }

  const compressedMag = pako.gzip(new Uint8Array(flatMag.buffer));
  const compressedPhase = pako.gzip(new Uint8Array(flatPhase.buffer));
  const magic = new TextEncoder().encode(MAGIC);

  const headerBuffer = new ArrayBuffer(HEADER_SIZE);
  const view = new DataView(headerBuffer);

  let o = 0;
  view.setUint32(o, rows, true); o += 4;
  view.setUint32(o, cols, true); o += 4;
  view.setUint32(o, meta.freqBins, true); o += 4;
  view.setUint32(o, meta.timeFrames, true); o += 4;
  view.setUint32(o, meta.sampleRate, true); o += 4;
  view.setUint32(o, meta.minFreq, true); o += 4;
  view.setUint32(o, meta.maxFreq, true); o += 4;
  view.setUint32(o, meta.windowSize, true); o += 4;
  view.setUint32(o, meta.hopSize, true); o += 4;
  view.setUint32(o, compressedMag.byteLength, true); o += 4;
  view.setUint32(o, compressedPhase.byteLength, true); o += 4;
  view.setUint32(o, 0, true); o += 4; // reserved for future use

  self.postMessage({
    type: "EXPORT_DONE",
    payload: {
      blobParts: [magic, headerBuffer, compressedMag, compressedPhase]
    }
  });
}

/**
 * Reads a SAFT file from an ArrayBuffer, validates header, decompresses
 * magnitude and phase data, rebuilds the matrices, and posts the parsed result.
 *
 * @param {ArrayBuffer} payload
 */
function importSpectrogram(payload) {
  const buffer = payload;

  if (!(buffer instanceof ArrayBuffer)) {
    self.postMessage({ type: "ERROR", payload: "Invalid payload: expected ArrayBuffer" });
    return;
  }

  if (buffer.byteLength < MAGIC_SIZE + HEADER_SIZE) {
    self.postMessage({ type: "ERROR", payload: "Invalid SAFT file: file too small" });
    return;
  }

  let offset = 0;

  const magic = new TextDecoder().decode(new Uint8Array(buffer, offset, MAGIC_SIZE));
  offset += MAGIC_SIZE;

  if (magic !== MAGIC) {
    self.postMessage({ type: "ERROR", payload: "Invalid file format" });
    return;
  }

  const view = new DataView(buffer, offset, HEADER_SIZE);

  let o = 0;
  const rows = view.getUint32(o, true); o += 4;
  const cols = view.getUint32(o, true); o += 4;

  const meta = {};
  meta.freqBins = view.getUint32(o, true); o += 4;
  meta.timeFrames = view.getUint32(o, true); o += 4;
  meta.sampleRate = view.getUint32(o, true); o += 4;
  meta.minFreq = view.getUint32(o, true); o += 4;
  meta.maxFreq = view.getUint32(o, true); o += 4;
  meta.windowSize = view.getUint32(o, true); o += 4;
  meta.hopSize = view.getUint32(o, true); o += 4;

  const magByteLength = view.getUint32(o, true); o += 4;
  const phaseByteLength = view.getUint32(o, true); o += 4;
  const reserved = view.getUint32(o, true); o += 4;

  offset += HEADER_SIZE;

  if (!rows || !cols) {
    self.postMessage({ type: "ERROR", payload: "Invalid SAFT file: rows/cols must be > 0" });
    return;
  }

  if (offset + magByteLength + phaseByteLength > buffer.byteLength) {
    self.postMessage({ type: "ERROR", payload: "Invalid SAFT file: truncated compressed data" });
    return;
  }

  const magCompressed = new Uint8Array(buffer, offset, magByteLength);
  offset += magByteLength;

  const phaseCompressed = new Uint8Array(buffer, offset, phaseByteLength);

  let magBytes;
  let phaseBytes;

  try {
    magBytes = pako.ungzip(magCompressed);
    phaseBytes = pako.ungzip(phaseCompressed);
  } catch {
    self.postMessage({ type: "ERROR", payload: "Invalid SAFT file: decompression failed" });
    return;
  }

  if (magBytes.byteLength % 4 !== 0 || phaseBytes.byteLength % 4 !== 0) {
    self.postMessage({ type: "ERROR", payload: "Invalid SAFT file: decompressed data is not Float32-aligned" });
    return;
  }

  const magFloatData = new Float32Array(
    magBytes.buffer,
    magBytes.byteOffset,
    magBytes.byteLength / 4
  );

  const phaseFloatData = new Float32Array(
    phaseBytes.buffer,
    phaseBytes.byteOffset,
    phaseBytes.byteLength / 4
  );

  const expectedLength = rows * cols;
  if (magFloatData.length !== expectedLength || phaseFloatData.length !== expectedLength) {
    self.postMessage({ type: "ERROR", payload: "Invalid SAFT file: unexpected matrix data length" });
    return;
  }

  const spectrogram = [];
  const phase = [];

  for (let i = 0; i < rows; i++) {
    spectrogram.push(magFloatData.slice(i * cols, (i + 1) * cols));
    phase.push(phaseFloatData.slice(i * cols, (i + 1) * cols));
  }

  self.postMessage({
    type: "IMPORT_DONE",
    payload: {
      spectrogram,
      phase,
      ...meta
    }
  });
}