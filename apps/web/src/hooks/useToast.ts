import { useCallback, useEffect, useRef, useState } from 'react'

/** A message that shows for two seconds. Showing another replaces it. */
export function useToast(duration = 2000) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const show = useCallback(
    (msg: string) => {
      setMessage(msg)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setMessage(null), duration)
    },
    [duration],
  )
  useEffect(() => () => clearTimeout(timer.current), [])
  return [message, show] as const
}

export type ShowToast = (message: string) => void
