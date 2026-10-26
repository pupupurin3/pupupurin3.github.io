import { useState, type ChangeEvent, type FormEvent } from 'react'
import { z } from 'zod'
import { ApiError } from '../lib/api'

type Status = 'idle' | 'sending' | 'sent' | 'error'

/**
 * State for a small form backed by the API. Fields are validated with the
 * same zod schema the API uses before anything is sent, and the API's own
 * field errors (if any slip through) land in the same place.
 */
export function useApiForm<S extends z.ZodObject>(schema: S, initial: Record<keyof z.input<S> & string, string>, send: (data: z.output<S>) => Promise<unknown>) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const field = (name: keyof typeof initial & string) => ({
    name,
    value: values[name],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((v) => ({ ...v, [name]: e.target.value }))
      if (errors[name]) setErrors(({ [name]: _, ...rest }) => rest)
    },
  })

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      setErrors(firstErrors(z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>))
      return
    }
    setStatus('sending')
    setMessage('')
    try {
      await send(parsed.data)
      setStatus('sent')
      setValues(initial)
    } catch (err) {
      setStatus('error')
      if (err instanceof ApiError) {
        setErrors(firstErrors(err.fieldErrors))
        setMessage(err.message)
      } else setMessage('Something went wrong. Please try again.')
    }
  }

  return { field, errors, status, message, onSubmit, reset: () => setStatus('idle') }
}

const firstErrors = (all: Record<string, string[] | undefined>) =>
  Object.fromEntries(Object.entries(all).flatMap(([k, v]) => (v?.[0] ? [[k, v[0]]] : [])))
