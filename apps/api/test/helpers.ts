import { exports } from 'cloudflare:workers'

// The Worker's default export (src/index.ts), running in this same runtime.
const worker = (exports as unknown as { default: Fetcher }).default

export const ORIGIN = 'https://pupupurin3.github.io'

export interface CallOptions {
  method?: string
  body?: unknown
  /** Simulated visitor IP (the API keys visitors on it). */
  ip?: string
  headers?: Record<string, string>
}

/** Sends a request to the Worker under test. */
export async function call(path: string, { method = 'GET', body, ip = '203.0.113.1', headers = {} }: CallOptions = {}) {
  const res = await worker.fetch(
    new Request(`https://api.test${path}`, {
      method,
      headers: {
        'CF-Connecting-IP': ip,
        Origin: ORIGIN,
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  )
  const text = await res.text()
  let json: any
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = text
  }
  return { status: res.status, headers: res.headers, json }
}

export const admin = { Authorization: 'Bearer test-admin-token' }
