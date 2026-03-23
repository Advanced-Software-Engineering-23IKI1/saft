import pako from "pako";

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === "EXPORT") {
    exportSpectrogram(payload);
  }

  if (type === "IMPORT") {
    importSpectrogram(payload)
  }
};

/**
 * Serializes a spectrogram matrix and its metadata into the SAFT binary format,
 * compresses the sample data with gzip, and posts the generated file parts back
 * to the main thread.
 *
 * The posted message has type `EXPORT_DONE` and contains `blobParts` that can be
 * used to construct a downloadable `Blob` on the main thread.
 *
 * @param {ExportSpectrogramPayload} payload - Spectrogram data and metadata to export.
 * @returns {void}
 */
function exportSpectrogram(payload) {
  const { data, meta } = payload;

  const rows = data.length;
  const cols = data[0].length;

  const flat = new Float32Array(rows * cols);
  let index = 0;

  for (let i = 0; i < rows; i++) {
    flat.set(data[i], index);
    index += cols;
  }

  const header = new Uint32Array([
    rows, cols,
    meta.freqBins,
    meta.timeFrames,
    meta.sampleRate,
    meta.minFreq,
    meta.maxFreq,
    meta.windowSize,
    meta.hopSize
  ]);

  const compressed = pako.gzip(new Uint8Array(flat.buffer));
  const magic = new TextEncoder().encode("SAFT");

  self.postMessage({
    type: "EXPORT_DONE",
    payload: {
      blobParts: [magic, header.buffer, compressed]
    }
  });
}


/**
 * Reads a SAFT file from an `ArrayBuffer`, validates its header, decompresses
 * the stored spectrogram data, rebuilds the two-dimensional matrix, and posts
 * the parsed result back to the main thread.
 *
 * If the file does not start with the `SAFT` magic header, the worker posts an
 * `ERROR` message instead.
 *
 * @param {ArrayBuffer} payload - Raw contents of a SAFT file.
 * @returns {void}
 */
function importSpectrogram(payload) {
  const buffer = payload;

  let offset = 0;

  const magic = new TextDecoder().decode(
    new Uint8Array(buffer, offset, 4)
  );
  offset += 4;

  if (magic !== "SAFT") {
    self.postMessage({ type: "ERROR", payload: "Invalid file format" });
    return;
  }

  const header = new Uint32Array(buffer, offset, 9);

  const rows = header[0];
  const cols = header[1];

  const meta = {
    freqBins: header[2],
    timeFrames: header[3],
    sampleRate: header[4],
    minFreq: header[5],
    maxFreq: header[6],
    windowSize: header[7],
    hopSize: header[8],
  };

  offset += 36;

  let dataBytes = new Uint8Array(buffer, offset);
  dataBytes = pako.ungzip(dataBytes);

  const floatData = new Float32Array(dataBytes.buffer);

  const result = [];
  for (let i = 0; i < rows; i++) {
    result.push(floatData.slice(i * cols, (i + 1) * cols));
  }

  self.postMessage({
    type: "IMPORT_DONE",
    payload: { spectrogram: result, ...meta }
  });
}



