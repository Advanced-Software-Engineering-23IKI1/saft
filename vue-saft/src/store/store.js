import { reactive } from 'vue';

export const spectrogramStore = reactive({
    spectrogram: null,
    renderData: null
});

export const updateStore = reactive({
  updates: [],
  maxUpdateLength: 4
})