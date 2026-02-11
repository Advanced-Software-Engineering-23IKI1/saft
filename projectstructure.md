# Projektstrukturplan
hier ist der Projektstrukturplan

```mermaid
flowchart LR

    A[S.A.F.T. Arbeitspakete]

    A --> B[AP1: Audio Import & Decode]
    B --> B1[AP1.1 File Upload & Format Check - 6h]
    B --> B2[AP1.2 Audio Parsing (WebAudio) - 10h]
    B --> B3[AP1.3 Spectrogram Rendering (Canvas) - 12h]
    B --> B4[AP1.4 Parameter UI & Validation - 8h]

    A --> C[AP2: Live Audio Recording (PWA)]
    C --> C1[AP2.1 Microphone Access - 6h]
    C --> C2[AP2.2 Continuous Recording Logic - 10h]
    C --> C3[AP2.3 Live Spectrogram Rendering - 12h]
    C --> C4[AP2.4 Offline PWA Setup (Service Worker) - 14h]

    A --> D[AP3: Spectrogram Editing (Nachricht zeichnen)]
    D --> D1[AP3.1 Drawing Tools (Canvas Interaction) - 14h]
    D --> D2[AP3.2 Text Tool Integration - 10h]
    D --> D3[AP3.3 Protect Spectrogram Structure - 10h]
    D --> D4[AP3.4 Parameter-based Obfuscation - 8h]

    A --> E[AP4: Spectrogram → Audio Export]
    E --> E1[AP4.1 Reverse Spectrogram Algorithm - 14h]
    E --> E2[AP4.2 Audio Playback - 4h]
    E --> E3[AP4.3 MP3 Export - 8h]

    A --> F[AP5: Image → Audio Encoding]
    F --> F1[AP5.1 Image Upload & Format Check - 6h]
    F --> F2[AP5.2 Image → Spectrogram Mapping - 14h]
    F --> F3[AP5.3 Embed Pattern into Audio - 10h]

    A --> G[AP6: Parameter Core Engine]
    G --> G1[AP6.1 Parameter Model & Limits - 6h]
    G --> G2[AP6.2 Shared Usage Across Modules - 8h]
    G --> G3[AP6.3 Validation & Error Handling - 6h]

    A --> H[AP7: File & Device Interfaces]
    H --> H1[AP7.1 File System Access - 4h]
    H --> H2[AP7.2 Supported Format Handling - 6h]
    H --> H3[AP7.3 Permission Handling (Mic/Browser) - 4h]

    A --> I[AP8: UI / UX Layer]
    I --> I1[AP8.1 Page Structure & Routing - 8h]
    I --> I2[AP8.2 Spectrogram View UI - 10h]
    I --> I3[AP8.3 Parameter Input UI - 6h]
    I --> I4[AP8.4 Responsive Mobile UI - 8h]

    A --> J[AP9: Testing & Edge Cases]
    J --> J1[AP9.1 Large Audio Handling - 8h]
    J --> J2[AP9.2 Invalid Files / Errors - 6h]
    J --> J3[AP9.3 Cross-Browser Tests - 8h]

```
