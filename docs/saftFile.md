
# SAFT File Format Specification

The **SAFT** file format is a compact binary format used to store spectrogram data along with its metadata.

---

## Overview

A `.saft` file consists of three main parts:

1. **Magic Header** (4 bytes)
2. **Metadata Header** (fixed-size binary block)
3. **Compressed Spectrogram Data** (gzip-compressed Float32 array)

---

## File Structure

```

+----------------------+----------------------+---------------------------+
| Magic Header (4B)    | Metadata (36B)       | Compressed Data (variable)|
+----------------------+----------------------+---------------------------+

```

---

## 1. Magic Header

- **Size:** 4 bytes  
- **Value:** `"SAFT"` (ASCII)

Used to validate that the file is a valid SAFT file.

---

## 2. Metadata Header

- **Size:** 36 bytes (9 × 4 bytes)
- **Type:** `Uint32Array`

### Fields (in order):

| Index | Name         | Description                          |
|------:|--------------|--------------------------------------|
| 0     | rows         | Number of frequency rows             |
| 1     | cols         | Number of time columns               |
| 2     | freqBins     | Number of frequency bins             |
| 3     | timeFrames   | Number of time frames                |
| 4     | sampleRate   | Audio sample rate (Hz)               |
| 5     | minFreq      | Minimum frequency (Hz)               |
| 6     | maxFreq      | Maximum frequency (Hz)               |
| 7     | windowSize   | FFT window size                      |
| 8     | hopSize      | Hop size between frames              |

> ⚠️ Note: Although stored as `Uint32`, some fields (e.g. frequencies) may conceptually represent continuous values.

---

## 3. Spectrogram Data

- **Format:** Flattened 2D array
- **Type:** `Float32Array`
- **Encoding:** Gzip-compressed

### Layout

The spectrogram is stored row-by-row:

```

[row0_col0, row0_col1, ..., row0_colN,
row1_col0, row1_col1, ..., row1_colN,
...
]

```

## Notes & Limitations

- No versioning is currently included in the format
- Metadata is fixed-size and must match exactly
- Compression uses gzip (via libraries like `pako`)
- Endianness depends on the platform (`Uint32Array` / `Float32Array`)

---

## File Extension

```

.saft

```