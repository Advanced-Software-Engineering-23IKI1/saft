# Import

````mermaid
sequenceDiagram
  autonumber
  actor User
  participant Canvas as CanvasComponent
  participant Spec as SpectrogramService
  participant FFT as FFTService

  User->>Canvas: Provide audio + start
  Canvas->>Spec: Analyze(audio, settings)

  Spec->>Spec: Validate inputs
  alt Invalid
    Spec-->>Canvas: Error
  else Valid
    loop Sliding windows
      Spec->>FFT: Transform(window)
      FFT-->>Spec: Spectrum
      Spec->>Spec: Accumulate magnitudes
    end

    Spec-->>Canvas: Spectrogram result
    Canvas->>Spec: BuildRenderModel(spectrogram, viewRange)
    Spec-->>Canvas: RenderModel
  end

````