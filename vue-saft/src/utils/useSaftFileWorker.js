import saftFileWorker from "./saftFile.worker.js?worker";
import { spectrogramStore } from "@/store/store";
import { ref, toRaw } from "vue";

let worker;

export function useSaftFileWorker() {
    if (!worker) {
        worker = new saftFileWorker();
    }

    const isLoading = ref(false);

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

    async function exportSpectrogram() {
        const renderData = spectrogramStore.renderData;
        if (!renderData) return;

        if (!renderData.phase) {
            throw new Error("No phase data available to export");
        }

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
            phase: toRaw(renderData.phase),
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
     * @param {File} file
     * @returns {Promise<{
     *   spectrogram: Array<Float32Array>,
     *   phase: Array<Float32Array>,
     *   freqBins: number,
     *   timeFrames: number,
     *   sampleRate: number,
     *   minFreq: number,
     *   maxFreq: number,
     *   windowSize: number,
     *   hopSize: number
     * }>}
     */
    async function importSpectrogram(file) {
        const buffer = await file.arrayBuffer();
        return runTask("IMPORT", buffer);
    }

    async function isSpectrogram(file) {
        const buffer = await file.arrayBuffer();
        const magic = new TextDecoder().decode(new Uint8Array(buffer, 0, 4));
        return magic === "SAFT";
    }

    return {
        exportSpectrogram,
        importSpectrogram,
        isSpectrogram,
        isLoading
    };
}