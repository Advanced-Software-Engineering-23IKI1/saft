// src/utils/useAudioRecorder.js
import { ref, onBeforeUnmount } from 'vue'

/**
 * Manage microphone recording state, recorded audio file creation,
 * and a live peak level indicator.
 *
 * @returns {{
 *   recordedFile: import('vue').Ref<File|null>,
 *   isRecording: import('vue').Ref<boolean>,
 *   recordedFileSelected: import('vue').Ref<boolean>,
 *   peakIndicator: import('vue').Ref<number>,
 *   startRecording: () => Promise<boolean>,
 *   stopRecording: () => void,
 *   toggleRecording: () => Promise<void>,
 *   clearRecording: () => void,
 * }} Reactive recorder state and control functions.
 */
export function useAudioRecorder() {
  let mediaRecorder = null
  let recordChunks = []
  let audioContext = null
  let stream = null

  const recordedFile = ref(null)
  const isRecording = ref(false)
  const recordedFileSelected = ref(false)
  const peakIndicator = ref(0)

  /**
   * Stop active media resources and reset transient recording state.
   *
   * @returns {void}
   */
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

  /**
   * Append a recorded audio chunk to the current in-memory recording.
   *
   * @param {BlobEvent} event Recorded chunk event from the MediaRecorder.
   * @returns {void}
   */
  const saveChunkToRecording = (event) => {
    recordChunks.push(event.data)
  }

  /**
   * Build a file from the recorded chunks and store it in reactive state.
   *
   * @returns {Promise<void>}
   */
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

  /**
   * Request microphone access and start recording audio input.
   *
   * @returns {Promise<boolean>} `true` if recording started successfully, otherwise `false`.
   */
  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Microphone recording is not available here. Use HTTPS or localhost.')
      return false
    }

    recordChunks = []
    recordedFile.value = null
    recordedFileSelected.value = false
    

    let recorderConstraints = {
      // remove all audio processing to get the rawest possible input for better peak level analysis
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      sampleRate: 48000,
      channelCount: 1,
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, ...recorderConstraints })
      isRecording.value = true

      audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      source.connect(analyser)

      const array = new Uint8Array(analyser.fftSize)

      /**
       * Read the current peak level from the analyser node.
       *
       * @returns {number} Peak level normalized to the range `0..1`.
       */
      function getPeakLevel() {
        analyser.getByteTimeDomainData(array)
        return array.reduce((max, current) => Math.max(max, Math.abs(current - 127)), 0) / 128
      }

      /**
       * Update the reactive peak indicator while recording is active.
       *
       * @returns {void}
       */
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

  /**
   * Stop the active recording session.
   *
   * @returns {void}
   */
  function stopRecording() {
    if (mediaRecorder && isRecording.value) {
      mediaRecorder.stop()
    }
  }

  /**
   * Toggle between starting and stopping the recorder.
   *
   * @returns {Promise<void>}
   */
  async function toggleRecording() {
    if (isRecording.value) {
      stopRecording()
    } else {
      await startRecording()
    }
  }

  /**
   * Clear the currently stored recording and reset related state.
   *
   * @returns {void}
   */
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
