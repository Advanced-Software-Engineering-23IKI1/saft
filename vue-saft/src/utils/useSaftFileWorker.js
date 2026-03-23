import saftFileWorker from "./saftFile.worker.js?worker";
import { spectrogramStore } from "@/store/store";
import { ref, toRaw } from "vue";



let worker;

export function useSaftFileWorker() {
    if (!worker) {
        worker = new saftFileWorker();
    }

const isLoading = ref(false);


/**
 * Sends a task to the spectrogram worker and waits for the matching response.
 *
 * The worker is expected to reply with either:
 * - `ERROR`, which rejects the promise with the error payload, or
 * - `${type}_DONE`, which resolves the promise with the result payload.
 *
 * @param {string} type - The worker task name, for example `EXPORT` or `IMPORT`.
 * @param {*} payload - The data sent to the worker for processing.
 * @returns {Promise<*>} A promise that resolves with the worker result payload
 * and rejects with the worker error payload.
 */
    const runTask = (type, payload) => {
        return new Promise((resolve, reject) => {
            isLoading.value = true;

            const handler = (e) => {
                const { type: responseType, payload } = e.data;

                if (responseType === "ERROR") {
                    worker.removeEventListener("message", handler);
                    isLoading.value = false;
                    reject(payload);
                    return;
                }

                if (responseType === `${type}_DONE`) {
                    worker.removeEventListener("message", handler);
                    isLoading.value = false;
                    resolve(payload);
                }
            };

            worker.addEventListener("message", handler);
            worker.postMessage({ type, payload });
        });
    };



    /**
     * Exports the currently loaded spectrogram from the store into a compressed
     * binary \(.saft\) file and triggers a browser download.
     *
     * The file contains a magic header, spectrogram dimensions, rendering metadata,
     * and gzipped \(Float32\) spectrogram data.
     *
     * @returns {void}
     */
    async function exportSpectrogram() {
        const renderData = spectrogramStore.renderData;
        if (!renderData) return;

        const meta = {
            freqBins: renderData.freqBins,
            timeFrames: renderData.timeFrames,
            sampleRate: renderData.sampleRate,
            minFreq: renderData.minFreq,
            maxFreq: renderData.maxFreq,
            windowSize: renderData.windowSize,
            hopSize: renderData.hopSize,
        };

        const payload = {
            data: toRaw(renderData.data),
            meta,
        };

        const result = await runTask("EXPORT", payload);

        const blob = new Blob(result.blobParts, {
            type: "application/octet-stream",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "export.saft";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }


    /**
     * Imports a compressed \(.saft\) spectrogram file, validates its header,
     * decompresses the stored data, and reconstructs the spectrogram matrix
     * together with its associated metadata.
     *
     * @param {File} file - The spectrogram file to import.
     * @returns {Promise<{ spectrogram: Array<Float32Array>, freqBins: number, timeFrames: number, sampleRate: number, minFreq: number, maxFreq: number, windowSize: number, hopSize: number }>}
     * Imported spectrogram data and metadata extracted from the file.
     */
    async function importSpectrogram(file) {
        const buffer = await file.arrayBuffer();
        return runTask("IMPORT", buffer)
    }


    return {
        exportSpectrogram,
        importSpectrogram,
        isLoading
    };
}

