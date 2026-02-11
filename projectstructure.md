# Projektstrukturplan
hier ist der Projektstrukturplan

```mermaid
flowchart LR

    A[SAFT Work Packages]

    A --> B[AP1 Audio Import and Decode]
    B --> B1[AP1.1 File Upload Format Check 6h]
    B --> B2[AP1.2 Audio Parsing WebAudio 10h]
    B --> B3[AP1.3 Spectrogram Rendering Canvas 12h]
    B --> B4[AP1.4 Parameter UI Validation 8h]

    A --> C[AP2 Live Audio Recording PWA]
    C --> C1[AP2.1 Microphone Access 6h]
    C --> C2[AP2.2 Continuous Recording Logic 10h]
    C --> C3[AP2.3 Live Spectrogram Rendering 12h]
    C --> C4[AP2.4 Offline PWA Service Worker 14h]

    A --> D[AP3 Spectrogram Editing]
    D --> D1[AP3.1 Drawing Tools Canvas 14h]
    D --> D2[AP3.2 Text Tool Integration 10h]
    D --> D3[AP3.3 Protect Spectrogram Structure 10h]
    D --> D4[AP3.4 Parameter Obfuscation 8h]

    A --> E[AP4 Spectrogram to Audio Export]
    E --> E1[AP4.1 Reverse Spectrogram Algorithm 14h]
    E --> E2[AP4.2 Audio Playback 4h]
    E --> E3[AP4.3 MP3 Export 8h]

    A --> F[AP5 Image to Audio Encoding]
    F --> F1[AP5.1 Image Upload Format Check 6h]
    F --> F2[AP5.2 Image to Spectrogram Mapping 14h]
    F --> F3[AP5.3 Embed Pattern into Audio 10h]

    A --> H[AP6 File and Device Interfaces]
    H --> H1[AP6.1 File System Access 4h]
    H --> H2[AP6.2 Supported Format Handling 6h]
    H --> H3[AP6.3 Permission Handling Browser Mic 4h]

    A --> I[AP7 UI UX Layer]
    I --> I1[AP7.1 Page Structure Routing 8h]
    I --> I2[AP7.2 Spectrogram View UI 10h]
    I --> I3[AP7.3 Parameter Input UI 6h]
    I --> I4[AP7.4 Responsive Mobile UI 8h]

    A --> J[AP8 Testing Edge Cases]
    J --> J1[AP8.1 Large Audio Handling 8h]
    J --> J2[AP8.2 Invalid Files Errors 6h]
    J --> J3[AP8.3 Cross Browser Tests 8h]
```
