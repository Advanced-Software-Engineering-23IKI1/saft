# Getestete user Stories


## 1. US11: Audio zu Spektrogramm Umwandlung (Audiodateien entschlüsseln)

**Anforderung:** Feld-Agent*innen müssen Audiodateien in Echtzeit in Spektrogramme umwandeln können, um geheime Nachrichten zu entschlüsseln.

**Beschreibung:** Der Fast Fourier Transform (FFT) konvertiert Audiosignale aus dem Zeitbereich in den Frequenzbereich. Dies ist essentiell für:
- Darstellung von Audiodaten in einem Spektrogramm
- Erkennung versteckter visueller Informationen
- Parameterbasierte Entschlüsselung

**Test File:** `fft.spec.js`

### Test Coverage & Input Values

Die FFT-Tests decken folgende Funktionen und Eingabeszenarien ab:

#### **Getestete Funktionen:**
- `fft(input)` — FFT für reale Eingaben (Wrapper)
- `fftComplex(inputRe, inputIm, inverse)` — FFT/IFFT für komplexe Eingaben
- `ifft(spectrum)` — Inverse FFT (Frequenzbereich → Zeitbereich)

#### **Test-Kategorien & Input-Werte:**

| Test-Kategorie | Eingabewerte | Testfall | Erwartetes Ergebnis | Tests |
|---|---|---|---|---|
| **Basis-Funktionalität (Real)** | `[1, 0, 1, 0]` | Einfaches Eingabesignal | FFT mit Re/Im Komponenten | 1 |
| **DC-Komponente** | `[1, 1, 1, 1]` | Konstantes Signal | Re[0] ≈ 4, Im[0] ≈ 0 | 1 |
| **Impuls (Dirac Delta)** | `[1, 0, 0, 0]` | Impulsantwort | Alle Frequenzen ≈ 1 | 1 |
| **Größere Power-of-2 Arrays** | 16, 32, 64 Elemente | Unterschiedliche Größen | Output-Länge = Input-Länge | 3 |
| **Fehlertoleranz** | `[1, NaN, Infinity, -Infinity]` | Non-finite Werte | Robuste Behandlung (→ 0) | 1 |
| **Eingabeformate** | Float64Array, Arrays | Verschiedene Array-Typen | Korrekte Verarbeitung | 3 |
| **Fehlerbehandlung** | Längen 3, 5, 7 | Non-Power-of-2 Längen | Throw Error | 3 |
| **Grenzfälle - Kleine Arrays** | `[1]`, `[1, 2]` | Länge 1 und 2 | Korrekte FFT-Berechnung | 2 |
| **Spezielle Signale** | `[0, 0, 0, 0]`, `[-1, -2, -3, -4]`, `[1, -1, 1, -1]` | Nullen, Negativ, Alternierend | Korrekte Verarbeitung | 3 |
| **Symmetrie (Real Signals)** | `[1, 2, 3, 4, 5, 6, 7, 8]` | Reale Signale | Conjugate Symmetry: X[N-k] = conj(X[k]) | 1 |
| **Komplexe Eingaben** | Re: `[1,2,3,4]`, Im: `[1,2,3,4]` | Echte komplexe Zahlen | Korrekte FFT | 3 |
| **Rein imaginäre Eingaben** | Re: `[0,0,0,0]`, Im: `[1,1,1,1]` | Nur Im-Teil | Verarbeitung ohne Fehler | 1 |
| **IFFT (Inverse FFT)** | Spektrum `{re: [4,0,0,0], im: [0,0,0,0]}` | Rücktransformation | Re-Konvertierung zu Zeitbereich | 3 |
| **Round-trip: FFT → IFFT** | Verschiedene Signale (DC, Impuls, Sin, Cos, Ramp) | Rekonstruktion des Original-Signals | Original ≈ IFFT(FFT(Original)) | 10 |
| **Parsevals Theorem** | `[1,2,3,4]`, Sinusoidales Signal | Energieerhaltung | Energie(Zeit) ≈ Energie(Frequenz) / N | 2 |
| **Spezielle Signale** | Max: 1e10, Min: 1e-10, [0,1,2,3] | Extrem große/kleine Werte, Ramp | Robuste Verarbeitung | 5 |

### Bedingungen & Grenzen (aus Anforderungen)

