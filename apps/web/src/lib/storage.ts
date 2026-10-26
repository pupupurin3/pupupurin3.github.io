// localStorage throws in some private modes and sandboxed frames; these
// wrappers turn that into "nothing stored".

export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage unavailable: the value just isn't remembered.
  }
}
