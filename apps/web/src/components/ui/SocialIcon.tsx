import { siGithub } from 'simple-icons'

export type Social = 'github' | 'linkedin'

const LABELS: Record<Social, string> = { github: 'GitHub', linkedin: 'LinkedIn' }

/** GitHub or LinkedIn mark, drawn in the current text colour. */
export function SocialIcon({ name, size = 20 }: { name: Social; size?: number }) {
  return (
    <svg className="social-icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      {name === 'github' ? (
        <path d={siGithub.path} fill="currentColor" />
      ) : (
        // simple-icons no longer ships LinkedIn, so this is a plain "in" tile.
        <g fill="currentColor">
          <path d="M3.5 1h17A2.5 2.5 0 0 1 23 3.5v17a2.5 2.5 0 0 1-2.5 2.5h-17A2.5 2.5 0 0 1 1 20.5v-17A2.5 2.5 0 0 1 3.5 1Z" />
          <g fill="var(--bg, #fff)">
            <circle cx="7" cy="7" r="1.9" />
            <rect x="5.3" y="9.6" width="3.4" height="9.6" rx="0.4" />
            <path d="M10.6 9.6h3.2v1.4c.6-1 1.8-1.7 3.3-1.7 2.6 0 3.6 1.6 3.6 4.4v5.5h-3.4v-4.9c0-1.4-.4-2.2-1.6-2.2-1.3 0-1.8.9-1.8 2.3v4.8h-3.3Z" />
          </g>
        </g>
      )}
    </svg>
  )
}

/** Round icon-only link to a profile. */
export function SocialLink({ name, href }: { name: Social; href: string }) {
  return (
    <a className="btn icon-btn" href={href} target="_blank" rel="noreferrer" aria-label={LABELS[name]} title={LABELS[name]}>
      <SocialIcon name={name} />
    </a>
  )
}
