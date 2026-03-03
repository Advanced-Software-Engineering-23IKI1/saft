// Kapselt sessionStorage/localStorage, damit später nicht überall Strings/JSON geparsed werden müssen

export function loadJSON(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function saveJSON(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value))
}

export function remove(key) {
  sessionStorage.removeItem(key)
}
