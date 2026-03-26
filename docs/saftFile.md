# SAFT File Format Specification

The **SAFT** file format is a compact binary format used to store spectrogram magnitude data, phase data, and metadata.

---

## Overview

A `.saft` file consists of four parts:

1. **Magic Header** (4 bytes)
2. **Metadata Header** (fixed-size binary block)
3. **Compressed Magnitude Data**
4. **Compressed Phase Data**

---

## File Structure

```text
+-------------------+-------------------+---------------------------+---------------------------+
| Magic Header (4B) | Metadata (48B)    | Magnitude Data (variable) | Phase Data (variable)     |
+-------------------+-------------------+---------------------------+---------------------------+
```

---

## 1. Magic Header

- **Size:** 4 bytes
- **Value:** `"SAFT"` (ASCII)

Used to validate that the file is a valid SAFT file.

---

## 2. Metadata Header

- **Size:** 48 bytes (12 × 4 bytes)
- **Encoding:** `DataView` with little-endian `Uint32` fields

### Fields

| Index | Name | Description |
|---:|---|---|
| 0 | rows | Number of time frames |
| 1 | cols | Number of frequency bins |
| 2 | freqBins | Number of frequency bins |
| 3 | timeFrames | Number of time frames |
| 4 | sampleRate | Audio sample rate (Hz) |
| 5 | minFreq | Minimum frequency (Hz) |
| 6 | maxFreq | Maximum frequency (Hz) |
| 7 | windowSize | FFT window size |
| 8 | hopSize | Hop size between frames |
| 9 | magByteLength | Byte length of compressed magnitude block |
| 10 | phaseByteLength | Byte length of compressed phase block |
| 11 | reserved | Reserved for future use, currently `0` |

---

## 3. Magnitude Data

- **Format:** Flattened 2D array
- **Type:** `Float32Array`
- **Encoding:** Gzip-compressed

## 4. Phase Data

- **Format:** Flattened 2D array
- **Type:** `Float32Array`
- **Encoding:** Gzip-compressed

### Layout

Both matrices are stored row-by-row in `[time][frequency]` order:

```text
[row0_col0, row0_col1, ..., row0_colN,
 row1_col0, row1_col1, ..., row1_colN,
 ...]
```

## Notes

- Every SAFT file contains both magnitude and phase data.
- Compression uses gzip.
- Header integers are stored explicitly as little-endian 32-bit unsigned integers.