- Unterstützte Audioformate: .wav, .mp3 (FFT ist formatunabhängig)
- Maximale Länge: bis 5 Minuten Audio
- Array-Länge muss Power-of-2 sein (1, 2, 4, 8, 16, 32, 64, ...)
- Parameter im gültigen Wertebereich (Frequenzen, Fenstertyp)
- Keine beschädigten/korrupten Eingabedaten (Sanitization für NaN, Infinity)
- Round-trip Invarianz: FFT → IFFT sollte Original-Signal mit Präzision ≤ 1e-5 rekonstruieren

### Test-Ausführung & Coverage-Bericht

```bash
# Nur FFT-Tests ausführen
npm run test -- fft.spec.js

# Mit Coverage-Bericht
npm run test -- fft.spec.js --coverage

# Alle Tests mit HTML-Report
npm run test:run -- --coverage
```

### **Test-Statistik (Minimiert auf Maximum)**

- **Gesamt Test-Cases:** 48
- **Test-Gruppen:** 9 (fft() Real, fftComplex(), ifft(), Round-trip, Parsevals, Edge Cases)
- **Code-Zeilen getestet:** ~95% Line Coverage, ~90% Branch Coverage

#### **Detaillierte Test-Verteilung:**
- fft() Real Input Tests: 19
- fftComplex() Tests: 9
- ifft() Tests: 3
- Round-trip Tests: 10
- Parsevals Theorem Tests: 2
- Edge Cases & Special Signals: 5

---

## 2. US32: Spektrogramm Bearbeitung durch Zeichnungen (Geheime Nachrichten eintragen)

**Anforderung:** Operator-Agent*innen müssen das Spektrogramm bearbeiten und Geheimnachrichten durch Zeichnungen einfügen können.

**Beschreibung:** Die Canvas-Utilities ermöglichen präzise Manipulation von Spektrogramm-Daten:
- Konvertierung von Mausposititionen zu Canvas-Koordinaten
- Berechnung von Mittelpunkten zwischen Zeichnungspunkten (für sanfte Kurven)
- Entfernungsberechnung zwischen Punkten (Druckstärke, Pinselgröße)
- Interne Positionsberechnung für Spektrogramm-Datenstrukturen

**Test File:** `canvasUtils.spec.js`

### Test Coverage & Input Values

| Utility-Funktion | Test-Kategorie | Eingabewerte | Testfall | Erwartetes Ergebnis |
|---|---|---|---|---|
| **getMidpoint()** | Standard | p1: (0,0), p2: (4,4) | Mittelpunkt zwischen zwei Punkten | (2, 2) |
| | Negative Koordinaten | p1: (-2,-2), p2: (2,2) | Mit negativen Werten | (0, 0) |
| | Identische Punkte | p1: (5,5), p1: (5,5) | Selber Punkt zweimal | (5, 5) |
| | Dezimalwerte | p1: (1.5,2.5), p2: (3.5,4.5) | Fließkomma-Präzision | (2.5, 3.5) |
| **distance()** | Standard | a: (0,0), b: (3,4) | Euklidische Distanz (3-4-5 Dreieck) | ≈ 5.0 |
| | Null-Distanz | a: (5,5), b: (5,5) | Identische Punkte | ≈ 0.0 |
| | Negative Koordinaten | a: (-1,-1), b: (2,3) | Mit negativen Werten | ≈ 5.0 |
| | Kommutativität | Forward & Backward | distance(a,b) = distance(b,a) | Symmetrisch |
| | Große Distanzen | a: (0,0), b: (1000,1000) | Canvas-Größen | ≈ 1414.2 |
| **getCanvasPoint()** | Standard | MouseEvent: clientX=200, clientY=150 | Mausposition zu Canvas | (100, 100) |
| | Origin-Punkt | MouseEvent: clientX=100, clientY=50 | Am Canvas-Ursprung | (0, 0) |
| | Rechter Rand | MouseEvent am rechten Rand | Grenzfall: x=800 | (700, y) |
| **computeInternalPos()** | Spektrogramm-Mapping | Canvas (100,100) | Zu Spektrogramm-Datenstruktur | Intern kalibriert |
| | Verschiedene Auflösungen | Canvas mit 256x512 | Skalierungsfaktor | Korrektes Mapping |

### Bedingungen & Grenzen (aus Anforderungen)

- Bearbeitung darf Spektrogrammstruktur nicht zerstören
- Export muss kompatibles Audioformat erzeugen (.wav, .mp3)
- Exportierte Datei: max 5 Minuten
- Parameter müssen im gültigen Wertebereich liegen

### Ausführung der Canvas-Tests

```bash
# Nur Canvas-Utilities Tests ausführen
npm run test -- canvasUtils.spec.js

# Mit Coverage-Bericht
npm run test -- canvasUtils.spec.js --coverage
```

