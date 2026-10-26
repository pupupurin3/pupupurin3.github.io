import { ContactInput, LIMITS } from '@portfolio/shared'
import { useApiForm } from '../../hooks/useApiForm'
import { api } from '../../lib/api'
import { Field, Honeypot } from '../ui/Field'

export function ContactForm() {
  const form = useApiForm(ContactInput, { name: '', email: '', message: '', website: '' }, api.contact)

  if (form.status === 'sent') {
    return (
      <div className="form-card form-done" role="status">
        <h3>Message sent</h3>
        <p>Thanks for reaching out. I&rsquo;ll get back to you soon.</p>
        <button className="btn" onClick={form.reset}>
          Send another
        </button>
      </div>
    )
  }

  const message = form.field('message')
  return (
    <form className="form-card" onSubmit={form.onSubmit} noValidate>
      <h3>Send a message</h3>
      <div className="form-row">
        <Field label="Name" autoComplete="name" maxLength={LIMITS.name} error={form.errors.name} {...form.field('name')} />
        <Field label="Email" type="email" autoComplete="email" error={form.errors.email} {...form.field('email')} />
      </div>
      <Field
        label="Message"
        multiline
        error={form.errors.message}
        count={{ value: message.value.length, max: LIMITS.contactMessage }}
        {...message}
      />
      <Honeypot {...form.field('website')} />
      {form.status === 'error' && !Object.keys(form.errors).length && (
        <p className="form-error" role="alert">
          {form.message}
        </p>
      )}
      <button className="btn primary" type="submit" disabled={form.status === 'sending'}>
        {form.status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
