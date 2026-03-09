// src/utils/useAudioRecorder.js
import { ref, onBeforeUnmount } from 'vue'

export function useAudioRecorder() {
  let mediaRecorder = null
  let recordChunks = []
  let audioContext = null
  let stream = null

  const recordedFile = ref(null)
  const isRecording = ref(false)
  const recordedFileSelected = ref(false)
  const peakIndicator = ref(0)

  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      stream = null
    }

    if (audioContext) {
      audioContext.close()
      audioContext = null
    }

    isRecording.value = false
    peakIndicator.value = 0
  }

  const saveChunkToRecording = (event) => {
    recordChunks.push(event.data)
  }

  const saveRecording = async () => {
    if (!recordChunks.length) {
      recordedFile.value = null
      recordedFileSelected.value = false
      return
    }

    const nowStr = Date.now()
    const fileName = `saft-recording-${nowStr}.wav`

    const blob = new Blob(recordChunks, { type: 'audio/wav' })
    const file = new File([blob], fileName, { type: 'audio/wav' })

    recordedFile.value = file
    recordedFileSelected.value = true
    recordChunks = []
  }

  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Microphone recording is not available here. Use HTTPS or localhost.')
      return false
    }

    recordChunks = []
    recordedFile.value = null
    recordedFileSelected.value = false

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      isRecording.value = true

      audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      source.connect(analyser)

      const array = new Uint8Array(analyser.fftSize)

      function getPeakLevel() {
        analyser.getByteTimeDomainData(array)
        return array.reduce((max, current) => Math.max(max, Math.abs(current - 127)), 0) / 128
      }

      function tick() {
        if (isRecording.value) {
          peakIndicator.value = getPeakLevel() * 100
          requestAnimationFrame(tick)
        } else {
          peakIndicator.value = 0
        }
      }

      tick()

      mediaRecorder = new MediaRecorder(stream)
      mediaRecorder.ondataavailable = saveChunkToRecording
      mediaRecorder.onstop = async () => {
        await saveRecording()
        cleanup()
      }
      mediaRecorder.start()

      return true
    } catch (error) {
      console.error('Error starting the record: ', error)
      alert(error?.message || 'Microphone access failed')
      cleanup()
      return false
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording.value) {
      mediaRecorder.stop()
    }
  }

  async function toggleRecording() {
    if (isRecording.value) {
      stopRecording()
    } else {
      await startRecording()
    }
  }

  function clearRecording() {
    recordedFile.value = null
    recordedFileSelected.value = false
    peakIndicator.value = 0
    recordChunks = []
  }

  onBeforeUnmount(() => {
    if (isRecording.value && mediaRecorder) {
      mediaRecorder.stop()
    }
    cleanup()
  })

  return {
    recordedFile,
    isRecording,
    recordedFileSelected,
    peakIndicator,
    startRecording,
    stopRecording,
    toggleRecording,
    clearRecording,
  }
}
