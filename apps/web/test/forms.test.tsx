import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The API client reads VITE_API_URL at import time.
vi.stubEnv('VITE_API_URL', 'https://api.test')
const { ContactForm } = await import('../src/components/contact/ContactForm')

describe('ContactForm', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('checks fields with the shared schema before sending anything', async () => {
    render(<ContactForm />)
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email')
    await userEvent.click(screen.getByRole('button', { name: 'Send message' }))
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts a valid message and thanks the visitor', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ status: 'received' }), { status: 202 }))
    render(<ContactForm />)
    await userEvent.type(screen.getByLabelText('Name'), 'Ana')
    await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com')
    await userEvent.type(screen.getByLabelText('Message'), 'Hello! Loved the shelf.')
    await userEvent.click(screen.getByRole('button', { name: 'Send message' }))
    expect(await screen.findByText('Message sent')).toBeInTheDocument()
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.test/v1/contact')
    expect(JSON.parse(init.body)).toEqual({ name: 'Ana', email: 'ana@example.com', message: 'Hello! Loved the shelf.', website: '' })
  })

  it('shows the API’s error when the request is refused', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ type: 'about:blank', title: 'Too Many Requests', status: 429, detail: 'Slow down a little.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    )
    render(<ContactForm />)
    await userEvent.type(screen.getByLabelText('Name'), 'Ana')
    await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com')
    await userEvent.type(screen.getByLabelText('Message'), 'Hello! Loved the shelf.')
    await userEvent.click(screen.getByRole('button', { name: 'Send message' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Slow down a little.'))
  })
})
