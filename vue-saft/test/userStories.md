# Getestete user Stories


## 1. US11: Audio zu Spektrogramm Umwandlung (Audiodateien entschlüsseln)

**Anforderung:** Feld-Agent*innen müssen Audiodateien in Echtzeit in Spektrogramme umwandeln können, um geheime Nachrichten zu entschlüsseln.

**Beschreibung:** Der Fast Fourier Transform (FFT) konvertiert Audiosignale aus dem Zeitbereich in den Frequenzbereich. Dies ist essentiell für:
- Darstellung von Audiodaten in einem Spektrogramm
- Erkennung versteckter visueller Informationen
- Parameterbasierte Entschlüsselung

**Test File:** `fft.spec.js`

### Test Coverage & Input Values

Die FFT-Tests decken folgende Eingabeszenarien ab:

| Test-Kategorie | Eingabewerte | Testfall | Erwartetes Ergebnis |
|---|---|---|---|
| **Basis-Funktionalität** | `[1, 0, 1, 0]` | Einfaches Eingabesignal | FFT mit realen und imaginären Komponenten |
| **DC-Komponente** | `[1, 1, 1, 1]` (Konstantes Signal) | DC-Signal (Gleichspannungskomponente) | Realteil[0] ≈ 4, Imaginärteil[0] ≈ 0 |
| **Impuls (Dirac Delta)** | `[1, 0, 0, 0]` | Impulsantwort | Alle Frequenzkomponenten ≈ 1 |
| **Große Eingaben** | 16-Element Array | Power-of-2 Größe (typisch für Audio) | Output Länge = 16 |
| **Fehlertoleranz** | `[1, NaN, Infinity, -Infinity]` | Non-finite Werte | Robuste Behandlung ohne Crash |
| **Sinusförmiges Signal** | `[sin(0), sin(1), ..., sin(15)]` | Realistisches Audiosignal | Korrekte Frequenzanalyse |

### Bedingungen & Grenzen (aus Anforderungen)

- Unterstützte Audioformate: .wav, .mp3 (FFT ist formatunabhängig)
- Maximale Länge: bis 5 Minuten Audio
- Parameter im gültigen Wertebereich (Frequenzen, Fenstertyp)
- Keine beschädigten/korrupten Eingabedaten

### Ausführung der FFT-Tests

```bash
# Nur FFT-Tests ausführen
npm run test -- fft.spec.js

# Mit Coverage-Bericht
npm run test -- fft.spec.js --coverage
```

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

