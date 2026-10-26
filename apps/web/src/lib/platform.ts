/** The modifier key label for shortcuts: ⌘ on Apple devices, Ctrl elsewhere. */
export const modKey = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'

/** True while focus is in a text field, where single-key shortcuts must not fire. */
export const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)

export const isModalOpen = () => !!document.querySelector('[aria-modal="true"]')

/** Copies text, resolving to whether it worked. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
