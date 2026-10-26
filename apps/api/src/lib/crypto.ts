const encoder = new TextEncoder()

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Compares two secrets in constant time, so timing reveals nothing about either. */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  // Hashing first gives equal-length inputs, which timingSafeEqual requires.
  const [ha, hb] = await Promise.all([a, b].map((s) => crypto.subtle.digest('SHA-256', encoder.encode(s))))
  return crypto.subtle.timingSafeEqual(ha!, hb!)
}
