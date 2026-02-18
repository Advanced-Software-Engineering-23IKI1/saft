// Modul für den “App-Zustand” (z.B. ob etwas hochgeladen wurde).

import { loadJSON, saveJSON, remove } from '@/utils/storage'

const KEY = 'saft.state.v1'

let state = loadJSON(KEY, {
  hasUpload: false,
  hasExport: false,
})

export function getState() {
  return state
}

export function setHasUpload(value) {
  state.hasUpload = Boolean(value)
  if (!state.hasUpload) state.hasExport = false
  saveJSON(KEY, state)
}

export function setHasExport(value) {
  state.hasExport = Boolean(value)
  saveJSON(KEY, state)
}

export function resetState() {
  state = { hasUpload: false, hasExport: false }
  remove(KEY)
}
