import { reactive } from 'vue';

export const spectrogramStore = reactive({
    renderData: null
});

export const updateStore = reactive({
  activeUpdates: [],
  inactiveUpdates: [], 
  combinedUpdate: null,
})