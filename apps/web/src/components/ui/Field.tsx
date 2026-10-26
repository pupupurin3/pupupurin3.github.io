import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

interface FieldProps {
  label: string
  name: string
  error?: string
  /** Shows "n / max" under the field. */
  count?: { value: number; max: number }
}

type InputProps = FieldProps & InputHTMLAttributes<HTMLInputElement> & { multiline?: false }
type AreaProps = FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { multiline: true }

/** A labelled input or textarea with its validation message. */
export function Field({ label, error, count, multiline, ...props }: InputProps | AreaProps) {
  const id = useId()
  const errorId = `${id}-error`
  const described = error ? { 'aria-invalid': true, 'aria-describedby': errorId } : {}
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea id={id} rows={4} {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)} {...described} />
      ) : (
        <input id={id} {...(props as InputHTMLAttributes<HTMLInputElement>)} {...described} />
      )}
      {(error || count) && (
        <span className="field-foot">
          {error ? (
            <span className="field-error" id={errorId} role="alert">
              {error}
            </span>
          ) : (
            <span />
          )}
          {count && (
            <span className={`field-count ${count.value > count.max ? 'over' : ''}`}>
              {count.value} / {count.max}
            </span>
          )}
        </span>
      )}
    </div>
  )
}

/**
 * A field people never see. Bots that fill in every input fill this one too,
 * and the API quietly drops those submissions.
 */
export function Honeypot(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="hp" aria-hidden="true">
      <label>
        Website
        <input type="text" tabIndex={-1} autoComplete="off" {...props} />
      </label>
    </div>
  )
}
