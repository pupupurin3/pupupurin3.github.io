import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { admin, call } from './helpers'

const message = { name: 'Recruiter', email: 'hi@studio.example', message: 'We would love to talk about an internship.' }

describe('contact', () => {
  it('stores a message for the admin inbox', async () => {
    const res = await call('/v1/contact', { method: 'POST', body: message })
    expect(res.status).toBe(202)
    expect(res.json).toEqual({ status: 'received' })

    const inbox = await call('/v1/admin/messages', { headers: admin })
    expect(inbox.json).toEqual({
      messages: [{ id: expect.any(Number), ...message, createdAt: expect.any(String) }],
      nextCursor: null,
    })
  })

  it('validates the email address', async () => {
    const res = await call('/v1/contact', { method: 'POST', body: { ...message, email: 'not-an-email' } })
    expect(res.status).toBe(400)
    expect(res.json.errors.email).toEqual(['Enter a valid email address'])
  })

  it('never stores honeypot submissions', async () => {
    await call('/v1/contact', { method: 'POST', body: { ...message, website: 'x' } })
    const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM contact_messages').first<{ n: number }>()
    expect(row!.n).toBe(0)
  })

  it('does not store raw IP addresses', async () => {
    await call('/v1/contact', { method: 'POST', body: message, ip: '203.0.113.99' })
    const row = await env.DB.prepare('SELECT visitor_hash FROM contact_messages').first<{ visitor_hash: string }>()
    expect(row!.visitor_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(row!.visitor_hash).not.toContain('203.0.113.99')
  })
})
